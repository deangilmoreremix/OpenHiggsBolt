/**
 * Shared tokens for the adapted Remotion designs.
 *
 * Every design in `src/shared/personalization/remotion/designs/` was lifted
 * from a third-party Remotion template repository and adapted for THIS
 * repository's browser render path (Remotion `4.0.499`, `@remotion/web-renderer`).
 * The per-design source attribution and licence live in `registry.ts`.
 *
 * The upstream templates were authored for a 1080p frame, so their pixel
 * values are expressed as a fraction of `REFERENCE_HEIGHT` and re-scaled per
 * composition. That keeps the 9:16 / 1:1 / 4:5 exports geometrically identical
 * to the 16:9 one instead of collapsing to a 16:9-sized design.
 */

/**
 * The upstream templates all hardcode this system font stack. It is kept
 * verbatim on purpose: no design may depend on a network font fetch, because
 * the browser export engine is expected to run fully offline.
 */
export const REMOTION_DESIGN_FONT_SANS =
  '-apple-system, "Segoe UI", Roboto, sans-serif'

/** Composition height the upstream templates were authored against. */
export const REMOTION_DESIGN_REFERENCE_HEIGHT = 1080

/**
 * Scale factor for pixel values authored against a 1080p-tall composition.
 * `1` at 1080p, `0.5` at 540p, and so on.
 */
export function designScale(compositionHeight: number): number {
  const height = Number.isFinite(compositionHeight) ? compositionHeight : 0
  if (height <= 0) return 1
  return height / REMOTION_DESIGN_REFERENCE_HEIGHT
}

/**
 * Converts a hex colour into an `rgba()` string with the requested alpha.
 *
 * The upstream templates deliberately avoid colour parsing by stacking
 * translucent layers on top of each other. The adapted lower third needs a
 * genuinely translucent fill (the canvas renderer drops the frosted-glass
 * `backdrop-filter`, so the panel has to carry its own tint), which is why
 * this tiny parser exists.
 *
 * Values that are not hex colours (`rgb()`, `hsl()`, a CSS variable, …) are
 * returned unchanged so callers can still pass them straight through.
 */
export function withAlpha(color: string, alpha: number): string {
  const value = typeof color === 'string' ? color.trim() : ''
  const clamped = Math.min(1, Math.max(0, alpha))

  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (short) {
    const r = parseInt(short[1] + short[1], 16)
    const g = parseInt(short[2] + short[2], 16)
    const b = parseInt(short[3] + short[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${clamped})`
  }

  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  if (long) {
    const r = parseInt(long[1], 16)
    const g = parseInt(long[2], 16)
    const b = parseInt(long[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${clamped})`
  }

  return value
}
