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
  /^crm\/v3\/objects\/tickets\/batch\/read$/,        // ticket follow-up (hs_lastcontacted)
  /^crm\/v4\/associations\/deals\/tickets\/batch\/read$/, // deal → ticket links
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

  // Diagnostic: live-test the token against HubSpot, server-side (no browser cache).
  // Reports token SHAPE only (prefix + length), never the value.
  if (subPath === "_diag") {
    const out = { tokenPrefix: token.slice(0, 8), tokenLength: token.length, looksLikePat: token.startsWith("pat-") };
    try {
      const r = await fetch("https://api.hubapi.com/crm/v3/pipelines/deals", {
        headers: { "Authorization": "Bearer " + token },
      });
      out.hubspotPipelinesStatus = r.status;
    } catch (e) { out.hubspotPipelinesStatus = "fetch-failed: " + ((e && e.message) || e); }

    // 1) Real stages of the Design pipeline (confirm IDs + order).
    try {
      const rp = await fetch("https://api.hubapi.com/crm/v3/pipelines/deals/4855431", {
        headers: { "Authorization": "Bearer " + token },
      });
      const jp = await rp.json();
      out.designStages = (jp.stages || [])
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map(s => ({ id: s.id, label: s.label, order: s.displayOrder }));
    } catch (e) { out.designStagesError = String((e && e.message) || e); }

    // 2) On a real deal currently in "Design Sent" (15610786), test both timestamp
    //    naming variants for the candidate stage IDs to see which actually carries data.
    try {
      const ids = ["15610785", "51980918", "15610786", "15610787"];
      const props = ["dealstage", "createdate"];
      ids.forEach(id => { props.push("hs_date_entered_" + id, "hs_v2_date_entered_" + id); });
      const rd = await fetch(
        "https://api.hubapi.com/crm/v3/objects/deals/61625429352?properties=" + props.join(","),
        { headers: { "Authorization": "Bearer " + token } });
      out.dealReadStatus = rd.status;
      const jd = await rd.json();
      // report only the timestamp property NAMES that came back populated (no values/PII)
      const p = jd.properties || {};
      out.populatedTimestampProps = Object.keys(p).filter(k => /date_entered/.test(k) && p[k]);
    } catch (e) { out.dealReadError = String((e && e.message) || e); }

    return json(out, 200);
  }

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
