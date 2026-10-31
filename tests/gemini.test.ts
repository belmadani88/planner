/**
 * v1.0.1 — Gemini integration failure modes (audit P1.4).
 *
 * Covers all 11 required conditions. In EVERY one of them the endpoint must
 * return HTTP 200 with the COMPLETE deterministic blueprint and an honest
 * notice — the product never breaks because of the AI.
 *
 * The live Gemini call itself is NOT VERIFIED in this environment: no usable
 * API key is configured in the sandbox, and the protocol forbids fabricating
 * one. These tests verify everything around the live call with stubbed fetch.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestPost } from '../functions/api/generate'
import { DEMO_SCENARIOS } from '../src/data/demoScenarios'
import type { Answers } from '../src/types/answers'

const URL = 'https://planner.example.com/api/generate'
const answers = DEMO_SCENARIOS[0].answers as Answers

let ipCounter = 0
function post(body: unknown): Request {
  ipCounter += 1
  return new Request(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `198.51.100.${ipCounter}` },
    body: JSON.stringify(body)
  })
}

const envWithKey = {
  GEMINI_API_KEY: 'test-key-for-stubbed-tests-only',
  GEMINI_MODEL: 'gemini-3.8-flash',
  GEMINI_FALLBACK_MODELS: 'gemini-flash-latest'
}

async function call(env: Record<string, unknown>, req: Request) {
  return onRequestPost({ request: req, env: env as never } as never)
}

interface Outcome {
  ok: boolean
  blueprint?: {
    meta: { aiPersonalized: boolean; notice?: { code: string; message: string } | null }
    profile: { summary: string }
  }
  notice?: { code: string; message: string } | null
  ai?: { model: string } | null
}

async function outcomeFor(env: Record<string, unknown>, body: unknown): Promise<Outcome> {
  const res = await call(env, post(body))
  expect(res.status).toBe(200)
  return (await res.json()) as Outcome
}

/** A minimal well-formed Gemini generateContent response. */
function geminiOk(text: string) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 })
}

