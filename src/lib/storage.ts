/** Local persistence: answers survive a refresh; nothing leaves the device. */

import type { Answers } from '../types/answers'

const ANSWERS_KEY = 'wt-answers-v1'
const QUIZ_STEP_KEY = 'wt-quiz-step-v1'

export function saveAnswers(a: Answers | Partial<Answers>): void {
  try {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(a))
  } catch {
    /* private mode / storage full — non-fatal */
  }
}

export function loadAnswers(): Partial<Answers> | null {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) return parsed as Partial<Answers>
    return null
  } catch {
    return null
  }
}

export function saveStep(step: number): void {
  try {
    localStorage.setItem(QUIZ_STEP_KEY, String(step))
  } catch {
    /* non-fatal */
  }
}

export function loadStep(): number | null {
  try {
    const raw = localStorage.getItem(QUIZ_STEP_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

export function clearAll(): void {
  try {
    localStorage.removeItem(ANSWERS_KEY)
    localStorage.removeItem(QUIZ_STEP_KEY)
  } catch {
    /* non-fatal */
  }
}
