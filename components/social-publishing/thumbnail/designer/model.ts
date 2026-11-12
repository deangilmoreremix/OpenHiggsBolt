/**
 * Thumbnail designer model: a flat project of layers over a background.
 * Everything here is pure (no DOM, no canvas) so it can be unit tested; rendering lives in render.ts.
 *
 * Coordinates are canvas pixels with the origin at the top-left. A layer's (x, y, w, h) is its
 * unrotated box; rotation is in degrees around the box centre. `layers` is ordered bottom to top.
 */

export type LayerKind = 'image' | 'text' | 'shape'
export type ImageRole = 'subject' | 'logo' | 'photo' | 'screenshot'
export type ShapeType = 'arrow' | 'circle' | 'rect' | 'badge' | 'divider'
export type TextAlign = 'left' | 'center' | 'right'

interface LayerBase {
  id: string
  name: string
  kind: LayerKind
  x: number
  y: number
  w: number
  h: number
  rotation: number
  opacity: number
  locked: boolean
  hidden: boolean
}

export interface ImageLayer extends LayerBase {
  kind: 'image'
  src: string
  role: ImageRole
  fit: 'contain' | 'cover'
  /** Natural size, used to keep the aspect ratio when resizing. */
  naturalW: number
  naturalH: number
  /** Optional outline or glow around the (cut-out) subject. */
  outline: 'none' | 'white' | 'glow'
}

export interface TextShadow {
  color: string
  blur: number
  offsetX: number
  offsetY: number
}

export interface TextLayer extends LayerBase {
  kind: 'text'
  text: string
  fontFamily: string
  fontWeight: number
  fontSize: number
  color: string
  align: TextAlign
  letterSpacing: number
  lineHeight: number
  strokeColor: string
  strokeWidth: number
  shadow: TextShadow | null
  /** A filled box behind the text. */
  box: { color: string; padding: number; radius: number } | null
  /** Words drawn in another colour (matched case-insensitively, punctuation ignored). */
  highlight: { words: string[]; color: string }
}

export interface ShapeLayer extends LayerBase {
  kind: 'shape'
  shape: ShapeType
  fill: string
  stroke: string
  strokeWidth: number
  /** Badge label (e.g. "NEW", "BEFORE"). */
  label: string
}

export type Layer = ImageLayer | TextLayer | ShapeLayer

export interface DesignBackground {
  mode: 'image' | 'solid' | 'gradient'
  /** The generated / uploaded picture used when mode is "image". */
  imageSrc?: string
  color: string
  from: string
  to: string
  /** Gradient angle in degrees (0 = left to right, 90 = top to bottom). */
  angle: number
  blur: number
  /** 100 = unchanged. */
  brightness: number
  contrast: number
  saturation: number
}

export interface DesignProject {
  version: 1
  width: number
  height: number
  background: DesignBackground
  layers: Layer[]
}

export const DEFAULT_FONTS = ['Inter, system-ui, sans-serif', 'Impact, Haettenschweiler, sans-serif', 'Georgia, serif', 'Arial Black, Arial, sans-serif', 'Courier New, monospace'] as const

let counter = 0
export function newId(prefix = 'layer'): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}

export function defaultBackground(): DesignBackground {
  return { mode: 'solid', color: '#0f172a', from: '#1e3a8a', to: '#7c3aed', angle: 45, blur: 0, brightness: 100, contrast: 100, saturation: 100 }
}

export function createProject(width: number, height: number, background?: Partial<DesignBackground>): DesignProject {
  return { version: 1, width, height, background: { ...defaultBackground(), ...background }, layers: [] }
}

/** Accepts only a structurally valid saved project (it comes from storage or a draft). */
export function sanitizeProject(value: unknown): DesignProject | null {
  const v = value as Partial<DesignProject> | null
  if (!v || v.version !== 1 || !Number.isFinite(v.width) || !Number.isFinite(v.height) || !v.background || !Array.isArray(v.layers)) return null
  if ((v.width as number) < 16 || (v.height as number) < 16 || (v.width as number) > 8192 || (v.height as number) > 8192) return null
  const layers = v.layers.filter((l) => l && typeof l.id === 'string' && ['image', 'text', 'shape'].includes((l as Layer).kind) && [l.x, l.y, l.w, l.h].every(Number.isFinite)) as Layer[]
  return { version: 1, width: v.width as number, height: v.height as number, background: { ...defaultBackground(), ...v.background }, layers }
}

const base = (kind: LayerKind, name: string, x: number, y: number, w: number, h: number): LayerBase => ({
  id: newId(kind), name, kind, x, y, w, h, rotation: 0, opacity: 1, locked: false, hidden: false,
})

