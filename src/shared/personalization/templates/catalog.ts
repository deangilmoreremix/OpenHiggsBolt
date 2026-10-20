/**
 * The concrete catalog of Phase 1 Remotion designs.
 *
 * Five upstream templates (MIT, © 2026 Trimora Inc. / RenderComp) are
 * registered here as customer-facing "designs". Each entry pairs an upstream
 * template with an adapter component that maps the customer's brand data onto
 * the upstream's props — the upstream files in `./_upstream` are frozen and
 * are never edited.
 *
 * The contract the adapters implement is documented in
 * `./_upstream/ADAPTER-SPEC.md`; the short version is:
 *
 *  - the upstream lays itself out against the COMPOSITION, so every adapter
 *    renders it inside a composition-sized canvas that is scaled into the
 *    design box (see `./designs/shared.tsx`);
 *  - the customer's video stays visible: every canvas fill is forced to
 *    `transparent`, except the end card, which is deliberately rendered as a
 *    bounded, solid CTA card;
 *  - the MIT attribution travels with every design (`source.attribution`),
 *    is available to the product UI through
 *    `getRemotionDesignAttributionLine()` / `REMOTION_DESIGN_LICENSE_NOTICE`,
 *    and is drawn as a small credit line inside the design itself.
 *
 * Upstream provenance (see `./_upstream/README.md`):
 *  - upstream repository: https://github.com/deangilmoreremix/free-remotion-templates
 *  - canonical repository (the repo's own `package.json → repository`):
 *    https://github.com/RenderComp/free-remotion-templates
 *  - the two URLs differ: the first is the clone the templates were copied
 *    from, the second is the canonical project the attribution points at.
 */

import { registerRemotionDesignTemplates } from './registry'
import type { RemotionDesignTemplate } from './types'
import {
  AnimatedHeadlineDesign,
  LogoRevealDesign,
  LowerThirdDesign,
  PromoCtaDesign,
  VisualEffectDesign,
} from './designs'

/* -------------------------------------------------------------------------- */
/* Attribution                                                                 */
/* -------------------------------------------------------------------------- */

/** The upstream repository the templates were copied from. */
export const REMOTION_DESIGN_REPOSITORY = 'free-remotion-templates'

/** The clone the templates were copied from (the upstream's own git remote). */
export const REMOTION_DESIGN_REPOSITORY_URL =
  'https://github.com/deangilmoreremix/free-remotion-templates'

/** The canonical upstream project (the repo's own `package.json → repository`). */
export const REMOTION_DESIGN_CANONICAL_REPOSITORY_URL =
  'https://github.com/RenderComp/free-remotion-templates'

/** The SPDX identifier of the upstream licence. */
export const REMOTION_DESIGN_LICENSE = 'MIT'

/**
 * The credit line the product must display.
 *
 * Exact string required by the upstream README; every design carries it in
 * its `source.attribution`.
 */
export const REMOTION_DESIGN_ATTRIBUTION =
  '© 2026 Trimora Inc. — Remotion templates by RenderComp (free-remotion-templates), MIT License. https://github.com/RenderComp/free-remotion-templates'

/**
 * The verbatim MIT permission notice.
 *
 * The MIT licence requires the copyright notice AND the permission notice to
 * be retained in all copies or substantial portions of the software, so the
 * product's credits surface has to show both.
 */
export const REMOTION_DESIGN_LICENSE_NOTICE = `Copyright (c) 2026 Trimora Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`

/**
 * The credit line shown in the product UI.
 *
 * The Step 4 "Designs" chip row (`guided/StepPreviewApprove.tsx`) is owned by
 * another module and could not be edited here, so the UI has to render this
 * line itself (e.g. under the chip row, or in the product's credits surface).
 */
export function getRemotionDesignAttributionLine(): string {
  return REMOTION_DESIGN_ATTRIBUTION
}

