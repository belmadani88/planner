# Deployment guide (Cloudflare Pages)

Zero-budget, static-first. Everything below fits in free tiers (limits verified October 2026 — re-check [Cloudflare's pricing](https://developers.cloudflare.com/pages/platform/pricing/) before launch).

## Option A — Deploy from GitHub (recommended)

1. **Push to GitHub**
   ```bash
   git init && git add -A && git commit -m "WebThangs Operations Planner"
   git remote add origin https://github.com/<you>/webthangs-operations-planner.git
   git push -u origin main
   ```

2. **Create the Pages project**
   - Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
   - Select the repository.
   - Build settings:
     - Framework preset: **None**
     - Build command: `npm run build`
     - Build output directory: `dist`
   - Save and deploy. The first build runs without the API key — that’s fine (the app works in deterministic mode).

3. **Add environment variables**
   - Project → **Settings** → **Variables and Secrets** → **Add**:
     - `GEMINI_API_KEY` → **Encrypt** (type: Secret). Value: your key from [Google AI Studio](https://aistudio.google.com/apikey).
     - `GEMINI_MODEL` = `gemini-3.8-flash` (plaintext; verified against the official model list, Oct 2026)
     - `GEMINI_FALLBACK_MODELS` = `gemini-flash-latest,gemini-3.6-flash` (plaintext)
     - `AI_ENABLED` = `on` (plaintext)
     - `CONTACT_EMAIL` = your agency inbox (plaintext) — **required before launch**: without it the site displays no contact address anywhere (by design) and the Privacy Policy says a launch blocker is present.
     - `LEAD_WEBHOOK_URL` = (optional) server-side notification webhook for consultation requests (plaintext)
   - Redeploy (Deployments → … → Retry) so the variables take effect.

4. **Verify**
   - Open your `*.pages.dev` domain, complete the questionnaire (or use `?demo=plumbing-urgent`), and check that the banner says the blueprint was personalized (or shows an honest notice if the key/quota has a problem — the product still works).
   - In the browser dev tools, confirm **no** API key appears anywhere in the client bundle (`grep` the built JS if you want certainty — the key only ever exists server-side).

### Option B — Deploy with wrangler (no Git)

```bash
npx wrangler login
npx wrangler pages project create webthangs-operations-planner
npx wrangler pages secret put GEMINI_API_KEY        # paste key, choose the project
npx wrangler pages secret put ...                   # (vars can also go in the dashboard)
npm run deploy
```

## Local development with Functions

```bash
cp .dev.vars.example .dev.vars     # fill in GEMINI_API_KEY (gitignored)
npm run pages:dev                  # builds + serves dist and functions at http://localhost:8788
```

`npm run dev` (Vite only, no Functions) proxies `/api/*` to port 8788 when `wrangler pages dev` is also running.

## Optional — consultation storage + operator notification

Without D1 the consultation form still works: it responds honestly and offers a pre-filled email to `CONTACT_EMAIL`. To store requests properly:

```bash
npx wrangler d1 create webthangs_consultations
# copy the printed database_id into wrangler.toml (uncomment the [[d1_databases]] block)

npx wrangler d1 execute webthangs_consultations \
  --file migrations/0001_consultations.sql --remote
```

Then in the dashboard add the same binding: Project → Settings → **Bindings** → Add → **D1** → name `DB`, your database. (Wrangler-config bindings and dashboard bindings are alternatives; use the dashboard for Git-connected projects.)

Read stored requests (the documented retrieval process — a D1 row is a stored
lead, NOT a delivered one; either check this regularly or configure the
webhook below):

```bash
npx wrangler d1 execute webthangs_consultations \
  --command "SELECT created_at, name, email, company, industry FROM consultation_requests ORDER BY created_at DESC LIMIT 50" --remote
```

### Operator notification (v1.0.1)

A stored lead nobody notices is a lost lead. Configure ONE of:

- **`LEAD_WEBHOOK_URL` (recommended, free):** any HTTP endpoint that accepts a
  JSON POST — a Slack/Discord-style incoming webhook, a self-hosted receiver,
  or a Zapier/Make catch hook. Each stored request triggers one server-side
  POST with the consented fields. Timeout 10s; a failed webhook never blocks
  storage and the visitor sees the honest "saved, team reviews the database"
  message. The variable exists only server-side; nothing is logged except the
  outcome.
- **Manual retrieval:** the D1 query above on a fixed schedule you actually
  follow.

With neither configured, the app still stores requests but tells the visitor
honestly that the team retrieves them by database review — it never claims an
automatic contact that nothing guarantees.

## The Gemini API key — security rules

- **Temporary test key only** in development. Before public launch, generate a fresh key in Google AI Studio, restrict it, and replace the secret in the dashboard.
- Never place it in `src/`, `dist/`, the repo, the ZIP, logs or the browser. It exists only as the encrypted `GEMINI_API_KEY` secret (or `.dev.vars`, which is gitignored).
- If the free-tier quota runs out, `/api/generate` returns the deterministic blueprint with a clear “AI temporarily unavailable” notice — by design.

## Model availability

`gemini-3.8-flash` is a current stable model (verified Oct 2026 against the official list at ai.google.dev/gemini-api/docs/models). If Google renames or restricts models for your API project, the Function automatically tries `GEMINI_FALLBACK_MODELS` (default `gemini-flash-latest,gemini-3.6-flash`). Note: Google lists the 2.5-series as limited-access for API projects that have not used it before, which is why the 2.5 fallback was removed from the defaults in v1.0.1. Verify current model ids at [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) and adjust the two variables if needed.

The `/privacy` page ships as `dist/privacy.html` and is served at `/privacy` by Pages' clean-URL handling — no redirect rule needed. Verify it after the first deploy.

## Hardening for public launch (v1.0.1)

The in-app limiter is per-isolate and best-effort. It is honest about that —
and so is this checklist. **Until the Cloudflare-level rule below exists, do
not claim global rate limiting for the deployed site.**

1. **WAF rate-limiting rule on `/api/*`** (required for a global guarantee):
   Dashboard → your zone → Security → WAF → Rate limiting rules. Rate limiting
   rules are available on the Free plan (parameter availability differs by
   plan — Free/Pro/Business cannot set custom counter durations; check the
   current parameters in the dashboard when you configure it). Suggested rule:
   match `starts_with(http.request.uri.path, "/api/")`, count requests per IP,
   block/serve-429 above ~60/min. This is a zone-level feature: it applies to
   your domain on Cloudflare, not to `*.pages.dev` subdomains — for pages.dev
   previews the in-app per-isolate limiter is what you have (another reason to
   launch on a custom domain).
2. **Turnstile** (free, no CAPTCHA UX) on the consultation form if spam appears.
3. **`CONTACT_EMAIL`** set and verified to receive mail — Privacy Policy
   launch blocker otherwise.
4. **`LEAD_WEBHOOK_URL`** configured (or a documented manual D1 review habit).
5. **Custom domain**: Pages project → Custom domains (needed for step 1).
6. **Access logs**: none exist on free Pages; D1 consult rows carry `created_at`.
7. **Budget guard**: Gemini free tier is per-minute/per-day limited; the app
   caps each IP at 8 generations/hour in-app, and AI personalization is now
   opt-in (unchecked by default), which removes AI traffic for visitors who
   do not ask for it. To disable AI entirely, set `AI_ENABLED=off` — the
   product continues in deterministic mode.

## CI (optional)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```