/** A headline or subtitle placed where thumbnails usually carry text. */
export function makeTextLayer(project: DesignProject, preset: 'headline' | 'subtitle' = 'headline', text = ''): TextLayer {
  const w = Math.round(project.width * 0.6)
  const fontSize = Math.round(project.height * (preset === 'headline' ? 0.16 : 0.07))
  const h = Math.round(fontSize * 1.3 * (preset === 'headline' ? 2 : 1))
  return {
    ...base('text', preset === 'headline' ? 'Headline' : 'Subtitle', Math.round(project.width * 0.05), Math.round(project.height * (preset === 'headline' ? 0.55 : 0.82)), w, h),
    kind: 'text',
    text: text || (preset === 'headline' ? 'YOUR HEADLINE' : 'Supporting line'),
    fontFamily: DEFAULT_FONTS[preset === 'headline' ? 1 : 0],
    fontWeight: preset === 'headline' ? 900 : 700,
    fontSize,
    color: '#ffffff',
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.1,
    strokeColor: '#000000',
    strokeWidth: preset === 'headline' ? Math.max(2, Math.round(fontSize * 0.08)) : 0,
    shadow: preset === 'headline' ? { color: 'rgba(0,0,0,0.6)', blur: Math.round(fontSize * 0.15), offsetX: 0, offsetY: Math.round(fontSize * 0.06) } : null,
    box: null,
    highlight: { words: [], color: '#facc15' },
  }
}

export function makeImageLayer(project: DesignProject, src: string, naturalW: number, naturalH: number, role: ImageRole = 'photo'): ImageLayer {
  const maxW = project.width * (role === 'logo' ? 0.2 : 0.5)
  const maxH = project.height * (role === 'logo' ? 0.2 : 0.9)
  const scale = Math.min(maxW / Math.max(1, naturalW), maxH / Math.max(1, naturalH))
  const w = Math.round(naturalW * scale)
  const h = Math.round(naturalH * scale)
  const x = role === 'logo' ? project.width - w - Math.round(project.width * 0.04) : Math.round((project.width - w) / 2)
  const y = role === 'logo' ? Math.round(project.height * 0.04) : project.height - h
  return { ...base('image', role === 'subject' ? 'Subject' : role === 'logo' ? 'Logo' : role === 'screenshot' ? 'Screenshot' : 'Photo', x, y, w, h), kind: 'image', src, role, fit: 'contain', naturalW, naturalH, outline: 'none' }
}

export function makeShapeLayer(project: DesignProject, shape: ShapeType): ShapeLayer {
  const s = Math.round(project.height * 0.2)
  const dims: Record<ShapeType, [number, number]> = { arrow: [s * 1.4, s], circle: [s, s], rect: [s * 1.6, s], badge: [s * 1.6, s * 0.6], divider: [project.width * 0.4, Math.max(4, Math.round(project.height * 0.01))] }
  const [w, h] = dims[shape].map(Math.round) as [number, number]
  return {
    ...base('shape', shape[0].toUpperCase() + shape.slice(1), Math.round((project.width - w) / 2), Math.round((project.height - h) / 2), w, h),
    kind: 'shape', shape, fill: shape === 'circle' || shape === 'arrow' ? 'rgba(0,0,0,0)' : '#ef4444', stroke: shape === 'circle' || shape === 'arrow' ? '#ef4444' : 'rgba(0,0,0,0)', strokeWidth: Math.max(4, Math.round(project.height * 0.012)), label: shape === 'badge' ? 'NEW' : '',
  }
}

// ---------------------------------------------------------------- project operations

export const addLayer = (p: DesignProject, layer: Layer): DesignProject => ({ ...p, layers: [...p.layers, layer] })
export const removeLayer = (p: DesignProject, id: string): DesignProject => ({ ...p, layers: p.layers.filter((l) => l.id !== id) })

export function updateLayer<T extends Layer>(p: DesignProject, id: string, patch: Partial<T>): DesignProject {
  return { ...p, layers: p.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)) }
}

export function duplicateLayer(p: DesignProject, id: string): { project: DesignProject; id: string | null } {
  const i = p.layers.findIndex((l) => l.id === id)
  if (i < 0) return { project: p, id: null }
  const src = p.layers[i]
  const copy = { ...src, id: newId(src.kind), name: `${src.name} copy`, x: src.x + Math.round(p.width * 0.02), y: src.y + Math.round(p.height * 0.02), locked: false } as Layer
  const layers = [...p.layers.slice(0, i + 1), copy, ...p.layers.slice(i + 1)]
  return { project: { ...p, layers }, id: copy.id }
}

