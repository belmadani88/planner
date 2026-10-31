/**
 * v1.0.1 regression tests — audit Part 4 fixes.
 *
 * 1. Option-ID uniqueness (incl. the duplicate-`maintenance` label corruption)
 * 2. Workflow CRM labeling (operator-precedence bug)
 * 3. Industry-switching behavior
 * 4. Housecall Pro pricing metadata (audit P1.1)
 * 5. Blueprint completeness: 12 sections, diagram, exports
 */

import { describe, it, expect } from 'vitest'
import { QUESTIONS, resolveOptions, SECTION_META } from '../src/data/questions'
import { labelOf } from '../src/engine/labels'
import { buildDeterministicBlueprint } from '../src/engine'
import { buildWorkflowStack, selectWorkflows, buildWorkflowContext } from '../src/engine/workflows'
import { classifyBusiness } from '../src/engine/classify'
import { detectFindings } from '../src/engine/findings'
import { SOFTWARE, SOFTWARE_BY_ID } from '../src/data/software'
import { DEMO_SCENARIOS } from '../src/data/demoScenarios'
import { buildStandaloneHtml } from '../src/lib/exportHtml'
import { buildWorkflowContext as ctxOf } from '../src/engine/workflows'
import type { Answers, IndustryId } from '../src/types/answers'

const INDUSTRIES: IndustryId[] = ['hvac', 'plumbing', 'roofing', 'electrical', 'restoration', 'remodeling', 'landscaping']

/* ── 1. Duplicate option identifiers ────────────────────────────────────── */

describe('option identifiers are unique within their relevant scope', () => {
  it('every question with static options has unique ids', () => {
    for (const q of QUESTIONS) {
      if (typeof q.options === 'function') continue
      const ids = q.options.map((o) => o.value)
      expect(new Set(ids).size, `${q.id}: ${ids.join(',')}`).toBe(ids.length)
    }
  })

  it('every industry view of a conditional-options question has unique ids', () => {
    for (const q of QUESTIONS) {
      if (typeof q.options !== 'function') continue
      for (const ind of INDUSTRIES) {
        const ids = resolveOptions(q, { industry: ind }).map((o) => o.value)
        expect(new Set(ids).size, `${q.id} / ${ind}: ${ids.join(',')}`).toBe(ids.length)
      }
    }
  })

  it('documents the cross-industry shared ids and never mixes their labels (v1.0.0 defect)', () => {
    // v1.0.0 bug: labels were unioned across industries, so a value id shared
    // by two trades (e.g. 'maintenance') showed whichever trade's label was
    // resolved LAST — an HVAC user saw plumbing's "Recurring maintenance plans".
    const servicesQ = QUESTIONS.find((q) => q.id === 'services')!
    const hvacUser = { ...DEMO_SCENARIOS[0].answers } as Answers
    const plumbingUser = { ...DEMO_SCENARIOS[3].answers } as Answers

    const hvacLabels = labelOf('services', hvacUser) ?? ''
    expect(hvacLabels).toContain('Preventive maintenance') // the HVAC label
    expect(hvacLabels).not.toContain('Recurring maintenance plans') // plumbing's

    const plumbingLabels = labelOf('services', plumbingUser) ?? ''
    // plumbing selects 'repairs' and 'replacements', which roofing also uses —
    // the plumbing labels must win for a plumbing user:
    expect(plumbingLabels).toContain('General repairs & fixture work')
    expect(plumbingLabels).not.toContain('Repairs & leak tracing') // roofing's label
    expect(plumbingLabels).toContain('Replacements (water heaters, repipes)')
    expect(plumbingLabels).not.toContain('Full replacements & re-roofs') // roofing's label

    // roofing vs plumbing share 'repairs' and 'replacements' — labels must
    // follow the owner's own trade as well.
    const roofingLabels = labelOf('services', DEMO_SCENARIOS[4].answers as Answers) ?? ''
    expect(roofingLabels).toContain('Repairs & leak tracing') // roofing's label
    expect(roofingLabels).not.toContain('General repairs & fixture work') // plumbing's

    expect(servicesQ.type).toBe('multi')
  })
})

/* ── 2. Workflow software labeling (CRM precedence bug) ─────────────────── */

function ctxFor(a: Answers) {
  const cls = classifyBusiness(a)
  const findings = detectFindings(a, cls)
  const stack = buildWorkflowStack(a)
  return buildWorkflowContext(a, cls, findings, stack)
}

