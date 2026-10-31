# WebThangs Business Operations Planner

A free, interactive business-intelligence platform for home-services companies (HVAC, plumbing, roofing, electrical, water-damage restoration, remodeling, landscaping). A business owner answers ~35 plain-language questions about their company and receives a **personalized business operations blueprint**: how their business runs today, where it leaks, how it should work, which software fits, where automation and AI genuinely help, what stays human — and exactly what to do first.

It is **not** an AI chatbot, a website builder or a revenue calculator. It is a deterministic home-services business-intelligence engine with an optional AI explanation layer, wrapped in a conversion path for WebThangs (a digital systems implementation agency).

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173 — full app, deterministic blueprint only
```

To also run the Cloudflare Functions locally (AI personalization + consultation endpoint):

```bash
cp .dev.vars.example .dev.vars    # add your temporary GEMINI_API_KEY
npm run pages:dev                 # builds, then serves dist/ + functions on http://localhost:8788
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks the app and produces the static site in `dist/` |
| `npm run typecheck` | Type-checks app **and** Cloudflare Functions code |
| `npm test` | Runs the vitest suite (69 tests: 7 business scenarios, financial math, validation engine, edge cases) |
| `npm run preview` | Serves the production build locally |
| `npm run deploy` | Builds and deploys to Cloudflare Pages via wrangler |

### Try it without answering 35 questions

Dev-only demo mode opens any of the seven test scenarios instantly:

```
http://localhost:5173/?demo=hvac-small-no-crm
```

Scenario ids: `hvac-small-no-crm`, `hvac-medium-jobber`, `hvac-large-servicetitan`, `plumbing-urgent`, `roofing-long-cycle`, `electrical-small`, `landscaping-contracts`.

---

## How the product works

```
Visitor → Landing → Guided questionnaire (6 parts, ~6 min, autosaved locally)
                        │
                        ▼
        Deterministic recommendation engine (pure TypeScript)
        · classifies the business
        · scores all 11 operating stages (maturity + evidence)
        · fires evidence-backed findings (incl. positive ones)
        · selects workflows (automation / AI / human) from a curated library
        · builds a right-sized software plan (prefers what you already own)
        · computes financial scenarios with every assumption stated
        · assembles roadmap, implementation plan and diagram graph
                        │
                        ▼  (optional upgrade — never required)
        POST /api/generate  (Cloudflare Pages Function)
        · server rebuilds the deterministic blueprint (source of truth)
        · calls Gemini with structured-output schema
        · Zod-validates + sanitizes + screens for unsupported software claims
        · on ANY failure → deterministic blueprint + honest notice
                        │
                        ▼
        Blueprint report — 12 sections, interactive diagram,
        print/PDF, offline HTML export, consultation CTA
```

**Business logic before AI.** Gemini only writes narrative text inside a validated schema. It cannot choose software, invent workflows or prices — every recommendation, number and integration claim comes from the deterministic engine and the software knowledge base, both of which are code.

**Static-first.** The frontend is a fully static SPA. Even with *zero* Functions deployed, the complete deterministic blueprint works. The Functions only add AI personalization and (optional) consultation storage.

---

## Repository layout

