/**
 * Server-side validation for questionnaire answers.
 *
 * Values are checked against the actual question bank, so the API can never
 * receive an answer the engine doesn't understand. Derived programmatically
 * from data/questions.ts — single source of truth.
 */

import { z } from 'zod'
import { QUESTIONS, resolveOptions } from '../data/questions'
import type { PartialAnswers } from '../types/answers'

const industryEnum = z.enum([
  'hvac',
  'plumbing',
  'roofing',
  'electrical',
  'restoration',
  'remodeling',
  'landscaping'
])

const goalEnum = z.enum([
  'more-leads',
  'respond-faster',
  'fewer-missed-calls',
  'convert-more',
  'less-admin',
  'better-scheduling',
  'profitable-jobs',
  'better-payments',
  'retention',
  'visibility',
  'reduce-fragmentation'
])

/** Every option value a question can legally accept (union across conditions). */
function allowedValues(questionId: string): string[] {
  const q = QUESTIONS.find((x) => x.id === questionId)
  if (!q) return []
  const sample: PartialAnswers = { industry: 'hvac' }
  const opts = resolveOptions(q, sample)
  // For industry-conditional option sets, union all industries.
  const all = new Set<string>(opts.map((o) => o.value))
  if (typeof q.options === 'function') {
    for (const ind of industryEnum.options) {
      for (const o of resolveOptions(q, { industry: ind })) all.add(o.value)
    }
  }
  return [...all]
}

function singleField(questionId: string): z.ZodTypeAny {
  const allowed = allowedValues(questionId)
  if (allowed.length === 0) return z.string().max(64)
  return z.string().max(64).refine((v) => allowed.includes(v), {
    message: `Invalid value for ${questionId}`
  })
}

function multiField(questionId: string): z.ZodTypeAny {
  const allowed = allowedValues(questionId)
  return z
    .array(z.string().max(64))
    .max(30)
    .refine((arr) => arr.every((v) => allowed.includes(v)), {
      message: `Invalid value in ${questionId}`
    })
}

const AnswersShape: Record<string, z.ZodTypeAny> = {}
for (const q of QUESTIONS) {
  const base = q.type === 'multi' ? multiField(q.id) : singleField(q.id)
  // Questions hidden behind conditions may legitimately be absent
  // (e.g. missedCallsReturned is never asked when almost no calls are missed).
  AnswersShape[q.id] = q.showIf ? base.optional() : base
}

export const AnswersSchema = z
  .object(AnswersShape)
  .strict()
  .extend({
    // The industry answer is enforced strictly; other singles keep their
    // refine() checks above.
    industry: industryEnum,
    goals: z.array(goalEnum).min(1).max(11),
    businessName: z.string().max(80).optional()
  })

/** Required-answer completeness check (visible questions must be answered). */
export function checkCompleteness(a: PartialAnswers): string[] {
  const missing: string[] = []
  for (const q of QUESTIONS) {
    const v = (a as Record<string, unknown>)[q.id]
    const emptySingle = q.type === 'single' && (v === undefined || v === '')
    const emptyMulti = q.type === 'multi' && (!Array.isArray(v) || v.length === 0)
    const hidden = q.showIf ? !q.showIf(a) : false
    if ((emptySingle || emptyMulti) && !hidden) missing.push(q.id)
  }
  return missing
}