export type MoveDirection = 'front' | 'back' | 'forward' | 'backward'
export function moveLayer(p: DesignProject, id: string, dir: MoveDirection): DesignProject {
  const i = p.layers.findIndex((l) => l.id === id)
  if (i < 0) return p
  const layers = [...p.layers]
  const [item] = layers.splice(i, 1)
  const target = dir === 'front' ? layers.length : dir === 'back' ? 0 : dir === 'forward' ? Math.min(layers.length, i + 1) : Math.max(0, i - 1)
  layers.splice(target, 0, item)
  return { ...p, layers }
}

/** Keep a layer's centre inside the canvas (a layer may overhang, but never be lost off-canvas). */
export function clampLayer(p: DesignProject, layer: Layer): Layer {
  const cx = Math.min(p.width, Math.max(0, layer.x + layer.w / 2))
  const cy = Math.min(p.height, Math.max(0, layer.y + layer.h / 2))
  return { ...layer, x: Math.round(cx - layer.w / 2), y: Math.round(cy - layer.h / 2) } as Layer
}

// ---------------------------------------------------------------- geometry

export const toRad = (deg: number) => (deg * Math.PI) / 180

/** A canvas point in the layer's own (unrotated, centre-origin) coordinates. */
export function toLayerSpace(layer: Layer, px: number, py: number): { x: number; y: number } {
  const cx = layer.x + layer.w / 2
  const cy = layer.y + layer.h / 2
  const a = -toRad(layer.rotation)
  const dx = px - cx
  const dy = py - cy
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) }
}

export function layerContains(layer: Layer, px: number, py: number): boolean {
  const q = toLayerSpace(layer, px, py)
  return Math.abs(q.x) <= layer.w / 2 && Math.abs(q.y) <= layer.h / 2
}

/** Top-most visible, unlocked layer under the point. */
export function hitTest(p: DesignProject, px: number, py: number): Layer | null {
  for (let i = p.layers.length - 1; i >= 0; i--) {
    const l = p.layers[i]
    if (!l.hidden && !l.locked && layerContains(l, px, py)) return l
  }
  return null
}

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/**
 * Resize by dragging a handle. (dx, dy) is the pointer movement in canvas pixels; it is converted to the
 * layer's own axes, so rotated layers resize correctly. The opposite edge/corner stays fixed.
 */
export function resizeLayer(layer: Layer, handle: Handle, dx: number, dy: number, opts: { keepAspect?: boolean; minSize?: number } = {}): Layer {
  const min = opts.minSize ?? 16
  const a = -toRad(layer.rotation)
  const ldx = dx * Math.cos(a) - dy * Math.sin(a)
  const ldy = dx * Math.sin(a) + dy * Math.cos(a)
  const west = handle.includes('w')
  const east = handle.includes('e')
  const north = handle.includes('n')
  const south = handle.includes('s')
  let w = layer.w + (east ? ldx : 0) - (west ? ldx : 0)
  let h = layer.h + (south ? ldy : 0) - (north ? ldy : 0)
  if (opts.keepAspect && layer.w > 0 && layer.h > 0) {
    const ratio = layer.w / layer.h
    const corner = (west || east) && (north || south)
    if (corner) {
      if (Math.abs(w - layer.w) / layer.w >= Math.abs(h - layer.h) / layer.h) h = w / ratio
      else w = h * ratio
    } else if (west || east) h = w / ratio
    else w = h * ratio
  }
  w = Math.max(min, w)
  h = Math.max(min, h)
  // The fixed edge (in layer space) stays put: shift the centre by half the size change on the moving side.
  const shiftX = (east ? 1 : west ? -1 : 0) * ((w - layer.w) / 2)
  const shiftY = (south ? 1 : north ? -1 : 0) * ((h - layer.h) / 2)
  const r = toRad(layer.rotation)
  const cx = layer.x + layer.w / 2 + shiftX * Math.cos(r) - shiftY * Math.sin(r)
  const cy = layer.y + layer.h / 2 + shiftX * Math.sin(r) + shiftY * Math.cos(r)
  return { ...layer, w: Math.round(w), h: Math.round(h), x: Math.round(cx - w / 2), y: Math.round(cy - h / 2) } as Layer
}

/** Rotation angle (degrees) that points the layer's top towards the pointer, optionally snapped. */
export function rotationFromPointer(layer: Layer, px: number, py: number, snap = 0): number {
  const cx = layer.x + layer.w / 2
  const cy = layer.y + layer.h / 2
  let deg = (Math.atan2(py - cy, px - cx) * 180) / Math.PI + 90
  if (snap > 0) deg = Math.round(deg / snap) * snap
  deg = ((deg % 360) + 360) % 360
  return deg > 180 ? deg - 360 : deg
}

