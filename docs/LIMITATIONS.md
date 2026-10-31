# Known limitations

Honest inventory of what this MVP does not do (and why), so the next developer doesn’t discover them the hard way.

## Product

- **The AI layer is optional AND opt-in.** Without a valid `GEMINI_API_KEY` the app runs in deterministic mode — complete blueprint, standard narrative, and a notice saying so. Since v1.0.1 the visitor must also explicitly tick the AI option before any answer is forwarded to Google Gemini; the default is off.
- **Live Gemini verification.** v1.0.1's remediation environment had no usable API key, so the LIVE call is NOT VERIFIED; all surrounding behavior (13 failure/consent conditions) is covered by stubbed tests. The first deploy with a real key should confirm the banner shows "Personalized with <model>".
- **Software pricing is a point-in-time reference** (verified Oct 2026, sources noted per entry in `src/data/software.ts`). It is not live data and will drift. The UI labels it accordingly; re-verify before relying on a number.
- **Model availability changes.** `gemini-3.8-flash` is current (Oct 2026). The fallback chain (`gemini-flash-latest`, `gemini-2.5-flash`) covers renames, but a brand-new API project should confirm its available models.
- **Roofing insurance-claim workflows** are acknowledged at the assessment/industry-note level but not modeled as a full claim-tracking process — the workflow library covers the general estimate → follow-up → job flow.
- **No accounts, no saved blueprints server-side.** Blueprints live in the browser (localStorage + exports). Accounts and a `blueprints` D1 table are the natural next step; the engine needs no changes for it.
- **US-first product.** Currency is USD, revenue ranges are phrased in dollars, and software prices are US prices. The UI, Privacy Policy and financial disclaimer all state this explicitly. Canada/Australia are NOT supported claims — localization (currency, LSA availability, Xero-first accounting) is configuration work in the question bank + software engine and has not been built or tested.

## Engineering

- **Rate limiting is per-isolate.** Cloudflare Functions run in many isolates; the in-memory token buckets (`src/server/ratelimit.ts`) are best-effort, not a global guarantee. Global protection exists ONLY after the operator adds a WAF rate-limiting rule on `/api/*` (documented in DEPLOYMENT.md; zone-level feature — it does not apply to `*.pages.dev` preview domains). Do not claim global limiting before that rule exists.
- **Consultation notification is configuration-dependent.** With `LEAD_WEBHOOK_URL` unset and D1 bound, requests are stored but nobody is pinged automatically — the app says exactly that to the visitor. Configure the webhook or a real retrieval habit before launch.
- **No CSRF protection on the consultation endpoint.** It accepts JSON POSTs with a mandatory consent flag and stores minimal data; risk is low, but a Turnstile challenge is recommended if spam appears.
- **D1 is optional and off by default.** With no binding, consultation requests are never silently dropped-and-faked — the client offers an email fallback. Storing requires the one-time setup in DEPLOYMENT.md.
- **Single-page bundle ≈ 188 kB gzipped** (React Flow + icons + app). Acceptable for this MVP; route-based code splitting is a future optimization.
- **`?demo=` URLs** load fixtures directly into the blueprint view. They’re dev/QA affordances — harmless in production (deterministic, no API calls), but comment out the `demo` block in `App.tsx` if you want them gone.
- **Print output**: the interactive diagram is intentionally replaced in print by its text edition (a node list); an SVG snapshot of the graph is a possible enhancement.
- **Integration claims are deliberately conservative.** We only state vendor-documented integrations from the knowledge base; anything else is marked `likely`/`unverified`. Expect to update `src/data/software.ts` as vendors change plans and features.

## Legal

- The Privacy Policy at `/privacy` (source: `docs/PRIVACY.md`) is a **draft**. It describes the implementation accurately but has not had counsel review; it claims no GDPR/CCPA compliance, invents no retention periods, and flags the unconfigured `CONTACT_EMAIL` as a launch blocker. Review it before commercial launch.

## Deliberate non-features (per the product brief)

- No subscription billing, no user authentication, no multi-tenant anything.
- No third-party integrations executed by the app itself (it recommends them; WebThangs implements them).
- No AI-generated HTML is ever rendered; no model output executes anything.
- No fabricated benchmarks, ROI promises or invented software capabilities — where data is missing the product says so.
