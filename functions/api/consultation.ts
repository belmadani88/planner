/**
 * POST /api/consultation — consented consultation-request capture.
 *
 * Honesty rules (spec 10.3):
 *  - Never pretend a lead was submitted when it was not stored or delivered.
 *  - If the optional D1 database is not bound, the endpoint says so and the
 *    UI falls back to an email link using CONTACT_EMAIL.
 *  - Explicit consent is required; only minimal fields are accepted.
 */

import { z } from 'zod'
import { rateLimit, clientKey } from '../../src/server/ratelimit'
import { json, errorJson, readJsonBody } from '../../src/server/respond'

interface Env {
  DB?: D1Database
  CONTACT_EMAIL?: string
}

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

  /* D1 bound → store. */
  if (env.DB) {
    try {
      await env.DB.prepare(
        `INSERT INTO consultation_requests (name, email, company, message, industry, size_tier, goals, top_findings, consent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
      )
        .bind(
          data.name,
          data.email,
          data.company ?? '',
          data.message ?? '',
          data.context?.industry ?? '',
          data.context?.sizeTier ?? '',
          (data.context?.goals ?? []).join(','),
          (data.context?.topFindings ?? []).join(' | ')
        )
        .run()
      return json({
        ok: true,
        stored: true,
        message: 'Thank you — your request was received. WebThangs will be in touch.'
      })
    } catch (e) {
      // Storage failed — do NOT pretend it worked.
      return json({
        ok: true,
        stored: false,
        message: 'We could not save your request automatically right now — please use the email link below instead.',
        contactEmail: env.CONTACT_EMAIL ?? null
      })
    }
  }

  /* No D1 → honest fallback with contact email. */
  return json({
    ok: true,
    stored: false,
    message: 'This deployment has no request database configured — please use the email link below, which includes your blueprint context.',
    contactEmail: env.CONTACT_EMAIL ?? null
  })
}

export const onRequest: PagesFunction<Env> = async () => {
  return errorJson('METHOD_NOT_ALLOWED', 'Use POST for /api/consultation.', 405)
}
