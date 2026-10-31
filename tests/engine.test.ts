/**
 * The seven realistic business scenarios from the product spec (Part 14),
 * plus determinism and structural invariants.
 */

import { describe, it, expect } from 'vitest'
import { buildDeterministicBlueprint } from '../src/engine'
import { BlueprintSchema } from '../src/schemas/blueprint'
import { DEMO_SCENARIOS } from '../src/data/demoScenarios'
import { STAGES } from '../src/data/stages'
import type { Answers } from '../src/types/answers'

describe('deterministic engine — all seven scenarios', () => {
  for (const s of DEMO_SCENARIOS) {
    it(`builds a structurally valid blueprint: ${s.title}`, () => {
      const bp = buildDeterministicBlueprint(s.answers)
      const result = BlueprintSchema.safeParse(bp)
      if (!result.success) {
        console.error(result.error.issues.slice(0, 5))
      }
      expect(result.success).toBe(true)
    })
  }

  it('produces identical core blueprints for identical inputs', () => {
    const a = DEMO_SCENARIOS[0].answers
    const b1 = buildDeterministicBlueprint(a)
    const b2 = buildDeterministicBlueprint(a)
    const strip = (x: typeof b1) => JSON.stringify({ ...x, meta: { ...x.meta, generatedAt: undefined } })
    expect(strip(b1)).toBe(strip(b2))
  })

  it('covers all 11 operating stages in every scenario', () => {
    for (const s of DEMO_SCENARIOS) {
      const bp = buildDeterministicBlueprint(s.answers)
      expect(bp.operatingModel.stages.map((x) => x.stageId)).toEqual(STAGES.map((x) => x.id))
      expect(bp.assessment.stages).toHaveLength(11)
    }
  })

  it('never returns an empty workflow set or software stack', () => {
    for (const s of DEMO_SCENARIOS) {
      const bp = buildDeterministicBlueprint(s.answers)
      expect(bp.workflows.length).toBeGreaterThanOrEqual(5)
      expect(bp.software.stack.length).toBeGreaterThanOrEqual(2)
      expect(bp.roadmap.items.length).toBeGreaterThanOrEqual(5)
      expect(bp.improvements.length).toBeGreaterThanOrEqual(1)
      expect(bp.implementationPlan.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('every workflow explains all mandatory fields (trigger, failure mode, etc.)', () => {
    for (const s of DEMO_SCENARIOS) {
      const bp = buildDeterministicBlueprint(s.answers)
      for (const w of bp.workflows) {
        expect(w.whatHappens.length, `${w.id} whatHappens`).toBeGreaterThan(20)
        expect(w.trigger.length, `${w.id} trigger`).toBeGreaterThan(5)
        expect(w.failureMode.length, `${w.id} failureMode`).toBeGreaterThan(20)
        expect(w.customerExperience.length).toBeGreaterThan(10)
        expect(w.employeeAction.length).toBeGreaterThan(10)
        expect(w.dataFlow.length).toBeGreaterThan(10)
        expect(['automation', 'ai', 'human', 'human-ai']).toContain(w.kind)
        expect(['adopt', 'verify', 'keep']).toContain(w.mode)
      }
    }
  })

  it('every finding quotes evidence from the owner’s answers', () => {
    for (const s of DEMO_SCENARIOS) {
      const bp = buildDeterministicBlueprint(s.answers)
      for (const f of bp.assessment.findings) {
        expect(f.evidence.length).toBeGreaterThan(10)
        expect(f.relatedStages.length).toBeGreaterThanOrEqual(1)
      }
    }
  })
})

describe('scenario 1 — small HVAC, no CRM', () => {
  const bp = buildDeterministicBlueprint(DEMO_SCENARIOS[0].answers)

  it('classifies as micro / manual / owner-led', () => {
    expect(bp.profile.classification.sizeTier).toBe('micro')
    expect(bp.profile.classification.techMaturity).toBe('basic') // quickbooks counts
    expect(bp.profile.classification.operationalPattern).toBe('owner-led')
  })

  it('recommends adopting a field-service hub', () => {
    expect(bp.software.stack.some((s) => s.softwareId === 'jobber' && s.status === 'adopt' && s.essential)).toBe(true)
  })

  it('flags manual invoicing, no CRM and weak follow-up as high severity', () => {
    const ids = bp.assessment.findings.filter((f) => f.severity === 'high').map((f) => f.id)
    expect(ids).toContain('F-SLOW-INVOICING')
    expect(ids).toContain('F-NO-CENTRAL-CRM')
    expect(ids).toContain('F-WEAK-FOLLOWUP')
  })

  it('keeps the roadmap in three phases with dependencies', () => {
    expect(bp.roadmap.phases.map((p) => p.phase)).toEqual([1, 2, 3])
    expect(bp.roadmap.items.some((i) => i.phase === 1)).toBe(true)
    const withDeps = bp.roadmap.items.filter((i) => i.dependsOn.length > 0)
    expect(withDeps.length).toBeGreaterThanOrEqual(3)
  })
})

describe('scenario 2 — medium HVAC on Jobber', () => {
  const bp = buildDeterministicBlueprint(DEMO_SCENARIOS[1].answers)

  it('keeps Jobber instead of recommending a replacement', () => {
    const jobber = bp.software.stack.find((s) => s.softwareId === 'jobber')
    expect(jobber?.status).toBe('keep')
    expect(bp.software.stack.some((s) => s.softwareId === 'servicetitan' && s.status === 'adopt')).toBe(false)
  })

  it('marks FSM-covered workflows as verify, not adopt', () => {
    const reminders = bp.workflows.find((w) => w.id === 'W-APPT-REMINDERS')
    expect(reminders?.mode).toBe('verify')
  })

  it('surfaces the underused-software finding', () => {
    expect(bp.assessment.findings.some((f) => f.id === 'F-UNDERUSED-SOFTWARE')).toBe(true)
  })

  it('flags ad spend without measurement — and does not re-sell GA4 they already run', () => {
    expect(bp.assessment.findings.some((f) => f.id === 'F-ADSPEND-BLIND')).toBe(true)
    expect(bp.software.stack.some((s) => s.softwareId === 'ga4' && s.status === 'adopt')).toBe(false)
  })
})

describe('scenario 3 — larger HVAC on ServiceTitan', () => {
  const bp = buildDeterministicBlueprint(DEMO_SCENARIOS[2].answers)

  it('keeps ServiceTitan and does not push a competitor', () => {
    const st = bp.software.stack.find((s) => s.softwareId === 'servicetitan')
    expect(st?.status).toBe('keep')
    expect(bp.software.stack.some((s) => s.softwareId === 'jobber' && s.status === 'adopt')).toBe(false)
  })

  it('recognizes the operational strengths honestly', () => {
    expect(bp.assessment.findings.some((f) => f.severity === 'positive')).toBe(true)
  })

  it('does not manufacture high-severity problems that the answers contradict', () => {
    const ids = bp.assessment.findings.map((f) => f.id)
    expect(ids).not.toContain('F-SLOW-RESPONSE')
    expect(ids).not.toContain('F-MISSED-CALLS')
    expect(ids).not.toContain('F-SLOW-INVOICING')
  })
})

describe('scenario 4 — plumbing with urgent demand', () => {
  const bp = buildDeterministicBlueprint(DEMO_SCENARIOS[3].answers)

  it('prioritizes missed-call recovery', () => {
    const ids = bp.assessment.findings.filter((f) => f.severity === 'high').map((f) => f.id)
    expect(ids).toContain('F-MISSED-CALLS')
    expect(ids).toContain('F-MISSED-CALL-RECOVERY')
    expect(bp.workflows.some((w) => w.id === 'W-MISSED-CALL-TEXT' && w.priority === 1)).toBe(true)
    expect(bp.software.stack.some((s) => s.softwareId === 'voip')).toBe(true)
  })

  it('shows capacity pressure honestly (at-capacity, not a lead-buying pitch)', () => {
    expect(bp.profile.classification.demandPressure).toBe('at-capacity')
    expect(bp.assessment.findings.some((f) => f.id === 'F-CAPACITY-PRESSURE')).toBe(false)
  })
})

describe('scenario 5 — roofing with a long estimate cycle', () => {
  const bp = buildDeterministicBlueprint(DEMO_SCENARIOS[4].answers)

  it('attacks the follow-up and estimate-tracking gap', () => {
    expect(bp.assessment.findings.some((f) => f.id === 'F-WEAK-FOLLOWUP')).toBe(true)
    expect(bp.workflows.some((w) => w.id === 'W-FOLLOWUP-SEQUENCE')).toBe(true)
    expect(bp.workflows.some((w) => w.id === 'W-PIPELINE-BOARD')).toBe(true)
  })

  it('includes the roofing industry note on the estimate stage', () => {
    const stage5 = bp.operatingModel.stages.find((s) => s.stageId === 5)
    expect(stage5?.industryNote).toBeTruthy()
  })
})

describe('scenario 6 — small electrical team', () => {
  const bp = buildDeterministicBlueprint(DEMO_SCENARIOS[5].answers)

  it('keeps Housecall Pro and recommends depth over replacement', () => {
    const hcp = bp.software.stack.find((s) => s.softwareId === 'housecall-pro')
    expect(hcp?.status).toBe('keep')
  })

  it('flags the after-service gap', () => {
    expect(bp.assessment.findings.some((f) => f.id === 'F-NO-AFTER-SERVICE')).toBe(true)
  })
})

describe('scenario 7 — landscaping with recurring contracts', () => {
  const bp = buildDeterministicBlueprint(DEMO_SCENARIOS[6].answers)

  it('recommends the maintenance program for contract businesses', () => {
    expect(bp.workflows.some((w) => w.id === 'W-MAINTENANCE-PROGRAM')).toBe(true)
  })

  it('shows a well-digitized operation honestly', () => {
    expect(['digitized', 'integrated']).toContain(bp.profile.classification.techMaturity)
    expect(bp.assessment.findings.some((f) => f.severity === 'positive')).toBe(true)
  })
})

describe('diagram integrity', () => {
  it('builds a connected customer-to-cash diagram in every scenario', () => {
    for (const s of DEMO_SCENARIOS) {
      const bp = buildDeterministicBlueprint(s.answers)
      expect(bp.diagram.nodes.length).toBeGreaterThanOrEqual(8)
      expect(bp.diagram.edges.length).toBeGreaterThanOrEqual(7)
      const nodeIds = new Set(bp.diagram.nodes.map((n) => n.id))
      for (const e of bp.diagram.edges) {
        expect(nodeIds.has(e.source), `edge source ${e.source}`).toBe(true)
        expect(nodeIds.has(e.target), `edge target ${e.target}`).toBe(true)
      }
      // The hub and a human node always exist.
      expect(bp.diagram.nodes.some((n) => n.kind === 'software')).toBe(true)
      expect(bp.diagram.nodes.some((n) => n.kind === 'human')).toBe(true)
    }
  })

  it('distinguishes human, automation and AI nodes visually (kind field)', () => {
    const bp = buildDeterministicBlueprint(DEMO_SCENARIOS[0].answers)
    const kinds = new Set(bp.diagram.nodes.map((n) => n.kind))
    expect(kinds.has('human')).toBe(true)
    expect(kinds.has('automation')).toBe(true)
  })
})
