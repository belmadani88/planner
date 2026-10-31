/**
 * Gemini personalization layer — server-side only.
 *
 * Design rules (from the spec):
 *  - Official REST API via fetch (no SDK dependency in the Workers runtime).
 *  - Structured JSON output via responseMimeType + responseSchema.
 *  - Model name configurable (GEMINI_MODEL) with an automatic fallback chain.
 *  - The AI only produces narrative text inside a validated schema — it never
 *    decides software, workflows, prices or numbers (the deterministic engine
 *    owns those).
 *  - Every response is Zod-validated and screened for unsupported software
 *    claims before it can be merged into a blueprint.
 *  - On any failure the caller receives a typed error and shows the
 *    deterministic blueprint instead.
 */

import type { Blueprint } from '../types/blueprint'
import type { Personalization } from '../types/blueprint'
import { PersonalizationSchema, screenForUnsupportedSoftware } from '../schemas/blueprint'
import { compactBlueprintForAI } from '../engine'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const REQUEST_TIMEOUT_MS = 30_000

export class GeminiError extends Error {
  code:
    | 'QUOTA'
    | 'MODEL_NOT_FOUND'
    | 'INVALID_AI_RESPONSE'
    | 'AI_TIMEOUT'
    | 'AI_ERROR'
  status?: number
  constructor(code: GeminiError['code'], message: string, status?: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

interface EnvLike {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  GEMINI_FALLBACK_MODELS?: string
}

/** Gemini OpenAPI-subset schema for structured output. */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    executiveSummary: { type: 'string' },
    stageInsights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stageId: { type: 'integer' },
          insight: { type: 'string' },
          tip: { type: 'string' }
        },
        required: ['stageId', 'insight', 'tip']
      }
    },
    contextualNotes: { type: 'array', items: { type: 'string' } },
    roadmapNarrative: { type: 'string' },
    improvementNarrative: { type: 'string' },
    consultationMessage: { type: 'string' }
  },
  required: [
    'executiveSummary',
    'stageInsights',
    'contextualNotes',
    'roadmapNarrative',
    'improvementNarrative',
    'consultationMessage'
  ]
} as const

const SYSTEM_INSTRUCTION = `You are the plain-language explainer inside a free business tool for home-services business owners (HVAC, plumbing, roofing, electrical, restoration, remodeling, landscaping).

The tool has already computed a complete business operations blueprint using a deterministic rules engine. Your ONLY job is to write the narrative text that personalizes it.

ABSOLUTE RULES:
1. Write for a busy owner with ZERO technical knowledge. No jargon: never say CRM, API, webhook, integration, orchestration, funnel, attribution, KPI, automation pipeline. Say "your customer system", "the software talks to each other", "a reminder is sent automatically".
2. Only use software names that appear in the provided SOFTWARE STACK list. Never mention any other product.
3. Never invent prices, statistics, benchmarks, guarantees or ROI promises. Never promise revenue increases.
4. Stay within the findings and recommendations provided. Do not add new problems, new workflows or new recommendations.
5. If the input says something is unknown, acknowledge it plainly ("you weren't sure, so...").
6. Warm, respectful, concrete. Short sentences. No markdown, no bullet characters, no emoji.
7. Reference the owner's specific situation (their trade, team size, what they told us) so it reads personal.
8. Be honest about what is estimated vs known.`

function buildUserPrompt(answers: Record<string, unknown>, blueprint: Blueprint): string {
  const payload = {
    note: 'Everything below was computed deterministically from the owner questionnaire. Personalize the narrative only.',
    ownerAnswers: answers,
    blueprintSummary: compactBlueprintForAI(blueprint),
    softwareStack: blueprint.software.stack.map((s) => s.name)
  }
  return JSON.stringify(payload)
}

