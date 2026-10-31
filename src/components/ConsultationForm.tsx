/**
 * Consultation request form (Section 12).
 *
 * Honesty rules: explicit consent required; the result message never claims
 * a submission that didn't happen; if no database is configured, the visitor
 * gets an email fallback with their blueprint context prefilled.
 */

import { useState } from 'react'
import { CalendarCheck, Copy, Check, Loader2, Mail, ShieldCheck } from 'lucide-react'
import type { Blueprint } from '../types/blueprint'
import { submitConsultation } from '../lib/api'

type Status = 'idle' | 'sending' | 'stored' | 'fallback' | 'error'

export function ConsultationForm({ blueprint }: { blueprint: Blueprint }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [resultMessage, setResultMessage] = useState('')
  const [contactEmail, setContactEmail] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const valid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && consent

  const context = {
    industry: blueprint.meta.industry,
    sizeTier: blueprint.profile.classification.sizeLabel,
    goals: blueprint.profile.goals,
    topFindings: blueprint.assessment.findings.slice(0, 5).map((f) => f.title)
  }

  async function submit() {
    setStatus('sending')
    try {
      const res = await submitConsultation({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        message: message.trim() || undefined,
        consent,
        context
      })
      if (res.ok && res.stored) {
        setStatus('stored')
        setResultMessage(res.message)
      } else if (res.ok) {
        setStatus('fallback')
        setResultMessage(res.message)
        setContactEmail(res.contactEmail)
      } else {
        setStatus('error')
        setResultMessage(res.message || 'Something went wrong — please try again.')
      }
    } catch {
      setStatus('fallback')
      setResultMessage(
        'We could not send your request automatically from this page. Please email us using the link below — it includes your blueprint context.'
      )
    }
  }

  const mailtoHref = () => {
    const subject = `Consultation request — ${blueprint.meta.industry.toUpperCase()} business (${context.sizeTier})`
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : '',
      message ? `Message: ${message}` : '',
      '',
      'Blueprint context:',
      `Industry: ${context.industry}`,
      `Size: ${context.sizeTier}`,
      `Goals: ${context.goals.join(', ')}`,
      `Top findings: ${context.topFindings.join(' | ')}`
    ]
      .filter(Boolean)
      .join('\n')
    const to = contactEmail ?? 'hello@webthangs.example'
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (status === 'stored') {
    return (
      <div className="card border-l-4 !border-l-brand-500 p-6">
        <CalendarCheck className="h-8 w-8 text-brand-600" />
        <h3 className="mt-3 text-lg font-bold text-brand-900">Request received</h3>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink/70">{resultMessage}</p>
      </div>
    )
  }

  return (
    <div className="card p-6 sm:p-7">
      <h3 className="text-lg font-bold text-brand-900">{blueprint.consultation.ctaText}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/60">
        Takes 30 seconds. We use your blueprint context to come prepared — no generic sales script.
      </p>

      {status === 'fallback' ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-900">Almost there — one more click</p>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-900/80">{resultMessage}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={mailtoHref()} className="btn-primary !bg-amber-600 hover:!bg-amber-700">
              <Mail className="h-4 w-4" /> Open a pre-filled email
            </a>
            <button
              className="btn-secondary"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Consultation request\nName: ${name}\nEmail: ${email}\nIndustry: ${context.industry}\nSize: ${context.sizeTier}\nGoals: ${context.goals.join(', ')}\nTop findings: ${context.topFindings.join(' | ')}`
                )
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy my summary'}
            </button>
          </div>
          <p className="mt-3 text-xs text-amber-800/70">
            We never pretend a request was stored when it wasn’t — this deployment has no request database, so email is the honest path.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/70">Your name *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="Jordan Rivera"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink/70">Email *</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="you@yourcompany.com"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-ink/70">Company name</span>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="Rivera Heating & Air"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-ink/70">Anything specific you want help with? (optional)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={1500}
                className="w-full resize-none rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="e.g. We want the missed-call text-back and the follow-up sequences set up before summer."
              />
            </label>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-paper p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700"
            />
            <span className="text-xs leading-relaxed text-ink/60">
              I agree that WebThangs may contact me about this request using the details above. My blueprint answers and
              this message are used only to prepare the consultation — never sold, never shared, and I can ask for
              deletion at any time. *
            </span>
          </label>

          {status === 'error' && (
            <p className="mt-3 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{resultMessage}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button onClick={submit} disabled={!valid || status === 'sending'} className="btn-primary">
              {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
              {status === 'sending' ? 'Sending…' : 'Request my consultation'}
            </button>
            <p className="flex items-center gap-1.5 text-[11px] text-ink/45">
              <ShieldCheck className="h-3.5 w-3.5" /> Required fields marked * · Consent is mandatory
            </p>
          </div>
        </>
      )}
    </div>
  )
}
