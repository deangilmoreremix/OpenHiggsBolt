/**
 * autoStyleComposition — one-click "make it look professional".
 *
 * Pure function: returns new settings with zones, harmonised colours and
 * staggered timing applied. Does not mutate `settings`. Typography fitting is
 * handled by `toBox` → `fitTextBox` at render time.
 *
 * Timing (staggered, in frames at 30fps):
 *   • Logo:      0–1s   (frames 0–30)
 *   • Headline:  1s     (frame 30)
 *   • Offer:     3s     (frame 90)
 *   • CTA:       last, before exit
 *   • Everything else: between headline and offer
 *
 * Simple Mode applies this automatically on first entering Step 4.
 * Advanced Mode gets a one-click button.
 */

import type {
  PersonalizationPreviewSettings,
  PreviewBrandColors,
} from './types'
import { ctaTreatmentFor, zonesFor, textOn } from './textStyles'

const FPS = 30

/** Per-layer kind start frame (staggered timing). */
const START_FRAMES: Record<string, number> = {
  logo: 0,
  businessName: FPS, // 1s
  headline: FPS, // 1s
  tagline: 2 * FPS, // 2s
  productImage: 2 * FPS,
  serviceImage: 2 * FPS,
  offer: 3 * FPS, // 3s
  cta: 4 * FPS, // after offer
  endCard: 5 * FPS,
  design: 0,
}

/** Exit offset from composition end. */
const EXIT_OFFSET_FRAMES = FPS // 1s before end

/**
 * Apply a coordinated style to preview settings: zones, harmonised colours,
 * stagger timing. Pure — returns a new settings object.
 */
export function autoStyleComposition(
  settings: PersonalizationPreviewSettings,
  brand: PreviewBrandColors,
  styleId: string | null,
): PersonalizationPreviewSettings {
  const zones = zonesFor(styleId)
  const { width, height, durationInFrames } = settings

  const layers = settings.layers.map((layer) =>
    styleLayer(layer, zones, settings, brand, durationInFrames),
  )

  return {
    ...settings,
    layers,
    textStyleId: styleId ?? settings.textStyleId,
    brandColors: harmoniseColours(settings.brandColors, zones),
  }
}

/** Style a single layer: zone, timing, colour. */
function styleLayer(
  layer: PersonalizationPreviewSettings['layers'][number],
  zones: ReturnType<typeof zonesFor>,
  settings: PersonalizationPreviewSettings,
  brand: PreviewBrandColors,
  totalFrames: number,
) {
  const zone = zones[layer.kind as keyof typeof zones]
  const isDefaultCenter = layer.x === 0.5 && layer.y === 0.5
  const x = isDefaultCenter ? zone.x : layer.x
  const y = isDefaultCenter ? zone.y : layer.y

  const startFrame = START_FRAMES[layer.kind] ?? 0
  const endFrame =
    layer.kind === 'cta' || layer.kind === 'endCard'
      ? undefined
      : Math.max(startFrame + 1, totalFrames - EXIT_OFFSET_FRAMES)

  const colour =
    layer.color ??
    (layer.kind === 'cta' ? textOn(brand.accent) : brand.text)

  return {
    ...layer,
    x,
    y,
    animation: layer.animation || 'fade',
    animationDelay: 0,
    startFrame,
    endFrame,
    opacity: layer.opacity,
    color: colour,
  }
}

/** Harmonise brand colours so text-on-accent passes WCAG ≥4.5. */
function harmoniseColours(
  colours: PreviewBrandColors,
  _zones: ReturnType<typeof zonesFor>,
): PreviewBrandColors {
  if (contrastRatio(colours.text, colours.accent) < 4.5) {
    return { ...colours, text: textOn(colours.accent) }
  }
  return colours
}

/** WCAG contrast ratio. */
function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Relative luminance of a hex colour. */
function luminance(hex: string): number {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return 0
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => {
    const n = parseInt(v, 16) / 255
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