async function callModel(
  model: string,
  apiKey: string,
  answers: Record<string, unknown>,
  blueprint: Blueprint
): Promise<Personalization> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(answers, blueprint) }] }],
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA
        }
      })
    })

    if (res.status === 429) {
      throw new GeminiError('QUOTA', 'Gemini free-tier quota exhausted.', 429)
    }
    if (res.status === 404 || res.status === 400) {
      const body = (await res.text()).slice(0, 500)
      throw new GeminiError('MODEL_NOT_FOUND', `Model "${model}" rejected: ${body}`, res.status)
    }
    if (!res.ok) {
      throw new GeminiError('AI_ERROR', `Gemini API error ${res.status}.`, res.status)
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new GeminiError('INVALID_AI_RESPONSE', 'Gemini returned no text content.')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new GeminiError('INVALID_AI_RESPONSE', 'Gemini returned non-JSON content despite the schema.')
    }

    /* ── Validation engine: schema, then software screening ─────────────── */
    const result = PersonalizationSchema.safeParse(parsed)
    if (!result.success) {
      throw new GeminiError('INVALID_AI_RESPONSE', `Schema validation failed: ${result.error.issues.slice(0, 3).map((i) => i.path.join('.')).join(', ')}`)
    }

    const p = result.data
    const allText = [
      p.executiveSummary,
      ...p.stageInsights.map((s) => `${s.insight} ${s.tip}`),
      ...p.contextualNotes,
      p.roadmapNarrative,
      p.improvementNarrative,
      p.consultationMessage
    ].join(' \n ')
    const badSoftware = screenForUnsupportedSoftware(allText)
    if (badSoftware) {
      throw new GeminiError('INVALID_AI_RESPONSE', `AI mentioned unsupported software: ${badSoftware}`)
    }

    return p
  } catch (e) {
    if (e instanceof GeminiError) throw e
    if (e instanceof Error && e.name === 'AbortError') {
      throw new GeminiError('AI_TIMEOUT', 'Gemini request timed out.')
    }
    throw new GeminiError('AI_ERROR', e instanceof Error ? e.message : 'Unknown Gemini error.')
  } finally {
    clearTimeout(timer)
  }
}

export interface GeminiResult {
  personalization: Personalization
  model: string
}

export async function generatePersonalization(
  env: EnvLike,
  answers: Record<string, unknown>,
  blueprint: Blueprint
): Promise<GeminiResult> {
  const apiKey = env.GEMINI_API_KEY!
  const primary = env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash'
  // v1.0.1: default fallback chain verified against ai.google.dev/gemini-api/docs/models
  // (Oct 2026). `gemini-flash-latest` is a maintained alias; `gemini-3.6-flash` is a
  // stable Flash-generation model. `gemini-2.5-flash` was dropped from the defaults
  // because Google lists it as limited-access for API projects that have not used it
  // before — a brand-new key could not fall back to it. Overridable via env.
  const fallbacks = (env.GEMINI_FALLBACK_MODELS ?? 'gemini-flash-latest,gemini-3.6-flash')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)

  const models = [primary, ...fallbacks.filter((m) => m !== primary)]
  let lastError: GeminiError | null = null

  for (const model of models) {
    try {
      const personalization = await callModel(model, apiKey, answers, blueprint)
      return { personalization, model }
    } catch (e) {
      const err = e instanceof GeminiError ? e : new GeminiError('AI_ERROR', String(e))
      // Only fall through to the next model for model-availability problems.
      if (err.code === 'MODEL_NOT_FOUND') {
        lastError = err
        continue
      }
      throw err
    }
  }
  throw lastError ?? new GeminiError('AI_ERROR', 'No models available.')
}

export function geminiNotice(e: GeminiError): { code: string; message: string } {
  const messages: Record<GeminiError['code'], string> = {
    QUOTA: 'AI personalization is temporarily unavailable (the free AI quota is used up). Your complete blueprint is shown in its standard form — all recommendations are unaffected.',
    MODEL_NOT_FOUND: 'The configured AI model is not available for this API key. Your complete blueprint is shown in its standard form.',
    INVALID_AI_RESPONSE: 'The AI response did not pass validation, so it was discarded for your safety. Your complete blueprint is shown in its standard form.',
    AI_TIMEOUT: 'AI personalization took too long and was skipped. Your complete blueprint is shown in its standard form.',
    AI_ERROR: 'AI personalization is unavailable right now. Your complete blueprint is shown in its standard form.'
  }
  return { code: e.code, message: messages[e.code] }
}

/** Notice used when the visitor explicitly declined optional AI personalization. */
export const AI_DECLINED_NOTICE = {
  code: 'AI_DECLINED',
  message:
    'You chose the standard blueprint, so no AI-written personalization was used and your answers were not sent to Google Gemini. Every recommendation, number and diagram below comes from the deterministic engine.'
} as const
