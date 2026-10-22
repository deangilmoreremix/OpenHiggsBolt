/**
 * Remotion design registry.
 *
 * A catalogue of the adapted Remotion designs that this repository can render
 * in the browser (Remotion `4.0.499`, `@remotion/web-renderer`).
 *
 * The registry is deliberately SEPARATE from the personalization wizard:
 *  - it knows nothing about the wizard's layout presets, layer model or the
 *    four-step flow;
 *  - it is a plain, typed lookup table that any caller (wizard, preview
 *    player, export pipeline, marketing site) can consume on its own.
 *
 * Every design was lifted from a third-party Remotion template repository and
 * adapted for this repository's browser render path. The upstream source, the
 * upstream licence and the attribution note are recorded per design in
 * `RemotionDesign.source`, and the same attribution is repeated in the
 * header comment of each adapted component under `src/shared/personalization/
 * remotion/designs/`.
 *
 * See `docs/REMOTION_TEMPLATE_INVENTORY.md` for the full 138-template
 * inventory these five were selected from.
 */

import type React from 'react'
import {
  BounceInHeadline,
  defaultBounceInHeadlineProps,
  BOUNCE_IN_HEADLINE_DURATION_FRAMES,
} from './designs/bounce-in-headline'
import {
  LogoMaskWipe,
  defaultLogoMaskWipeProps,
  LOGO_MASK_WIPE_DURATION_FRAMES,
} from './designs/logo-mask-wipe'
import {
  LowerThirdGlassCard,
  defaultLowerThirdGlassCardProps,
  LOWER_THIRD_GLASS_CARD_DURATION_FRAMES,
} from './designs/lower-third-glass-card'
import {
  SocialReel,
  defaultSocialReelProps,
  SOCIAL_REEL_DURATION_FRAMES,
} from './designs/social-reel'
import {
  ParticleExplosion,
  defaultParticleExplosionProps,
} from './designs/particle-explosion'

/** Stable identifiers for every design in the registry. */
export type RemotionDesignId =
  | 'bounce-in-headline'
  | 'logo-mask-wipe'
  | 'lower-third-glass-card'
  | 'social-reel'
  | 'particle-explosion'

/**
 * A design's props as a plain JSON-serialisable bag.
 *
 * `renderMediaOnWeb({ inputProps })` only accepts JSON-serialisable data, so
 * every design in this registry is driven exclusively by primitives, strings
 * and string arrays.
 */
export interface RemotionDesignProps {
  [key: string]: unknown
}

/** What kind of job the design does. */
export type RemotionDesignCategory =
  | 'headline'
  | 'logo'
  | 'lower-third'
  | 'cta'
  | 'effect'

/**
 * Where the design may be used.
 *
 * - `full-frame` — the design paints the whole scene and replaces the frame.
 * - `overlay` — the design is transparent and composites over the customer's
 *   existing footage.
 */
export type RemotionDesignPlacement = 'full-frame' | 'overlay'

/** Kind of media slot a design can consume. */
export type RemotionDesignMediaKind = 'logo' | 'image' | 'video' | 'font'

/**
 * How a media slot is satisfied when the customer has not supplied anything.
 *
 * - `inline-art` — the design draws the mark itself (SVG/CSS geometry).
 * - `prop-default` — the design ships a sensible default prop value.
 * - `system-font` — the design uses a system font stack, so no asset is needed.
 * - `none` — there is no fallback; the slot is genuinely required.
 */
export type RemotionDesignMediaFallback =
  | 'inline-art'
  | 'prop-default'
  | 'system-font'
  | 'none'

/** Provenance of an adapted design. */
export interface RemotionDesignSource {
  /** Upstream repository the design was adapted from. */
  repo: string
  /** Path of the upstream file inside that repository. */
  file: string
  /** Upstream licence identifier (SPDX-style where one exists). */
  license: string
  /** Human-readable attribution / licensing note carried from upstream. */
  attribution?: string
}

