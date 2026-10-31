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
  PreviewAudioSelection,
  PreviewBrandColors,
  PreviewLayer,
  PreviewLayerKind,
  PreviewLayoutId,
  PreviewPositionId,
} from './types'
import { DEFAULT_PREVIEW_BRAND_COLORS, DEFAULT_PREVIEW_FPS, DESIGN_SLOT_LAYER_IDS } from './types'
import type { DesignSlot } from './types'
import { getRemotionDesignTemplate } from '../templates/registry'
import type {
  RemotionDesignMediaRole,
  RemotionDesignTemplate,
} from '../templates/types'
// Phase 3 decision D3: the font picker resolves everything to the bundled,
// deterministic typeface. `templates/typography` imports nothing from
// `preview/`, so this import cannot form a cycle.
import { DESIGN_FONT_STACK } from '../templates/typography'

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
  'design',
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
  design: {
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

/** Frame shape a layout arranges itself for. */
export type LayoutShape = 'wide' | 'square' | 'tall'

/** 16:9 is wide; 1:1 and 4:5 are square; 9:16 is tall. */
export function layoutShapeFor(width: number, height: number): LayoutShape {
  const w = Number.isFinite(width) && width > 0 ? width : 1920
  const h = Number.isFinite(height) && height > 0 ? height : 1080
  const ratio = w / h
  if (ratio >= 1.3) return 'wide'
  if (ratio >= 0.75) return 'square'
  return 'tall'
}

type Placement = { x: number; y: number; scale: number }

/**
 * Where each layout puts its layers, per frame shape (centers + scale, the
 * same units as `PreviewLayer`). Every arrangement is checked by a unit test
 * so no two layers of a layout overlap at any aspect ratio: wide frames put
 * photos beside the text, square and tall frames stack them.
 */
export const LAYOUT_PLACEMENTS: Record<PreviewLayoutId, Record<LayoutShape, Partial<Record<PreviewLayerKind, Placement>>>> = {
  'business-introduction': {
    wide: { logo: { x: 0.12, y: 0.2, scale: 0.12 }, businessName: { x: 0.5, y: 0.62, scale: 0.07 }, headline: { x: 0.5, y: 0.75, scale: 0.045 } },
    square: { logo: { x: 0.5, y: 0.25, scale: 0.26 }, businessName: { x: 0.5, y: 0.56, scale: 0.065 }, headline: { x: 0.5, y: 0.68, scale: 0.045 } },
    tall: { logo: { x: 0.5, y: 0.25, scale: 0.4 }, businessName: { x: 0.5, y: 0.5, scale: 0.04 }, headline: { x: 0.5, y: 0.58, scale: 0.028 } },
  },
  'product-showcase': {
    wide: { logo: { x: 0.08, y: 0.12, scale: 0.08 }, productImage: { x: 0.72, y: 0.5, scale: 0.3 }, headline: { x: 0.3, y: 0.42, scale: 0.05 }, offer: { x: 0.3, y: 0.58, scale: 0.04 } },
    square: { logo: { x: 0.12, y: 0.1, scale: 0.14 }, productImage: { x: 0.5, y: 0.36, scale: 0.4 }, headline: { x: 0.5, y: 0.66, scale: 0.05 }, offer: { x: 0.5, y: 0.78, scale: 0.04 } },
    tall: { logo: { x: 0.15, y: 0.07, scale: 0.2 }, productImage: { x: 0.5, y: 0.33, scale: 0.7 }, headline: { x: 0.5, y: 0.62, scale: 0.032 }, offer: { x: 0.5, y: 0.75, scale: 0.026 } },
  },
  'service-promotion': {
    wide: { logo: { x: 0.08, y: 0.12, scale: 0.08 }, serviceImage: { x: 0.72, y: 0.5, scale: 0.3 }, headline: { x: 0.3, y: 0.42, scale: 0.05 }, tagline: { x: 0.3, y: 0.58, scale: 0.035 } },
    square: { logo: { x: 0.12, y: 0.1, scale: 0.14 }, serviceImage: { x: 0.5, y: 0.36, scale: 0.4 }, headline: { x: 0.5, y: 0.66, scale: 0.05 }, tagline: { x: 0.5, y: 0.78, scale: 0.035 } },
    tall: { logo: { x: 0.15, y: 0.07, scale: 0.2 }, serviceImage: { x: 0.5, y: 0.33, scale: 0.7 }, headline: { x: 0.5, y: 0.62, scale: 0.032 }, tagline: { x: 0.5, y: 0.75, scale: 0.024 } },
  },
  'special-offer': {
    wide: { headline: { x: 0.5, y: 0.28, scale: 0.065 }, offer: { x: 0.5, y: 0.48, scale: 0.08 }, cta: { x: 0.5, y: 0.72, scale: 0.05 } },
    square: { headline: { x: 0.5, y: 0.28, scale: 0.06 }, offer: { x: 0.5, y: 0.48, scale: 0.075 }, cta: { x: 0.5, y: 0.72, scale: 0.05 } },
    tall: { headline: { x: 0.5, y: 0.34, scale: 0.04 }, offer: { x: 0.5, y: 0.47, scale: 0.05 }, cta: { x: 0.5, y: 0.62, scale: 0.03 } },
  },
  'branded-ending': {
    wide: { logo: { x: 0.5, y: 0.26, scale: 0.14 }, businessName: { x: 0.5, y: 0.6, scale: 0.065 }, cta: { x: 0.5, y: 0.76, scale: 0.045 } },
    square: { logo: { x: 0.5, y: 0.28, scale: 0.26 }, businessName: { x: 0.5, y: 0.6, scale: 0.065 }, cta: { x: 0.5, y: 0.76, scale: 0.05 } },
    tall: { logo: { x: 0.5, y: 0.28, scale: 0.4 }, businessName: { x: 0.5, y: 0.5, scale: 0.04 }, cta: { x: 0.5, y: 0.6, scale: 0.03 } },
  },
}

/** A layout's default placement for one layer kind at a frame size. */
export function layoutPlacement(
  layoutId: PreviewLayoutId,
  kind: PreviewLayerKind,
  width: number,
  height: number,
): Placement | undefined {
  return LAYOUT_PLACEMENTS[layoutId]?.[layoutShapeFor(width, height)]?.[kind]
}

/**
 * The customer-facing font picker (Phase 3 decision D3).
 *
 * WHY THE HISTORICAL ENTRIES ARE ALL UNAVAILABLE: the four per-OS entries
 * (`inter`, `georgia`, `impact`, `monospace`) made the rendered result
 * machine-dependent — the same exported video picked SF Pro on macOS, Segoe
 * UI on Windows and whatever the generic family resolved to on Linux, so a
 * preview and its export could disagree. The bundled "Personalization Sans"
 * (see `templates/typography.ts`) is the only deterministic face, so it is
 * the only AVAILABLE entry. The historical entries stay in the list (with
 * their original stacks, as documentation of what the id used to mean) so a
 * saved layer with `fontFamily: 'georgia'` still matches an entry — but a
 * DISABLED one, and `fontStackById` resolves every id to the bundled stack.
 */
export const PREVIEW_FONTS: { id: string; label: string; stack: string; available: boolean }[] = [
  {
    id: 'inter',
    label: 'Inter (unavailable)',
    stack: 'Inter, ui-sans-serif, system-ui, sans-serif',
    available: false,
  },
  {
    id: 'georgia',
    label: 'Georgia (unavailable)',
    stack: "Georgia, 'Times New Roman', serif",
    available: false,
  },
  {
    id: 'impact',
    label: 'Impact (unavailable)',
    stack: "Impact, 'Arial Black', sans-serif",
    available: false,
  },
  {
    id: 'monospace',
    label: 'Monospace (unavailable)',
    stack: "ui-monospace, 'SF Mono', Menlo, monospace",
    available: false,
  },
  {
    id: 'personalization-sans',
    label: 'Personalization Sans',
    // `DESIGN_FONT_STACK` from `templates/typography` — the import is safe:
    // `templates/typography` imports only react, remotion and the static font
    // payload module, never anything from `preview/`, so there is no cycle.
    stack: DESIGN_FONT_STACK,
    available: true,
  },
]

/** The ONE bundled, deterministic stack — every id resolves to it. */
const BUNDLED_FONT_STACK = DESIGN_FONT_STACK

/** The default stack (no explicit family chosen) is the bundled stack. */
const DEFAULT_FONT_STACK = BUNDLED_FONT_STACK

/**
 * Resolves a layer's persisted `fontFamily` to the stack that is RENDERED.
 *
 * THE INVARIANT (Phase 3 decision D3): the rendered font MUST be the bundled
 * face for every id, so a saved Georgia layer renders with the bundled face
 * and export fidelity is guaranteed. The historical ids keep resolving (they
 * never throw, never fall into a per-OS stack) — but they resolve TO the
 * bundled stack. A customer therefore cannot force a per-OS font at all.
 */
export function fontStackById(id?: string): string {
  if (!id) return DEFAULT_FONT_STACK
  // The lookup stays for documentation: the id still identifies an entry, but
  // the entry's own (per-OS) stack is deliberately ignored in favour of the
  // bundled one.
  const match = PREVIEW_FONTS.find((font) => font.id === id || font.stack === id)
  return match ? BUNDLED_FONT_STACK : DEFAULT_FONT_STACK
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
    layers: LAYER_IDS_BY_LAYOUT['business-introduction'].map((kind) =>
      createLayer(kind, layoutPlacement('business-introduction', kind, width, height)),
    ),
    brandColors: { ...DEFAULT_PREVIEW_BRAND_COLORS },
    aspectRatio: '16:9',
    fps: DEFAULT_PREVIEW_FPS,
    durationInFrames: 150,
    showEndCard: true,
    width,
    height,
    audio: null,
    remotionDesignId: null,
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

function createSeededLayer(
  kind: PreviewLayerKind,
  ctx?: ApplyLayoutContext,
  placement?: { layoutId: PreviewLayoutId; width: number; height: number },
): PreviewLayer {
  const overrides: Partial<PreviewLayer> = {}
  const position = placement ? layoutPlacement(placement.layoutId, kind, placement.width, placement.height) : undefined
  if (position) Object.assign(overrides, position)
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
    return createSeededLayer(kind, ctx, { layoutId, width: settings.width, height: settings.height })
  })
  // Applied designs and scenes stack ON TOP of the layout: switching the
  // layout keeps them (and the customer's edits to them) after the layout.
  const designLayers = findDesignLayers(settings)
  const overlay = designLayers.find((layer) => designSlotOf(layer) === 'overlay')
  return {
    ...settings,
    layout: layoutId,
    layers: [...layers, ...designLayers.map((layer) => clampLayer({ ...layer }))],
    brandColors: { ...settings.brandColors },
    remotionDesignId: overlay ? (settings.remotionDesignId ?? overlay.designId ?? null) : null,
  }
}

