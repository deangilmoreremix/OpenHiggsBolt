/**
 * Bridges the Remotion design catalogue to the personalization data the
 * customer already entered.
 *
 * The catalogue itself (`src/shared/personalization/remotion/registry.ts`)
 * knows NOTHING about the wizard: it declares which props carry editable
 * copy (`editableText`), which carry a brand colour (`brandColorProps`) and
 * which carry a customer asset (`brandAssetProps`) — but not WHICH business
 * field belongs in which prop. That mapping lives here, in the wizard's own
 * layer, so the registry stays a plain, reusable lookup table.
 *
 * Every value in this module comes from data that already exists:
 *   - copy   → business name, offer, call to action, phone, website
 *   - colours→ the preview's existing brand colours (primary / accent / text)
 *   - assets → the customer's existing primary logo
 *
 * Nothing here adds a new data-entry point: a customer who never touches the
 * design editor still gets a fully branded design.
 */

import {
  getRemotionDesign,
  resolveRemotionDesignProps,
  type RemotionDesign,
} from '../remotion/registry'
import type { PreviewBrandColors, PreviewInputProps } from '../preview/types'

/** The customer data a design is filled from. */
export interface DesignBrandContext {
  brand: PreviewInputProps['brand']
  brandColors: PreviewBrandColors
}

/** One design's mapping from the customer's data to the design's props. */
type DesignPropDeriver = (ctx: DesignBrandContext) => Record<string, unknown>

/** Hex colour → its RGB channels, or null when the value is not a hex colour. */
function parseHex(color: string): { r: number; g: number; b: number } | null {
  const value = typeof color === 'string' ? color.trim() : ''
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (short) {
    return {
      r: parseInt(short[1] + short[1], 16),
      g: parseInt(short[2] + short[2], 16),
      b: parseInt(short[3] + short[3], 16),
    }
  }
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  if (!long) return null
  return {
    r: parseInt(long[1], 16),
    g: parseInt(long[2], 16),
    b: parseInt(long[3], 16),
  }
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0')
}

/**
 * Blends a colour towards another one.
 *
 * Used to derive a design's gradient stops from the ONE brand colour the
 * customer picked, so a gradient never invents a hue the brand does not have.
 * Values that are not hex colours are returned unchanged.
 */
export function mixHex(color: string, towards: string, amount: number): string {
  const from = parseHex(color)
  const to = parseHex(towards)
  if (!from || !to) return color
  const ratio = Math.min(1, Math.max(0, amount))
  return `#${toHex(from.r + (to.r - from.r) * ratio)}${toHex(
    from.g + (to.g - from.g) * ratio,
  )}${toHex(from.b + (to.b - from.b) * ratio)}`
}

/**
 * The 1–3 letter mark used by the logo design when the customer has no raster
 * logo: the initials of their business name.
 */
export function designMonogram(businessName: string): string {
  const words = (businessName || '')
    .split(/[\s&-]+/)
    .map((word) => word.trim())
    .filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) {
    const single = words[0]
    return single.slice(0, 2).toUpperCase()
  }
  return words
    .slice(0, 3)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
}

/**
 * The social handle used by the reel design: the customer's website host
 * without the `www.` prefix, or a slug of their business name.
 */
export function designHandle(website: string, businessName: string): string {
  const host = (() => {
    const value = (website || '').trim()
    if (!value) return ''
    try {
      return new URL(value.includes('://') ? value : `https://${value}`).hostname
    } catch {
      return value.replace(/^www\./i, '').split('/')[0]
    }
  })()
    .replace(/^www\./i, '')
    .split('.')[0]
  if (host) return `@${host}`
  const slug = (businessName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 12)
  return slug ? `@${slug}` : ''
}

/** First non-empty value of a list of candidates. */
function firstText(...candidates: (string | undefined | null)[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate
    }
  }
  return ''
}

/**
 * The per-design mapping.
 *
 * Only the props a design declares as editable copy, brand colour or brand
 * asset are produced — everything else keeps the design's own defaults.
 */
