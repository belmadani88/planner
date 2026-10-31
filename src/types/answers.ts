/**
 * Answer model for the business questionnaire.
 *
 * Every answer value is a stable option ID (a short string), never free text,
 * except `businessName`. This keeps the recommendation engine deterministic
 * and makes server-side validation trivial (values must exist in the
 * question bank). "not-sure" is always an allowed answer — the engine treats
 * it as an explicit unknown rather than guessing.
 */

export type IndustryId =
  | 'hvac'
  | 'plumbing'
  | 'roofing'
  | 'electrical'
  | 'restoration'
  | 'remodeling'
  | 'landscaping'

export type GoalId =
  | 'more-leads'
  | 'respond-faster'
  | 'fewer-missed-calls'
  | 'convert-more'
  | 'less-admin'
  | 'better-scheduling'
  | 'profitable-jobs'
  | 'better-payments'
  | 'retention'
  | 'visibility'
  | 'reduce-fragmentation'

export interface Answers {
  /* A. Business profile */
  industry: IndustryId
  services: string[]
  serviceAreas: string
  employees: string
  technicians: string
  revenue: string
  yearsOperating: string

  /* B. Customer acquisition */
  monthlyInquiries: string
  monthlyAdSpend: string
  channels: string[]
  callVsWebMix: string
  knowsChannelPerformance: string

  /* C. Lead response and sales */
  responseSpeed: string
  missedCalls: string
  missedCallsReturned: string
  inquiryHandler: string
  qualificationProcess: string
  bookingProcess: string
  estimateProcess: string
  estimateFollowUp: string
  pipelineTracking: string

  /* D. Operational management */
  technicianAssignment: string
  availabilityTracking: string
  customerUpdates: string
  workRecording: string
  invoicing: string
  paymentTracking: string
  repeatCustomerManagement: string

  /* E. Existing technology */
  websitePlatform: string
  crm: string
  fsm: string
  scheduling: string
  accounting: string
  phoneSystem: string
  marketingTools: string[]
  automationTools: string[]

  /* F. Objectives */
  goals: GoalId[]

  /* Optional friendly context (never required) */
  businessName?: string
}

export type AnswerKey = keyof Answers
export type PartialAnswers = Partial<Answers>

/** Question ids that accept multiple selections. */
export const MULTI_SELECT_KEYS: AnswerKey[] = [
  'services',
  'channels',
  'marketingTools',
  'automationTools',
  'goals'
]
