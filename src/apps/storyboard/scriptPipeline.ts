/**
 * Script → scenes → shots → animatic → pitch deck. Hand-off to the video studios
 * stays in SendToMenu / shared/crossStudio.
 * Framework-free and DOM-free so the planner UI, creation apps and tests share it.
 * Mirrors remix-new-editor/src/lib/storyboardPipeline.js, mapped onto this app's
 * StoryboardShot / CameraSpec model.
 */
import type { StoryboardShot, StoryboardCharacter } from './StoryboardContext'
import type { CameraSpec } from './cameraTaxonomy'

export interface ScriptScene {
  number: number
  heading: string
  location: string
  action: string[]
  dialogue: { character: string; line: string }[]
  characters: string[]
}
type Para = { type: string; text: string }

const SCENE_RE = /^\s*((?:INT|EXT|EST|INT\.?\/EXT|I\/E)[.\s].+|\.[A-Za-z0-9].+)$/i

const decodeXml = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')

export function detectScriptFormat(text: string, fileName = ''): 'fdx' | 'fountain' | 'text' {
  if (/\.fdx$/i.test(fileName) || /<FinalDraft[\s>]/i.test(text)) return 'fdx'
  const first = text.split('\n').find((l) => l.trim()) || ''
  if (/\.fountain$/i.test(fileName) || /^\s*(Title|Credit|Author|Draft date):/im.test(text) || SCENE_RE.test(first)) return 'fountain'
  return 'text'
}

function fdxParagraphs(xml: string): Para[] {
  const out: Para[] = []
  const re = /<Paragraph\b[^>]*\bType="([^"]*)"[^>]*>([\s\S]*?)<\/Paragraph>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) {
    const text = [...m[2].matchAll(/<Text\b[^>]*>([\s\S]*?)<\/Text>/gi)].map((t) => decodeXml(t[1])).join('').trim()
    if (text) out.push({ type: m[1], text })
  }
  return out
}

