/**
 * Implementation roadmap, implementation plan steps and improvement
 * narratives — all derived deterministically from the selected workflows and
 * software plan, with dependencies made explicit.
 */

import type {
  Answers,
  GoalId
} from '../types/answers'
import type {
  Finding,
  Improvement,
  ImplementationStep,
  RoadmapItem,
  RoadmapPhase,
  SoftwarePlan,
  WorkflowRecommendation
} from '../types/blueprint'

const PHASES: RoadmapPhase[] = [
  {
    phase: 1,
    title: 'Stabilize the front door',
    window: 'First 30 days',
    intent:
      'Stop losing customers at the moment of first contact and get one system holding your customer and job information.'
  },
  {
    phase: 2,
    title: 'Systematize the middle',
    window: 'Days 30–90',
    intent:
      'Move quoting, follow-up, scheduling, job records and invoicing into a smooth, connected flow.'
  },
  {
    phase: 3,
    title: 'Grow and get smarter',
    window: 'After 90 days',
    intent:
      'Add the AI layer, recurring revenue programs and measurement on top of a stable foundation.'
  }
]

const IMPACT_BY_PRIORITY: Record<number, 'high' | 'medium' | 'low'> = {
  1: 'high',
  2: 'medium',
  3: 'low'
}

export function buildRoadmap(
  workflows: WorkflowRecommendation[],
  software: SoftwarePlan
): { phases: RoadmapPhase[]; items: RoadmapItem[] } {
  const items: RoadmapItem[] = []

  /* Software adoption / verification entries come first in their phase. */
  const adopting = software.stack.filter((s) => s.status === 'adopt' && s.essential)
  const keeping = software.stack.filter((s) => s.status === 'keep' || s.status === 'verify')

  const fsmEntry = [...adopting, ...keeping].find((s) => s.category === 'fsm' || s.category === 'crm')

  let seq = 1
  if (fsmEntry && fsmEntry.status === 'adopt') {
    items.push({
      seq: seq++,
      phase: 1,
      title: `Set up ${fsmEntry.name} as your central system`,
      detail: `${fsmEntry.why} Start with customers, services and your price book, then connect your accounting sync before building any automations — everything else in this plan depends on this one system.`,
      effort: 'high',
      impact: 'high',
      dependsOn: [],
      workflowIds: []
    })
  } else if (fsmEntry) {
    items.push({
      seq: seq++,
      phase: 1,
      title: `Audit how you actually use ${fsmEntry.name}`,
      detail: `You already pay for ${fsmEntry.name}. Walk through each blueprint workflow marked “verify” and confirm whether the feature is switched on — adoption, not purchase, is the win here.`,
      effort: 'medium',
      impact: 'high',
      dependsOn: [],
      workflowIds: []
    })
  }

  /* Workflows map into phases by priority and kind. */
  for (const w of workflows) {
    let phase: 1 | 2 | 3
    if (w.priority === 1) phase = 1
    else if (w.priority === 2) phase = w.kind === 'human' ? 2 : 2
    else phase = 3

    // AI items always belong to phase 3 — data foundations first.
    if (w.kind === 'ai' || w.kind === 'human-ai') phase = 3
    // Measurement builds on captured data.
    if (w.id === 'W-ATTRIBUTION' || w.id === 'W-KPI-WEEKLY') phase = w.id === 'W-KPI-WEEKLY' ? 2 : 3

    const dependsOn: string[] = []
    if (fsmEntry && ['W-APPT-REMINDERS', 'W-DISPATCH-CALENDAR', 'W-ESTIMATE-KIT', 'W-ESTIMATE-TRACKING', 'W-FOLLOWUP-SEQUENCE', 'W-AUTO-INVOICE', 'W-PAYMENT-LINKS', 'W-AR-REMINDERS', 'W-STATUS-UPDATES', 'W-JOB-DOCS', 'W-REVIEW-REQUEST', 'W-ONLINE-BOOKING', 'W-ROUTE-DAY', 'W-AI-JOB-SUMMARY', 'W-AI-HISTORY-BRIEF'].includes(w.id)) {
      dependsOn.push(fsmEntry.status === 'adopt' ? `Set up ${fsmEntry.name}` : `Audit how you actually use ${fsmEntry.name}`)
    }
    if (w.id === 'W-AI-TRIAGE') dependsOn.push('W-FORM-CAPTURE')
    if (w.id === 'W-ATTRIBUTION') dependsOn.push('W-GA4-SETUP')
    if (w.id === 'W-LSA-START') dependsOn.push('W-MISSED-CALL-TEXT', 'W-RESPONSE-SLA')
    if (w.id === 'W-AI-HISTORY-BRIEF') dependsOn.push('W-JOB-DOCS')

    items.push({
      seq: seq++,
      phase,
      title: w.title,
      detail:
        w.mode === 'verify'
          ? `You may already have this capability in software you pay for — confirm it’s switched on and configured. ${w.summary}`
          : w.summary,
      effort: w.effort,
      impact: IMPACT_BY_PRIORITY[w.priority],
      dependsOn,
      workflowIds: [w.id]
    })
  }

  return { phases: PHASES, items }
}

