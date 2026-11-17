/**
 * Captions: timed lines of text drawn over the video, with the word being spoken highlighted. Nothing here listens to the audio:
 * the customer pastes a script or subtitles (SRT) and the lines are timed for them, then they can adjust each one. The state at any
 * frame is a pure function, so the live Player and the browser export agree.
 */
import { capiteStyleById, isCapiteStyleId } from '../captions/capiteStyles'

export interface CaptionCue {
  id: string
  /** Seconds. */
  start: number
  end: number
  text: string
}

export type CaptionPosition = 'bottom' | 'middle' | 'top'
export type CaptionHighlight = 'word' | 'none'

export interface CaptionStyle {
  preset: string
  position: CaptionPosition
  /** Font size as a fraction of the frame height. */
  size: number
  /** Which word is highlighted while the line plays. */
  highlight: CaptionHighlight
  /** Text color; highlight color for the active word. Hex. */
  color: string
  highlightColor: string
  /** A rounded box behind the text. */
  box: boolean
  boxColor: string
  /** 0..1 */
  boxOpacity: number
  uppercase: boolean
  /** Use the brand's font weight/shadow look: bold with a soft shadow. */
  bold: boolean
  /** One of the 27 Capite looks (captions/capiteStyles.ts): its font, outline and how the spoken word is picked out. Optional; kept while the person tweaks the controls. */
  look?: string
}

export interface CaptionSettings {
  enabled: boolean
  cues: CaptionCue[]
  style: CaptionStyle
}

export const MAX_CUES = 200
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const hex = (v: unknown, fallback: string) => (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()) ? v.trim() : fallback)

// ── presets (the "brand styles": they take the brand's colors) ───────────────────────────────────────────────────
export interface CaptionPresetDef {
  id: string
  label: string
  build: (brand: { primary: string; accent: string; text: string }) => Omit<CaptionStyle, 'preset'>
}

export const CAPTION_PRESETS: CaptionPresetDef[] = [
  { id: 'clean', label: 'Clean', build: (b) => ({ position: 'bottom', size: 0.055, highlight: 'none', color: b.text, highlightColor: b.accent, box: false, boxColor: '#000000', boxOpacity: 0.5, uppercase: false, bold: true }) },
  { id: 'karaoke', label: 'Word highlight', build: (b) => ({ position: 'bottom', size: 0.062, highlight: 'word', color: b.text, highlightColor: b.accent, box: false, boxColor: '#000000', boxOpacity: 0.5, uppercase: true, bold: true }) },
  { id: 'boxed', label: 'Boxed', build: (b) => ({ position: 'bottom', size: 0.05, highlight: 'word', color: '#ffffff', highlightColor: b.primary, box: true, boxColor: '#000000', boxOpacity: 0.62, uppercase: false, bold: true }) },
  { id: 'brand', label: 'Brand bar', build: (b) => ({ position: 'bottom', size: 0.052, highlight: 'none', color: '#ffffff', highlightColor: '#ffffff', box: true, boxColor: b.primary, boxOpacity: 0.9, uppercase: false, bold: true }) },
  { id: 'headline', label: 'Big middle', build: (b) => ({ position: 'middle', size: 0.085, highlight: 'word', color: b.text, highlightColor: b.accent, box: false, boxColor: '#000000', boxOpacity: 0.5, uppercase: true, bold: true }) },
]

export function captionPreset(id: string, brand: { primary: string; accent: string; text: string }): CaptionStyle | undefined {
  const p = CAPTION_PRESETS.find((x) => x.id === id)
  return p ? { preset: p.id, ...p.build(brand) } : undefined
}

/** A Capite look as a caption style. Colours, caps and weight come from the look; a box look uses its per-word highlight box, not a bar behind the line. */
export function capiteLook(id: string): CaptionStyle | undefined {
  const l = capiteStyleById(id)
  if (!l) return undefined
  return {
    preset: `capite-${l.id}`, look: l.id, position: 'bottom', size: 0.055, highlight: 'word',
    color: l.primaryColor, highlightColor: l.highlightColor, box: false, boxColor: '#000000', boxOpacity: 0.5, uppercase: true, bold: l.bold,
  }
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = { preset: 'karaoke', ...CAPTION_PRESETS[1].build({ primary: '#29d3f2', accent: '#facc15', text: '#ffffff' }) }

// ── normalizing saved data ──────────────────────────────────────────────────────────────────────────────────────
export function normalizeCues(raw: unknown): CaptionCue[] {
  if (!Array.isArray(raw)) return []
  const out: CaptionCue[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (!isRecord(item) || typeof item.text !== 'string' || !item.text.trim() || !finite(item.start) || !finite(item.end)) continue
    const start = clamp(item.start, 0, 3600)
    const end = clamp(item.end, start + 0.1, 3600)
    let id = typeof item.id === 'string' && item.id ? item.id : `cue_${out.length}`
    while (seen.has(id)) id += '_'
    seen.add(id)
    out.push({ id, start, end, text: item.text.trim().slice(0, 240) })
    if (out.length >= MAX_CUES) break
  }
  return out.sort((a, b) => a.start - b.start)
}

export function normalizeCaptions(raw: unknown): CaptionSettings | undefined {
  if (!isRecord(raw)) return undefined
  const s = isRecord(raw.style) ? raw.style : {}
  const d = DEFAULT_CAPTION_STYLE
  const style: CaptionStyle = {
    preset: typeof s.preset === 'string' ? s.preset : d.preset,
    position: s.position === 'top' || s.position === 'middle' || s.position === 'bottom' ? s.position : d.position,
    size: finite(s.size) ? clamp(s.size, 0.025, 0.14) : d.size,
    highlight: s.highlight === 'none' ? 'none' : s.highlight === 'word' ? 'word' : d.highlight,
    color: hex(s.color, d.color),
    highlightColor: hex(s.highlightColor, d.highlightColor),
    box: s.box === true || (s.box === undefined && d.box),
    boxColor: hex(s.boxColor, d.boxColor),
    boxOpacity: finite(s.boxOpacity) ? clamp(s.boxOpacity, 0, 1) : d.boxOpacity,
    uppercase: s.uppercase === true || (s.uppercase === undefined && d.uppercase),
    bold: s.bold !== false,
    ...(isCapiteStyleId(s.look) ? { look: s.look as string } : {}),
  }
  return { enabled: raw.enabled === true, cues: normalizeCues(raw.cues), style }
}

// ── turning a script or subtitles into timed lines ──────────────────────────────────────────────────────────────
const parseTime = (t: string): number | null => {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/.exec(t.trim())
  if (!m) return null
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, '0')) / 1000
}

