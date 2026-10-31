/**
 * Financial engine tests: the math is recomputed independently here, so a
 * regression in the engine cannot silently change published numbers.
 *
 * v1.0.1 note: expected values reflect the corrected phone-share model
 * (audit P1.2). The missed-call rate now applies only to the telephone share
 * of inquiries (from the owner's callVsWebMix answer), and open-ended ranges
 * state their modeling value. The plumbing fixture: 38 inquiries, mostly
 * calls (85% share), half+ missed → 38 × 0.85 × 0.5 = 16.15 missed/mo.
 */

import { describe, it, expect } from 'vitest'
import { buildDeterministicBlueprint } from '../src/engine'
import { buildSoftwarePlan } from '../src/engine/software'
import { buildWorkflowStack } from '../src/engine/workflows'
import { classifyBusiness } from '../src/engine/classify'
import { ASSUMPTIONS } from '../src/engine/financial'
import { DEMO_SCENARIOS } from '../src/data/demoScenarios'
import type { Answers } from '../src/types/answers'

const plumbing = DEMO_SCENARIOS[3].answers // 26–50 inquiries, $500–1500 spend, half+ missed, mostly calls

describe('financial inputs and midpoint arithmetic', () => {
  const bp = buildDeterministicBlueprint(plumbing)

  it('uses midpoints of the ranges the owner selected', () => {
    expect(bp.financials.inputs.monthlyInquiries).toBe(38)
    expect(bp.financials.inputs.monthlyAdSpend).toBe(1000)
    expect(bp.financials.inputs.missedCallRate).toBe(0.5)
    expect(bp.financials.inputs.annualRevenue).toBe(750_000)
  })

  it('records the modeled phone share of inquiries', () => {
    // plumbing fixture answers 'mostly-calls' → 0.85 modeled telephone share
    expect(bp.financials.inputs.phoneShareOfInquiries).toBe(0.85)
  })

  it('computes cost per lead as spend ÷ inquiries (paid channels present)', () => {
    const cpl = bp.financials.estimates.find((r) => r.label.toLowerCase().includes('cost per lead'))
    expect(cpl).toBeTruthy()
    expect(cpl!.value).toBe('~$26') // 1000 / 38 = 26.3, shown with "~" (estimate, not a measured fact)
  })

  it('scopes missed inquiries to the telephone share (v1.0.1)', () => {
    const missed = bp.financials.estimates.find((r) => r.label.toLowerCase().includes('missed phone inquiries'))
    expect(missed).toBeTruthy()
    expect(missed!.value).toBe('~16') // 38 × 0.85 (phone share) × 0.5 (miss rate) = 16.15
    expect(missed!.note).toContain('85%')
    expect(missed!.note).toContain('not a measured count')
  })

  it('derives job value from revenue midpoint and stated close-rate assumption', () => {
    const jobValue = bp.financials.modeled.find((r) => r.label.toLowerCase().includes('average job value'))
    expect(jobValue).toBeTruthy()
    // 750000 / 12 / (38 × 0.45) = 3654.9…
    expect(jobValue!.value).toBe('$3.7k')
  })

  it('produces three labeled recovery scenarios (conservative / moderate / optimistic)', () => {
    const scenarios = bp.financials.modeled.filter((r) => r.label.includes('scenario'))
    expect(scenarios.length).toBe(3)
    expect(scenarios[0].label).toContain('Conservative')
    expect(scenarios[2].label).toContain('Optimistic')
    // conservative: 16.15 × 0.25 × 0.45 = 1.8169 jobs × $3654.9 ≈ $6,641 → $6.6k
    expect(scenarios[0].value).toBe('$6.6k/mo')
  })

  it('lists every assumption in plain language, incl. the phone share', () => {
    const a = bp.financials.assumptions.join(' ')
    expect(a).toContain('45%')
    expect(a).toContain('25%')
    expect(a).toContain('85% of your inquiries arrive as phone calls')
    expect(bp.financials.disclaimer).toContain('not forecasts')
  })

  it('skips CPL when no paid channels are used', () => {
    const organic: Answers = {
      ...plumbing,
      channels: ['google-organic', 'referrals', 'repeat'],
      monthlyAdSpend: '1-500'
    }
    const bp2 = buildDeterministicBlueprint(organic)
    expect(bp2.financials.estimates.find((r) => r.label.toLowerCase().includes('cost per lead'))).toBeUndefined()
  })
})

