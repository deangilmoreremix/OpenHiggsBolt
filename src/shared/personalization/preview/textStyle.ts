import type React from 'react'
import { fontStackById } from './presets'
import type { PreviewLayer } from './types'

/**
 * One source of truth for how overlay text LOOKS, used by the Remotion
 * composition (what the customer sees and exports) and by the editor stage
 * (what they drag around), so the two can never drift apart.
 *
 * Geometry (box position and size) stays in `toBox`; this file is styling only.
 */

export type TextStyleKind = Extract<PreviewLayer['kind'], 'businessName' | 'headline' | 'tagline' | 'offer' | 'cta'>

/**
 * Soft two-layer shadow: a wide glow for separation from busy footage and a
 * tight edge so letters stay crisp. Kept as plain CSS `text-shadow` (the
 * subset the browser-based web renderer supports); remove it here and both
 * the preview and the export lose it together.
 */
export const TEXT_SHADOW = '0 2px 14px rgba(0,0,0,.55), 0 1px 2px rgba(0,0,0,.6)'
export const PILL_SHADOW = '0 6px 18px rgba(0,0,0,.35)'

interface RoleStyle {
  fontWeight: number
  lineHeight: number
  letterSpacing: string
}

const ROLE_STYLE: Record<TextStyleKind, RoleStyle> = {
  headline: { fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.02em' },
  businessName: { fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.01em' },
  offer: { fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em' },
  tagline: { fontWeight: 500, lineHeight: 1.25, letterSpacing: '0.03em' },
  cta: { fontWeight: 800, lineHeight: 1.15, letterSpacing: '0.01em' },
}

export function isTextStyleKind(kind: PreviewLayer['kind']): kind is TextStyleKind {
  return kind in ROLE_STYLE
}

/** Style for a plain text layer (headline, tagline, business name, offer). */
export function layerTextStyle(
  kind: TextStyleKind,
  opts: { fontSizePx: number; color: string; fontFamily?: string },
): React.CSSProperties {
  const role = ROLE_STYLE[kind]
  return {
    fontFamily: fontStackById(opts.fontFamily),
    color: opts.color,
    fontSize: opts.fontSizePx,
    fontWeight: role.fontWeight,
    lineHeight: role.lineHeight,
    letterSpacing: role.letterSpacing,
    textAlign: 'center',
    width: '100%',
    // Only break a word that cannot fit on a line by itself.
    overflowWrap: 'break-word',
    textShadow: TEXT_SHADOW,
  }
}

/** Style for the call-to-action pill. `background` is the layer color; the label color is chosen by the caller. */
export function ctaPillStyle(opts: {
  fontSizePx: number
  background: string
  color: string
  fontFamily?: string
}): React.CSSProperties {
  const role = ROLE_STYLE.cta
  return {
    background: opts.background,
    color: opts.color,
    padding: '0.4em 1.1em',
    borderRadius: 999,
    display: 'inline-block',
    fontFamily: fontStackById(opts.fontFamily),
    fontSize: opts.fontSizePx,
    fontWeight: role.fontWeight,
    lineHeight: role.lineHeight,
    letterSpacing: role.letterSpacing,
    boxShadow: PILL_SHADOW,
  }
}
