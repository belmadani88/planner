/**
 * Operating model + diagram construction.
 *
 * Section 4 of the blueprint: for each of the 11 stages, the recommended flow
 * — who or what does each step (human / automation / AI / software) — built
 * from the selected workflows layered onto the universal backbone.
 *
 * Section 5: the system diagram graph (nodes + edges) consumed by React Flow.
 */

import type { Answers } from '../types/answers'
import type {
  Diagram,
  DiagramEdge,
  DiagramNode,
  StageAssessment,
  StagePlan,
  WorkflowRecommendation
} from '../types/blueprint'
import { STAGES } from '../data/stages'
import { INDUSTRIES_BY_ID } from '../data/industries'
import type { WorkflowStack } from '../data/workflows'

export function buildOperatingModel(
  a: Answers,
  stageAssessments: StageAssessment[],
  workflows: WorkflowRecommendation[]
): StagePlan[] {
  const industry = INDUSTRIES_BY_ID[a.industry]
  const hasWf = (id: string): WorkflowRecommendation | undefined =>
    workflows.find((w) => w.id === id)

  return STAGES.map((stage) => {
    const wf = workflows.filter((w) => w.stageId === stage.id)
    const assessment = stageAssessments.find((s) => s.stageId === stage.id)

    /* Backbone flows per stage, enriched by selected workflows. */
    let flow: StagePlan['recommendedFlow'] = []
    switch (stage.id) {
      case 1:
        flow = [
          { actor: 'human', action: 'You decide where marketing money goes — the system measures which of it becomes customers' + (hasWf('W-GA4-SETUP') ? '' : '') },
          ...(hasWf('W-LSA-START') ? [{ actor: 'human' as const, action: 'Pay-per-lead Local Services Ads put you at the top of Google for your trade and area' }] : []),
          ...(hasWf('W-GA4-SETUP') ? [{ actor: 'automation' as const, action: 'GA4 + Tag Manager quietly record which source produced every inquiry' }] : [])
        ]
        break
      case 2:
        flow = [
          { actor: 'human', action: 'Customers reach you by phone, form, message or referral' },
          ...(hasWf('W-MISSED-CALL-TEXT') ? [{ actor: 'automation' as const, action: 'If you can’t answer, an instant text keeps the conversation alive and saves the lead' }] : []),
          ...(hasWf('W-FORM-CAPTURE') ? [{ actor: 'automation' as const, action: 'Website forms create a lead record automatically — nothing dies in an inbox' }] : []),
          ...(hasWf('W-AI-TRIAGE') ? [{ actor: 'ai' as const, action: 'AI reads and tags every inbound message: topic, urgency, one-line summary (it never replies for you)' }] : [])
        ]
        break
      case 3:
        flow = [
          ...(hasWf('W-LEAD-ROUTING') ? [{ actor: 'automation' as const, action: 'New leads are auto-assigned to the right person with a notification' }] : []),
          { actor: 'human', action: 'A person responds within 15 minutes and qualifies the job with set questions' },
          ...(hasWf('W-AI-CALL-NOTES') ? [{ actor: 'ai' as const, action: 'AI writes the call summary onto the customer record so nothing is forgotten' }] : [])
        ]
        break
      case 4:
        flow = [
          { actor: 'human', action: 'The appointment is booked while the customer is still on the line' },
          ...(hasWf('W-APPT-REMINDERS') ? [{ actor: 'automation' as const, action: 'Reminder texts go out the day before and the morning of — confirmations tracked' }] : []),
          ...(hasWf('W-ONLINE-BOOKING') ? [{ actor: 'automation' as const, action: 'Non-urgent customers can book real availability themselves, any hour' }] : [])
        ]
        break
      case 5:
        flow = [
          ...(hasWf('W-ESTIMATE-KIT') ? [{ actor: 'human' as const, action: 'Quotes are built from templates and your pricebook — professional, itemized, fast' }] : [{ actor: 'human' as const, action: 'You scope the work and put a clear price in the customer’s hands' }]),
          ...(hasWf('W-ESTIMATE-TRACKING') ? [{ actor: 'software' as const, action: 'Every estimate carries a status: sent → viewed → won/lost' }] : [])
        ]
        break
      case 6:
        flow = [
          ...(hasWf('W-FOLLOWUP-SEQUENCE') ? [{ actor: 'automation' as const, action: 'Gentle automatic follow-ups fire on day 2 and day 7 until the customer answers' }] : []),
          ...(hasWf('W-PIPELINE-BOARD') ? [{ actor: 'human' as const, action: 'A weekly 15-minute review walks every open quote and assigns the next step' }] : [{ actor: 'human' as const, action: 'You track open quotes in one view and follow up until each is won or lost' }])
        ]
        break
      case 7:
        flow = [
          ...(hasWf('W-DISPATCH-CALENDAR') ? [{ actor: 'software' as const, action: 'One dispatch calendar shows every tech, job, travel time and priority' }] : [{ actor: 'human' as const, action: 'Jobs are scheduled against real availability' }]),
          ...(hasWf('W-ROUTE-DAY') ? [{ actor: 'automation' as const, action: 'Each tech gets their morning route with addresses, history and notes on their phone' }] : [])
        ]
        break
      case 8:
        flow = [
          { actor: 'human', action: 'Technicians do the work — the human judgment no software replaces' },
          ...(hasWf('W-STATUS-UPDATES') ? [{ actor: 'automation' as const, action: '“On my way” and “job done” texts keep customers informed without office phone calls' }] : []),
          ...(hasWf('W-JOB-DOCS') ? [{ actor: 'human' as const, action: 'Photos, notes, parts and recommendations recorded on the job' }] : []),
          ...(hasWf('W-AI-JOB-SUMMARY') ? [{ actor: 'ai' as const, action: 'AI drafts the customer-ready summary and invoice description — a human approves it' }] : [])
        ]
        break
      case 9:
        flow = [
          ...(hasWf('W-AUTO-INVOICE') ? [{ actor: 'automation' as const, action: 'The invoice generates and sends itself the day the job completes' }] : [{ actor: 'human' as const, action: 'The invoice goes out promptly after completion' }]),
          ...(hasWf('W-PAYMENT-LINKS') ? [{ actor: 'automation' as const, action: 'Customers pay with one tap from a text — invoice marks itself paid' }] : []),
          ...(hasWf('W-AR-REMINDERS') ? [{ actor: 'automation' as const, action: 'Polite reminders chase overdue balances on a schedule' }] : [])
        ]
        break
      case 10:
        flow = [
          ...(hasWf('W-REVIEW-REQUEST') ? [{ actor: 'automation' as const, action: 'A well-timed review request follows every completed job' }] : []),
          ...(hasWf('W-MAINTENANCE-PROGRAM') ? [{ actor: 'human' as const, action: 'Customers are offered a maintenance plan; members are scheduled and billed automatically' }] : [{ actor: 'human' as const, action: 'Past customers hear from you before they need you' }]),
          ...(hasWf('W-AI-HISTORY-BRIEF') ? [{ actor: 'ai' as const, action: 'When a past customer calls, AI shows a three-line brief of your entire history together' }] : [])
        ]
        break
      case 11:
        flow = [
          ...(hasWf('W-KPI-WEEKLY') ? [{ actor: 'automation' as const, action: 'A one-page weekly scorecard arrives by email: leads, response times, close rate, revenue, receivables' }] : [{ actor: 'human' as const, action: 'You review the numbers that matter on a fixed rhythm' }]),
          ...(hasWf('W-ATTRIBUTION') ? [{ actor: 'automation' as const, action: 'Ad spend and lead sources join together: cost per lead per channel, monthly' }] : [])
        ]
        break
      default:
        flow = [{ actor: 'human', action: stage.purpose }]
    }

    return {
      stageId: stage.id,
      stageName: stage.name,
      purpose: stage.purpose,
      industryNote: industry.stageNotes[stage.id],
      currentState:
        assessment?.currentState ?? 'Details unknown from your answers.',
      recommendedFlow: flow,
      workflowIds: wf.map((w) => w.id)
    }
  })
}

