/**
 * Workflow selection: deterministic filtering of the workflow library.
 *
 * Selection rules are code, not AI: industry fit, applicability conditions,
 * and mode (adopt / verify / keep) come from the owner's answers. The
 * selection is capped and prioritized so the blueprint stays readable.
 */

import type { Answers } from '../types/answers'
import type {
  BusinessClassification,
  Finding,
  WorkflowRecommendation
} from '../types/blueprint'
import { WORKFLOW_LIBRARY, type WorkflowContext, type WorkflowDef, type WorkflowStack } from '../data/workflows'
import { INDUSTRIES_BY_ID } from '../data/industries'
import { STAGES_BY_ID } from '../data/stages'
import { SOFTWARE_BY_ID } from '../data/software'
import { hasAnalytics, hasFsm, hasMarketingCrm } from './classify'

export function buildWorkflowStack(a: Answers): WorkflowStack {
  const fsmId = hasFsm(a) && a.fsm !== 'other-fsm' ? a.fsm : undefined
  const crmId =
    a.crm === 'gohighlevel' ? 'gohighlevel' : a.crm === 'hubspot' ? 'hubspot' : undefined
  const automationId = a.automationTools.find((t) => ['zapier', 'make', 'n8n'].includes(t))
  return {
    fsm: fsmId ? SOFTWARE_BY_ID[fsmId] : undefined,
    crm: crmId ? SOFTWARE_BY_ID[crmId] : undefined,
    marketingCrm: hasMarketingCrm(a),
    automation: automationId ? SOFTWARE_BY_ID[automationId] : undefined,
    accounting:
      a.accounting === 'quickbooks' || a.accounting === 'xero'
        ? SOFTWARE_BY_ID[a.accounting]
        : undefined,
    hasWebsite: a.websitePlatform !== 'no-website' && a.websitePlatform !== 'not-sure',
    hasAnalytics: hasAnalytics(a),
    hasVoip: a.phoneSystem === 'voip',
    usesLsa: a.marketingTools.includes('lsap') || a.channels.includes('lsa')
  }
}

export function buildWorkflowContext(
  a: Answers,
  classification: BusinessClassification,
  findings: Finding[],
  stack: WorkflowStack
): WorkflowContext {
  return {
    answers: a,
    industry: INDUSTRIES_BY_ID[a.industry],
    classification,
    findingIds: new Set(findings.map((f) => f.id)),
    stack
  }
}

const KIND_LABEL: Record<WorkflowDef['kind'], string> = {
  automation: 'Conventional automation',
  ai: 'AI-assisted',
  human: 'Human-controlled',
  'human-ai': 'Human + AI together'
}

export function kindLabel(kind: WorkflowDef['kind']): string {
  return KIND_LABEL[kind]
}

/** Software names to display for a workflow given the recommended stack. */
function softwareDisplay(w: WorkflowDef, stack: WorkflowStack): string[] {
  const names: string[] = []
  for (const role of w.softwareRoles) {
    switch (role) {
      case 'fsm':
        names.push(stack.fsm?.name ?? 'Your field-service platform (see Section 7)')
        break
      case 'crm':
        names.push(stack.crm?.name ?? stack.marketingCrm ? 'Your CRM' : 'Your customer system')
        break
      case 'automation':
        names.push(stack.automation?.name ?? 'Built-in automations / Make (free tier)')
        break
      case 'accounting':
        names.push(stack.accounting?.name ?? 'QuickBooks Online / Xero')
        break
      case 'analytics':
        names.push('Google Analytics 4 + Tag Manager')
        break
      case 'phone':
        names.push('A business phone system (VoIP)')
        break
      case 'website':
        names.push('Your website')
        break
      case 'channel':
        names.push('Google Local Services Ads')
        break
      case 'ai':
        names.push('An AI feature inside the above')
        break
      default:
        break
    }
  }
  return [...new Set(names)]
}

const MAX_SELECTED = 18
const MAX_PRIORITY3 = 5

export function selectWorkflows(ctx: WorkflowContext): WorkflowRecommendation[] {
  const eligible = WORKFLOW_LIBRARY.filter((w) => {
    if (w.industries && !w.industries.includes(ctx.answers.industry)) return false
    if (w.appliesWhen && !w.appliesWhen(ctx)) return false
    return true
  })

  /* Deterministic ordering: priority tier first, industry-accented workflows
     boosted within their tier, then library order (stable sort). */
  const accent = new Set(ctx.industry.accentWorkflows)
  const ordered = [...eligible].sort((x, y) => {
    if (x.priority !== y.priority) return x.priority - y.priority
    const ax = accent.has(x.id) ? 0 : 1
    const ay = accent.has(y.id) ? 0 : 1
    if (ax !== ay) return ax - ay
    return 0
  })

  const selected: WorkflowDef[] = []
  let p3Count = 0
  for (const w of ordered) {
    if (w.priority === 3 && p3Count >= MAX_PRIORITY3) continue
    if (w.priority === 3) p3Count += 1
    selected.push(w)
    if (selected.length >= MAX_SELECTED) break
  }

  return selected.map((w) => {
    const mode = w.modeWhen ? w.modeWhen(ctx) : 'adopt'
    return {
      id: w.id,
      stageId: w.stageId,
      stageName: STAGES_BY_ID[w.stageId]?.name ?? `Stage ${w.stageId}`,
      kind: w.kind,
      mode,
      priority: w.priority,
      effort: w.effort,
      title: w.title,
      summary: w.summary,
      whatHappens: w.whatHappens,
      trigger: w.trigger,
      software: softwareDisplay(w, ctx.stack),
      dataFlow: w.dataFlow,
      customerExperience: w.customerExperience,
      employeeAction: w.employeeAction,
      failureMode: w.failureMode,
      needsApproval: w.needsApproval,
      approvalNote: w.approvalNote
    }
  })
}

export function findWorkflowRecommendations(workflowIds: string[], selected: WorkflowRecommendation[]): WorkflowRecommendation[] {
  const byId = new Map(selected.map((w) => [w.id, w]))
  return workflowIds.map((id) => byId.get(id)).filter((w): w is WorkflowRecommendation => !!w)
}
