# Changelog

All notable changes to the WebThangs Business Operations Planner are documented here.

## [1.0.1] — 2026-10-31

Surgical remediation release. No features were removed; no product direction,
design identity, questionnaire structure or recommendation philosophy changed.
The full audit findings this release implements are listed per defect below.

### P0.1 — Privacy disclosures now match the actual data flow

**Original issue:** the footer, landing page and analysis screen claimed
"answers stay in your browser / nothing is submitted unless you ask for a
consultation" while the app POSTs every answer to `/api/generate`, and (when
enabled and opted in) forwards answers to Google Gemini.

**Root cause:** privacy copy was written for an earlier fully-local design and
never updated when the server-side generation flow was introduced.

**Corrections:**
- Footer, landing hero, landing CTA, analysis screen and quiz footer now
  describe the real flow: answers are saved in the browser and submitted for
  processing when the blueprint is generated; Google Gemini is involved only
  when the visitor opts in.
- An accessible privacy notice with the AI choice now appears on the last
  questionnaire screen, before any submission.
- AI personalization is now **opt-in** (checkbox, off by default) on the final
  question screen. Declining means: no request is sent to `/api/generate` at
  all from the client, no answers reach Google, and the complete deterministic
  blueprint is still produced with a clear "standard (non-AI) edition" notice
  (`AI_DECLINED`).
- A real **Privacy Policy page** is served at `/privacy` (see P0.2), linked
  from the footer, landing page, quiz, pre-submit notice and consultation form.
- The consultation consent text no longer claims "never sold, never shared";
  it now points to the Privacy Policy and describes processing + optional
  storage truthfully.
- The invented development address `hello@webthangs.example` was removed. When
  the operator has not configured `CONTACT_EMAIL`, the UI says so honestly
  instead of showing an address that belongs to nobody. **`CONTACT_EMAIL`
  configuration is documented as a launch blocker.**
- Honest AI notices (quota exhausted, model unavailable, invalid response,
  timeout, disabled, no key, declined) are now actually **displayed** in the
  report: v1.0.0 computed them but `App.tsx` dropped the field and the server
  never attached them to `blueprint.meta.notice`, so the report view never
  showed them.

**Files:** `src/App.tsx`, `src/components/Landing.tsx`,
`src/components/quiz/Quiz.tsx`, `src/components/ConsultationForm.tsx`,
`src/lib/api.ts`, `functions/api/generate.ts`, `src/server/gemini.ts`,
`src/types/blueprint.ts`, plus the new `privacy.html`,
`src/privacy-main.tsx`, `src/components/PrivacyPage.tsx`.

**Tests:** `tests/privacy.test.ts` (14), `tests/gemini.test.ts` (19), incl.
"declined AI → zero network requests".

### P0.2 — The Privacy Policy is a real, public page

**Original issue:** privacy documentation existed only as a repo Markdown
template with placeholder brackets; nothing was served by the site.

**Corrections:**
- `privacy.html` is a second Vite build entry; the production build emits
  `dist/privacy.html`, which Cloudflare Pages serves at `/privacy` (clean-URL
  handling for static assets). Verified in the built output.
- The policy covers: what the questionnaire collects; what is sent to the
  WebThangs backend and why; when/how Gemini processing happens; what happens
  when it is declined, disabled or fails; what consultation data is collected;
  D1 storage and the notification webhook; all third parties; failure
  behavior; retention/deletion (no invented periods); security; contact
  configuration (with the launch-blocker note).
- Marked as a **draft requiring legal review**; makes no GDPR/CCPA claims and
  invents no retention periods or addresses.
- `docs/PRIVACY.md` stays in the repo and agrees with the served page.

**Tests:** `tests/privacy.test.ts` asserts the built page and every required
disclosure.

### P0.3 — Consultation delivery and truthful confirmations

**Original issue:** when D1 was configured, a successful insert told the
visitor "WebThangs will be in touch" — but nothing notified the operator. A
database row is not a delivered lead.

**Corrections:**
- New optional server-side notification adapter (`src/server/notify.ts`): a
  single outbound POST to `LEAD_WEBHOOK_URL` (works with Slack/Discord-style
  incoming webhooks, self-hosted receivers, Zapier/Make catch hooks — no paid
  provider is required or mandated, no credentials in the browser, nothing
  sensitive logged).