describe('P1.2 — lead-source mix changes the estimate, not the truth', () => {
  const base = DEMO_SCENARIOS[3].answers

  const missedFor = (mix: string) => {
    const bp = buildDeterministicBlueprint({ ...base, callVsWebMix: mix })
    const row = bp.financials.estimates.find((r) => r.label.toLowerCase().includes('missed phone inquiries'))
    return row?.value
  }

  it('mostly telephone businesses keep the highest (still phone-scoped) estimate', () => {
    expect(missedFor('mostly-calls')).toBe('~16') // 38 × 0.85 × 0.5
  })

  it('mostly online businesses get a much smaller phone-scoped estimate', () => {
    expect(missedFor('mostly-web')).toBe('~3') // 38 × 0.15 × 0.5 = 2.85
  })

  it('mixed businesses land in between', () => {
    expect(missedFor('balanced')).toBe('~10') // 38 × 0.5 × 0.5 = 9.5 → 10
  })

  it('unknown lead-source distribution uses a conservative stated default (50%)', () => {
    const value = missedFor('not-sure')
    expect(value).toBe('~10') // 38 × 0.5 × 0.5
    const bp = buildDeterministicBlueprint({ ...base, callVsWebMix: 'not-sure' })
    const missed = bp.financials.estimates.find((r) => r.label.toLowerCase().includes('missed phone inquiries'))
    expect(missed!.note).toContain('assumed')
    const joined = bp.financials.assumptions.join(' ')
    expect(joined).toContain('you weren’t sure')
    expect(joined).toContain('50%')
  })

  it('never applies a phone miss-rate to ALL inquiries (the v1.0.0 defect)', () => {
    // mostly-web: old code produced 38 × 0.5 = 19 "missed calls"; correct is 2.85.
    expect(Number(missedFor('mostly-web')!.replace(/[~]/g, ''))).toBeLessThan(19)
  })

  it('web-form inquiries are described as not phone calls', () => {
    const bp = buildDeterministicBlueprint({ ...base, callVsWebMix: 'mostly-web' })
    const missed = bp.financials.estimates.find((r) => r.label.toLowerCase().includes('missed phone inquiries'))!
    expect(missed.note).toContain('15%')
  })
})

describe('P1.2 — open-ended ranges are modeled, stated, and never passed off as measured', () => {
  it("'100+' inquiries uses a stated modeling value of 150 and says so", () => {
    const a: Answers = { ...DEMO_SCENARIOS[3].answers, monthlyInquiries: '100-plus' }
    const bp = buildDeterministicBlueprint(a)
    expect(bp.financials.inputs.monthlyInquiries).toBe(150)
    const measured = bp.financials.measured.find((r) => r.label.includes('New inquiries'))
    expect(measured!.value).toBe('100+') // the measured row shows the owner's own answer
    const joined = bp.financials.assumptions.join(' ')
    expect(joined).toContain('Open range assumption')
    expect(joined).toContain('150')
    // missed-phone estimate exists and scales from the modeling value
    const missed = bp.financials.estimates.find((r) => r.label.toLowerCase().includes('missed phone inquiries'))
    expect(missed!.value).toBe('~64') // 150 × 0.85 × 0.5 = 63.75
    expect(missed!.note).toContain('100+')
  })

  it("'$5,000+' ad spend uses a stated modeling value of $7,500 and says so", () => {
    const a: Answers = { ...DEMO_SCENARIOS[3].answers, monthlyAdSpend: '5000-plus' }
    const bp = buildDeterministicBlueprint(a)
    expect(bp.financials.inputs.monthlyAdSpend).toBe(7500)
    const joined = bp.financials.assumptions.join(' ')
    expect(joined).toContain('$7.5k')
    expect(joined).toContain('Open range assumption')
    const measured = bp.financials.measured.find((r) => r.label.includes('Advertising'))
    expect(measured!.value).toBe('$5,000+') // owner's answer, not the modeling value
  })

  it('open-ended CPL explicitly notes the direction of the uncertainty', () => {
    const a: Answers = {
      ...DEMO_SCENARIOS[3].answers,
      monthlyInquiries: '100-plus',
      monthlyAdSpend: '5000-plus'
    }
    const bp = buildDeterministicBlueprint(a)
    const cpl = bp.financials.estimates.find((r) => r.label.toLowerCase().includes('cost per lead'))!
    expect(cpl.note).toContain('modeling value')
    expect(cpl.note).toContain('more real inquiries would mean a lower cost per lead')
  })
})

