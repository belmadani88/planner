/**
 * Deterministic blueprint orchestrator.
 *
 * Business logic before AI: the entire blueprint is computed here, from
 * answers alone, in pure TypeScript. Identical inputs always produce an
 * identical core blueprint. Gemini (when available) only personalizes the
 * narrative text — never the structure, recommendations or numbers.
 */

import type { Answers } from '../types/answers'
import type { Blueprint, Finding, ProfileSummary, CurrentSituation } from '../types/blueprint'
import { ENGINE_VERSION } from '../types/blueprint'
import { INDUSTRIES_BY_ID } from '../data/industries'
import { classifyBusiness } from './classify'
import { assessStages } from './stages'
import { detectFindings } from './findings'
import { buildWorkflowStack, buildWorkflowContext, selectWorkflows } from './workflows'
import { buildSoftwarePlan } from './software'
import { buildFinancials } from './financial'
import { buildRoadmap, buildImplementationPlan, buildImprovements } from './roadmap'
import { buildOperatingModel, buildDiagram } from './model'
import { labelOf, joinList } from './labels'

const ACTOR_LEGEND = [
  { kind: 'human' as const, label: 'Human-controlled', hint: 'Judgment, relationships, pricing, safety — done by people, always.' },
  { kind: 'automation' as const, label: 'Automation', hint: 'Predictable, repetitive tasks done by software on a trigger — the same way every time.' },
  { kind: 'ai' as const, label: 'AI-assisted', hint: 'AI reads, summarizes, classifies and drafts — preparing work for people, under human review.' },
  { kind: 'software' as const, label: 'Software system', hint: 'The systems of record: CRM, scheduling, accounting — where information lives.' }
]

