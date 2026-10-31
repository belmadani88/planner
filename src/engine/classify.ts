/**
 * Business classification — deterministic, explainable, sized from the
 * owner's own answers.
 */

import type { Answers } from '../types/answers'
import type { BusinessClassification } from '../types/blueprint'
import { answerIs } from './labels'

const EMPLOYEE_TIERS: Record<string, 'micro' | 'small' | 'medium' | 'larger'> = {
  '1-3': 'micro',
  '4-7': 'small',
  '8-15': 'medium',
  '16-30': 'medium',
  '31-plus': 'larger'
}

const SIZE_LABELS: Record<string, string> = {
  micro: 'Micro (1–3 people)',
  small: 'Small team (4–7 people)',
  medium: 'Established team (8–30 people)',
  larger: 'Larger organization (30+ people)'
}

const VOLUME_TIERS: Record<string, 'low' | 'moderate' | 'high' | 'unknown'> = {
  '0-10': 'low',
  '11-25': 'moderate',
  '26-50': 'moderate',
  '51-100': 'high',
  '100-plus': 'high',
  'not-sure': 'unknown'
}

const VOLUME_LABELS: Record<string, string> = {
  low: 'Low inquiry volume (under ~10/month)',
  moderate: 'Moderate inquiry volume (~11–50/month)',
  high: 'High inquiry volume (50+/month)',
  unknown: 'Inquiry volume unknown'
}

export function classifyBusiness(a: Answers): BusinessClassification {
  const sizeTier = EMPLOYEE_TIERS[a.employees] ?? 'small'
  const volumeTier = VOLUME_TIERS[a.monthlyInquiries] ?? 'unknown'

  /* Technology maturity: how many core processes already run in software. */
  const digitizedSignals: string[] = []
  const realFsm = ['jobber', 'housecall-pro', 'servicetitan', 'other-fsm']
  const realCrm = ['jobber', 'housecall-pro', 'servicetitan', 'gohighlevel', 'hubspot', 'other-crm']
  if (realFsm.includes(a.fsm)) digitizedSignals.push('field-service software')
  if (realCrm.includes(a.crm) && !realFsm.includes(a.crm)) digitizedSignals.push('CRM')
  if (a.bookingProcess === 'software') digitizedSignals.push('booking')
  if (a.technicianAssignment === 'software') digitizedSignals.push('dispatch')
  if (a.invoicing === 'software' || a.invoicing === 'software-later') digitizedSignals.push('invoicing')
  if (a.pipelineTracking === 'software') digitizedSignals.push('pipeline')
  if (a.workRecording === 'software') digitizedSignals.push('job records')
  if (['quickbooks', 'xero', 'other-accounting'].includes(a.accounting)) digitizedSignals.push('accounting')
  if (a.customerUpdates === 'software') digitizedSignals.push('customer notifications')

  const n = digitizedSignals.length
  const techMaturity =
    n >= 6 ? 'integrated' : n >= 3 ? 'digitized' : n >= 1 ? 'basic' : 'manual'

  const TECH_LABELS: Record<string, string> = {
    manual: 'Mostly manual (paper, memory and phones)',
    basic: 'Basic tools (1–2 processes digitized)',
    digitized: 'Partly digitized (3–5 processes in software)',
    integrated: 'Well digitized (6+ processes in software)'
  }

  /* Operational pattern. */
  const operationalPattern =
    a.inquiryHandler === 'owner' || a.inquiryHandler === 'technicians'
      ? 'owner-led'
      : a.inquiryHandler === 'dedicated-csr'
        ? 'team-based'
        : 'delegated'
  const PATTERN_LABELS: Record<string, string> = {
    'owner-led': 'Owner-led (you are the switchboard)',
    delegated: 'Delegated (office staff handle inquiries)',
    'team-based': 'Team-based (dedicated call handling)'
  }

  /* Demand pressure: inquiry volume vs. field capacity. */
  const techCount =
    a.technicians === '0' || a.technicians === '1-3'
      ? 2
      : a.technicians === '4-7'
        ? 5
        : a.technicians === '8-15'
          ? 11
          : a.technicians === '16-plus'
            ? 18
            : 0
  let demandPressure: BusinessClassification['demandPressure'] = 'balanced'
  if (volumeTier === 'unknown' || techCount === 0) {
    demandPressure = 'unknown'
  } else if (volumeTier === 'high' && techCount <= 3) {
    demandPressure = 'over-capacity'
  } else if (volumeTier === 'moderate' && techCount <= 2) {
    demandPressure = 'at-capacity'
  } else if (volumeTier === 'low' && techCount >= 5) {
    demandPressure = 'under-utilized'
  }
  const DEMAND_LABELS: Record<string, string> = {
    'under-utilized': 'Field capacity is waiting for work',
    balanced: 'Demand and field capacity are roughly balanced',
    'at-capacity': 'The team is close to capacity',
    'over-capacity': 'Inquiry volume exceeds field capacity',
    unknown: 'Capacity picture unclear from your answers'
  }

  return {
    sizeTier,
    sizeLabel: SIZE_LABELS[sizeTier],
    volumeTier,
    volumeLabel: VOLUME_LABELS[volumeTier],
    techMaturity,
    techLabel: TECH_LABELS[techMaturity],
    operationalPattern,
    patternLabel: PATTERN_LABELS[operationalPattern],
    demandPressure,
    demandLabel: DEMAND_LABELS[demandPressure]
  }
}

/** Rough field headcount from the technicians answer (0 = unknown). */
export function technicianCount(a: Answers): number {
  switch (a.technicians) {
    case '0':
      return 1 // owner does the field work
    case '1-3':
      return 2
    case '4-7':
      return 5
    case '8-15':
      return 11
    case '16-plus':
      return 18
    default:
      return 0
  }
}

/** Does the business already run a real field-service/CRM platform? */
export function hasFsm(a: Answers): boolean {
  return ['jobber', 'housecall-pro', 'servicetitan', 'other-fsm'].includes(a.fsm)
}

export function hasMarketingCrm(a: Answers): boolean {
  return a.crm === 'gohighlevel'
}

export function hasAnalytics(a: Answers): boolean {
  return answerIs('marketingTools', a, 'ga4', 'gtm')
}