/** A media slot a design can consume. */
export interface RemotionDesignRequiredMedia {
  /** Stable name of the slot, e.g. `monogram`. */
  name: string
  /** Kind of asset the slot expects. */
  kind: RemotionDesignMediaKind
  /** True when the design cannot render correctly without it. */
  required: boolean
  /** Prop names that can supply this media. Empty for inline-drawn art. */
  suppliedBy: string[]
  /** How the design renders when nothing is supplied. */
  fallback: RemotionDesignMediaFallback
}

/** One entry of the registry. */
export interface RemotionDesign {
  /** Stable, unique id. */
  id: RemotionDesignId
  /** Human-readable name. */
  name: string
  /** What kind of job the design does. */
  category: RemotionDesignCategory
  /** Upstream provenance and licence. */
  source: RemotionDesignSource
  /** The adapted React component. */
  component: React.FC<RemotionDesignProps>
  /** Default props; every design renders correctly with only these. */
  defaultProps: RemotionDesignProps
  /** Prop names that carry editable copy. */
  editableText: string[]
  /** Prop names that carry a brand colour. */
  brandColorProps: string[]
  /** Prop names that carry a customer-supplied logo or image URL. */
  brandAssetProps: string[]
  /** How long the design runs, in frames. */
  durationInFrames: number
  /** Whether the design replaces the frame or composites over it. */
  placement: RemotionDesignPlacement
  /** Aspect ratios the design is verified to lay out correctly in. */
  aspectRatios: string[]
  /** Media slots the design can consume. */
  requiredMedia: RemotionDesignRequiredMedia[]
  /** True when the design can be rendered by the browser export engine. */
  exportCapable: boolean
  /** Free-form notes (fidelity caveats, usage hints). */
  notes?: string
}

/** The aspect ratios this repository's personalization preview supports. */
export const REMOTION_DESIGN_ASPECT_RATIOS: string[] = [
  '16:9',
  '9:16',
  '1:1',
  '4:5',
]

/**
 * Widens a design component's concrete prop type to the registry's prop bag.
 *
 * The registry stores every component under one signature so callers can
 * swap designs generically. The cast is confined to this one helper.
 */
function asDesignComponent<P extends Record<string, unknown>>(
  component: React.FC<P>,
): React.FC<RemotionDesignProps> {
  return component as unknown as React.FC<RemotionDesignProps>
}

const MIT_TRIMORA_ATTRIBUTION =
  'MIT — Copyright (c) 2026 Trimora Inc. The upstream MIT copyright and ' +
  'permission notice is retained in the adapted source file header.'

const MIT_RVE_ATTRIBUTION =
  'MIT per the upstream README (that repository ships no LICENSE file). ' +
  'Credit appreciated but not required. Created by the team at ' +
  'https://www.reactvideoeditor.com'

/**
 * The catalogue. Order is the order the designs are offered in.
 */
