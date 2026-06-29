/**
 * Cloudflare Pages Function — HubSpot proxy.
 *
 * Handles every request to /api/* and forwards it to the HubSpot CRM API,
 * adding the Private App token from a server-side secret (env.HUBSPOT_TOKEN).
 * The token is never sent to the browser, and because the browser only ever
 * talks to its own origin, there are no CORS issues.
 *
 * Example: the dashboard calls  GET /api/crm/v3/pipelines/deals
 *          → this forwards to   GET https://api.hubapi.com/crm/v3/pipelines/deals
 *
 * Set the secret once with either:
 *   - Cloudflare dashboard → Pages project → Settings → Environment variables
 *     → add HUBSPOT_TOKEN (mark it "Encrypt"), or
 *   - wrangler:  npx wrangler pages secret put HUBSPOT_TOKEN
 */

const HUBSPOT_ORIGIN = "https://api.hubapi.com";

// Only allow the read endpoints this dashboard actually uses, so the proxy
// can't be abused as an open relay to the rest of your HubSpot account.
const ALLOWED = [
  /^crm\/v3\/pipelines\/deals(\/.*)?$/,
  /^crm\/v3\/objects\/deals\/search$/,
  /^crm\/v3\/objects\/deals(\/.*)?$/,
];

export async function onRequest(context) {
  const { request, env, params } = context;

  // Trim defensively — a trailing newline/space from the paste corrupts the Bearer header.
  const token = (env.HUBSPOT_TOKEN || "").trim();
  if (!token) {
    const keys = Object.keys(env || {});
    const hasName = keys.includes("HUBSPOT_TOKEN");
    return json({
      error: "HUBSPOT_TOKEN not usable. namePresent=" + hasName +
        (hasName ? " (present but empty/whitespace)" : "") +
        " · env keys seen: [" + keys.join(", ") + "]",
    }, 500);
  }

  // params.path is the catch-all after /api/ (array of segments)
  const segments = Array.isArray(params.path) ? params.path : (params.path ? [params.path] : []);
  const subPath = segments.join("/");

  if (!ALLOWED.some((re) => re.test(subPath))) {
    return json({ error: "Endpoint not allowed by proxy: " + subPath }, 403);
  }

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = new URL(request.url);
  const target = HUBSPOT_ORIGIN + "/" + subPath + url.search;

  const init = {
    method: request.method,
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
    },
  };
  if (request.method === "POST") {
    init.body = await request.text();
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch (e) {
    return json({ error: "Upstream fetch failed: " + (e && e.message) }, 502);
  }

  // Pass the HubSpot response straight back to the browser.
  const body = await upstream.text();
  if (!upstream.ok) {
    // Surface the upstream error in the Pages function logs for debugging.
    console.log("HubSpot " + request.method + " /" + subPath + " → " + upstream.status + ": " + body.slice(0, 500));
  }
  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
