/**
 * Stage maturity assessment.
 *
 * For each of the 11 stages of the universal operating model, derive a
 * 0–3 maturity score from the owner's answers, with quoted evidence.
 * `null` means "not enough information" — we say so honestly instead of
 * guessing. We also flag genuine strengths (never manufacture problems).
 */

import type { Answers } from '../types/answers'
import type { Maturity, StageAssessment } from '../types/blueprint'
import { STAGES } from '../data/stages'
import { INDUSTRIES_BY_ID } from '../data/industries'
import { labelOf } from './labels'

const MATURITY_LABELS: Record<string, string> = {
  none: 'Not built yet',
  informal: 'Informal',
  working: 'Working',
  managed: 'Well managed',
  unknown: 'Not sure yet'
}

function maturityLabel(m: Maturity): string {
  if (m === null) return MATURITY_LABELS.unknown
  return ['', MATURITY_LABELS.none, MATURITY_LABELS.informal, MATURITY_LABELS.working, MATURITY_LABELS.managed][m + 1]
}

const clamp = (n: number): 0 | 1 | 2 | 3 => Math.max(0, Math.min(3, Math.round(n))) as 0 | 1 | 2 | 3

interface StageScore {
  maturity: Maturity
  evidence: string[]
  gaps: string[]
  strength?: string
}

/* Per-stage scoring. Evidence quotes the owner's own answer labels. */

function scoreStage1(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  const channelCount = a.channels.length
  if (channelCount > 0) evidence.push(`Inquiries come from: ${labelOf('channels', a)}.`)
  if (a.monthlyAdSpend) evidence.push(`Advertising spend: ${labelOf('monthlyAdSpend', a)} per month.`)
  const knows = a.knowsChannelPerformance === 'yes'
  if (a.knowsChannelPerformance) evidence.push(`Channel measurement: ${labelOf('knowsChannelPerformance', a)}.`)

  let score = Math.min(2, Math.floor(channelCount / 2)) // breadth
  if (knows) score += 1
  if (!knows) {
    gaps.push('You can’t yet prove which sources turn into paying customers — decisions about ad money are being made partly blind.')
  }
  if (['501-1500', '1501-5000', '5000-plus'].includes(a.monthlyAdSpend) && !knows) {
    score = Math.min(score, 2)
    gaps.push('You are spending meaningful money on advertising without measuring which spend becomes revenue.')
  }
  if (channelCount >= 3 && knows) {
    return { maturity: clamp(score), evidence, gaps, strength: 'A healthy spread of customer sources, and you know which ones perform.' }
  }
  if (channelCount <= 1) {
    gaps.push('You depend on one main source of customers — a risky single point of failure.')
  }
  return { maturity: clamp(score), evidence, gaps }
}

function scoreStage2(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  let score = 1 // they receive inquiries somehow
  const hasWebCapture = a.channels.includes('website') || a.websitePlatform !== 'no-website'
  const mix = labelOf('callVsWebMix', a)
  if (mix) evidence.push(`Inquiry mix: ${mix.toLowerCase()}.`)
  if (a.websitePlatform) evidence.push(`Website: ${labelOf('websitePlatform', a)}.`)
  if (hasWebCapture) score += 1
  else gaps.push('Without a working website form, online inquiries have nowhere to land — every missed call is a dead end.')
  if (a.missedCalls) {
    evidence.push(`Missed calls: ${labelOf('missedCalls', a)}.`)
    if (a.missedCalls === 'almost-none') score += 1
    else if (a.missedCalls === 'few') score += 0
    else if (a.missedCalls === 'quarter') { score -= 1; gaps.push('Around a quarter of callers don’t reach you live — most will call the next company on the list.') }
    else if (a.missedCalls === 'half-plus') { score -= 2; gaps.push('Half or more of your callers don’t reach you live. This is usually the single most expensive leak in a home-services business.') }
  }
  if (a.missedCallsReturned && a.missedCalls !== 'almost-none') {
    evidence.push(`Missed-call follow-up: ${labelOf('missedCallsReturned', a)}.`)
    if (a.missedCallsReturned !== 'always') gaps.push('Missed calls are not reliably returned the same day.')
  }
  if (score >= 3 && a.missedCalls === 'almost-none') {
    return { maturity: clamp(score), evidence, gaps, strength: 'Nearly every caller reaches you live.' }
  }
  return { maturity: clamp(score), evidence, gaps }
}

