/**
 * Workflow recommendation library.
 *
 * The deterministic engine SELECTS and MODES these definitions based on the
 * owner's answers — it never lets the AI invent workflows. Each entry carries
 * every field the blueprint must explain: what happens, what triggers it,
 * which software is involved, what information moves, what the customer
 * experiences, what employees do, what happens on failure, and whether a
 * human must approve.
 *
 * `mode` is computed at selection time:
 *   adopt  = new for this business
 *   verify = they likely already pay for the capability — confirm it's on
 *   keep   = already working; maintain it
 */

import type { Answers, IndustryId } from '../types/answers'
import type { BusinessClassification } from '../types/blueprint'
import type { IndustryConfig } from './industries'
import type { SoftwareEntry } from './software'

export type WorkflowKindType = 'automation' | 'ai' | 'human' | 'human-ai'
export type WorkflowMode = 'adopt' | 'verify' | 'keep'

export interface WorkflowStack {
  fsm?: SoftwareEntry
  crm?: SoftwareEntry
  marketingCrm?: boolean // GoHighLevel-style CRM present
  automation?: SoftwareEntry
  accounting?: SoftwareEntry
  hasWebsite: boolean
  hasAnalytics: boolean
  hasVoip: boolean
  usesLsa: boolean
}

export interface WorkflowContext {
  answers: Answers
  industry: IndustryConfig
  classification: BusinessClassification
  findingIds: Set<string>
  stack: WorkflowStack
}

export interface WorkflowDef {
  id: string
  stageId: number
  kind: WorkflowKindType
  priority: 1 | 2 | 3
  effort: 'low' | 'medium' | 'high'
  title: string
  summary: string
  whatHappens: string
  trigger: string
  softwareRoles: string[]
  softwareNote: string
  dataFlow: string
  customerExperience: string
  employeeAction: string
  failureMode: string
  needsApproval: boolean
  approvalNote?: string
  industries?: IndustryId[]
  appliesWhen?: (ctx: WorkflowContext) => boolean
  modeWhen?: (ctx: WorkflowContext) => WorkflowMode
}

/** Helper: does the business already run an FSM that likely covers this? */
const fsmOwned = (ctx: WorkflowContext): boolean => !!ctx.stack.fsm