/* ── Diagram ──────────────────────────────────────────────────────────────── */

export function buildDiagram(
  a: Answers,
  workflows: WorkflowRecommendation[],
  stack: WorkflowStack
): Diagram {
  const nodes: DiagramNode[] = []
  const edges: DiagramEdge[] = []
  const has = (id: string) => workflows.some((w) => w.id === id)

  const COL_X = 300
  const push = (n: Omit<DiagramNode, 'x' | 'y'>) => {
    const colIndex = nodes.filter((x) => x.stageId === n.stageId).length
    nodes.push({ ...n, x: n.stageId * COL_X + 40, y: 60 + colIndex * 115 })
  }
  const edge = (source: string, target: string, label?: string, animated = false) =>
    edges.push({ id: `e-${source}-${target}`, source, target, label, animated })

  const hubLabel = stack.fsm?.name ?? (stack.marketingCrm ? 'GoHighLevel' : 'Jobber')

  /* Column 1 (stage 1/2): entry points. */
  const byPhone = a.callVsWebMix !== 'mostly-web'
  const byWeb = a.channels.includes('website') || a.websitePlatform !== 'no-website'
  const bySocial = a.channels.includes('social')
  const byReferral = a.channels.includes('referrals') || a.channels.includes('repeat')
  if (byPhone) push({ id: 'n-phone', kind: 'entry', label: 'Phone calls', detail: 'Customers call — the highest-intent channel in home services.', stageId: 2 })
  if (byWeb) push({ id: 'n-form', kind: 'entry', label: 'Website form / booking', detail: 'Visitors submit an inquiry on your site.', stageId: 2 })
  if (bySocial) push({ id: 'n-social', kind: 'entry', label: 'Social messages', detail: 'Messages from Facebook, Instagram or similar.', stageId: 2 })
  if (byReferral) push({ id: 'n-referral', kind: 'entry', label: 'Referrals & repeat customers', detail: 'Word of mouth — your cheapest and best leads.', stageId: 2 })

  /* Column 2 (stage 2): capture & triage automations. */
  if (has('W-MISSED-CALL-TEXT') && byPhone) push({ id: 'n-missedtext', kind: 'automation', label: 'Missed-call text-back', detail: 'Unanswered calls instantly get a text and become a saved lead.', stageId: 2, software: 'VoIP / CRM' })
  if (has('W-FORM-CAPTURE') && byWeb) push({ id: 'n-formcapture', kind: 'automation', label: 'Form → lead automatically', detail: 'Website submissions create a lead record in seconds.', stageId: 2, software: hubLabel })
  if (has('W-AI-TRIAGE')) push({ id: 'n-triage', kind: 'ai', label: 'AI triage & urgency tag', detail: 'AI labels every inbound message by topic and urgency. It never replies for you.', stageId: 2, software: 'CRM AI feature' })

  /* Column 3 (stage 3): the human response + CRM hub. */
  push({ id: 'n-crm', kind: 'software', label: `${hubLabel} — your customer & job hub`, detail: 'Every customer, lead, job, quote and invoice in one place. The system of record everything else connects to.', stageId: 3, software: hubLabel })
  push({ id: 'n-csr', kind: 'human', label: 'You / your team respond & qualify', detail: 'A human answers within 15 minutes, understands the problem and decides if the job fits.', stageId: 3 })
  if (has('W-LEAD-ROUTING')) push({ id: 'n-routing', kind: 'automation', label: 'Auto-assign to the right person', detail: 'Leads route by job type, area or on-shift rules with a notification.', stageId: 3, software: hubLabel })

  /* Column 4 (stage 4): booking. */
  if (has('W-ONLINE-BOOKING')) push({ id: 'n-booking', kind: 'automation', label: 'Online booking (real availability)', detail: 'Non-urgent customers book a genuinely free slot themselves.', stageId: 4, software: hubLabel })
  if (has('W-APPT-REMINDERS')) push({ id: 'n-reminders', kind: 'automation', label: 'Appointment reminders', detail: 'Day-before and morning-of texts with confirmations tracked.', stageId: 4, software: hubLabel })

  /* Column 5 (stage 5/6): estimates & follow-up. */
  if (has('W-ESTIMATE-KIT') || has('W-ESTIMATE-TRACKING')) push({ id: 'n-estimate', kind: 'human-ai', label: 'Templated estimate + status tracking', detail: 'Professional quotes from your pricebook, each with a status: sent → viewed → won/lost.', stageId: 5, software: hubLabel })
  if (has('W-FOLLOWUP-SEQUENCE')) push({ id: 'n-followup', kind: 'automation', label: 'Automatic follow-ups', detail: 'Gentle day-2 and day-7 nudges on open quotes — automatic until the customer replies.', stageId: 6, software: hubLabel })

  /* Column 6 (stage 7): scheduling. */
  push({ id: 'n-dispatch', kind: 'software', label: 'Dispatch calendar', detail: 'Every tech, job and travel window on one board — capacity visible before you promise anything.', stageId: 7, software: hubLabel })
  if (has('W-ROUTE-DAY')) push({ id: 'n-route', kind: 'automation', label: 'Morning routes to each tech', detail: 'Ordered route, addresses, customer history and notes on their phone.', stageId: 7, software: hubLabel })

  /* Column 7 (stage 8): the job. */
  push({ id: 'n-tech', kind: 'human', label: 'Technician performs the work', detail: 'The skilled human core of the business — no software replaces this.', stageId: 8 })
  if (has('W-STATUS-UPDATES')) push({ id: 'n-status', kind: 'automation', label: '“On my way” / “done” texts', detail: 'Status taps send customers live updates and keep the office informed.', stageId: 8, software: hubLabel })
  if (has('W-JOB-DOCS')) push({ id: 'n-jobdocs', kind: 'human', label: 'Photos & job records', detail: 'Before/after photos, parts, notes and recommendations saved per job.', stageId: 8, software: hubLabel })
  if (has('W-AI-JOB-SUMMARY')) push({ id: 'n-aisummary', kind: 'ai', label: 'AI drafts job paperwork', detail: 'Tech notes become a clean summary and invoice description — human-approved.', stageId: 8, software: 'AI feature' })

  /* Column 8 (stage 9): money. */
  if (has('W-AUTO-INVOICE') || has('W-PAYMENT-LINKS')) push({ id: 'n-invoice', kind: 'automation', label: 'Auto invoice + pay-by-text', detail: 'Invoice generates on completion; customers pay with one tap.', stageId: 9, software: hubLabel })
  if (has('W-AR-REMINDERS')) push({ id: 'n-ar', kind: 'automation', label: 'Overdue balance reminders', detail: 'Polite scheduled chasers; seriously overdue cases flagged for a human call.', stageId: 9, software: hubLabel })
  push({ id: 'n-accounting', kind: 'software', label: 'Accounting (QuickBooks / Xero)', detail: 'Books stay in sync automatically — no re-typing.', stageId: 9, software: stack.accounting?.name ?? 'QuickBooks' })

  /* Column 9 (stage 10): relationship. */
  if (has('W-REVIEW-REQUEST')) push({ id: 'n-review', kind: 'automation', label: 'Review request', detail: 'A one-tap Google review link after every good job.', stageId: 10, software: hubLabel })
  if (has('W-MAINTENANCE-PROGRAM')) push({ id: 'n-maintenance', kind: 'human-ai', label: 'Maintenance program', detail: 'Recurring plans with auto-scheduled visits and billing smooth seasonal demand.', stageId: 10, software: hubLabel })
  if (has('W-AI-HISTORY-BRIEF')) push({ id: 'n-history', kind: 'ai', label: 'AI history brief on repeat calls', detail: 'Three lines: who they are, what you’ve done, what was recommended.', stageId: 10, software: 'AI feature' })

  /* Column 10 (stage 11): measurement. */
  if (has('W-KPI-WEEKLY')) push({ id: 'n-kpi', kind: 'automation', label: 'Weekly scorecard', detail: 'One page every Monday: leads, response time, close rate, revenue, receivables.', stageId: 11, software: hubLabel })
  if (has('W-GA4-SETUP') || has('W-ATTRIBUTION')) push({ id: 'n-ga4', kind: 'automation', label: 'GA4 + channel cost per lead', detail: 'Which marketing brings customers — and what each lead costs.', stageId: 11, software: 'GA4' })

  /* ── Edges: the customer-to-cash journey ────────────────────────────────── */
  const captureNodes = ['n-missedtext', 'n-formcapture', 'n-triage'].filter((id) => nodes.some((n) => n.id === id))
  const entryTargets = captureNodes.length > 0 ? captureNodes : ['n-crm']

  for (const entry of ['n-phone', 'n-form', 'n-social', 'n-referral']) {
    if (!nodes.some((n) => n.id === entry)) continue
    const target = entry === 'n-phone' && nodes.some((n) => n.id === 'n-missedtext')
      ? 'n-missedtext'
      : entry === 'n-form' && nodes.some((n) => n.id === 'n-formcapture')
        ? 'n-formcapture'
        : entryTargets[0]
    edge(entry, target, undefined, true)
  }
  for (const c of captureNodes) edge(c, 'n-crm', undefined, true)
  edge('n-crm', 'n-csr')
  if (nodes.some((n) => n.id === 'n-routing')) edge('n-crm', 'n-routing', undefined, true)

  /* CSR → booking / estimate. */
  const afterRespond: string[] = []
  for (const id of ['n-booking', 'n-reminders', 'n-estimate']) if (nodes.some((n) => n.id === id)) afterRespond.push(id)
  for (const id of afterRespond) edge('n-csr', id)
  if (nodes.some((n) => n.id === 'n-followup')) {
    const src = nodes.some((n) => n.id === 'n-estimate') ? 'n-estimate' : 'n-csr'
    edge(src, 'n-followup', undefined, true)
    edge('n-followup', 'n-dispatch', 'won')
  }
  const scheduleSources = nodes.some((n) => n.id === 'n-followup')
    ? []
    : ['n-estimate', 'n-reminders', 'n-booking', 'n-csr']
  for (const id of scheduleSources) if (nodes.some((n) => n.id === id)) edge(id, 'n-dispatch', undefined, true)
  if (nodes.some((n) => n.id === 'n-route')) edge('n-dispatch', 'n-route', undefined, true)
  edge(nodes.some((n) => n.id === 'n-route') ? 'n-route' : 'n-dispatch', 'n-tech')
  for (const id of ['n-status', 'n-jobdocs', 'n-aisummary']) {
    if (nodes.some((n) => n.id === id)) edge('n-tech', id, undefined, true)
  }
  const invoiceSrc = nodes.some((n) => n.id === 'n-aisummary') ? 'n-aisummary' : nodes.some((n) => n.id === 'n-jobdocs') ? 'n-jobdocs' : 'n-tech'
  if (nodes.some((n) => n.id === 'n-invoice')) edge(invoiceSrc, 'n-invoice', undefined, true)
  const accountingSrc = nodes.some((n) => n.id === 'n-invoice') ? 'n-invoice' : invoiceSrc
  edge(accountingSrc, 'n-accounting')
  if (nodes.some((n) => n.id === 'n-ar')) edge('n-accounting', 'n-ar', undefined, true)
  const afterSrc = nodes.some((n) => n.id === 'n-ar') ? 'n-ar' : 'n-accounting'
  for (const id of ['n-review', 'n-maintenance', 'n-history']) {
    if (nodes.some((n) => n.id === id)) edge(afterSrc, id, undefined, true)
  }
  /* Measurement draws from the hub. */
  for (const id of ['n-kpi', 'n-ga4']) if (nodes.some((n) => n.id === id)) edge('n-crm', id, 'data', false)
  /* The relationship loop back to referrals. */
  if (nodes.some((n) => n.id === 'n-referral') && (nodes.some((n) => n.id === 'n-review') || nodes.some((n) => n.id === 'n-maintenance'))) {
    const src = nodes.some((n) => n.id === 'n-maintenance') ? 'n-maintenance' : 'n-review'
    edge(src, 'n-referral', 'more referrals', true)
  }

  /* De-duplicate edge ids. */
  const seen = new Set<string>()
  const uniqueEdges = edges.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })

  return { nodes, edges: uniqueEdges }
}
