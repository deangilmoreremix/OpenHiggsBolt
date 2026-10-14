/**
 * Layout presets, layer factories and normalization helpers for the
 * Personalization Modal's free Remotion preview.
 *
 * All coordinates are normalized (0..1 fractions of the composition size) and
 * every x/y pair describes the CENTER of a layer box.
 */

import type {
  PersonalizationPreviewSettings,
  PreviewAnimationId,
  PreviewAspectRatio,
  PreviewBrandColors,
  PreviewLayer,
  PreviewLayerKind,
  PreviewLayoutId,
  PreviewPositionId,
} from './types'
import { DEFAULT_PREVIEW_BRAND_COLORS, DEFAULT_PREVIEW_FPS } from './types'

const LAYER_KINDS: PreviewLayerKind[] = [
  'logo',
  'businessName',
  'headline',
  'offer',
  'cta',
  'productImage',
  'serviceImage',
  'tagline',
  'endCard',
]

const ANIMATION_IDS: PreviewAnimationId[] = [
  'none',
  'fade',
  'slide-up',
  'slide-down',
  'slide-left',
  'pop',
  'logo-reveal',
  'lower-third',
  'cta-pulse',
]

const LAYOUT_IDS: PreviewLayoutId[] = [
  'business-introduction',
  'product-showcase',
  'service-promotion',
  'special-offer',
  'branded-ending',
]

const ASPECT_RATIOS: PreviewAspectRatio[] = ['16:9', '9:16', '1:1', '4:5']

const IMAGE_LAYER_KINDS: PreviewLayerKind[] = ['logo', 'productImage', 'serviceImage']

export type PreviewLayerBase = Omit<PreviewLayer, 'id' | 'kind'>

const LAYER_DEFAULTS: Record<PreviewLayerKind, PreviewLayerBase> = {
  logo: {
    visible: true,
    x: 0.08,
    y: 0.08,
    scale: 0.22,
    animation: 'logo-reveal',
    animationDelay: 0,
    startFrame: 0,
    opacity: 1,
  },
  businessName: {
    visible: true,
    x: 0.08,
    y: 0.3,
    scale: 0.055,
    animation: 'slide-up',
    animationDelay: 0,
    startFrame: 0,
    opacity: 1,
  },
  headline: {
    visible: true,
    x: 0.08,
    y: 0.4,
    scale: 0.045,
    animation: 'slide-up',
    animationDelay: 0,
    startFrame: 0,
    opacity: 1,
  },
  tagline: {
    visible: true,
    x: 0.08,
    y: 0.48,
    scale: 0.032,
    animation: 'fade',
    animationDelay: 0,
    startFrame: 0,
    opacity: 1,
  },
  offer: {
    visible: true,
    x: 0.5,
    y: 0.55,
    scale: 0.05,
    animation: 'pop',
    animationDelay: 0,
    startFrame: 0,
    opacity: 1,
  },
  cta: {
    visible: true,
    x: 0.5,
    y: 0.78,
    scale: 0.04,
    animation: 'cta-pulse',
    animationDelay: 0,
    startFrame: 0,
    opacity: 1,
    color: DEFAULT_PREVIEW_BRAND_COLORS.accent,
  },
  productImage: {
    visible: true,
    x: 0.62,
    y: 0.55,
    scale: 0.3,
    animation: 'slide-left',
    animationDelay: 0,
    startFrame: 0,
    opacity: 1,
  },
  serviceImage: {
    visible: true,
    x: 0.62,
    y: 0.55,
    scale: 0.3,
    animation: 'slide-left',
    animationDelay: 0,
    startFrame: 0,
    opacity: 1,
  },
  endCard: {
    visible: true,
    x: 0.5,
    y: 0.5,
    scale: 1,
    animation: 'fade',
    animationDelay: 0,
    startFrame: 0,
    opacity: 1,
  },
}

export function getCompositionDimensions(
  aspectRatio: PreviewAspectRatio,
): { width: number; height: number } {
  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920 }
    case '1:1':
      return { width: 1080, height: 1080 }
    case '4:5':
      return { width: 1080, height: 1350 }
    case '16:9':
    default:
      return { width: 1920, height: 1080 }
  }
}

