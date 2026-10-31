# Architecture

The Phase-1 architecture document: product structure, core models and design decisions.

## 1. Product structure

| Layer | Location | Responsibility |
| --- | --- | --- |
| Questionnaire UI | `src/components/quiz` | Guided, one-question-at-a-time flow; conditional questions; localStorage autosave |
| Deterministic engine | `src/engine` | **All** business intelligence: classification, assessment, findings, workflow selection, software plan, financials, roadmap, operating model, diagram graph |
| Data libraries | `src/data` | Question bank, industry configs, the 11-stage model, software knowledge base, workflow library, demo scenarios |
| Validation | `src/schemas` | Zod schemas — answers validated against the question bank; AI output validated + sanitized + software-screened |
| AI layer (server) | `src/server/gemini.ts` + `functions/api/generate.ts` | Gemini REST call with structured output, model fallback chain, timeout, validation, honest degradation |
| Report UI | `src/components/report` | 12-section blueprint, interactive React Flow diagram, print/PDF, offline HTML export |
| Conversion | `src/components/ConsultationForm.tsx` + `functions/api/consultation.ts` | Consented lead capture with D1 (optional), an optional operator webhook (`src/server/notify.ts`) and honest stored/notified reporting |
| Privacy | `privacy.html` → `src/components/PrivacyPage.tsx` | Public `/privacy` policy page built as a second Vite entry; content asserted against the real data flow by tests |

## 2. The universal operating model (the intellectual core)

`src/data/stages.ts` defines the 11 stages every home-services business shares — attract, receive, respond, book, estimate, follow up, schedule, perform, invoice, after-service, measure. Industry configs (`src/data/industries.ts`) layer *variations* (emergency intensity, sales-cycle length, estimate style, insurance involvement, recurring-revenue shape, per-stage notes, accent workflows) rather than replacing the backbone. One backbone + modular configs = seven trades covered without seven products.

## 3. Deterministic engine flow

`buildDeterministicBlueprint(answers)` (in `src/engine/index.ts`) runs, in order:

1. **Classification** (`classify.ts`) — size tier, inquiry-volume tier, tech maturity (count of digitized processes), operational pattern (owner-led / delegated / team-based), demand pressure (volume vs. field capacity).
2. **Stage assessment** (`stages.ts`) — each of the 11 stages gets a 0–3 maturity score derived from mapped answers, with quoted evidence, gaps, and honest strengths. `null` = “not sure”, never guessed.
3. **Findings** (`findings.ts`) — 20 evidence-gated rules (16 problem findings, 4 positive findings). A finding only fires when the owner’s answer supports it and quotes that answer.
4. **Workflow selection** (`workflows.ts`) — filters the 27-entry library (`data/workflows.ts`) by industry, applicability conditions and caps; assigns each a **mode**: `adopt` (new), `verify` (you likely already pay for this — switch it on) or `keep`. Priority tiers and industry accents order the selection deterministically.
5. **Software plan** (`software.ts`) — right-sizes the stack around existing tools: keep Jobber/Housecall Pro/ServiceTitan when present; pair GoHighLevel with a field-service hub; recommend Jobber by size otherwise (ServiceTitan-class evaluated only for 15+ techs). Accounting, website, analytics, phone and automation entries follow the same “prefer existing, avoid redundant subscriptions” rules. Integration notes only state what the knowledge base documents (verified / likely / unverified).
6. **Financials** (`financial.ts`) — midpoint arithmetic on the owner’s ranges, then scenario modeling with every assumption stated (close rate, contact rates, admin minutes, admin hourly cost). Unknown inputs skip scenarios rather than guess. Software cost estimate sums published entry prices only.
7. **Roadmap + plan** (`roadmap.ts`) — three phases with dependencies (FSM setup before automations; data before AI; AI always phase 3). Implementation plan steps are concrete configuration actions.
8. **Operating model + diagram** (`model.ts`) — the recommended flow per stage (human / automation / AI / software steps) and the React Flow graph (nodes typed by actor, edges animated for automatic data movement, including the referral loop back to the entry points).

