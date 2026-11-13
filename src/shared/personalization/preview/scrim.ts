/**
 * Local text scrims.
 *
 * Instead of relying only on one flat dim over the whole frame, each headline /
 * name / tagline / offer gets a soft dark BAND behind its row: a full-width
 * strip that is darkest at the text and fades to nothing above and below it,
 * like a broadcast lower-third. Footage stays bright away from the text.
 *
 * It is built from a single `linear-gradient` on purpose. The in-browser
 * exporter (`@remotion/web-renderer`) only draws linear gradients; a
 * radial-gradient is silently dropped there, which would show in the preview
 * but vanish from the exported video.
 *
 * Pure geometry + CSS, shared by the composition (the render), the editor stage
 * (what the customer drags) and the layout quality check (so a scrim that is
 * really drawn counts toward readability, and one that is not drawn never does).
 */
import type React from 'react'
import type { PreviewLayer } from './types'

export interface ScrimRect {
  left: number
  top: number
  width: number
  height: number
}

/** A horizontal band, in the same pixel space as the rect it was built from. */
export interface Scrim {
  /** Vertical center of the band. */
  cy: number
  /** Half the band's height. */
  ry: number
  /** Width of the frame the band spans. */
  frameWidth: number
}

/** Darkest the scrim gets (at the text row). */
export const SCRIM_PEAK = 0.42
/** Share of the half-height (from the center) that stays at full strength. */
const CORE = 0.25

const SCRIM_KINDS: ReadonlySet<PreviewLayer['kind']> = new Set(['headline', 'businessName', 'tagline', 'offer'])

/** Only plain text layers get a scrim. The CTA pill carries its own background. */
export function hasTextScrim(kind: PreviewLayer['kind']): boolean {
  return SCRIM_KINDS.has(kind)
}

/** The band that comfortably covers a text box, in the box's own pixel space. */
export function scrimForBox(box: ScrimRect, compW: number, compH: number): Scrim {
  const pad = compH * 0.07
  return {
    cy: box.top + box.height / 2,
    ry: box.height / 2 + pad,
    frameWidth: compW,
  }
}

const smoothstep = (t: number) => t * t * (3 - 2 * t)

/** Strength at normalized distance `d` (0 = center, 1 = band edge) from the center line. */
function profile(d: number, peak: number): number {
  if (d >= 1) return 0
  if (d <= CORE) return peak
  return peak * (1 - smoothstep((d - CORE) / (1 - CORE)))
}

/** Alpha of the scrim at a point. Horizontal position does not matter: the band spans the frame. */
export function scrimAlphaAt(s: Scrim, _x: number, y: number, peak: number = SCRIM_PEAK): number {
  if (s.ry <= 0) return 0
  return profile(Math.abs(y - s.cy) / s.ry, peak)
}

/**
 * Alpha a text box can rely on: the LOWEST alpha over its top edge, center and
 * bottom edge, so the readability check never credits the scrim more than the
 * weakest part of the text actually gets.
 */
export function scrimAlphaOverBox(s: Scrim, box: ScrimRect, peak: number = SCRIM_PEAK): number {
  return Math.min(
    scrimAlphaAt(s, 0, box.top, peak),
    scrimAlphaAt(s, 0, box.top + box.height / 2, peak),
    scrimAlphaAt(s, 0, box.top + box.height, peak),
  )
}

const STOP_DISTANCES = [1, 0.85, 0.7, 0.55, 0.4, CORE] as const

/** CSS `linear-gradient` that fades the band in from its top edge, holds at the center, and out again. */
export function scrimBackground(peak: number = SCRIM_PEAK): string {
  const a = (v: number) => v.toFixed(3)
  const stop = (d: number, side: 'top' | 'bottom') => {
    const pos = side === 'top' ? 50 - d * 50 : 50 + d * 50
    return `rgba(0,0,0,${a(profile(d, peak))}) ${Math.round(pos * 10) / 10}%`
  }
  const top = STOP_DISTANCES.map((d) => stop(d, 'top'))
  const bottom = [...STOP_DISTANCES].reverse().map((d) => stop(d, 'bottom'))
  return `linear-gradient(to bottom, ${[...top, ...bottom].join(', ')})`
}

/** Inline style for the band element (place it inside a full-frame, pointer-events:none container). */
export function scrimStyle(s: Scrim, peak: number = SCRIM_PEAK): React.CSSProperties {
  return {
    position: 'absolute',
    left: 0,
    top: Math.round(s.cy - s.ry),
    width: Math.round(s.frameWidth),
    height: Math.max(1, Math.round(s.ry * 2)),
    background: scrimBackground(peak),
    pointerEvents: 'none',
  }
}
