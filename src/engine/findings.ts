/**
 * Operational findings — evidence-driven, never manufactured.
 *
 * Each rule fires only when the owner's own answers support it, and quotes
 * that answer as evidence. Positive findings are surfaced too: an honest
 * assessment says what already works.
 */

import type { Answers } from '../types/answers'
import type { Finding } from '../types/blueprint'
import { labelOf } from './labels'
import type { BusinessClassification } from '../types/blueprint'

interface FindingRule {
  id: string
  severity: Finding['severity']
  title: string
  detail: string
  evidence: (a: Answers) => string | null
  relatedStages: number[]
  workflowIds: string[]
}

const RULES: FindingRule[] = [
  {
    id: 'F-SLOW-RESPONSE',
    severity: 'high',
    title: 'New inquiries wait hours for a reply',
    detail:
      'In home services the first company to respond usually wins the visit. When replies take hours or vary with who’s available, a share of inquiries quietly signs with whoever answered first — often without you ever knowing.',
    evidence: (a) => (a.responseSpeed && ['few-hours', 'same-day', 'next-day-plus', 'varies'].includes(a.responseSpeed) ? `You told us: response is “${labelOf('responseSpeed', a)}”.` : null),
    relatedStages: [3],
    workflowIds: ['W-RESPONSE-SLA', 'W-MISSED-CALL-TEXT', 'W-FORM-CAPTURE']
  },
  {
    id: 'F-MISSED-CALLS',
    severity: 'high',
    title: 'Missed calls are leaking customers',
    detail:
      'Every unanswered call is a customer actively trying to give you money. Most callers work down a Google list until someone picks up — the missed call rarely comes back on its own.',
    evidence: (a) =>
      ['few', 'quarter', 'half-plus'].includes(a.missedCalls)
        ? `You told us: “${labelOf('missedCalls', a)}” calls get missed.`
        : null,
    relatedStages: [2, 3],
    workflowIds: ['W-MISSED-CALL-TEXT', 'W-RESPONSE-SLA', 'W-LEAD-ROUTING']
  },
  {
    id: 'F-MISSED-CALL-RECOVERY',
    severity: 'high',
    title: 'Missed calls are not reliably returned',
    detail:
      'Missing a call is recoverable — leaving it unanswered for a day is not. Without a same-day call-back routine, the recovery window closes by the time anyone dials back.',
    evidence: (a) =>
      a.missedCallsReturned && ['sometimes', 'rarely'].includes(a.missedCallsReturned)
        ? `You told us missed calls are returned “${labelOf('missedCallsReturned', a)}”.`
        : null,
    relatedStages: [2, 3],
    workflowIds: ['W-MISSED-CALL-TEXT', 'W-RESPONSE-SLA']
  },
  {
    id: 'F-NO-CENTRAL-CRM',
    severity: 'high',
    title: 'Customer information has no single home',
    detail:
      'When leads and customers live across texts, inboxes and memories, every handoff loses context: quotes go untracked, repeat customers go cold, and only the owner knows the whole story.',
    evidence: (a) =>
      ['none', 'spreadsheet', 'not-sure'].includes(a.crm)
        ? `You told us customer records live in “${labelOf('crm', a) ?? 'nowhere central'}”.`
        : null,
    relatedStages: [2, 6, 10],
    workflowIds: ['W-FORM-CAPTURE', 'W-ESTIMATE-TRACKING', 'W-KPI-WEEKLY']
  },
  {
    id: 'F-NO-FSM',
    severity: 'high',
    title: 'Jobs are managed without job software',
    detail:
      'Scheduling, quotes, job records and invoicing handled manually (paper, spreadsheets, group texts) is the most expensive operating pattern in home services — it scales admin hours faster than revenue.',
    evidence: (a) => (a.fsm === 'none' ? 'You told us you don’t use job-management software.' : null),
    relatedStages: [4, 5, 7, 8, 9],
    workflowIds: ['W-ESTIMATE-KIT', 'W-DISPATCH-CALENDAR', 'W-AUTO-INVOICE', 'W-APPT-REMINDERS']
  },
  {
    id: 'F-UNDERUSED-SOFTWARE',
    severity: 'medium',
    title: 'You already own more capability than you use',
    detail:
      'Your answers show some processes running manually even though you pay for software that covers them. The cheapest improvements here are usually switching on features you already have.',
    evidence: (a) =>
      ['jobber', 'housecall-pro', 'servicetitan', 'other-fsm'].includes(a.fsm) &&
      (a.bookingProcess === 'paper-calendar' ||
        a.technicianAssignment !== 'software' ||
        a.invoicing === 'manual' ||
        a.customerUpdates !== 'software')
        ? 'You run field-service software, but several processes still happen outside it.'
        : null,
    relatedStages: [4, 7, 8, 9],
    workflowIds: ['W-APPT-REMINDERS', 'W-DISPATCH-CALENDAR', 'W-AUTO-INVOICE', 'W-STATUS-UPDATES']
  },
  {
    id: 'F-FRAGMENTATION',
    severity: 'medium',
    title: 'Your tools don’t talk to each other',
    detail:
      'When the calendar, the CRM, the accounting system and the phone live in separate worlds, someone becomes the human API — re-typing the same job into three places. Fragmentation quietly costs hours every week.',
    evidence: (a) => {
      const separate: string[] = []
      if (a.scheduling === 'google-calendar' || a.scheduling === 'calendly-or-similar') separate.push('scheduling')
      if (['jobber', 'housecall-pro', 'servicetitan'].includes(a.fsm) && ['gohighlevel', 'hubspot', 'other-crm'].includes(a.crm)) separate.push('CRM')
      if (a.automationTools.includes('none')) separate.push('no automations')
      return separate.length >= 2
        ? `Disconnected pieces: ${separate.join(', ')}.`
        : null
    },
    relatedStages: [7, 9, 11],
    workflowIds: ['W-FORM-CAPTURE', 'W-KPI-WEEKLY']
  },
  {
    id: 'F-WEAK-FOLLOWUP',
    severity: 'high',
    title: 'Quotes are sent — and then abandoned',
    detail:
      'Home-services sales are won in the follow-up. When nobody systematically chases open estimates, you lose jobs you already paid to win as leads — the cheapest revenue increase that exists.',
    evidence: (a) =>
      a.estimateFollowUp && ['occasional', 'rarely'].includes(a.estimateFollowUp)
        ? `You told us follow-up is “${labelOf('estimateFollowUp', a)}”.`
        : null,
    relatedStages: [6],
    workflowIds: ['W-FOLLOWUP-SEQUENCE', 'W-PIPELINE-BOARD', 'W-ESTIMATE-TRACKING']
  },
  {
    id: 'F-NO-PIPELINE-VISIBILITY',
    severity: 'medium',
    title: 'Open quotes are invisible',
    detail:
      'Without a live list of open opportunities, revenue forecasting is a guess and follow-up depends on memory — exactly the tasks memory is worst at.',
    evidence: (a) =>
      a.pipelineTracking === 'none'
        ? 'You told us open quotes live “in people’s heads”.'
        : null,
    relatedStages: [6, 11],
    workflowIds: ['W-PIPELINE-BOARD', 'W-ESTIMATE-TRACKING', 'W-KPI-WEEKLY']
  },
  {
    id: 'F-MANUAL-SCHEDULING',
    severity: 'medium',
    title: 'Scheduling runs on coordination, not a calendar',
    detail:
      'Phone tag, paper calendars and “who’s free?” questions make every booking slower than it needs to be — and hide the capacity picture you need before promising arrival windows.',
    evidence: (a) =>
      a.bookingProcess && ['paper-calendar', 'phone-tag'].includes(a.bookingProcess)
        ? `You told us appointments are booked via “${labelOf('bookingProcess', a)}”.`
        : null,
    relatedStages: [4, 7],
    workflowIds: ['W-DISPATCH-CALENDAR', 'W-APPT-REMINDERS']
  },
  {
    id: 'F-SLOW-ESTIMATES',
    severity: 'medium',
    title: 'Estimates move slower than your customers',
    detail:
      'While your quote is “being worked on”, customers collect other bids and their urgency cools. Slow or verbal estimating loses jobs that were yours to lose.',
    evidence: (a) =>
      a.estimateProcess && ['days-later', 'verbal'].includes(a.estimateProcess)
        ? `You told us estimates are “${labelOf('estimateProcess', a)}”.`
        : null,
    relatedStages: [5],
    workflowIds: ['W-ESTIMATE-KIT', 'W-ESTIMATE-TRACKING']
  },
  {
    id: 'F-SLOW-INVOICING',
    severity: 'high',
    title: 'Invoicing lags the work',
    detail:
      'Cash flow in home services dies by delay: the longer the gap between finished work and a sent invoice, the slower money arrives and the more likely a dispute blooms.',
    evidence: (a) =>
      a.invoicing && ['manual', 'software-later'].includes(a.invoicing)
        ? `You told us invoicing is “${labelOf('invoicing', a)}”.`
        : null,
    relatedStages: [9],
    workflowIds: ['W-AUTO-INVOICE', 'W-PAYMENT-LINKS', 'W-AR-REMINDERS']
  },
  {
    id: 'F-WEAK-PAYMENT-TRACKING',
    severity: 'medium',
    title: 'Outstanding balances are hard to see',
    detail:
      'When “who owes what” requires a hunt, overdue invoices age politely and the business banksrolls customers without noticing.',
    evidence: (a) =>
      a.paymentTracking === 'manual'
        ? 'You told us payment tracking is a manual hunt through records.'
        : null,
    relatedStages: [9, 11],
    workflowIds: ['W-AR-REMINDERS', 'W-PAYMENT-LINKS']
  },
  {
    id: 'F-NO-AFTER-SERVICE',
    severity: 'medium',
    title: 'The relationship ends when the invoice is paid',
    detail:
      'Reviews, referrals, maintenance reminders and warranty check-ins are the compounding half of home-services revenue. Without a system, all of it depends on customers remembering you.',
    evidence: (a) =>
      a.repeatCustomerManagement && ['memory', 'not-sure'].includes(a.repeatCustomerManagement)
        ? `You told us past customers are managed “${labelOf('repeatCustomerManagement', a)}”.`
        : null,
    relatedStages: [10],
    workflowIds: ['W-REVIEW-REQUEST', 'W-MAINTENANCE-PROGRAM', 'W-AI-HISTORY-BRIEF']
  },
  {
    id: 'F-ADSPEND-BLIND',
    severity: 'medium',
    title: 'Ad money is spent without a scoreboard',
    detail:
      'Paying for advertising without measuring which dollar becomes a paying customer means budget decisions are guesses — usually repeated for years.',
    evidence: (a) =>
      ['501-1500', '1501-5000', '5000-plus'].includes(a.monthlyAdSpend) &&
      a.knowsChannelPerformance !== 'yes'
        ? `You spend “${labelOf('monthlyAdSpend', a)}” monthly and ${a.knowsChannelPerformance === 'no' ? 'don’t track channel performance' : 'only partly track it'}.`
        : null,
    relatedStages: [1, 11],
    workflowIds: ['W-GA4-SETUP', 'W-ATTRIBUTION']
  },
  {
    id: 'F-OWNER-BOTTLENECK',
    severity: 'medium',
    title: 'The owner is the system',
    detail:
      'When every inquiry, assignment and exception routes through one person, the business’s response speed and capacity are literally one person’s attention span. Growth makes this worse, not better.',
    evidence: (a) =>
      (a.inquiryHandler === 'owner' || a.inquiryHandler === 'technicians') &&
      ['moderate', 'high'].includes(a.monthlyInquiries === '51-100' || a.monthlyInquiries === '100-plus' ? 'high' : a.monthlyInquiries === '0-10' ? 'low' : 'moderate')
        ? `New inquiries are handled by “${labelOf('inquiryHandler', a)}” at your volume.`
        : null,
    relatedStages: [3, 7],
    workflowIds: ['W-LEAD-ROUTING', 'W-RESPONSE-SLA', 'W-DISPATCH-CALENDAR']
  },
  {
    id: 'F-CAPACITY-PRESSURE',
    severity: 'medium',
    title: 'More leads would make things worse, not better',
    detail:
      'Your inquiry volume already stretches your field capacity. Before spending on marketing, the leverage is in conversion and throughput: answering everything, converting more of what you already receive, and scheduling tighter. Fix operations first — then buy leads.',
    evidence: (a) => (['51-100', '100-plus'].includes(a.monthlyInquiries) && ['0', '1-3'].includes(a.technicians) ? 'High inquiry volume with 1–3 technicians in the field.' : null),
    relatedStages: [3, 4, 7],
    workflowIds: ['W-RESPONSE-SLA', 'W-DISPATCH-CALENDAR', 'W-APPT-REMINDERS']
  },
  {
    id: 'F-UNDER-UTILIZED',
    severity: 'low',
    title: 'Field capacity is waiting for work',
    detail:
      'Your team has more capacity than the current inquiry flow uses. The constraint is the front of the funnel (attract, receive, respond) — worth fixing before hiring anyone else.',
    evidence: (a) => (a.monthlyInquiries === '0-10' && ['4-7', '8-15', '16-plus'].includes(a.technicians) ? 'Low inquiry volume with a field team of 4+.' : null),
    relatedStages: [1, 2],
    workflowIds: ['W-GA4-SETUP', 'W-LSA-START', 'W-REVIEW-REQUEST']
  },
  /* ── Positive findings (honesty cuts both ways) ─────────────────────────── */
  {
    id: 'P-FAST-RESPONSE',
    severity: 'positive',
    title: 'You already answer fast',
    detail:
      'Fast first response is the strongest habit in this industry — protect it as you grow, and make sure systems (not just hustle) keep it true on your busiest days.',
    evidence: (a) =>
      ['under-15min', '15-60min'].includes(a.responseSpeed)
        ? `You told us you respond “${labelOf('responseSpeed', a)}”.`
        : null,
    relatedStages: [3],
    workflowIds: ['W-RESPONSE-SLA']
  },
  {
    id: 'P-SYSTEMS-FOUNDATION',
    severity: 'positive',
    title: 'A real systems foundation exists',
    detail:
      'Field-service software is already in place. That means many improvements are configuration, not purchase — and the roadmap can focus on adoption and depth instead of migration.',
    evidence: (a) =>
      ['jobber', 'housecall-pro', 'servicetitan'].includes(a.fsm)
        ? `You already run ${labelOf('fsm', a)}.`
        : null,
    relatedStages: [4, 5, 7, 8, 9],
    workflowIds: ['W-APPT-REMINDERS', 'W-AUTO-INVOICE', 'W-STATUS-UPDATES']
  }
]

export function detectFindings(a: Answers, _classification: BusinessClassification): Finding[] {
  const findings: Finding[] = []
  for (const rule of RULES) {
    const evidence = rule.evidence(a)
    if (evidence) {
      findings.push({
        id: rule.id,
        severity: rule.severity,
        title: rule.title,
        detail: rule.detail,
        evidence,
        relatedStages: rule.relatedStages,
        workflowIds: rule.workflowIds
      })
    }
  }
  /* Stable, severity-ordered output. */
  const order: Record<Finding['severity'], number> = { high: 0, medium: 1, low: 2, positive: 3 }
  return findings.sort((x, y) => order[x.severity] - order[y.severity])
}