// ---------------------------------------------------------------- text layout

export type Measure = (text: string, font: string) => number
export const fontString = (l: Pick<TextLayer, 'fontWeight' | 'fontSize' | 'fontFamily'>) => `${l.fontWeight} ${l.fontSize}px ${l.fontFamily}`

/** Wrap text to a width. Explicit line breaks are kept; a single word longer than the width stays whole. */
export function wrapText(text: string, maxWidth: number, font: string, measure: Measure): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean)
    if (words.length === 0) { out.push(''); continue }
    let line = words[0]
    for (let i = 1; i < words.length; i++) {
      const next = `${line} ${words[i]}`
      if (measure(next, font) <= maxWidth) line = next
      else { out.push(line); line = words[i] }
    }
    out.push(line)
  }
  return out
}

export function textLayout(l: TextLayer, measure: Measure): { lines: string[]; lineHeightPx: number; height: number; widest: number } {
  const font = fontString(l)
  const pad = l.box ? l.box.padding : 0
  const lines = wrapText(l.text, Math.max(1, l.w - pad * 2), font, measure)
  const lineHeightPx = l.fontSize * l.lineHeight
  const widest = lines.reduce((m, line) => Math.max(m, measure(line, font)), 0)
  return { lines, lineHeightPx, height: lines.length * lineHeightPx + pad * 2, widest }
}

const normWord = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
export function isHighlighted(l: TextLayer, word: string): boolean {
  const n = normWord(word)
  return !!n && l.highlight.words.some((w) => normWord(w) === n)
}

// ---------------------------------------------------------------- quality checks

export interface DesignWarning {
  id: 'clipped-text' | 'low-contrast' | 'crowded' | 'outside-safe-area'
  layerId?: string
  message: string
}

function hexToRgb(color: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
const luminance = ([r, g, b]: [number, number, number]) => {
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
/** WCAG contrast ratio between two #hex colours; null when either is not a plain hex colour. */
export function contrastRatio(a: string, b: string): number | null {
  const ra = hexToRgb(a)
  const rb = hexToRgb(b)
  if (!ra || !rb) return null
  const la = luminance(ra)
  const lb = luminance(rb)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Text sits on the solid/gradient background or its own box. For picture backgrounds colour contrast is unknown. */
function backgroundSamples(p: DesignProject, l: TextLayer): string[] {
  if (l.box) return [l.box.color]
  if (p.background.mode === 'solid') return [p.background.color]
  if (p.background.mode === 'gradient') return [p.background.from, p.background.to]
  return []
}

export function designChecks(p: DesignProject, measure: Measure, opts: { safeMargin?: number } = {}): DesignWarning[] {
  const warnings: DesignWarning[] = []
  const margin = opts.safeMargin ?? 0.04
  const texts = p.layers.filter((l): l is TextLayer => l.kind === 'text' && !l.hidden && l.text.trim().length > 0)
  for (const t of texts) {
    const lay = textLayout(t, measure)
    if (lay.height > t.h + 1 || lay.widest > t.w - (t.box ? t.box.padding * 2 : 0) + 1) {
      warnings.push({ id: 'clipped-text', layerId: t.id, message: `"${t.name}" does not fit its box: make the box bigger or the text smaller.` })
    }
    const samples = backgroundSamples(p, t)
    const worst = samples.map((s) => contrastRatio(t.color, s)).filter((v): v is number => v !== null).reduce<number | null>((m, v) => (m === null ? v : Math.min(m, v)), null)
    if (worst !== null && worst < 3 && t.strokeWidth === 0) {
      warnings.push({ id: 'low-contrast', layerId: t.id, message: `"${t.name}" is hard to read against the background (contrast ${worst.toFixed(1)}:1). Pick a lighter or darker colour, or add an outline.` })
    }
  }
  for (const l of p.layers) {
    if (l.hidden) continue
    const mx = p.width * margin
    const my = p.height * margin
    if (l.kind === 'text' && (l.x < mx || l.y < my || l.x + l.w > p.width - mx || l.y + l.h > p.height - my)) {
      warnings.push({ id: 'outside-safe-area', layerId: l.id, message: `"${l.name}" is close to the edge and may be cut off on some screens.` })
    }
  }
  const textArea = texts.reduce((sum, t) => sum + t.w * t.h, 0)
  const overlapping = texts.some((a, i) => texts.slice(i + 1).some((b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h))
  if (textArea / (p.width * p.height) > 0.45 || overlapping) {
    warnings.push({ id: 'crowded', message: overlapping ? 'Two text layers overlap.' : 'There is a lot of text; thumbnails read best with a few big words.' })
  }
  return warnings
}