export function buildImplementationPlan(
  answers: Answers,
  software: SoftwarePlan,
  roadmap: { items: RoadmapItem[] }
): ImplementationStep[] {
  const steps: ImplementationStep[] = []
  const fsm = software.stack.find((s) => s.category === 'fsm')
  const has = (id: string) => roadmap.items.some((i) => i.workflowIds.includes(id))

  const push = (title: string, detail: string, phase: string) =>
    steps.push({ seq: steps.length + 1, title, detail, phase })

  if (fsm && fsm.status === 'adopt') {
    push(
      `Configure ${fsm.name} as your single system`,
      'Import your customer list, set up services and pricebook, add your team as users, and connect the accounting sync (QuickBooks/Xero). Do this before any automation.',
      'Phase 1'
    )
  } else if (fsm) {
    push(
      `Run a usage audit on ${fsm.name}`,
      'Go feature by feature through the “verify” items in your blueprint and switch on what you already pay for: reminders, notifications, follow-ups and reporting.',
      'Phase 1'
    )
  }

  if (has('W-MISSED-CALL-TEXT')) {
    push(
      'Turn on missed-call capture',
      'Configure the missed-call text-back message and make returning the call-back list a named daily duty. Test it by calling yourself and hanging up.',
      'Phase 1'
    )
  }
  if (has('W-FORM-CAPTURE')) {
    push(
      'Wire your website forms to your system',
      'Replace “email me” forms with forms that create leads automatically, and send a test submission weekly for the first month.',
      'Phase 1'
    )
  }
  push(
    'Write the response rule down',
    'Agree as a team: every new inquiry gets a human answer within 15 minutes during work hours. Assign a lead-duty person per shift and put response time on the weekly review.',
    'Phase 1'
  )
  if (has('W-REVIEW-REQUEST')) {
    push('Switch on review requests', 'Configure the after-job review text with your Google review link; trigger it on payment, not just completion.', 'Phase 1')
  }
  if (has('W-APPT-REMINDERS')) {
    push('Switch on appointment reminders', 'Day-before and same-morning texts with the arrival window and tech name.', 'Phase 1')
  }
  if (has('W-ESTIMATE-KIT')) {
    push('Build your estimate templates', 'Turn your 10 most common jobs into templated, itemized quotes with photos and approval buttons.', 'Phase 2')
  }
  if (has('W-FOLLOWUP-SEQUENCE')) {
    push('Launch the follow-up sequence', 'Write two follow-up templates (day 2 and day 7), keep them human in tone, cap at three touches, and let replies stop the sequence.', 'Phase 2')
  }
  if (has('W-DISPATCH-CALENDAR')) {
    push('Move all scheduling into one calendar', 'Every tech, every job, one board. Drag-and-drop assignment with customer notifications on.', 'Phase 2')
  }
  if (has('W-AUTO-INVOICE') || has('W-PAYMENT-LINKS')) {
    push('Automate the invoice', 'Same-day invoicing on job completion with a payment link; confirm the accounting sync marks invoices paid automatically.', 'Phase 2')
  }
  if (has('W-GA4-SETUP')) {
    push('Install measurement', 'Google Tag Manager + GA4 with form and click-to-call events, so marketing decisions start having evidence behind them.', 'Phase 2')
  }
  if (has('W-KPI-WEEKLY')) {
    push('Start the weekly scorecard ritual', 'One page, every Monday: leads, response time, quotes won, jobs done, money collected, overdue balances.', 'Phase 2')
  }
  if (has('W-AI-TRIAGE') || has('W-AI-CALL-NOTES') || has('W-AI-JOB-SUMMARY') || has('W-AI-HISTORY-BRIEF')) {
    push(
      'Add the AI layer (only after the above runs)',
      'Start with one AI assist — inquiry triage or call notes — and keep a human reviewing outputs for the first month. Expand only when it earns trust.',
      'Phase 3'
    )
  }
  if (has('W-MAINTENANCE-PROGRAM')) {
    push('Design your maintenance program', 'Pick the visits, price and perks; train techs with a simple script; schedule members automatically.', 'Phase 3')
  }

  return steps
}

