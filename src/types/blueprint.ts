/**
 * The Business Operations Blueprint — the platform's main product output.
 *
 * Everything in this file is produced by the deterministic engine and (for the
 * narrative text only) optionally personalized by Gemini. The structure is
 * plain data so it can be rendered, exported, printed and schema-validated.
 */

import type { IndustryId, GoalId } from './answers'

export const ENGINE_VERSION = '1.0.1'

export type ActorKind = 'human' | 'automation' | 'ai' | 'software'

export interface BlueprintNotice {
  code:
    | 'NO_API_KEY'
    | 'AI_DISABLED'
    | 'AI_DECLINED'
    | 'QUOTA'
    | 'MODEL_NOT_FOUND'
    | 'INVALID_AI_RESPONSE'
    | 'AI_ERROR'
    | 'AI_TIMEOUT'
  message: string
}

export interface BlueprintMeta {
  generatedAt: string
  engineVersion: string
  industry: IndustryId
  businessName?: string
  aiPersonalized: boolean
  aiModel?: string
  notice?: BlueprintNotice
}

/* ── Section 1: profile ─────────────────────────────────────────────────── */

export interface BusinessClassification {
  sizeTier: 'micro' | 'small' | 'medium' | 'larger'
  sizeLabel: string
  volumeTier: 'low' | 'moderate' | 'high' | 'unknown'
  volumeLabel: string
  techMaturity: 'manual' | 'basic' | 'digitized' | 'integrated'
  techLabel: string
  operationalPattern: 'owner-led' | 'delegated' | 'team-based'
  patternLabel: string
  demandPressure: 'under-utilized' | 'balanced' | 'at-capacity' | 'over-capacity' | 'unknown'
  demandLabel: string
}

export interface ProfileSummary {
  headline: string
  summary: string
  characteristics: string[]
  classification: BusinessClassification
  goals: GoalId[]
}

/* ── Section 2: current situation ───────────────────────────────────────── */

export interface CurrentSituation {
  confirmed: string[]
  assumed: string[]
}

/* ── Section 3: operational assessment ──────────────────────────────────── */

export type Maturity = 0 | 1 | 2 | 3 | null

export interface StageAssessment {
  stageId: number
  stageName: string
  maturity: Maturity
  maturityLabel: string
  currentState: string
  evidence: string[]
  gaps: string[]
  strength?: string
}

export interface Finding {
  id: string
  severity: 'high' | 'medium' | 'low' | 'positive'
  title: string
  detail: string
  evidence: string
  relatedStages: number[]
  workflowIds: string[]
}

export interface OperationalAssessment {
  stages: StageAssessment[]
  findings: Finding[]
}

/* ── Section 4: recommended operating model ─────────────────────────────── */

export interface StageFlowStep {
  actor: ActorKind
  action: string
}

export interface StagePlan {
  stageId: number
  stageName: string
  purpose: string
  industryNote?: string
  currentState: string
  recommendedFlow: StageFlowStep[]
  workflowIds: string[]
}

export interface OperatingModel {
  stages: StagePlan[]
  actorLegend: { kind: ActorKind; label: string; hint: string }[]
}

/* ── Section 6: workflows (automation / AI / human) ─────────────────────── */

export type WorkflowKind = 'automation' | 'ai' | 'human' | 'human-ai'
export type WorkflowMode = 'adopt' | 'verify' | 'keep'

export interface WorkflowRecommendation {
  id: string
  stageId: number
  stageName: string
  kind: WorkflowKind
  mode: WorkflowMode
  priority: 1 | 2 | 3
  effort: 'low' | 'medium' | 'high'
  title: string
  summary: string
  whatHappens: string
  trigger: string
  software: string[]
  dataFlow: string
  customerExperience: string
  employeeAction: string
  failureMode: string
  needsApproval: boolean
  approvalNote?: string
}

/* ── Section 7: software ────────────────────────────────────────────────── */

export type SoftwareStatus = 'keep' | 'adopt' | 'verify' | 'optional'