```
├── functions/api/            Cloudflare Pages Functions
│   ├── generate.ts           POST /api/generate — AI personalization (server-side key)
│   └── consultation.ts       POST /api/consultation — consented lead capture (D1 optional)
├── migrations/               D1 schema for consultation requests
├── src/
│   ├── types/                Answers + Blueprint contracts
│   ├── schemas/              Zod: answers (derived from question bank), blueprint, personalization
│   ├── data/                 industries (7 configs) · questions (37, conditional)
│   │                         stages (the 11-stage model) · software KB (15 entries, verified Oct 2026)
│   │                         workflows (27-recommendation library) · demoScenarios (7 fixtures)
│   ├── engine/               deterministic engine: classify → stages → findings → workflows
│   │                         → software → financials → roadmap → model → diagram → index
│   ├── server/               isomorphic helpers: Gemini REST client, rate limiter, responses
│   ├── lib/                  client API layer, localStorage, HTML/JSON export
│   └── components/           Landing · Quiz · BlueprintView (12 sections) · FlowDiagram (React Flow)
│                             · ConsultationForm · ui primitives
├── tests/                    vitest: engine, financial math, validation, edge cases
├── docs/                     ARCHITECTURE · DEPLOYMENT · TESTING · KNOWN-LIMITATIONS · PRIVACY
├── wrangler.toml             Cloudflare Pages config (incl. optional D1 binding)
├── .env.example / .dev.vars.example   placeholders only — never real secrets
└── index.html / vite.config.ts / tailwind.config.js / tsconfig*.json
```

---

## Configuration

All configuration is server-side environment variables (see `.env.example`):

| Variable | Purpose | Default |
| --- | --- | --- |
| `GEMINI_API_KEY` | Server-side Gemini key. **Required** for AI personalization; without it the app still works (deterministic mode). | — |
| `GEMINI_MODEL` | Primary model. `gemini-3.8-flash` is the current Flash generation (verified Oct 2026). | `gemini-3.8-flash` |
| `GEMINI_FALLBACK_MODELS` | Tried in order if the primary model is unavailable for the key. | `gemini-flash-latest,gemini-2.5-flash` |
| `AI_ENABLED` | Set `off` to disable AI without removing the key. | `on` |
| `CONTACT_EMAIL` | Fallback contact shown when no D1 database is configured. | — |
| `DB` (binding) | Optional Cloudflare D1 database for consultation requests. | — |

Never put any of these in client code. The frontend never sees the API key; it only talks to `/api/generate`.

---

## Deployment (Cloudflare Pages — free tier)

Full walkthrough in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**. Summary:

1. Push this repository to GitHub.
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Build command `npm run build`, output directory `dist`. Framework preset: none (Vite handles it).
4. Add `GEMINI_API_KEY` under Settings → Variables and Secrets → **Encrypt**. Add the other vars as plaintext.
5. Deploy. Functions in `functions/api/` are deployed automatically with the site.
6. Optional: create a D1 database, apply `migrations/0001_consultations.sql`, add the binding, uncomment the block in `wrangler.toml`.

Free-tier capacity (verified Oct 2026): 100,000 Function requests/day, 500 builds/month, unlimited static requests. Far beyond this MVP's needs.

---

## Testing

- **Automated**: `npm test` — 69 tests covering the seven required business scenarios, financial math recomputed independently, the validation engine, and edge cases (incomplete questionnaire, “I don’t know” everywhere, no website, GHL-without-FSM, determinism).
- **Browser-verified**: landing, questionnaire flow, all 12 blueprint sections, diagram interactivity, consultation fallback, console-error-free. A visual QA pass (screenshots reviewed by a vision model) caught and confirmed fixes for the landing strip clipping and diagram zoom legibility.
- Details and the manual test checklist: **[docs/TESTING.md](docs/TESTING.md)**.

## Known limitations

**[docs/KNOWN-LIMITATIONS.md](docs/KNOWN-LIMITATIONS.md)** — including: rate limiting is per-isolate (best-effort), software pricing is point-in-time reference, the AI layer needs a valid key to activate, D1 storage is optional and off by default.

## Privacy

**[docs/PRIVACY.md](docs/PRIVACY.md)** — answers never leave the browser unless the visitor requests AI personalization (then: answers → Google Gemini via server, no system of record) or submits a consultation (explicit consent, minimal fields, deletable on request). Template for the agency to publish and adapt.

## License & brand

Proprietary work product of WebThangs. The WebThangs name, palette (deep green / dark teal / soft mint / light gray / white) and voice are baked into the design system in `tailwind.config.js` and `src/components/ui.tsx`.
