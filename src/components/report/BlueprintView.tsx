/**
 * The Business Operations Blueprint — the main product output.
 * Sections 1–12 exactly as specified, print-friendly, exportable.
 */

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Building2,
  CheckCircle2,
  Download,
  FileJson,
  Printer,
  RotateCcw,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Zap
} from 'lucide-react'
import type { Answers } from '../../types/answers'
import type {
  Blueprint,
  FinancialRow,
  Finding,
  RoadmapItem,
  SoftwareRecommendation,
  StageAssessment,
  StagePlan,
  WorkflowRecommendation
} from '../../types/blueprint'
import { STAGES_BY_ID } from '../../data/stages'
import { ActorChip, ACTOR_STYLE, Callout, Logo, MaturityMeter, ModeBadge, SectionTitle, SeverityChip } from '../ui'
import { FlowDiagram } from './FlowDiagram'
import { ConsultationForm } from '../ConsultationForm'
import { downloadBlueprintHtml, downloadBlueprintJson } from '../../lib/exportHtml'

const NAV = [
  ['#profile', '1 · Profile'],
  ['#current', '2 · Today'],
  ['#assessment', '3 · Assessment'],
  ['#model', '4 · Operating model'],
  ['#diagram', '5 · System diagram'],
  ['#workflows', '6 · AI & automation'],
  ['#software', '7 · Software'],
  ['#roadmap', '8 · Roadmap'],
  ['#improvements', '9 · Improvements'],
  ['#financials', '10 · Scenarios'],
  ['#plan', '11 · Setup plan'],
  ['#consultation', '12 · Next step']
]

