/**
 * Software recommendation engine.
 *
 * Principles (from the product spec, enforced here in code order):
 *  1. Prefer existing software whenever possible.
 *  2. Avoid unnecessary CRM replacement.
 *  3. Avoid redundant subscriptions — recommend "switch on what you own".
 *  4. Right-size to team size and volume.
 *  5. Distinguish essential from optional.
 *  6. State when integration compatibility is NOT verified.
 */

import type { Answers } from '../types/answers'
import type { BusinessClassification, IntegrationNote, SoftwarePlan, SoftwareRecommendation } from '../types/blueprint'
import { SOFTWARE_BY_ID, type SoftwareEntry } from '../data/software'
import { hasFsm } from './classify'
import type { WorkflowStack } from '../data/workflows'

function rec(
  entry: SoftwareEntry,
  partial: Omit<SoftwareRecommendation, 'softwareId' | 'name' | 'category' | 'verifiedIntegrations' | 'website' | 'monthlyCostEstimate'> & {
    monthlyCostEstimate: number | null
  }
): SoftwareRecommendation {
  return {
    softwareId: entry.id,
    name: entry.name,
    category: entry.category,
    verifiedIntegrations: entry.integrations
      .filter((i) => i.status === 'verified')
      .map((i) => SOFTWARE_BY_ID[i.with]?.name ?? i.with),
    website: entry.website,
    ...partial
  }
}

const COST_NOTE_FALLBACK = 'Pricing changes often — verify on the vendor site before purchase.'