/** The verbatim MIT permission notice, for the product's credits surface. */
export function getRemotionDesignLicenseNotice(): string {
  return REMOTION_DESIGN_LICENSE_NOTICE
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

/** Builds the `source` block every design carries. */
function upstreamSource(sourcePath: string): RemotionDesignTemplate['source'] {
  return {
    repository: REMOTION_DESIGN_REPOSITORY,
    repositoryUrl: REMOTION_DESIGN_REPOSITORY_URL,
    sourcePath,
    license: REMOTION_DESIGN_LICENSE,
    attribution: REMOTION_DESIGN_ATTRIBUTION,
  }
}

/**
 * The animated headline.
 *
 * The upstream bounces the whole headline in (a damped `abs(sin)`), centred in
 * the composition. The design box is smaller than the composition, so the
 * headline lands in the middle of the box.
 */
export const animatedHeadlineTemplate: RemotionDesignTemplate = {
  id: 'animated-headline',
  name: 'Animated Headline',
  description: 'A headline that bounces into place over your video.',
  category: 'animated-headline',
  source: upstreamSource('src/components/bounce-in-headline/BounceInHeadline.tsx'),
  component: AnimatedHeadlineDesign,
  defaultProps: {
    // The upstream default is an opaque `#111827` canvas; an overlay must
    // never paint over the customer's video.
    background: 'transparent',
  },
  textSlots: [{ key: 'headline', field: 'headline', label: 'Headline', primary: true }],
  colors: [{ role: 'text', label: 'Headline colour' }],
  media: [],
  animation: {
    durationInFrames: 36,
    delayInFrames: 0,
    easing: 'damped abs(sin) bounce',
  },
  placement: { x: 0.5, y: 0.42, scale: 0.55, opacity: 1, animation: 'pop' },
  aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
  requiredMedia: [],
  capabilities: {
    preview: true,
    browserExport: true,
    notes:
      'Renders in the browser export path: no staticFile, no media components, no filters. ' +
      'The upstream hardcodes fontSize 130, which the scale-wrapper keeps proportional to the composition.',
  },
  previewCompatible: true,
}

/**
 * The logo reveal.
 *
 * The upstream draws a monogram badge and a wordmark; it has no image prop,
 * so the adapter draws the customer's logo over the badge when one is set
 * (and blanks the monogram so the two do not overlap).
 */
export const logoRevealTemplate: RemotionDesignTemplate = {
  id: 'logo-reveal',
  name: 'Logo Reveal',
  description: 'Your logo draws itself into a branded badge.',
  category: 'logo-reveal',
  source: upstreamSource('src/components/logo-stroke-draw/LogoStrokeDraw.tsx'),
  component: LogoRevealDesign,
  defaultProps: {
    // The upstream default is an opaque `#0a0800` canvas.
    backgroundColor: 'transparent',
  },
  textSlots: [
    { key: 'businessName', field: 'businessName', label: 'Business name', primary: true },
  ],
  colors: [
    { role: 'accent', label: 'Badge accent' },
    { role: 'text', label: 'Wordmark colour' },
  ],
  media: [{ role: 'logo', label: 'Logo', required: false }],
  animation: {
    durationInFrames: 110,
    delayInFrames: 0,
    easing: 'interpolate + spring(damping: 14, stiffness: 90)',
  },
  placement: { x: 0.5, y: 0.45, scale: 0.4, opacity: 1, animation: 'logo-reveal' },
  aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
  requiredMedia: [],
  capabilities: {
    preview: true,
    browserExport: true,
    notes:
      'Renders in the browser export path: the badge is inline SVG, the logo is a regular <Img>. ' +
      'The logo is optional — without one the monogram lockup is used instead.',
  },
  previewCompatible: true,
}

/**
 * The lower third.
 *
 * The upstream anchors a glass card to the bottom-left of the composition.
 * Both text lines use `whiteSpace: "nowrap"`, so the adapter truncates them.
 */
export const lowerThirdTemplate: RemotionDesignTemplate = {
  id: 'lower-third',
  name: 'Lower Third',
  description: 'A glass name card for your presenter or offer.',
  category: 'lower-third',
  source: upstreamSource('src/components/lower-third-glass-card/LowerThirdGlassCard.tsx'),
  component: LowerThirdDesign,
  defaultProps: {
    // The upstream default is an opaque `#0c1a2e` canvas.
    backgroundColor: 'transparent',
  },
  textSlots: [
    { key: 'businessName', field: 'businessName', label: 'Name', primary: true },
    { key: 'offer', field: 'offer', label: 'Title' },
  ],
  colors: [
    { role: 'accent', label: 'Card accent' },
    { role: 'text', label: 'Text colour' },
  ],
  media: [],
  animation: {
    durationInFrames: 120,
    delayInFrames: 0,
    easing: 'spring(damping: 18, stiffness: 90)',
  },
  // The upstream card sits at 74 % of the composition height; the placement
  // below keeps the whole card inside the frame (the card would otherwise be
  // clipped by the bottom edge).
  placement: { x: 0.3, y: 0.6, scale: 0.62, opacity: 1, animation: 'slide-up' },
  aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
  requiredMedia: [],
  capabilities: {
    preview: true,
    browserExport: true,
    notes:
      'Renders in the browser export path. The frosted look uses backdrop-filter: blur(14px) — ' +
      'if the rasteriser drops the blur the card degrades to a translucent white gradient and stays legible. ' +
      'Verify in an exported frame.',
  },
  previewCompatible: true,
}

/**
 * The promotional end card.
 *
 * The upstream is not transparent by design: its `background` prop is both the
 * card fill and the CTA label colour. The adapter renders it as a bounded,
 * solid CTA card (the box is smaller than the composition), so the video stays
 * visible around it.
 */
export const promoCtaTemplate: RemotionDesignTemplate = {
  id: 'promo-cta',
  name: 'Promo CTA',
  description: 'A branded end card with a call to action.',
  category: 'promo-cta',
  source: upstreamSource('src/components/end-card/EndCard.tsx'),
  component: PromoCtaDesign,
  defaultProps: {
    // A sentinel, not a colour: the upstream uses `background` as BOTH the
    // card fill and the CTA label colour, so the adapter derives it from the
    // brand primary and darkens it for contrast.
    background: 'brand-primary',
  },
  textSlots: [
    { key: 'headline', field: 'headline', label: 'Headline', primary: true },
    { key: 'offer', field: 'offer', label: 'Subtitle' },
    { key: 'cta', field: 'cta', label: 'Call to action' },
  ],
  colors: [
    { role: 'primary', label: 'Card colour' },
    { role: 'accent', label: 'CTA colour' },
    { role: 'text', label: 'Title colour' },
  ],
  media: [],
  animation: {
    durationInFrames: 150,
    delayInFrames: 0,
    easing: 'spring(damping: 12, stiffness: 80) + cubic ease-out',
  },
  placement: { x: 0.5, y: 0.72, scale: 0.55, opacity: 1, animation: 'slide-up' },
  aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
  requiredMedia: [],
  capabilities: {
    preview: true,
    browserExport: true,
    notes:
      'Renders in the browser export path. The upstream paints an opaque canvas by design: the design box ' +
      '(scale 0.55) bounds it into a CTA card, so the video stays visible around it. The CTA pill uses the ' +
      'brand accent and its label uses the card colour — pick an accent that contrasts with the primary.',
  },
  previewCompatible: true,
}

/**
 * The bokeh particle effect.
 *
 * A full-frame, seamless particle loop. It is placed at `scale = 1` with
 * `animation: 'none'` and `opacity: 1` so that neither the composition nor
 * the scale-wrapper creates a stacking context — otherwise the upstream's
 * `mix-blend-mode: screen` would be confined and the discs would lose their
 * light-leak blend (they still render, just unblended).
 */
export const visualEffectTemplate: RemotionDesignTemplate = {
  id: 'visual-effect',
  name: 'Bokeh Particles',
  description: 'Soft bokeh particles drifting over your video.',
  category: 'visual-effect',
  source: upstreamSource('src/components/bokeh-circles/BokehCircles.tsx'),
  component: VisualEffectDesign,
  defaultProps: {
    // The upstream default is an opaque `#1a0f1f` canvas.
    baseColor: 'transparent',
  },
  textSlots: [],
  colors: [
    { role: 'accent', label: 'Particle accent' },
    { role: 'primary', label: 'Particle colour' },
    { role: 'text', label: 'Particle highlight' },
  ],
  media: [],
  animation: {
    durationInFrames: 150,
    delayInFrames: 0,
    easing: 'seamless sin/cos drift loop',
  },
  placement: { x: 0.5, y: 0.5, scale: 1, opacity: 1, animation: 'none' },
  aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
  requiredMedia: [],
  capabilities: {
    preview: true,
    browserExport: true,
    notes:
      'Renders in the browser export path. The discs use filter: blur(20px) and mix-blend-mode: screen: ' +
      'the blend needs a stacking context free ancestor, which the full-frame placement provides, but it ' +
      'is confined while the layer animates. Verify the blur in an exported frame.',
  },
  previewCompatible: true,
}

/** Every Phase 1 design, in registration order. */
export const REMOTION_DESIGN_TEMPLATES: RemotionDesignTemplate[] = [
  animatedHeadlineTemplate,
  logoRevealTemplate,
  lowerThirdTemplate,
  promoCtaTemplate,
  visualEffectTemplate,
]

// The catalog registers itself on import, so the designs exist before the
// first preview frame.
registerRemotionDesignTemplates(REMOTION_DESIGN_TEMPLATES)