export const WORKFLOW_LIBRARY: WorkflowDef[] = [
  /* ── Stage 1: Attract ─────────────────────────────────────────────────── */
  {
    id: 'W-GA4-SETUP',
    stageId: 1,
    kind: 'automation',
    priority: 2,
    effort: 'low',
    title: 'See which marketing actually brings you customers',
    summary:
      'Free tools on your website that count where each inquiry came from, so ad money follows evidence instead of guesses.',
    whatHappens:
      'Your website gets a small piece of free tracking code (Google Analytics 4 via Google Tag Manager). Every form fill, click-to-call and booking gets tagged with the source that produced it.',
    trigger: 'A visitor arrives from Google, an ad, Facebook or anywhere else and contacts you.',
    softwareRoles: ['analytics'],
    softwareNote:
      'Google Analytics 4 and Google Tag Manager — both free. Your web builder can add the code once and it keeps working.',
    dataFlow:
      'Visit → source (Google / ad / social) → “contacted us” event → simple report: leads per channel per month.',
    customerExperience: 'Invisible — nothing changes for the customer.',
    employeeAction:
      'None day-to-day. Once a month, you look at one report and ask “which channel earned its keep?”',
    failureMode:
      'If tracking is misconfigured you get wrong numbers, so validate it against reality for the first two weeks (compare reported calls with actually received calls).',
    needsApproval: false,
    appliesWhen: (ctx) => !ctx.stack.hasAnalytics,
    modeWhen: (ctx) => (ctx.stack.hasAnalytics ? 'keep' : 'adopt')
  },
  {
    id: 'W-LSA-START',
    stageId: 1,
    kind: 'human',
    priority: 3,
    effort: 'medium',
    title: 'Add pay-per-lead Google Local Services Ads',
    summary:
      'Ads at the very top of Google where you pay for real leads — not clicks — with a “Google Screened” trust badge.',
    whatHappens:
      'Your company appears at the top of “plumber near me”-style searches with a green checkmark. You pay only when a real lead call comes through, within a weekly budget you set.',
    trigger: 'You set it up once; Google handles delivery from then on.',
    softwareRoles: ['channel'],
    softwareNote:
      'Google Local Services Ads. Availability varies by trade, state and country, and requires license/background checks — verify your trade is eligible before planning revenue around it.',
    dataFlow: 'Google search → your ad → customer calls you directly through the ad.',
    customerExperience: 'They see a vetted local company at the top of Google and call it.',
    employeeAction:
      'Someone must answer or return LSA calls fast — they are charged leads even if nobody picks up.',
    failureMode:
      'Unanswered LSA leads cost money and hurt ranking. Do not enable this until missed-call handling (Stage 2) is solid.',
    needsApproval: true,
    approvalNote: 'Owner decides budget and confirms eligibility/licensing for the trade and area.',
    appliesWhen: (ctx) =>
      ['501-1500', '1501-5000', '5000-plus'].includes(ctx.answers.monthlyAdSpend) &&
      !ctx.stack.usesLsa &&
      !ctx.answers.channels.includes('lsa'),
    modeWhen: () => 'adopt'
  },

  /* ── Stage 2: Receive ─────────────────────────────────────────────────── */
  {
    id: 'W-MISSED-CALL-TEXT',
    stageId: 2,
    kind: 'automation',
    priority: 1,
    effort: 'low',
    title: 'Never lose a missed call again',
    summary:
      'When you can’t pick up, the caller instantly gets a text from you — so they wait for your call-back instead of dialing a competitor.',
    whatHappens:
      'A call rings out unanswered. Within seconds the caller receives an automatic text: “Sorry we missed you! We’ll call you back shortly — or reply here with what you need.” Their number is saved as a lead with the missed call logged.',
    trigger: 'An incoming call is not answered.',
    softwareRoles: ['phone', 'crm', 'automation'],
    softwareNote:
      'Provided by a business phone system (VoIP), several CRMs (GoHighLevel has built-in missed-call text-back) and some field-service platforms. Verify the exact feature on whichever system you adopt — capability names and tiers vary.',
    dataFlow: 'Missed call → phone system fires event → text sent → lead created in your CRM/job software.',
    customerExperience:
      'Instead of a dead-end voicemail, they feel caught — and most will wait for the promised call-back.',
    employeeAction:
      'Someone returns the call within the hour (the text buys you that window). The lead list makes “who still needs a call” impossible to lose.',
    failureMode:
      'If nobody returns the call, the text is a broken promise — worse than nothing. Treat the call-back list as a daily duty.',
    needsApproval: false,
    appliesWhen: (ctx) =>
      ctx.answers.missedCalls !== 'almost-none' &&
      ctx.answers.callVsWebMix !== 'mostly-web',
    modeWhen: (ctx) => (ctx.stack.hasVoip || ctx.stack.marketingCrm ? 'verify' : 'adopt')
  },
  {
    id: 'W-FORM-CAPTURE',
    stageId: 2,
    kind: 'automation',
    priority: 1,
    effort: 'low',
    title: 'Every website inquiry lands in one system',
    summary:
      'Website form submissions create a lead automatically — no copy-pasting from emails, no leads lost in an inbox.',
    whatHappens:
      'A visitor fills in your contact or booking form. Their details appear in your CRM/job software as a new lead within seconds, with the source attached, and your team gets notified.',
    trigger: 'Someone submits a form or booking request on your website.',
    softwareRoles: ['website', 'crm', 'automation'],
    softwareNote:
      'Most job-management platforms and CRMs either host a form you embed on your site or connect to it (native forms, webhook or Zapier/Make). Verify the pairing you choose supports it.',
    dataFlow: 'Form submit → automation → new lead record + notification to your team.',
    customerExperience: 'They get an instant confirmation email/text. No “did they even get my message?”',
    employeeAction: 'Respond from the lead list — the inquiry is already waiting there with context.',
    failureMode:
      'If the connection breaks, leads silently stop arriving. Send a test form every month, and watch for “no website leads this week” as a red flag.',
    needsApproval: false,
    appliesWhen: (ctx) => ctx.stack.hasWebsite,
    modeWhen: (ctx) => (fsmOwned(ctx) ? 'verify' : 'adopt')
  },
  {
    id: 'W-AI-TRIAGE',
    stageId: 2,
    kind: 'ai',
    priority: 3,
    effort: 'medium',
    title: 'Let AI sort and flag incoming inquiries',
    summary:
      'AI reads each incoming message, tags what it’s about and how urgent it is, and routes it — so the right person sees it first.',
    whatHappens:
      'Every email, form message or text is read by AI, which labels it: “no-heat emergency”, “quote request”, “maintenance plan question”, “spam”, plus a one-line summary at the top. Urgent items jump the queue; junk gets marked without wasting your time.',
    trigger: 'A new inbound message or web inquiry arrives.',
    softwareRoles: ['crm', 'automation', 'ai'],
    softwareNote:
      'An AI feature inside your CRM/automation platform (GoHighLevel, Make/n8n with an AI step, or AI features inside field-service platforms). Availability and naming vary by product and tier — verify before counting on it.',
    dataFlow: 'Message in → AI reads and tags (topic, urgency, summary) → tagged lead in CRM → priority queue.',
    customerExperience:
      'Faster, better-aimed replies — the AI never messages the customer directly; it prepares the work for your team.',
    employeeAction:
      'Staff open the pre-sorted queue instead of a raw inbox. Urgent jobs are visually flagged at the top.',
    failureMode:
      'AI can occasionally mislabel an urgent message as routine. For the first month, skim the “routine” pile daily until you trust it — and always let humans handle anything ambiguous.',
    needsApproval: false,
    approvalNote:
      'AI only organizes information here. It does not reply to customers — a human always sends the response.'
  },

  /* ── Stage 3: Respond & qualify ───────────────────────────────────────── */
  {
    id: 'W-RESPONSE-SLA',
    stageId: 3,
    kind: 'human',
    priority: 1,
    effort: 'low',
    title: 'A simple speed rule: every inquiry answered within 15 minutes',
    summary:
      'A team agreement that every new lead gets a human response fast — because the first company to answer usually wins the job.',
    whatHappens:
      'Your team adopts one non-negotiable habit: every new inquiry gets a live answer or call-back within 15 minutes during work hours. The lead list shows response time on every inquiry, so it’s visible, not hopeful.',
    trigger: 'Any new inquiry, from any channel.',
    softwareRoles: ['crm'],
    softwareNote: 'Any job software or CRM that timestamps lead creation and first response.',
    dataFlow: 'Lead created → response logged → response time visible on the lead record.',
    customerExperience: 'A real person actually reaches them while the problem still hurts.',
    employeeAction:
      'Whoever is on lead duty works from the open-leads list until it’s empty. That’s the whole job.',
    failureMode:
      'If nobody owns it, the rule quietly dies. Assign a named person per shift and check the response-time report weekly.',
    needsApproval: false
  },
  {
    id: 'W-LEAD-ROUTING',
    stageId: 3,
    kind: 'automation',
    priority: 2,
    effort: 'low',
    title: 'New leads reach the right person automatically',
    summary:
      'Each inquiry is automatically assigned to whoever should handle it, with a notification — no “who saw that message?”',
    whatHappens:
      'Based on simple rules you set (job type, area, urgency, who’s on shift), a new lead is instantly assigned to a team member and they get a text/app notification with the details.',
    trigger: 'A new lead is created.',
    softwareRoles: ['crm', 'automation'],
    softwareNote: 'Built into most field-service platforms and CRMs as “lead routing” or “round-robin assignment”. Verify availability on your platform.',
    dataFlow: 'Lead created → rule applied → assigned owner notified with full context.',
    customerExperience: 'One person, immediately accountable — no being bounced around.',
    employeeAction: 'The assigned person responds and works the lead to booked or closed.',
    failureMode:
      'Bad rules send leads to someone on holiday. Keep the rules simple and have a fallback “everyone” notification for anything unassigned after 10 minutes.',
    needsApproval: false,
    appliesWhen: (ctx) => ['moderate', 'high'].includes(ctx.classification.volumeTier)
  },
  {
    id: 'W-AI-CALL-NOTES',
    stageId: 3,
    kind: 'ai',
    priority: 3,
    effort: 'medium',
    title: 'AI writes the call notes for you',
    summary:
      'After a customer call, AI summarizes what was said and what was promised straight onto the customer’s record.',
    whatHappens:
      'With a call-recording phone system, AI produces a short summary of every call: what the customer needs, what was agreed, what happens next. It lands on the customer’s record automatically.',
    trigger: 'A customer call ends.',
    softwareRoles: ['phone', 'crm', 'ai'],
    softwareNote:
      'Requires a phone system with call recording plus an AI summarization feature (offered inside several VoIP systems and CRMs; also buildable with Make/n8n). Tell customers calls may be recorded where the law requires it.',
    dataFlow: 'Call recording → AI summary + action items → attached to the customer record.',
    customerExperience: 'Whoever handles the next step already knows the full story.',
    employeeAction:
      'Glance at the summary and correct anything wrong. No more typing notes between calls.',
    failureMode:
      'Summaries can miss tone or nuance and must never replace listening. Spot-check them for the first few weeks; recordings stay available.',
    needsApproval: false
  },

  /* ── Stage 4: Book ────────────────────────────────────────────────────── */
  {
    id: 'W-APPT-REMINDERS',
    stageId: 4,
    kind: 'automation',
    priority: 1,
    effort: 'low',
    title: 'Automatic appointment reminders',
    summary: 'Texts the day before and the morning of each job, so no-shows and forgotten appointments fade away.',
    whatHappens:
      'Every booked appointment automatically triggers a reminder text (typically 24 hours and 2 hours before) with the time window and technician name, plus a confirm/reschedule link.',
    trigger: 'An appointment is booked.',
    softwareRoles: ['fsm'],
    softwareNote:
      'Standard in Jobber, Housecall Pro and ServiceTitan and most scheduling tools — usually just needs switching on and wording.',
    dataFlow: 'Appointment created → reminder schedule → customer texts at set times → confirmations logged.',
    customerExperience: 'They feel organized and looked after — and they’re actually home when you arrive.',
    employeeAction: 'Watch the confirmation status; personally call anyone who hasn’t confirmed.',
    failureMode:
      'Reminders reduce no-shows but can’t fix overbooked schedules. Keep capacity honest in the calendar.',
    needsApproval: false,
    modeWhen: (ctx) => (fsmOwned(ctx) ? 'verify' : 'adopt')
  },
  {
    id: 'W-ONLINE-BOOKING',
    stageId: 4,
    kind: 'automation',
    priority: 2,
    effort: 'medium',
    title: 'Let customers book their own appointments',
    summary:
      'A booking page on your website for non-urgent work — customers pick a slot that’s genuinely free, even at 11pm.',
    whatHappens:
      'Your website offers “book an appointment”. The page shows only real availability from your calendar; the booking lands straight in your schedule with the customer’s details.',
    trigger: 'A customer chooses a slot on your booking page.',
    softwareRoles: ['website', 'fsm'],
    softwareNote:
      'Included or add-on in most field-service platforms (“online booking”). For simple estimate bookings, a tool like Calendly also works — but the FSM-native version carries job details with it.',
    dataFlow: 'Availability synced from calendar → customer picks slot → job created + everyone notified.',
    customerExperience: 'They book in two minutes without a phone-tag exchange.',
    employeeAction: 'Review next-day bookings each morning; the calendar is already up to date.',
    failureMode:
      'Same-day emergency work doesn’t fit self-booking — keep the phone path primary for urgent jobs, and clearly say so on the page.',
    needsApproval: false,
    appliesWhen: (ctx) => ctx.industry.salesCycle !== 'short' || ctx.industry.recurringRevenue !== 'low'
  },

  /* ── Stage 5: Estimate ────────────────────────────────────────────────── */
  {
    id: 'W-ESTIMATE-KIT',
    stageId: 5,
    kind: 'human-ai',
    priority: 1,
    effort: 'medium',
    title: 'Professional, templated estimates that win on presentation',
    summary:
      'Quotes built from your own templates and price list — consistent, itemized, on-brand, and ready in minutes instead of evenings.',
    whatHappens:
      'Your common jobs get templates with pre-set line items and your pricing. A quote is assembled on-site or same-day, sent as a clean branded document the customer can approve with a button (or e-sign).',
    trigger: 'A job is scoped and priced.',
    softwareRoles: ['fsm'],
    softwareNote:
      'Quoting with templates and pricebooks is core functionality in Jobber, Housecall Pro and ServiceTitan. Good-option presentation matters — your web team can brand the templates.',
    dataFlow: 'Job details → template + pricebook → branded quote document → e-signature/approval → status tracked.',
    customerExperience:
      'A clear, itemized, professional quote — with zero handwriting and no waiting days. It makes your company look like the safe choice.',
    employeeAction:
      'Techs or estimators pick items from the pricebook. The owner sets pricing and checks anything custom.',
    failureMode:
      'A stale pricebook quotes wrong prices. Assign one person to review prices quarterly.',
    needsApproval: true,
    approvalNote: 'Final price is always a human decision — templates prepare it, the owner approves exceptions.',
    modeWhen: (ctx) => (fsmOwned(ctx) ? 'verify' : 'adopt')
  },
  {
    id: 'W-ESTIMATE-TRACKING',
    stageId: 5,
    kind: 'automation',
    priority: 2,
    effort: 'low',
    title: 'Every estimate gets a status and a next step',
    summary:
      'Quotes move through clear stages — sent, viewed, follow-up due, won, lost — so nothing silently disappears.',
    whatHappens:
      'Each quote carries a status. You can see at a glance: how many are out, which were viewed, which are stale, which are won. Stale quotes surface automatically.',
    trigger: 'An estimate is created.',
    softwareRoles: ['fsm'],
    softwareNote: 'Quote/pipeline statuses are standard in field-service platforms and CRMs.',
    dataFlow: 'Quote sent → status updates (sent/viewed/approved/declined) → pipeline report.',
    customerExperience: 'Nobody gets forgotten; follow-ups feel attentive instead of random.',
    employeeAction: 'Work the “needs follow-up” view weekly (see the follow-up sequence below).',
    failureMode: 'Statuses only work if they’re updated — pair with the automated follow-up sequence.',
    needsApproval: false,
    modeWhen: (ctx) => (fsmOwned(ctx) ? 'verify' : 'adopt')
  },

  /* ── Stage 6: Follow up & win ─────────────────────────────────────────── */
  {
    id: 'W-FOLLOWUP-SEQUENCE',
    stageId: 6,
    kind: 'automation',
    priority: 1,
    effort: 'low',
    title: 'Automatic follow-ups on every open quote',
    summary:
      'Gentle, pre-written follow-ups after 2 and 7 days on every unanswered estimate — the cheapest jobs you’ll ever win back.',
    whatHappens:
      'When a quote isn’t answered, the system sends a pre-written follow-up (day 2: “any questions?”; day 7: “the quote is still valid, want us to hold a slot?”). If the customer replies, a human takes over instantly.',
    trigger: 'An estimate passes its follow-up date without a response.',
    softwareRoles: ['fsm', 'automation'],
    softwareNote:
      'Jobber (quote follow-ups on higher tiers), Housecall Pro, GoHighLevel and most CRMs offer this. Check which tier of your platform includes it.',
    dataFlow: 'Quote status + date → scheduled follow-up → reply lands back on the same quote thread.',
    customerExperience: 'A helpful nudge — not pressure. Many customers simply got busy and are glad you checked.',
    employeeAction: 'Approve the templates once; then just handle the replies (the system flags them).',
    failureMode:
      'Robot-like texts annoy people. Keep wording human, cap the sequence at 2–3 touches, and always stop the moment they reply.',
    needsApproval: true,
    approvalNote: 'The owner approves the follow-up wording once; every send after that is automatic but can be paused per quote.',
    appliesWhen: (ctx) => ctx.answers.estimateFollowUp !== 'systematic',
    modeWhen: (ctx) => (fsmOwned(ctx) ? 'verify' : 'adopt')
  },
  {
    id: 'W-PIPELINE-BOARD',
    stageId: 6,
    kind: 'human',
    priority: 2,
    effort: 'low',
    title: 'A 15-minute weekly pipeline review',
    summary:
      'One weekly ritual where the team looks at every open opportunity and assigns the next step — deals stop dying in silence.',
    whatHappens:
      'Once a week, the team opens the pipeline view and walks every open quote: what’s new, what’s stale, what needs a call, what we won or lost and why. Every open deal leaves the meeting with an owner and a next step.',
    trigger: 'A recurring 15-minute weekly meeting.',
    softwareRoles: ['fsm', 'crm'],
    softwareNote: 'Any pipeline view works — in your job software, CRM or even a spreadsheet while you’re transitioning.',
    dataFlow: 'Pipeline statuses feed the review; decisions update statuses; nothing stays “in limbo”.',
    customerExperience: 'Consistent, informed follow-through that competitors rarely match.',
    employeeAction: 'Show up, be honest about stuck deals, assign next steps.',
    failureMode: 'Skipping two weeks kills the habit. Put it in the calendar as immovable.',
    needsApproval: false,
    appliesWhen: (ctx) => ctx.answers.pipelineTracking !== 'software'
  },

  /* ── Stage 7: Schedule & assign ───────────────────────────────────────── */
  {
    id: 'W-DISPATCH-CALENDAR',
    stageId: 7,
    kind: 'automation',
    priority: 2,
    effort: 'medium',
    title: 'One shared calendar runs your crews',
    summary:
      'A single dispatch calendar shows every tech, every job, travel time and priority — changes stop happening over scattered texts.',
    whatHappens:
      'All jobs and technician availability live in one calendar. Drag a job onto a tech’s day; the customer is notified, the tech gets the details, capacity is visible before you promise anything.',
    trigger: 'A job needs scheduling.',
    softwareRoles: ['fsm'],
    softwareNote: 'The scheduling/dispatch board is the heart of Jobber, Housecall Pro and ServiceTitan.',
    dataFlow: 'Job → assigned slot + tech → tech’s phone gets job card → customer gets notification → status flows back.',
    customerExperience: 'Reliable arrival windows and no “who’s coming today?” calls.',
    employeeAction: 'Office (or owner) manages the board; techs work from their job list instead of group texts.',
    failureMode:
      'Double-booking happens if capacity isn’t respected. The board shows availability precisely so you can say “Thursday” with confidence.',
    needsApproval: false,
    modeWhen: (ctx) => (ctx.answers.technicianAssignment === 'software' ? 'keep' : fsmOwned(ctx) ? 'verify' : 'adopt')
  },
  {
    id: 'W-ROUTE-DAY',
    stageId: 7,
    kind: 'automation',
    priority: 3,
    effort: 'medium',
    title: 'Daily route and job sheets to each technician',
    summary:
      'Every morning each tech gets their route with addresses, job history and notes — on their phone, before the first stop.',
    whatHappens:
      'The day’s schedule is pushed to each technician’s phone as an ordered route with navigation, customer history, job notes and any special instructions.',
    trigger: 'The day starts (or the schedule changes).',
    softwareRoles: ['fsm'],
    softwareNote: 'Standard mobile-tech functionality in modern field-service platforms.',
    dataFlow: 'Schedule → tech’s phone (route + job cards) → status updates flow back live.',
    customerExperience: 'Techs arrive prepared, on time, knowing the customer’s story.',
    employeeAction: 'Techs follow the route and mark jobs done as they complete; office sees progress live.',
    failureMode: 'Urgent mid-day jobs break routes — keep one flex slot per tech per day where possible.',
    needsApproval: false,
    appliesWhen: (ctx) => ['4-7', '8-15', '16-plus'].includes(ctx.answers.technicians)
  },

  /* ── Stage 8: Perform & manage the job ────────────────────────────────── */
  {
    id: 'W-STATUS-UPDATES',
    stageId: 8,
    kind: 'automation',
    priority: 2,
    effort: 'low',
    title: '“On my way” texts and completion notices',
    summary: 'Customers get an automatic text when the tech is heading over and a confirmation when the work is done.',
    whatHappens:
      'When a tech taps “en route”, the customer gets a text with a live ETA link. When they tap “done”, the customer gets a completion message — and the office knows without a phone call.',
    trigger: 'Technician changes job status in the app.',
    softwareRoles: ['fsm'],
    softwareNote: 'Status-based customer notifications are built into the main field-service platforms.',
    dataFlow: 'Tech status tap → customer text (en route / done) → office dashboard updates.',
    customerExperience: 'No wondering, no calling the office, no waiting by the window.',
    employeeAction: 'Techs tap statuses; office stops playing telephone.',
    failureMode: 'Techs forget to tap. Make it the first thing taught in onboarding; the day sheet shows gaps.',
    needsApproval: false,
    appliesWhen: (ctx) => ctx.answers.customerUpdates !== 'software',
    modeWhen: (ctx) => (fsmOwned(ctx) ? 'verify' : 'adopt')
  },
  {
    id: 'W-JOB-DOCS',
    stageId: 8,
    kind: 'human-ai',
    priority: 2,
    effort: 'medium',
    title: 'Photos and notes recorded on every job',
    summary:
      'Before/after photos, what was done, parts used and next-step recommendations — saved on the job, forever, for everyone.',
    whatHappens:
      'Each job card collects the technician’s photos, a short work summary, parts used and recommendations. It becomes the permanent record: for warranty questions, disputes, insurance or the next visit.',
    trigger: 'A technician completes a job.',
    softwareRoles: ['fsm'],
    softwareNote: 'Job forms/photos are standard in Jobber, Housecall Pro, ServiceTitan (and critical for restoration/insurance billing).',
    dataFlow: 'Photos + notes on job card → attached to customer history → ready for invoices, warranty and disputes.',
    customerExperience:
      'They receive a tidy record of what was done — which makes the invoice feel fair and the company feel professional.',
    employeeAction: 'Techs take the photos and fill the short form; office spot-checks for quality.',
    failureMode:
      'Rushed documentation defeats the purpose. Keep the form short (5–6 fields) so techs actually complete it.',
    needsApproval: false,
    appliesWhen: (ctx) => ctx.answers.workRecording !== 'software',
    modeWhen: (ctx) => (fsmOwned(ctx) ? 'verify' : 'adopt')
  },
  {
    id: 'W-AI-JOB-SUMMARY',
    stageId: 8,
    kind: 'ai',
    priority: 3,
    effort: 'medium',
    title: 'AI drafts the paperwork after each job',
    summary:
      'AI turns the tech’s notes and photos into a clean job summary and invoice description — the office checks and sends.',
    whatHappens:
      'From the technician’s raw notes (“replaced capacitor, unit older, recommend quote for replacement”), AI drafts a customer-ready summary and invoice line. A person reviews, edits if needed, and approves it in seconds.',
    trigger: 'A job is marked complete.',
    softwareRoles: ['fsm', 'ai'],
    softwareNote:
      'AI writing assistance exists inside several platforms and can be built with Make/n8n + an AI step. Availability varies — verify on your platform.',
    dataFlow: 'Tech notes → AI draft → human review → invoice/customer summary.',
    customerExperience: 'Clear, professional paperwork with zero chicken-scratch.',
    employeeAction: 'Office approves or edits the draft — final wording is always human-approved.',
    failureMode: 'AI can polish a note into saying more than was done. The human reviewer catches this — never skip review.',
    needsApproval: true,
    approvalNote: 'Drafts only. Nothing AI-written reaches a customer without a human pressing send.',
    appliesWhen: (ctx) => ['moderate', 'high'].includes(ctx.classification.volumeTier)
  },

  /* ── Stage 9: Invoice & collect ───────────────────────────────────────── */
  {
    id: 'W-AUTO-INVOICE',
    stageId: 9,
    kind: 'automation',
    priority: 1,
    effort: 'low',
    title: 'The invoice goes out the moment work finishes',
    summary: 'Completion triggers the invoice automatically — no Sunday-night paperwork sessions, no forgotten jobs.',
    whatHappens:
      'When a job is marked complete and the paperwork attached, the invoice is generated from the job details and sent the same day by email/text.',
    trigger: 'Job marked complete.',
    softwareRoles: ['fsm', 'accounting'],
    softwareNote: 'Standard in field-service platforms; with QuickBooks/Xero connected, books stay in sync automatically.',
    dataFlow: 'Job details → invoice created and sent → payment status tracked → synced to accounting.',
    customerExperience: 'A clear bill while the good work is still fresh — people pay these faster.',
    employeeAction: 'Approve exceptions (deposits, custom pricing); everything routine is automatic.',
    failureMode: 'Wrong job details make wrong invoices — which is why job documentation (Stage 8) comes first.',
    needsApproval: false,
    appliesWhen: (ctx) => ctx.answers.invoicing !== 'software',
    modeWhen: (ctx) => (fsmOwned(ctx) ? 'verify' : 'adopt')
  },
  {
    id: 'W-PAYMENT-LINKS',
    stageId: 9,
    kind: 'automation',
    priority: 1,
    effort: 'low',
    title: 'One-tap payments by text',
    summary: 'Customers pay by tapping a link — card, or bank transfer with lower fees — instead of mailing checks.',
    whatHappens:
      'Invoices include a payment link. The customer taps, pays, and the invoice marks itself paid — the money lands in your account without a single “did you get our check?” call.',
    trigger: 'Invoice sent.',
    softwareRoles: ['fsm', 'accounting'],
    softwareNote:
      'Jobber Payments, Housecall Pro payments and similar (usually around 2.9% + $0.30 for cards, less for bank/ACH — verify current rates).',
    dataFlow: 'Invoice → payment link → payment → invoice auto-marked paid → books synced.',
    customerExperience: 'Paying takes ten seconds, like everything else they do online.',
    employeeAction: 'Nothing — except deciding who gets chased when a link goes unused (see below).',
    failureMode: 'Processing fees apply — factor them into pricing. Some commercial customers still need terms.',
    needsApproval: false
  },
  {
    id: 'W-AR-REMINDERS',
    stageId: 9,
    kind: 'automation',
    priority: 2,
    effort: 'low',
    title: 'Polite automatic reminders on overdue invoices',
    summary: 'Overdue balances get scheduled, friendly reminders — and your list of who owes what is always current.',
    whatHappens:
      'When an invoice passes its due date, the system sends gentle reminders on a schedule (e.g., day 3, day 14, day 30) and flags serious cases for a human phone call.',
    trigger: 'Invoice overdue.',
    softwareRoles: ['fsm', 'accounting'],
    softwareNote: 'Automated payment reminders exist in the main FSM platforms and in QuickBooks/Xero.',
    dataFlow: 'Overdue invoice → reminder schedule → payment or escalation flag → aging report always current.',
    customerExperience: 'Professional and consistent — never the owner’s awkward 9pm phone call.',
    employeeAction: 'Work the “seriously overdue” list personally; the system handles the early nudges.',
    failureMode: 'Reminders on disputed invoices burn goodwill. Pause automation on any invoice under discussion.',
    needsApproval: false
  },

  /* ── Stage 10: After-service relationship ─────────────────────────────── */
  {
    id: 'W-REVIEW-REQUEST',
    stageId: 10,
    kind: 'automation',
    priority: 1,
    effort: 'low',
    title: 'A review request after every job',
    summary: 'Every happy customer gets a one-tap Google review link — reviews become a system, not luck.',
    whatHappens:
      'A day after job completion (or after payment), the customer gets a short, warm text asking for a Google review with a direct link. Negative signals (complaints, rework) can be routed internally first instead.',
    trigger: 'Job completed and paid.',
    softwareRoles: ['fsm'],
    softwareNote:
      'Built into Jobber (Marketing Suite add-on / upper tiers), Housecall Pro and most platforms — check which tier includes it.',
    dataFlow: 'Completed job → timed request → review link → public reviews accumulate → referral traffic grows.',
    customerExperience: 'A simple, well-timed ask from a company that clearly cares.',
    employeeAction: 'Address any unhappy response within a day — that’s where reputation is actually won.',
    failureMode: 'Asking before a problem is resolved backfires. Trigger on payment, not just completion.',
    needsApproval: false,
    modeWhen: (ctx) => (fsmOwned(ctx) ? 'verify' : 'adopt')
  },
  {
    id: 'W-MAINTENANCE-PROGRAM',
    stageId: 10,
    kind: 'human-ai',
    priority: 2,
    effort: 'high',
    title: 'Turn customers into maintenance members',
    summary:
      'A recurring maintenance plan that smooths seasonal demand, creates predictable revenue and earns the next replacement job.',
    whatHappens:
      'Every service customer is offered a maintenance plan (annual visits, priority booking, small perks). Members are scheduled automatically when their visit is due, billed automatically, and reminded before problems start.',
    trigger: 'A customer completes (or accepts) a job — or when their plan renews.',
    softwareRoles: ['fsm'],
    softwareNote:
      'Recurring services/plans are supported in Jobber and Housecall Pro (jobber recurring services; HCP memberships); verify the billing features on your platform.',
    dataFlow: 'Plan members → auto-scheduled visits → auto-billing → pre-season outreach campaigns.',
    customerExperience: 'Their equipment is looked after; they skip the January rush; they trust you with the big replacement.',
    employeeAction:
      'Techs present the plan (with training and a simple script); office monitors renewal and scheduling.',
    failureMode:
      'A plan sold badly becomes a discount. Price it for real value, and keep the promised visits on schedule.',
    needsApproval: true,
    approvalNote: 'Plan design, pricing and perks are owner decisions.',
    appliesWhen: (ctx) => ctx.industry.recurringRevenue !== 'low' || ctx.answers.services.some((s) => s.includes('maintenance') || s.includes('contract')),
    modeWhen: () => 'adopt'
  },
  {
    id: 'W-AI-HISTORY-BRIEF',
    stageId: 10,
    kind: 'ai',
    priority: 3,
    effort: 'medium',
    title: 'AI briefs you before every repeat customer call',
    summary: 'Before the phone rings, AI summarizes that customer’s full history — jobs, equipment, past quotes — in three lines.',
    whatHappens:
      'When a past customer calls (or is called), the system shows an AI-generated three-line brief: who they are, what you’ve done for them, what was recommended but not yet done.',
    trigger: 'A call or message from an existing customer.',
    softwareRoles: ['crm', 'ai'],
    softwareNote:
      'Requires your history to live in the system first (that’s why earlier stages come first). Feasible via platform AI features or a Make/n8n flow; verify on your platform.',
    dataFlow: 'Incoming call → customer record → AI brief → shown to whoever answers.',
    customerExperience: '“Hi Mr. Alvarez — how’s the water heater we fitted in March?” That feeling is unforgettable.',
    employeeAction: 'Read the brief, sound like a hero, upsell what genuinely helps them.',
    failureMode: 'A brief built on missing history is worse than none — it becomes accurate only after a year of clean records.',
    needsApproval: false
  },

  /* ── Stage 11: Measure ────────────────────────────────────────────────── */
  {
    id: 'W-KPI-WEEKLY',
    stageId: 11,
    kind: 'automation',
    priority: 2,
    effort: 'low',
    title: 'A one-page scorecard in your inbox every week',
    summary: 'Every Monday: inquiries, response times, quotes won, jobs done, revenue and outstanding balances — on one screen.',
    whatHappens:
      'The system emails you (and anyone you choose) a weekly summary with the numbers that matter: new leads, median response time, close rate, completed jobs, collected revenue and overdue balances.',
    trigger: 'Monday morning, automatically.',
    softwareRoles: ['fsm', 'analytics'],
    softwareNote:
      'Reporting dashboards exist in all major platforms; some can email on a schedule. A simple Make/n8n digest is another route. Start with whatever view your platform already offers.',
    dataFlow: 'All system activity → weekly aggregate → email/dashboard.',
    customerExperience: 'Indirect but real: a company that sees itself clearly makes fewer broken promises.',
    employeeAction: 'Read it every week. Ask “what number is worst, and what one thing improves it?”',
    failureMode: 'Vanity metrics creep in. Keep it to one page; act on one number per week.',
    needsApproval: false
  },
  {
    id: 'W-ATTRIBUTION',
    stageId: 11,
    kind: 'automation',
    priority: 3,
    effort: 'medium',
    title: 'Know what a lead costs you from each channel',
    summary: 'Ad spend and lead sources joined together: “Google Ads brought 18 leads at $61 each; referrals brought 9 for free.”',
    whatHappens:
      'With GA4 on your website and call/lead tracking in place, each month you can divide spend by leads per channel. Over a few months this shows which channels earn their keep and which quietly burn money.',
    trigger: 'Monthly (after GA4 setup and lead capture are running).',
    softwareRoles: ['analytics', 'crm'],
    softwareNote: 'GA4 + your lead source records. GoHighLevel also offers built-in call tracking if you use it.',
    dataFlow: 'Ad spend per channel + leads per channel → cost per lead per channel → budget decisions.',
    customerExperience: 'Invisible — but over time your marketing answers the phone better.',
    employeeAction: 'Monthly: review cost per lead by channel; reallocate budget from losers to winners.',
    failureMode:
      'Small sample sizes lie. Judge channels on quarters, not weeks, and keep score the same way every month.',
    needsApproval: false,
    appliesWhen: (ctx) => ['1-500', '501-1500', '1501-5000', '5000-plus'].includes(ctx.answers.monthlyAdSpend)
  }
]

export function workflowById(id: string): WorkflowDef | undefined {
  return WORKFLOW_LIBRARY.find((w) => w.id === id)
}