/** Reads SRT (or WebVTT-style) subtitles. Returns [] when the text is not subtitles. */
export function parseSubtitles(text: string): CaptionCue[] {
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/)
  const cues: CaptionCue[] = []
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    const timeIdx = lines.findIndex((l) => l.includes('-->'))
    if (timeIdx < 0) continue
    const [a, b] = lines[timeIdx].split('-->').map((x) => x.trim().split(/\s+/)[0])
    const start = parseTime(a)
    const end = parseTime(b)
    const body = lines.slice(timeIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim()
    if (start === null || end === null || end <= start || !body) continue
    cues.push({ id: `cue_${cues.length}`, start, end, text: body })
  }
  return normalizeCues(cues)
}

/** Splits a plain script into lines of about `wordsPerCue` words (breaking at sentence ends when close) and spreads them over `durationSec`. */
export function scriptToCues(script: string, durationSec: number, wordsPerCue = 6): CaptionCue[] {
  const words = script.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (words.length === 0 || !(durationSec > 0)) return []
  const groups: string[][] = []
  let cur: string[] = []
  for (const w of words) {
    cur.push(w)
    const sentenceEnd = /[.!?]$/.test(w) && cur.length >= Math.ceil(wordsPerCue / 2)
    if (cur.length >= wordsPerCue || sentenceEnd) { groups.push(cur); cur = [] }
  }
  if (cur.length) { if (groups.length && cur.length < 3) groups[groups.length - 1].push(...cur); else groups.push(cur) }
  const total = groups.reduce((n, g) => n + g.join(' ').length, 0)
  let t = 0
  return normalizeCues(groups.map((g, i) => {
    const len = (g.join(' ').length / total) * durationSec
    const cue = { id: `cue_${i}`, start: t, end: Math.min(durationSec, t + len), text: g.join(' ') }
    t += len
    return cue
  }))
}

/** Subtitles if the text looks like SRT, otherwise a script spread over the video. */
export function cuesFromText(text: string, durationSec: number): CaptionCue[] {
  if (text.includes('-->')) {
    const subs = parseSubtitles(text)
    if (subs.length) return subs
  }
  return scriptToCues(text, durationSec)
}

// ── what is on screen at a frame ──────────────────────────────────────────────────────────────────────────────────
export function activeCue(cues: readonly CaptionCue[], frame: number, fps: number): CaptionCue | null {
  const t = frame / Math.max(1, fps)
  return cues.find((c) => t >= c.start && t < c.end) ?? null
}

export interface CaptionWord {
  text: string
  active: boolean
}

/** The words of a cue, with the one being spoken at `frame` marked. Words share the line's time in proportion to their length. */
export function captionWords(cue: CaptionCue, frame: number, fps: number, highlight: CaptionHighlight): CaptionWord[] {
  const words = cue.text.split(/\s+/).filter(Boolean)
  if (highlight === 'none') return words.map((text) => ({ text, active: false }))
  const progress = clamp((frame / Math.max(1, fps) - cue.start) / Math.max(0.001, cue.end - cue.start), 0, 0.9999)
  const weights = words.map((w) => w.length + 1)
  const total = weights.reduce((a, b) => a + b, 0)
  let acc = 0
  let activeIdx = words.length - 1
  for (let i = 0; i < words.length; i++) {
    acc += weights[i] / total
    if (progress < acc) { activeIdx = i; break }
  }
  return words.map((text, i) => ({ text, active: i === activeIdx }))
}

/** Entrance of a line: rises and fades in over the first few frames. */
export function cueEntrance(cue: CaptionCue, frame: number, fps: number): { opacity: number; rise: number } {
  const p = clamp((frame / Math.max(1, fps) - cue.start) / 0.18, 0, 1)
  const e = 1 - (1 - p) ** 3
  return { opacity: e, rise: (1 - e) * 0.012 }
}

export function newCue(start: number, end: number, text = 'New line'): CaptionCue {
  return { id: `cue_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, start, end, text }
}
