/**
 * POST /api/consultation — consented consultation-request capture.
 *
 * Honesty rules (v1.0.1 — audit P0.3):
 *  - Never pretend a lead was submitted when it was not stored or delivered.
 *  - A D1 row alone is NOT a delivered lead: when D1 is bound, an optional
 *    notification adapter (LEAD_WEBHOOK_URL) tells the operator. The response
 *    distinguishes "stored" from "operator notified".
 *  - If notification is not configured, the response says the request was
 *    saved and will be retrieved by the operator's database review — the
 *    documented retrieval command lives in docs/DEPLOYMENT.md. It never
 *    promises an automatic contact that nothing guarantees.
 *  - If the optional D1 database is not bound, the endpoint says so and the
 *    UI falls back to an email link using CONTACT_EMAIL.
 *  - Explicit consent is required; only minimal fields are accepted.
 *  - Nothing sensitive is logged; provider credentials never reach the client.
 */

import { z } from 'zod'
import { rateLimit, clientKey } from '../../src/server/ratelimit'
import { notifyNewLead } from '../../src/server/notify'
import { json, errorJson, readJsonBody } from '../../src/server/respond'

/* Minimal structural types so this file type-checks in both the Workers and
   the DOM type worlds (see generate.ts). A real Cloudflare D1Database binding
   satisfies D1Like structurally. */
interface D1Like {
  prepare: (sql: string) => { bind: (...args: unknown[]) => { run: () => Promise<unknown> } }
}
interface Env {
  DB?: D1Like
  CONTACT_EMAIL?: string
  LEAD_WEBHOOK_URL?: string
}

type PagesFunction<E> = (ctx: { request: Request; env: E }) => Promise<Response> | Response

const ConsultationSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(120),
  company: z.string().max(80).optional().default(''),
  message: z.string().max(1500).optional().default(''),
  consent: z.literal(true),
  context: z
    .object({
      industry: z.string().max(40).optional(),
      sizeTier: z.string().max(40).optional(),
      goals: z.array(z.string().max(60)).max(11).optional(),
      topFindings: z.array(z.string().max(200)).max(6).optional()
    })
    .optional()
})

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rl = rateLimit(`consult:${clientKey(request)}`, 5, 60 * 60 * 1000)
  if (!rl.ok) {
    return errorJson('RATE_LIMITED', 'Too many requests from this connection. Please try again later.', 429)
  }

  let body: Record<string, unknown>
  try {
    body = await readJsonBody(request, 16_000)
  } catch {
    return errorJson('BAD_REQUEST', 'Request body must be JSON under 16KB.', 400)
  }

  const parsed = ConsultationSchema.safeParse(body)
  if (!parsed.success) {
    return errorJson(
      'INVALID_INPUT',
      `Validation failed: ${parsed.error.issues.slice(0, 3).map((i) => i.path.join('.')).join(', ')}. Consent is required.`,
      400
    )
  }

  const data = parsed.data
  const lead = {
    name: data.name,
    email: data.email,
    company: data.company ?? '',
    message: data.message ?? '',
    industry: data.context?.industry ?? '',
    sizeTier: data.context?.sizeTier ?? '',
    goals: data.context?.goals ?? [],
    topFindings: data.context?.topFindings ?? []
  }

  /* D1 bound → store, then notify (best effort, never fatal). */
  if (env.DB) {
    try {
      await env.DB.prepare(
        `INSERT INTO consultation_requests (name, email, company, message, industry, size_tier, goals, top_findings, consent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
      )
        .bind(
          lead.name,
          lead.email,
          lead.company,
          lead.message,
          lead.industry,
          lead.sizeTier,
          lead.goals.join(','),
          lead.topFindings.join(' | ')
        )
        .run()
    } catch {
      // Storage failed — do NOT pretend it worked.
      return json(
        {
          ok: true,
          stored: false,
          notified: false,
          message:
            'We could not save your request automatically right now — please use the email link below instead.',
          contactEmail: env.CONTACT_EMAIL ?? null
        },
        { status: 200 }
      )
    }

    // Stored. Now try to actually reach the operator.
    const notify = await notifyNewLead(env, lead)
    if (notify.delivered) {
      return json({
        ok: true,
        stored: true,
        notified: true,
        message:
          'Thank you — your request was saved and the WebThangs team has been notified. They will reply to the email you provided.'
      })
    }
    // Storage succeeded but nobody was pinged. Say exactly that.
    return json({
      ok: true,
      stored: true,
      notified: false,
      message:
        'Thank you — your request was saved to WebThangs\u2019 secure request database, which the team reviews regularly. If you need a faster answer, use the email link below.',
      contactEmail: env.CONTACT_EMAIL ?? null
    })
  }

  /* No D1 → honest fallback with contact email. */
  return json({
    ok: true,
    stored: false,
    notified: false,
    message:
      'This deployment has no request database configured — please use the email link below, which includes your blueprint context.',
    contactEmail: env.CONTACT_EMAIL ?? null
  })
}

export const onRequest: PagesFunction<Env> = async () => {
  return errorJson('METHOD_NOT_ALLOWED', 'Use POST for /api/consultation.', 405)
}
