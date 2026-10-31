/**
 * v1.0.1 — consultation endpoint behavior (audit P0.3).
 *
 * Covers the seven required conditions:
 *  1. D1 unavailable
 *  2. D1 configured + insertion successful (notification not configured)
 *  3. D1 insertion failure
 *  4. Notification provider not configured (covered in #2 and explicitly)
 *  5. Notification successfully delivered
 *  6. Notification failure after successful database insertion
 *  7. Invalid consultation payload
 *
 * The Pages Function handlers are plain functions of ({ request, env }), so
 * they are tested directly with real Request objects and a fake D1 binding.
 * No secrets, no network: the webhook fetch is stubbed.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestPost, onRequest } from '../functions/api/consultation'
import type { ConsultationLead } from '../src/server/notify'

const URL = 'https://planner.example.com/api/consultation'

const validPayload = {
  name: 'Jordan Rivera',
  email: 'jordan@riverahvac.com',
  company: 'Rivera Heating & Air',
  message: 'Interested in the missed-call text-back.',
  consent: true,
  context: {
    industry: 'hvac',
    sizeTier: 'Micro (1–3 people)',
    goals: ['respond-faster', 'fewer-missed-calls'],
    topFindings: ['Calls are being missed', 'No central customer system']
  }
}

function postRequest(body: unknown, ip = '203.0.113.10'): Request {
  return new Request(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': ip },
    body: JSON.stringify(body)
  })
}

/** Minimal D1 stub type (tests are not compiled with Workers types). */
interface FakeD1Statement {
  bind: (...args: unknown[]) => { run: () => Promise<{ success: boolean }> }
}
interface FakeD1 {
  prepare: (sql: string) => FakeD1Statement
}

/** Minimal D1 stub covering prepare().bind(...).run(). */
function fakeD1(opts: { fail?: boolean; lastBound?: unknown[][] } = {}): FakeD1 {
  return {
    prepare: (_sql: string) => ({
      bind: (...args: unknown[]) => ({
        run: async () => {
          opts.lastBound?.push(args)
          if (opts.fail) throw new Error('D1 unavailable')
          return { success: !opts.fail }
        }
      })
    })
  }
}

interface EnvStub {
  DB?: FakeD1
  CONTACT_EMAIL?: string
  LEAD_WEBHOOK_URL?: string
}

async function call(env: EnvStub, req: Request) {
  return onRequestPost({ request: req, env: env as never } as never)
}

