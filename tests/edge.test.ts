/**
 * Edge cases from the spec: incomplete questionnaire, "I don’t know"
 * everywhere, no website, and graceful degradation of every engine layer.
 */

import { describe, it, expect } from 'vitest'
import { buildDeterministicBlueprint } from '../src/engine'
import { BlueprintSchema } from '../src/schemas/blueprint'
import { DEMO_SCENARIOS } from '../src/data/demoScenarios'
import type { Answers, PartialAnswers } from '../src/types/answers'

describe('incomplete and uncertain answers', () => {
  const unsure: Answers = {
    ...DEMO_SCENARIOS[0].answers,
    monthlyInquiries: 'not-sure',
    monthlyAdSpend: 'not-sure',
    revenue: 'prefer-not',
    missedCalls: 'not-sure',
    missedCallsReturned: 'not-sure',
    responseSpeed: 'not-sure',
    qualificationProcess: 'not-sure',
    bookingProcess: 'not-sure',
    estimateProcess: 'not-sure',
    estimateFollowUp: 'not-sure',
    pipelineTracking: 'not-sure',
    technicianAssignment: 'not-sure',
    availabilityTracking: 'not-sure',
    customerUpdates: 'not-sure',
    workRecording: 'not-sure',
    invoicing: 'not-sure',
    paymentTracking: 'not-sure',
    repeatCustomerManagement: 'not-sure',
    websitePlatform: 'not-sure',
    serviceAreas: 'not-sure',
    technicians: 'not-sure',
    phoneSystem: 'not-sure'
  }

  it('still produces a complete, valid blueprint', () => {
    const bp = buildDeterministicBlueprint(unsure)
    expect(BlueprintSchema.safeParse(bp).success).toBe(true)
    expect(bp.workflows.length).toBeGreaterThan(0)
  })

  it('marks unknown stages as "Not sure yet" instead of guessing', () => {
    const bp = buildDeterministicBlueprint(unsure)
    const nullStages = bp.assessment.stages.filter((s) => s.maturity === null)
    expect(nullStages.length).toBeGreaterThanOrEqual(4)
    expect(bp.assessment.stages.every((s) => s.maturityLabel.length > 0)).toBe(true)
  })

  it('drops financial scenarios that depend on unknown inputs', () => {
    const bp = buildDeterministicBlueprint(unsure)
    expect(bp.financials.modeled.find((r) => r.label.includes('scenario — recovered'))).toBeUndefined()
    expect(bp.financials.assumptions.some((a) => a.includes('skipped') || a.includes('unknown') || a.includes('not'))).toBe(true)
  })

  it('does not fabricate high-severity findings from unknowns', () => {
    const bp = buildDeterministicBlueprint(unsure)
    const ids = bp.assessment.findings.map((f) => f.id)
    expect(ids).not.toContain('F-MISSED-CALLS')
    expect(ids).not.toContain('F-SLOW-RESPONSE')
    // but structural facts still count (no CRM is a fact, not a guess)
    expect(ids).toContain('F-NO-FSM')
  })
})

describe('no website at all', () => {
  const noSite: Answers = {
    ...DEMO_SCENARIOS[0].answers,
    websitePlatform: 'no-website',
    channels: ['referrals', 'repeat', 'google-organic']
  }

  it('recommends a website and skips form capture', () => {
    const bp = buildDeterministicBlueprint(noSite)
    expect(bp.software.stack.some((s) => s.softwareId === 'wordpress' && s.status === 'adopt')).toBe(true)
    expect(bp.workflows.some((w) => w.id === 'W-FORM-CAPTURE')).toBe(false)
  })

  it('still builds a diagram from the phone-first journey', () => {
    const bp = buildDeterministicBlueprint(noSite)
    expect(bp.diagram.nodes.some((n) => n.id === 'n-phone')).toBe(true)
    expect(bp.diagram.nodes.some((n) => n.id === 'n-form')).toBe(false)
  })
})

describe('GoHighLevel owner without FSM', () => {
  const ghl: Answers = {
    ...DEMO_SCENARIOS[0].answers,
    crm: 'gohighlevel',
    goals: ['respond-faster', 'fewer-missed-calls', 'more-leads']
  }

  it('keeps GoHighLevel as the lead layer and adds a field-service hub', () => {
    const bp = buildDeterministicBlueprint(ghl)
    const ghlEntry = bp.software.stack.find((s) => s.softwareId === 'gohighlevel')
    expect(ghlEntry?.status).toBe('keep')
    expect(bp.software.stack.some((s) => s.softwareId === 'jobber' && s.status === 'adopt')).toBe(true)
  })

  it('marks the unverified integration honestly', () => {
    const bp = buildDeterministicBlueprint(ghl)
    expect(
      bp.software.integrations.some((i) => i.status === 'unverified' && i.from === 'GoHighLevel')
    ).toBe(true)
  })
})

describe('every demo fixture stays schema-valid', () => {
  it('all seven scenarios pass answer validation', async () => {
    const { AnswersSchema } = await import('../src/schemas/answers')
    for (const s of DEMO_SCENARIOS) {
      expect(AnswersSchema.safeParse(s.answers).success, s.id).toBe(true)
    }
  })
})

describe('partial answer object tolerated by completeness checker', () => {
  it('lists exactly the unanswered visible questions', () => {
    const partial: PartialAnswers = { industry: 'hvac', employees: '4-7' }
    // dynamic import to keep the top of file tidy
    return import('../src/schemas/answers').then(({ checkCompleteness }) => {
      const missing = checkCompleteness(partial)
      expect(missing.length).toBeGreaterThan(10)
      expect(missing).not.toContain('industry')
      expect(missing).not.toContain('employees')
    })
  })
})
