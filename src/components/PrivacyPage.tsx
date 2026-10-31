/**
 * The public Privacy Policy page, served at /privacy (built as privacy.html by
 * Vite; Cloudflare Pages serves /privacy.html for /privacy requests).
 *
 * Content rules (v1.0.1 — audit P0.1/P0.2):
 *  - Describes ONLY what the code actually does. Every claim here is checked by
 *    tests/privacy.test.ts against the real data flow.
 *  - No invented retention periods, no invented legal compliance, no invented
 *    contact addresses. The operator's contact email comes from configuration
 *    (CONTACT_EMAIL); until it is configured, that is stated openly and marked
 *    as a launch blocker.
 *  - Marked as a DRAFT requiring legal review before commercial launch.
 */

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="no-print border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 font-bold text-white">W</span>
            <span className="font-bold text-brand-900">WebThangs</span>
          </a>
          <a href="/" className="text-sm font-semibold text-brand-700 underline hover:text-brand-800">
            ← Back to the planner
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-brand-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink/50">
          WebThangs Business Operations Planner · Version 1.0.1 · Last updated: 2026-10-31
        </p>

        <div className="mt-8 rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-900">⚠ DRAFT — requires legal review before commercial launch</p>
          <p className="mt-2 text-[13px] leading-relaxed text-amber-900/85">
            This policy describes the implementation as it is built today. It has not yet been reviewed by a lawyer and
            makes no claims of GDPR, CCPA, or other legal compliance. Before offering this tool commercially, the
            operator must have counsel review this document, configure the operator contact email (currently a launch
            blocker — see “Contact”), and confirm every statement still matches the deployed code.
          </p>
        </div>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-ink/80">
          <section>
            <h2 className="text-xl font-bold text-brand-900">The short version</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Your questionnaire answers are saved in your own browser (localStorage) so you can close the tab and
                resume later.
              </li>
              <li>
                When you click “Build my blueprint”, your answers <strong>are transmitted over the internet</strong> to
                the WebThangs server, where a rules engine computes your report.
              </li>
              <li>
                <strong>Only if you explicitly opt in</strong> on the final question screen, your answers are also sent
                to Google’s Gemini API to write a personalized narrative. If you do not opt in, your answers are never
                forwarded to Google.
              </li>
              <li>
                A consultation request form, if you choose to use it, sends your contact details to WebThangs and, when
                configured, stores them in a Cloudflare D1 database.
              </li>
              <li>
                We do not sell your data, we do not run advertising trackers on this tool, and the tool does not ask
                for information about your own customers.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">1. Who is responsible</h2>
            <p className="mt-3">
              This tool is operated by WebThangs, a digital systems implementation agency for home-services businesses.
              WebThangs is the operator of this website and the “data controller” for the information described here.
              The operator’s identity and contact address are configured per deployment; see “Contact” at the end.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">2. What the questionnaire collects</h2>
            <p className="mt-3">
              The questionnaire asks about your business in approximate ranges: your trade (7 supported industries),
              services offered, team size, rough revenue range, monthly inquiry volume, how inquiries are handled, what
              software you already use, and your goals. Answers are multiple-choice — the tool does not ask for your
              name, your customers’ information, addresses, or account numbers. An optional “business name” field, if
              filled in, is displayed in your report and stored only in your browser.
            </p>
            <p className="mt-3">
              While you answer, responses are stored in your browser’s localStorage. You can erase them at any time
              with the “Start over” button or by clearing site data in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">3. What happens when you generate a blueprint</h2>
            <p className="mt-3">
              Clicking the final button sends your complete answers as JSON to the WebThangs backend endpoint{' '}
              <code className="rounded bg-mist px-1.5 py-0.5 text-[13px]">/api/generate</code>, hosted on Cloudflare
              Pages Functions. This is required to build your blueprint: the authoritative rules engine runs on the
              server, so the report cannot be tampered with and the tool stays honest. The endpoint validates the
              answers, computes the report, and returns it to your browser.
            </p>
            <p className="mt-3">
              The request is processed to produce your blueprint. The blueprint generation itself is
              <strong> not stored</strong> in a database by this application — there is no server-side blueprint or
              answers table, no account, and no login.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">4. Google Gemini (optional AI personalization)</h2>
            <p className="mt-3">
              The blueprint’s recommendations, calculations, diagrams and roadmap are produced entirely by the
              deterministic rules engine. Separately, an <strong>optional</strong> layer can have Google’s Gemini write
              a plain-language narrative version of your summary.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>When it happens:</strong> only when you tick the AI personalization option on the final
                question screen before generating. It is off by default.
              </li>
              <li>
                <strong>What is sent:</strong> your questionnaire answers and a compact summary of your computed
                blueprint, to WebThangs’ server and then onward to Google’s Gemini API
                (generativelanguage.googleapis.com) via a server-to-server request. The WebThangs API key is never
                exposed to your browser.
              </li>
              <li>
                <strong>What Gemini does:</strong> writes narrative text inside a strictly validated structure. It
                cannot choose software, change numbers, or add recommendations; its output is validated and screened
                before it is shown.
              </li>
              <li>
                <strong>If you decline:</strong> your answers are not sent to Google. You receive the complete
                deterministic blueprint, and the report is labeled as the standard (non-AI) edition. No report
                functionality is removed.
              </li>
              <li>
                <strong>If Gemini is unavailable or fails</strong> (quota exhausted, timeout, invalid response): the
                server automatically falls back to the deterministic blueprint and tells you so. AI is never required.
              </li>
              <li>
                Google processes the personalization request under its own terms for the Gemini API (including its
                data-use policies for that service). This policy does not govern Google’s processing; review Google’s
                terms if that matters to you.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">5. Consultation requests</h2>
            <p className="mt-3">
              If you fill in the consultation form, you submit: name, email address, optional company and message, your
              consent, and a small blueprint context (industry, size tier, selected goals, top finding titles). What
              happens then depends on the deployment’s configuration:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>When a request database (Cloudflare D1) is configured:</strong> your request is stored in that
                database, and the form confirms the result honestly — including the difference between “saved” and “the
                operator was notified”. Stored requests are retrieved by the operator; nothing is sent anywhere else.
              </li>
              <li>
                <strong>When an operator notification webhook is configured:</strong> the operator is notified of new
                stored requests automatically. The webhook is server-side only.
              </li>
              <li>
                <strong>When no database is configured:</strong> nothing is stored. The form says so and offers a
                pre-filled email (using the operator’s configured contact email) that you send yourself.
              </li>
              <li>
                <strong>If storage or notification fails:</strong> you are told exactly which part failed. The form
                never displays a fake success.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">6. Third parties involved</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Cloudflare</strong> — hosts the site, the API endpoints and (optionally) the request database.
                Cloudflare processes request metadata (such as IP address) as part of serving the site and applies
                abuse protection.
              </li>
              <li>
                <strong>Google</strong> — receives your questionnaire answers for the personalization step
                <em> only if you opt in</em>, as described in section 4.
              </li>
              <li>
                <strong>Operator notification service</strong> — if configured, receives new consultation-request
                notifications server-side. It is configured by the operator, not by you.
              </li>
            </ul>
            <p className="mt-3">
              No other third parties receive your data from this tool. There are no advertising or analytics trackers
              on the planner itself.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">7. What we do not do</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>We do not sell or rent your information.</li>
              <li>We do not share your information with advertisers or data brokers.</li>
              <li>We do not build advertising profiles or track you across other websites.</li>
              <li>We do not ask for information about your customers.</li>
              <li>
                We do not claim compliance with GDPR, CCPA or any other regime in this draft — that assessment requires
                legal review (see the notice at the top).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">8. Retention and deletion</h2>
            <p className="mt-3">
              Questionnaire answers: stored only in your browser until you delete them (“Start over” or clearing site
              data). Blueprint generation requests: not persisted by the application.
            </p>
            <p className="mt-3">
              Consultation requests: kept in the request database as long as useful for the consultation relationship;
              the operator has not committed to a fixed retention period in this draft, and none is invented here. To
              ask what was stored or to request deletion, use the contact address in “Contact”.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">9. Security</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>API keys and provider credentials exist only server-side, never in your browser.</li>
              <li>All API inputs are size-limited and strictly validated.</li>
              <li>
                Abuse protection includes per-connection request limits in the application; the operator is expected to
                enable Cloudflare-level rate limiting as documented in the deployment guide.
              </li>
              <li>No payment card data is handled anywhere in this tool.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">10. Children</h2>
            <p className="mt-3">
              This is a business tool aimed at business owners. It is not directed at children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">11. Changes to this policy</h2>
            <p className="mt-3">
              If the data practices change, this document will be updated and the “last updated” date above will
              change. The code and this policy are versioned together (v1.0.1 as of this update).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-900">12. Contact</h2>
            <p className="mt-3">
              Questions about your information or this policy can be sent to the operator’s configured contact email
              for this deployment.
            </p>
            <div className="mt-3 rounded-xl border-2 border-rose-200 bg-rose-50 p-4 text-[13px] leading-relaxed text-rose-900">
              <p className="font-bold">Launch blocker (operator note):</p>
              <p className="mt-1">
                The operator contact email is set with the <code>CONTACT_EMAIL</code> environment variable. If this
                deployment shows no contact address anywhere, the variable has not been configured yet — the operator
                must set it (and verify it receives mail) before commercial launch. Until then, no contact address is
                displayed anywhere rather than displaying a wrong or invented one.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 border-t border-brand-100 pt-6 text-xs leading-relaxed text-ink/45">
          <p>
            This policy is also available in the project source at <code>docs/PRIVACY.md</code>. It is a draft: it must
            be reviewed by qualified legal counsel, and adapted to the operator’s real entity and jurisdiction, before
            the tool is offered commercially.
          </p>
        </div>
      </main>

      <footer className="no-print border-t border-brand-100 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-ink/50">
          WebThangs Business Operations Planner — a free planning tool for US home-services businesses.{' '}
          <a href="/" className="font-semibold text-brand-700 underline hover:text-brand-800">
            Back to the planner
          </a>
        </div>
      </footer>
    </div>
  )
}
