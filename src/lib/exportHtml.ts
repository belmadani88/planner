/**
 * Save-the-report utilities:
 *  - a standalone, self-contained HTML document (works offline, printable)
 *  - the raw JSON blueprint (for the technically curious / backup)
 */

import type { Blueprint } from '../types/blueprint'
import { ENGINE_VERSION } from '../types/blueprint'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const CSS = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#122019; background:#fff; margin:0; padding:40px 24px; line-height:1.6; }
.wrap { max-width: 860px; margin: 0 auto; }
header.hero { border-bottom: 3px solid #163f2f; padding-bottom: 20px; margin-bottom: 28px; }
.brand { font-size: 13px; font-weight: 700; letter-spacing:.12em; text-transform: uppercase; color:#267d57; }
h1 { font-size: 30px; line-height: 1.2; margin: 8px 0 6px; color:#163f2f; }
.meta { font-size: 13px; color:#5b6f65; }
h2 { font-size: 21px; color:#163f2f; margin: 38px 0 12px; padding-top: 18px; border-top: 1px solid #dce8e1; }
h3 { font-size: 16px; margin: 20px 0 8px; color:#1b4d38; }
p { margin: 8px 0; }
ul { padding-left: 22px; margin: 8px 0; }
li { margin: 4px 0; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; }
th { text-align: left; background:#eef6f1; color:#163f2f; padding: 8px 10px; border: 1px solid #d5e3da; }
td { padding: 8px 10px; border: 1px solid #e2ece6; vertical-align: top; }
.card { border: 1px solid #dce8e1; border-radius: 12px; padding: 16px 18px; margin: 12px 0; background:#fbfdfc; }
.tag { display:inline-block; font-size:11px; font-weight:700; padding:2px 9px; border-radius:999px; margin-right:6px; }
.tag.human { background:#dcf1e5; color:#1b4d38; }
.tag.auto { background:#e0f2f1; color:#0f5257; }
.tag.ai { background:#fdeed7; color:#92500a; }
.tag.warn { background:#fdeaea; color:#8f2f2f; }
.small { font-size: 13px; color:#5b6f65; }
.assumption { background:#fff8ec; border:1px solid #f2dfc0; border-radius:10px; padding:12px 16px; font-size:13.5px; }
footer { margin-top:44px; padding-top:16px; border-top:1px solid #dce8e1; font-size:12.5px; color:#5b6f65; }
@media print { body { padding: 0; } h2 { break-after: avoid; } .card, table { break-inside: avoid; } }
`

export function buildStandaloneHtml(bp: Blueprint): string {
  const p = bp.personalization
  const date = new Date(bp.meta.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const aiNote = bp.meta.aiPersonalized ? `AI-personalized with ${esc(bp.meta.aiModel ?? 'Gemini')}` : 'Standard edition (deterministic engine)'

  const findings = bp.assessment.findings
    .map(
      (f) => `<div class="card">
        <span class="tag ${f.severity === 'high' ? 'warn' : f.severity === 'positive' ? 'human' : 'auto'}">${f.severity.toUpperCase()}</span>
        <strong>${esc(f.title)}</strong>
        <p>${esc(f.detail)}</p>
        <p class="small"><em>${esc(f.evidence)}</em></p>
      </div>`
    )
    .join('')

  const stages = bp.operatingModel.stages
    .map(
      (s) => `<h3>Stage ${s.stageId} — ${esc(s.stageName)}</h3>
      <p class="small"><strong>Now:</strong> ${esc(s.currentState)}</p>
      ${s.industryNote ? `<p class="small"><strong>${esc(bp.meta.industry.toUpperCase())} note:</strong> ${esc(s.industryNote)}</p>` : ''}
      <ul>${s.recommendedFlow.map((f) => `<li><span class="tag ${f.actor === 'human' ? 'human' : f.actor === 'ai' ? 'ai' : 'auto'}">${f.actor}</span>${esc(f.action)}</li>`).join('')}</ul>`
    )
    .join('')

  const workflows = bp.workflows
    .map(
      (w) => `<div class="card">
        <span class="tag ${w.kind === 'ai' ? 'ai' : w.kind === 'human' ? 'human' : 'auto'}">${w.kind}</span>
        <span class="tag auto">${w.mode === 'verify' ? 'CHECK WHAT YOU OWN' : w.mode === 'keep' ? 'KEEP DOING' : 'NEW'}</span>
        <strong>${esc(w.title)}</strong>
        <p>${esc(w.whatHappens)}</p>
        <p class="small"><strong>Trigger:</strong> ${esc(w.trigger)} &nbsp;·&nbsp; <strong>Software:</strong> ${esc(w.software.join(', '))}</p>
        <p class="small"><strong>Customer sees:</strong> ${esc(w.customerExperience)}</p>
        <p class="small"><strong>Your team does:</strong> ${esc(w.employeeAction)}</p>
        <p class="small"><strong>If it fails:</strong> ${esc(w.failureMode)}</p>
        ${w.needsApproval ? `<p class="small"><strong>Human approval:</strong> ${esc(w.approvalNote ?? 'Yes — a person approves before anything is sent.')}</p>` : ''}
      </div>`
    )
    .join('')

  const softwareRows = bp.software.stack
    .map(
      (s) => `<tr>
        <td><strong>${esc(s.name)}</strong><br/><span class="small">${esc(s.role)}</span></td>
        <td>${s.status === 'keep' ? 'Keep using' : s.status === 'verify' ? 'Verify / switch on' : s.status === 'adopt' ? 'New' : 'Optional'}</td>
        <td>${s.essential ? 'Essential' : 'Optional'}</td>
        <td>${s.monthlyCostEstimate !== null ? `from ~$${s.monthlyCostEstimate}/mo` : 'see note'}<br/><span class="small">${esc(s.costNote)}</span></td>
      </tr>`
    )
    .join('')

  const roadmap = [1, 2, 3]
    .map((phase) => {
      const items = bp.roadmap.items.filter((i) => i.phase === phase)
      const meta = bp.roadmap.phases.find((ph) => ph.phase === phase)
      if (items.length === 0) return ''
      return `<h3>${esc(meta?.title ?? `Phase ${phase}`)} — ${esc(meta?.window ?? '')}</h3>
      <p class="small">${esc(meta?.intent ?? '')}</p>
      <ul>${items.map((i) => `<li><strong>${esc(i.title)}</strong> — ${esc(i.detail)}${i.dependsOn.length ? `<br/><span class="small">Depends on: ${esc(i.dependsOn.join(' → '))}</span>` : ''}</li>`).join('')}</ul>`
    })
    .join('')

  const fin = (rows: typeof bp.financials.measured, title: string) =>
    rows.length === 0
      ? ''
      : `<h3>${esc(title)}</h3><table><tr><th>What</th><th>Value</th><th>Where it comes from</th></tr>${rows
          .map((r) => `<tr><td>${esc(r.label)}</td><td><strong>${esc(r.value)}</strong></td><td class="small">${esc(r.note)}</td></tr>`)
          .join('')}</table>`

  const assumptions = bp.financials.assumptions.map((a) => `<li>${esc(a)}</li>`).join('')

  const diagramNote = bp.diagram.nodes
    .filter((n) => n.kind !== 'outcome')
    .slice(0, 40)
    .map((n) => `<li><span class="tag ${n.kind === 'human' ? 'human' : n.kind === 'ai' ? 'ai' : 'auto'}">${n.kind}</span><strong>${esc(n.label)}</strong> — ${esc(n.detail)}</li>`)
    .join('')

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Business Operations Blueprint — ${esc(bp.meta.businessName || bp.profile.headline)}</title>
<style>${CSS}</style></head>
<body><div class="wrap">
<header class="hero">
  <div class="brand">WebThangs — Business Operations Blueprint</div>
  <h1>${esc(bp.profile.headline)}</h1>
  <div class="meta">Generated ${esc(date)} · Engine v${ENGINE_VERSION} · ${aiNote} · ${esc(bp.profile.classification.sizeLabel)}</div>
</header>

<p>${esc(p?.executiveSummary ?? bp.profile.summary)}</p>

<h2>1 · Your business profile</h2>
<p>${esc(bp.profile.summary)}</p>
<ul>${bp.profile.characteristics.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>

<h2>2 · Your current situation — confirmed vs assumed</h2>
<h3>Confirmed by your answers</h3>
<ul>${bp.currentSituation.confirmed.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
<h3>Assumptions we made (and why)</h3>
<ul>${bp.currentSituation.assumed.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>

<h2>3 · Operational assessment — what the answers show</h2>
<table><tr><th>Stage</th><th>Today</th><th>Status</th></tr>
${bp.assessment.stages.map((s) => `<tr><td><strong>${s.stageId}. ${esc(s.stageName)}</strong></td><td class="small">${esc(s.currentState.slice(0, 220))}${s.currentState.length > 220 ? '…' : ''}</td><td>${esc(s.maturityLabel)}</td></tr>`).join('')}
</table>
${findings}

<h2>4 · Your recommended operating model</h2>
${p?.stageInsights.map((si) => `<p class="small"><strong>Stage ${si.stageId}:</strong> ${esc(si.insight)} <em>Tip: ${esc(si.tip)}</em></p>`).join('')}
${stages}

<h2>5 · How your systems connect (diagram, text edition)</h2>
<p class="small">The interactive version of this diagram lives in the web app — this is the same content in list form.</p>
<ul>${diagramNote}</ul>

<h2>6 · Recommended AI, automation and human work</h2>
${workflows}

<h2>7 · Recommended software</h2>
<table><tr><th>Tool</th><th>Verdict</th><th>Priority</th><th>Cost (entry price)</th></tr>${softwareRows}</table>
<h3>How they connect</h3>
<ul>${bp.software.integrations.map((i) => `<li><strong>${esc(i.from)} ↔ ${esc(i.to)}</strong> — <em>${i.status}</em>: ${esc(i.note)}</li>`).join('')}</ul>
<ul>${bp.software.principles.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>

<h2>8 · Implementation roadmap</h2>
<p>${esc(p?.roadmapNarrative ?? '')}</p>
${roadmap}

<h2>9 · Business improvement opportunities</h2>
<p>${esc(p?.improvementNarrative ?? '')}</p>
<ul>${bp.improvements.map((i) => `<li><strong>${esc(i.title)}</strong> — ${esc(i.detail)}</li>`).join('')}</ul>

<h2>10 · Financial opportunity analysis</h2>
${fin(bp.financials.measured, 'Measured — you told us directly')}
${fin(bp.financials.estimates, 'Estimated — simple math on your ranges')}
${fin(bp.financials.modeled, 'Modeled — scenarios with stated assumptions')}
<div class="assumption"><strong>Assumptions behind every modeled number:</strong><ul>${assumptions}</ul>
<p>${esc(bp.financials.disclaimer)}</p></div>
<h3>Estimated software cost</h3>
<p><strong>${bp.financials.softwareCost.monthly !== null ? `~$${bp.financials.softwareCost.monthly}/month to start` : 'Custom-priced components — confirm with vendors'}</strong></p>
<p class="small">${esc(bp.financials.softwareCost.note)}</p>

<h2>11 · Your implementation plan</h2>
<ol>${bp.implementationPlan.map((s) => `<li><strong>${esc(s.title)}</strong> (${esc(s.phase)})<br/><span class="small">${esc(s.detail)}</span></li>`).join('')}</ol>

<h2>12 · Let WebThangs help you implement this</h2>
<p>${esc(bp.consultation.body)}</p>
${p?.consultationMessage ? `<p><em>${esc(p.consultationMessage)}</em></p>` : ''}
<ul>${bp.consultation.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>

<footer>Generated by the WebThangs Business Operations Planner. Recommendations are informational, based on your questionnaire answers and clearly stated assumptions — not financial advice or a guarantee of results. Software pricing is a point-in-time reference; verify with vendors. <br/>WebThangs — digital systems implementation for home-services businesses.</footer>
</div></body></html>`
}

export function downloadFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadBlueprintHtml(bp: Blueprint): void {
  const slug = (bp.meta.businessName || bp.meta.industry).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  downloadFile(`webthangs-blueprint-${slug}.html`, buildStandaloneHtml(bp), 'text/html;charset=utf-8')
}

export function downloadBlueprintJson(bp: Blueprint): void {
  downloadFile(`webthangs-blueprint-data.json`, JSON.stringify(bp, null, 2), 'application/json')
}
