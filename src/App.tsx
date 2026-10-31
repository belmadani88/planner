import { useEffect, useMemo, useState } from 'react'
import type { Answers, PartialAnswers } from './types/answers'
import type { Blueprint } from './types/blueprint'
import { buildDeterministicBlueprint } from './engine'
import { DEMO_SCENARIOS_BY_ID } from './data/demoScenarios'
import { generateBlueprint } from './lib/api'
import { loadAnswers, saveAnswers, clearAll } from './lib/storage'
import { Landing } from './components/Landing'
import { Quiz } from './components/quiz/Quiz'
import { BlueprintView } from './components/report/BlueprintView'

type View = 'landing' | 'quiz' | 'analyzing' | 'blueprint'

export default function App() {
  const [view, setView] = useState<View>('landing')
  const [answers, setAnswers] = useState<PartialAnswers | null>(null)
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null)
  const [resumeAvailable, setResumeAvailable] = useState(false)

  /* Restore a saved session on load. */
  useEffect(() => {
    const saved = loadAnswers()
    if (saved && Object.keys(saved).length > 0) {
      setAnswers(saved)
      setResumeAvailable(true)
    }
    // Dev-only demo mode: ?demo=<scenario-id> instantly shows a blueprint.
    const demoId = new URLSearchParams(window.location.search).get('demo')
    if (demoId && DEMO_SCENARIOS_BY_ID[demoId]) {
      const demo = DEMO_SCENARIOS_BY_ID[demoId]
      setAnswers(demo.answers)
      setBlueprint(buildDeterministicBlueprint(demo.answers))
      setView('blueprint')
    }
  }, [])

  const persist = (a: PartialAnswers) => {
    setAnswers(a)
    saveAnswers(a)
  }

  const startQuiz = (fresh: boolean) => {
    if (fresh) {
      clearAll()
      setAnswers(null)
    }
    setView('quiz')
  }

  const runGeneration = async (finalAnswers: Answers) => {
    setView('analyzing')
    persist(finalAnswers)
    const outcome = await generateBlueprint(finalAnswers)
    // Small delay so the staged status feels deliberate (the work is real).
    await new Promise((r) => setTimeout(r, 900))
    setBlueprint(outcome.blueprint)
    setView('blueprint')
    window.scrollTo(0, 0)
  }

  const restart = () => {
    clearAll()
    setAnswers(null)
    setBlueprint(null)
    setResumeAvailable(false)
    setView('landing')
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {view === 'landing' && (
          <Landing
            onStart={() => startQuiz(false)}
            resumeAvailable={resumeAvailable && !!answers}
            onResume={() => setView('quiz')}
          />
        )}
        {view === 'quiz' && (
          <Quiz
            initialAnswers={answers ?? {}}
            onSave={persist}
            onComplete={runGeneration}
            onExit={restart}
          />
        )}
        {view === 'analyzing' && <Analyzing />}
        {view === 'blueprint' && blueprint && (
          <BlueprintView blueprint={blueprint} answers={answers as Answers} onRestart={restart} />
        )}
      </main>
      <Footer />
    </div>
  )
}

function Analyzing() {
  const [step, setStep] = useState(0)
  const steps = useMemo(
    () => [
      'Reading your answers',
      'Assessing all 11 stages of your operation',
      'Matching software to your situation',
      'Calculating your scenarios',
      'Assembling your blueprint'
    ],
    []
  )
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 520)
    return () => clearInterval(t)
  }, [steps.length])
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-8">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
      <h1 className="text-xl font-bold text-brand-900">Building your operations blueprint…</h1>
      <p className="mt-2 text-sm text-ink/60">This takes a few seconds. Everything stays on this page.</p>
      <ol className="mt-8 w-full space-y-2.5 text-left">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
              i < step
                ? 'border-brand-200 bg-brand-50 text-brand-800'
                : i === step
                  ? 'border-brand-300 bg-white text-brand-900 shadow-card'
                  : 'border-mist bg-white/50 text-ink/40'
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-100 text-brand-700' : 'bg-mist text-ink/40'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Footer() {
  return (
    <footer className="no-print border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-ink/50 sm:flex-row sm:items-center">
        <p>
          WebThangs Business Operations Planner — a free resource for home-services businesses.
          Answers stay in your browser; nothing is submitted unless you ask for a consultation.
        </p>
        <p className="shrink-0">Blueprints are informational — not financial advice or guaranteed results.</p>
      </div>
    </footer>
  )
}