- The API response now distinguishes `stored` from `notified`, and the
  messages are honest per condition: stored+notified; stored but nobody pinged
  (says the team reviews the request database — the documented retrieval
  process); storage failed (email fallback); no D1 configured (email
  fallback). No fake successes.
- The webhook payload contains only the consented fields.
- D1 access typed structurally so the endpoint tests run without Workers types.

**Files:** `functions/api/consultation.ts`, `src/server/notify.ts`,
`src/lib/api.ts` (`notified` field).

**Tests:** `tests/consultation.test.ts` (14) — all seven required conditions
plus payload-minimality and no-leak checks.

### P1.1 — Housecall Pro pricing corrected

**Original issue:** the knowledge base showed Housecall Pro Basic at "$49/mo
commonly reported" without distinguishing billing modes or user counts.

**Correction (verified against housecallpro.com/pricing on 2026-10-30):**
- Basic **$59/mo billed annually** or **$79/mo billed month-to-month**, 1 user
  included; Essentials $149/$189 (5 users); Max $299/$329 (8 users, ~$35/mo
  per extra user). USD, subject to change, source and verification date
  stored (`lastVerified: 2026-10-30`, `verifiedVia: housecallpro.com/pricing`).
- The engine's alternative-stack recommendation now shows $59 (annual) with
  the annual-vs-monthly distinction in the note. The $49 figure is gone.
- The `$49 → $59` change is NOT presented as month-to-month: the note states
  explicitly that the entry price requires annual billing.
- GoHighLevel's note gained the standard verify-before-purchase hedge
  (consistency check on every priced KB entry).

**Files:** `src/data/software.ts`, `src/engine/software.ts`.

**Tests:** `tests/regressions.test.ts` — pricing metadata, USD context,
verify-note and no-regression-to-$49 assertions.

### P1.2 — Financial calculation accuracy

**Original issue:** the missed-call percentage was applied to ALL monthly
inquiries (phone + forms + marketplaces + referrals), overstating lost
opportunities; open-ended ranges ("100+" inquiries, "$5,000+" spend) were
silently assigned point estimates presented as if measured.

**Corrections:**
- Missed-call math is now scoped to the **telephone share of inquiries**,
  modeled from the existing `callVsWebMix` answer (mostly-calls 85% / balanced
  50% / mostly-web 15%; unknown → a stated conservative 50%). Every number
  derived from it is labeled "modeled estimate … not a measured count", and
  the assumption is listed in the report.
- Open-ended ranges use explicitly stated modeling values (150 inquiries,
  $7,500 spend), repeated next to every derived row, and listed in the
  assumptions. Measured rows still show the owner's own answer ("100+").
- Missing (undefined) answers now also produce the honest "not provided —
  skipped rather than guessed" note (previously only "I don't know" did).
- All figures labeled USD; US-first scope stated in the report disclaimer.
- Scenario structure (conservative/moderate/optimistic), determinism, and the
  measured/estimated/modeled separation are unchanged.

**Files:** `src/engine/financial.ts`, `src/engine/index.ts`,
`src/types/blueprint.ts`, `src/schemas/blueprint.ts`.

**Tests:** `tests/financial.test.ts` rebuilt (corrected math documented) +
new cases: mostly-phone / mostly-online / mixed / unknown mix; open-ended
inquiry and ad-spend ranges; zero ad spend; near-zero inquiries; incomplete
answers; prefer-not revenue.

### P1.3 — US-first launch market made explicit

- Landing page: "For US home-services businesses"; privacy policy and footer
  say the same; index.html meta description updated.
- Financial disclaimer and software pricing notes state US pricing in USD.
- Docs state the US-first scope; AU/CA localization remains documented as
  future work (no silent currency conversion, no invented regional prices).

**Files:** `src/components/Landing.tsx`, `src/App.tsx`, `src/engine/financial.ts`,
`src/data/software.ts`, `index.html`, docs.

### P1.4 — Gemini configuration verified against current docs

- `gemini-3.8-flash` **verified as a current stable model** on
  ai.google.dev/gemini-api/docs/models (Oct 2026) — unchanged.
- The `v1beta/models/{model}:generateContent` endpoint and JSON-mode
  structured output remain documented and non-deprecated — unchanged.