describe('P1.2 — boundary inputs stay honest', () => {
  it('zero advertising expenditure → no CPL row, no divide-by-zero', () => {
    const a: Answers = { ...DEMO_SCENARIOS[3].answers, monthlyAdSpend: '0' }
    const bp = buildDeterministicBlueprint(a)
    expect(bp.financials.inputs.monthlyAdSpend).toBe(0)
    expect(bp.financials.estimates.find((r) => r.label.toLowerCase().includes('cost per lead'))).toBeUndefined()
  })

  it('zero-ish reported inquiries (0–10) still computes without division errors', () => {
    const a: Answers = { ...DEMO_SCENARIOS[3].answers, monthlyInquiries: '0-10' }
    const bp = buildDeterministicBlueprint(a)
    expect(bp.financials.inputs.monthlyInquiries).toBe(5)
    // job value still derivable: 750000 / 12 / (5 × 0.45) = $27.8k — but honest
    const jobValue = bp.financials.modeled.find((r) => r.label.toLowerCase().includes('average job value'))
    expect(jobValue).toBeTruthy()
    // no recovery scenarios: 5 × 0.85 × 0.5 = 2.125 missed → ≥ 0.5, so present but small
    const scenarios = bp.financials.modeled.filter((r) => r.label.includes('scenario'))
    expect(scenarios.length).toBe(3)
  })

  it('incomplete questionnaire answers (undefined) skip every dependent scenario', () => {
    const a = { ...DEMO_SCENARIOS[3].answers } as Record<string, unknown>
    delete a.monthlyInquiries
    delete a.monthlyAdSpend
    const bp = buildDeterministicBlueprint(a as unknown as Answers)
    expect(bp.financials.inputs.monthlyInquiries).toBeNull()
    expect(bp.financials.inputs.monthlyAdSpend).toBeNull()
    expect(bp.financials.estimates.length).toBe(0)
    expect(bp.financials.modeled.find((r) => r.label.toLowerCase().includes('average job value'))).toBeUndefined()
    expect(bp.financials.modeled.find((r) => r.label.includes('scenario'))).toBeUndefined()
    // and the report says why instead of showing numbers
    expect(bp.currentSituation.assumed.join(' ')).toContain('not provided')
  })

  it('revenue prefer-not → volume-only recovery view, no invented dollars', () => {
    const a: Answers = { ...DEMO_SCENARIOS[3].answers, revenue: 'prefer-not' }
    const bp = buildDeterministicBlueprint(a)
    expect(bp.financials.modeled.find((r) => r.label.toLowerCase().includes('average job value'))).toBeUndefined()
    expect(bp.financials.modeled.some((r) => r.label.includes('recovered'))).toBe(true)
    expect(bp.financials.modeled.find((r) => r.label.includes('scenario'))!.note).toContain('no dollar values are guessed')
  })
})

describe('stated assumptions constants', () => {
  it('phone shares are bounded and deterministic', () => {
    expect(ASSUMPTIONS.phoneShareByAnswer['mostly-calls']).toBe(0.85)
    expect(ASSUMPTIONS.phoneShareByAnswer['mostly-web']).toBe(0.15)
    expect(ASSUMPTIONS.phoneShareByAnswer['balanced']).toBe(0.5)
    expect(ASSUMPTIONS.phoneShareWhenUnknown).toBe(0.5)
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