Identical answers always produce an identical blueprint (covered by a determinism test).

## 4. AI personalization layer

- The client builds the deterministic blueprint **locally first**; `POST /api/generate` then rebuilds it server-side (single source of truth — the client cannot inject content) and tries to upgrade the narrative.
- Gemini is called via the official REST API (`generateContent`) with `responseMimeType: application/json` + a response schema, low temperature, 30s timeout, `x-goog-api-key` header (key never in URLs, logs or the browser).
- Model handling: `GEMINI_MODEL` first, then the `GEMINI_FALLBACK_MODELS` chain on `MODEL_NOT_FOUND` — so a renamed/unavailable model degrades instead of breaking.
- Validation engine (in order): JSON parse → Zod schema (lengths, stage ids 1–11, required fields) → markdown stripping → **software screening**: any product name outside the knowledge base fails validation and the whole AI payload is discarded.
- On any failure the server returns HTTP 200 with the deterministic blueprint plus an honest notice (`QUOTA`, `MODEL_NOT_FOUND`, `INVALID_AI_RESPONSE`, …). Since v1.0.1 the notice travels both as a top-level field and inside `blueprint.meta.notice`, so the report view actually displays it (v1.0.0 computed it but dropped it en route to the UI). The UI never shows a broken state.
- The AI writes only: executive summary, per-stage insights + tips, contextual notes, roadmap narrative, improvement narrative, consultation message. It cannot change recommendations, software, numbers or structure.

## 5. Frontend architecture

- **React 18 + TypeScript + Vite + Tailwind CSS 3**, no UI framework — a small local design system (`src/components/ui.tsx`) encodes the WebThangs visual language (actor chips, severity chips, maturity meters, section titles).
- **State**: a 4-view state machine (landing → quiz → analyzing → blueprint). No router — the product is a linear journey; answers persist in `localStorage`. The `/privacy` page is a separate static entry, deliberately outside the SPA.
- **Industry switching (v1.0.1)**: changing trade drops service selections that don't exist in the new industry's option set (shared values survive), and the engine re-sanitizes on every build — stale selections can never reach an assessment.
- **Diagram**: `@xyflow/react` (React Flow 12) with a custom node component; opens at readable zoom and pans/zooms from there. Node color encodes actor type; the legend and node inspector teach the “human vs automation vs AI vs software” distinction.
- **Export**: `window.print()` with a dedicated print stylesheet; plus a self-contained offline HTML document and raw JSON (`src/lib/exportHtml.ts`).
- **Performance**: single bundle ≈ 188 kB gzipped (React Flow + icons included); static assets immutable-hashed; no client-side API key or external runtime dependencies.

## 6. Cloudflare deployment architecture

- Static-first SPA on **Cloudflare Pages**; `functions/api/*.ts` are **Pages Functions** deployed alongside the static output (no Node server, no containers, no VPS).
- Zero-budget: Pages free tier (unlimited static requests, 500 builds/mo) + Functions free tier (100k requests/day, verified Oct 2026) + Gemini free tier (rate-limited; quota exhaustion degrades gracefully) + optional D1 free tier for consultation storage.
- Abuse controls: per-IP token buckets (8/hour for generate, 5/hour for consultation — best-effort per isolate), 48 kB/16 kB body limits, strict Zod input validation, no secrets in client code. For hardened production use, add Cloudflare WAF/Turnstile (documented in DEPLOYMENT.md).

## 7. Extension points

- **New industry**: add one config in `src/data/industries.ts` (services, demand pattern, stage notes, accents). The engine picks it up automatically; the question bank needs only the industry option + service list.
- **New workflow**: add one `WorkflowDef` in `src/data/workflows.ts` with `appliesWhen`/`modeWhen` rules — selection, roadmap placement, diagram and tests flow from it.
- **New software**: add a `SoftwareEntry` (with verification date + source) in `src/data/software.ts`; the screening allow-list updates automatically from the KB.
- **Accounts/persistence later**: the blueprint is a pure JSON document; adding a `blueprints` D1 table and an auth layer requires no engine changes.