const DESIGN_PROP_DERIVERS: Record<string, DesignPropDeriver> = {
  'bounce-in-headline': ({ brand, brandColors }) => ({
    // The offer is the punchiest thing the customer typed; the business name
    // is the fallback.
    headline: firstText(brand.offer, brand.headline, brand.businessName),
    background: brandColors.primary,
    color: brandColors.accent,
  }),

  'logo-mask-wipe': ({ brand, brandColors }) => ({
    monogram: designMonogram(brand.businessName),
    brandText: brand.businessName,
    backgroundColor: brandColors.primary,
    accentColor: brandColors.accent,
    textColor: brandColors.text,
    logoImageUrl: brand.logoUrl ?? '',
  }),

  'lower-third-glass-card': ({ brand, brandColors }) => ({
    nameText: brand.businessName,
    titleText: firstText(brand.offer, brand.cta, brand.headline),
    backgroundColor: brandColors.primary,
    accentColor: brandColors.accent,
    textColor: brandColors.text,
  }),

  'social-reel': ({ brand, brandColors }) => ({
    brandName: brand.businessName,
    handle: designHandle(brand.website, brand.businessName),
    headline: firstText(brand.offer, brand.headline),
    headlineAccent: firstText(brand.cta, brand.offer, brand.headline),
    secondCopy: firstText(brand.offer, brand.cta, brand.website),
    infoLines: [
      firstText(brand.offer, brand.cta),
      brand.phone,
      brand.website,
    ].filter((line) => line.trim().length > 0),
    ctaText: brand.cta,
    caption: brand.businessName
      ? `Made for ${brand.businessName}`
      : brand.website,
    accentColor: brandColors.accent,
    // The gradient is derived from the ONE brand colour, so it can never
    // introduce a hue the customer did not pick.
    bgFrom: brandColors.primary,
    bgVia: mixHex(brandColors.primary, '#000000', 0.3),
    bgTo: mixHex(brandColors.primary, '#000000', 0.6),
  }),

  'particle-explosion': ({ brand, brandColors }) => ({
    text: firstText(brand.offer, brand.cta, brand.businessName),
    color: brandColors.accent,
  }),
}

/**
 * The values a design derives from the customer's data, restricted to the
 * props the design actually declares.
 */
export function deriveDesignProps(
  design: RemotionDesign,
  ctx: DesignBrandContext,
): Record<string, unknown> {
  const deriver = DESIGN_PROP_DERIVERS[design.id]
  if (!deriver) return {}
  const derived = deriver(ctx)
  const allowed = new Set<string>([
    ...design.editableText,
    ...design.brandColorProps,
    ...design.brandAssetProps,
  ])
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(derived)) {
    if (allowed.has(key)) out[key] = derived[key]
  }
  return out
}

/**
 * The complete prop bag a design is rendered with: the design's own defaults,
 * the values derived from the customer's data, and finally the customer's own
 * edits (which always win).
 *
 * Unknown keys are dropped — `resolveRemotionDesignProps` only keeps the
 * props the design declares.
 */
export function buildDesignProps(input: {
  designId: string
  brand: PreviewInputProps['brand']
  brandColors: PreviewBrandColors
  overrides?: Record<string, unknown>
}): Record<string, unknown> {
  const design = getRemotionDesign(input.designId)
  if (!design) return {}
  const derived = deriveDesignProps(design, {
    brand: input.brand,
    brandColors: input.brandColors,
  })
  const merged: Record<string, unknown> = { ...derived, ...(input.overrides ?? {}) }
  return resolveRemotionDesignProps(design.id, merged)
}

/**
 * Friendly labels for the props the designer exposes.
 *
 * The raw prop names are internal (`bgVia`, `nameText`); the customer sees a
 * label instead. Unknown props fall back to a readable version of their name.
 */
const DESIGN_PROP_LABELS: Record<string, string> = {
  headline: 'Headline',
  headlineAccent: 'Headline accent',
  secondCopy: 'Second copy',
  brandName: 'Brand name',
  brandText: 'Brand name',
  monogram: 'Monogram',
  nameText: 'Name',
  titleText: 'Title',
  handle: 'Handle',
  infoLines: 'Info lines',
  ctaText: 'Call to action',
  caption: 'Caption',
  text: 'Text',
  background: 'Background',
  backgroundColor: 'Background',
  color: 'Text colour',
  textColor: 'Text colour',
  accentColor: 'Accent colour',
  bgFrom: 'Background start',
  bgVia: 'Background middle',
  bgTo: 'Background end',
}

/** A human-readable label for a design prop name (`bgFrom` → `Background start`). */
export function humanizeDesignProp(propName: string): string {
  const known = DESIGN_PROP_LABELS[propName]
  if (known) return known
  const spaced = propName
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
  if (!spaced) return propName
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