export const PREVIEW_LAYOUTS: {
  id: PreviewLayoutId
  name: string
  description: string
}[] = [
  {
    id: 'business-introduction',
    name: 'Business Introduction',
    description: 'Your logo and business name with an opening headline.',
  },
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    description: 'Product image with a title and promotional text.',
  },
  {
    id: 'service-promotion',
    name: 'Service Promotion',
    description: 'Service image with a description and your branding.',
  },
  {
    id: 'special-offer',
    name: 'Special Offer',
    description: 'Your promotional offer with an animated call to action.',
  },
  {
    id: 'branded-ending',
    name: 'Branded Ending',
    description: 'Logo, contact details and a final call to action.',
  },
]

export const PREVIEW_ANIMATIONS: { id: PreviewAnimationId; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'fade', label: 'Fade In' },
  { id: 'slide-up', label: 'Slide Up' },
  { id: 'slide-down', label: 'Slide Down' },
  { id: 'slide-left', label: 'Slide In' },
  { id: 'pop', label: 'Pop' },
  { id: 'logo-reveal', label: 'Logo Reveal' },
  { id: 'lower-third', label: 'Lower Third' },
  { id: 'cta-pulse', label: 'CTA Pulse' },
]

export const PREVIEW_POSITIONS: {
  id: PreviewPositionId
  label: string
  x: number
  y: number
}[] = [
  { id: 'top-left', label: 'Top Left', x: 0.06, y: 0.06 },
  { id: 'top-center', label: 'Top Center', x: 0.5, y: 0.06 },
  { id: 'top-right', label: 'Top Right', x: 0.94, y: 0.06 },
  { id: 'center', label: 'Center', x: 0.5, y: 0.5 },
  { id: 'lower-third', label: 'Lower Third', x: 0.5, y: 0.72 },
  { id: 'bottom-left', label: 'Bottom Left', x: 0.06, y: 0.88 },
  { id: 'bottom-center', label: 'Bottom Center', x: 0.5, y: 0.88 },
  { id: 'bottom-right', label: 'Bottom Right', x: 0.94, y: 0.88 },
]

export const LAYER_IDS_BY_LAYOUT: Record<PreviewLayoutId, PreviewLayerKind[]> = {
  'business-introduction': ['logo', 'businessName', 'headline'],
  'product-showcase': ['logo', 'productImage', 'headline', 'offer'],
  'service-promotion': ['logo', 'serviceImage', 'headline', 'tagline'],
  'special-offer': ['headline', 'offer', 'cta'],
  'branded-ending': ['logo', 'businessName', 'cta', 'endCard'],
}

export const PREVIEW_FONTS: { id: string; label: string; stack: string }[] = [
  {
    id: 'inter',
    label: 'Inter',
    stack: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: 'georgia',
    label: 'Georgia',
    stack: "Georgia, 'Times New Roman', serif",
  },
  {
    id: 'impact',
    label: 'Impact',
    stack: "Impact, 'Arial Black', sans-serif",
  },
  {
    id: 'monospace',
    label: 'Monospace',
    stack: "ui-monospace, 'SF Mono', Menlo, monospace",
  },
]

const DEFAULT_FONT_STACK = PREVIEW_FONTS[0].stack