- Default fallback chain updated from `gemini-flash-latest,gemini-2.5-flash`
  to `gemini-flash-latest,gemini-3.6-flash`: Google lists 2.5 models as
  limited-access for API projects that have not used them before, so a
  brand-new key could not fall back to it. Overridable via
  `GEMINI_FALLBACK_MODELS`.
- Live-call verification: **NOT VERIFIED** — no usable API key exists in this
  remediation environment, and fabricating one is forbidden. Everything
  around the live call is covered by stubbed tests.

**Tests:** `tests/gemini.test.ts` — 19 tests covering all required failure
conditions (no key, invalid key, rate limit, network failure, timeout,
malformed response, invalid JSON, schema failure, unsupported model + fallback,
declined AI, unsupported software claims) — in every condition the complete
deterministic blueprint is returned.

### P1.5 — API abuse protection documented honestly

- In-memory limiter kept (per-isolate by nature; comments and docs say so).
- Body-size limits, strict validation and per-connection caps unchanged;
  requests can never trigger unbounded Gemini calls (AI is opt-in, capped at
  8 generations/hour/IP per isolate).
- DEPLOYMENT.md "Hardening" updated: Cloudflare WAF rate-limiting rules on
  `/api/*` (available on the Free plan, with plan-based parameter limits —
  verify in the dashboard), optional Turnstile on the consultation form. The
  docs state plainly that global protection exists only once that Cloudflare
  rule is configured; nothing claims protection is globally active by default.

### Part 4 regressions fixed

1. **Option IDs / label corruption** — within-scope IDs were already unique;
   the real defect was cross-industry label overwriting: `labelOf` unioned
   option labels across industries, so shared value ids (`maintenance`,
   `repairs`, `replacements`, `design-build`) displayed whichever trade's
   label was resolved last — e.g. an HVAC owner's "Preventive maintenance"
   was quoted as plumbing's "Recurring maintenance plans" in their report.
   Labels now resolve against the owner's own industry first (cache keyed per
   industry).
2. **Workflow CRM labeling** — `stack.crm?.name ?? stack.marketingCrm ? 'Your
   CRM' : 'Your customer system'` parsed as `(stack.crm?.name ??
   stack.marketingCrm) ? …`, so a real CRM name could never appear. Fixed to
   `stack.crm?.name ?? stack.fsm?.name ?? 'Your customer system'`.
3. **Industry switching** — switching trades no longer leaves stale
   service selections in the assessment. The quiz drops values that don't
   exist in the new industry's option set (keeping genuinely shared values),
   and the engine sanitizes at the top of `buildDeterministicBlueprint`, so
   stale values can never reach the assessment through any entry point.

**Files:** `src/engine/labels.ts`, `src/engine/workflows.ts`,
`src/engine/index.ts`, `src/components/quiz/Quiz.tsx`,
`src/schemas/answers.ts`.

**Tests:** `tests/regressions.test.ts` — duplicate-ID detection (static +
per-industry), label correctness per trade, CRM label cases (existing CRM,
no CRM, FSM-only, multiple tools, empty values), industry-switch cases
(HVAC↔plumbing, plumbing↔roofing, electrical→landscaping, remodeling↔landscaping,
shared-answer preservation).

### Security review (Part 5)

- No hardcoded keys, no `.dev.vars`/`.env` in the archive, no git history, no
  secrets in test fixtures or docs; frontend makes no Gemini requests; AI
  output is sanitized before render; all user input is Zod-validated; no SQL
  beyond the parameterized D1 insert; no sensitive logging (webhook details
  carry status codes only, never lead data).
- `.env.example` / `.dev.vars.example` contain placeholders only; the public
  placeholder email was removed from the client (see P0.1).
- New env var documented: `LEAD_WEBHOOK_URL` (optional).

### Dependency changes

- Added `@types/node` (dev-only, type-checking for file-reading tests). No
  runtime dependencies added or upgraded.

### Test results for this release

- Original suite: 69 tests — all preserved; financial expectations updated to
  the corrected math (documented above).
- New regression tests: 82 (privacy 14, gemini 19, consultation 14,
  regressions 22, financial additions 17).
- Total: **151/151 passing**, `npm run typecheck` clean for app + functions,
  production build clean.
- NOT VERIFIED (environment limits): live Gemini call, deployed-Cloudflare
  D1 round-trip, real-domain WAF behavior.