function textParagraphs(text: string): Para[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out: Para[] = []
  let i = 0
  if (/^[A-Za-z ]+:/.test(lines[0] || '')) while (i < lines.length && lines[i].trim()) i++
  let prevBlank = true
  for (; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t) { prevBlank = true; continue }
    const last = out[out.length - 1]
    if (SCENE_RE.test(t)) out.push({ type: 'Scene Heading', text: t.replace(/^\./, '') })
    else if (/^\(.*\)$/.test(t)) out.push({ type: 'Parenthetical', text: t })
    else if (prevBlank && /^[A-Z0-9 ._'-]{2,30}(\s*\(.*\))?$/.test(t) && /[A-Z]/.test(t) && i + 1 < lines.length && lines[i + 1].trim())
      out.push({ type: 'Character', text: t.replace(/\s*\(.*\)$/, '') })
    else if (last && /^(Character|Parenthetical|Dialogue)$/.test(last.type)) out.push({ type: 'Dialogue', text: t })
    else out.push({ type: 'Action', text: t })
    prevBlank = false
  }
  return out
}

/** Parse Fountain / Final Draft XML / plain prose into scenes. */
export function parseScript(text: string, opts: { fileName?: string; format?: 'fdx' | 'fountain' | 'text' } = {}): ScriptScene[] {
  const src = String(text || '')
  const fmt = opts.format || detectScriptFormat(src, opts.fileName)
  const paras = fmt === 'fdx' ? fdxParagraphs(src) : textParagraphs(src)
  const hasHeadings = paras.some((p) => p.type === 'Scene Heading')
  const scenes: ScriptScene[] = []
  let cur = null as ScriptScene | null
  let speaker = ''
  const start = (heading: string) => {
    cur = {
      number: scenes.length + 1, heading, action: [], dialogue: [], characters: [],
      location: heading.replace(/^(INT|EXT|EST|I\/E|INT\.?\/EXT)[.\s]+/i, '').replace(/\s+-\s+.*$/, '').trim(),
    }
    scenes.push(cur)
  }
  for (const p of paras) {
    if (p.type === 'Scene Heading') { start(p.text.toUpperCase()); speaker = ''; continue }
    if (!cur) start(hasHeadings ? 'UNTITLED SCENE' : 'SCENE 1')
    else if (!hasHeadings && p.type === 'Action' && cur.action.length) start(`SCENE ${scenes.length + 1}`)
    const scene = cur as ScriptScene
    if (p.type === 'Character') {
      speaker = p.text.toUpperCase()
      if (!scene.characters.includes(speaker)) scene.characters.push(speaker)
    } else if (p.type === 'Dialogue') scene.dialogue.push({ character: speaker || 'UNKNOWN', line: p.text })
    else if (p.type === 'Action' || p.type === 'General') scene.action.push(p.text)
  }
  return scenes
}

export function extractCharacters(scenes: ScriptScene[]): Omit<StoryboardCharacter, 'id'>[] {
  const names = new Set<string>()
  scenes.forEach((s) => s.characters.forEach((c) => names.add(c)))
  return [...names].map((name) => ({ name, description: '' }))
}

/* ── shots ── */
const ESTABLISH_RE = /\b(establish|skyline|aerial|landscape|city|street|exterior|horizon)\b/i
const DETAIL_RE = /\b(hand|eyes?|phone|letter|key|tear|detail|object|close)\b/i
const MOVE_RE: [RegExp, string][] = [
  [/\b(chase|run|runs|race|sprint|pursu)/i, 'Pan Right'],
  [/\b(drive|fly|flies|soar)/i, 'Crane Up'],
  [/\b(approach|enter|step closer|slowly)/i, 'Dolly In'],
  [/\b(retreat|leave|walk away)/i, 'Dolly Out'],
  [/\b(look up|rises?|ascend)/i, 'Tilt Up'],
  [/\b(shaky|panic|fight)/i, 'Handheld'],
]

export function suggestCamera(text: string, index: number, isDialogue: boolean): CameraSpec {
  let shotType: string
  if (index === 0 && (ESTABLISH_RE.test(text) || !isDialogue)) shotType = 'Wide'
  else if (isDialogue) shotType = index % 2 ? 'Close-Up' : 'Medium'
  else if (DETAIL_RE.test(text)) shotType = 'Extreme Close-Up'
  else shotType = 'Medium'
  const movement = (MOVE_RE.find(([re]) => re.test(text)) || [null, 'Static'])[1] as string
  return { shotType, movement }
}

/** Seconds, in 0.5s steps: ~2.5s base plus reading time for dialogue; clamped 1..8. */
export function estimateShotDuration(text: string, isDialogue: boolean): number {
  const words = text.split(/\s+/).filter(Boolean).length
  const secs = isDialogue ? 1.5 + words / 2.5 : 2.5 + words / 8
  return Math.max(1, Math.min(8, Math.round(secs * 2) / 2))
}

export interface ScriptShot extends StoryboardShot { sceneNumber: number; dialogueLine?: string }

export function scriptToShots(scenes: ScriptScene[], opts: { maxShotsPerScene?: number } = {}): ScriptShot[] {
  const cap = Math.max(1, opts.maxShotsPerScene ?? 6)
  const shots: ScriptShot[] = []
  for (const scene of scenes) {
    const actions = scene.action.map((text) => ({ text, dialogue: false, speaker: '' }))
    const talk = scene.dialogue.map((d) => ({ text: d.line, dialogue: true, speaker: d.character }))
    if (!actions.length && !talk.length) actions.push({ text: scene.heading, dialogue: false, speaker: '' })
    const ordered: typeof actions = []
    while (actions.length || talk.length) {
      if (actions.length) ordered.push(actions.shift()!)
      if (talk.length) ordered.push(talk.shift()!)
    }
    ordered.slice(0, cap).forEach((b, i) => {
      shots.push({
        sceneNumber: scene.number,
        scene: `${scene.location}. ${b.dialogue ? `${b.speaker} speaking: "${b.text}"` : b.text}`.slice(0, 600),
        camera: suggestCamera(b.text, i, b.dialogue),
        duration: estimateShotDuration(b.text, b.dialogue),
        dialogueLine: b.dialogue ? b.text : undefined,
      })
    })
  }
  return shots
}

/* ── animatic ── */
export interface AnimaticEntry { index: number; start: number; end: number; duration: number; imageUrl: string | null; caption: string; move: string; label: string }

export function buildAnimaticTimeline(shots: (StoryboardShot & { sceneNumber?: number; dialogueLine?: string })[]) {
  let t = 0
  const entries: AnimaticEntry[] = shots.map((s, index) => {
    const duration = Math.max(0.5, Number(s.duration) || 3)
    const e = { index, start: t, end: t + duration, duration, imageUrl: s.frameUrl || null, caption: s.dialogueLine || '', move: s.camera?.movement || 'Static', label: String(index + 1) }
    t += duration
    return e
  })
  return {
    entries,
    total: t,
    at(time: number): AnimaticEntry | null {
      if (!entries.length) return null
      const c = Math.max(0, Math.min(time, t - 1e-6))
      return entries.find((e) => c >= e.start && c < e.end) || entries[entries.length - 1]
    },
  }
}

export function cameraMoveTransform(move: string, p: number): string {
  const e = Math.max(0, Math.min(1, p))
  switch (move) {
    case 'Dolly In': return `scale(${(1 + 0.15 * e).toFixed(4)})`
    case 'Dolly Out': return `scale(${(1.15 - 0.15 * e).toFixed(4)})`
    case 'Pan Left': return `scale(1.1) translateX(${(3 - 6 * e).toFixed(3)}%)`
    case 'Pan Right': return `scale(1.1) translateX(${(-3 + 6 * e).toFixed(3)}%)`
    case 'Tilt Up': case 'Crane Up': return `scale(1.1) translateY(${(3 - 6 * e).toFixed(3)}%)`
    case 'Tilt Down': case 'Crane Down': return `scale(1.1) translateY(${(-3 + 6 * e).toFixed(3)}%)`
    default: return 'scale(1)'
  }
}

/* ── pitch deck ── */
const THEMES = {
  noir: { bg: '#0b0b0f', fg: '#f4f4f5', accent: '#f5c451', card: '#16161d' },
  paper: { bg: '#faf8f3', fg: '#1c1c1c', accent: '#b4281f', card: '#ffffff' },
  studio: { bg: '#0f172a', fg: '#e2e8f0', accent: '#38bdf8', card: '#1e293b' },
} as const
export type DeckTheme = keyof typeof THEMES
export const DECK_THEMES = Object.keys(THEMES) as DeckTheme[]

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
const safeUrl = (u?: string) => (/^(https?:|data:image\/|blob:)/i.test(u || '') ? (u as string) : '')

export function buildPitchDeckHtml(o: { title?: string; logline?: string; shots: StoryboardShot[]; characters?: StoryboardCharacter[]; theme?: DeckTheme }): string {
  const th = THEMES[o.theme || 'noir'] || THEMES.noir
  const shots = o.shots
  const total = Math.round(shots.reduce((s, x) => s + (Number(x.duration) || 0), 0))
  const card = (s: StoryboardShot, i: number) =>
    `<figure><div class="img">${safeUrl(s.frameUrl) ? `<img src="${esc(safeUrl(s.frameUrl))}" alt="Shot ${i + 1}">` : '<span>No image</span>'}</div><figcaption><b>${i + 1} · ${esc(s.camera?.shotType || 'Shot')} · ${esc(s.camera?.movement || 'Static')} · ${s.duration ?? 3}s</b><br>${esc(s.scene)}</figcaption></figure>`
  const pages: string[] = []
  for (let i = 0; i < shots.length; i += 4) pages.push(`<section><h2>Shots ${i + 1}–${Math.min(i + 4, shots.length)}</h2><div class="grid">${shots.slice(i, i + 4).map((s, j) => card(s, i + j)).join('')}</div></section>`)
  const chars = o.characters?.length ? `<section><h2>Characters</h2><ul class="chars">${o.characters.map((c) => `<li><b>${esc(c.name)}</b><br>${esc(c.description || '')}</li>`).join('')}</ul></section>` : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(o.title || 'Untitled')} – Pitch Deck</title><style>
@page{size:1280px 720px;margin:0}*{box-sizing:border-box}body{margin:0;background:${th.bg};color:${th.fg};font-family:system-ui,sans-serif}
section{width:1280px;height:720px;padding:48px 64px;page-break-after:always;overflow:hidden}
h1{font-size:64px;margin:200px 0 16px;color:${th.accent}}h2{font-size:32px;margin:0 0 24px;color:${th.accent}}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;background:${th.card};border-radius:10px;padding:10px;font-size:13px}
.img{aspect-ratio:16/7;background:#0003;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:6px}.img img{width:100%;height:100%;object-fit:cover}
.chars{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;list-style:none;padding:0}.chars li{background:${th.card};padding:16px;border-radius:10px}
</style></head><body><section><h1>${esc(o.title || 'Untitled')}</h1><p>${esc(o.logline || '')}</p><small>${shots.length} shots · ${Math.floor(total / 60)}m ${total % 60}s</small></section>${chars}${pages.join('')}</body></html>`
}
