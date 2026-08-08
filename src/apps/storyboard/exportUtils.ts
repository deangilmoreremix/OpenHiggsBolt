import type { StoryboardExport, StoryboardProject } from './StoryboardContext'
import { buildShotPrompt, withCharacters } from './cameraTaxonomy'

/** Trigger a browser download of a Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function safeFileName(name: string, fallback = 'storyboard'): string {
  const cleaned = (name || '').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  return cleaned || fallback
}

/** Export the project as a downloadable JSON file. */
export function exportJson(data: StoryboardExport) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, `${safeFileName(data.project.projectName)}-storyboard.json`)
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Render the storyboard to a printable HTML document and open the browser's
 * print dialog (Save as PDF). Dependency-free PDF export.
 */
export function exportPdf(project: StoryboardProject) {
  const characters = project.characters ?? []
  const shots = project.shots ?? []
  const charById = new Map(characters.map((c) => [c.id, c]))
  const totalSeconds = shots.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)

  const cards = shots
    .map((s, i) => {
      const chars = (s.characterIds || [])
        .map((id) => charById.get(id))
        .filter(Boolean) as { name: string; description?: string }[]
      const fullPrompt = withCharacters(buildShotPrompt(s.scene, s.camera), chars)
      const cam = [s.camera?.shotType, s.camera?.angle, s.camera?.movement, s.camera?.lens].filter(Boolean).join(' · ')
      const img = s.frameUrl
        ? `<img class="frame" src="${esc(s.frameUrl)}" alt="frame ${i + 1}" />`
        : `<div class="frame placeholder">No frame generated</div>`
      return `
        <div class="card">
          <div class="frame-wrap ${(project.aspectRatio ?? '16:9') === '16:9' ? 'ar-16-9' : 'ar-9-16'}">${img}</div>
          <div class="meta">
            <div class="num">Shot ${i + 1} · ${esc(String(s.duration ?? 0))}s${cam ? ` · ${esc(cam)}` : ''}</div>
            ${chars.length ? `<div class="chars">${esc(chars.map((c) => c.name).join(', '))}</div>` : ''}
            <div class="scene">${esc(s.scene)}</div>
            ${fullPrompt !== s.scene ? `<div class="prompt">${esc(fullPrompt)}</div>` : ''}
          </div>
        </div>`
    })
    .join('')

  const charsBlock = characters.length
    ? `<div class="section"><h2>Characters</h2>${characters
        .map(
          (c) =>
            `<div class="char">${
              c.referenceImageUrl ? `<img src="${esc(c.referenceImageUrl)}" alt="${esc(c.name)}"/>` : ''
            }<div><strong>${esc(c.name)}</strong>${c.description ? ` — ${esc(c.description)}` : ''}</div></div>`
        )
        .join('')}</div>`
    : ''

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>${esc(project.projectName || 'Storyboard')} — Storyboard</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 28px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #666; font-size: 12px; margin-bottom: 20px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em; color: #444; margin: 24px 0 10px; }
  .section { margin-bottom: 16px; }
  .char { display:flex; align-items:center; gap:10px; font-size: 13px; margin-bottom:6px; }
  .char img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .card { border: 1px solid #e2e2e2; border-radius: 10px; overflow: hidden; break-inside: avoid; }
  .frame-wrap { background:#f2f2f2; width:100%; }
  .frame-wrap.ar-16-9 { aspect-ratio: 16 / 9; }
  .frame-wrap.ar-9-16 { aspect-ratio: 9 / 16; max-height: 320px; }
  .frame { width: 100%; height: 100%; object-fit: cover; display:block; }
  .frame.placeholder { display:flex; align-items:center; justify-content:center; color:#aaa; font-size:12px; height:100%; }
  .meta { padding: 10px 12px; }
  .num { font-size: 11px; font-weight: 700; color: #0a7ea4; }
  .chars { font-size: 11px; color:#7a5; margin-top: 2px; }
  .scene { font-size: 13px; margin-top: 4px; }
  .prompt { font-size: 11px; color: #888; margin-top: 6px; font-style: italic; }
  @media print { body { margin: 12px; } .card { box-shadow:none; } }
</style></head>
<body>
  <h1>${esc(project.projectName || 'Untitled Storyboard')}</h1>
  <div class="sub">${shots.length} shot(s) · ${totalSeconds.toFixed(1)}s total · ${esc(project.aspectRatio ?? '16:9')} · episode target ${esc(String(project.episodeDuration ?? 60))}s</div>
  ${charsBlock}
  <h2>Shots</h2>
  <div class="grid">${cards || '<p>No shots yet.</p>'}</div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

  const win = window.open('', '_blank')
  if (!win) {
    // Popup blocked — fall back to downloading the HTML file.
    const blob = new Blob([html], { type: 'text/html' })
    downloadBlob(blob, `${safeFileName(project.projectName)}-storyboard.html`)
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
