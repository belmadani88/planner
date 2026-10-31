/**
 * Software knowledge base.
 *
 * Every claim here is either verified against a public source (see
 * `verifiedVia`) or explicitly marked as needing verification. Pricing is a
 * point-in-time reference, never live data. The engine references software by
 * id; user-facing text is generated from these entries.
 *
 * Last full review: 2026-10-31.
 */

export type SoftwareCategory =
  | 'fsm'
  | 'crm'
  | 'accounting'
  | 'website'
  | 'automation'
  | 'analytics'
  | 'phone'
  | 'channel'

export type CompanySize = 'micro' | 'small' | 'medium' | 'larger'

export interface SoftwareEntry {
  id: string
  name: string
  category: SoftwareCategory
  /** One-line plain-language purpose for a non-technical owner. */
  useFor: string
  sizes: CompanySize[]
  strengths: string[]
  limitations: string[]
  /** Integrations we are willing to state. status: verified = vendor-documented. */
  integrations: { with: string; status: 'verified' | 'likely' }[]
  website: string
  pricing?: {
    model: string
    /** Approximate published entry price in USD/month, when public. */
    from?: number
    note: string
  }
  lastVerified: string
  verifiedVia: string
}

export const SOFTWARE: SoftwareEntry[] = [
  {
    id: 'jobber',
    name: 'Jobber',
    category: 'fsm',
    useFor: 'Runs the day-to-day: quotes, scheduling, invoicing, customer records and reminders for home-service teams.',
    sizes: ['micro', 'small', 'medium'],
    strengths: [
      'Built specifically for home services',
      'Scheduling + quoting + invoicing in one place',
      'Online booking and client portal included',
      'Automations and two-way texting on higher tiers'
    ],
    limitations: [
      'Per-user fees add up as the team grows (about $29/user/month beyond plan limits)',
      'Advanced reporting and job costing are upper-tier features',
      'Not designed for long, construction-style projects'
    ],
    integrations: [
      { with: 'quickbooks', status: 'verified' },
      { with: 'xero', status: 'verified' },
      { with: 'zapier', status: 'likely' },
      { with: 'make', status: 'likely' }
    ],
    website: 'https://getjobber.com',
    pricing: {
      model: 'Per plan, tiered by features and included users',
      from: 39,
      note: 'Individual plans from $39/mo (Core); team plans from $169/mo (Connect Team, 5 users); Grow Team $349/mo (10 users); extra users ~$29/user/mo. Verified April–Oct 2026 via getjobber.com and industry pricing reviews — confirm current pricing before purchase.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'getjobber.com/pricing and hvacsoftwarehub.com Jobber pricing review (Apr 2026)'
  },
  {
    id: 'housecall-pro',
    name: 'Housecall Pro',
    category: 'fsm',
    useFor: 'Day-to-day field service management: scheduling, dispatching, estimates, invoicing and customer messaging.',
    sizes: ['micro', 'small', 'medium'],
    strengths: [
      'Home-services focused, similar scope to Jobber',
      'Strong customer-communication features (texts, review requests)',
      'Consumer financing options for bigger jobs'
    ],
    limitations: [
      'Pricing varies frequently by promotion and team size — verify before buying',
      'Upper tiers needed for job costing and advanced reporting'
    ],
    integrations: [
      { with: 'quickbooks', status: 'verified' },
      { with: 'zapier', status: 'likely' }
    ],
    website: 'https://housecallpro.com',
    pricing: {
      model: 'Per plan / per team, tiered',
      from: 49,
      note: 'Basic plans commonly reported around $49–$59/mo and higher tiers (Essential and up) around $149+/mo; team pricing scales with users. Verified Oct 2026 via published pricing summaries — confirm current pricing on housecallpro.com/pricing.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'housecallpro.com/pricing and 2026 pricing summaries'
  },
  {
    id: 'servicetitan',
    name: 'ServiceTitan',
    category: 'fsm',
    useFor: 'Deep enterprise field-service platform: dispatch, pricebook, call booking, heavy reporting for larger companies.',
    sizes: ['medium', 'larger'],
    strengths: [
      'Most complete feature set for 10+ technician companies',
      'Powerful call-booking and dispatch tools',
      'Industry-standard reporting and pricebooks'
    ],
    limitations: [
      'Custom (sales-led) pricing with significant implementation fees',
      '12+ month contracts commonly reported',
      'Overkill and expensive for small teams'
    ],
    integrations: [
      { with: 'quickbooks', status: 'verified' },
      { with: 'ga4', status: 'likely' }
    ],
    website: 'https://servicetitan.com',
    pricing: {
      model: 'Custom, per-technician, negotiated',
      note: 'No public pricing. Contractor-reported ranges around $245–$398+ per technician/month plus upfront implementation fees (verified Oct 2026 via TrustRadius and 2026 industry reviews). Confirm directly with ServiceTitan.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'trustradius.com and 2026 contractor-reported pricing reviews'
  },
  {
    id: 'gohighlevel',
    name: 'GoHighLevel',
    category: 'crm',
    useFor: 'Marketing-and-sales CRM: pipelines, two-way texting, email, funnels, call tracking and automations.',
    sizes: ['small', 'medium'],
    strengths: [
      'Excellent for lead follow-up automation and speed-to-lead',
      'Built-in call tracking, SMS and missed-call text-back',
      'One subscription covers many marketing tools'
    ],
    limitations: [
      'Generalist CRM — not field-service software (no dispatch/technician scheduling)',
      'Steep learning curve; built with agencies in mind',
      'Needs disciplined setup to avoid messy automations'
    ],
    integrations: [
      { with: 'quickbooks', status: 'likely' },
      { with: 'zapier', status: 'likely' },
      { with: 'make', status: 'likely' }
    ],
    website: 'https://gohighlevel.com',
    pricing: {
      model: 'Flat monthly subscription',
      from: 97,
      note: 'Starter $97/mo, Unlimited $297/mo (verified Oct 2026 on gohighlevel.com/pricing).'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'gohighlevel.com/pricing'
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    category: 'crm',
    useFor: 'Free CRM for tracking leads and deals when field-service features are not needed.',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: [
      'Genuinely useful free tier for contact and pipeline tracking',
      'Clean interface; easy to learn'
    ],
    limitations: [
      'Sales/marketing focus — no scheduling, dispatch or invoicing',
      'Marketing features get expensive quickly on paid tiers'
    ],
    integrations: [{ with: 'zapier', status: 'verified' }],
    website: 'https://hubspot.com',
    pricing: {
      model: 'Freemium; paid hubs per month',
      from: 0,
      note: 'Free CRM tier available (verified Oct 2026). Paid marketing/sales hubs start around $20–50/seat/mo — verify current pricing.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'hubspot.com pricing page'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    category: 'accounting',
    useFor: 'Bookkeeping, invoicing, and financial reporting; syncs with most field-service tools.',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: [
      'Accounting standard for small US businesses',
      'Native integrations with Jobber, Housecall Pro and ServiceTitan',
      'Accountant-friendly'
    ],
    limitations: [
      'Not a scheduling or CRM tool',
      'Prices have risen noticeably (Aug 2026 increase)'
    ],
    integrations: [
      { with: 'jobber', status: 'verified' },
      { with: 'housecall-pro', status: 'verified' },
      { with: 'servicetitan', status: 'verified' }
    ],
    website: 'https://quickbooks.intuit.com',
    pricing: {
      model: 'Per plan per month',
      from: 38,
      note: 'Simple Start $38/mo, Essentials $85/mo after the August 2026 increase (verified Oct 2026 via Intuit notices). Confirm current pricing.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'Intuit pricing-change notices, Jul–Aug 2026'
  },
  {
    id: 'xero',
    name: 'Xero',
    category: 'accounting',
    useFor: 'Cloud accounting, popular in Australia, Canada and the UK; syncs with major field-service tools.',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: [
      'Clean, modern accounting',
      'Strong in AU/CA markets',
      'Jobber integrates natively'
    ],
    limitations: ['US accountant ecosystem is smaller than QuickBooks’'],
    integrations: [{ with: 'jobber', status: 'verified' }],
    website: 'https://xero.com',
    pricing: {
      model: 'Per plan per month',
      note: 'Multiple plans, commonly in the ~US$20–70/mo range. Verify current pricing on xero.com/pricing.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'xero.com pricing page (verify current figures)'
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'website',
    useFor: 'Your website and landing pages — the storefront that turns searches into inquiries.',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: [
      'Full control over content, forms and tracking',
      'Elementor page building and WooCommerce available',
      'Best platform for conversion-focused landing pages'
    ],
    limitations: [
      'Needs occasional maintenance and updates',
      'Hosting is a separate (small) cost'
    ],
    integrations: [
      { with: 'ga4', status: 'verified' },
      { with: 'gtm', status: 'verified' },
      { with: 'gohighlevel', status: 'likely' }
    ],
    website: 'https://wordpress.org',
    pricing: {
      model: 'Free software; hosting extra',
      from: 0,
      note: 'Software is free; hosting typically $5–30/mo. Elementor Pro and premium plugins are optional extras.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'wordpress.org'
  },
  {
    id: 'make',
    name: 'Make',
    category: 'automation',
    useFor: 'Connects apps together: “when X happens in one tool, do Y in another.”',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: [
      'Generous free tier for low volumes',
      'Visual scenario builder'
    ],
    limitations: [
      'Free tier operation counts are limited — watch usage',
      'Another system to maintain; only add when your FSM can’t do the job'
    ],
    integrations: [{ with: 'jobber', status: 'likely' }],
    website: 'https://make.com',
    pricing: {
      model: 'Per operations used',
      from: 0,
      note: 'Free tier with a monthly operations allowance (commonly ~1,000 ops/mo); paid from ~$9/mo. Verify current limits on make.com/pricing.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'make.com pricing page (verify current figures)'
  },
  {
    id: 'n8n',
    name: 'n8n',
    category: 'automation',
    useFor: 'Self-hostable automation platform — an alternative to Make/Zapier when volumes grow.',
    sizes: ['small', 'medium', 'larger'],
    strengths: [
      'Self-hosting is free with no operation limits',
      'Very flexible for technical users'
    ],
    limitations: [
      'Self-hosting requires a server (conflicts with a zero-infrastructure setup)',
      'Cloud version is a paid subscription'
    ],
    integrations: [{ with: 'jobber', status: 'likely' }],
    website: 'https://n8n.io',
    pricing: {
      model: 'Free self-hosted; paid cloud',
      note: 'Self-hosted is free but needs a server; cloud plans start around ~$20/mo. Verify current pricing on n8n.io/pricing.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'n8n.io pricing page (verify current figures)'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'automation',
    useFor: 'Simple app-to-app connections with the largest library of supported apps.',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: ['Easiest automation tool to learn', 'Huge app library'],
    limitations: ['Free tier is very small (limited tasks/month)', 'Gets expensive at volume'],
    integrations: [{ with: 'jobber', status: 'likely' }],
    website: 'https://zapier.com',
    pricing: {
      model: 'Per tasks used',
      from: 0,
      note: 'Free tier ~100 tasks/mo; paid from ~$20/mo. Verify current pricing on zapier.com/pricing.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'zapier.com pricing page (verify current figures)'
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    category: 'analytics',
    useFor: 'Shows which websites and campaigns actually bring you customers.',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: ['Free', 'Standard for measuring website traffic and conversions'],
    limitations: ['Needs one-time setup and event configuration to be useful'],
    integrations: [{ with: 'gtm', status: 'verified' }],
    website: 'https://analytics.google.com',
    pricing: { model: 'Free', from: 0, note: 'Free — no cost, generous limits.' },
    lastVerified: '2026-10-31',
    verifiedVia: 'analytics.google.com'
  },
  {
    id: 'gtm',
    name: 'Google Tag Manager',
    category: 'analytics',
    useFor: 'Manages website tracking code without editing the site for every change.',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: ['Free', 'Keeps tracking tidy and editable'],
    limitations: ['Technical one-time setup'],
    integrations: [{ with: 'ga4', status: 'verified' }],
    website: 'https://tagmanager.google.com',
    pricing: { model: 'Free', from: 0, note: 'Free — no cost.' },
    lastVerified: '2026-10-31',
    verifiedVia: 'tagmanager.google.com'
  },
  {
    id: 'voip',
    name: 'A modern phone system (VoIP)',
    category: 'phone',
    useFor: 'Business phone lines that ring on multiple devices, log calls and support missed-call handling.',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: [
      'Calls ring several people at once (fewer missed calls)',
      'Call logs and recordings for training and recall',
      'Examples: OpenPhone, Google Voice, Grasshopper and many others'
    ],
    limitations: [
      'Pricing varies by provider (roughly $0–30/user/mo) — verify before choosing',
      'A phone system alone does not fix slow response habits'
    ],
    integrations: [],
    website: 'https://www.google.com/search?q=business+voip+for+home+services',
    pricing: {
      model: 'Per user per month',
      from: 0,
      note: 'Typically ~$0–30/user/mo depending on provider (e.g., Google Voice free for solo US use; OpenPhone and others are paid). Verify current pricing with the provider you choose.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'Category-level knowledge — verify individual providers'
  },
  {
    id: 'lsa',
    name: 'Google Local Services Ads',
    category: 'channel',
    useFor: 'Pay-per-lead ads that put your company at the very top of Google searches with a “Google Screened” badge.',
    sizes: ['micro', 'small', 'medium', 'larger'],
    strengths: [
      'You pay for real leads, not clicks',
      'Prominent placement for “plumber near me” style searches',
      'Trust signal from Google screening'
    ],
    limitations: [
      'Availability and licensing requirements vary by state/trade and country',
      'Requires background checks and license verification',
      'Lead quality varies — track results before scaling spend'
    ],
    integrations: [],
    website: 'https://ads.google.com/local-services-ads/',
    pricing: {
      model: 'Pay per lead',
      note: 'You set a weekly budget and pay per received lead; costs vary by trade and area. Check availability for your trade/region before counting on it.'
    },
    lastVerified: '2026-10-31',
    verifiedVia: 'ads.google.com/local-services-ads'
  }
]

export const SOFTWARE_BY_ID: Record<string, SoftwareEntry> = Object.fromEntries(
  SOFTWARE.map((s) => [s.id, s])
)

/** Human-readable names for software ids referenced by question options. */
export const USER_SOFTWARE_LABELS: Record<string, string> = {
  jobber: 'Jobber',
  'housecall-pro': 'Housecall Pro',
  servicetitan: 'ServiceTitan',
  gohighlevel: 'GoHighLevel',
  hubspot: 'HubSpot',
  quickbooks: 'QuickBooks',
  xero: 'Xero',
  wordpress: 'WordPress',
  wix: 'Wix',
  squarespace: 'Squarespace',
  'custom-site': 'a custom-built site',
  'no-website': 'no website yet',
  spreadsheet: 'spreadsheets (Excel/Google Sheets)',
  paper: 'paper and binders',
  'google-calendar': 'Google Calendar',
  'calendly-or-similar': 'a booking tool (Calendly or similar)',
  mailchimp: 'Mailchimp',
  zapier: 'Zapier',
  make: 'Make',
  n8n: 'n8n',
  'personal-cell': 'personal cell phones',
  'office-line': 'a single office line',
  'answering-service': 'an answering service',
  'gmail-outlook': 'Gmail/Outlook',
  'company-email': 'company email'
}
