/**
 * Financial opportunity analysis.
 *
 * Strict rules of honesty:
 *  - "measured"  = facts the owner directly told us (their ranges).
 *  - "estimates" = simple midpoint arithmetic on those ranges.
 *  - "modeled"   = scenario math that depends on STATED assumptions.
 *  - Every assumption is listed in plain language with its value.
 *  - Nothing is a promise; the disclaimer says so explicitly.
 *  - If an input is unknown, the scenario is skipped — never guessed.
 *
 * v1.0.1 corrections (audit P1.2):
 *  - The missed-call rate now applies ONLY to the telephone share of
 *    inquiries (from the owner's callVsWebMix answer), never to all
 *    inquiries. Applying a phone miss-rate to web forms, marketplaces and
 *    referrals overstated lost opportunities.
 *  - Open-ended ranges ("More than 100" inquiries, "$5,000+" spend) no
 *    longer masquerade as measured data: the modeling value used is stated
 *    next to every number derived from it and listed in the assumptions.
 *  - All dollar figures are explicitly US dollars (USD) — US-first scope.
 */

import type { Answers } from '../types/answers'
import type { FinancialInputs, FinancialRow, FinancialSection, SoftwarePlan } from '../types/blueprint'

const INQUIRY_MIDPOINTS: Record<string, number | null> = {
  '0-10': 5,
  '11-25': 18,
  '26-50': 38,
  '51-100': 75,
  '100-plus': 150,
  'not-sure': null
}

/** Ranges whose selected option has no upper boundary. */
const OPEN_ENDED_INQUIRY = '100-plus'
const OPEN_ENDED_ADSPEND = '5000-plus'

const ADSPEND_MIDPOINTS: Record<string, number | null> = {
  '0': 0,
  '1-500': 250,
  '501-1500': 1000,
  '1501-5000': 3250,
  '5000-plus': 7500,
  'not-sure': null
}

const REVENUE_MIDPOINTS: Record<string, number | null> = {
  'under-250k': 150000,
  '250k-500k': 375000,
  '500k-1m': 750000,
  '1m-3m': 2000000,
  '3m-10m': 6500000,
  '10m-plus': 12500000,
  'prefer-not': null
}

const MISS_RATES: Record<string, number | null> = {
  'almost-none': 0.02,
  few: 0.1,
  quarter: 0.25,
  'half-plus': 0.5,
  'not-sure': null
}

/**
 * Stated modeling assumptions (single source, surfaced in the UI).
 * phoneShareByAnswer is exactly that — an assumption. The owner's answer is a
 * coarse "mostly calls / mix / mostly online", so the share of inquiries that
 * arrive by telephone is modeled, never measured.
 */
export const ASSUMPTIONS = {
  closeRate: 0.45, // share of inquiries that become jobs
  contactRates: [0.25, 0.5, 0.75] as const, // conservative / moderate / optimistic recovery contact rates
  adminMinutesPerManualProcessPerJob: 22, // minutes saved per inquiry-job when a manual process is digitized
  adminHourlyCost: 24, // USD/hour fully-loaded admin cost
  phoneShareByAnswer: {
    'mostly-calls': 0.85,
    balanced: 0.5,
    'mostly-web': 0.15
  } as Record<string, number>, // share of total inquiries that arrive as telephone calls
  phoneShareWhenUnknown: 0.5, // conservative default when the owner doesn't know their mix
  openEndedInquiryModel: 150, // modeling value for the "More than 100" option
  openEndedAdSpendModel: 7500 // modeling value for the "$5,000+" option
}

const usd = (n: number): string => {
  const rounded = Math.round(n)
  return rounded >= 1000
    ? `$${(rounded / 1000).toFixed(rounded >= 10000 ? 0 : 1)}k`
    : `$${rounded}`
}