export function fontStackById(id?: string): string {
  if (!id) return DEFAULT_FONT_STACK
  const match = PREVIEW_FONTS.find((font) => font.id === id || font.stack === id)
  return match ? match.stack : DEFAULT_FONT_STACK
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

/** Clamps a layer into safe, renderable bounds. Returns a new object. */
export function clampLayer(layer: PreviewLayer): PreviewLayer {
  const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
  const clamped: PreviewLayer = {
    ...layer,
    x: clamp01(finiteNumber(layer.x, 0)),
    y: clamp01(finiteNumber(layer.y, 0)),
    scale: Math.min(1, Math.max(0.02, finiteNumber(layer.scale, 0.02))),
    opacity: clamp01(finiteNumber(layer.opacity, 1)),
    animationDelay: Math.max(0, Math.round(finiteNumber(layer.animationDelay, 0))),
    startFrame: Math.max(0, Math.round(finiteNumber(layer.startFrame, 0))),
  }
  if (typeof layer.endFrame === 'number' && Number.isFinite(layer.endFrame)) {
    clamped.endFrame = Math.max(0, Math.round(layer.endFrame))
  } else {
    delete clamped.endFrame
  }
  return clamped
}

/** Builds a layer with per-kind defaults; overrides win over the defaults. */
export function createLayer(
  kind: PreviewLayerKind,
  overrides?: Partial<PreviewLayer>,
): PreviewLayer {
  const base = LAYER_DEFAULTS[kind] ?? LAYER_DEFAULTS.headline
  return clampLayer({
    id: kind,
    kind,
    ...base,
    ...overrides,
  })
}

export function createDefaultPreviewSettings(
  overrides?: Partial<PersonalizationPreviewSettings>,
): PersonalizationPreviewSettings {
  const { width, height } = getCompositionDimensions('16:9')
  const base: PersonalizationPreviewSettings = {
    layout: 'business-introduction',
    layers: LAYER_IDS_BY_LAYOUT['business-introduction'].map((kind) => createLayer(kind)),
    brandColors: { ...DEFAULT_PREVIEW_BRAND_COLORS },
    aspectRatio: '16:9',
    fps: DEFAULT_PREVIEW_FPS,
    durationInFrames: 150,
    showEndCard: true,
    width,
    height,
  }
  if (!overrides) return base
  const merged: PersonalizationPreviewSettings = {
    ...base,
    ...overrides,
    brandColors: { ...base.brandColors, ...(overrides.brandColors ?? {}) },
    layers: Array.isArray(overrides.layers)
      ? overrides.layers.map((layer) => clampLayer(layer))
      : base.layers.map((layer) => ({ ...layer })),
  }
  if (overrides.aspectRatio && overrides.width === undefined && overrides.height === undefined) {
    const dims = getCompositionDimensions(overrides.aspectRatio)
    merged.width = dims.width
    merged.height = dims.height
  }
  return merged
}

/** Optional brand context used to seed freshly created layers. */
export interface ApplyLayoutContext {
  businessName?: string
  headline?: string
  offer?: string
  cta?: string
  tagline?: string
  phone?: string
  website?: string
  logoUrl?: string
  productUrl?: string
  serviceUrl?: string
}

function createSeededLayer(kind: PreviewLayerKind, ctx?: ApplyLayoutContext): PreviewLayer {
  const overrides: Partial<PreviewLayer> = {}
  if (kind === 'headline') {
    const text = nonEmptyString(ctx?.headline)
    if (text) overrides.text = text
  } else if (kind === 'businessName') {
    const text = nonEmptyString(ctx?.businessName)
    if (text) overrides.text = text
  } else if (kind === 'offer') {
    const text = nonEmptyString(ctx?.offer)
    if (text) overrides.text = text
  } else if (kind === 'cta') {
    const text = nonEmptyString(ctx?.cta)
    if (text) overrides.text = text
  } else if (kind === 'tagline') {
    const text = nonEmptyString(ctx?.tagline) ?? nonEmptyString(ctx?.businessName)
    if (text) overrides.text = text
  } else if (kind === 'productImage') {
    const imageUrl = nonEmptyString(ctx?.productUrl)
    if (imageUrl) overrides.imageUrl = imageUrl
  } else if (kind === 'serviceImage') {
    const imageUrl = nonEmptyString(ctx?.serviceUrl)
    if (imageUrl) overrides.imageUrl = imageUrl
  } else if (kind === 'logo') {
    // The logo imageUrl is the customer's brand asset — it must survive a
    // "Restore default layout" so the user does not lose their uploaded logo
    // just because they dragged the layer and then reset geometry.
    const imageUrl = nonEmptyString(ctx?.logoUrl)
    if (imageUrl) overrides.imageUrl = imageUrl
  }
  return createLayer(kind, overrides)
}

/**
 * Rebuilds the layer list for a layout while preserving per-layer user edits
 * for layers whose id still exists in the new layout.
 */
export function applyLayoutPreset(
  settings: PersonalizationPreviewSettings,
  layoutId: PreviewLayoutId,
  ctx?: ApplyLayoutContext,
): PersonalizationPreviewSettings {
  const kinds = LAYER_IDS_BY_LAYOUT[layoutId] ?? LAYER_IDS_BY_LAYOUT['business-introduction']
  const existingById = new Map<string, PreviewLayer>()
  for (const layer of Array.isArray(settings.layers) ? settings.layers : []) {
    existingById.set(layer.id, layer)
  }
  const layers = kinds.map((kind) => {
    const kept = existingById.get(kind)
    if (kept) return clampLayer({ ...kept })
    return createSeededLayer(kind, ctx)
  })
  return {
    ...settings,
    layout: layoutId,
    layers,
    brandColors: { ...settings.brandColors },
  }
}

/**
 * Rebuilds a layout's layers from scratch so "Restore default layout" restores
 * default geometry: every layer goes back to the layout's default position,
 * scale, font size and visibility, and only the brand CONTENT (headline, offer,
 * CTA, tagline, phone, logo/product/service images) is re-seeded from ctx.
 *
 * This is deliberately different from `applyLayoutPreset`, which preserves the
 * user's per-layer edits so switching layouts never throws their work away.
 * Restoring defaults must throw that work away — otherwise the control cannot
 * undo a layout the user mangled.
 */
export function resetLayoutToDefaults(
  settings: PersonalizationPreviewSettings,
  layoutId: PreviewLayoutId,
  ctx?: ApplyLayoutContext,
): PersonalizationPreviewSettings {
  const kinds = LAYER_IDS_BY_LAYOUT[layoutId] ?? LAYER_IDS_BY_LAYOUT['business-introduction']
  const layers = kinds.map((kind) => createSeededLayer(kind, ctx))
  return {
    ...settings,
    layout: layoutId,
    layers,
    brandColors: { ...settings.brandColors },
  }
}

/** Center coordinates (0..1) for a position preset; identity when unknown. */
export function positionForLayer(
  layer: PreviewLayer,
  positionId: PreviewPositionId,
): { x: number; y: number } {
  const preset = PREVIEW_POSITIONS.find((entry) => entry.id === positionId)
  if (!preset) return { x: layer.x, y: layer.y }
  return { x: preset.x, y: preset.y }
}

export function isImageLayerKind(kind: PreviewLayerKind): boolean {
  return IMAGE_LAYER_KINDS.includes(kind)
}

/**
 * Converts normalized center coordinates plus scale into pixels.
 * Image layers use scale as a width fraction and are square; text layers use
 * scale as a fraction of the composition height for the font size.
 */
export function toBox(
  layer: PreviewLayer,
  compW: number,
  compH: number,
): { leftPx: number; topPx: number; widthPx: number; fontSizePx: number } {
  const width = Math.max(1, finiteNumber(compW, 1920))
  const height = Math.max(1, finiteNumber(compH, 1080))
  const scale = Math.min(1, Math.max(0.02, finiteNumber(layer.scale, 0.02)))
  const x = Math.min(1, Math.max(0, finiteNumber(layer.x, 0)))
  const y = Math.min(1, Math.max(0, finiteNumber(layer.y, 0)))

  if (isImageLayerKind(layer.kind)) {
    const widthPx = Math.round(scale * width)
    const leftPx = Math.round(x * width - widthPx / 2)
    const topPx = Math.max(0, Math.round(y * height - widthPx / 2))
    return { leftPx, topPx, widthPx, fontSizePx: 0 }
  }

  const fontSizePx = Math.round(scale * height)
  const chars = Math.max(4, (layer.text?.length ?? 8) * 0.55)
  const widthPx = Math.round(Math.min(width * 0.9, fontSizePx * chars))
  const leftPx = Math.round(x * width - widthPx / 2)
  const topPx = Math.max(0, Math.round(y * height - fontSizePx / 2))
  return { leftPx, topPx, widthPx, fontSizePx }
}

function normalizeLayer(raw: unknown): PreviewLayer | null {
  if (!isRecord(raw)) return null
  if (typeof raw.kind !== 'string' || !LAYER_KINDS.includes(raw.kind as PreviewLayerKind)) {
    return null
  }
  const kind = raw.kind as PreviewLayerKind
  const base = createLayer(kind)
  const normalized: PreviewLayer = {
    ...base,
    id: nonEmptyString(raw.id) ?? base.id,
    visible: typeof raw.visible === 'boolean' ? raw.visible : base.visible,
    x: finiteNumber(raw.x, base.x),
    y: finiteNumber(raw.y, base.y),
    scale: finiteNumber(raw.scale, base.scale),
    opacity: finiteNumber(raw.opacity, base.opacity),
    animation:
      typeof raw.animation === 'string' && ANIMATION_IDS.includes(raw.animation as PreviewAnimationId)
        ? (raw.animation as PreviewAnimationId)
        : base.animation,
    animationDelay: finiteNumber(raw.animationDelay, base.animationDelay),
    startFrame: finiteNumber(raw.startFrame, base.startFrame),
  }
  if (typeof raw.endFrame === 'number' && Number.isFinite(raw.endFrame)) {
    normalized.endFrame = Math.max(0, Math.round(raw.endFrame))
  }
  if (typeof raw.text === 'string') normalized.text = raw.text
  const color = nonEmptyString(raw.color)
  if (color) normalized.color = color
  const fontFamily = nonEmptyString(raw.fontFamily)
  if (fontFamily) normalized.fontFamily = fontFamily
  const imageUrl = nonEmptyString(raw.imageUrl)
  // Reject session-scoped blob URLs: they are dead after a page reload.
  if (imageUrl && !imageUrl.startsWith('blob:')) normalized.imageUrl = imageUrl
  return normalized
}

/**
 * Defensive normalization for missing, invalid or older persisted settings.
 * Never throws: any unusable value falls back to a safe default.
 */
export function normalizePreviewSettings(raw: unknown): PersonalizationPreviewSettings {
  const base = createDefaultPreviewSettings()
  try {
    if (!isRecord(raw)) return base
    const out: PersonalizationPreviewSettings = {
      ...base,
      brandColors: { ...base.brandColors },
      layers: base.layers.map((layer) => ({ ...layer })),
    }

    if (typeof raw.layout === 'string' && LAYOUT_IDS.includes(raw.layout as PreviewLayoutId)) {
      out.layout = raw.layout as PreviewLayoutId
    }

    const colors = isRecord(raw.brandColors) ? raw.brandColors : null
    if (colors) {
      const brandColors: PreviewBrandColors = { ...out.brandColors }
      const primary = nonEmptyString(colors.primary)
      if (primary) brandColors.primary = primary
      const accent = nonEmptyString(colors.accent)
      if (accent) brandColors.accent = accent
      const text = nonEmptyString(colors.text)
      if (text) brandColors.text = text
      if (typeof colors.backgroundDim === 'number' && Number.isFinite(colors.backgroundDim)) {
        brandColors.backgroundDim = Math.min(1, Math.max(0, colors.backgroundDim))
      }
      out.brandColors = brandColors
    }

    if (
      typeof raw.aspectRatio === 'string' &&
      ASPECT_RATIOS.includes(raw.aspectRatio as PreviewAspectRatio)
    ) {
      out.aspectRatio = raw.aspectRatio as PreviewAspectRatio
      const dims = getCompositionDimensions(out.aspectRatio)
      out.width = dims.width
      out.height = dims.height
    }

    if (
      typeof raw.width === 'number' &&
      Number.isFinite(raw.width) &&
      raw.width >= 16
    ) {
      out.width = Math.round(raw.width)
    }
    if (
      typeof raw.height === 'number' &&
      Number.isFinite(raw.height) &&
      raw.height >= 16
    ) {
      out.height = Math.round(raw.height)
    }
    if (typeof raw.fps === 'number' && Number.isFinite(raw.fps) && raw.fps >= 1) {
      out.fps = Math.min(120, Math.round(raw.fps))
    }
    if (
      typeof raw.durationInFrames === 'number' &&
      Number.isFinite(raw.durationInFrames) &&
      raw.durationInFrames >= 1
    ) {
      out.durationInFrames = Math.min(36000, Math.round(raw.durationInFrames))
    }
    if (typeof raw.showEndCard === 'boolean') out.showEndCard = raw.showEndCard

    if (Array.isArray(raw.layers)) {
      const seen = new Set<string>()
      const layers: PreviewLayer[] = []
      for (const entry of raw.layers) {
        const normalized = normalizeLayer(entry)
        if (!normalized) continue
        let id = normalized.id
        let suffix = 2
        while (seen.has(id)) {
          id = `${normalized.id}-${suffix}`
          suffix += 1
        }
        seen.add(id)
        layers.push(clampLayer({ ...normalized, id }))
      }
      out.layers =
        layers.length > 0
          ? layers
          : LAYER_IDS_BY_LAYOUT[out.layout].map((kind) => createLayer(kind))
    }

    return out
  } catch {
    return createDefaultPreviewSettings()
  }
}
