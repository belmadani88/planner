/**
 * Industry configuration library.
 *
 * One common operating backbone (the 11 stages) with meaningful, modular
 * industry differences — never seven separate products.
 */

import type { IndustryId } from '../types/answers'

export interface IndustryService {
  id: string
  label: string
}

export interface IndustryConfig {
  id: IndustryId
  name: string
  tagline: string
  description: string
  icon: 'wind' | 'wrench' | 'home' | 'zap' | 'droplets' | 'hammer' | 'leaf'
  services: IndustryService[]
  /** How urgent inbound demand typically is. */
  emergencyHeavy: boolean
  recurringRevenue: 'maintenance-agreements' | 'service-plans' | 'contracts' | 'low'
  salesCycle: 'short' | 'medium' | 'long'
  estimateStyle: 'simple' | 'itemized' | 'detailed-project' | 'insurance-involved'
  demandPattern: string
  jobValueHint: string
  /** Industry-specific notes layered onto specific stages of the model. */
  stageNotes: Partial<Record<number, string>>
  /** Workflow ids this industry particularly benefits from. */
  accentWorkflows: string[]
}

export const INDUSTRIES: IndustryConfig[] = [
  {
    id: 'hvac',
    name: 'HVAC',
    tagline: 'Heating, ventilation & air conditioning',
    description:
      'HVAC companies juggle emergency no-heat/no-cool calls, installation projects and preventive maintenance — often in the same week.',
    icon: 'wind',
    services: [
      { id: 'emergency-repairs', label: 'Emergency repairs (no heat / no cooling)' },
      { id: 'installations', label: 'System installations & replacements' },
      { id: 'maintenance', label: 'Preventive maintenance' },
      { id: 'maintenance-agreements', label: 'Maintenance agreements / service plans' },
      { id: 'air-quality', label: 'Indoor air quality & accessories' },
      { id: 'commercial', label: 'Commercial / light commercial service' }
    ],
    emergencyHeavy: true,
    recurringRevenue: 'maintenance-agreements',
    salesCycle: 'short',
    estimateStyle: 'itemized',
    demandPattern:
      'Strongly seasonal — a hot July or cold January can flood the phones within days.',
    jobValueHint:
      'Job values span from small service calls to multi-thousand-dollar system replacements.',
    stageNotes: {
      3: 'In HVAC, urgency means a broken furnace in January must be triaged differently from a June tune-up quote.',
      4: 'Seasonal peaks make capacity planning critical — the calendar that worked in April collapses in a heat wave.',
      10: 'Maintenance agreements are the single biggest lever for smoothing seasonal demand and creating recurring revenue.'
    },
    accentWorkflows: ['W-MAINTENANCE-PROGRAM', 'W-APPT-REMINDERS', 'W-REVIEW-REQUEST']
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    tagline: 'Residential & commercial plumbing',
    description:
      'Plumbing companies balance burst-pipe emergencies with diagnosis-based repairs, replacements and recurring maintenance.',
    icon: 'wrench',
    services: [
      { id: 'emergency-repairs', label: 'Emergency repairs (leaks, bursts, clogs)' },
      { id: 'diagnosis-inspection', label: 'Diagnosis & camera inspections' },
      { id: 'repairs', label: 'General repairs & fixture work' },
      { id: 'replacements', label: 'Replacements (water heaters, repipes)' },
      { id: 'maintenance', label: 'Recurring maintenance plans' }
    ],
    emergencyHeavy: true,
    recurringRevenue: 'service-plans',
    salesCycle: 'short',
    estimateStyle: 'simple',
    demandPattern:
      'Emergencies arrive with zero notice; replacement work usually closes on the first or second visit.',
    jobValueHint:
      'Repair tickets are smaller; replacements and repipes carry the margin.',
    stageNotes: {
      3: 'A “water is pouring through the ceiling” call must jump the queue over a dripping tap — urgency triage is the core skill.',
      5: 'Many plumbing jobs can be priced on the spot with flat-rate pricing; long written quotes are usually only needed for replacements.'
    },
    accentWorkflows: ['W-MISSED-CALL-TEXT', 'W-SAME-DAY-ESTIMATE', 'W-MAINTENANCE-PROGRAM']
  },
  {
    id: 'roofing',
    name: 'Roofing',
    tagline: 'Roof repair, replacement & storm work',
    description:
      'Roofing runs on inspections, detailed measurements, insurance workflows and longer sales cycles than most trades.',
    icon: 'home',
    services: [
      { id: 'inspections', label: 'Inspections & storm assessments' },
      { id: 'repairs', label: 'Repairs & leak tracing' },
      { id: 'replacements', label: 'Full replacements & re-roofs' },
      { id: 'insurance', label: 'Insurance claim work' },
      { id: 'gutters', label: 'Gutters & accessories' }
    ],
    emergencyHeavy: false,
    recurringRevenue: 'low',
    salesCycle: 'long',
    estimateStyle: 'insurance-involved',
    demandPattern:
      'Storms create sudden spikes; replacement decisions take days or weeks and often involve an insurance adjuster.',
    jobValueHint:
      'Replacement and storm-restoration jobs are high-value, so each lost quote is expensive.',
    stageNotes: {
      5: 'Roofing estimates are built from measurements, material choice and sometimes insurance scope — accuracy and presentation matter more than speed.',
      6: 'The estimate-to-sale window is long: homeowners collect multiple bids and wait on adjusters, so structured follow-up wins jobs that would silently die.',
      7: 'Material ordering and crew scheduling make project scheduling a logistics exercise, not just a calendar entry.'
    },
    accentWorkflows: ['W-FOLLOWUP-SEQUENCE', 'W-ESTIMATE-TRACKING', 'W-PIPELINE-BOARD']
  },
  {
    id: 'electrical',
    name: 'Electrical',
    tagline: 'Electrical contractors',
    description:
      'Electrical contractors mix service calls, panel upgrades and installation projects with strict safety and permitting requirements.',
    icon: 'zap',
    services: [
      { id: 'service-repairs', label: 'Service calls & repairs' },
      { id: 'panel-upgrades', label: 'Panel upgrades & rewires' },
      { id: 'ev-chargers', label: 'EV charger installation' },
      { id: 'lighting', label: 'Lighting & fixtures' },
      { id: 'new-construction', label: 'New construction / remodel wiring' }
    ],
    emergencyHeavy: false,
    recurringRevenue: 'low',
    salesCycle: 'medium',
    estimateStyle: 'itemized',
    demandPattern:
      'Steady service demand plus project work; permitting and inspections add process steps.',
    jobValueHint:
      'Panel upgrades and EV charger installs are consistent mid-value jobs with growing demand.',
    stageNotes: {
      5: 'Permits and inspection scheduling must be tracked alongside the estimate, or jobs stall after approval.',
      8: 'Safety checks and code compliance belong in the recorded job notes for every completed project.'
    },
    accentWorkflows: ['W-ESTIMATE-TRACKING', 'W-JOB-DOCS']
  },
  {
    id: 'restoration',
    name: 'Water damage restoration',
    tagline: 'Emergency mitigation & rebuild',
    description:
      'Restoration companies operate 24/7 emergency response with insurance documentation driving every job.',
    icon: 'droplets',
    services: [
      { id: 'emergency-mitigation', label: 'Emergency mitigation (water extraction, dry-out)' },
      { id: 'mold', label: 'Mold remediation' },
      { id: 'reconstruction', label: 'Reconstruction & repairs' },
      { id: 'contents', label: 'Contents cleaning & storage' }
    ],
    emergencyHeavy: true,
    recurringRevenue: 'low',
    salesCycle: 'short',
    estimateStyle: 'insurance-involved',
    demandPattern:
      'Disaster-driven spikes; the first company to answer the phone usually gets the job.',
    jobValueHint:
      'Mitigation jobs bill through insurance with detailed documentation requirements.',
    stageNotes: {
      2: 'Response speed is the whole game — flooded basements are called down a list until someone answers.',
      8: 'Moisture readings, photos and drying logs are not optional paperwork; they are what gets the invoice paid by insurance.',
      9: 'Billing runs through adjusters, so documentation quality directly affects cash flow.'
    },
    accentWorkflows: ['W-MISSED-CALL-TEXT', 'W-RESPONSE-SLA', 'W-JOB-DOCS']
  },
  {
    id: 'remodeling',
    name: 'Home remodeling',
    tagline: 'Kitchens, baths & additions',
    description:
      'Remodelers run multi-week projects with design decisions, material selections and milestone billing.',
    icon: 'hammer',
    services: [
      { id: 'kitchens', label: 'Kitchen remodeling' },
      { id: 'bathrooms', label: 'Bathroom remodeling' },
      { id: 'additions', label: 'Additions & structural work' },
      { id: 'design-build', label: 'Design-build services' }
    ],
    emergencyHeavy: false,
    recurringRevenue: 'low',
    salesCycle: 'long',
    estimateStyle: 'detailed-project',
    demandPattern:
      'Long consideration cycles; homeowners compare detailed proposals over weeks.',
    jobValueHint:
      'High project values make winning even a few extra quotes a year meaningful.',
    stageNotes: {
      5: 'Detailed, well-presented proposals with material allowances are the sales product — a verbal quote loses to a written one.',
      6: 'Follow-up over weeks (not days) with value reminders, references and answers to “we’re still thinking”.',
      8: 'Change orders must be documented and signed — scope drift is the #1 profit killer in remodeling.'
    },
    accentWorkflows: ['W-ESTIMATE-KIT', 'W-FOLLOWUP-SEQUENCE', 'W-PIPELINE-BOARD']
  },
  {
    id: 'landscaping',
    name: 'Landscaping',
    tagline: 'Design, build & maintenance',
    description:
      'Landscaping companies run recurring maintenance routes alongside design-build projects — two very different operating rhythms.',
    icon: 'leaf',
    services: [
      { id: 'maintenance-contracts', label: 'Recurring maintenance contracts' },
      { id: 'design-build', label: 'Design & installation projects' },
      { id: 'hardscaping', label: 'Hardscaping (patios, walls, walkways)' },
      { id: 'irrigation', label: 'Irrigation & lighting' },
      { id: 'seasonal', label: 'Seasonal cleanups & snow (if applicable)' }
    ],
    emergencyHeavy: false,
    recurringRevenue: 'contracts',
    salesCycle: 'medium',
    estimateStyle: 'itemized',
    demandPattern:
      'Route work is steady and predictable; project work is seasonal and competitive.',
    jobValueHint:
      'Contract revenue is the stable base; design-build projects carry the upside.',
    stageNotes: {
      7: 'Route density — grouping nearby properties on the same day — is what makes maintenance profitable.',
      10: 'Contract renewals and upsells to project work are the growth engine; a lapsed renewal is silent revenue loss.'
    },
    accentWorkflows: ['W-MAINTENANCE-PROGRAM', 'W-ROUTE-DAY', 'W-AR-REMINDERS']
  }
]

export const INDUSTRIES_BY_ID: Record<IndustryId, IndustryConfig> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.id, i])
) as Record<IndustryId, IndustryConfig>

export function industryName(id: IndustryId): string {
  return INDUSTRIES_BY_ID[id]?.name ?? 'Home services'
}
