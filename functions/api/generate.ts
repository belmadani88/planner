/**
 * POST /api/generate — the blueprint generation endpoint.
 *
 * Flow:
 *  1. Rate limit + body size limits (best-effort per-isolate; a Cloudflare WAF
 *     rate-limiting rule on /api/* is REQUIRED for a global guarantee — see
 *     docs/DEPLOYMENT.md "Hardening").
 *  2. Zod-validate the questionnaire answers against the question bank and
 *     strip industry-specific selections that do not belong to the chosen
 *     industry (stale state can never poison the assessment).
 *  3. Rebuild the deterministic blueprint SERVER-SIDE (single source of truth;
 *     the client's copy can never inject content).
 *  4. If the visitor declined AI personalization (body.ai === false), no data
 *     is forwarded to Google Gemini — the deterministic blueprint is returned
 *     with an honest AI_DECLINED notice.
 *  5. If no GEMINI_API_KEY / AI disabled → deterministic blueprint + honest
 *     notice.
 *  6. Otherwise call Gemini (structured output), validate + sanitize, merge.
 *  7. On ANY AI failure → deterministic blueprint + honest notice. The app
 *     never breaks because of the AI.
 *
 * API keys live only in server-side env — never in the browser.
 */

import type { Answers } from '../../src/types/answers'
import { AnswersSchema, checkCompleteness, sanitizeServicesForIndustry } from '../../src/schemas/answers'
import { buildDeterministicBlueprint } from '../../src/engine'
import { generatePersonalization, GeminiError, geminiNotice, AI_DECLINED_NOTICE } from '../../src/server/gemini'
import { rateLimit, clientKey } from '../../src/server/ratelimit'
import { json, errorJson, readJsonBody } from '../../src/server/respond'

interface Env {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  GEMINI_FALLBACK_MODELS?: string
  AI_ENABLED?: string
}

/* Minimal structural types so this file type-checks in both the Workers and
   the DOM type worlds (the ambient PagesFunction global only exists in the
   Workers config). Runtime behavior is identical — Cloudflare passes the same
   context object. */
type PagesFunction<E> = (ctx: { request: Request; env: E }) => Promise<Response> | Response

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  /* 1. Rate limit: 8 generations per hour per IP (best-effort, per-isolate). */
  const rl = rateLimit(`generate:${clientKey(request)}`, 8, 60 * 60 * 1000)
  if (!rl.ok) {
    return errorJson(
      'RATE_LIMITED',
      `Too many blueprints generated from this connection. Please wait ${Math.ceil(rl.resetInSeconds / 60)} minutes and try again.`,
      429
    )
  }

  /* 2. Parse + validate input. */
  let body: Record<string, unknown>
  try {
    body = await readJsonBody(request, 48_000)
  } catch (e) {
    return errorJson('BAD_REQUEST', 'Request body must be JSON under 48KB.', 400)
  }

  const answersResult = AnswersSchema.safeParse(body.answers)
  if (!answersResult.success) {
    return errorJson(
      'INVALID_ANSWERS',
      `Questionnaire answers failed validation: ${answersResult.error.issues.slice(0, 3).map((i) => i.path.join('.')).join(', ')}`,
      400
    )
  }

  /* v1.0.1: drop industry-specific answers that don't belong to the chosen
     industry (e.g. stale HVAC service selections after switching to plumbing).
     Shared answers that are valid in the new industry are preserved. */
  const answers = sanitizeServicesForIndustry(answersResult.data as Answers) as Answers

  const missing = checkCompleteness(answers)
  if (missing.length > 0) {
    return errorJson('INCOMPLETE', `Some required answers are missing: ${missing.join(', ')}`, 400)
  }

  /* 3. Deterministic blueprint (always computed server-side). */
  const blueprint = buildDeterministicBlueprint(answers)

  /* 4. The visitor's explicit choice comes first: declined = no Gemini call,
        no questionnaire data forwarded to Google, full blueprint intact. */
  if (body.ai === false) {
    return json({
      ok: true,
      blueprint: { ...blueprint, meta: { ...blueprint.meta, notice: AI_DECLINED_NOTICE } },
      ai: null,
      notice: AI_DECLINED_NOTICE
    })
  }

  /* 5. AI optional and fail-safe. The notice travels BOTH as a top-level
        field and inside blueprint.meta.notice, so the report view can show it
        (v1.0.0 computed it but the report never displayed it). */
  const aiDisabled = (env.AI_ENABLED ?? 'on').toLowerCase() === 'off'
  if (!env.GEMINI_API_KEY || aiDisabled) {
    const notice = {
      code: (!env.GEMINI_API_KEY ? 'NO_API_KEY' : 'AI_DISABLED') as 'NO_API_KEY' | 'AI_DISABLED',
      message: !env.GEMINI_API_KEY
        ? 'AI personalization is not configured on this deployment. Your complete blueprint is shown in its standard form.'
        : 'AI personalization is disabled on this deployment. Your complete blueprint is shown in its standard form.'
    }
    return json({
      ok: true,
      blueprint: { ...blueprint, meta: { ...blueprint.meta, notice } },
      ai: null,
      notice
    })
  }

  try {
    const { personalization, model } = await generatePersonalization(
      env,
      answers as unknown as Record<string, unknown>,
      blueprint
    )
    return json({
      ok: true,
      blueprint: { ...blueprint, personalization, meta: { ...blueprint.meta, aiPersonalized: true, aiModel: model } },
      ai: { model },
      notice: null
    })
  } catch (e) {
    const err = e instanceof GeminiError ? e : new GeminiError('AI_ERROR', String(e))
    const notice = geminiNotice(err)
    return json({
      ok: true,
      blueprint: { ...blueprint, meta: { ...blueprint.meta, notice } },
      ai: null,
      notice
    })
  }
}

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  return errorJson('METHOD_NOT_ALLOWED', 'Use POST for /api/generate.', 405)
}
