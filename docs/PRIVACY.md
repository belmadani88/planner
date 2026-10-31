# Privacy Policy (source of record)

> **Status: DRAFT — requires legal review before commercial launch.** The
> publicly served version of this policy lives at `/privacy` on the deployed
> site (built from `privacy.html` + `src/components/PrivacyPage.tsx`). Keep
> this document in sync with that page; the page is authoritative.
>
> **Operator note (launch blocker):** the operator contact email is configured
> with the `CONTACT_EMAIL` environment variable. Until it is set and verified,
> the site displays no contact address anywhere — by design, rather than
> showing an invented one. Set it before launch.

Version 1.0.1 · Last updated: 2026-10-31

## The short version

- Your questionnaire answers are saved in your own browser (localStorage) so
  you can close the tab and resume later.
- When you click “Build my blueprint”, your answers **are transmitted over the
  internet** to the WebThangs server, where a rules engine computes your
  report.
- **Only if you explicitly opt in** on the final question screen, your answers
  are also sent to Google’s Gemini API to write a personalized narrative. If
  you do not opt in, your answers are never forwarded to Google.
- A consultation request form, if you choose to use it, sends your contact
  details to WebThangs and, when configured, stores them in a Cloudflare D1
  database.
- We do not sell your data, we do not run advertising trackers on this tool,
  and the tool does not ask for information about your own customers.

## 1. Who is responsible

WebThangs, a digital systems implementation agency for home-services
businesses, operates this tool and is the data controller for the information
described here. The operator’s identity and contact address are configured per
deployment (see “Contact”).

## 2. What the questionnaire collects

Approximate, business-level facts only: trade (7 supported industries),
services offered, team size, rough revenue range, monthly inquiry volume, how
inquiries are handled, software already used, and goals. Answers are
multiple-choice; the tool does not ask for your name, your customers’
information, addresses or account numbers. An optional “business name” field
stays in your browser and appears in your report.

While you answer, responses are stored in your browser’s localStorage. Erase
them any time with “Start over” or by clearing site data.

## 3. What happens when you generate a blueprint

Clicking the final button sends your complete answers as JSON to
`/api/generate`, hosted on Cloudflare Pages Functions. This is required to
build your blueprint: the authoritative rules engine runs server-side so the
report cannot be tampered with. Generation requests are **not stored** in a
database — there is no server-side answers table, no account, no login.

## 4. Google Gemini (optional AI personalization)

The blueprint’s recommendations, calculations, diagrams and roadmap come
entirely from the deterministic rules engine. Separately, an **optional**
layer can have Google Gemini write a plain-language narrative version of your
summary.

- **When:** only when you tick the AI personalization option on the final
  question screen. Off by default.
- **What is sent:** your questionnaire answers plus a compact summary of your
  computed blueprint, from WebThangs’ server to Google’s Gemini API
  (generativelanguage.googleapis.com). The API key never reaches your browser.
- **What Gemini does:** writes narrative text inside a strictly validated
  structure; it cannot choose software, change numbers, or add
  recommendations. Its output is Zod-validated and screened for unsupported
  software claims before display.
- **If you decline:** your answers are not sent to Google. You receive the
  complete deterministic blueprint labeled as the standard (non-AI) edition.
  No report functionality is removed.
- **If Gemini is unavailable or fails** (quota, timeout, invalid response):
  the server automatically returns the deterministic blueprint with an honest
  notice. AI is never required.
- Google processes personalization requests under its own Gemini API terms;
  this policy does not govern Google’s processing.

## 5. Consultation requests

The form submits: name, email, optional company and message, explicit consent,
and a small blueprint context (industry, size tier, goals, top finding
titles). Depending on deployment configuration:

- **D1 database configured:** the request is stored in Cloudflare D1, and the
  form reports honestly whether the operator was also notified (optional
  `LEAD_WEBHOOK_URL`). Stored requests are retrieved by the operator — the
  documented retrieval command is in `docs/DEPLOYMENT.md`.
- **No D1 configured:** nothing is stored. The form says so and offers a
  pre-filled email using the operator’s configured `CONTACT_EMAIL`.
- **If storage or notification fails:** you are told exactly which part
  failed. The form never displays a fake success.

## 6. Third parties involved

- **Cloudflare** — hosting, API endpoints and (optionally) the request
  database; processes request metadata as part of serving the site.
- **Google (Gemini API)** — receives questionnaire answers only if you opt in.
- **Operator notification service** — if configured, receives new
  consultation-request notifications server-side.

No advertising or analytics trackers run on the planner itself. Nothing is
sold or shared with data brokers.

## 7. What we do not do

No selling or renting of information; no advertising profiles; no tracking
across other websites; no collection of information about your customers; no
claims of GDPR/CCPA compliance in this draft (that assessment requires legal
review).

## 8. Retention and deletion

- Questionnaire answers: your browser only, until you delete them.
- Blueprint generation requests: not persisted by the application.
- Consultation requests: kept in the request database as long as useful for
  the consultation relationship. No fixed retention period is invented here.
  To ask what was stored or to request deletion, use the operator contact
  address once configured.

## 9. Security

API keys and provider credentials exist only server-side; all API inputs are
size-limited and strictly validated; per-connection rate limits apply in the
application and the operator is expected to enable Cloudflare-level rate
limiting (see `docs/DEPLOYMENT.md`); no payment card data is handled anywhere.

## 10. Children

A business tool for business owners; not directed at children.

## 11. Changes

This document is versioned with the code. Material changes update the “last
updated” date on the served page.

## 12. Contact

Questions about your information go to the operator’s configured contact email
for this deployment (`CONTACT_EMAIL`). If no address is shown on the site, the
variable has not been configured yet — that is a launch blocker, not an
oversight.
