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
     - `GEMINI_MODEL` = `gemini-3.8-flash` (plaintext)
     - `GEMINI_FALLBACK_MODELS` = `gemini-flash-latest,gemini-2.5-flash` (plaintext)
     - `AI_ENABLED` = `on` (plaintext)
     - `CONTACT_EMAIL` = your agency inbox (plaintext)
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

## Optional — consultation storage with Cloudflare D1 (free tier)

Without D1 the consultation form still works: it responds honestly and offers a pre-filled email to `CONTACT_EMAIL`. To store requests properly:

```bash
npx wrangler d1 create webthangs_consultations
# copy the printed database_id into wrangler.toml (uncomment the [[d1_databases]] block)

npx wrangler d1 execute webthangs_consultations \
  --file migrations/0001_consultations.sql --remote
```

Then in the dashboard add the same binding: Project → Settings → **Bindings** → Add → **D1** → name `DB`, your database. (Wrangler-config bindings and dashboard bindings are alternatives; use the dashboard for Git-connected projects.)

Read stored requests:

```bash
npx wrangler d1 execute webthangs_consultations \
  --command "SELECT created_at, name, email, company, industry FROM consultation_requests ORDER BY created_at DESC LIMIT 50" --remote
```

## The Gemini API key — security rules

- **Temporary test key only** in development. Before public launch, generate a fresh key in Google AI Studio, restrict it, and replace the secret in the dashboard.
- Never place it in `src/`, `dist/`, the repo, the ZIP, logs or the browser. It exists only as the encrypted `GEMINI_API_KEY` secret (or `.dev.vars`, which is gitignored).
- If the free-tier quota runs out, `/api/generate` returns the deterministic blueprint with a clear “AI temporarily unavailable” notice — by design.

## Model availability

`gemini-3.8-flash` is the current Flash-generation model (verified Oct 2026). If Google renames or restricts models for your API project, the Function automatically tries `GEMINI_FALLBACK_MODELS` (`gemini-flash-latest` alias first, then `gemini-2.5-flash`). Verify current model ids at [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) and adjust the two variables if needed.

## Hardening for public launch (recommended)

- **WAF rule**: rate-limit `/api/*` (e.g. 60 requests/min per IP) — the in-app limiter is per-isolate and best-effort.
- **Turnstile** (free, no CAPTCHA UX) on the consultation form if spam appears.
- **Custom domain**: Pages project → Custom domains.
- **Access logs**: none exist on free Pages; D1 consult rows carry `created_at`.
- Budget guard: Gemini free tier is per-minute/per-day limited; the app caps each IP at 8 generations/hour in-app. To reduce further, set `AI_ENABLED=off` and the product continues in deterministic mode.

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
