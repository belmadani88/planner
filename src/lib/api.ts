/**
 * Client API layer.
 *
 * The blueprint is ALWAYS built locally by the deterministic engine first —
 * so the product works even as a purely static site with no Functions at all.
 * The /api/generate call then tries to upgrade it with Gemini personalization
 * (server-side key, never in the browser) — but ONLY when the visitor opted
 * in on the final questionnaire step. Any failure degrades gracefully.
 */

import type { Answers } from '../types/answers'
import type { Blueprint, BlueprintNotice } from '../types/blueprint'
import { buildDeterministicBlueprint } from '../engine'

const AI_DECLINED_LOCAL_NOTICE: BlueprintNotice = {
  code: 'AI_DECLINED',
  message:
    'You chose the standard blueprint, so no AI-written personalization was used and your answers were not sent to Google Gemini. Every recommendation, number and diagram below comes from the deterministic engine.'
}

export interface GenerateOutcome {
  blueprint: Blueprint
  notice: BlueprintNotice | null
  aiModel: string | null
}

export async function generateBlueprint(
  answers: Answers,
  opts?: { aiPersonalization?: boolean }
): Promise<GenerateOutcome> {
  // 1. Local, instant, always works.
  const local = buildDeterministicBlueprint(answers)
  const allowAi = opts?.aiPersonalization === true

  if (!allowAi) {
    // The visitor declined optional AI personalization: no API request, no
    // answers submitted, deterministic blueprint only. Honest notice included.
    return {
      blueprint: { ...local, meta: { ...local.meta, notice: AI_DECLINED_LOCAL_NOTICE } },
      notice: AI_DECLINED_LOCAL_NOTICE,
      aiModel: null
    }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 40_000)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, ai: true }),
      signal: controller.signal
    })
    clearTimeout(timer)

    if (res.status === 429) {
      const notice = { code: 'AI_ERROR', message: 'Too many blueprints were generated from this connection recently. Your blueprint is complete — only the AI-written summary is unavailable.' } as BlueprintNotice
      return { blueprint: { ...local, meta: { ...local.meta, notice } }, notice, aiModel: null }
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
  /** v1.0.1: true only when the operator notification actually went out. */
  notified?: boolean
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
    return { ok: false, stored: false, notified: false, message: 'Too many requests — please try again in a few minutes.', contactEmail: null }
  }
  const data = (await res.json()) as ConsultationResult & { ok: boolean }
  return {
    ok: data.ok,
    stored: data.stored,
    notified: data.notified ?? false,
    message: data.message,
    contactEmail: data.contactEmail ?? null
  }
}