/** Every applied design layer (overlay and scenes), in layer order. */
function findDesignLayers(settings: PersonalizationPreviewSettings): PreviewLayer[] {
  return (Array.isArray(settings.layers) ? settings.layers : []).filter(
    (layer) => layer && layer.kind === 'design',
  )
}

/** Which slot a design layer occupies, from its id. */
export function designSlotOf(layer: Pick<PreviewLayer, 'id'>): DesignSlot {
  if (layer.id === DESIGN_SLOT_LAYER_IDS.intro) return 'intro'
  if (layer.id === DESIGN_SLOT_LAYER_IDS.outro) return 'outro'
  return 'overlay'
}

/** True for the full-frame opening and closing scene layers. */
export function isSceneLayer(layer: Pick<PreviewLayer, 'id' | 'kind'>): boolean {
  return layer.kind === 'design' && designSlotOf(layer) !== 'overlay'
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
 *
 * Brand content the seed does not cover (e.g. a logo imageUrl when ctx.logoUrl
 * is missing because the asset has not been uploaded yet) is carried over from
 * the previous layer of the same kind, so the customer does not lose their
 * brand asset just because the seed is incomplete.
 */
export function resetLayoutToDefaults(
  settings: PersonalizationPreviewSettings,
  layoutId: PreviewLayoutId,
  ctx?: ApplyLayoutContext,
): PersonalizationPreviewSettings {
  const kinds = LAYER_IDS_BY_LAYOUT[layoutId] ?? LAYER_IDS_BY_LAYOUT['business-introduction']
  const previousByKind = new Map<string, PreviewLayer>()
  for (const layer of Array.isArray(settings.layers) ? settings.layers : []) {
    if (layer && typeof layer.kind === 'string') previousByKind.set(layer.kind, layer)
  }
  const layers = kinds.map((kind) => {
    const seeded = createSeededLayer(kind, ctx, { layoutId, width: settings.width, height: settings.height })
    const previous = previousByKind.get(kind)
    if (!previous) return seeded
    // Carry over brand content the seed did not provide. The seed wins when
    // it sets a value; otherwise the previous layer's text/imageUrl survives.
    const carry: Partial<PreviewLayer> = {}
    if (typeof seeded.text !== 'string' && typeof previous.text === 'string') {
      carry.text = previous.text
    }
    if (typeof seeded.imageUrl !== 'string' && typeof previous.imageUrl === 'string') {
      carry.imageUrl = previous.imageUrl
    }
    if (Object.keys(carry).length === 0) return seeded
    return { ...seeded, ...carry }
  })
  const reset: PersonalizationPreviewSettings = {
    ...settings,
    layout: layoutId,
    layers,
    brandColors: { ...settings.brandColors },
    remotionDesignId: null,
  }
  // Applied designs stay applied: each goes back to its own default placement
  // and timing while keeping the text the customer typed into it.
  let restored = reset
  for (const designLayer of findDesignLayers(settings)) {
    if (!designLayer.designId || !getRemotionDesignTemplate(designLayer.designId)) continue
    restored = applyDesignTemplate(
      { ...restored, layers: [...restored.layers, designLayer] },
      designLayer.designId,
      ctx,
      designSlotOf(designLayer),
    )
  }
  return restored
}

/**
 * Re-arranges a layout for a new frame shape after the aspect ratio changes.
 *
 * Only layers still sitting at the layout's default placement for the OLD
 * shape move to the default for the NEW shape; anything the customer moved or
 * resized keeps their edit. Pure: returns a new settings object.
 */
export function relayoutForAspect(
  prev: PersonalizationPreviewSettings,
  next: PersonalizationPreviewSettings,
): PersonalizationPreviewSettings {
  if (layoutShapeFor(prev.width, prev.height) === layoutShapeFor(next.width, next.height)) return next
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-3
  const layers = next.layers.map((layer) => {
    const before = layoutPlacement(next.layout, layer.kind, prev.width, prev.height)
    const after = layoutPlacement(next.layout, layer.kind, next.width, next.height)
    if (!before || !after) return layer
    const untouched = near(layer.x, before.x) && near(layer.y, before.y) && near(layer.scale, before.scale)
    return untouched ? clampLayer({ ...layer, ...after }) : layer
  })
  return { ...next, layers }
}

/** The layout a fresh preview starts from. */
const DEFAULT_PREVIEW_LAYOUT_ID: PreviewLayoutId = 'business-introduction'

/** Brand context key that seeds each media role a design can consume. */
const DESIGN_MEDIA_CONTEXT_KEYS: Record<RemotionDesignMediaRole, keyof ApplyLayoutContext> = {
  logo: 'logoUrl',
  product: 'productUrl',
  service: 'serviceUrl',
}

/** The slot the customer edits directly on the layer, if the design has one. */
function pickPrimaryTextSlot(design: RemotionDesignTemplate) {
  const slots = Array.isArray(design.textSlots) ? design.textSlots : []
  return slots.find((slot) => slot && slot.primary) ?? slots[0]
}

/** The media binding the layer's own `imageUrl` overrides, if there is one. */
function pickPrimaryMediaBinding(design: RemotionDesignTemplate) {
  const media = Array.isArray(design.media) ? design.media : []
  return media.find((binding) => binding && binding.required) ?? media[0]
}

/**
 * Applies a registered Remotion design to the preview settings.
 *
 * The design is added as a single `design` layer ON TOP of the layout's
 * layers (replacing any previously applied design). The layer carries the
 * design's own placement, its primary text slot and its primary media
 * binding. Brand colours, aspect ratio, fps, duration, the selected layout and
 * the audio track are all preserved, and the applied design is remembered in
 * `remotionDesignId` so it survives a reload.
 *
 * Pure: `prev` is never mutated and a new settings object is returned.
 * Applying the same design twice yields the same result (an already applied
 * design keeps the text the customer typed), and an unknown design id is a
 * no-op.
 */
export function applyDesignTemplate(
  prev: PersonalizationPreviewSettings,
  designId: string,
  ctx?: ApplyLayoutContext,
  slot: DesignSlot = 'overlay',
): PersonalizationPreviewSettings {
  const design = getRemotionDesignTemplate(designId)
  if (!design) return prev
  const layerId = DESIGN_SLOT_LAYER_IDS[slot]

  const existing = (Array.isArray(prev.layers) ? prev.layers : []).find(
    (layer) => layer && layer.id === layerId && layer.designId === design.id,
  )

  const primarySlot = pickPrimaryTextSlot(design)
  const text = primarySlot
    ? (existing?.text ?? nonEmptyString(ctx?.[primarySlot.field]))
    : undefined

  const primaryMedia = pickPrimaryMediaBinding(design)
  const imageUrl = primaryMedia
    ? (existing?.imageUrl ??
        nonEmptyString(ctx?.[DESIGN_MEDIA_CONTEXT_KEYS[primaryMedia.role]]))
    : undefined

  // The customer's edits to the SECONDARY text slots survive a re-apply of the
  // same design: the layer is rebuilt from scratch, so the overrides have to
  // be carried over explicitly (the primary slot is carried over through
  // `existing.text` above).
  const textSlotOverrides =
    existing?.designId === design.id ? existing.textSlotOverrides : undefined

  const placement = design.placement
  const overrides: Partial<PreviewLayer> = {
    designId: design.id,
    animation: placement?.animation ?? 'fade',
    animationDelay: design.animation?.delayInFrames ?? 0,
    startFrame: 0,
  }
  if (typeof placement?.x === 'number') overrides.x = placement.x
  if (typeof placement?.y === 'number') overrides.y = placement.y
  if (typeof placement?.scale === 'number') overrides.scale = placement.scale
  if (typeof placement?.opacity === 'number') overrides.opacity = placement.opacity
  if (text !== undefined) overrides.text = text
  if (imageUrl !== undefined) overrides.imageUrl = imageUrl
  if (textSlotOverrides) overrides.textSlotOverrides = textSlotOverrides

  if (slot !== 'overlay') {
    // A scene owns the whole frame for its own time window.
    Object.assign(
      overrides,
      design.role === 'scene'
        ? { x: 0.5, y: 0.5, scale: 1, opacity: 1, animation: 'fade' }
        : // Any other design keeps its own placement on the brand backdrop.
          { opacity: 1 },
      sceneWindow(design, prev),
    )
  }

  const layer = createLayer('design', { ...overrides, id: layerId })

  // The design stacks ON TOP of the layout: every other layer is kept, and
  // this slot's previous design is replaced. Scenes are drawn last, so they
  // cover the video and any overlay while they play.
  const others = (Array.isArray(prev.layers) ? prev.layers : []).filter((entry) => entry && entry.id !== layerId)
  const layers = [...others, layer].sort((a, b) => sceneOrder(a) - sceneOrder(b))

  const next: PersonalizationPreviewSettings = { ...prev, layers, brandColors: { ...prev.brandColors } }
  if (slot === 'overlay') {
    next.remotionDesignId = design.id
  } else {
    next.remotionSceneIds = { ...sceneIdsOf(prev), [slot]: design.id }
    // A closing scene replaces the branded end card: both own the last seconds.
    if (slot === 'outro') next.showEndCard = false
  }
  return next
}

/** Layout and overlay layers first, then the opening and closing scenes. */
function sceneOrder(layer: PreviewLayer): number {
  return isSceneLayer(layer) ? 1 : 0
}

function sceneIdsOf(settings: PersonalizationPreviewSettings): { intro: string | null; outro: string | null } {
  return { intro: settings.remotionSceneIds?.intro ?? null, outro: settings.remotionSceneIds?.outro ?? null }
}

/** Default scene length: three seconds. */
const DEFAULT_SCENE_SECONDS = 3

/**
 * How long an opening or closing scene plays. Scenes play BEFORE and AFTER the
 * video (they add to the total length), so a scene layer stores only its own
 * length: `startFrame: 0, endFrame: length - 1`. Where it sits on the timeline
 * comes from its slot (see `sceneLengths` / `totalDurationInFrames`).
 */
export function sceneWindow(
  design: RemotionDesignTemplate,
  settings: Pick<PersonalizationPreviewSettings, 'fps'>,
): { startFrame: number; endFrame: number } {
  const fps = settings.fps > 0 ? settings.fps : DEFAULT_PREVIEW_FPS
  const length = design.sceneDurationInFrames
    ? Math.round((design.sceneDurationInFrames / 30) * fps)
    : Math.round(DEFAULT_SCENE_SECONDS * fps)
  return { startFrame: 0, endFrame: Math.max(1, length) - 1 }
}

/** Frame length of a scene layer (older projects saved absolute windows). */
function sceneLayerLength(layer: PreviewLayer): number {
  const end = typeof layer.endFrame === 'number' ? layer.endFrame : layer.startFrame
  return Math.max(1, Math.round(end - layer.startFrame + 1))
}

/** Lengths of the visible opening and closing scenes, in frames (0 when none). */
export function sceneLengths(
  settings: Pick<PersonalizationPreviewSettings, 'layers'>,
): { intro: number; outro: number } {
  const out = { intro: 0, outro: 0 }
  for (const layer of Array.isArray(settings.layers) ? settings.layers : []) {
    if (!layer || !layer.visible || !isSceneLayer(layer)) continue
    out[designSlotOf(layer) as 'intro' | 'outro'] = sceneLayerLength(layer)
  }
  return out
}

/** Opening scene + the video itself + closing scene, in frames. */
export function totalDurationInFrames(
  settings: Pick<PersonalizationPreviewSettings, 'layers' | 'durationInFrames'>,
): number {
  const { intro, outro } = sceneLengths(settings)
  return intro + Math.max(1, Math.round(settings.durationInFrames || 1)) + outro
}

/**
 * Re-times the opening and closing scenes after the frame rate changes (their
 * authored length is in seconds). A new video length moves nothing: scenes
 * play before and after the video whatever its length. Pure.
 */
export function retimeScenes(settings: PersonalizationPreviewSettings): PersonalizationPreviewSettings {
  let changed = false
  const layers = settings.layers.map((layer) => {
    if (!isSceneLayer(layer) || !layer.designId) return layer
    const design = getRemotionDesignTemplate(layer.designId)
    if (!design) return layer
    const window = sceneWindow(design, settings)
    if (window.startFrame === layer.startFrame && window.endFrame === layer.endFrame) return layer
    changed = true
    return { ...layer, ...window }
  })
  return changed ? { ...settings, layers } : settings
}

/** Supported aspect ratio closest to a video's own width and height. */
export function closestAspectRatio(width: number, height: number): PreviewAspectRatio | null {
  if (!(width > 0) || !(height > 0)) return null
  const ratio = width / height
  let best: PreviewAspectRatio = '16:9'
  let bestDiff = Infinity
  for (const aspect of ASPECT_RATIOS) {
    const { width: w, height: h } = getCompositionDimensions(aspect)
    const diff = Math.abs(Math.log(ratio / (w / h)))
    if (diff < bestDiff) {
      best = aspect
      bestDiff = diff
    }
  }
  return best
}

/**
 * Removes the applied Remotion design and keeps the layout layers untouched.
 *
 * Pure: `prev` is never mutated and a new settings object is returned.
 */
export function removeDesignLayer(
  prev: PersonalizationPreviewSettings,
  slot: DesignSlot | 'all' = 'overlay',
): PersonalizationPreviewSettings {
  const drop = (layer: PreviewLayer) =>
    layer.kind === 'design' && (slot === 'all' || designSlotOf(layer) === slot)
  const next: PersonalizationPreviewSettings = {
    ...prev,
    layers: (Array.isArray(prev.layers) ? prev.layers : []).filter((layer) => layer && !drop(layer)),
    brandColors: { ...prev.brandColors },
  }
  if (slot === 'overlay' || slot === 'all') next.remotionDesignId = null
  if (slot !== 'overlay') {
    const ids = sceneIdsOf(prev)
    next.remotionSceneIds = slot === 'all' ? { intro: null, outro: null } : { ...ids, [slot]: null }
    // Removing the closing scene brings the branded end card back.
    if (slot === 'outro' && ids.outro) next.showEndCard = true
  }
  return next
}

/**
 * Clears the applied Remotion design and restores the default layout.
 *
 * Pure: `prev` is never mutated and a new settings object is returned.
 */
export function resetPreviewDesign(
  prev: PersonalizationPreviewSettings,
  ctx?: ApplyLayoutContext,
): PersonalizationPreviewSettings {
  return resetLayoutToDefaults(
    removeDesignLayer(prev, 'all'),
    DEFAULT_PREVIEW_LAYOUT_ID,
    ctx,
  )
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
 * Average glyph width as a fraction of the font size, used to estimate how
 * wide a text box must be. Shared with the editor's wrap estimate. Measured
 * against the bundled bold face: 0.55 was too narrow, so short two-word names
 * like "SmartVideo GO" wrapped onto a second line and ran into the next layer.
 */
export const TEXT_CHAR_WIDTH_RATIO = 0.62

/**
 * Converts normalized center coordinates plus scale into pixels.
 * Image layers use scale as a width fraction and are square; text layers use
 * scale as a fraction of the composition height for the font size; design
 * layers use scale as a fraction of the composition on BOTH axes, so the
 * design keeps the video's own shape inside its box.
 */
export function toBox(
  layer: PreviewLayer,
  compW: number,
  compH: number,
): { leftPx: number; topPx: number; widthPx: number; heightPx?: number; fontSizePx: number } {
  const width = Math.max(1, finiteNumber(compW, 1920))
  const height = Math.max(1, finiteNumber(compH, 1080))
  const scale = Math.min(1, Math.max(0.02, finiteNumber(layer.scale, 0.02)))
  const x = Math.min(1, Math.max(0, finiteNumber(layer.x, 0)))
  const y = Math.min(1, Math.max(0, finiteNumber(layer.y, 0)))

  if (layer.kind === 'design') {
    const widthPx = Math.round(scale * width)
    const heightPx = Math.round(scale * height)
    const leftPx = Math.round(x * width - widthPx / 2)
    const topPx = Math.max(0, Math.round(y * height - heightPx / 2))
    return { leftPx, topPx, widthPx, heightPx, fontSizePx: 0 }
  }

  if (isImageLayerKind(layer.kind)) {
    const widthPx = Math.round(scale * width)
    const leftPx = Math.round(x * width - widthPx / 2)
    const topPx = Math.max(0, Math.round(y * height - widthPx / 2))
    return { leftPx, topPx, widthPx, heightPx: widthPx, fontSizePx: 0 }
  }

  const fontSizePx = Math.round(scale * height)
  const chars = Math.max(4, (layer.text?.length ?? 8) * TEXT_CHAR_WIDTH_RATIO)
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
  // A design layer carries the id of the registered design it renders.
  const designId = nonEmptyString(raw.designId)
  if (designId) normalized.designId = designId
  // The per-slot text overrides of a design layer (the secondary slots). They
  // are dropped when they are absent, malformed or empty, so a saved project
  // keeps rendering the brand values for the slots the customer never edited.
  const textSlotOverrides = normalizeTextSlotOverrides(raw.textSlotOverrides)
  if (textSlotOverrides) normalized.textSlotOverrides = textSlotOverrides
  return normalized
}

/**
 * Normalizes the per-slot text overrides of a design layer.
 *
 * Only string entries survive: a malformed value must never reach the render,
 * and a blank entry is dropped by the resolver (which falls back to the brand
 * value). An empty map is equivalent to an absent one, so `undefined` is
 * returned for it.
 */
function normalizeTextSlotOverrides(raw: unknown): Record<string, string> | undefined {
  if (!isRecord(raw)) return undefined
  const out: Record<string, string> = {}
  for (const key of Object.keys(raw)) {
    if (typeof key !== 'string' || !key) continue
    const value = raw[key]
    if (typeof value !== 'string') continue
    out[key] = value
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Normalize a stored audio selection back into a usable form.
 *
 * Session-scoped blob/data URLs are dead after a reload, so they are refused:
 * the caller falls back to "no audio" instead of persisting a broken link.
 * A durable URL is kept as-is; everything else yields `null`.
 */
export function normalizePreviewAudio(raw: unknown): PreviewAudioSelection | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const rec = raw as Record<string, unknown>
  const url = typeof rec.url === 'string' ? rec.url.trim() : ''
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return null
  const name = typeof rec.name === 'string' && rec.name.trim().length > 0 ? rec.name : ''
  return { url, name }
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

   out.audio = normalizePreviewAudio(raw.audio) ?? null

   // The applied Remotion design. Absent in projects saved before the design
   // registry existed, so it falls back to null instead of throwing.
   out.remotionDesignId = nonEmptyString(raw.remotionDesignId) ?? null
   const rawScenes = isRecord(raw.remotionSceneIds) ? raw.remotionSceneIds : {}
   out.remotionSceneIds = {
     intro: nonEmptyString(rawScenes.intro) ?? null,
     outro: nonEmptyString(rawScenes.outro) ?? null,
   }

   return out
  } catch {
    return createDefaultPreviewSettings()
  }
}
