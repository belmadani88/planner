/**
 * The guided questionnaire.
 *
 * Design rules (from the product spec):
 *  - plain everyday language, zero jargon
 *  - progressive disclosure: one question at a time, never a giant page
 *  - conditional questions where they matter
 *  - "I don't know" is always an acceptable answer
 *  - approximate ranges instead of precise financials
 *  - important questions explain why they are being asked
 */

import type { AnswerKey, PartialAnswers } from '../types/answers'

export interface QuestionOption {
  value: string
  label: string
  hint?: string
}

export type QuestionSection = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface QuestionDef {
  id: AnswerKey
  section: QuestionSection
  type: 'single' | 'multi'
  prompt: string
  why?: string
  options: QuestionOption[] | ((a: PartialAnswers) => QuestionOption[])
  required?: boolean
  showIf?: (a: PartialAnswers) => boolean
  minSelect?: number
  maxSelect?: number
}

export const SECTION_META: Record<
  QuestionSection,
  { title: string; subtitle: string; minutes: string }
> = {
  A: {
    title: 'Your business',
    subtitle: 'First, the basics — what your company does and how big it is.',
    minutes: 'about 1 minute'
  },
  B: {
    title: 'Where customers come from',
    subtitle: 'How new customers find you and get in touch.',
    minutes: 'about 1 minute'
  },
  C: {
    title: 'Answering & winning work',
    subtitle: 'What happens after someone contacts you.',
    minutes: 'about 2 minutes'
  },
  D: {
    title: 'Running the jobs',
    subtitle: 'How work gets scheduled, done, invoiced and paid.',
    minutes: 'about 1½ minutes'
  },
  E: {
    title: 'Your current software',
    subtitle: 'What tools you already use — we won’t make you replace good ones.',
    minutes: 'about 1 minute'
  },
  F: {
    title: 'Your priorities',
    subtitle: 'What you most want to improve this year.',
    minutes: 'under 1 minute'
  }
}

const NOT_SURE: QuestionOption = { value: 'not-sure', label: 'I don’t know', hint: 'That’s fine — we’ll plan around it' }

/* ── Section A: business profile ────────────────────────────────────────── */

const EMPLOYEE_OPTIONS: QuestionOption[] = [
  { value: '1-3', label: '1–3 people', hint: 'Owner-led or a tiny crew' },
  { value: '4-7', label: '4–7 people', hint: 'A small team with office help' },
  { value: '8-15', label: '8–15 people' },
  { value: '16-30', label: '16–30 people' },
  { value: '31-plus', label: 'More than 30 people' }
]

/* ── Section B: customer acquisition ────────────────────────────────────── */

const CHANNEL_OPTIONS: QuestionOption[] = [
  { value: 'google-organic', label: 'Google searches (free listings)' },
  { value: 'google-ads', label: 'Google Ads' },
  { value: 'lsa', label: 'Google Local Services Ads', hint: 'The “Google Screened” leads at the top' },
  { value: 'website', label: 'Your website (forms or booking)' },
  { value: 'social', label: 'Facebook / Instagram / TikTok' },
  { value: 'referrals', label: 'Word of mouth & referrals' },
  { value: 'repeat', label: 'Returning customers' },
  { value: 'marketplaces', label: 'Lead marketplaces', hint: 'Angi, Thumbtack, HomeAdvisor-style' },
  { value: 'other', label: 'Something else' }
]

/* ── The bank ────────────────────────────────────────────────────────────── */

