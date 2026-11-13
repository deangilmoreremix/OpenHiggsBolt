# Personalization: layout polish (Phase C)

Overlay text, scrims, motion and the end card in the personalization preview were
plain styled divs. This note records what changed, where it lives, and the
constraints of the in-browser exporter that shaped it.

Everything below is drawn by one composition, `preview/PersonalizationComposition.tsx`,
used by the live Player, the template gallery thumbnails and the browser export
(`webExport.ts` via `@remotion/web-renderer`). The editor stage in
`guided/OverlayEditor.tsx` mirrors the same helpers so what a customer drags matches
what exports.

## What was added

| Area | File | What it does |
| --- | --- | --- |
| Text style | `preview/textStyle.ts` | One source of truth for weight, tracking, line-height and a soft text shadow per role; CTA pill (top-lit gradient, shadow); headline accent rule; `textAlignFor`; end-card background. |
| Local scrim | `preview/scrim.ts` | A full-width, feathered dark band behind each headline / name / tagline / offer row. |
| Motion | `preview/motion.ts` | Spring-based entrances (`entranceFor`), per-word headline entrance (`wordEntrance`), fade-and-lift exits for text and CTA (`exitFor`), staggered list reveal (`itemEntrance`). |
| End card | `EndCard` in the composition | Gradient brand background, readable text color, staggered reveal, fully opaque. |
| Defaults | `preview/presets.ts` | Business Introduction starts as a bottom-left lower third (name .68, headline .76, x .08) at every aspect ratio. `createLayoutLayers` builds new projects from the layout's own geometry. |
| Quality check | `preview/placement/quality.ts` | Credits only the scrim strength a text box is guaranteed (its weakest edge), and only for text kinds that really draw a scrim. |

Alignment: text is centered in its box. When the safe-area clamp pushes the box of a layer
anchored in the left margin (x <= 0.15, e.g. the Business Introduction lower third) against the
edge, the text is left-aligned so the lines share one left edge instead of each being centered in
a differently clamped box. A centered column (e.g. the x = .3 text column of Product Showcase and
Service Promotion) stays centered. The CTA label never wraps (`white-space: nowrap`) and is centered
with flex, because the layer box width is only an estimate (`toBox` assumes about 0.55 em per
character) and a pill wider than that box must overflow on both sides.

Existing saved projects keep their stored positions. They get the new lower-third only
through "Restore default layout" or by choosing the layout again.

## What the browser exporter can and cannot draw

`@remotion/web-renderer` 4.0.499 redraws the DOM onto a canvas. It does not implement all of
CSS, and the preview Player (which uses the real browser) hides the gaps. Each item below was
found by reading the package source and confirmed by rendering a still through
`renderStillOnWeb` in headless Chromium.

| CSS | In export | Consequence in this code |
| --- | --- | --- |
| `linear-gradient(...)` | drawn | Scrim and end card use only this. |
| `radial-gradient(...)`, conic | **silently dropped** (the element draws nothing) | The first scrim used a radial gradient and vanished from exports. Never use radial gradients for anything that must export. |
| gradient + background color together | the gradient **replaces** the color | A translucent highlight over a solid color loses the color. The CTA highlight is an opaque lighter-to-base gradient. |
| `border-radius: 999px` | **not clamped**: a pill draws as an ellipse | The CTA pill uses `0.975em` (half its height). |
| outer `box-shadow` with blur | drawn | CTA pill and accent rule shadows. |
| `box-shadow: inset` | not supported (warns) | Not used. |
| `text-shadow` | drawn | Text shadow. |
| `letter-spacing` | drawn | Role tracking. |
| `text-wrap: balance` | line breaks come from the real DOM, so it applies | Headlines. |
| per-element `transform` and `opacity` on spans | drawn | Per-word entrance. |

When adding a new effect: check `node_modules/@remotion/web-renderer/dist/esm/index.mjs` for
support, then render a still before relying on it. `scrim.test.ts` and `textStyle.test.ts`
include guards (linear-gradient only, opaque gradients, pill radius) so a regression fails a
test and not a customer's video.

### Reproducing the export check

The harness used for this work lives outside the repo. To rebuild it: a minimal Vite page that
mounts `PersonalizationComposition` and calls `renderStillOnWeb({ composition, frame, inputProps,
imageFormat: 'png' })`, driven by the pre-installed Playwright Chromium. Use an image source
(`isImageSource: true` with a poster data URL) so no video decoding is involved, and render a
frame after the entrances settle (about frame 60) and inside the end card
(`durationInFrames - endCardLength`, about frame 140 of 150).

## Deliberately not used

- `@remotion/motion-blur`: web-renderer support is unverified and it changes render cost for
  every frame.
- `@remotion/transitions` `TransitionSeries` for the end card: it would restructure the video and
  overlay sequences. The end card keeps its own 15-frame fade, plus staggered reveals.
- `@remotion/layout-utils`, `@remotion/google-fonts`, `@remotion/shapes`: not installed. Text
  sizing remains the existing `toBox` estimate and the font stays `personalization-sans`.
- A permanent logo plate chip: it would hurt clean transparent logos. Logos keep the existing
  image-style presets.

## Known leftovers

- The tagline in Service Promotion can wrap onto two lines: its box width comes from the same
  `toBox` character-width estimate, which is narrower than the real text. This predates the
  polish work and is flagged by the quality check's `text-overflow` rule when it gets bad.

## Adaptive scrim

The scrim strength follows the footage. `placement/frameSampler.ts` measures luminance grids of the source
clip (cached per URL via `getCachedSamples`); `buildPreviewInput` puts them on `PreviewInputProps.lumaSamples`;
`scrimPeakAt` (`preview/scrim.ts`) interpolates the luminance behind a text box between the two samples around
the current time and maps it to a strength between `SCRIM_MIN` (0.2) and `SCRIM_MAX` (0.6). Interpolation keeps
it from stepping at sample boundaries. With no samples (still image, or the clip could not be read in the
browser) the default `SCRIM_PEAK` (0.42) is used. Text darker than relative luminance 0.3 gets no darkening
scrim. The layout quality check calls the same `peakFromLuminance` per sample, so the contrast it credits is
exactly what the render draws.

The editor stage still draws the default-strength scrim over the poster image (it has no frame measurements);
the exported video and the Player use the adaptive one.

## Not done here

The placement engine's candidate scoring still ignores the scrim, which can only make it more cautious than
needed.
