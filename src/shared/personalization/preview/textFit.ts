/**
 * Deterministic text fitting for the Remotion preview.
 *
 * Measures text against the bundled Inter face (inlined as a base64 data URI
 * via `DESIGN_FONT_DATA_URI`), so preview and export use identical metrics.
 * Shrinks the font until the text fits its role's line and width limits,
 * clamped to a per-role minimum, inside a title-safe area.
 */

/** The title-safe inset as a fraction of composition width/height (5%). */
export const TITLE_SAFE_INSET = 0.05

/** Per-role text-fitting limits. */
export interface RoleFitLimits {
  /** Maximum number of lines the text may wrap to. */
  maxLines: number
  /** Maximum box width as a fraction of the title-safe width. */
  maxWidthRatio: number
  /** Minimum font size in px; the fitter will not shrink below this. */
  minFontSizePx: number
}

export const ROLE_FIT_LIMITS: Record<string, RoleFitLimits> = {
  headline: { maxLines: 2, maxWidthRatio: 0.80, minFontSizePx: 24 },
  offer: { maxLines: 2, maxWidthRatio: 0.85, minFontSizePx: 16 },
  cta: { maxLines: 1, maxWidthRatio: 0.60, minFontSizePx: 18 },
  businessName: { maxLines: 1, maxWidthRatio: 0.85, minFontSizePx: 18 },
}

/** The bundled family name used for measurement (matches the @font-face rule). */
const FONT_FAMILY = 'Personalization Sans'

/** Measure the width of a string at a given font size in px. */
function measureTextWidth(text: string, fontSizePx: number, weight: number): number {
  if (typeof document === 'undefined') {
    // Fallback estimate for server-side: average char width ~0.5em.
    return text.length * (fontSizePx * 0.5)
  }
  const canvas =
    document.createElement('canvas') || (new OffscreenCanvas(1000, 100) as unknown as HTMLCanvasElement)
  const ctx = canvas.getContext('2d')
  if (!ctx) return text.length * (fontSizePx * 0.5)
  ctx.font = `${weight} ${fontSizePx}px "${FONT_FAMILY}"`
  return ctx.measureText(text).width
}

/** Greedy word-wrap: estimate how many lines text takes at maxWidthPx. */
function estimateLines(text: string, maxWidthPx: number, fontSizePx: number, weight: number): number {
  const words = text.split(/\s+/)
  if (words.length === 0 || (words.length === 1 && words[0] === '')) return 0
  let lines = 1
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (measureTextWidth(candidate, fontSizePx, weight) > maxWidthPx) {
      lines++
      current = word
    } else {
      current = candidate
    }
  }
  return lines
}

export interface FitTextBoxInput {
  /** The text to fit. */
  text: string
  /** Role key into ROLE_FIT_LIMITS (e.g. 'headline', 'cta'). */
  role: string
  /** Composition width in px. */
  compW: number
  /** Composition height in px. */
  compH: number
  /** Base font size from the size slider (px). */
  fontSizePx: number
  /** Font weight (100..900). */
  weight?: number
}

export interface FitTextBoxOutput {
  /** Fitted font size in px. */
  fontSizePx: number
  /** Number of lines the text wraps to at this font size. */
  lines: number
  /** Width of the widest line in px. */
  widthPx: number
  /** Height of all lines in px (lines * lineHeight * fontSize). */
  heightPx: number
  /** Whether the text fit within the role limits without hitting min font size. */
  fits: boolean
}

/**
 * Fit text into its role's box by shrinking the font size until it fits within
 * the role's max lines and max width (inside the title-safe area).
 *
 * Returns the largest font size ≤ fontSizePx such that the text fits. If even
 * the minimum font size doesn't fit, returns the minimum and `fits: false`.
 */
export function fitTextBox(input: FitTextBoxInput): FitTextBoxOutput {
  const { text, role, compW, compH, fontSizePx, weight = 800 } = input
  const limits = ROLE_FIT_LIMITS[role] ?? ROLE_FIT_LIMITS.businessName

  const safeW = compW * (1 - TITLE_SAFE_INSET)
  const maxWidthPx = safeW * limits.maxWidthRatio
  const lineHeight = 1.25

  const trimmed = text.trim()
  if (!trimmed) {
    return { fontSizePx: limits.minFontSizePx, lines: 0, widthPx: 0, heightPx: 0, fits: true }
  }

  let size = Math.max(fontSizePx, limits.minFontSizePx)
  let lines = estimateLines(trimmed, maxWidthPx, size, weight)
  let widthPx = 0

  // Shrink until the text fits within maxLines and maxWidthPx.
  while (size > limits.minFontSizePx) {
    const measuredLines = estimateLines(trimmed, maxWidthPx, size, weight)
    if (measuredLines <= limits.maxLines) {
      lines = measuredLines
      // Width of the first (longest) line; estimate by measuring the full text.
      widthPx = measureTextWidth(trimmed, size, weight)
      if (widthPx <= maxWidthPx) break
    }
    size = Math.max(limits.minFontSizePx, Math.round(size * 0.95))
  }

  // Final measurement at the chosen size.
  lines = estimateLines(trimmed, maxWidthPx, size, weight)
  widthPx = measureTextWidth(trimmed, size, weight)
  const heightPx = lines * size * lineHeight
  const fits = lines <= limits.maxLines && widthPx <= maxWidthPx

  return { fontSizePx: size, lines, widthPx, heightPx, fits }
}