function scoreStage3(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  let parts: number[] = []
  if (a.responseSpeed && a.responseSpeed !== 'not-sure') {
    evidence.push(`Response speed: ${labelOf('responseSpeed', a)}.`)
    const speedScore: Record<string, number> = {
      'under-15min': 3,
      '15-60min': 3,
      'few-hours': 2,
      'same-day': 1,
      'next-day-plus': 0,
      varies: 1
    }
    parts.push(speedScore[a.responseSpeed] ?? 1)
    if (['few-hours', 'same-day', 'next-day-plus', 'varies'].includes(a.responseSpeed)) {
      gaps.push('Response time is slower than the first-answer-wins reality of home services.')
    }
  }
  if (a.missedCallsReturned && a.missedCallsReturned !== 'not-sure' && a.missedCalls !== 'almost-none') {
    if (a.missedCallsReturned === 'always') parts.push(3)
    else if (a.missedCallsReturned === 'sometimes') { parts.push(1); gaps.push('Missed-call recovery is inconsistent.') }
    else parts.push(0)
  }
  if (a.qualificationProcess && a.qualificationProcess !== 'not-sure') {
    evidence.push(`Qualification: ${labelOf('qualificationProcess', a)}.`)
    if (a.qualificationProcess === 'structured') parts.push(3)
    else if (a.qualificationProcess === 'informal') parts.push(1)
    else parts.push(0)
  }
  if (a.inquiryHandler) evidence.push(`Handled by: ${labelOf('inquiryHandler', a)}.`)
  if (parts.length === 0) return { maturity: null, evidence, gaps }
  const avg = parts.reduce((x, y) => x + y, 0) / parts.length
  if (avg >= 2.8) {
    return { maturity: clamp(avg), evidence, gaps, strength: 'You answer fast — a genuine competitive edge.' }
  }
  return { maturity: clamp(avg), evidence, gaps }
}

function scoreStage4(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  const score: Record<string, number> = {
    software: 3,
    'google-cal': 2,
    'paper-calendar': 1,
    'phone-tag': 0,
    'not-sure': -1
  }
  if (a.bookingProcess) evidence.push(`Booking: ${labelOf('bookingProcess', a)}.`)
  if (a.bookingProcess === 'phone-tag') {
    gaps.push('Appointments rely on call-backs and phone tag — every gap between interest and booking leaks jobs to faster competitors.')
  } else if (a.bookingProcess === 'paper-calendar') {
    gaps.push('A paper calendar hides availability and creates double-bookings.')
  }
  const s = score[a.bookingProcess] ?? -1
  if (s < 0) return { maturity: null, evidence, gaps }
  return { maturity: clamp(s), evidence, gaps }
}

function scoreStage5(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  const score: Record<string, number> = { 'same-day': 3, 'on-site-then-send': 2, 'days-later': 1, verbal: 0, 'not-sure': -1 }
  if (a.estimateProcess) evidence.push(`Estimates: ${labelOf('estimateProcess', a)}.`)
  if (a.estimateProcess === 'days-later') {
    gaps.push('Estimates take a week or more — in that time customers collect other bids and momentum fades.')
  } else if (a.estimateProcess === 'verbal') {
    gaps.push('Verbal estimates are hard to close: no record, no urgency, no paper trail.')
  }
  const s = score[a.estimateProcess] ?? -1
  if (s < 0) return { maturity: null, evidence, gaps }
  return { maturity: clamp(s), evidence, gaps }
}

