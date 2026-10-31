# Testing

## Automated suite — `npm test` (vitest, 69 tests)

Run status for this delivery: **69/69 passing** (`vitest run`), TypeScript clean for both app and Functions configs, production build clean.

### The seven required business scenarios (Part 14)

Fixtures live in `src/data/demoScenarios.ts` (also used by `?demo=<id>` URLs).

| # | Scenario | Key assertions |
| --- | --- | --- |
| 1 | Small HVAC, no CRM (3 people, paper processes) | Classified micro/basic/owner-led; Jobber recommended as *adopt*; high-severity findings for manual invoicing, no CRM, weak follow-up; 3-phase roadmap with dependencies |
| 2 | Medium HVAC on Jobber (8–15 people) | Jobber **kept** (no replacement); FSM-covered workflows marked *verify*; underused-software finding; ad-spend-blindness flagged **without** re-selling GA4 they already run |
| 3 | Larger HVAC on ServiceTitan (16–30 people) | ServiceTitan kept, no competitor pushed; positive findings surfaced; **no** high-severity findings contradicted by their answers (fast response, no missed calls, same-day invoicing) |
| 4 | Plumbing, urgent demand (half+ calls missed) | Missed-call findings fire; W-MISSED-CALL-TEXT selected priority 1; VoIP recommended; demand pressure reported honestly (at-capacity, not a lead-buying pitch) |
| 5 | Roofing, long estimate cycle | Follow-up + estimate-tracking workflows selected; roofing industry note appears on the estimate stage |
| 6 | Electrical, small team | Housecall Pro kept; after-service gap flagged |
| 7 | Landscaping, recurring contracts | Maintenance-program workflow selected (industry accent); digitized maturity + positive finding |

Cross-cutting invariants: all 11 stages present; blueprint passes the structural Zod schema; workflows carry every mandatory explanation field; every finding quotes evidence; diagram is connected with nodes/edges resolvable; identical inputs produce identical blueprints.

### Financial math (recomputed independently in tests)

- Midpoints: inquiries 26–50 → 38, spend $500–1.5k → $1,000, miss rate half+ → 0.50, revenue $500k–1M → $750k
- CPL = 1000 / 38 = **$26**; missed inquiries = 19; implied job value = 750k/12/(38×0.45) = **$3.7k**
- Conservative recovery = 19×0.25×0.45 jobs × $3.7k ≈ **$7.8k/mo** (all labeled assumptions)
- Admin savings = 38 × (7/7 manual) × 22/60 ≈ **14 hrs/mo → $334/mo** at the stated $24/hr assumption
- CPL skipped when no paid channels; revenue scenarios skipped on “prefer not to say”; miss-rate scenarios skipped on “I don’t know”

### Validation engine

- Answers schema rejects unknown option values, unknown top-level keys, invalid industries; accepts a hidden conditional answer
- `checkCompleteness` lists exactly the unanswered *visible* questions
- Personalization schema accepts a good payload; rejects unknown stage ids, missing fields, overlong text; strips markdown
- Software screening allows knowledge-base names; blocks Salesforce/ChatGPT-style out-of-KB products

### Edge cases

- “I don’t know” across 20 answers → blueprint still valid; ≥4 stages marked *Not sure yet*; no high-severity finding manufactured from unknowns (structural facts like “no FSM” still count)
- No website → WordPress recommended, form-capture correctly skipped, phone-first diagram built
- GoHighLevel without FSM → GHL kept as lead layer + FSM added + **unverified** integration note stated honestly

## Manual / browser test results (this delivery)

Executed against the production build via an automated headless browser, then re-verified visually:

| Test | Result |
| --- | --- |
| Landing renders (desktop 1440px + mobile 390px), no console errors | ✅ |
| Start questionnaire → Q1 shows, correct progress bar | ✅ |
| Select HVAC → auto-advance to conditional services question (HVAC-specific options) | ✅ |
| Back navigation returns to previous question | ✅ |
| Fixed en route: quiz rendered empty when started with no saved answers (answers=null) — caught by browser test, fixed, re-verified | ✅ fixed |
| Demo blueprint: all 12 sections present (`#profile` … `#consultation`) | ✅ |
| React Flow diagram renders (21 nodes / 21 edges on the plumbing scenario) | ✅ |
| Diagram node click → inspector opens with plain-language detail + “Runs on” | ✅ |
| Consultation form: validation, consent required, submit with no backend → honest fallback (pre-filled email + copy summary), never fake success | ✅ |
| Visual QA (screenshots reviewed by a vision model): landing strip clipping and diagram legibility flagged → both fixed and re-verified **PASS** | ✅ |
| Print/PDF: dedicated print stylesheet (`.no-print` chrome hidden, cards avoid page breaks) + offline HTML export | ✅ code-verified |
| Mobile layout (390px): hero, quiz cards, report sections responsive | ✅ |

### Manual checklist for future changes

1. `npm run typecheck && npm test && npm run build` — all green
2. `?demo=<each of the 7 scenarios>` — renders, no console errors
3. Complete the real questionnaire end-to-end on a phone
4. `wrangler pages dev` with a real key — AI banner appears; with a bad key — honest notice + full deterministic blueprint
5. Submit consultation with and without D1 bound
6. Print to PDF from the browser — check the 12 sections paginate sensibly