export function buildSoftwarePlan(
  a: Answers,
  cls: BusinessClassification,
  stack: WorkflowStack
): SoftwarePlan {
  const out: SoftwareRecommendation[] = []

  /* ── 1. Field-service / job management hub ─────────────────────────────── */
  const existingFsm = stack.fsm
  if (existingFsm) {
    out.push(
      rec(existingFsm, {
        role: 'Your field-service hub',
        why: `You already run ${existingFsm.name}. Replacing it would cost money and time you don’t need to spend — the plan is to deepen how you use it (scheduling, quoting, invoicing and notifications all live in here).`,
        status: 'keep',
        essential: true,
        monthlyCostEstimate: existingFsm.pricing?.from ?? null,
        costNote: existingFsm.pricing?.note ?? COST_NOTE_FALLBACK,
        caveats: existingFsm.limitations.join(' ') || 'Verify current plan limits as your team grows.'
      })
    )
  } else if (stack.marketingCrm) {
    // GoHighLevel already present: keep it for lead response, add light FSM for jobs.
    const jobber = SOFTWARE_BY_ID['jobber']
    out.push(
      rec(SOFTWARE_BY_ID['gohighlevel'], {
        role: 'Lead capture and follow-up engine',
        why: 'You already use GoHighLevel — its strengths (speed-to-lead, missed-call text-back, pipelines) are exactly what the front of your funnel needs. Keep it as the marketing layer.',
        status: 'keep',
        essential: true,
        monthlyCostEstimate: 97,
        costNote: 'Starter $97/mo, Unlimited $297/mo (verified Oct 2026 on gohighlevel.com/pricing).',
        caveats: 'GoHighLevel does not dispatch technicians or manage field jobs — it needs a job system beside it.'
      })
    )
    out.push(
      rec(jobber, {
        role: 'Field-service hub for scheduling, quotes, job records and invoicing',
        why: 'Because GoHighLevel doesn’t run field operations, pair it with a home-services job platform rather than forcing a generalist CRM to do dispatch.',
        status: 'adopt',
        essential: true,
        monthlyCostEstimate: cls.sizeTier === 'micro' ? 39 : 169,
        costNote:
          cls.sizeTier === 'micro'
            ? 'Core plan from $39/mo (solo).'
            : 'Team plans from $169/mo (Connect Team, 5 users); verify current pricing.',
        caveats: 'Running two systems side by side needs a clear rule: GoHighLevel owns marketing and speed-to-lead; the FSM owns jobs and money.'
      })
    )
  } else {
    // No FSM at all — recommend one right-sized to the business.
    const pick: SoftwareEntry =
      cls.sizeTier === 'larger' || (cls.sizeTier === 'medium' && a.technicians === '16-plus')
        ? SOFTWARE_BY_ID['servicetitan']
        : SOFTWARE_BY_ID['jobber']
    if (pick.id === 'servicetitan') {
      out.push(
        rec(pick, {
          role: 'Enterprise field-service platform (evaluate against Jobber Plus)',
          why: 'At 15+ technicians with deep dispatch and reporting needs, ServiceTitan-class platforms are the industry standard — but they carry custom pricing, implementation fees and contracts, so evaluate carefully against the simpler alternative below.',
          status: 'optional',
          essential: false,
          monthlyCostEstimate: null,
          costNote: 'Custom pricing, commonly reported around $245–$398 per technician/month plus implementation fees — confirm directly with ServiceTitan.',
          caveats: '12+ month contracts are commonly reported. Budget for implementation, not just subscription.'
        })
      )
      out.push(
        rec(SOFTWARE_BY_ID['jobber'], {
          role: 'Field-service hub (simpler, price-transparent alternative)',
          why: 'Jobber covers scheduling, quoting, invoicing, reminders and job records for growing teams, at transparent published pricing — a serious option before committing to an enterprise platform.',
          status: 'adopt',
          essential: true,
          monthlyCostEstimate: cls.sizeTier === 'larger' ? 599 : 349,
          costNote:
            cls.sizeTier === 'larger'
              ? 'Plus plan $599/mo (15 users, includes marketing suite and AI receptionist) — verify current pricing.'
              : 'Grow Team $349/mo (10 users) — verify current pricing.',
          caveats: 'Above ~15 users, per-user fees compound; review annually.'
        })
      )
    } else {
      out.push(
        rec(pick, {
          role: 'Your new field-service hub (one system for leads, schedule, quotes, jobs, invoices)',
          why: `For a ${cls.sizeLabel.split(' (')[0].toLowerCase()} like yours, a home-services job platform is the single highest-leverage piece of software: it replaces the paper, the phone tag and the Sunday-night invoice pile at once.`,
          status: 'adopt',
          essential: true,
          monthlyCostEstimate: cls.sizeTier === 'micro' ? 39 : cls.sizeTier === 'small' ? 169 : 349,
          costNote:
            cls.sizeTier === 'micro'
              ? 'Core from $39/mo (solo operator).'
              : cls.sizeTier === 'small'
                ? 'Connect Team from $169/mo (5 users); extra users ~$29/user/mo.'
                : 'Grow Team from $349/mo (10 users). Verify current pricing on getjobber.com/pricing.',
          caveats: 'Plan tiers gate some automations (e.g., quote follow-ups) — check the tier that includes what this blueprint recommends.'
        })
      )
      out.push(
        rec(SOFTWARE_BY_ID['housecall-pro'], {
          role: 'Comparable alternative worth a look',
          why: 'Housecall Pro covers the same ground as Jobber with slightly different strengths (customer communication, consumer financing). Pricing is close — trial both and pick by feel, not by feature list.',
          status: 'optional',
          essential: false,
          monthlyCostEstimate: 49,
          costNote: 'Basic plans commonly reported around $49–$59/mo — verify current pricing on housecallpro.com/pricing.',
          caveats: 'Do not buy both — pick one field-service hub.'
        })
      )
    }
  }

  /* ── 2. Accounting ─────────────────────────────────────────────────────── */
  if (stack.accounting) {
    out.push(
      rec(stack.accounting, {
        role: 'Accounting and books',
        why: `You already use ${stack.accounting.name}. Keep it — the plan connects your job software to it so invoices and payments sync automatically.`,
        status: 'keep',
        essential: true,
        monthlyCostEstimate: stack.accounting.pricing?.from ?? null,
        costNote: stack.accounting.pricing?.note ?? COST_NOTE_FALLBACK,
        caveats: 'Confirm the sync with your field-service platform is enabled once.'
      })
    )
  } else if (a.accounting === 'accountant-only') {
    out.push(
      rec(SOFTWARE_BY_ID['quickbooks'], {
        role: 'Accounting (coordinate with your accountant)',
        why: 'Your accountant already handles the books — ask which online accounting platform they prefer before buying anything. QuickBooks Online is the US default and connects natively to the major field-service platforms.',
        status: 'verify',
        essential: true,
        monthlyCostEstimate: 38,
        costNote: 'Simple Start $38/mo after the Aug 2026 increase — verify current pricing.',
        caveats: 'Let your accountant pick; the important part is the automatic sync with your job software.'
      })
    )
  } else {
    out.push(
      rec(SOFTWARE_BY_ID['quickbooks'], {
        role: 'Accounting and books',
        why: 'QuickBooks Online is the US small-business standard and connects natively to Jobber, Housecall Pro and ServiceTitan — money information flows without re-typing.',
        status: 'adopt',
        essential: true,
        monthlyCostEstimate: 38,
        costNote: 'Simple Start $38/mo, Essentials $85/mo (verified Oct 2026 via Intuit notices) — confirm current pricing.',
        caveats: 'Outside the US, Xero is often the better fit (Australia, Canada, UK).'
      })
    )
  }

  /* ── 3. Website ────────────────────────────────────────────────────────── */
  if (a.websitePlatform === 'wordpress') {
    out.push(
      rec(SOFTWARE_BY_ID['wordpress'], {
        role: 'Your website — the inquiry engine',
        why: 'You’re on WordPress, which gives full control over forms, tracking and landing pages. The plan is to wire it up: proper contact/booking forms feeding your CRM, plus GA4 measurement.',
        status: 'keep',
        essential: true,
        monthlyCostEstimate: 0,
        costNote: 'Software free; hosting typically $5–30/mo. Elementor Pro optional.',
        caveats: 'Keep WordPress and plugins updated (maintenance matters).'
      })
    )
  } else if (a.websitePlatform === 'no-website') {
    out.push(
      rec(SOFTWARE_BY_ID['wordpress'], {
        role: 'A proper website (currently missing)',
        why: 'Without a website you’re invisible to a large share of buyers and can’t capture online inquiries or measure anything. A focused WordPress site with a clear services-and-areas structure is the fastest fix.',
        status: 'adopt',
        essential: true,
        monthlyCostEstimate: 0,
        costNote: 'Software free; hosting typically $5–30/mo.',
        caveats: 'This is a WebThangs specialty — see Section 12.'
      })
    )
  }

  /* ── 4. Analytics (free) ───────────────────────────────────────────────── */
  if (!stack.hasAnalytics) {
    out.push(
      rec(SOFTWARE_BY_ID['ga4'], {
        role: 'See which marketing brings customers',
        why: 'Free, and it answers the question every ad budget deserves: which channel actually produces inquiries and jobs?',
        status: 'adopt',
        essential: a.monthlyAdSpend !== '0',
        monthlyCostEstimate: 0,
        costNote: 'Free — no cost, generous limits.',
        caveats: 'One-time setup; needs Tag Manager for clean installation.'
      })
    )
    out.push(
      rec(SOFTWARE_BY_ID['gtm'], {
        role: 'Manage website tracking without a developer every time',
        why: 'Free companion to GA4 — keeps all measurement code tidy and editable in one place.',
        status: 'adopt',
        essential: false,
        monthlyCostEstimate: 0,
        costNote: 'Free — no cost, managed in one place.',
        caveats: 'Technical one-time setup (WebThangs can do this — see Section 12).'
      })
    )
  }

  /* ── 5. Phone system (only when missed calls are a real problem) ────────── */
  if (
    ['few', 'quarter', 'half-plus'].includes(a.missedCalls) &&
    ['personal-cell', 'office-line', 'mix'].includes(a.phoneSystem)
  ) {
    out.push(
      rec(SOFTWARE_BY_ID['voip'], {
        role: 'Business phone system that catches what one line can’t',
        why: 'Calls that ring multiple people get answered more; calls that still slip through get logged, recorded (optional) and trigger instant text-backs. Personal cell phones and a single office line leak customers every week.',
        status: 'adopt',
        essential: a.missedCalls === 'quarter' || a.missedCalls === 'half-plus',
        monthlyCostEstimate: null,
        costNote: 'Typically ~$0–30 per user/month depending on provider (Google Voice free for solo US use; OpenPhone and similar are paid). Verify current pricing with the provider you choose.',
        caveats: 'A phone system alone doesn’t fix response habits — pair it with the missed-call text-back workflow.'
      })
    )
  }

  /* ── 6. Automation platform (optional, only when needed) ────────────────── */
  if (stack.automation) {
    out.push(
      rec(stack.automation, {
        role: 'Connect tools that don’t share data natively',
        why: `You already use ${stack.automation.name}. Keep it for the gaps — but always prefer built-in automations in your field-service platform first, so processes stay in one place.`,
        status: 'keep',
        essential: false,
        monthlyCostEstimate: stack.automation.pricing?.from ?? null,
        costNote: stack.automation.pricing?.note ?? COST_NOTE_FALLBACK,
        caveats: 'Watch operation/task counts — fees scale with volume.'
      })
    )
  } else {
    out.push(
      rec(SOFTWARE_BY_ID['make'], {
        role: 'Optional glue between tools, when built-ins run out',
        why: 'Only add an automation platform when your job software can’t do the job natively. When that day comes, Make’s free tier covers light volumes.',
        status: 'optional',
        essential: false,
        monthlyCostEstimate: 0,
        costNote: 'Free tier with a monthly operations allowance (commonly ~1,000 ops/mo); paid from ~$9/mo — verify current limits.',
        caveats: 'Every automation you add is a thing to maintain. Prefer the built-in feature.'
      })
    )
  }

  /* ── 7. Local Services Ads (optional channel) ──────────────────────────── */
  if (
    ['501-1500', '1501-5000', '5000-plus'].includes(a.monthlyAdSpend) &&
    !stack.usesLsa
  ) {
    out.push(
      rec(SOFTWARE_BY_ID['lsa'], {
        role: 'Optional pay-per-lead channel to test',
        why: 'For home services, Local Services Ads put you at the top of Google with a “Google Screened” badge, and you pay per lead instead of per click. Worth testing once missed-call handling is solid.',
        status: 'optional',
        essential: false,
        monthlyCostEstimate: null,
        costNote: 'You set a weekly budget; cost per lead varies by trade and area.',
        caveats: 'Availability varies by trade, state and country, and requires background/license checks — verify eligibility before planning around it.'
      })
    )
  }

  /* ── Integration notes: only what the knowledge base supports ──────────── */
  const integrations: IntegrationNote[] = []
  const presentIds = out.map((s) => s.softwareId)
  const seen = new Set<string>()
  for (const s of out) {
    const entry = SOFTWARE_BY_ID[s.softwareId]
    if (!entry) continue
    for (const link of entry.integrations) {
      if (!presentIds.includes(link.with)) continue
      const key = [s.softwareId, link.with].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      integrations.push({
        from: s.name,
        to: SOFTWARE_BY_ID[link.with]?.name ?? link.with,
        status: link.status,
        note:
          link.status === 'verified'
            ? `Native, vendor-documented integration — connect once and data flows automatically.`
            : `Commonly available but not vendor-documented in our knowledge base — verify it covers your plan tier before relying on it.`
      })
    }
  }
  if (stack.marketingCrm && !hasFsm(a)) {
    integrations.push({
      from: 'GoHighLevel',
      to: 'Jobber',
      status: 'unverified',
      note: 'No native integration is documented in our knowledge base. If a direct connection isn’t available on your plans, Zapier/Make can bridge them — verify before building on it.'
    })
  }

  const principles = [
    'Prefer what you already own — several recommendations are “switch on”, not “buy”.',
    'One field-service hub beats a puzzle of single-purpose tools.',
    'Essential items first; optional items earn their place only after the essentials run.',
    'Integration compatibility is stated as verified, likely or unverified — never assumed.',
    'Every price here is a point-in-time reference, not a quote. Verify before purchase.'
  ]

  return { stack: out, integrations, principles }
}