export function BlueprintView({
  blueprint,
  answers,
  onRestart
}: {
  blueprint: Blueprint
  answers: Answers
  onRestart: () => void
}) {
  const bp = blueprint
  const p = bp.personalization
  const aiNotice = bp.meta.notice

  return (
    <div className="bg-paper pb-24">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="no-print sticky top-0 z-40 border-b border-brand-100 bg-white/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="min-w-0">
            <Logo />
            <p className="mt-1 truncate text-xs text-ink/50">
              {bp.meta.businessName ? `${bp.meta.businessName} · ` : ''}
              {bp.profile.classification.sizeLabel} · generated {new Date(bp.meta.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => window.print()} className="btn-secondary !py-2">
              <Printer className="h-4 w-4" /> Print / PDF
            </button>
            <button onClick={() => downloadBlueprintHtml(bp)} className="btn-secondary !py-2">
              <Download className="h-4 w-4" /> Save HTML
            </button>
            <button onClick={() => downloadBlueprintJson(bp)} className="btn-secondary !py-2" title="Download raw blueprint data">
              <FileJson className="h-4 w-4" /> JSON
            </button>
            <button onClick={onRestart} className="btn-ghost">
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="mt-10 animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">Business Operations Blueprint</span>
            {bp.meta.aiPersonalized ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                <Sparkles className="h-3.5 w-3.5" /> Personalized with {bp.meta.aiModel}
              </span>
            ) : (
              <span className="chip !bg-white">Standard edition</span>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-brand-900 md:text-4xl">
            {bp.meta.businessName ? `${bp.meta.businessName}: ` : ''}
            how your business should run
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-ink/50">
            {bp.profile.headline} · Engine v{bp.meta.engineVersion}
          </p>
        </header>

        {aiNotice && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{aiNotice.message}</p>
          </div>
        )}

        {/* Executive summary */}
        <div className="card mt-6 border-l-4 !border-l-brand-600 p-6 sm:p-8">
          <p className="eyebrow">Executive summary</p>
          <p className="mt-3 text-lg leading-relaxed text-ink/85">
            {p?.executiveSummary ?? bp.profile.summary}
          </p>
          {p && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {p.contextualNotes.slice(0, 4).map((n, i) => (
                <div key={i} className="rounded-xl bg-paper px-4 py-3 text-sm leading-relaxed text-ink/70">
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile nav */}
        <nav className="no-print mt-8 flex gap-2 overflow-x-auto rounded-xl border border-brand-100 bg-white p-2 nice-scroll lg:hidden">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-ink/60 hover:bg-brand-50 hover:text-brand-800">
              {label}
            </a>
          ))}
        </nav>

        <div className="mt-10 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Desktop side nav */}
          <nav className="no-print sticky top-32 hidden h-fit flex-col gap-0.5 self-start lg:flex">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-ink/55 transition hover:bg-brand-50 hover:text-brand-800">
                {label}
              </a>
            ))}
          </nav>

          <div className="min-w-0 space-y-16">
            {/* ── 1 · Profile ──────────────────────────────────────────── */}
            <section id="profile" className="scroll-mt-32">
              <SectionTitle n={1} title="Your business profile" lead="What your answers tell us about the shape of your operation." />
              <div className="card p-6">
                <p className="leading-relaxed text-ink/80">{bp.profile.summary}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {bp.profile.characteristics.map((c) => (
                    <div key={c} className="flex items-start gap-2.5 rounded-xl bg-paper px-4 py-3 text-sm text-ink/75">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                      {c}
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {bp.profile.goals.map((g) => (
                    <span key={g} className="chip">Goal: {g.replace(/-/g, ' ')}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 2 · Current situation ────────────────────────────────── */}
            <section id="current" className="scroll-mt-32">
              <SectionTitle
                n={2}
                title="Your current situation"
                lead="We separate what you told us from what we assumed. Nothing in this blueprint pretends to know more than your answers said."
              />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="card p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-brand-700">Confirmed by your answers</h3>
                  <ul className="mt-3 space-y-2.5">
                    {bp.currentSituation.confirmed.map((c, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/75">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card border-dashed p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-amber-700">Assumptions we made</h3>
                  <ul className="mt-3 space-y-2.5">
                    {bp.currentSituation.assumed.map((c, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/70">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* ── 3 · Assessment ───────────────────────────────────────── */}
            <section id="assessment" className="scroll-mt-32">
              <SectionTitle
                n={3}
                title="Operational assessment"
                lead="All 11 stages of a home-services operation, scored from your answers — strengths included, problems never invented."
              />
              <div className="card divide-y divide-brand-50">
                {bp.assessment.stages.map((s: StageAssessment) => (
                  <div key={s.stageId} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-ink/35">STAGE {s.stageId}</p>
                        <h3 className="mt-0.5 font-bold text-brand-900">{s.stageName}</h3>
                      </div>
                      <MaturityMeter value={s.maturity} label={s.maturityLabel} />
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-ink/65">{s.currentState}</p>
                    {s.strength && (
                      <p className="mt-2.5 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {s.strength}
                      </p>
                    )}
                    {s.gaps.length > 0 && (
                      <ul className="mt-2.5 space-y-1.5">
                        {s.gaps.map((g, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-ink/60">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {g}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="mt-8 text-lg font-bold text-brand-900">Key findings</h3>
              <p className="mt-1 text-sm text-ink/55">Each finding quotes the answer that produced it.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {bp.assessment.findings.map((f: Finding) => (
                  <div
                    key={f.id}
                    className={`card p-5 ${f.severity === 'positive' ? 'border-brand-200 bg-brand-50/40' : f.severity === 'high' ? 'border-rose-100' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold leading-snug text-brand-900">{f.title}</h4>
                      <SeverityChip severity={f.severity} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">{f.detail}</p>
                    <p className="mt-3 border-l-2 border-brand-200 pl-3 text-xs italic leading-relaxed text-ink/50">
                      {f.evidence}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-ink/40">
                      Stages: {f.relatedStages.map((s) => STAGES_BY_ID[s]?.shortName).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 4 · Operating model ──────────────────────────────────── */}
            <section id="model" className="scroll-mt-32">
              <SectionTitle
                n={4}
                title="Your recommended operating model"
                lead="The complete customer-to-cash journey, stage by stage — with each step labeled by who or what should do it."
              />
              <div className="mb-6 flex flex-wrap gap-3">
                {bp.operatingModel.actorLegend.map((l) => (
                  <div key={l.kind} className="flex items-center gap-2.5 rounded-xl border border-brand-100 bg-white px-3.5 py-2.5">
                    <ActorChip kind={l.kind} />
                    <p className="max-w-[260px] text-[11px] leading-tight text-ink/55">{l.hint}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-5">
                {bp.operatingModel.stages.map((s: StagePlan) => {
                  const insight = p?.stageInsights.find((x) => x.stageId === s.stageId)
                  return (
                    <div key={s.stageId} className="card p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-bold text-brand-900">
                          <span className="mr-2 text-ink/30">{s.stageId}</span>
                          {s.stageName}
                        </h3>
                        <p className="text-xs italic text-ink/45">{s.purpose}</p>
                      </div>
                      {s.industryNote && (
                        <p className="mt-3 rounded-lg bg-brand-50 px-3.5 py-2.5 text-xs leading-relaxed text-brand-900/80">
                          <span className="font-bold uppercase">{answers.industry}:</span> {s.industryNote}
                        </p>
                      )}
                      {insight && (
                        <p className="mt-3 text-sm leading-relaxed text-ink/70">
                          {insight.insight}
                          {insight.tip && <span className="text-ink/50"> — <em>{insight.tip}</em></span>}
                        </p>
                      )}
                      <ol className="mt-4 space-y-2.5">
                        {s.recommendedFlow.map((f, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-2.5">
                            <span className="w-5 shrink-0 text-right text-xs font-bold text-ink/25">{i + 1}</span>
                            <ActorChip kind={f.actor} />
                            <span className="min-w-0 flex-1 text-sm leading-snug text-ink/75">{f.action}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── 5 · Diagram ──────────────────────────────────────────── */}
            <section id="diagram" className="scroll-mt-32">
              <SectionTitle
                n={5}
                title="Your system architecture, drawn"
                lead="How customers, your team, automations, AI and software connect — from first contact to repeat business. Tap any step to learn what it is."
              />
              <FlowDiagram blueprint={bp} />
            </section>

            {/* ── 6 · Workflows ────────────────────────────────────────── */}
            <section id="workflows" className="scroll-mt-32">
              <SectionTitle
                n={6}
                title="Recommended AI, automation — and what stays human"
                lead="Every recommendation explains what happens, what triggers it, what your customer experiences, what your team does, what happens if it fails, and whether a human must approve. AI assists people here; it never replaces their judgment."
              />
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Building2, title: 'Software remembers', body: 'Keeps customer, job and money information in one place.' },
                  { icon: Zap, title: 'Automation repeats', body: 'Does predictable tasks identically every time, on a trigger.' },
                  { icon: Bot, title: 'AI interprets', body: 'Reads, summarizes, classifies and drafts — always under human review.' }
                ].map((x) => (
                  <div key={x.title} className="rounded-xl border border-brand-100 bg-white p-4">
                    <x.icon className="h-5 w-5 text-brand-600" />
                    <p className="mt-2 text-sm font-bold text-brand-900">{x.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/60">{x.body}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[...bp.workflows]
                  .sort((a, b) => a.priority - b.priority || a.stageId - b.stageId)
                  .map((w: WorkflowRecommendation) => (
                    <WorkflowCard key={w.id} w={w} />
                  ))}
              </div>
            </section>

            {/* ── 7 · Software ─────────────────────────────────────────── */}
            <section id="software" className="scroll-mt-32">
              <SectionTitle
                n={7}
                title="Recommended software"
                lead="Right-sized to your team, built around what you already pay for. Essential first; optional must earn its place."
              />
              <div className="space-y-4">
                {bp.software.stack.map((s: SoftwareRecommendation) => (
                  <div key={s.softwareId} className={`card p-6 ${s.essential ? '' : 'border-dashed'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-brand-900">{s.name}</h3>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              s.status === 'keep'
                                ? 'bg-mist text-ink/70'
                                : s.status === 'adopt'
                                  ? 'bg-brand-600 text-white'
                                  : s.status === 'verify'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-white border border-mist text-ink/50'
                            }`}
                          >
                            {s.status === 'keep' ? 'Keep using' : s.status === 'adopt' ? 'New — recommended' : s.status === 'verify' ? 'Verify what you own' : 'Optional'}
                          </span>
                          {s.essential ? (
                            <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-800">Essential</span>
                          ) : (
                            <span className="rounded-md border border-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/45">Optional</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-brand-600">{s.role}</p>
                      </div>
                      <div className="text-right">
                        {s.monthlyCostEstimate !== null ? (
                          <p className="text-sm font-bold text-brand-900">from ~${s.monthlyCostEstimate}/mo</p>
                        ) : (
                          <p className="text-sm font-bold text-ink/50">Custom pricing</p>
                        )}
                        <a href={s.website} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline">
                          Official site <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink/70">{s.why}</p>
                    <p className="mt-2.5 text-xs leading-relaxed text-ink/50"><span className="font-semibold">Pricing notes:</span> {s.costNote}</p>
                    {s.caveats && <p className="mt-1.5 text-xs leading-relaxed text-amber-800/80"><span className="font-semibold">Know this:</span> {s.caveats}</p>}
                    {s.verifiedIntegrations.length > 0 && (
                      <p className="mt-2 text-[11px] text-ink/45">Verified native integrations: {s.verifiedIntegrations.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="mt-8 text-lg font-bold text-brand-900">How your tools connect</h3>
              <div className="mt-3 space-y-2.5">
                {bp.software.integrations.map((i, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm">
                    <span className="font-semibold text-brand-900">{i.from} <span className="text-ink/30">↔</span> {i.to}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        i.status === 'verified' ? 'bg-brand-100 text-brand-800' : i.status === 'likely' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {i.status}
                    </span>
                    <span className="w-full text-xs leading-relaxed text-ink/55 sm:w-auto sm:flex-1">{i.note}</span>
                  </div>
                ))}
                {bp.software.integrations.length === 0 && (
                  <p className="text-sm text-ink/55">No integration claims to report — we only state connections we can verify.</p>
                )}
              </div>
              <Callout tone="info" title="Principles behind these picks">
                <ul className="mt-1 space-y-1">
                  {bp.software.principles.map((x) => (
                    <li key={x} className="text-[13px]">· {x}</li>
                  ))}
                </ul>
              </Callout>
            </section>

            {/* ── 8 · Roadmap ──────────────────────────────────────────── */}
            <section id="roadmap" className="scroll-mt-32">
              <SectionTitle n={8} title="Implementation roadmap" lead="What to do first, second and third — with dependencies made explicit. Skipping ahead is how systems projects fail." />
              {p?.roadmapNarrative && (
                <div className="card mb-6 border-l-4 !border-l-brand-500 p-5 text-sm leading-relaxed text-ink/75">
                  {p.roadmapNarrative}
                </div>
              )}
              <div className="space-y-6">
                {bp.roadmap.phases.map((phase) => {
                  const items = bp.roadmap.items.filter((i) => i.phase === phase.phase)
                  if (items.length === 0) return null
                  return (
                    <div key={phase.phase}>
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 font-bold text-white">{phase.phase}</span>
                        <div>
                          <h3 className="font-bold text-brand-900">{phase.title}</h3>
                          <p className="text-xs font-medium text-brand-600">{phase.window}</p>
                        </div>
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">{phase.intent}</p>
                      <div className="mt-4 space-y-3">
                        {items.map((item: RoadmapItem) => (
                          <div key={item.seq} className="card p-5">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h4 className="font-semibold text-brand-900">
                                <span className="mr-2 text-ink/30">{item.seq}.</span>
                                {item.title}
                              </h4>
                              <div className="flex gap-1.5">
                                <Tag>{item.effort} effort</Tag>
                                <Tag>{item.impact} impact</Tag>
                              </div>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-ink/65">{item.detail}</p>
                            {item.dependsOn.length > 0 && (
                              <p className="mt-2.5 text-[11px] font-medium text-ink/45">
                                Depends on: {item.dependsOn.join(' → ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── 9 · Improvements ─────────────────────────────────────── */}
            <section id="improvements" className="scroll-mt-32">
              <SectionTitle n={9} title="Business improvement opportunities" lead="What changes when this plan runs — in operational terms, not empty promises." />
              {p?.improvementNarrative && (
                <div className="card mb-6 border-l-4 !border-l-brand-500 p-5 text-sm leading-relaxed text-ink/75">
                  {p.improvementNarrative}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {bp.improvements.map((imp) => (
                  <div key={imp.title} className="card p-5">
                    <TrendingUp className="h-5 w-5 text-brand-600" />
                    <h4 className="mt-2.5 font-bold leading-snug text-brand-900">{imp.title}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{imp.detail}</p>
                    {imp.relatedTo.length > 0 && (
                      <p className="mt-2.5 text-[11px] text-ink/40">Touches: {imp.relatedTo.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── 10 · Financials ──────────────────────────────────────── */}
            <section id="financials" className="scroll-mt-32">
              <SectionTitle
                n={10}
                title="Financial opportunity analysis"
                lead="Built only from your answers and clearly stated assumptions. We show what we know, what we estimated, and what is hypothetical — never a promise."
              />
              <div className="space-y-6">
                <FinTable title="Measured — you told us directly" rows={bp.financials.measured} />
                <FinTable title="Estimated — simple math on your ranges" rows={bp.financials.estimates} />
                <FinTable title="Modeled — scenarios with stated assumptions" rows={bp.financials.modeled} />
                {bp.financials.modeled.length === 0 && bp.financials.estimates.length === 0 && (
                  <Callout tone="info">
                    You preferred not to share (or didn’t know) the numbers these scenarios need — so instead of inventing
                    figures, we left them out. The operational plan doesn’t depend on them.
                  </Callout>
                )}
                <div className="card border-amber-100 bg-amber-50/50 p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">Every assumption, on the table</h3>
                  <ul className="mt-3 space-y-2">
                    {bp.financials.assumptions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-amber-900/85">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /> {a}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-lg bg-white/70 p-3 text-xs leading-relaxed text-amber-900/75">{bp.financials.disclaimer}</p>
                </div>
                <div className="card p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-brand-700">What the recommended software costs to start</h3>
                  {bp.financials.softwareCost.monthly !== null ? (
                    <p className="mt-2 text-3xl font-bold text-brand-900">
                      ~${bp.financials.softwareCost.monthly}
                      <span className="text-base font-medium text-ink/50">/month to start</span>
                    </p>
                  ) : (
                    <p className="mt-2 font-semibold text-ink/60">Custom-priced components — confirm with vendors</p>
                  )}
                  <ul className="mt-4 space-y-2">
                    {bp.financials.softwareCost.lines.map((l, i) => (
                      <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-brand-50 pb-2 text-sm">
                        <span className="font-semibold text-ink/75">{l.name}</span>
                        <span className="text-ink/55">{l.cost !== null ? `from ~$${l.cost}/mo` : 'custom'}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-ink/50">{bp.financials.softwareCost.note}</p>
                </div>
              </div>
            </section>

            {/* ── 11 · Implementation plan ─────────────────────────────── */}
            <section id="plan" className="scroll-mt-32">
              <SectionTitle n={11} title="Your implementation plan" lead="The actual setup steps, in order — what gets configured and when." />
              <ol className="space-y-3">
                {bp.implementationPlan.map((s) => (
                  <li key={s.seq} className="card flex gap-4 p-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-800 text-sm font-bold text-white">
                      {s.seq}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-brand-900">{s.title}</h4>
                        <span className="rounded-md bg-mist px-2 py-0.5 text-[10px] font-bold uppercase text-ink/50">{s.phase}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── 12 · Consultation ────────────────────────────────────── */}
            <section id="consultation" className="scroll-mt-32">
              <div className="rounded-2xl bg-brand-950 p-8 text-white md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Section 12 · Your next step</p>
                <h2 className="mt-3 max-w-2xl text-2xl font-bold leading-tight md:text-3xl">{bp.consultation.headline}</h2>
                <p className="mt-4 max-w-2xl leading-relaxed text-white/70">{bp.consultation.body}</p>
                {p?.consultationMessage && (
                  <p className="mt-3 max-w-2xl font-medium leading-relaxed text-brand-200">{p.consultationMessage}</p>
                )}
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {bp.consultation.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-white/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5">
                <ConsultationForm blueprint={bp} />
              </div>
              <p className="mt-4 text-center text-xs text-ink/40">
                Prefer to keep it DIY? Your blueprint is complete without us — print it, share it, work the roadmap.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-paper px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/50">{children}</span>
}

function WorkflowCard({ w }: { w: WorkflowRecommendation }) {
  const [open, setOpen] = useState(w.priority === 1)
  const kindConf = ACTOR_STYLE[w.kind]
  return (
    <div className={`card overflow-hidden ${w.mode === 'verify' ? 'border-amber-200' : ''}`}>
      <button onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-start justify-between gap-3 p-5 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ActorChip kind={w.kind} />
            <ModeBadge mode={w.mode} />
            <span className="text-[11px] font-semibold text-ink/35">Stage {w.stageId} · {w.stageName}</span>
            {w.priority === 1 && <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600">Priority</span>}
          </div>
          <h3 className="mt-2 font-bold leading-snug text-brand-900">{w.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">{w.summary}</p>
        </div>
        <span className={`mt-1 shrink-0 text-xs font-semibold text-brand-600 ${open ? 'rotate-180' : ''} transition-transform`}>▾</span>
      </button>
      {open && (
        <div className="animate-fade-up border-t border-brand-50 bg-paper/60 px-5 py-5">
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            <Detail label="What happens" text={w.whatHappens} />
            <Detail label="What triggers it" text={w.trigger} />
            <Detail label="Software involved" text={w.software.join(' + ')} />
            <Detail label="What information moves" text={w.dataFlow} />
            <Detail label="What your customer experiences" text={w.customerExperience} />
            <Detail label="What your team does" text={w.employeeAction} />
            <Detail label="If something fails" text={w.failureMode} warn />
            <Detail
              label="Human approval"
              text={w.needsApproval ? (w.approvalNote ?? 'Yes — a person reviews before anything is sent.') : 'Not required for this step — it runs on its own.'}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, text, warn = false }: { label: string; text: string; warn?: boolean }) {
  return (
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-wide ${warn ? 'text-amber-700' : 'text-brand-700'}`}>{label}</p>
      <p className={`mt-1 text-[13px] leading-relaxed ${warn ? 'text-amber-900/80' : 'text-ink/70'}`}>{text}</p>
    </div>
  )
}

function FinTable({ title, rows }: { title: string; rows: FinancialRow[] }) {
  if (rows.length === 0) return null
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-brand-100 bg-brand-50/50 px-5 py-3">
        <h3 className="text-sm font-bold text-brand-800">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-brand-50 last:border-0">
              <td className="px-5 py-3.5">
                <p className="font-semibold text-ink/80">{r.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/50">{r.note}</p>
              </td>
              <td className="w-32 px-5 py-3.5 text-right align-top">
                <span
                  className={`inline-block rounded-lg px-2.5 py-1 text-sm font-bold ${
                    r.tone === 'modeled'
                      ? 'bg-amber-50 text-amber-800'
                      : r.tone === 'estimate'
                        ? 'bg-teal-50 text-teal-800'
                        : 'bg-brand-50 text-brand-800'
                  }`}
                >
                  {r.value}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
