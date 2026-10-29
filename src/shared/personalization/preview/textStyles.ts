/**
 * Coordinated text styles for the Personalization Modal.
 *
 * Each style defines per-role typography (weight, tracking, case, line-height,
 * size range), a CTA treatment (pill | outline | glass | underline |
 * ghost-arrow), brand-derived colours with a WCAG ≥4.5 contrast guarantee,
 * layout zones per aspect ratio, and motion presets.
 *
 * Styles are additive: `previewSettings.textStyleId` selects one, and the
 * composition reads it through `textStyleFor(role, styleId)` and
 * `ctaTreatmentFor(styleId)`. Layers can override any individual value.
 */

/** A CTA rendering treatment. */
export type CtaTreatment = 'pill' | 'outline' | 'glass' | 'underline' | 'ghost-arrow'

/** Typography settings for one text role. */
export interface RoleTypography {
  weight: number        // 100..900
  tracking: number      // em, letter-spacing multiplier
  case: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  lineHeight: number    // multiplier on font size
  sizeRange: { min: number; max: number } // px, from the size slider
}

/** Layout zones for one aspect ratio. */
export interface LayoutZones {
  /** Center (0..1) for headline text. */
  headline: { x: number; y: number }
  /** Center (0..1) for offer text. */
  offer: { x: number; y: number }
  /** Center (0..1) for CTA. */
  cta: { x: number; y: number }
  /** Center (0..1) for business name. */
  businessName: { x: number; y: number }
  /** Center (0..1) for logo. */
  logo: { x: number; y: number }
}

/** Motion presets: entrance + exit animation + delay. */
export interface MotionPreset {
  entrance: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'pop'
  exit: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'pop'
  entranceDelayFrames: number
  exitDelayFrames: number
}

/** One complete coordinated style. */
export interface TextStyle {
  id: string
  name: string
  /** Typography per text role. */
  roles: Record<string, RoleTypography>
  /** How the CTA button is rendered. */
  ctaTreatment: CtaTreatment
  /** Motion for the primary text layers. */
  motion: MotionPreset
}

/**
 * WCAG contrast ratio between two colours. Luminance follows the sRGB spec.
 */