/* ── Improvement narratives (Section 9) ───────────────────────────────────── */

const GOAL_IMPROVEMENTS: Record<GoalId, { title: string; detail: string; related: string[] }> = {
  'more-leads': {
    title: 'A front door that captures what you already earn',
    detail: 'Faster responses, captured inquiries and reviews compound: more of the demand you already generate turns into booked jobs before any new ad spend.',
    related: ['Respond and qualify', 'Receive customer inquiries']
  },
  'respond-faster': {
    title: 'Response speed becomes a system, not a sprint',
    detail: 'With captured leads, routing and a 15-minute rule, your fastest-days performance becomes your every-day performance.',
    related: ['Respond and qualify']
  },
  'fewer-missed-calls': {
    title: 'Missed calls stop being lost customers',
    detail: 'Instant text-back plus same-day call-backs means a missed call becomes a delayed conversation instead of a goodbye.',
    related: ['Receive customer inquiries', 'Respond and qualify']
  },
  'convert-more': {
    title: 'Follow-up that wins quotes you already sent',
    detail: 'Systematic follow-up and visible pipelines recover jobs that today silently expire — usually the cheapest revenue increase available.',
    related: ['Follow up and win the job']
  },
  'less-admin': {
    title: 'Hours of paperwork handed to software',
    detail: 'Automated booking, job records and invoicing remove the re-typing layer between doing the work and getting paid for it.',
    related: ['Book an appointment or inspection', 'Invoice and collect payment']
  },
  'better-scheduling': {
    title: 'One calendar that shows the truth',
    detail: 'Shared visibility of techs, jobs and travel means fewer phone-tag loops, tighter days and confident arrival promises.',
    related: ['Schedule and assign work']
  },
  'profitable-jobs': {
    title: 'Costs and margins become visible',
    detail: 'With jobs, materials and hours recorded per job, you can finally see which work makes money — and price the rest accordingly.',
    related: ['Perform and manage the job', 'Measure business performance']
  },
  'better-payments': {
    title: 'Faster, calmer payment collection',
    detail: 'Same-day invoices with one-tap payment links and polite automatic reminders shorten the gap between done and paid.',
    related: ['Invoice and collect payment']
  },
  retention: {
    title: 'Past customers become a growth engine',
    detail: 'Review requests, maintenance reminders and a real customer history turn one-time jobs into a returning base.',
    related: ['After-service relationship']
  },
  visibility: {
    title: 'A weekly scoreboard for the whole business',
    detail: 'Leads, response times, close rates, revenue and receivables on one page — decisions stop depending on gut feel.',
    related: ['Measure business performance']
  },
  'reduce-fragmentation': {
    title: 'Fewer tools, more connection',
    detail: 'One field-service hub with native integrations replaces the patchwork where information had to be retyped by hand.',
    related: ['Measure business performance', 'Invoice and collect payment']
  }
}

export function buildImprovements(goals: GoalId[], findings: Finding[]): Improvement[] {
  const out: Improvement[] = []
  for (const g of goals) {
    const imp = GOAL_IMPROVEMENTS[g]
    if (imp) out.push({ title: imp.title, detail: imp.detail, relatedTo: imp.related })
  }
  /* Positive findings add honest context. */
  const strengths = findings.filter((f) => f.severity === 'positive')
  if (strengths.length > 0) {
    out.push({
      title: 'Strengths you keep while everything else improves',
      detail: strengths.map((s) => s.title.toLowerCase()).join('; ') +
        '. These are worth protecting explicitly as systems replace hustle.',
      relatedTo: strengths.flatMap((s) => s.relatedStages.map(() => 'Respond and qualify')).slice(0, 2)
    })
  }
  return out
}
