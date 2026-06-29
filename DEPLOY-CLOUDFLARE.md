# Deploying to Cloudflare Pages

This puts the dashboard on a real URL **and** keeps your HubSpot token off the
browser. The token lives only as a Cloudflare secret; the browser talks to a
small server-side proxy (`functions/api/[[path]].js`) that adds it.

```
Browser ──/api/...──▶ Cloudflare Pages Function ──Bearer token──▶ api.hubapi.com
         (no token)      (HUBSPOT_TOKEN secret)
```

## What's in the repo

| File | Purpose |
|---|---|
| `sales-design-dashboard.html` | the dashboard (calls `/api/...` in proxy mode) |
| `functions/api/[[path]].js` | proxy to HubSpot; injects the token; allow-lists endpoints |
| `_redirects` | serves the dashboard at the site root `/` |

The dashboard ships with `PROXY_BASE = "/api"`, so no code change is needed.

---

## Step 1 — Create a HubSpot Private App token

1. HubSpot → **Settings → Integrations → Private Apps → Create a private app**.
2. On **Scopes**, add (read-only is enough):
   - `crm.objects.deals.read`
   - `crm.schemas.deals.read`  *(needed for the pipelines/stages endpoint)*
3. Create it and copy the token (starts with `pat-...`). You'll paste it into
   Cloudflare in Step 3 — **not** into the HTML file.

## Step 2 — Create the Pages project (Git integration, recommended)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the repo **`jayrayhill/sales-design-dashboard`** and the branch
   `claude/hubspot-pipeline-dashboard-pud4oe` (or `main` after you merge).
3. Build settings — this is a static site with no build step:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `/`
4. **Save and Deploy.** You'll get a URL like
   `https://sales-design-dashboard.pages.dev`.

## Step 3 — Add the token as a secret

1. In the Pages project → **Settings → Environment variables**.
2. Add a variable named **`HUBSPOT_TOKEN`**, paste your `pat-...` token, and
   click **Encrypt** (so it's stored as a secret).
3. Add it to **Production** (and **Preview** if you want preview deploys to work).
4. **Redeploy** (Deployments → ⋯ → Retry deployment) so the secret is picked up.

That's it — open your `*.pages.dev` URL and it loads your real deals. The
"Pipeline" dropdown will list your actual HubSpot pipelines; confirm the sales
design one and the charts fill in.

---

## Alternative — deploy from the CLI with Wrangler

```bash
npm i -g wrangler
wrangler login

# from the repo root:
wrangler pages deploy . --project-name sales-design-dashboard

# set the secret (do this once):
wrangler pages secret put HUBSPOT_TOKEN --project-name sales-design-dashboard
# paste the pat-... token when prompted, then redeploy:
wrangler pages deploy . --project-name sales-design-dashboard
```

## Custom domain (optional)

Pages project → **Custom domains → Set up a domain** → enter e.g.
`pipeline.yourdomain.com`. If the domain's DNS is already on Cloudflare it's a
one-click CNAME; otherwise follow the prompts.

---

## Tuning after it's live

All knobs are constants at the top of `sales-design-dashboard.html`:

- `GOALS` — target days-to-approval and approval rate (benchmark lines).
- `FOLLOWUP_DAYS` — silence before a deal is "follow-up overdue" (default 2).
- `COLD_AFTER_DAYS` — in-stage age before a deal is flagged "cold" (default 30).
- `GRAVEYARD_AFTER_DAYS` — age at which a deal leaves the active view (default 365).

## Troubleshooting

- **Dropdown says "demo data" on the live site** → the `HUBSPOT_TOKEN` secret
  isn't set, or you didn't redeploy after adding it.
- **Pipelines list 403s** → add the `crm.schemas.deals.read` scope to the
  Private App, regenerate if needed, and update the secret.
- **Root URL 404s** → make sure `_redirects` is deployed (build output dir `/`).
- **A property comes back empty** (e.g. `hs_last_activity_date`) → that just
  means it isn't populated on those deals; the follow-up logic falls back to
  time-in-stage automatically.