export function buildDeterministicBlueprint(answers: Answers): Blueprint {
  const industry = INDUSTRIES_BY_ID[answers.industry]
  const classification = classifyBusiness(answers)
  const stageAssessments = assessStages(answers)
  const findings = detectFindings(answers, classification)
  const stack = buildWorkflowStack(answers)
  const ctx = buildWorkflowContext(answers, classification, findings, stack)
  const workflows = selectWorkflows(ctx)
  const software = buildSoftwarePlan(answers, classification, stack)
  const financials = buildFinancials(answers, software)
  const roadmap = buildRoadmap(workflows, software)
  const operatingModel = {
    stages: buildOperatingModel(answers, stageAssessments, workflows),
    actorLegend: ACTOR_LEGEND
  }
  const diagram = buildDiagram(answers, workflows, stack)
  const improvements = buildImprovements(answers.goals, findings)
  const implementationPlan = buildImplementationPlan(answers, software, roadmap)

  /* ── Profile summary ─────────────────────────────────────────────────── */
  const topFindings = findings.filter((f) => f.severity !== 'positive').slice(0, 3)
  const profile: ProfileSummary = {
    headline: `${industry.name} business · ${classification.sizeLabel.split(' (')[0]} · ${classification.volumeLabel.split(' (')[0].toLowerCase()}`,
    summary: `You run a ${industry.tagline.toLowerCase()} with ${labelOf('employees', answers) ?? 'your team'}${
      answers.technicians && answers.technicians !== 'not-sure' ? ` (${labelOf('technicians', answers)} in the field)` : ''
    }. ${classification.techLabel}. ${classification.patternLabel}. ${
      topFindings.length > 0
        ? `Based on your answers, the most impactful starting points are: ${joinList(topFindings.map((f) => f.title.toLowerCase()))}.`
        : 'Your answers show an operation without glaring weaknesses — the plan focuses on deepening what works.'
    }`,
    characteristics: [
      classification.sizeLabel,
      classification.volumeLabel,
      classification.techLabel,
      classification.patternLabel,
      classification.demandLabel,
      `Sales cycle: ${industry.salesCycle}`,
      industry.emergencyHeavy ? 'Demand includes urgent, same-day emergencies' : 'Demand is mostly planned work',
      `Recurring revenue potential: ${industry.recurringRevenue.replace('-', ' ')}`
    ],
    classification,
    goals: answers.goals
  }

  /* ── Current situation: confirmed vs assumed ─────────────────────────── */
  const confirmed: string[] = []
  const addConfirmed = (q: keyof typeof answers) => {
    const l = labelOf(q, answers)
    if (l) confirmed.push(l)
  }
  addConfirmed('industry')
  if (answers.services.length > 0) confirmed.push(`Work types: ${labelOf('services', answers)}`)
  addConfirmed('employees')
  addConfirmed('technicians')
  addConfirmed('yearsOperating')
  addConfirmed('monthlyInquiries')
  addConfirmed('responseSpeed')
  addConfirmed('missedCalls')
  addConfirmed('bookingProcess')
  addConfirmed('estimateProcess')
  addConfirmed('estimateFollowUp')
  addConfirmed('invoicing')
  addConfirmed('fsm')
  addConfirmed('crm')
  addConfirmed('accounting')

  const assumed: string[] = []
  if (answers.revenue === 'prefer-not' || answers.revenue === undefined) {
    assumed.push('Revenue figures were not provided, so no revenue-based scenarios are calculated.')
  } else {
    assumed.push(`Revenue was given as a range (${labelOf('revenue', answers)}); scenarios use the midpoint of that range.`)
  }
  if (answers.monthlyInquiries === 'not-sure' || answers.monthlyAdSpend === 'not-sure') {
    assumed.push('Some acquisition numbers were marked “I don’t know” — cost-per-lead math is skipped rather than guessed.')
  }
  if (answers.missedCalls === 'not-sure') {
    assumed.push('Missed-call rate unknown — recovery scenarios are skipped.')
  }
  assumed.push('Conversion and recovery rates used in scenarios are stated assumptions, not industry benchmarks — see Section 10.')

  const currentSituation: CurrentSituation = { confirmed, assumed }

  /* ── Consultation block (Section 12) ─────────────────────────────────── */
  const consultation = {
    headline: 'Ready to make this your operating reality?',
    body:
      'We have shown you how your business could operate more efficiently. WebThangs can help configure your systems, connect the necessary software and implement the recommended workflows — from the response rules to the dispatch calendar to the AI layer. You bring the trade expertise; we bring the systems engineering.',
    ctaText: 'Book a free implementation consultation',
    bullets: [
      'Free, no-obligation consultation call',
      'We already understand your situation from this blueprint — no starting from zero',
      'Systems setup, integrations and workflow implementation (WordPress, CRM, automation)',
      'Clear scope and pricing before any work begins'
    ]
  }

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
      industry: answers.industry,
      businessName: answers.businessName,
      aiPersonalized: false
    },
    profile,
    currentSituation,
    assessment: { stages: stageAssessments, findings },
    operatingModel,
    workflows,
    software,
    roadmap,
    financials,
    diagram,
    improvements,
    implementationPlan,
    consultation
  }
}

/** Compact summary of a blueprint for the AI personalization prompt. */
export function compactBlueprintForAI(bp: Blueprint): Record<string, unknown> {
  return {
    industry: bp.meta.industry,
    businessName: bp.meta.businessName,
    classification: {
      size: bp.profile.classification.sizeLabel,
      volume: bp.profile.classification.volumeLabel,
      tech: bp.profile.classification.techLabel,
      pattern: bp.profile.classification.patternLabel,
      demand: bp.profile.classification.demandLabel
    },
    goals: bp.profile.goals,
    topFindings: bp.assessment.findings.slice(0, 6).map((f: Finding) => ({
      severity: f.severity,
      title: f.title,
      evidence: f.evidence
    })),
    stageMaturity: bp.assessment.stages.map((s) => ({
      stage: s.stageName,
      maturity: s.maturityLabel,
      gaps: s.gaps.slice(0, 2)
    })),
    workflows: bp.workflows.map((w) => ({ id: w.id, title: w.title, stage: w.stageName, mode: w.mode, kind: w.kind })),
    softwareStack: bp.software.stack.map((s) => ({ name: s.name, status: s.status, role: s.role })),
    roadmapTitles: bp.roadmap.items.slice(0, 10).map((i) => i.title),
    financialHighlights: {
      modeled: bp.financials.modeled.slice(0, 5).map((m) => `${m.label}: ${m.value}`),
      assumptions: bp.financials.assumptions.length
    }
  }
}

export { detectFindings, classifyBusiness, assessStages }
