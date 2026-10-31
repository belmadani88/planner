/**
 * Answer-to-label helpers: turn option ids into the plain-language labels the
 * owner actually selected, so every evidence line in the blueprint quotes
 * their own words back to them.
 */

import { QUESTIONS, resolveOptions } from '../data/questions'
import type { Answers } from '../types/answers'

const labelCache = new Map<string, Map<string, string>>()

function optionLabels(questionId: string, answers: Answers): Map<string, string> {
  const q = QUESTIONS.find((x) => x.id === questionId)
  if (!q) return new Map()
  const m = new Map<string, string>()
  if (typeof q.options === 'function') {
    // Union across industries so any answer resolves.
    for (const ind of ['hvac', 'plumbing', 'roofing', 'electrical', 'restoration', 'remodeling', 'landscaping'] as const) {
      for (const o of resolveOptions(q, { industry: ind })) m.set(o.value, o.label)
    }
  } else {
    for (const o of q.options) m.set(o.value, o.label)
  }
  return m
}

export function labelOf(questionId: keyof Answers, answers: Answers): string | null {
  const key = questionId as string
  const value = answers[questionId]
  if (!labelCache.has(key)) labelCache.set(key, optionLabels(key, answers))
  const labels = labelCache.get(key)!
  if (Array.isArray(value)) {
    const parts = value.map((v) => labels.get(v) ?? v)
    return parts.length ? joinList(parts) : null
  }
  if (value === undefined || value === '') return null
  return labels.get(value as string) ?? (value as string)
}

export function joinList(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function answerIs(questionId: keyof Answers, answers: Answers, ...values: string[]): boolean {
  const v = answers[questionId]
  if (Array.isArray(v)) return v.some((x) => values.includes(x))
  return values.includes(v as string)
}

export function answerIn(questionId: keyof Answers, answers: Answers, values: string[]): boolean {
  return answerIs(questionId, answers, ...values)
}
