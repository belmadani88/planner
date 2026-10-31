import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, HelpCircle, RotateCcw } from 'lucide-react'
import type { AnswerKey, Answers, PartialAnswers } from '../../types/answers'
import {
  QUESTIONS,
  SECTION_META,
  resolveOptions,
  visibleQuestions,
  type QuestionDef,
  type QuestionOption
} from '../../data/questions'
import { checkCompleteness } from '../../schemas/answers'
import { Logo } from '../ui'

interface QuizProps {
  initialAnswers: PartialAnswers
  onSave: (a: PartialAnswers) => void
  onComplete: (a: Answers) => void
  onExit: () => void
}

export function Quiz({ initialAnswers, onSave, onComplete, onExit }: QuizProps) {
  const [answers, setAnswers] = useState<PartialAnswers>(initialAnswers)
  const [index, setIndex] = useState<number>(() => {
    // Resume at the first unanswered visible question.
    const visible = visibleQuestions(initialAnswers)
    const firstEmpty = visible.findIndex((q) => {
      const v = (initialAnswers as Record<string, unknown>)[q.id]
      return q.type === 'multi' ? !Array.isArray(v) || v.length === 0 : v === undefined || v === ''
    })
    return firstEmpty === -1 ? Math.max(0, visible.length - 1) : firstEmpty
  })
  const [direction, setDirection] = useState(1)

  const visible = useMemo(() => visibleQuestions(answers), [answers])
  const q: QuestionDef | undefined = visible[index]
  const total = visible.length
  const progress = Math.round((index / Math.max(1, total - 1)) * 100)
  const section = q ? SECTION_META[q.section] : null

  if (!q) {
    /* All answered (shouldn't normally happen — final question triggers completion). */
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <button className="btn-primary" onClick={() => onFinish()}>
          Build my blueprint
        </button>
      </div>
    )
  }

  function update(id: AnswerKey, value: string | string[]) {
    const next = { ...answers, [id]: value } as PartialAnswers
    // Clear the conditional follow-up when its trigger changes.
    if (id === 'missedCalls' && value === 'almost-none') delete (next as Record<string, unknown>).missedCallsReturned
    setAnswers(next)
    onSave(next)
  }

  function toggleMulti(id: AnswerKey, value: string, minSelect = 0) {
    const current = (answers[id] as string[] | undefined) ?? []
    let next: string[]
    if (current.includes(value)) {
      if (current.length <= minSelect) return // keep minimum selections
      next = current.filter((v) => v !== value)
    } else {
      next = [...current, value]
    }
    update(id, next)
  }

  function isAnswered(question: QuestionDef): boolean {
    const v = (answers as Record<string, unknown>)[question.id]
    return question.type === 'multi' ? Array.isArray(v) && v.length > 0 : typeof v === 'string' && v.length > 0
  }

  function next() {
    if (index >= visible.length - 1) {
      onFinish()
    } else {
      setDirection(1)
      setIndex(index + 1)
      window.scrollTo({ top: 0 })
    }
  }

  function back() {
    if (index === 0) {
      onExit()
      return
    }
    setDirection(-1)
    setIndex(index - 1)
    window.scrollTo({ top: 0 })
  }

  function onFinish() {
    const missing = checkCompleteness(answers)
    if (missing.length > 0) {
      // Jump to the first missing question instead of failing silently.
      const target = visible.findIndex((x) => x.id === missing[0])
      if (target >= 0) {
        setIndex(target)
        window.scrollTo({ top: 0 })
      }
      return
    }
    onComplete(answers as Answers)
  }

  const options: QuestionOption[] = resolveOptions(q, answers)
  const currentSingle = answers[q.id] as string | undefined
  const currentMulti = (answers[q.id] as string[] | undefined) ?? []
  const answered = isAnswered(q)
  const minSelect = q.minSelect ?? 0

  return (
    <div className="min-h-screen bg-paper">
      {/* Sticky header: progress */}
      <div className="no-print sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 pb-3.5 pt-4">
          <div className="flex items-center justify-between">
            <Logo />
            <button onClick={onExit} className="btn-ghost !text-xs">
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100">
              <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${Math.max(3, progress)}%` }} />
            </div>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink/40">
              {index + 1} / {total}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Section context */}
        {section && (
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-1">
            <div>
              <p className="eyebrow">
                Part {q.section} of F — {section.title}
              </p>
              <p className="mt-1 text-sm text-ink/50">{section.subtitle}</p>
            </div>
            <p className="text-[11px] text-ink/35">{section.minutes}</p>
          </div>
        )}

        {/* Question card */}
        <div key={q.id} className="card animate-fade-up p-6 sm:p-8">
          <h1 className="text-xl font-bold leading-snug text-brand-900 sm:text-2xl">{q.prompt}</h1>

          {q.why && (
            <div className="mt-4 flex gap-2.5 rounded-xl bg-brand-50 px-4 py-3 text-[13px] leading-relaxed text-brand-900/80">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <p>
                <span className="font-semibold">Why we ask:</span> {q.why}
              </p>
            </div>
          )}

          <div
            className={`mt-6 grid gap-2.5 ${
              options.length > 6 || options.some((o) => (o.label?.length ?? 0) > 28)
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-1'
            } ${q.type === 'multi' && options.length >= 6 ? 'sm:grid-cols-2' : ''}`}
          >
            {options.map((o) => {
              const selected =
                q.type === 'multi' ? currentMulti.includes(o.value) : currentSingle === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() =>
                    q.type === 'multi'
                      ? toggleMulti(q.id, o.value, minSelect)
                      : (update(q.id, o.value), setTimeout(next, 180))
                  }
                  aria-pressed={selected}
                  className={`group flex min-h-[52px] items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    selected
                      ? 'border-brand-500 bg-brand-50 shadow-card'
                      : 'border-mist bg-white hover:border-brand-300 hover:bg-brand-50/40'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all ${
                      q.type === 'multi' ? 'rounded-md' : 'rounded-full'
                    } ${selected ? 'border-brand-600 bg-brand-600' : 'border-brand-200 bg-white group-hover:border-brand-400'}`}
                  >
                    {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold ${selected ? 'text-brand-900' : 'text-ink/80'}`}>
                      {o.label}
                    </span>
                    {o.hint && <span className="mt-0.5 block text-xs text-ink/45">{o.hint}</span>}
                  </span>
                </button>
              )
            })}
          </div>

          {q.type === 'multi' && (
            <p className="mt-4 text-xs text-ink/40">
              Choose all that apply{minSelect > 0 ? ` — at least ${minSelect}` : ''}.
              {currentMulti.length > 0 && ` Selected: ${currentMulti.length}.`}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={back} className="btn-secondary">
            <ArrowLeft className="h-4 w-4" /> {index === 0 ? 'Exit' : 'Back'}
          </button>
          <div className="flex items-center gap-3">
            {index === visible.length - 1 ? (
              <button onClick={onFinish} disabled={!answered} className="btn-primary">
                Build my blueprint <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={next} disabled={!answered} className="btn-primary">
                Next <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-ink/35">
          Your answers are saved in this browser only — you can close the tab and continue later.
        </p>
      </div>
    </div>
  )
}