describe('workflow software labeling shows the real CRM name (v1.0.1 fix)', () => {
  const base = DEMO_SCENARIOS[0].answers

  const crmLabelsFor = (a: Answers): string[] => {
    const selected = selectWorkflows(ctxFor(a))
    return selected.flatMap((w) => w.software)
  }

  it('an existing GoHighLevel CRM name appears verbatim', () => {
    const labels = crmLabelsFor({ ...base, crm: 'gohighlevel' })
    expect(labels).toContain('GoHighLevel')
    expect(labels).not.toContain('Your customer system')
  })

  it('an existing HubSpot CRM name appears verbatim (KB name: "HubSpot CRM")', () => {
    const labels = crmLabelsFor({ ...base, crm: 'hubspot' })
    expect(labels.some((l) => l.startsWith('HubSpot'))).toBe(true)
    expect(labels).not.toContain('Your customer system')
  })

  it('no CRM but an FSM → the FSM name is used (it holds the customer records)', () => {
    const labels = crmLabelsFor({ ...base, crm: 'none', fsm: 'jobber' })
    expect(labels).toContain('Jobber')
  })

  it('neither CRM nor FSM → the plain-language fallback', () => {
    const labels = crmLabelsFor({ ...base, crm: 'none', fsm: 'none' })
    expect(labels).toContain('Your customer system')
    expect(labels).not.toContain('GoHighLevel')
  })

  it('multiple software choices coexist without overriding each other', () => {
    const labels = crmLabelsFor({ ...base, crm: 'hubspot', fsm: 'none', automationTools: ['zapier'] })
    expect(labels.some((l) => l.startsWith('HubSpot'))).toBe(true)
    expect(labels).toContain('Zapier')
  })

  it('empty/optional values never crash selection', () => {
    expect(() => crmLabelsFor({ ...base, crm: '', fsm: '' } as unknown as Answers)).not.toThrow()
  })
})

/* ── 3. Industry switching ──────────────────────────────────────────────── */

describe('industry switching does not leak service selections', () => {
  it('HVAC → plumbing drops HVAC-only services and keeps genuinely shared ones', async () => {
    const { sanitizeServicesForIndustry } = await import('../src/schemas/answers')
    const hvac: Partial<Answers> = { ...DEMO_SCENARIOS[0].answers }
    const next = sanitizeServicesForIndustry({ ...hvac, industry: 'plumbing' })
    const kept = (next.services ?? []) as string[]
    // hvac-only values must be gone…
    expect(kept).not.toContain('installations')
    expect(kept).not.toContain('maintenance-agreements')
    expect(kept).not.toContain('air-quality')
    // …while 'maintenance' is a legitimately shared value id (it exists in
    // BOTH trades' option sets, now with correct per-industry labels).
    expect(kept).toContain('maintenance')
    expect(kept).toContain('emergency-repairs')
  })

  it('plumbing → roofing keeps nothing plumbing-specific', async () => {
    const { sanitizeServicesForIndustry } = await import('../src/schemas/answers')
    const plumbing: Partial<Answers> = { ...DEMO_SCENARIOS[3].answers }
    const next = sanitizeServicesForIndustry({ ...plumbing, industry: 'roofing' })
    const kept = (next.services ?? []) as string[]
    expect(kept).not.toContain('diagnosis-inspection')
    // 'repairs' and 'replacements' exist in BOTH plumbing and roofing → kept
    expect(kept).toContain('repairs')
    expect(kept).toContain('replacements')
  })

  it('electrical → landscaping drops electrical-only work', async () => {
    const { sanitizeServicesForIndustry } = await import('../src/schemas/answers')
    const electrical: Partial<Answers> = {
      ...DEMO_SCENARIOS[5].answers,
      services: ['service-repairs', 'panel-upgrades', 'ev-chargers']
    }
    const next = sanitizeServicesForIndustry({ ...electrical, industry: 'landscaping' })
    expect(((next.services ?? []) as string[]).length).toBe(0)
    expect(next.services).toBeUndefined() // question asked again
  })

  it('remodeling ↔ landscaping preserves the genuinely shared design-build value', async () => {
    const { sanitizeServicesForIndustry } = await import('../src/schemas/answers')
    const remodeling: Partial<Answers> = {
      ...DEMO_SCENARIOS[5].answers,
      industry: 'remodeling',
      services: ['kitchens', 'design-build']
    }
    const next = sanitizeServicesForIndustry({ ...remodeling, industry: 'landscaping' })
    expect((next.services ?? []) as string[]).toEqual(['design-build'])
  })

  it('unrelated shared answers are never erased', async () => {
    const { sanitizeServicesForIndustry } = await import('../src/schemas/answers')
    const a: Partial<Answers> = {
      ...DEMO_SCENARIOS[0].answers,
      employees: '4-7',
      monthlyInquiries: '26-50',
      goals: ['respond-faster']
    }
    const next = sanitizeServicesForIndustry({ ...a, industry: 'roofing' })
    expect(next.employees).toBe('4-7')
    expect(next.monthlyInquiries).toBe('26-50')
    expect(next.goals).toEqual(['respond-faster'])
  })

  it('a switched industry produces an assessment with no stale trade findings', () => {
    // Engine-level guard: even answers that arrive stale (API, saved state)
    // never show another trade's services in the assessment.
    const stale: Answers = { ...DEMO_SCENARIOS[3].answers }
    ;(stale as unknown as Record<string, unknown>).services = ['installations', 'air-quality', 'emergency-repairs']
    // 'emergency-repairs' exists in both hvac and plumbing; the others do not.
    const bp = buildDeterministicBlueprint(stale)
    const workTypes = bp.currentSituation.confirmed.find((c) => c.startsWith('Work types:'))
    expect(workTypes).toBeTruthy()
    expect(workTypes).not.toContain('System installations & replacements')
    expect(workTypes).not.toContain('Indoor air quality')
    expect(workTypes).toContain('Emergency repairs') // the shared, legitimate value survives
  })
})