export interface SoftwareRecommendation {
  softwareId: string
  name: string
  category: string
  role: string
  why: string
  status: SoftwareStatus
  essential: boolean
  monthlyCostEstimate: number | null
  costNote: string
  verifiedIntegrations: string[]
  caveats: string
  website: string
}

export interface IntegrationNote {
  from: string
  to: string
  status: 'verified' | 'likely' | 'unverified'
  note: string
}

export interface SoftwarePlan {
  stack: SoftwareRecommendation[]
  integrations: IntegrationNote[]
  principles: string[]
}

/* ── Section 8: roadmap ─────────────────────────────────────────────────── */

export interface RoadmapPhase {
  phase: 1 | 2 | 3
  title: string
  window: string
  intent: string
}

export interface RoadmapItem {
  seq: number
  phase: 1 | 2 | 3
  title: string
  detail: string
  effort: 'low' | 'medium' | 'high'
  impact: 'high' | 'medium' | 'low'
  dependsOn: string[]
  workflowIds: string[]
}

/* ── Section 10: financials ─────────────────────────────────────────────── */

export interface FinancialInputs {
  monthlyInquiries: number | null
  monthlyAdSpend: number | null
  annualRevenue: number | null
  missedCallRate: number | null
  /** Modeled telephone share of ALL inquiries (v1.0.1) — stated, not measured. */
  phoneShareOfInquiries: number
  inputsAreMidpoints: boolean
}

export interface FinancialRow {
  label: string
  value: string
  note: string
  tone: 'measured' | 'estimate' | 'modeled'
}

export interface SoftwareCostLine {
  name: string
  cost: number | null
  note: string
}

export interface FinancialSection {
  inputs: FinancialInputs
  measured: FinancialRow[]
  estimates: FinancialRow[]
  modeled: FinancialRow[]
  assumptions: string[]
  softwareCost: { monthly: number | null; lines: SoftwareCostLine[]; note: string }
  disclaimer: string
}

/* ── Section 5: diagram ─────────────────────────────────────────────────── */

export type DiagramNodeKind = 'entry' | ActorKind | 'human-ai' | 'outcome'

export interface DiagramNode {
  id: string
  kind: DiagramNodeKind
  label: string
  detail: string
  stageId: number
  x: number
  y: number
  software?: string
}

export interface DiagramEdge {
  id: string
  source: string
  target: string
  label?: string
  animated: boolean
}

export interface Diagram {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

/* ── Section 9: improvements ────────────────────────────────────────────── */

export interface Improvement {
  title: string
  detail: string
  relatedTo: string[]
}

/* ── Section 11: implementation plan ────────────────────────────────────── */

export interface ImplementationStep {
  seq: number
  title: string
  detail: string
  phase: string
}

/* ── Section 12: consultation offer ─────────────────────────────────────── */

export interface ConsultationBlock {
  headline: string
  body: string
  ctaText: string
  bullets: string[]
}

/* ── AI personalization layer (validated, text-only) ────────────────────── */

export interface Personalization {
  executiveSummary: string
  stageInsights: { stageId: number; insight: string; tip: string }[]
  contextualNotes: string[]
  roadmapNarrative: string
  improvementNarrative: string
  consultationMessage: string
}

/* ── The blueprint ──────────────────────────────────────────────────────── */

export interface Blueprint {
  meta: BlueprintMeta
  profile: ProfileSummary
  currentSituation: CurrentSituation
  assessment: OperationalAssessment
  operatingModel: OperatingModel
  workflows: WorkflowRecommendation[]
  software: SoftwarePlan
  roadmap: { phases: RoadmapPhase[]; items: RoadmapItem[] }
  financials: FinancialSection
  diagram: Diagram
  improvements: Improvement[]
  implementationPlan: ImplementationStep[]
  consultation: ConsultationBlock
  personalization?: Personalization
}

/** Payload sent to the Gemini personalization step. */
export interface PersonalizationInput {
  answers: Record<string, unknown>
  blueprint: Blueprint
}