const goodAiJson = JSON.stringify({
  executiveSummary: 'A short honest summary of the plan.',
  stageInsights: [{ stageId: 3, insight: 'Responding within the hour is a strength to build on.', tip: 'Try the 15-minute rule.' }],
  contextualNotes: ['You mentioned faster responses as a priority.'],
  roadmapNarrative: 'Phase one focuses on the front door of the business.',
  improvementNarrative: 'Expect fewer lost callers and faster quotes.',
  consultationMessage: 'Help is available if you want it.'
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('P1.4 — every AI failure leaves the deterministic blueprint intact', () => {
  it('1. no API key → deterministic blueprint + NO_API_KEY notice', async () => {
    const out = await outcomeFor({}, { answers, ai: true })
    expect(out.ok).toBe(true)
    expect(out.blueprint!.meta.aiPersonalized).toBe(false)
    expect(out.notice!.code).toBe('NO_API_KEY')
    expect(out.blueprint!.meta.notice?.code).toBe('NO_API_KEY')
  })

  it('2. AI declined → deterministic blueprint, NO fetch call to Gemini, AI_DECLINED notice', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const out = await outcomeFor(envWithKey, { answers, ai: false })
    expect(out.ok).toBe(true)
    expect(out.blueprint!.meta.aiPersonalized).toBe(false)
    expect(out.notice!.code).toBe('AI_DECLINED')
    expect(out.blueprint!.meta.notice?.code).toBe('AI_DECLINED')
    expect(out.ai).toBeNull()
    // the visitor's answers were never forwarded anywhere
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('3. invalid API key (401) → AI_ERROR notice, full blueprint returned', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Unauthorized', { status: 401 })))
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.blueprint!.meta.aiPersonalized).toBe(false)
    expect(out.blueprint!.profile.summary.length).toBeGreaterThan(20)
    expect(out.notice!.code).toBe('AI_ERROR')
  })

  it('4. rate-limit response (429) → QUOTA notice, full blueprint returned', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('quota', { status: 429 })))
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.notice!.code).toBe('QUOTA')
    expect(out.blueprint!.profile.summary.length).toBeGreaterThan(20)
  })

  it('5. network failure → AI_ERROR notice, full blueprint returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('fetch failed: ECONNREFUSED')
      })
    )
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.notice!.code).toBe('AI_ERROR')
    expect(out.blueprint!.meta.aiPersonalized).toBe(false)
  })

  it('6. request timeout (AbortError) → AI_TIMEOUT notice, full blueprint returned', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw abort
      })
    )
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.notice!.code).toBe('AI_TIMEOUT')
  })

  it('7. malformed Gemini response (no candidates) → INVALID_AI_RESPONSE, full blueprint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ weird: true }), { status: 200 })))
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.notice!.code).toBe('INVALID_AI_RESPONSE')
    expect(out.blueprint!.meta.aiPersonalized).toBe(false)
  })

  it('8. invalid JSON inside the text part → INVALID_AI_RESPONSE', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => geminiOk('this is not { valid json')))
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.notice!.code).toBe('INVALID_AI_RESPONSE')
  })

  it('9. schema validation failure (missing required fields) → INVALID_AI_RESPONSE', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => geminiOk(JSON.stringify({ executiveSummary: 'only this field' })))
    )
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.notice!.code).toBe('INVALID_AI_RESPONSE')
  })

  it('10. unsupported primary model (404) → falls back through the chain, then succeeds', async () => {
    const fetchSpy = vi.fn(async (url: string | URL) =>
      String(url).includes('gemini-3.8-flash')
        ? new Response('model not found', { status: 404 })
        : geminiOk(goodAiJson)
    )
    vi.stubGlobal('fetch', fetchSpy)
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(fetchSpy).toHaveBeenCalledTimes(2) // primary failed, fallback tried
    expect(out.ok).toBe(true)
    expect(out.ai!.model).toBe('gemini-flash-latest')
    expect(out.blueprint!.meta.aiPersonalized).toBe(true)
  })

  it('10b. all models unavailable → MODEL_NOT_FOUND notice, deterministic blueprint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })))
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.notice!.code).toBe('MODEL_NOT_FOUND')
    expect(out.blueprint!.meta.aiPersonalized).toBe(false)
  })

  it('11. Gemini mentions unsupported software → response discarded, deterministic blueprint', async () => {
    const poisoned = JSON.stringify({
      ...JSON.parse(goodAiJson),
      executiveSummary: 'You should also connect Salesforce to run your pipeline.'
    })
    vi.stubGlobal('fetch', vi.fn(async () => geminiOk(poisoned)))
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.notice!.code).toBe('INVALID_AI_RESPONSE')
    expect(out.blueprint!.meta.aiPersonalized).toBe(false)
  })

  it('12. valid Gemini response → merged, validated, personalized', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => geminiOk(goodAiJson)))
    const out = await outcomeFor(envWithKey, { answers, ai: true })
    expect(out.blueprint!.meta.aiPersonalized).toBe(true)
    expect(out.ai!.model).toBe('gemini-3.8-flash')
    expect(out.notice).toBeNull()
  })

  it('13. malformed request body → 400, never a crash', async () => {
    const req = new Request(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '198.51.100.250' },
      body: ']['
    })
    const res = await call(envWithKey, req)
    expect(res.status).toBe(400)
  })

  it('14. oversized request body → 400', async () => {
    const big = { answers, answers2: 'x'.repeat(60_000) }
    const res = await call(envWithKey, post(big))
    expect(res.status).toBe(400)
  })

  it('15. invalid answers → 400 with the reason', async () => {
    const res = await call(envWithKey, post({ answers: { ...answers, industry: 'dentistry' }, ai: true }))
    expect(res.status).toBe(400)
    const raw = (await res.json()) as { error: { code: string } }
    expect(raw.error.code).toBe('INVALID_ANSWERS')
  })

  it('16. GET /api/generate → 405', async () => {
    const res = await onRequestGet()
    expect(res.status).toBe(405)
  })

  async function onRequestGet() {
    const { onRequest } = await import('../functions/api/generate')
    return onRequest({ request: new Request(URL) } as never)
  }
})

describe('P1.4 — the client degrades identically without any server', () => {
  it('generateBlueprint with declined AI builds locally and never touches the network', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { generateBlueprint } = await import('../src/lib/api')
    const out = await generateBlueprint(answers, { aiPersonalization: false })
    expect(out.blueprint.meta.aiPersonalized).toBe(false)
    expect(out.notice!.code).toBe('AI_DECLINED')
    expect(out.blueprint.meta.notice?.code).toBe('AI_DECLINED')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('generateBlueprint with opted-in AI and a dead server still returns the local blueprint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      })
    )
    const { generateBlueprint } = await import('../src/lib/api')
    const out = await generateBlueprint(answers, { aiPersonalization: true })
    expect(out.blueprint.meta.aiPersonalized).toBe(false)
    expect(out.blueprint.profile.summary.length).toBeGreaterThan(20)
  })
})