function scoreStage6(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  const score: Record<string, number> = { systematic: 3, occasional: 1, rarely: 0, 'not-sure': -1 }
  if (a.estimateFollowUp) evidence.push(`Follow-up: ${labelOf('estimateFollowUp', a)}.`)
  if (a.estimateFollowUp === 'rarely') {
    gaps.push('Quotes are sent and then abandoned — the customer who would have said yes simply never gets asked again.')
  } else if (a.estimateFollowUp === 'occasional') {
    gaps.push('Follow-up depends on someone remembering.')
  }
  if (a.pipelineTracking) evidence.push(`Open-quote visibility: ${labelOf('pipelineTracking', a)}.`)
  if (a.pipelineTracking === 'none') gaps.push('Open quotes live in people’s heads — an owner on holiday means follow-up stops.')
  const s = score[a.estimateFollowUp] ?? -1
  if (s < 0) return { maturity: null, evidence, gaps }
  let m = clamp(s)
  if (a.pipelineTracking === 'software' && m >= 2) m = 3
  return { maturity: m, evidence, gaps }
}

function scoreStage7(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  let parts: number[] = []
  const assignScore: Record<string, number> = { software: 3, dispatcher: 2, 'owner-manual': 1, 'technicians-self': 1, 'not-sure': -1 }
  if (a.technicianAssignment) evidence.push(`Assignment: ${labelOf('technicianAssignment', a)}.`)
  const s1 = assignScore[a.technicianAssignment] ?? -1
  if (s1 >= 0) parts.push(s1)
  const availScore: Record<string, number> = { software: 3, 'shared-calendar': 2, whiteboard: 0, 'not-sure': -1 }
  if (a.availabilityTracking) evidence.push(`Availability: ${labelOf('availabilityTracking', a)}.`)
  const s2 = availScore[a.availabilityTracking] ?? -1
  if (s2 >= 0) parts.push(s2)
  if (a.technicianAssignment !== 'software') {
    gaps.push('Scheduling isn’t driven by one shared calendar — availability is invisible until someone asks.')
  }
  if (parts.length === 0) return { maturity: null, evidence, gaps }
  return { maturity: clamp(parts.reduce((x, y) => x + y, 0) / parts.length), evidence, gaps }
}

function scoreStage8(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  let parts: number[] = []
  const recScore: Record<string, number> = { software: 3, 'photos-notes': 1, 'paper-forms': 1, memory: 0, 'not-sure': -1 }
  if (a.workRecording) evidence.push(`Work records: ${labelOf('workRecording', a)}.`)
  const s1 = recScore[a.workRecording] ?? -1
  if (s1 >= 0) parts.push(s1)
  if (a.workRecording === 'memory') gaps.push('Completed work lives in heads — warranty questions and disputes become word against word.')
  const updScore: Record<string, number> = { software: 3, 'calls-texts': 2, 'on-arrival': 0, 'not-sure': -1 }
  if (a.customerUpdates) evidence.push(`Customer updates: ${labelOf('customerUpdates', a)}.`)
  const s2 = updScore[a.customerUpdates] ?? -1
  if (s2 >= 0) parts.push(s2)
  if (a.customerUpdates === 'on-arrival') gaps.push('Customers find out you’re coming only when you arrive — a quiet driver of complaints and cancellations.')
  if (parts.length === 0) return { maturity: null, evidence, gaps }
  return { maturity: clamp(parts.reduce((x, y) => x + y, 0) / parts.length), evidence, gaps }
}

