/**
 * Optional lead-notification adapter (v1.0.1 — audit P0.3).
 *
 * Problem it solves: a D1 row is not a delivered lead. Without a notification,
 * nobody at WebThangs knows a consultation request arrived unless someone
 * remembers to query the database.
 *
 * Design rules:
 *  - Generic, free, no vendor lock-in: a single outbound HTTP POST to
 *    LEAD_WEBHOOK_URL. Works with Slack/Discord-style incoming webhooks, a
 *    self-hosted receiver, Zapier/Make catch hooks, or any inbox endpoint.
 *  - Purely optional. Absent configuration is reported honestly — never faked.
 *  - Credentials never reach the browser; everything here is server-side.
 *  - The webhook payload contains ONLY the fields the visitor consented to
 *    submit (no blueprint dumps, no internal data).
 *  - Nothing sensitive is logged: log lines carry outcome + status code only,
 *    never the visitor's name, email or message.
 */

export interface ConsultationLead {
  name: string
  email: string
  company: string
  message: string
  industry: string
  sizeTier: string
  goals: string[]
  topFindings: string[]
}

export interface NotifyResult {
  configured: boolean
  delivered: boolean
  /** HTTP status or error class — safe to log/return, contains no lead data. */
  detail: string
}

const WEBHOOK_TIMEOUT_MS = 10_000

export async function notifyNewLead(env: { LEAD_WEBHOOK_URL?: string }, lead: ConsultationLead): Promise<NotifyResult> {
  const url = env.LEAD_WEBHOOK_URL?.trim()
  if (!url) {
    return { configured: false, delivered: false, detail: 'LEAD_WEBHOOK_URL not configured' }
  }

  const payload = {
    text:
      'New consultation request from the WebThangs Operations Planner.\n' +
      `Name: ${lead.name}\n` +
      `Email: ${lead.email}\n` +
      (lead.company ? `Company: ${lead.company}\n` : '') +
      (lead.message ? `Message: ${lead.message}\n` : '') +
      `Industry: ${lead.industry}\n` +
      `Size: ${lead.sizeTier}\n` +
      (lead.goals.length ? `Goals: ${lead.goals.join(', ')}\n` : '') +
      (lead.topFindings.length ? `Top findings: ${lead.topFindings.join(' | ')}\n` : '') +
      `Stored in D1: yes`
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    if (res.ok) return { configured: true, delivered: true, detail: `webhook responded ${res.status}` }
    return { configured: true, delivered: false, detail: `webhook responded ${res.status}` }
  } catch (e) {
    const kind = e instanceof Error && e.name === 'AbortError' ? 'webhook timeout' : 'webhook network error'
    return { configured: true, delivered: false, detail: kind }
  } finally {
    clearTimeout(timer)
  }
}
