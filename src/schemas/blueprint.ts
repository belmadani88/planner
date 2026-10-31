/**
 * Validation schemas.
 *
 * 1) PersonalizationSchema — validates EVERY Gemini response before it can be
 *    merged into a blueprint. Text-only, length-capped, stage ids checked,
 *    and screened against the software knowledge base so the AI cannot invent
 *    product claims.
 *
 * 2) BlueprintSchema — structural validation of the full blueprint, used in
 *    tests to guarantee the deterministic engine always emits a valid document.
 */

import { z } from 'zod'
import { STAGES } from '../data/stages'
import { SOFTWARE } from '../data/software'

const stageIds = STAGES.map((s) => s.id)

/* ── 1. AI personalization layer ────────────────────────────────────────── */

const cleanText = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .transform((s) =>
      // Light sanitation: strip markdown emphasis/headers and trim whitespace.
      s
        .replace(/[*_#`>]+/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )

export const StageInsightSchema = z.object({
  stageId: z.number().int().min(1).max(11),
  insight: cleanText(600),
  tip: cleanText(300)
})

export const PersonalizationSchema = z.object({
  executiveSummary: cleanText(1800),
  stageInsights: z.array(StageInsightSchema).min(1).max(11),
  contextualNotes: z.array(cleanText(400)).min(1).max(6),
  roadmapNarrative: cleanText(2200),
  improvementNarrative: cleanText(1800),
  consultationMessage: cleanText(600)
})

export type PersonalizationPayload = z.infer<typeof PersonalizationSchema>

/**
 * Screen AI text for unsupported software claims. Any product-like name that
 * is NOT in the knowledge base (or a small allow-list of category words)
 * fails validation → the server falls back to the deterministic blueprint.
 */
const ALLOWED_SOFTWARE_TERMS = new Set<string>([
  ...SOFTWARE.map((s) => s.name.toLowerCase()),
  // Short forms and user-tool names that appear in the questionnaire options.
  'quickbooks',
  'ga4',
  'google analytics',
  'google tag manager',
  'local services ads',
  'gmail',
  'outlook',
  'google calendar',
  'excel',
  'google sheets',
  'zapier',
  'make',
  'n8n',
  'mailchimp',
  'calendly',
  'angi',
  'thumbtack',
  'homeadvisor',
  'openphone',
  'grasshopper',
  'google voice',
  'crm',
  'ai',
  'app',
  'software',
  'system',
  'website',
  'voip'
])

const PRODUCT_NAME_PATTERN =
  /\b(Jobber|Housecall Pro|ServiceTitan|GoHighLevel|HubSpot|QuickBooks|Xero|WordPress|WooCommerce|Zapier|Make|n8n|Mailchimp|Calendly|Salesforce|Zoho|Airtable|Slack|Twilio|OpenPhone|Grasshopper|Angi|Thumbtack|HomeAdvisor|Yelp|ChatGPT|Claude)\b/g

export function screenForUnsupportedSoftware(text: string): string | null {
  const matches = text.match(PRODUCT_NAME_PATTERN)
  if (!matches) return null
  for (const m of matches) {
    if (!ALLOWED_SOFTWARE_TERMS.has(m.toLowerCase())) return m
  }
  return null
}

/* ── 2. Blueprint structure (for engine self-tests) ─────────────────────── */

const MaturityEnum = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.null()])

export const BlueprintSchema = z.object({
  meta: z.object({
    generatedAt: z.string(),
    engineVersion: z.string(),
    industry: z.enum([
      'hvac',
      'plumbing',
      'roofing',
      'electrical',
      'restoration',
      'remodeling',
      'landscaping'
    ]),
    aiPersonalized: z.boolean()
  }),
  profile: z.object({
    headline: z.string().min(1),
    summary: z.string().min(1),
    characteristics: z.array(z.string()).min(1),
    classification: z.object({
      sizeTier: z.enum(['micro', 'small', 'medium', 'larger']),
      volumeTier: z.enum(['low', 'moderate', 'high', 'unknown']),
      techMaturity: z.enum(['manual', 'basic', 'digitized', 'integrated']),
      operationalPattern: z.enum(['owner-led', 'delegated', 'team-based']),
      demandPressure: z.enum([
        'under-utilized',
        'balanced',
        'at-capacity',
        'over-capacity',
        'unknown'
      ])
    }).passthrough(),
    goals: z.array(z.string()).min(1)
  }),
  currentSituation: z.object({
    confirmed: z.array(z.string()),
    assumed: z.array(z.string())
  }),
  assessment: z.object({
    stages: z.array(
      z.object({
        stageId: z.number().int().refine((n) => stageIds.includes(n)),
        maturity: MaturityEnum,
        evidence: z.array(z.string())
      }).passthrough()
    ).length(11),
    findings: z.array(
      z.object({
        id: z.string(),
        severity: z.enum(['high', 'medium', 'low', 'positive']),
        title: z.string(),
        relatedStages: z.array(z.number())
      }).passthrough()
    )
  }),
  operatingModel: z.object({
    stages: z.array(
      z.object({
        stageId: z.number().int(),
        recommendedFlow: z.array(z.object({ actor: z.string(), action: z.string() }))
      }).passthrough()
    ).length(11)
  }),
  workflows: z.array(
    z.object({
      id: z.string(),
      stageId: z.number().int(),
      kind: z.enum(['automation', 'ai', 'human', 'human-ai']),
      mode: z.enum(['adopt', 'verify', 'keep']),
      priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      whatHappens: z.string().min(1),
      trigger: z.string().min(1),
      failureMode: z.string().min(1)
    }).passthrough()
  ),
  software: z.object({
    stack: z.array(
      z.object({
        softwareId: z.string(),
        name: z.string(),
        status: z.enum(['keep', 'adopt', 'verify', 'optional']),
        essential: z.boolean()
      }).passthrough()
    ).min(1),
    integrations: z.array(z.object({}).passthrough()),
    principles: z.array(z.string())
  }),
  roadmap: z.object({
    phases: z.array(z.object({ phase: z.union([z.literal(1), z.literal(2), z.literal(3)]) }).passthrough()),
    items: z.array(
      z.object({
        seq: z.number().int(),
        phase: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        title: z.string(),
        dependsOn: z.array(z.string())
      }).passthrough()
    ).min(1)
  }),
  financials: z.object({
    inputs: z.object({
      monthlyInquiries: z.number().nullable(),
      monthlyAdSpend: z.number().nullable(),
      annualRevenue: z.number().nullable(),
      missedCallRate: z.number().nullable(),
      inputsAreMidpoints: z.boolean()
    }),
    measured: z.array(z.object({}).passthrough()),
    estimates: z.array(z.object({}).passthrough()),
    modeled: z.array(z.object({}).passthrough()),
    assumptions: z.array(z.string()),
    disclaimer: z.string().min(1)
  }),
  diagram: z.object({
    nodes: z.array(z.object({ id: z.string(), kind: z.string() }).passthrough()).min(5),
    edges: z.array(z.object({ source: z.string(), target: z.string() }).passthrough()).min(4)
  }),
  improvements: z.array(z.object({ title: z.string() }).passthrough()).min(1),
  implementationPlan: z.array(z.object({ seq: z.number(), title: z.string() }).passthrough()).min(1),
  consultation: z.object({
    headline: z.string().min(1),
    body: z.string().min(1),
    ctaText: z.string().min(1),
    bullets: z.array(z.string())
  })
})

export type BlueprintValidation = z.infer<typeof BlueprintSchema>