export const REMOTION_DESIGN_REGISTRY: RemotionDesign[] = [
  {
    id: 'bounce-in-headline',
    name: 'Bounce In Headline',
    category: 'headline',
    source: {
      repo: 'https://github.com/deangilmoreremix/free-remotion-templates',
      file: 'src/components/bounce-in-headline/BounceInHeadline.tsx',
      license: 'MIT',
      attribution: MIT_TRIMORA_ATTRIBUTION,
    },
    component: asDesignComponent(BounceInHeadline),
    defaultProps: { ...defaultBounceInHeadlineProps },
    editableText: ['headline'],
    brandColorProps: ['background', 'color'],
    brandAssetProps: [],
    durationInFrames: BOUNCE_IN_HEADLINE_DURATION_FRAMES,
    placement: 'full-frame',
    aspectRatios: [...REMOTION_DESIGN_ASPECT_RATIOS],
    requiredMedia: [
      {
        name: 'sans-serif',
        kind: 'font',
        required: false,
        suppliedBy: ['fontFamily'],
        fallback: 'system-font',
      },
    ],
    exportCapable: true,
    notes:
      'Full-frame scene: it paints `background` and therefore replaces the ' +
      'customer footage. The headline size and the bounce height scale with ' +
      'the composition height.',
  },
  {
    id: 'logo-mask-wipe',
    name: 'Logo Mask Wipe',
    category: 'logo',
    source: {
      repo: 'https://github.com/deangilmoreremix/free-remotion-templates',
      file: 'src/components/logo-mask-wipe/LogoMaskWipe.tsx',
      license: 'MIT',
      attribution: MIT_TRIMORA_ATTRIBUTION,
    },
    component: asDesignComponent(LogoMaskWipe),
    defaultProps: { ...defaultLogoMaskWipeProps },
    editableText: ['monogram', 'brandText'],
    brandColorProps: ['backgroundColor', 'accentColor', 'textColor'],
    brandAssetProps: ['logoImageUrl'],
    durationInFrames: LOGO_MASK_WIPE_DURATION_FRAMES,
    placement: 'full-frame',
    aspectRatios: [...REMOTION_DESIGN_ASPECT_RATIOS],
    requiredMedia: [
      {
        name: 'monogram',
        kind: 'logo',
        required: false,
        suppliedBy: ['monogram'],
        fallback: 'prop-default',
      },
      {
        name: 'brand-logo',
        kind: 'logo',
        required: false,
        suppliedBy: ['logoImageUrl'],
        fallback: 'inline-art',
      },
      {
        name: 'sans-serif',
        kind: 'font',
        required: false,
        suppliedBy: ['fontFamily'],
        fallback: 'system-font',
      },
    ],
    exportCapable: true,
    notes:
      'Full-frame scene: it paints `backgroundColor`. `logoImageUrl` must be ' +
      'an absolute URL — the browser export path has no public/ directory, so ' +
      '`staticFile()` is not available. The SVG wipe uses a per-instance ' +
      'clipPath id so two players can share a page.',
  },
  {
    id: 'lower-third-glass-card',
    name: 'Lower Third Glass Card',
    category: 'lower-third',
    source: {
      repo: 'https://github.com/deangilmoreremix/free-remotion-templates',
      file: 'src/components/lower-third-glass-card/LowerThirdGlassCard.tsx',
      license: 'MIT',
      attribution: MIT_TRIMORA_ATTRIBUTION,
    },
    component: asDesignComponent(LowerThirdGlassCard),
    defaultProps: { ...defaultLowerThirdGlassCardProps },
    editableText: ['nameText', 'titleText'],
    brandColorProps: ['backgroundColor', 'accentColor', 'textColor'],
    brandAssetProps: [],
    durationInFrames: LOWER_THIRD_GLASS_CARD_DURATION_FRAMES,
    placement: 'overlay',
    aspectRatios: [...REMOTION_DESIGN_ASPECT_RATIOS],
    requiredMedia: [
      {
        name: 'sans-serif',
        kind: 'font',
        required: false,
        suppliedBy: ['fontFamily'],
        fallback: 'system-font',
      },
    ],
    exportCapable: true,
    notes:
      'Transparent overlay: the upstream full-frame background and ambient ' +
      'wash were removed so it composites over the footage. The canvas ' +
      'renderer drops `backdrop-filter`, so the card carries its own ' +
      'translucent tint and loses the frosted-glass look in exported files.',
  },
  {
    id: 'social-reel',
    name: 'Social Reel Promo',
    category: 'cta',
    source: {
      repo: 'https://github.com/deangilmoreremix/free-remotion-templates',
      file: 'src/components/social-reel/SocialReel.tsx',
      license: 'MIT',
      attribution: MIT_TRIMORA_ATTRIBUTION,
    },
    component: asDesignComponent(SocialReel),
    defaultProps: { ...defaultSocialReelProps },
    editableText: [
      'brandName',
      'handle',
      'headline',
      'headlineAccent',
      'secondCopy',
      'infoLines',
      'ctaText',
      'caption',
    ],
    brandColorProps: ['accentColor', 'bgFrom', 'bgVia', 'bgTo'],
    brandAssetProps: [],
    durationInFrames: SOCIAL_REEL_DURATION_FRAMES,
    placement: 'full-frame',
    aspectRatios: [...REMOTION_DESIGN_ASPECT_RATIOS],
    requiredMedia: [
      {
        name: 'sans-serif',
        kind: 'font',
        required: false,
        suppliedBy: ['fontFamily'],
        fallback: 'system-font',
      },
    ],
    exportCapable: true,
    notes:
      'Full-frame scene: it paints the stage and the player gradient. Uses ' +
      '`<Sequence>` for the progressive reveal, so it must be rendered as a ' +
      'descendant of the no-op SequenceManager provider that ' +
      'PersonalizationComposition already supplies. The comment count ("318") ' +
      'is fixed mock chrome inherited from the upstream template.',
  },
  {
    id: 'particle-explosion',
    name: 'Particle Explosion',
    category: 'effect',
    source: {
      repo: 'https://github.com/deangilmoreremix/remotion-templates',
      file: 'templates/particle-explosion.tsx',
      license: 'MIT',
      attribution: MIT_RVE_ATTRIBUTION,
    },
    component: asDesignComponent(ParticleExplosion),
    defaultProps: { ...defaultParticleExplosionProps },
    editableText: ['text'],
    brandColorProps: ['color'],
    brandAssetProps: [],
    durationInFrames: defaultParticleExplosionProps.durationInFrames ?? 90,
    placement: 'overlay',
    aspectRatios: [...REMOTION_DESIGN_ASPECT_RATIOS],
    requiredMedia: [
      {
        name: 'sans-serif',
        kind: 'font',
        required: false,
        suppliedBy: ['fontFamily'],
        fallback: 'system-font',
      },
    ],
    exportCapable: true,
    notes:
      'Transparent overlay: the upstream root already painted no background, ' +
      'so the effect composites cleanly over the footage. The upstream ' +
      'hardcoded "BOOM!" word was replaced by an optional `text` prop that ' +
      'defaults to empty. The seeded PRNG keeps the burst deterministic.',
  },
]

