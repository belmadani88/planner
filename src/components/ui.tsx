import type { ReactNode } from 'react'
import type { ActorKind, WorkflowKind, WorkflowMode } from '../types/blueprint'

/* ── Actor / kind visual language (shared everywhere) ─────────────────────── */

export const ACTOR_STYLE: Record<
  ActorKind | WorkflowKind,
  { label: string; chip: string; dot: string; node: string }
> = {
  human: {
    label: 'Human',
    chip: 'bg-brand-100 text-brand-800 border-brand-200',
    dot: 'bg-brand-600',
    node: 'bg-white border-brand-300'
  },
  automation: {
    label: 'Automation',
    chip: 'bg-teal-50 text-teal-800 border-teal-200',
    dot: 'bg-teal-600',
    node: 'bg-teal-50/60 border-teal-300'
  },
  ai: {
    label: 'AI-assisted',
    chip: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    node: 'bg-amber-50/70 border-amber-300'
  },
  software: {
    label: 'Software',
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-600',
    node: 'bg-brand-900 border-brand-950 text-white'
  },
  'human-ai': {
    label: 'Human + AI',
    chip: 'bg-lime-50 text-lime-800 border-lime-200',
    dot: 'bg-lime-600',
    node: 'bg-white border-lime-300'
  }
}

export function ActorChip({ kind }: { kind: ActorKind | WorkflowKind }) {
  const s = ACTOR_STYLE[kind]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function ModeBadge({ mode }: { mode: WorkflowMode }) {
  const map: Record<WorkflowMode, { label: string; cls: string }> = {
    adopt: { label: 'New', cls: 'bg-brand-600 text-white' },
    verify: { label: 'Check what you own', cls: 'bg-amber-100 text-amber-900' },
    keep: { label: 'Keep doing', cls: 'bg-mist text-ink/70' }
  }
  const m = map[mode]
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${m.cls}`}>{m.label}</span>
}

export function SeverityChip({ severity }: { severity: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    high: { label: 'Fix first', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    medium: { label: 'Improve', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    low: { label: 'Watch', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    positive: { label: 'Strength', cls: 'bg-brand-50 text-brand-700 border-brand-200' }
  }
  const m = map[severity] ?? map.low
  return <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>
}

/* ── Layout primitives ────────────────────────────────────────────────────── */

export function SectionTitle({
  n,
  title,
  lead
}: {
  n: number | string
  title: string
  lead?: string
}) {
  return (
    <div className="mb-5">
      <div className="eyebrow mb-1.5">Section {n}</div>
      <h2 className="text-2xl font-bold tracking-tight text-brand-900">{title}</h2>
      {lead && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink/70">{lead}</p>}
    </div>
  )
}

export function Callout({
  tone = 'info',
  title,
  children
}: {
  tone?: 'info' | 'warn' | 'ok'
  title?: string
  children: ReactNode
}) {
  const tones = {
    info: 'bg-brand-50 border-brand-200 text-brand-900',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-900'
  }
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  )
}

export function MaturityMeter({ value, label }: { value: number | null; label: string }) {
  if (value === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-2 w-5 rounded-full bg-mist" />
          ))}
        </div>
        <span className="text-xs font-medium text-ink/40">{label}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-2 w-5 rounded-full transition-colors ${
              i <= value ? (value <= 1 ? 'bg-amber-400' : value === 2 ? 'bg-brand-400' : 'bg-brand-600') : 'bg-mist'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-ink/60">{label}</span>
    </div>
  )
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${light ? 'bg-white/10' : 'bg-brand-800'}`}>
        <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
          <path d="M10 20h7l5 18 5-18h6l5 18 5-18h7l-9 26h-7l-4.5-16.5L29 46h-7L10 20z" fill={light ? '#8dd0ae' : '#8dd0ae'} />
        </svg>
      </span>
      <span className={`text-[15px] font-bold tracking-tight ${light ? 'text-white' : 'text-brand-900'}`}>
        WebThangs<span className="font-medium text-brand-500"> · Operations Planner</span>
      </span>
    </span>
  )
}