/* ── 4. Housecall Pro pricing metadata (P1.1) ───────────────────────────── */

describe('Housecall Pro knowledge-base entry is correct and fully attributed', () => {
  const hcp = SOFTWARE_BY_ID['housecall-pro']

  it('uses the verified official prices, annual vs monthly distinguished', () => {
    expect(hcp.pricing!.from).toBe(59) // $59 = annual billing (NOT the $79 month-to-month)
    expect(hcp.pricing!.note).toContain('$59/mo billed annually')
    expect(hcp.pricing!.note).toContain('$79/mo billed month-to-month')
    expect(hcp.pricing!.note).toContain('1 user included')
    expect(hcp.pricing!.note).toContain('ANNUAL billing — month-to-month is $79')
  })

  it('states currency, source, verification date, and changeability', () => {
    expect(hcp.pricing!.note).toContain('USD')
    expect(hcp.pricing!.note).toContain('housecallpro.com/pricing')
    expect(hcp.lastVerified).toBe('2026-10-30')
    expect(hcp.verifiedVia).toContain('housecallpro.com/pricing')
    expect(hcp.pricing!.note.toLowerCase()).toContain('subject to change')
  })

  it('the engine-facing recommendation no longer shows the wrong $49 price', () => {
    const bp = buildDeterministicBlueprint(DEMO_SCENARIOS[0].answers)
    const hcpRec = bp.software.stack.find((s) => s.softwareId === 'housecall-pro')
    if (hcpRec) {
      expect(hcpRec.monthlyCostEstimate).not.toBe(49)
      expect(hcpRec.costNote).toContain('billed annually')
      expect(hcpRec.costNote).toContain('month-to-month')
    }
  })

  it('every priced KB entry carries USD context and a verify-before-buying note', () => {
    for (const s of SOFTWARE) {
      if (!s.pricing || s.pricing.from === undefined || s.pricing.from === 0) continue
      expect(s.pricing.note.length, s.id).toBeGreaterThan(20)
      expect(
        /USD|US pricing|\$/.test(s.pricing.note),
        `${s.id} pricing note should state US dollars`
      ).toBe(true)
      expect(
        /verify|confirm|subject to change/i.test(s.pricing.note),
        `${s.id} pricing note should tell the reader to verify`
      ).toBe(true)
    }
  })
})

/* ── 5. Blueprint completeness: 12 sections, diagram, exports ───────────── */

describe('blueprint report structure (all 12 sections)', () => {
  it('the offline HTML export contains every section header', () => {
    for (const s of DEMO_SCENARIOS) {
      const html = buildStandaloneHtml(buildDeterministicBlueprint(s.answers))
      expect(html).toContain('<h2>1 · Your business profile</h2>')
      expect(html).toContain('<h2>2 · Your current situation')
      expect(html).toContain('<h2>3 · Operational assessment')
      expect(html).toContain('<h2>4 · Your recommended operating model</h2>')
      expect(html).toContain('<h2>5 · How your systems connect')
      expect(html).toContain('<h2>6 · Recommended AI, automation and human work</h2>')
      expect(html).toContain('<h2>7 · Recommended software</h2>')
      expect(html).toContain('<h2>8 · Implementation roadmap</h2>')
      expect(html).toContain('<h2>9 · Business improvement opportunities</h2>')
      expect(html).toContain('<h2>10 · Financial opportunity analysis</h2>')
      expect(html).toContain('<h2>11 · Your implementation plan</h2>')
      expect(html).toContain('<h2>12 · Let WebThangs help you implement this</h2>')
      // escaping holds: no raw script injection from blueprint fields
      expect(html).not.toContain('<script>')
    }
  })

  it('the diagram is connected for every demo scenario', () => {
    for (const s of DEMO_SCENARIOS) {
      const bp = buildDeterministicBlueprint(s.answers)
      const ids = new Set(bp.diagram.nodes.map((n) => n.id))
      expect(bp.diagram.nodes.length).toBeGreaterThanOrEqual(8)
      for (const e of bp.diagram.edges) {
        expect(ids.has(e.source)).toBe(true)
        expect(ids.has(e.target)).toBe(true)
      }
    }
  })

  it('section metadata covers all six questionnaire parts', () => {
    expect(Object.keys(SECTION_META).sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
  })
})