const dataOf = async (res: Response) => (await res.json()) as {
  ok: boolean
  stored: boolean
  notified?: boolean
  message: string
  contactEmail?: string | null
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('P0.3 — consultation request handling is truthful in every condition', () => {
  it('1. D1 unavailable → honest fallback, never a fake success', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = await call({ CONTACT_EMAIL: 'ops@webthangs.example' }, postRequest(validPayload))
    const data = await dataOf(res)
    expect(data.ok).toBe(true)
    expect(data.stored).toBe(false)
    expect(data.notified).toBe(false)
    expect(data.message).toMatch(/no request database configured/i)
    expect(data.contactEmail).toBe('ops@webthangs.example')
    // nothing was stored and no notification was attempted
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('2+4. D1 insert succeeds, webhook not configured → stored, honestly NOT notified', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = await call({ DB: fakeD1(), CONTACT_EMAIL: 'ops@webthangs.example' }, postRequest(validPayload))
    const data = await dataOf(res)
    expect(data.ok).toBe(true)
    expect(data.stored).toBe(true)
    expect(data.notified).toBe(false)
    // says the team reviews the database — a documented retrieval process —
    // but does NOT promise an automatic contact that nothing guarantees
    expect(data.message).toMatch(/saved/i)
    expect(data.message).toMatch(/reviews/i)
    expect(data.message).not.toMatch(/has been notified/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('5. D1 insert succeeds + webhook delivers → stored AND notified, says so', async () => {
    const fetchSpy = vi.fn(async () => new Response('ok', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)
    const res = await call(
      { DB: fakeD1(), LEAD_WEBHOOK_URL: 'https://hooks.example.com/lead-inbox' },
      postRequest(validPayload)
    )
    const data = await dataOf(res)
    expect(data.stored).toBe(true)
    expect(data.notified).toBe(true)
    expect(data.message).toMatch(/saved and the WebThangs team has been notified/i)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    // the webhook payload carries the consented fields only
    const init = (fetchSpy.mock.calls[0] as unknown[])[1] as { body: string }
    const body = JSON.parse(init.body) as { text: string }
    expect(body.text).toContain('Jordan Rivera')
  })

  it('6. notification fails after a successful insert → stored=true, notified=false, honest message', async () => {
    const fetchSpy = vi.fn(async () => new Response('boom', { status: 500 }))
    vi.stubGlobal('fetch', fetchSpy)
    const res = await call(
      { DB: fakeD1(), LEAD_WEBHOOK_URL: 'https://hooks.example.com/lead-inbox' },
      postRequest(validPayload, '203.0.113.11')
    )
    const data = await dataOf(res)
    expect(data.ok).toBe(true)
    expect(data.stored).toBe(true)
    expect(data.notified).toBe(false)
    expect(data.message).toMatch(/saved/i)
    expect(data.message).not.toMatch(/has been notified/)
    // and the two outcomes are distinguishable
    expect(data.notified).toBe(false)
  })

  it('6b. notification network failure is caught and reported the same honest way', async () => {
    const fetchSpy = vi.fn(async () => {
      throw new Error('ECONNRESET')
    })
    vi.stubGlobal('fetch', fetchSpy)
    const res = await call(
      { DB: fakeD1(), LEAD_WEBHOOK_URL: 'https://hooks.example.com/lead-inbox' },
      postRequest(validPayload, '203.0.113.12')
    )
    const data = await dataOf(res)
    expect(data.stored).toBe(true)
    expect(data.notified).toBe(false)
  })

  it('3. D1 insertion failure → not stored, email fallback offered, no fake success', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = await call(
      { DB: fakeD1({ fail: true }), CONTACT_EMAIL: 'ops@webthangs.example' },
      postRequest(validPayload, '203.0.113.13')
    )
    const data = await dataOf(res)
    expect(data.ok).toBe(true)
    expect(data.stored).toBe(false)
    expect(data.message).toMatch(/could not save/i)
    expect(data.contactEmail).toBe('ops@webthangs.example')
    expect(fetchSpy).not.toHaveBeenCalled() // no notification attempted for an unstored lead
  })

  it('7. invalid payload (no consent) → 400, nothing stored', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const bad = { ...validPayload, consent: false }
    const res = await call({ DB: fakeD1() }, postRequest(bad, '203.0.113.14'))
    expect(res.status).toBe(400)
    const raw = (await res.json()) as { ok: boolean; error: { code: string } }
    expect(raw.ok).toBe(false)
    expect(raw.error.code).toBe('INVALID_INPUT')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('7b. malformed JSON → 400 BAD_REQUEST', async () => {
    const req = new Request(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.15' },
      body: '{not json'
    })
    const res = await call({ DB: fakeD1() }, req)
    expect(res.status).toBe(400)
  })

  it('7c. oversized body → 400', async () => {
    const req = new Request(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.16' },
      body: JSON.stringify({ ...validPayload, message: 'x'.repeat(17_000) })
    })
    const res = await call({ DB: fakeD1() }, req)
    expect(res.status).toBe(400)
  })

  it('GET /api/consultation → 405', async () => {
    const res = await onRequest({ request: new Request(URL) } as never)
    expect(res.status).toBe(405)
  })

  it('stores exactly the consented fields, nothing more', async () => {
    const bound: unknown[][] = []
    const res = await call(
      { DB: fakeD1({ lastBound: bound }), CONTACT_EMAIL: 'ops@webthangs.example' },
      postRequest({ ...validPayload, sneakyField: 'inject' }, '203.0.113.17')
    )
    const data = await dataOf(res)
    expect(data.stored).toBe(true)
    expect(bound).toHaveLength(1)
    const args = bound[0] as unknown[]
    expect(args).toHaveLength(8) // name, email, company, message, industry, size, goals, findings
    expect(String(args[0])).toBe('Jordan Rivera')
    expect(String(args[1])).toBe('jordan@riverahvac.com')
  })
})

describe('P0.3 — the notification adapter itself', () => {
  it('is honest about not being configured', async () => {
    const { notifyNewLead } = await import('../src/server/notify')
    const lead: ConsultationLead = {
      name: 'A', email: 'a@b.co', company: '', message: '', industry: 'hvac', sizeTier: '', goals: [], topFindings: []
    }
    const result = await notifyNewLead({}, lead)
    expect(result.configured).toBe(false)
    expect(result.delivered).toBe(false)
  })

  it('treats any 2xx as delivered and non-2xx as failed (no throwing)', async () => {
    const { notifyNewLead } = await import('../src/server/notify')
    const lead: ConsultationLead = {
      name: 'A', email: 'a@b.co', company: '', message: '', industry: 'hvac', sizeTier: '', goals: [], topFindings: []
    }
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok', { status: 200 })))
    expect((await notifyNewLead({ LEAD_WEBHOOK_URL: 'https://x.example' }, lead)).delivered).toBe(true)

    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 401 })))
    const failed = await notifyNewLead({ LEAD_WEBHOOK_URL: 'https://x.example' }, lead)
    expect(failed.delivered).toBe(false)
    expect(failed.detail).toContain('401')
  })

  it('never leaks lead data in failure details', async () => {
    const { notifyNewLead } = await import('../src/server/notify')
    const lead: ConsultationLead = {
      name: 'Secret Name', email: 'secret@corp.com', company: '', message: '', industry: 'hvac', sizeTier: '', goals: [], topFindings: []
    }
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('secret@corp.com leaked') }))
    const result = await notifyNewLead({ LEAD_WEBHOOK_URL: 'https://x.example' }, lead)
    expect(result.delivered).toBe(false)
    expect(result.detail).not.toContain('secret@corp.com')
    expect(result.detail).not.toContain('Secret Name')
  })
})