function scoreStage9(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  let parts: number[] = []
  const invScore: Record<string, number> = { software: 3, 'software-later': 2, accounting: 2, manual: 0, 'not-sure': -1 }
  if (a.invoicing) evidence.push(`Invoicing: ${labelOf('invoicing', a)}.`)
  const s1 = invScore[a.invoicing] ?? -1
  if (s1 >= 0) parts.push(s1)
  if (a.invoicing === 'manual') gaps.push('Invoices are written and sent by hand — every day of delay is interest-free credit you give away.')
  else if (a.invoicing === 'software-later') gaps.push('Invoices go out days after completion.')
  const payScore: Record<string, number> = { software: 3, accounting: 2, manual: 0, 'not-sure': -1 }
  if (a.paymentTracking) evidence.push(`Payment tracking: ${labelOf('paymentTracking', a)}.`)
  const s2 = payScore[a.paymentTracking] ?? -1
  if (s2 >= 0) parts.push(s2)
  if (a.paymentTracking === 'manual') gaps.push('Finding who owes money is a manual hunt.')
  if (parts.length === 0) return { maturity: null, evidence, gaps }
  return { maturity: clamp(parts.reduce((x, y) => x + y, 0) / parts.length), evidence, gaps }
}

function scoreStage10(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  const score: Record<string, number> = { crm: 3, spreadsheet: 1, memory: 0, 'not-sure': -1 }
  if (a.repeatCustomerManagement) evidence.push(`Past customers: ${labelOf('repeatCustomerManagement', a)}.`)
  if (a.repeatCustomerManagement === 'memory') {
    gaps.push('Past customers only hear from you when they remember you — while competitors with reminders take the repeat work.')
  } else if (a.repeatCustomerManagement === 'spreadsheet') {
    gaps.push('A list you “work sometimes” is not a system — recurring revenue needs scheduled touchpoints.')
  }
  const s = score[a.repeatCustomerManagement] ?? -1
  if (s < 0) return { maturity: null, evidence, gaps }
  return { maturity: clamp(s), evidence, gaps }
}

function scoreStage11(a: Answers): StageScore {
  const evidence: string[] = []
  const gaps: string[] = []
  let score = 0
  if (a.knowsChannelPerformance === 'yes') { score += 1; evidence.push('You track which channels produce paying customers.') }
  else { gaps.push('Marketing performance is not measured — budget can’t be steered by evidence.') }
  if (a.pipelineTracking === 'software') score += 1
  else if (a.pipelineTracking === 'spreadsheet') score += 0.5
  if (a.pipelineTracking) evidence.push(`Pipeline tracking: ${labelOf('pipelineTracking', a)}.`)
  if (['jobber', 'housecall-pro', 'servicetitan', 'other-fsm'].includes(a.fsm)) { score += 1; evidence.push('Job software is in place, so real activity data exists.') }
  else gaps.push('With jobs run outside a system, week-to-week performance numbers have to be assembled by hand — so nobody assembles them.')
  if (score >= 2.5) {
    return { maturity: clamp(score), evidence, gaps, strength: 'You can already see much of what matters in numbers.' }
  }
  return { maturity: clamp(score), evidence, gaps }
}

const SCORERS: Record<number, (a: Answers) => StageScore> = {
  1: scoreStage1,
  2: scoreStage2,
  3: scoreStage3,
  4: scoreStage4,
  5: scoreStage5,
  6: scoreStage6,
  7: scoreStage7,
  8: scoreStage8,
  9: scoreStage9,
  10: scoreStage10,
  11: scoreStage11
}

export function assessStages(a: Answers): StageAssessment[] {
  const industry = INDUSTRIES_BY_ID[a.industry]
  return STAGES.map((stage) => {
    const scored = SCORERS[stage.id](a)
    const currentState =
      scored.evidence.length > 0
        ? scored.evidence.join(' ')
        : 'You weren’t sure about the details here — the blueprint treats this stage as unknown rather than guessing.'
    const gaps = industry.stageNotes[stage.id] && scored.gaps.length > 0
      ? scored.gaps
      : scored.gaps
    return {
      stageId: stage.id,
      stageName: stage.name,
      maturity: scored.maturity,
      maturityLabel: maturityLabel(scored.maturity),
      currentState,
      evidence: scored.evidence,
      gaps,
      strength: scored.strength
    }
  })
}

export function maturityLabelOf(m: Maturity): string {
  return maturityLabel(m)
}