export const QUESTIONS: QuestionDef[] = [
  /* A. Business profile */
  {
    id: 'industry',
    section: 'A',
    type: 'single',
    prompt: 'What kind of home-services business do you run?',
    why: 'Every trade runs differently — an HVAC company’s emergency peaks and a remodeler’s long projects need different systems.',
    options: [
      { value: 'hvac', label: 'HVAC', hint: 'Heating, ventilation & air conditioning' },
      { value: 'plumbing', label: 'Plumbing' },
      { value: 'roofing', label: 'Roofing' },
      { value: 'electrical', label: 'Electrical' },
      { value: 'restoration', label: 'Water damage restoration' },
      { value: 'remodeling', label: 'Home remodeling' },
      { value: 'landscaping', label: 'Landscaping' }
    ]
  },
  {
    id: 'services',
    section: 'A',
    type: 'multi',
    prompt: 'Which kinds of work do you do?',
    why: 'Emergency work, projects and recurring maintenance each need a different flow.',
    minSelect: 1,
    options: (a) => {
      const trades: Record<string, QuestionOption[]> = {
        hvac: [
          { value: 'emergency-repairs', label: 'Emergency repairs (no heat / no cooling)' },
          { value: 'installations', label: 'System installations & replacements' },
          { value: 'maintenance', label: 'Preventive maintenance' },
          { value: 'maintenance-agreements', label: 'Maintenance agreements / service plans' },
          { value: 'air-quality', label: 'Indoor air quality & accessories' },
          { value: 'commercial', label: 'Commercial / light commercial service' }
        ],
        plumbing: [
          { value: 'emergency-repairs', label: 'Emergency repairs (leaks, bursts, clogs)' },
          { value: 'diagnosis-inspection', label: 'Diagnosis & camera inspections' },
          { value: 'repairs', label: 'General repairs & fixture work' },
          { value: 'replacements', label: 'Replacements (water heaters, repipes)' },
          { value: 'maintenance', label: 'Recurring maintenance plans' }
        ],
        roofing: [
          { value: 'inspections', label: 'Inspections & storm assessments' },
          { value: 'repairs', label: 'Repairs & leak tracing' },
          { value: 'replacements', label: 'Full replacements & re-roofs' },
          { value: 'insurance', label: 'Insurance claim work' },
          { value: 'gutters', label: 'Gutters & accessories' }
        ],
        electrical: [
          { value: 'service-repairs', label: 'Service calls & repairs' },
          { value: 'panel-upgrades', label: 'Panel upgrades & rewires' },
          { value: 'ev-chargers', label: 'EV charger installation' },
          { value: 'lighting', label: 'Lighting & fixtures' },
          { value: 'new-construction', label: 'New construction / remodel wiring' }
        ],
        restoration: [
          { value: 'emergency-mitigation', label: 'Emergency mitigation (water extraction, dry-out)' },
          { value: 'mold', label: 'Mold remediation' },
          { value: 'reconstruction', label: 'Reconstruction & repairs' },
          { value: 'contents', label: 'Contents cleaning & storage' }
        ],
        remodeling: [
          { value: 'kitchens', label: 'Kitchen remodeling' },
          { value: 'bathrooms', label: 'Bathroom remodeling' },
          { value: 'additions', label: 'Additions & structural work' },
          { value: 'design-build', label: 'Design-build services' }
        ],
        landscaping: [
          { value: 'maintenance-contracts', label: 'Recurring maintenance contracts' },
          { value: 'design-build', label: 'Design & installation projects' },
          { value: 'hardscaping', label: 'Hardscaping (patios, walls, walkways)' },
          { value: 'irrigation', label: 'Irrigation & lighting' },
          { value: 'seasonal', label: 'Seasonal cleanups & snow' }
        ]
      }
      return trades[a.industry ?? 'hvac'] ?? trades.hvac
    }
  },
  {
    id: 'serviceAreas',
    section: 'A',
    type: 'single',
    prompt: 'How far does your work reach?',
    options: [
      { value: 'local', label: 'One town / city and surroundings' },
      { value: 'regional', label: 'A wider region, about an hour out' },
      { value: 'statewide', label: 'Most of the state' },
      { value: 'multiple', label: 'Multiple states / large territory' },
      NOT_SURE
    ]
  },
  {
    id: 'employees',
    section: 'A',
    type: 'single',
    prompt: 'Including yourself, how many people work in the business?',
    why: 'Team size decides which software fits — tools built for 3 people can strangle a 20-person company, and vice versa.',
    options: EMPLOYEE_OPTIONS
  },
  {
    id: 'technicians',
    section: 'A',
    type: 'single',
    prompt: 'How many of those people go out to jobs?',
    options: [
      { value: '0', label: 'None — I do the field work myself' },
      { value: '1-3', label: '1–3 technicians' },
      { value: '4-7', label: '4–7 technicians' },
      { value: '8-15', label: '8–15 technicians' },
      { value: '16-plus', label: 'More than 15 technicians' },
      NOT_SURE
    ]
  },
  {
    id: 'revenue',
    section: 'A',
    type: 'single',
    prompt: 'Roughly what does the business bring in per year?',
    why: 'A ballpark is plenty — it helps us judge what software budget and improvements actually make sense for you.',
    options: [
      { value: 'under-250k', label: 'Under $250k' },
      { value: '250k-500k', label: '$250k – $500k' },
      { value: '500k-1m', label: '$500k – $1M' },
      { value: '1m-3m', label: '$1M – $3M' },
      { value: '3m-10m', label: '$3M – $10M' },
      { value: '10m-plus', label: 'Over $10M' },
      { value: 'prefer-not', label: 'Prefer not to say', hint: 'No problem — the blueprint still works' }
    ]
  },
  {
    id: 'yearsOperating',
    section: 'A',
    type: 'single',
    prompt: 'How long has the business been running?',
    options: [
      { value: 'under-2', label: 'Under 2 years' },
      { value: '2-5', label: '2–5 years' },
      { value: '6-10', label: '6–10 years' },
      { value: '11-25', label: '11–25 years' },
      { value: '25-plus', label: 'More than 25 years' }
    ]
  },

  /* B. Customer acquisition */
  {
    id: 'monthlyInquiries',
    section: 'B',
    type: 'single',
    prompt: 'In a normal month, about how many new-customer inquiries do you get?',
    why: 'Inquiry volume — not revenue — is what your response and scheduling systems are actually sized for.',
    options: [
      { value: '0-10', label: '0–10' },
      { value: '11-25', label: '11–25' },
      { value: '26-50', label: '26–50' },
      { value: '51-100', label: '51–100' },
      { value: '100-plus', label: 'More than 100' },
      NOT_SURE
    ]
  },
  {
    id: 'channels',
    section: 'B',
    type: 'multi',
    prompt: 'Where do those inquiries come from?',
    why: 'Different channels leak money in different places — we check each one you rely on.',
    minSelect: 1,
    options: CHANNEL_OPTIONS
  },
  {
    id: 'monthlyAdSpend',
    section: 'B',
    type: 'single',
    prompt: 'About how much do you spend on advertising per month?',
    why: 'We use this — together with your inquiry count — to estimate what each lead costs you today.',
    options: [
      { value: '0', label: 'Nothing right now' },
      { value: '1-500', label: 'Up to $500' },
      { value: '501-1500', label: '$500 – $1,500' },
      { value: '1501-5000', label: '$1,500 – $5,000' },
      { value: '5000-plus', label: 'More than $5,000' },
      NOT_SURE
    ]
  },
  {
    id: 'callVsWebMix',
    section: 'B',
    type: 'single',
    prompt: 'Do customers mostly call, or mostly reach you online?',
    options: [
      { value: 'mostly-calls', label: 'Mostly phone calls' },
      { value: 'balanced', label: 'A mix of calls and online' },
      { value: 'mostly-web', label: 'Mostly online (forms, texts, messages)' },
      NOT_SURE
    ]
  },
  {
    id: 'knowsChannelPerformance',
    section: 'B',
    type: 'single',
    prompt: 'Do you know which of those sources actually bring paying customers?',
    why: 'Most owners guess. If you can’t measure it yet, we’ll show you how to start.',
    options: [
      { value: 'yes', label: 'Yes — we track it' },
      { value: 'no', label: 'No — we don’t really know' },
      { value: 'partly', label: 'Partly — some channels only' }
    ]
  },

  /* C. Lead response and sales */
  {
    id: 'responseSpeed',
    section: 'C',
    type: 'single',
    prompt: 'When a new inquiry comes in, how fast does someone respond?',
    why: 'Speed of first response is the single strongest predictor of whether an inquiry turns into a booked job. It’s the heart of this assessment.',
    options: [
      { value: 'under-15min', label: 'Within 15 minutes' },
      { value: '15-60min', label: 'Within the hour' },
      { value: 'few-hours', label: 'A few hours' },
      { value: 'same-day', label: 'Same day' },
      { value: 'next-day-plus', label: 'Next day or later' },
      { value: 'varies', label: 'It varies a lot', hint: 'Depending who’s available' },
      NOT_SURE
    ]
  },
  {
    id: 'missedCalls',
    section: 'C',
    type: 'single',
    prompt: 'Of the calls you don’t answer live, how many do you miss overall?',
    options: [
      { value: 'almost-none', label: 'Almost none — we answer nearly everything' },
      { value: 'few', label: 'A few slip through' },
      { value: 'quarter', label: 'Maybe a quarter' },
      { value: 'half-plus', label: 'Half or more' },
      NOT_SURE
    ]
  },
  {
    id: 'missedCallsReturned',
    section: 'C',
    type: 'single',
    prompt: 'When a call is missed, how often does someone call back?',
    showIf: (a) => !!a.missedCalls && a.missedCalls !== 'almost-none' && a.missedCalls !== '',
    options: [
      { value: 'always', label: 'Always, the same day' },
      { value: 'sometimes', label: 'Usually, but not always' },
      { value: 'rarely', label: 'Rarely — whoever calls back first wins the job elsewhere' },
      NOT_SURE
    ]
  },
  {
    id: 'inquiryHandler',
    section: 'C',
    type: 'single',
    prompt: 'Who handles new inquiries?',
    options: [
      { value: 'owner', label: 'Me — the owner' },
      { value: 'office-staff', label: 'Office / admin staff' },
      { value: 'dedicated-csr', label: 'A dedicated call-taker or CSR' },
      { value: 'technicians', label: 'Technicians answer when they can' },
      { value: 'answering-service', label: 'An answering service' },
      { value: 'mix', label: 'A mix of the above' },
      NOT_SURE
    ]
  },
  {
    id: 'qualificationProcess',
    section: 'C',
    type: 'single',
    prompt: 'How do you decide if a job is right for you?',
    options: [
      { value: 'structured', label: 'We have set questions we ask everyone' },
      { value: 'informal', label: 'We just talk and get a feel for it' },
      { value: 'none', label: 'Honestly — we take whatever comes' },
      NOT_SURE
    ]
  },
  {
    id: 'bookingProcess',
    section: 'C',
    type: 'single',
    prompt: 'How do appointments usually get booked?',
    options: [
      { value: 'software', label: 'In our software — it goes on the calendar right away' },
      { value: 'google-cal', label: 'A shared calendar (Google/Outlook)' },
      { value: 'paper-calendar', label: 'A paper calendar or whiteboard' },
      { value: 'phone-tag', label: 'We promise to call back and arrange a time', hint: 'Often with some back-and-forth' },
      NOT_SURE
    ]
  },
  {
    id: 'estimateProcess',
    section: 'C',
    type: 'single',
    prompt: 'How do estimates usually reach the customer?',
    options: [
      { value: 'same-day', label: 'On the spot or the same day' },
      { value: 'on-site-then-send', label: 'We look at the job, then send it within a few days' },
      { value: 'days-later', label: 'It can take a week or more' },
      { value: 'verbal', label: 'Mostly verbal over the phone' },
      NOT_SURE
    ]
  },
  {
    id: 'estimateFollowUp',
    section: 'C',
    type: 'single',
    prompt: 'After you send an estimate, who follows up on it?',
    why: 'Quotes that never get a second touch are usually the cheapest jobs to win back.',
    options: [
      { value: 'systematic', label: 'There’s a set process — every estimate gets chased' },
      { value: 'occasional', label: 'Sometimes, when someone remembers' },
      { value: 'rarely', label: 'Rarely — we wait for the customer to call us' },
      NOT_SURE
    ]
  },
  {
    id: 'pipelineTracking',
    section: 'C',
    type: 'single',
    prompt: 'Can you see, right now, every open quote and pending job in one place?',
    options: [
      { value: 'software', label: 'Yes — it’s all in our software' },
      { value: 'spreadsheet', label: 'Yes — in a spreadsheet or list' },
      { value: 'none', label: 'No — it’s in people’s heads' },
      NOT_SURE
    ]
  },

  /* D. Operational management */
  {
    id: 'technicianAssignment',
    section: 'D',
    type: 'single',
    prompt: 'How do jobs get assigned to technicians?',
    options: [
      { value: 'software', label: 'Through our software’s schedule' },
      { value: 'dispatcher', label: 'A dispatcher/office person coordinates it' },
      { value: 'owner-manual', label: 'I assign them myself' },
      { value: 'technicians-self', label: 'Techs pick up work as it comes' },
      NOT_SURE
    ]
  },
  {
    id: 'availabilityTracking',
    section: 'D',
    type: 'single',
    prompt: 'How do you know who’s free on a given day?',
    options: [
      { value: 'software', label: 'The schedule shows it live' },
      { value: 'shared-calendar', label: 'A shared calendar' },
      { value: 'whiteboard', label: 'We ask around / check a board' },
      NOT_SURE
    ]
  },
  {
    id: 'customerUpdates',
    section: 'D',
    type: 'single',
    prompt: 'How do customers know when you’re coming?',
    options: [
      { value: 'software', label: 'Automatic texts/emails from our software' },
      { value: 'calls-texts', label: 'We call or text them manually' },
      { value: 'on-arrival', label: 'Honestly — they find out when we arrive' },
      NOT_SURE
    ]
  },
  {
    id: 'workRecording',
    section: 'D',
    type: 'single',
    prompt: 'How is completed work recorded?',
    options: [
      { value: 'software', label: 'In our software — notes and photos per job' },
      { value: 'paper-forms', label: 'Paper job sheets / tickets' },
      { value: 'photos-notes', label: 'Photos and texts between us' },
      { value: 'memory', label: 'It mostly lives in our heads' },
      NOT_SURE
    ]
  },
  {
    id: 'invoicing',
    section: 'D',
    type: 'single',
    prompt: 'How do invoices go out?',
    options: [
      { value: 'software', label: 'From our job software, same day as completion' },
      { value: 'software-later', label: 'From our software, but days later' },
      { value: 'accounting', label: 'Through our accounting system' },
      { value: 'manual', label: 'We write and send them by hand' },
      NOT_SURE
    ]
  },
  {
    id: 'paymentTracking',
    section: 'D',
    type: 'single',
    prompt: 'How do you keep track of who still owes you money?',
    options: [
      { value: 'software', label: 'The software chases and shows it' },
      { value: 'accounting', label: 'We check the accounting system' },
      { value: 'manual', label: 'It’s a manual hunt through records' },
      NOT_SURE
    ]
  },
  {
    id: 'repeatCustomerManagement',
    section: 'D',
    type: 'single',
    prompt: 'How do you stay in touch with past customers?',
    options: [
      { value: 'crm', label: 'Systematically — our system reminds us' },
      { value: 'spreadsheet', label: 'We keep a list and work it sometimes' },
      { value: 'memory', label: 'When they call us, we remember them' },
      NOT_SURE
    ]
  },

  /* E. Existing technology */
  {
    id: 'websitePlatform',
    section: 'E',
    type: 'single',
    prompt: 'What runs your website?',
    why: 'Your website is the hub for turning searches into inquiries — what it’s built on decides what’s possible.',
    options: [
      { value: 'wordpress', label: 'WordPress' },
      { value: 'wix', label: 'Wix' },
      { value: 'squarespace', label: 'Squarespace' },
      { value: 'custom-site', label: 'A custom-built site' },
      { value: 'no-website', label: 'We don’t really have one' },
      NOT_SURE
    ]
  },
  {
    id: 'crm',
    section: 'E',
    type: 'single',
    prompt: 'Where do customer records and leads live today?',
    options: [
      { value: 'jobber', label: 'Jobber' },
      { value: 'housecall-pro', label: 'Housecall Pro' },
      { value: 'servicetitan', label: 'ServiceTitan' },
      { value: 'gohighlevel', label: 'GoHighLevel' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'other-crm', label: 'Another CRM' },
      { value: 'spreadsheet', label: 'Spreadsheets or a paper book' },
      { value: 'none', label: 'Nowhere central — everywhere and nowhere' },
      NOT_SURE
    ]
  },
  {
    id: 'fsm',
    section: 'E',
    type: 'single',
    prompt: 'Do you use job-management software (scheduling, quotes, invoicing)?',
    options: [
      { value: 'jobber', label: 'Yes — Jobber' },
      { value: 'housecall-pro', label: 'Yes — Housecall Pro' },
      { value: 'servicetitan', label: 'Yes — ServiceTitan' },
      { value: 'other-fsm', label: 'Yes — another one' },
      { value: 'none', label: 'No' },
      NOT_SURE
    ]
  },
  {
    id: 'scheduling',
    section: 'E',
    type: 'single',
    prompt: 'What handles your scheduling?',
    options: [
      { value: 'same-as-fsm', label: 'The job software does it' },
      { value: 'google-calendar', label: 'Google / Outlook calendar' },
      { value: 'calendly-or-similar', label: 'A booking tool (Calendly or similar)' },
      { value: 'paper', label: 'Paper calendar / whiteboard' },
      { value: 'none', label: 'Nothing formal' },
      NOT_SURE
    ]
  },
  {
    id: 'accounting',
    section: 'E',
    type: 'single',
    prompt: 'What do you do your books in?',
    options: [
      { value: 'quickbooks', label: 'QuickBooks' },
      { value: 'xero', label: 'Xero' },
      { value: 'other-accounting', label: 'Other software' },
      { value: 'spreadsheets', label: 'Spreadsheets' },
      { value: 'accountant-only', label: 'My accountant handles it all' },
      { value: 'none', label: 'Not much of anything yet' },
      NOT_SURE
    ]
  },
  {
    id: 'phoneSystem',
    section: 'E',
    type: 'single',
    prompt: 'How does your business phone work?',
    options: [
      { value: 'office-line', label: 'A single office line' },
      { value: 'personal-cell', label: 'Personal cell phones' },
      { value: 'voip', label: 'A business phone system (VoIP)' },
      { value: 'answering-service', label: 'An answering service handles calls' },
      { value: 'mix', label: 'A mix' },
      NOT_SURE
    ]
  },
  {
    id: 'marketingTools',
    section: 'E',
    type: 'multi',
    prompt: 'Which marketing tools do you use, if any?',
    options: [
      { value: 'ga4', label: 'Google Analytics' },
      { value: 'gtm', label: 'Google Tag Manager' },
      { value: 'lsap', label: 'Google Local Services Ads' },
      { value: 'google-ads', label: 'Google Ads' },
      { value: 'mailchimp', label: 'Email marketing (Mailchimp etc.)' },
      { value: 'none', label: 'None of these' }
    ]
  },
  {
    id: 'automationTools',
    section: 'E',
    type: 'multi',
    prompt: 'Do you use any automation tools that connect apps together?',
    options: [
      { value: 'zapier', label: 'Zapier' },
      { value: 'make', label: 'Make' },
      { value: 'n8n', label: 'n8n' },
      { value: 'builtin', label: 'Automations inside our existing software' },
      { value: 'none', label: 'No' }
    ]
  },

  /* F. Objectives */
  {
    id: 'goals',
    section: 'F',
    type: 'multi',
    prompt: 'Finally — what do you most want to improve?',
    why: 'This decides what we put first in your action plan.',
    minSelect: 1,
    options: [
      { value: 'more-leads', label: 'More qualified inquiries' },
      { value: 'respond-faster', label: 'Faster responses' },
      { value: 'fewer-missed-calls', label: 'Fewer missed calls' },
      { value: 'convert-more', label: 'Win more of the quotes we send' },
      { value: 'less-admin', label: 'Less paperwork and admin work' },
      { value: 'better-scheduling', label: 'Better scheduling and dispatch' },
      { value: 'profitable-jobs', label: 'More profitable jobs' },
      { value: 'better-payments', label: 'Faster payment collection' },
      { value: 'retention', label: 'More repeat customers and referrals' },
      { value: 'visibility', label: 'Seeing clearly how the business performs' },
      { value: 'reduce-fragmentation', label: 'Fewer disconnected tools' }
    ]
  }
]

/** Questions that are visible for a given (possibly partial) answer set. */
export function visibleQuestions(a: PartialAnswers): QuestionDef[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(a))
}

/** The question immediately before the given visible question, or null. */
export function previousQuestion(current: QuestionDef, a: PartialAnswers): QuestionDef | null {
  const visible = visibleQuestions(a)
  const idx = visible.findIndex((q) => q.id === current.id)
  return idx > 0 ? visible[idx - 1] : null
}

export function resolveOptions(q: QuestionDef, a: PartialAnswers): QuestionOption[] {
  return typeof q.options === 'function' ? q.options(a) : q.options
}
