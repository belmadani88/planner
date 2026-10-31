/**
 * POST /api/generate — the AI personalization endpoint.
 *
 * Flow:
 *  1. Rate limit + body size limits.
 *  2. Zod-validate the questionnaire answers against the question bank.
 *  3. Rebuild the deterministic blueprint SERVER-SIDE (single source of truth;
 *     the client's copy can never inject content).
 *  4. If no GEMINI_API_KEY / AI disabled → return the deterministic blueprint
 *     with an honest notice.
 *  5. Otherwise call Gemini (structured output), validate + sanitize, merge.
 *  6. On ANY AI failure → deterministic blueprint + honest notice. The app
 *     never breaks because of the AI.
 *
 * API keys live only in server-side env — never in the browser.
 */

import type { Answers } from '../../src/types/answers'
import { AnswersSchema, checkCompleteness } from '../../src/schemas/answers'
import { buildDeterministicBlueprint } from '../../src/engine'
import { generatePersonalization, GeminiError, geminiNotice } from '../../src/server/gemini'
import { rateLimit, clientKey } from '../../src/server/ratelimit'
import { json, errorJson, readJsonBody } from '../../src/server/respond'

interface Env {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  GEMINI_FALLBACK_MODELS?: string
  AI_ENABLED?: string
}

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
  const answers = answersResult.data as Answers

  const missing = checkCompleteness(answers)
  if (missing.length > 0) {
    return errorJson('INCOMPLETE', `Some required answers are missing: ${missing.join(', ')}`, 400)
  }

  /* 3. Deterministic blueprint (always computed server-side). */
  const blueprint = buildDeterministicBlueprint(answers)

  /* 4. AI optional and fail-safe. */
  const aiDisabled = (env.AI_ENABLED ?? 'on').toLowerCase() === 'off'
  if (!env.GEMINI_API_KEY || aiDisabled) {
    return json({
      ok: true,
      blueprint,
      ai: null,
      notice: {
        code: !env.GEMINI_API_KEY ? 'NO_API_KEY' : 'AI_DISABLED',
        message: !env.GEMINI_API_KEY
          ? 'AI personalization is not configured on this deployment. Your complete blueprint is shown in its standard form.'
          : 'AI personalization is disabled on this deployment. Your complete blueprint is shown in its standard form.'
      }
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
    return json({
      ok: true,
      blueprint,
      ai: null,
      notice: geminiNotice(err)
    })
  }
}

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  return errorJson('METHOD_NOT_ALLOWED', 'Use POST for /api/generate.', 405)
}