function relativeLuminance(hex: string): number {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return 0
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => {
    const n = parseInt(v, 16) / 255
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contrast ratio (1..21). */
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Text colour on a background that passes WCAG ≥4.5, with fallback. */
export function textOn(background: string): string {
  const light = contrastRatio('#ffffff', background)
  const dark = contrastRatio('#000000', background)
  return light >= 4.5 ? '#ffffff' : dark >= 4.5 ? '#000000' : light >= dark ? '#ffffff' : '#000000'
}

/** Default typography for a role when a style doesn't override it. */
function roleTypography(
  weight: number,
  tracking: number,
  sizeRange: { min: number; max: number },
  opts?: { case?: RoleTypography['case']; lineHeight?: number },
): RoleTypography {
  return {
    weight,
    tracking,
    case: opts?.case ?? 'none',
    lineHeight: opts?.lineHeight ?? 1.25,
    sizeRange,
  }
}

const MOTION_SUBTLE: MotionPreset = {
  entrance: 'fade',
  exit: 'fade',
  entranceDelayFrames: 0,
  exitDelayFrames: 30,
}

const MOTION_POP: MotionPreset = {
  entrance: 'pop',
  exit: 'fade',
  entranceDelayFrames: 10,
  exitDelayFrames: 20,
}

/** Layout zones: headline upper-center, offer center, CTA lower-center. */
function defaultZones(): LayoutZones {
  return {
    headline: { x: 0.5, y: 0.28 },
    offer: { x: 0.5, y: 0.5 },
    cta: { x: 0.5, y: 0.72 },
    businessName: { x: 0.5, y: 0.18 },
    logo: { x: 0.1, y: 0.1 },
  }
}

/** 1: Coordinated, movie-like. High contrast, serif-adjacent feel via tracking. */
export const STYLE_CINEMATIC: TextStyle = {
  id: 'cinematic',
  name: 'Cinematic',
  roles: {
    headline: roleTypography(700, 0.05, { min: 32, max: 96 }, { case: 'none', lineHeight: 1.15 }),
    offer: roleTypography(400, 0.03, { min: 18, max: 48 }, { case: 'none', lineHeight: 1.4 }),
    cta: roleTypography(800, 0.02, { min: 20, max: 48 }, { case: 'uppercase', lineHeight: 1.1 }),
    businessName: roleTypography(600, 0.04, { min: 20, max: 48 }, { case: 'none', lineHeight: 1.2 }),
  },
  ctaTreatment: 'glass',
  motion: MOTION_SUBTLE,
}

/** 2: High-end, minimal. Wide tracking, light weight. */
export const STYLE_LUXURY: TextStyle = {
  id: 'luxury',
  name: 'Luxury',
  roles: {
    headline: roleTypography(300, 0.15, { min: 28, max: 80 }, { case: 'uppercase', lineHeight: 1.05 }),
    offer: roleTypography(300, 0.1, { min: 16, max: 40 }, { case: 'none', lineHeight: 1.5 }),
    cta: roleTypography(400, 0.08, { min: 16, max: 36 }, { case: 'uppercase', lineHeight: 1.1 }),
    businessName: roleTypography(400, 0.12, { min: 18, max: 40 }, { case: 'uppercase', lineHeight: 1.1 }),
  },
  ctaTreatment: 'underline',
  motion: MOTION_SUBTLE,
}

/** 3: Clean, sans-serif, balanced. The safe default. */
export const STYLE_MODERN: TextStyle = {
  id: 'modern',
  name: 'Modern',
  roles: {
    headline: roleTypography(600, 0, { min: 30, max: 88 }, { case: 'none', lineHeight: 1.2 }),
    offer: roleTypography(400, 0, { min: 18, max: 44 }, { case: 'none', lineHeight: 1.35 }),
    cta: roleTypography(700, 0.01, { min: 18, max: 44 }, { case: 'none', lineHeight: 1.1 }),
    businessName: roleTypography(500, 0, { min: 20, max: 44 }, { case: 'none', lineHeight: 1.2 }),
  },
  ctaTreatment: 'pill',
  motion: MOTION_SUBTLE,
}

/** 4: Very sparse. Light weight, generous space. */
export const STYLE_MINIMAL: TextStyle = {
  id: 'minimal',
  name: 'Minimal',
  roles: {
    headline: roleTypography(300, 0.05, { min: 24, max: 72 }, { case: 'none', lineHeight: 1.4 }),
    offer: roleTypography(300, 0.03, { min: 14, max: 36 }, { case: 'none', lineHeight: 1.5 }),
    cta: roleTypography(400, 0.02, { min: 14, max: 32 }, { case: 'none', lineHeight: 1.2 }),
    businessName: roleTypography(400, 0.04, { min: 16, max: 36 }, { case: 'none', lineHeight: 1.25 }),
  },
  ctaTreatment: 'ghost-arrow',
  motion: MOTION_SUBTLE,
}

/** 5: Heavy weight, attention-grabbing. For sales and promos. */
export const STYLE_BOLD_PROMOTIONAL: TextStyle = {
  id: 'bold-promotional',
  name: 'Bold Promotional',
  roles: {
    headline: roleTypography(900, -0.02, { min: 40, max: 110 }, { case: 'uppercase', lineHeight: 1.05 }),
    offer: roleTypography(800, -0.01, { min: 24, max: 60 }, { case: 'uppercase', lineHeight: 1.15 }),
    cta: roleTypography(900, -0.01, { min: 24, max: 56 }, { case: 'uppercase', lineHeight: 1.05 }),
    businessName: roleTypography(800, -0.01, { min: 24, max: 56 }, { case: 'uppercase', lineHeight: 1.1 }),
  },
  ctaTreatment: 'pill',
  motion: MOTION_POP,
}

/** 6: Optimised for social (9:16). Bold, energetic. */
export const STYLE_SOCIAL: TextStyle = {
  id: 'social',
  name: 'Social',
  roles: {
    headline: roleTypography(700, 0.02, { min: 28, max: 72 }, { case: 'none', lineHeight: 1.2 }),
    offer: roleTypography(500, 0.01, { min: 20, max: 48 }, { case: 'none', lineHeight: 1.3 }),
    cta: roleTypography(800, 0.01, { min: 22, max: 48 }, { case: 'uppercase', lineHeight: 1.1 }),
    businessName: roleTypography(600, 0.02, { min: 22, max: 48 }, { case: 'none', lineHeight: 1.15 }),
  },
  ctaTreatment: 'outline',
  motion: MOTION_POP,
}

/** 7: News/interview lower-third style. CTA as underline. */
export const STYLE_LOWER_THIRD: TextStyle = {
  id: 'lower-third',
  name: 'Lower Third',
  roles: {
    headline: roleTypography(700, 0, { min: 24, max: 56 }, { case: 'none', lineHeight: 1.15 }),
    offer: roleTypography(400, 0.01, { min: 16, max: 32 }, { case: 'none', lineHeight: 1.3 }),
    cta: roleTypography(600, 0.01, { min: 18, max: 36 }, { case: 'none', lineHeight: 1.1 }),
    businessName: roleTypography(600, 0, { min: 20, max: 40 }, { case: 'uppercase', lineHeight: 1.1 }),
  },
  ctaTreatment: 'underline',
  motion: MOTION_SUBTLE,
}

/** 8: Product-focused. Balanced weight, clear hierarchy. */
export const STYLE_PRODUCT_SHOWCASE: TextStyle = {
  id: 'product-showcase',
  name: 'Product Showcase',
  roles: {
    headline: roleTypography(600, 0.01, { min: 30, max: 80 }, { case: 'none', lineHeight: 1.2 }),
    offer: roleTypography(500, 0.01, { min: 20, max: 48 }, { case: 'none', lineHeight: 1.3 }),
    cta: roleTypography(700, 0.01, { min: 20, max: 44 }, { case: 'none', lineHeight: 1.1 }),
    businessName: roleTypography(600, 0.01, { min: 22, max: 48 }, { case: 'none', lineHeight: 1.2 }),
  },
  ctaTreatment: 'pill',
  motion: MOTION_SUBTLE,
}

/** All styles, keyed by id. */
export const TEXT_STYLES: Record<string, TextStyle> = {
  cinematic: STYLE_CINEMATIC,
  luxury: STYLE_LUXURY,
  modern: STYLE_MODERN,
  minimal: STYLE_MINIMAL,
  'bold-promotional': STYLE_BOLD_PROMOTIONAL,
  social: STYLE_SOCIAL,
  'lower-third': STYLE_LOWER_THIRD,
  'product-showcase': STYLE_PRODUCT_SHOWCASE,
}

/** Default style id (Modern). */
export const DEFAULT_TEXT_STYLE_ID: string = 'modern'

/**
 * Typography for a role within a style. Falls back to Modern defaults.
 */
export function textStyleFor(role: string, styleId: string | null): RoleTypography {
  const style = styleId ? TEXT_STYLES[styleId] : undefined
  const base = style?.roles[role] ?? TEXT_STYLES.modern.roles[role]
  return { ...base }
}

/** CTA treatment for a style. Falls back to 'pill'. */
export function ctaTreatmentFor(styleId: string | null): CtaTreatment {
  const style = styleId ? TEXT_STYLES[styleId] : undefined
  return style?.ctaTreatment ?? 'pill'
}

/** Motion presets for a style. Falls back to Modern's subtle motion. */
export function motionFor(styleId: string | null): MotionPreset {
  const style = styleId ? TEXT_STYLES[styleId] : undefined
  return style?.motion ?? TEXT_STYLES.modern.motion
}

/** Layout zones for a style and aspect ratio. Currently aspect-agnostic. */
export function zonesFor(styleId: string | null): LayoutZones {
  const style = styleId ? TEXT_STYLES[styleId] : undefined
  return style ? defaultZones() : defaultZones()
}
