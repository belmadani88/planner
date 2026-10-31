/**
 * Validation engine tests: answer schema, completeness, AI personalization
 * schema, sanitation and software-claim screening.
 */

import { describe, it, expect } from 'vitest'
import { AnswersSchema, checkCompleteness } from '../src/schemas/answers'
import {
  PersonalizationSchema,
  screenForUnsupportedSoftware
} from '../src/schemas/blueprint'
import { DEMO_SCENARIOS } from '../src/data/demoScenarios'
import type { Answers, PartialAnswers } from '../src/types/answers'

describe('answer validation against the question bank', () => {
  it('accepts all seven valid scenarios', () => {
    for (const s of DEMO_SCENARIOS) {
      expect(AnswersSchema.safeParse(s.answers).success).toBe(true)
    }
  })

  it('rejects unknown option values', () => {
    const bad = { ...DEMO_SCENARIOS[0].answers, employees: 'banana' } as Answers
    expect(AnswersSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects unknown top-level keys (strict mode)', () => {
    const bad = { ...DEMO_SCENARIOS[0].answers, injected: 'x' }
    expect(AnswersSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects an invalid industry', () => {
    const bad = { ...DEMO_SCENARIOS[0].answers, industry: 'dentistry' }
    expect(AnswersSchema.safeParse(bad).success).toBe(false)
  })

  it('accepts a missing conditional answer (missedCallsReturned hidden)', () => {
    const a: Answers = {
      ...DEMO_SCENARIOS[0].answers,
      missedCalls: 'almost-none',
      missedCallsReturned: undefined as unknown as string
    }
    expect(AnswersSchema.safeParse(a).success).toBe(true)
  })

  it('flags missing required answers without suggesting hidden ones', () => {
    const partial: PartialAnswers = { industry: 'hvac' }
    const missing = checkCompleteness(partial)
    expect(missing).toContain('employees')
    expect(missing).toContain('goals')
    // missedCallsReturned is conditional — never "missing" when the trigger is absent
    expect(missing).not.toContain('missedCallsReturned')
  })

  it('does not flag a conditional answer as missing when its question is hidden', () => {
    const a: PartialAnswers = {
      ...DEMO_SCENARIOS[0].answers,
      missedCalls: 'almost-none'
    }
    delete (a as Record<string, unknown>).missedCallsReturned
    const missing = checkCompleteness(a)
    expect(missing).not.toContain('missedCallsReturned')
  })
})

const GOOD_AI_OUTPUT = {
  executiveSummary:
    'Your plumbing business already wins jobs with fast same-day quotes, but half of your callers never reach you. The plan fixes the front door first: every call answered or instantly texted back, then one system for jobs and invoices.',
  stageInsights: [
    { stageId: 3, insight: 'You answer in hours, not minutes — the first company to respond usually gets the visit.', tip: 'Make the 15-minute rule a team habit, visible on a lead list.' },
    { stageId: 9, insight: 'Invoices are written by hand after jobs finish.', tip: 'Let the job software send them the same day.' }
  ],
  contextualNotes: [
    'You mentioned fewer missed calls as a priority — that is exactly where the plan starts.',
    'With 2 technicians and 38 inquiries a month, your field capacity is the constraint, not demand.'
  ],
  roadmapNarrative:
    'Phase 1 is about the front door: capture every call and form, respond within 15 minutes, and start the review engine. Phase 2 moves quotes, follow-up, scheduling and invoicing into one flow. Phase 3 adds the AI help.',
  improvementNarrative:
    'Expect fewer lost callers, follow-up that happens without anyone remembering, and invoices that go out the day work completes.',
  consultationMessage:
    'If you would like help putting this in place, the team that built this planner can configure the systems with you.'
}

describe('AI personalization validation', () => {
  it('accepts a well-formed payload', () => {
    expect(PersonalizationSchema.safeParse(GOOD_AI_OUTPUT).success).toBe(true)
  })

  it('rejects an unknown stage id', () => {
    const bad = { ...GOOD_AI_OUTPUT, stageInsights: [{ stageId: 14, insight: 'x', tip: 'y' }] }
    expect(PersonalizationSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const { roadmapNarrative: _omit, ...bad } = GOOD_AI_OUTPUT
    expect(PersonalizationSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects overlong content', () => {
    const bad = { ...GOOD_AI_OUTPUT, executiveSummary: 'x'.repeat(5000) }
    expect(PersonalizationSchema.safeParse(bad).success).toBe(false)
  })

  it('strips markdown formatting from AI text', () => {
    const marked = {
      ...GOOD_AI_OUTPUT,
      executiveSummary: '**Bold** and # Heading and `code` in the summary.'
    }
    const parsed = PersonalizationSchema.parse(marked)
    expect(parsed.executiveSummary).not.toContain('**')
    expect(parsed.executiveSummary).not.toContain('#')
    expect(parsed.executiveSummary).toContain('Bold')
  })
})

describe('unsupported-software screening', () => {
  it('allows knowledge-base software names', () => {
    expect(screenForUnsupportedSoftware('Jobber and QuickBooks work together.')).toBeNull()
    expect(screenForUnsupportedSoftware('Google Analytics 4 is free.')).toBeNull()
  })

  it('catches products outside the knowledge base', () => {
    expect(screenForUnsupportedSoftware('You should also look at Salesforce for this.')).toBe('Salesforce')
    expect(screenForUnsupportedSoftware('Maybe use ChatGPT to write emails.')).toBe('ChatGPT')
  })

  it('ignores ordinary text', () => {
    expect(screenForUnsupportedSoftware('Your team will answer faster and follow up automatically.')).toBeNull()
  })
})