export function buildFinancials(a: Answers, software: SoftwarePlan): FinancialSection {
  const inquiries = INQUIRY_MIDPOINTS[a.monthlyInquiries] ?? null
  const adSpend = ADSPEND_MIDPOINTS[a.monthlyAdSpend] ?? null
  const revenue = REVENUE_MIDPOINTS[a.revenue] ?? null
  const missRate = MISS_RATES[a.missedCalls] ?? null

  const inquiriesOpenEnded = a.monthlyInquiries === OPEN_ENDED_INQUIRY
  const adSpendOpenEnded = a.monthlyAdSpend === OPEN_ENDED_ADSPEND

  /* Telephone share of ALL inquiries — modeled from the owner's own answer. */
  const phoneShare =
    a.callVsWebMix !== undefined && ASSUMPTIONS.phoneShareByAnswer[a.callVsWebMix] !== undefined
      ? ASSUMPTIONS.phoneShareByAnswer[a.callVsWebMix]
      : ASSUMPTIONS.phoneShareWhenUnknown // unknown / not-sure / unanswer

  const inputs: FinancialInputs = {
    monthlyInquiries: inquiries,
    monthlyAdSpend: adSpend,
    annualRevenue: revenue,
    missedCallRate: missRate,
    phoneShareOfInquiries: phoneShare,
    inputsAreMidpoints: true
  }

  /* ── Measured: what the owner told us, verbatim ─────────────────────────── */
  const measured: FinancialRow[] = []
  const labelFor = (q: string): string => {
    const map: Record<string, string> = {
      '0-10': '0–10', '11-25': '11–25', '26-50': '26–50', '51-100': '51–100', '100-plus': '100+',
      '1-500': 'up to $500', '501-1500': '$500–$1,500', '1501-5000': '$1,500–$5,000', '5000-plus': '$5,000+',
      'under-250k': 'under $250k', '250k-500k': '$250k–$500k', '500k-1m': '$500k–$1M',
      '1m-3m': '$1M–$3M', '3m-10m': '$3M–$10M', '10m-plus': '$10M+'
    }
    return map[q] ?? q
  }
  if (a.monthlyInquiries !== 'not-sure' && a.monthlyInquiries !== undefined) {
    measured.push({
      label: 'New inquiries per month (your answer)',
      value: labelFor(a.monthlyInquiries),
      note: 'You told us this directly.',
      tone: 'measured'
    })
  }
  if (a.monthlyAdSpend !== 'not-sure' && a.monthlyAdSpend !== undefined) {
    measured.push({
      label: 'Advertising spend per month (your answer, USD)',
      value: labelFor(a.monthlyAdSpend),
      note: 'You told us this directly.',
      tone: 'measured'
    })
  }

  /* ── Estimates: midpoint arithmetic ─────────────────────────────────────── */
  const estimates: FinancialRow[] = []
  const assumptions: string[] = []

  /* Open-ended ranges: say so, every time a number depends on them. */
  if (inquiriesOpenEnded) {
    assumptions.push(
      `Open range assumption: you selected “More than 100” inquiries, so the math uses a modeling value of ${ASSUMPTIONS.openEndedInquiryModel} inquiries/month. Your real number may be higher — dollar results scale roughly in proportion, so treat them as illustrative, not precise.`
    )
  }
  if (adSpendOpenEnded) {
    assumptions.push(
      `Open range assumption: you selected “$5,000+” monthly ad spend, so the math uses a modeling value of ${usd(ASSUMPTIONS.openEndedAdSpendModel)}/month (USD). Your real spend may be higher — cost-per-lead results move inversely, so treat them as illustrative.`
    )
  }

  const hasPaidChannels = a.channels.some((c) => ['google-ads', 'lsa', 'marketplaces', 'social'].includes(c))
  if (adSpend !== null && adSpend > 0 && inquiries !== null && hasPaidChannels) {
    const cpl = adSpend / inquiries
    const openEndedNote = inquiriesOpenEnded
      ? ` Uses the ${ASSUMPTIONS.openEndedInquiryModel}/mo modeling value for your “100+” answer — more real inquiries would mean a lower cost per lead.`
      : ''
    estimates.push({
      label: 'Rough cost per lead, all paid channels combined (USD)',
      value: `~${usd(cpl)}`,
      note: `Approximately ${usd(adSpend)} spend ÷ ~${inquiries} inquiries. This blends all paid channels — per-channel costs differ.${openEndedNote}`,
      tone: 'estimate'
    })
  }

  /* Missed-call math, scoped to the TELEPHONE share of inquiries (v1.0.1). */
  const missedPerMonth =
    inquiries !== null && missRate !== null ? inquiries * phoneShare * missRate : null
  if (missedPerMonth !== null && missRate !== null && missRate > 0.02) {
    const phoneLabel =
      a.callVsWebMix === 'mostly-calls'
        ? 'about 85% of your inquiries'
        : a.callVsWebMix === 'mostly-web'
          ? 'about 15% of your inquiries'
          : a.callVsWebMix === 'balanced'
            ? 'about half of your inquiries'
            : 'half of your inquiries (assumed — you weren’t sure of the split)'
    const openEndedNote = inquiriesOpenEnded
      ? ` Uses the ${ASSUMPTIONS.openEndedInquiryModel}/mo modeling value for your “100+” answer — with more real inquiries the figure scales up in proportion.`
      : ''
    estimates.push({
      label: 'Estimated missed phone inquiries per month',
      value: `~${Math.round(missedPerMonth)}`,
      note: `~${inquiries} inquiries × ${Math.round(phoneShare * 100)}% by phone (${phoneLabel}) × ${Math.round(missRate * 100)}% miss rate. A modeled estimate of phone inquiries lost — not a measured count. Each one is a customer who tried to reach you.${openEndedNote}`,
      tone: 'estimate'
    })
  }

  /* ── Modeled: scenario math with stated assumptions ────────────────────── */
  const modeled: FinancialRow[] = []

  const jobValue =
    revenue !== null && inquiries !== null && inquiries > 0
      ? revenue / 12 / (inquiries * ASSUMPTIONS.closeRate)
      : null

  if (jobValue !== null) {
    assumptions.push(
      `Conversion assumption: ${Math.round(ASSUMPTIONS.closeRate * 100)}% of new inquiries become paying jobs (a placeholder — replace it with your real close rate if you know it).`
    )
    modeled.push({
      label: 'Implied average job value (USD)',
      value: usd(jobValue),
      note: `Estimated from your revenue range ÷ estimated jobs. Swap in your real average ticket any time.`,
      tone: 'modeled'
    })
  }

  if (missedPerMonth !== null && missedPerMonth >= 0.5) {
    assumptions.push(
      `Phone-share assumption: ${Math.round(phoneShare * 100)}% of your inquiries arrive as phone calls (from your answer${
        a.callVsWebMix === 'not-sure' || a.callVsWebMix === undefined ? ' — you weren’t sure, so we modeled a conservative 50%' : ''
      }). The missed-call percentage you reported is applied only to those calls, not to forms or messages.`
    )
    assumptions.push(
      'Recovery assumption: of the customers reached by an instant text-back and same-day call, 25% (conservative), 50% (moderate) or 75% (optimistic) re-engage instead of booking elsewhere.'
    )
    if (jobValue !== null) {
      assumptions.push('Value assumption: recovered inquiries convert at the same rate and value as ordinary ones.')
      const names = ['Conservative', 'Moderate', 'Optimistic']
      ASSUMPTIONS.contactRates.forEach((rate, i) => {
        const recovered = missedPerMonth * rate * ASSUMPTIONS.closeRate
        modeled.push({
          label: `${names[i]} scenario — recovered revenue per month (USD)`,
          value: `${usd(recovered * jobValue)}/mo`,
          note: `~${recovered.toFixed(1)} recovered phone inquiries × ${usd(jobValue)} average job. Hypothetical scenario, not a forecast.`,
          tone: 'modeled'
        })
      })
    } else {
      const names = ['Conservative', 'Moderate', 'Optimistic']
      ASSUMPTIONS.contactRates.forEach((rate, i) => {
        modeled.push({
          label: `${names[i]} scenario — phone inquiries recovered per month`,
          value: `~${(missedPerMonth * rate).toFixed(1)}`,
          note: 'Volume view only — you preferred not to share revenue, so no dollar values are guessed.',
          tone: 'modeled'
        })
      })
    }
  }

  /* Admin time savings from digitizing manual processes. */
  const manualProcesses: string[] = []
  if (['paper-calendar', 'phone-tag'].includes(a.bookingProcess)) manualProcesses.push('booking')
  if (['owner-manual', 'technicians-self', 'not-sure'].includes(a.technicianAssignment)) manualProcesses.push('dispatch')
  if (['paper-forms', 'memory', 'photos-notes'].includes(a.workRecording)) manualProcesses.push('job records')
  if (['manual'].includes(a.invoicing)) manualProcesses.push('invoicing')
  if (['manual'].includes(a.paymentTracking)) manualProcesses.push('payment tracking')
  if (['memory', 'not-sure'].includes(a.repeatCustomerManagement)) manualProcesses.push('past customers')
  if (['none'].includes(a.pipelineTracking)) manualProcesses.push('pipeline')

  if (inquiries !== null && manualProcesses.length >= 3) {
    assumptions.push(
      `Admin assumption: digitizing one manual process saves roughly ${ASSUMPTIONS.adminMinutesPerManualProcessPerJob} minutes per inquiry-job; an admin hour costs ${usd(ASSUMPTIONS.adminHourlyCost)} fully loaded (USD). Adjust both to your reality.`
    )
    const manualShare = manualProcesses.length / 7
    const hours = inquiries * manualShare * (ASSUMPTIONS.adminMinutesPerManualProcessPerJob / 60)
    modeled.push({
      label: 'Admin hours you could hand to software each month',
      value: `~${Math.round(hours)} hrs/mo`,
      note: `Based on ${manualProcesses.length} of 7 core processes still done manually at your volume.`,
      tone: 'modeled'
    })
    modeled.push({
      label: 'Value of that admin time (USD)',
      value: `${usd(hours * ASSUMPTIONS.adminHourlyCost)}/mo`,
      note: 'Hours saved × assumed admin cost. Usually redeployed into sales or family time rather than cashed.',
      tone: 'modeled'
    })
  }

  /* Software cost estimate from the recommended stack. */
  const lines = software.stack
    .filter((s) => s.status === 'adopt' || s.status === 'keep')
    .map((s) => ({
      name: s.name,
      cost: s.monthlyCostEstimate,
      note: s.costNote
    }))
  const priced = lines.filter((l) => l.cost !== null && l.cost !== undefined) as { name: string; cost: number; note: string }[]
  const monthly = priced.length > 0 ? priced.reduce((sum, l) => sum + l.cost, 0) : null
  assumptions.push(
    'Pricing note: software figures are point-in-time published US entry prices (USD, verified Oct 2026 where noted), not quotes. Plans, users and add-ons change the real number — confirm with vendors.'
  )

  return {
    inputs,
    measured,
    estimates,
    modeled,
    assumptions,
    softwareCost: {
      monthly,
      lines,
      note: monthly !== null
        ? `Adds the estimated starting prices of the recommended core tools (${priced.map((l) => l.name).join(', ')}). Your actual cost depends on plan tiers and user counts.`
        : 'Could not be estimated because the recommended stack includes custom-priced components — confirm with vendors.'
    },
    disclaimer:
      'These are hypothetical scenarios built only from your answers and the stated assumptions — not forecasts, benchmarks or promises. All figures are US dollars (this planner is built for US businesses). Where you didn’t provide a number, we show nothing rather than invent one. Replace any assumption with your real figures to get a sharper picture.'
  }
}
