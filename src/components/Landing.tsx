import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Droplets,
  FileDown,
  GitBranch,
  Hammer,
  HeartHandshake,
  Home,
  Leaf,
  PhoneCall,
  Printer,
  ShieldCheck,
  Wind,
  Workflow,
  Wrench,
  Zap
} from 'lucide-react'
import { INDUSTRIES } from '../data/industries'
import { STAGES } from '../data/stages'
import { Logo } from './ui'

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wind: Wind,
  wrench: Wrench,
  home: Home,
  zap: Zap,
  droplets: Droplets,
  hammer: Hammer,
  leaf: Leaf
}

export function Landing({
  onStart,
  onResume,
  resumeAvailable
}: {
  onStart: () => void
  onResume: () => void
  resumeAvailable: boolean
}) {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-brand-950 text-white">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-8">
          <div className="flex items-center justify-between">
            <Logo light />
            <span className="hidden rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-brand-200 sm:block">
              Free · No account · No card
            </span>
          </div>

          <div className="mt-16 max-w-3xl animate-fade-up md:mt-20">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-300">
              For home-services businesses
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight md:text-[54px]">
              See how your business <span className="text-brand-300">should run</span> — in one afternoon read.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              Answer simple questions about your company. Get a personalized business operations blueprint:
              your customer journey from first call to paid invoice, where software should do the busywork,
              where AI genuinely helps, and what to fix first. In plain language — no jargon, no signup.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button onClick={onStart} className="btn-primary !bg-brand-400 !text-brand-950 hover:!bg-brand-300 !px-7 !py-3.5 !text-base">
                Start my free blueprint <ArrowRight className="h-4 w-4" />
              </button>
              {resumeAvailable && (
                <button
                  onClick={onResume}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/90 transition hover:border-white/40"
                >
                  Continue where I left off
                </button>
              )}
            </div>
            <p className="mt-4 text-xs text-white/40">
              Takes about 6 minutes · Your answers stay in your browser · Nothing is submitted without your permission
            </p>
          </div>
        </div>

        {/* 11-stage strip */}
        <div className="relative border-t border-white/10">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-brand-950 to-transparent" />
          <div className="mx-auto max-w-6xl overflow-x-auto px-6 py-6 nice-scroll">
            <div className="flex min-w-max items-center gap-2 text-[11px] font-medium text-brand-200/80">
              {STAGES.map((s, i) => (
                <span key={s.id} className="flex items-center gap-2">
                  <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    {s.id}. {s.shortName}
                  </span>
                  {i < STAGES.length - 1 && <span className="text-white/20">→</span>}
                </span>
              ))}
              <span className="ml-1 whitespace-nowrap text-white/30">← scroll</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
            From a few honest answers to your whole operating picture
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: ClipboardList,
              title: '1 · Answer simple questions',
              body: '“How fast do you reply? Who books jobs? What software do you already use?” Ranges and “I don’t know” are fine — honesty beats precision.'
            },
            {
              icon: Workflow,
              title: '2 · Get your operations blueprint',
              body: 'A personalized report: how your business runs today, where it leaks, how it should work — every step labeled human, automation or AI.'
            },
            {
              icon: BarChart3,
              title: '3 · Know exactly what to do first',
              body: 'A phased 90-day roadmap with dependencies, software that fits (keeping what you already pay for), and honest scenarios — no fake promises.'
            }
          ].map((s) => (
            <div key={s.title} className="card p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-brand-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What's inside ────────────────────────────────────────────────── */}
      <section className="border-y border-brand-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow">What’s inside the blueprint</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
                Twelve sections that make your business make sense
              </h2>
              <p className="mt-4 leading-relaxed text-ink/70">
                Most owners know something is slow or leaky but can’t see where. The blueprint shows the whole
                customer-to-cash journey with your situation mapped onto it — then tells you exactly which pieces
                should be done by people, which by software, and which AI can genuinely help with.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Your profile and how your answers classify your operation',
                  'An honest assessment of all 11 stages — strengths included',
                  'An interactive diagram of how your systems should connect',
                  'Every automation explained: trigger, data flow, failure mode, who approves',
                  'Software picks that respect what you already pay for',
                  'Financial scenarios with every assumption on the table'
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-ink/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 self-start">
              {[
                { icon: PhoneCall, t: 'Never lose a missed call', d: 'Instant text-back + same-day call-back list' },
                { icon: CalendarCheck, t: 'One calendar runs the crews', d: 'Dispatch, capacity and arrival promises' },
                { icon: GitBranch, t: 'Follow-up that never forgets', d: 'Day-2 / day-7 nudges on every open quote' },
                { icon: Bot, t: 'AI where it truly helps', d: 'Sorting inquiries, drafting paperwork — human-approved' },
                { icon: FileDown, t: 'Print & save your plan', d: 'PDF-ready report and offline HTML copy' },
                { icon: ShieldCheck, t: 'Honest by design', d: 'Assumptions labeled, no invented benchmarks' }
              ].map((f) => (
                <div key={f.t} className="card p-4">
                  <f.icon className="h-5 w-5 text-brand-600" />
                  <p className="mt-2.5 text-sm font-semibold text-brand-900">{f.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/60">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Industries ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Built for your trade</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-900">
            One operating backbone, tuned per trade
          </h2>
          <p className="mt-3 text-ink/70">
            Emergency-heavy plumbing and long-cycle roofing don’t run the same way — the blueprint adapts to how your
            trade actually works.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {INDUSTRIES.map((ind) => {
            const Icon = INDUSTRY_ICONS[ind.icon]
            return (
              <div key={ind.id} className="card flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-brand-900">{ind.name}</p>
                  <p className="truncate text-[11px] text-ink/50">{ind.tagline}</p>
                </div>
              </div>
            )
          })}
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-brand-200 p-4 text-ink/50">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <p className="text-xs leading-snug">Another home-services trade? It mostly applies too.</p>
          </div>
        </div>
      </section>

      {/* ── Honest-tool note + CTA ───────────────────────────────────────── */}
      <section className="bg-brand-950 text-white">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <Printer className="mx-auto h-8 w-8 text-brand-300" />
          <h2 className="mt-5 text-3xl font-bold tracking-tight">
            A genuinely useful plan, free, whether or not you ever talk to us.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/60">
            This is not a lead trap. The full blueprint — assessment, diagram, workflows, roadmap and scenarios — is
            yours to read, print and act on independently. If you want help implementing it, that’s what WebThangs does.
          </p>
          <button
            onClick={onStart}
            className="btn-primary !bg-brand-400 !text-brand-950 hover:!bg-brand-300 mt-8 !px-8 !py-3.5 !text-base"
          >
            Start my free blueprint <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-xs text-white/40">6 minutes · no account · your answers stay in your browser</p>
        </div>
      </section>
    </div>
  )
}
