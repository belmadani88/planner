/**
 * Financial engine tests: the math is recomputed independently here, so a
 * regression in the engine cannot silently change published numbers.
 */

import { describe, it, expect } from 'vitest'
import { buildDeterministicBlueprint } from '../src/engine'
import { buildSoftwarePlan } from '../src/engine/software'
import { buildWorkflowStack } from '../src/engine/workflows'
import { classifyBusiness } from '../src/engine/classify'
import { DEMO_SCENARIOS } from '../src/data/demoScenarios'
import type { Answers } from '../src/types/answers'

const plumbing = DEMO_SCENARIOS[3].answers // 26–50 inquiries, $500–1500 spend, half+ missed, no revenue pref issue

describe('financial inputs and midpoint arithmetic', () => {
  const bp = buildDeterministicBlueprint(plumbing)

  it('uses midpoints of the ranges the owner selected', () => {
    expect(bp.financials.inputs.monthlyInquiries).toBe(38)
    expect(bp.financials.inputs.monthlyAdSpend).toBe(1000)
    expect(bp.financials.inputs.missedCallRate).toBe(0.5)
    expect(bp.financials.inputs.annualRevenue).toBe(750_000)
  })

  it('computes cost per lead as spend ÷ inquiries (paid channels present)', () => {
    const cpl = bp.financials.estimates.find((r) => r.label.includes('cost per lead'))
    expect(cpl).toBeTruthy()
    expect(cpl!.value).toBe('$26') // 1000 / 38 = 26.3
  })

  it('computes missed inquiries as inquiries × miss rate', () => {
    const missed = bp.financials.estimates.find((r) => r.label.includes('missed calls per month'))
    expect(missed).toBeTruthy()
    expect(missed!.value).toBe('~19') // 38 × 0.5
  })

  it('derives job value from revenue midpoint and stated close-rate assumption', () => {
    const jobValue = bp.financials.modeled.find((r) => r.label.includes('average job value'))
    expect(jobValue).toBeTruthy()
    // 750000 / 12 / (38 × 0.45) = 3654.9…
    expect(jobValue!.value).toBe('$3.7k')
  })

  it('produces three labeled recovery scenarios (conservative / moderate / optimistic)', () => {
    const scenarios = bp.financials.modeled.filter((r) => r.label.includes('scenario'))
    expect(scenarios.length).toBe(3)
    expect(scenarios[0].label).toContain('Conservative')
    expect(scenarios[2].label).toContain('Optimistic')
    // conservative: 19 × 0.25 × 0.45 = 2.1375 jobs × $3654.9 ≈ $7,812 → $7.8k
    expect(scenarios[0].value).toBe('$7.8k/mo')
  })

  it('lists every assumption in plain language', () => {
    const a = bp.financials.assumptions.join(' ')
    expect(a).toContain('45%')
    expect(a).toContain('25%')
    expect(bp.financials.disclaimer).toContain('not forecasts')
  })

  it('skips CPL when no paid channels are used', () => {
    const organic: Answers = {
      ...plumbing,
      channels: ['google-organic', 'referrals', 'repeat'],
      monthlyAdSpend: '1-500'
    }
    const bp2 = buildDeterministicBlueprint(organic)
    expect(bp2.financials.estimates.find((r) => r.label.includes('cost per lead'))).toBeUndefined()
  })
})

describe('unknown inputs are skipped, never guessed', () => {
  it('drops revenue scenarios when revenue is "prefer not to say"', () => {
    const a: Answers = { ...plumbing, revenue: 'prefer-not' }
    const bp = buildDeterministicBlueprint(a)
    expect(bp.financials.modeled.find((r) => r.label.includes('average job value'))).toBeUndefined()
    // Volume scenarios still appear.
    expect(bp.financials.modeled.some((r) => r.label.includes('recovered'))).toBe(true)
  })

  it('drops missed-call math when the miss rate is unknown', () => {
    const a: Answers = { ...plumbing, missedCalls: 'not-sure', missedCallsReturned: undefined as unknown as string }
    const bp = buildDeterministicBlueprint(a)
    expect(bp.financials.estimates.find((r) => r.label.includes('missed calls per month'))).toBeUndefined()
    expect(bp.financials.modeled.find((r) => r.label.includes('scenario — recovered'))).toBeUndefined()
  })
})

describe('software cost estimate', () => {
  it('sums only published entry prices from the recommended stack', () => {
    const a = DEMO_SCENARIOS[0].answers // no FSM → adopt jobber ($39 micro)
    const cls = classifyBusiness(a)
    const stack = buildWorkflowStack(a)
    const plan = buildSoftwarePlan(a, cls, stack)
    const bp = buildDeterministicBlueprint(a)
    const expected = plan.stack
      .filter((s) => (s.status === 'adopt' || s.status === 'keep') && s.monthlyCostEstimate !== null)
      .reduce((sum, s) => sum + (s.monthlyCostEstimate ?? 0), 0)
    expect(bp.financials.softwareCost.monthly).toBe(expected)
    expect(bp.financials.softwareCost.monthly).toBeGreaterThan(0)
    // every priced line is explained
    for (const line of bp.financials.softwareCost.lines) {
      expect(line.note.length).toBeGreaterThan(10)
    }
  })
})

describe('admin time savings', () => {
  it('values manual processes honestly and lists the assumption', () => {
    const bp = buildDeterministicBlueprint(plumbing)
    const hours = bp.financials.modeled.find((r) => r.label.includes('Admin hours'))
    expect(hours).toBeTruthy()
    // plumbing scenario: booking(phone-tag), dispatch(owner-manual), job records(photos-notes),
    // invoicing(manual), payment tracking(manual), past customers(memory), pipeline(none) = 7/7
    // hours = 38 × (7/7) × (22/60) = 13.93 → ~14
    expect(hours!.value).toBe('~14 hrs/mo')
    const value = bp.financials.modeled.find((r) => r.label.includes('Value of that admin time'))
    expect(value!.value).toBe('$334/mo') // 13.9333 × 24 = 334.4 → $334
  })
})
