/**
 * Interactive system-architecture diagram (Section 5).
 *
 * Built from the validated blueprint graph — never a static image. Node
 * colors encode who/what does the work; animated edges show data movement;
 * clicking a node opens a plain-language explanation.
 */

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  MarkerType
} from '@xyflow/react'
import {
  Bot,
  Building2,
  CheckCircle2,
  GitBranch,
  MessageSquareText,
  PhoneCall,
  User,
  Users,
  Zap,
  type LucideIcon
} from 'lucide-react'
import type { Blueprint, DiagramNode as BpDiagramNode } from '../../types/blueprint'
import { ACTOR_STYLE } from '../ui'

type WtNodeData = {
  bp: BpDiagramNode
  onInspect: (id: string) => void
}

const KIND_ICON: Record<string, { icon: LucideIcon; cls: string; label: string }> = {
  entry: { icon: PhoneCall, cls: 'bg-white border-slate-300 text-slate-700', label: 'Customer entry' },
  human: { icon: User, cls: ACTOR_STYLE.human.node + ' text-brand-800', label: 'Human action' },
  automation: { icon: Zap, cls: ACTOR_STYLE.automation.node + ' text-teal-800', label: 'Automation' },
  ai: { icon: Bot, cls: ACTOR_STYLE.ai.node + ' text-amber-800', label: 'AI-assisted' },
  software: { icon: Building2, cls: ACTOR_STYLE.software.node, label: 'Software system' },
  'human-ai': { icon: Users, cls: 'bg-white border-lime-400 text-lime-800', label: 'Human + AI' },
  outcome: { icon: CheckCircle2, cls: 'bg-brand-600 border-brand-700 text-white', label: 'Outcome' }
}

function FlowNodeCard({ data }: NodeProps) {
  const { bp, onInspect } = data as unknown as WtNodeData
  const conf = KIND_ICON[bp.kind] ?? KIND_ICON.automation
  const isSoftware = bp.kind === 'software'
  return (
    <div
      onClick={() => onInspect(bp.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onInspect(bp.id)}
      className={`w-[230px] cursor-pointer rounded-xl border-2 px-3.5 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lifted ${conf.cls}`}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-0 !bg-brand-300" />
      <div className="flex items-start gap-2.5">
        <conf.icon className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
        <div className="min-w-0">
          <p className={`text-[13.5px] font-bold leading-tight ${isSoftware ? 'text-white' : ''}`}>{bp.label}</p>
          {bp.software && (
            <p className={`mt-1 truncate text-[10px] font-medium ${isSoftware ? 'text-brand-200' : 'text-ink/40'}`}>
              {bp.software}
            </p>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-0 !bg-brand-300" />
    </div>
  )
}

const nodeTypes = { wtCard: FlowNodeCard }

const LEGEND: { kind: string; label: string }[] = [
  { kind: 'human', label: 'Human action' },
  { kind: 'automation', label: 'Automation' },
  { kind: 'ai', label: 'AI-assisted' },
  { kind: 'human-ai', label: 'Human + AI' },
  { kind: 'software', label: 'Software system' },
  { kind: 'entry', label: 'Customer entry' }
]

export function FlowDiagram({ blueprint }: { blueprint: Blueprint }) {
  const [inspected, setInspected] = useState<BpDiagramNode | null>(null)
  const onInspect = useCallback(
    (id: string) => setInspected(blueprint.diagram.nodes.find((n) => n.id === id) ?? null),
    [blueprint.diagram.nodes]
  )

  const nodes: Node[] = useMemo(
    () =>
      blueprint.diagram.nodes.map((n) => ({
        id: n.id,
        type: 'wtCard',
        position: { x: n.x, y: n.y },
        data: { bp: n, onInspect } as unknown as Record<string, unknown>
      })),
    [blueprint.diagram.nodes, onInspect]
  )

  const edges: Edge[] = useMemo(
    () =>
      blueprint.diagram.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated,
        style: { stroke: e.animated ? '#359a6c' : '#9dbfb0' },
        markerEnd: { type: MarkerType.ArrowClosed, color: e.animated ? '#359a6c' : '#9dbfb0' }
      })),
    [blueprint.diagram.edges]
  )

  return (
    <div>
      <div className="card overflow-hidden">
        <div className="h-[520px] wt-flow">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 40, zoom: 0.85 }}
            minZoom={0.15}
            maxZoom={1.8}
            panOnScroll
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="#d7e6dd" />
            <Controls showInteractive={false} className="!shadow-card" position="bottom-right" />
          </ReactFlow>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-brand-100 bg-white px-4 py-3">
          {LEGEND.map((l) => {
            const conf = KIND_ICON[l.kind]
            return (
              <span key={l.kind} className="inline-flex items-center gap-2 text-[11px] font-semibold text-ink/60">
                <span className={`inline-block h-3 w-3 rounded border-2 ${conf.cls.replace(' ', ' ').split(' ').slice(0, 4).join(' ')}`} />
                {l.label}
              </span>
            )
          })}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink/60">
            <span className="inline-block h-0.5 w-6" style={{ borderTop: '2px dashed #359a6c' }} /> Data moves automatically
          </span>
          <span className="ml-auto hidden text-[11px] text-ink/40 sm:block">Drag to pan · scroll to zoom · use ⊕/⊖ or “fit” to see the whole picture</span>
        </div>
      </div>

      {/* Inspector */}
      <div className="mt-4">
        {inspected ? (
          <div className="card animate-fade-up border-l-4 !border-l-brand-500 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{KIND_ICON[inspected.kind]?.label ?? inspected.kind} · Stage {inspected.stageId}</p>
                <h3 className="mt-1 text-lg font-bold text-brand-900">{inspected.label}</h3>
              </div>
              <button onClick={() => setInspected(null)} className="btn-ghost !text-xs">Close</button>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/70">{inspected.detail}</p>
            {inspected.software && (
              <p className="mt-2 text-xs text-ink/50">Runs on: {inspected.software}</p>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-xs text-ink/45">
            <GitBranch className="h-3.5 w-3.5" />
            Tap any step in the diagram to see what it is, in plain language. Drag to pan, scroll to zoom — it also works on your phone.
          </p>
        )}
      </div>

      {/* Plain-text summary of the flow (also feeds the print layout) */}
      <div className="print-only mt-6">
        <h3>Your system flow, in words</h3>
        <ul>
          {blueprint.diagram.nodes.map((n) => (
            <li key={n.id}>
              <strong>{n.label}</strong> ({KIND_ICON[n.kind]?.label ?? n.kind}) — {n.detail}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
