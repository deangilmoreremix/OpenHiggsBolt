/**
 * Local text scrims.
 *
 * Instead of relying only on one flat dim over the whole frame, each headline /
 * name / tagline / offer gets a soft dark ellipse behind it that fades to
 * nothing at its edge. Footage stays bright where there is no text, and the text
 * gets the separation it needs where there is.
 *
 * Pure geometry + CSS strings, shared by the composition (the render), the
 * editor stage (what the customer drags) and the layout quality check (so a
 * scrim that is really drawn counts toward readability, and one that is not
 * drawn never does).
 */
import type { PreviewLayer } from './types'

export interface ScrimRect {
  left: number
  top: number
  width: number
  height: number
}

/** An ellipse in the same pixel space as the rect it was built from. */
export interface Scrim {
  cx: number
  cy: number
  rx: number
  ry: number
}

/** Darkest the scrim gets (at its center). */
export const SCRIM_PEAK = 0.42
/** Fraction of the radius where the solid core ends and the falloff begins. */
const CORE = 0.25
/** How much the alpha has already dropped by the end of the core (0.25 = to 75%). */
const CORE_DROP = 0.4

const SCRIM_KINDS: ReadonlySet<PreviewLayer['kind']> = new Set(['headline', 'businessName', 'tagline', 'offer'])

/** Only plain text layers get a scrim. The CTA pill carries its own background. */
export function hasTextScrim(kind: PreviewLayer['kind']): boolean {
  return SCRIM_KINDS.has(kind)
}

/** The ellipse that comfortably covers a text box, in the box's own pixel space. */
export function scrimForBox(box: ScrimRect, compW: number, compH: number): Scrim {
  const pad = Math.min(compW, compH) * 0.08
  return {
    cx: box.left + box.width / 2,
    cy: box.top + box.height / 2,
    rx: (box.width / 2) * 1.2 + pad * 2.2,
    ry: (box.height / 2) * 1.6 + pad * 1.4,
  }
}

/** Alpha of the scrim at a point (0 outside the ellipse). */
export function scrimAlphaAt(s: Scrim, x: number, y: number, peak: number = SCRIM_PEAK): number {
  if (s.rx <= 0 || s.ry <= 0) return 0
  const d = Math.hypot((x - s.cx) / s.rx, (y - s.cy) / s.ry)
  if (d >= 1) return 0
  if (d <= CORE) return peak * (1 - (d / CORE) * CORE_DROP)
  return peak * (1 - CORE_DROP) * (1 - (d - CORE) / (1 - CORE))
}

/**
 * Alpha a text box can rely on: the LOWEST alpha over its center and corners,
 * so the readability check never credits the scrim more than the weakest part
 * of the text actually gets.
 */
export function scrimAlphaOverBox(s: Scrim, box: ScrimRect, peak: number = SCRIM_PEAK): number {
  const xs = [box.left, box.left + box.width]
  const ys = [box.top, box.top + box.height]
  let min = scrimAlphaAt(s, box.left + box.width / 2, box.top + box.height / 2, peak)
  for (const x of xs) for (const y of ys) min = Math.min(min, scrimAlphaAt(s, x, y, peak))
  return min
}

/** CSS `background` for the scrim, drawn over a full-frame element. */
export function scrimBackground(s: Scrim, peak: number = SCRIM_PEAK): string {
  const a = (v: number) => v.toFixed(3)
  const core = peak * (1 - CORE_DROP)
  return (
    `radial-gradient(ellipse ${Math.round(s.rx)}px ${Math.round(s.ry)}px at ${Math.round(s.cx)}px ${Math.round(s.cy)}px, ` +
    `rgba(0,0,0,${a(peak)}) 0%, rgba(0,0,0,${a(core)}) ${Math.round(CORE * 100)}%, rgba(0,0,0,0) 100%)`
  )
}