/** Every registered design id, in catalogue order. */
export const REMOTION_DESIGN_IDS: RemotionDesignId[] =
  REMOTION_DESIGN_REGISTRY.map((design) => design.id)

/** Looks a design up by id. Returns `undefined` for unknown ids. */
export function getRemotionDesign(
  id: RemotionDesignId | string,
): RemotionDesign | undefined {
  if (typeof id !== 'string') return undefined
  return REMOTION_DESIGN_REGISTRY.find((design) => design.id === id)
}

/** Every design in one category. */
export function getRemotionDesignsByCategory(
  category: RemotionDesign['category'],
): RemotionDesign[] {
  return REMOTION_DESIGN_REGISTRY.filter(
    (design) => design.category === category,
  )
}

/** Every design with the given placement. */
export function getRemotionDesignsByPlacement(
  placement: RemotionDesign['placement'],
): RemotionDesign[] {
  return REMOTION_DESIGN_REGISTRY.filter(
    (design) => design.placement === placement,
  )
}

/** Type guard for a registry id. */
export function isRemotionDesignId(value: unknown): value is RemotionDesignId {
  return (
    typeof value === 'string' &&
    REMOTION_DESIGN_REGISTRY.some((design) => design.id === value)
  )
}

/**
 * Merges caller-supplied props over a design's defaults.
 *
 * Only keys the design actually declares are taken from `overrides`, so a
 * stale or hostile props bag cannot smuggle unknown keys into the
 * component. The result is always JSON-serialisable.
 */
export function resolveRemotionDesignProps(
  id: RemotionDesignId | string,
  overrides?: Record<string, unknown> | null,
): RemotionDesignProps {
  const design = getRemotionDesign(id)
  if (!design) return {}
  const resolved: RemotionDesignProps = { ...design.defaultProps }
  if (!overrides || typeof overrides !== 'object') return resolved
  for (const key of Object.keys(design.defaultProps)) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      const value = overrides[key]
      if (value !== undefined) resolved[key] = value
    }
  }
  return resolved
}
