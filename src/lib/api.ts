/**
 * Client API layer.
 *
 * The blueprint is ALWAYS built locally by the deterministic engine first —
 * so the product works even as a purely static site with no Functions at all.
 * The /api/generate call then tries to upgrade it with Gemini personalization
 * (server-side key, never in the browser). Any failure degrades gracefully.
 */

import type { Answers } from '../types/answers'
import type { Blueprint, BlueprintNotice } from '../types/blueprint'
import { buildDeterministicBlueprint } from '../engine'

export interface GenerateOutcome {
  blueprint: Blueprint
  notice: BlueprintNotice | null
  aiModel: string | null
}

export async function generateBlueprint(answers: Answers): Promise<GenerateOutcome> {
  // 1. Local, instant, always works.
  const local = buildDeterministicBlueprint(answers)

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 40_000)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
      signal: controller.signal
    })
    clearTimeout(timer)

    if (res.status === 429) {
      return { blueprint: local, notice: { code: 'AI_ERROR', message: 'Too many blueprints were generated from this connection recently. Your blueprint is complete — only the AI-written summary is unavailable.' }, aiModel: null }
    }
    if (!res.ok) {
      // Server reachable but rejected input — fall back to local result.
      return { blueprint: local, notice: null, aiModel: null }
    }

    const data = (await res.json()) as {
      ok: boolean
      blueprint?: Blueprint
      notice?: BlueprintNotice | null
      ai?: { model: string } | null
    }
    if (data.ok && data.blueprint) {
      return {
        blueprint: data.blueprint,
        notice: data.notice ?? null,
        aiModel: data.ai?.model ?? null
      }
    }
    return { blueprint: local, notice: null, aiModel: null }
  } catch {
    // Functions not deployed (pure static hosting) or network error:
    // the deterministic blueprint stands alone.
    return { blueprint: local, notice: null, aiModel: null }
  }
}

export interface ConsultationResult {
  ok: boolean
  stored: boolean
  message: string
  contactEmail: string | null
}

export async function submitConsultation(payload: {
  name: string
  email: string
  company?: string
  message?: string
  consent: boolean
  context: {
    industry: string
    sizeTier: string
    goals: string[]
    topFindings: string[]
  }
}): Promise<ConsultationResult> {
  const res = await fetch('/api/consultation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (res.status === 429) {
    return { ok: false, stored: false, message: 'Too many requests — please try again in a few minutes.', contactEmail: null }
  }
  const data = (await res.json()) as ConsultationResult & { ok: boolean }
  return {
    ok: data.ok,
    stored: data.stored,
    message: data.message,
    contactEmail: data.contactEmail ?? null
  }
}
