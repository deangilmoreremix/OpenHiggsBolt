# Template coverage ledger
Generated from the live registry (`templates/__tests__/templateInventory.test.ts`). Total: **5 layout templates + 124 registered designs** in 9 categories.
## Real-export sweep (2026-11-23)
Spec: `e2e/personalization-design-sweep.spec.ts`; screening and contact sheets: `scripts/design-sweep-analyze.py`. Each registered design was applied with **Replace** on the same real clip (`luxury-perfume-commercial`, 16:9), exported through the real browser renderer (`@remotion/web-renderer`), and checked: real MP4, 1920x1080, not blank, zero AI requests. Frames at 1.0 / 2.5 / 4.0 s were kept and tiled per category; the sheets were **looked at**, and the 20 designs whose effect was not visible at those times were also checked with an 8-frame filmstrip across the clip.

| | Count |
|---|---|
| Registered designs | **137** (the 124 in the table below was counted before more scene/brito designs landed) |
| Exported through the real renderer, checked and visually inspected | **136** |
| Failed | **1**: `rve-noise-grain` (the page crashed twice, once on export timeout, once on renderer crash) |
| Skipped as unsupported at 16:9 | 0 (the 9 aspect-limited designs all declare 16:9, so 9:16 / 4:5 / 1:1 remain unexercised) |

By category (all exported at 16:9): animated-headline 27/27, logo-reveal 15/15, lower-third 4/4, promo-cta 7/7, visual-effect 13/14 (`rve-noise-grain` fails), other 6/6, full-scene 29/29, transition 20/20, data-visualization 15/15.

### Defects and oddities found (not fixed here)
1. **`rve-noise-grain` crashes the export** (twice, on a fresh page each time). Likely a heavy SVG-filter effect in the web renderer. Needs its own fix or a "not export-safe" flag.
2. **`kpi-counter` shows the literal labels "PLACEHOLDER 1" to "PLACEHOLDER 4"** and a clipped value in the fourth tile.
3. **`rve-animated-list` draws nothing visible** anywhere in the 8-frame filmstrip.
4. **`rve-subscribe-reminder` is a tiny cyan dot** in the bottom-right corner; **`rve-vignette-pulse`** is a very faint edge darkening. Both are visible but easy to mistake for "nothing drawn".
5. **Logo designs on a white tile** (`rve-logo-fade-reveal`, `-glitch-reveal`, `-scale-rotate`, `-spin-reveal`): the first run used a white wordmark and it vanished on the white tile. Re-run with a coloured logo, the logo shows (small). That was a fixture problem, not a design defect, but it means a **white or light logo disappears on these four**; there is no contrast handling.
6. **Transitions act in the first ~2 s of the clip**, so a mid-clip sample shows plain footage. They all work (filmstrip), but nothing in the UI says when the effect plays.

### What this does NOT show
- It is one clip, one logo, two product pictures, one business name, **16:9 only**.
- The sheets are a human look, not a pixel-exact check. The automated screen (`design-sweep-analyze.py`) compares each frame to the per-pixel median of all designs; it did not flag a single design as drawing nothing, but visually at least `rve-animated-list` draws nothing. So the numeric screen is too lenient to be a verdict and is not used as one.
- Designs were not checked for duplicate branding against the clip's baked-in graphics, for readability on other footage, or in 9:16 / 1:1 / 4:5.

## What was verified, by evidence class
| Evidence | Covers | Not covered |
|---|---|---|
| Unit/registration tests (`templates/__tests__/catalog*.test.tsx`, `registry`, `layoutCompatibility`, `applyDesignTemplate`) | every registered design is registered, has a category/role/capabilities, declares media/aspects; layout↔aspect support | visual correctness |
| Real browser export, 13 designs (`personalization-step4-remotion-export.spec.ts` matrix) | animated-headline, logo-reveal, lower-third, promo-cta, visual-effect, starfield-warp, logo-bounce-drop, logo-mask-wipe, logo-split-reveal, brush-stroke-reveal, text-mask-reveal, glitch-text, logo-blur-reveal: encoded H.264 MP4, design present in the encoded pixels, no credit line | the other **111** designs |
| Real browser export of the 3 layout templates × 4 shapes × real/synthetic footage (`personalization-phase5-layout-export.spec.ts`) | Business Introduction, Product Showcase, Service Promotion: card ↔ preview ↔ export parity, placement, wrapping, duplicate branding | other layouts (Special Offer, Branded Ending) |
| Real-footage export, 6 demos × 4 shapes (Product Showcase) | quality panel statuses, letterbox fit, readability on real clips | designs |

## Categories
| Category | Designs | Media role | Browser-export flag | Preview-compatible | Aspect-limited designs | Real-export verified |
|---|---|---|---|---|---|---|
| animated-headline | 21 | text | 21/21 | 21/21 | 0 | 4/21 |
| logo-reveal | 11 | logo | 11/11 | 11/11 | 0 | 5/11 |
| lower-third | 3 | text | 3/3 | 3/3 | 0 | 1/3 |
| promo-cta | 5 | text | 5/5 | 5/5 | 0 | 1/5 |
| visual-effect | 14 | decorative | 14/14 | 14/14 | 0 | 2/14 |
| other | 6 | decorative, picture-in-picture | 6/6 | 6/6 | 0 | 0/6 |
| full-scene | 29 | full-frame-replacement | 29/29 | 29/29 | 3: four-tone-mono-titler, pixel-typewriter-quote, brito-promo | 0/29 |
| transition | 20 | decorative | 20/20 | 20/20 | 3: pixel-mosaic-transition, ink-spread-transition, slide-wipe | 0/20 |
| data-visualization | 15 | decorative | 15/15 | 15/15 | 3: pourover-drip-fill-gauge, pixel-candlestick-ohlc, brito-line-chart | 0/15 |

## Media roles (`preview/mediaRoles.ts`)
| Role | Designs |
|---|---|
| decorative | 53 |
| text | 29 |
| full-frame-replacement | 29 |
| logo | 11 |
| picture-in-picture | 2 |

Picture-in-picture (explicit): rve-picture-in-picture, rve-polaroid-frame. Full-frame replacement: the 8 listed ids plus category `full-scene`.

## Unresolved / not verified
- ~~111 of 124 designs have never been exported~~ Superseded by the sweep above: 136 of 137 designs exported at 16:9 and inspected. Still unexercised: 9:16, 1:1 and 4:5 for every design except the earlier 13, other footage, other logos.
- Aspect-limited designs (declared 16:9|1:1 or 16:9 only) are disabled elsewhere by `isRemotionDesignTemplateSupported`; their 9:16/4:5 behaviour was not exercised.
- Layout-level scene-aware placement applies to the five layouts; designs keep their own geometry (not auto-placed, by role contract).
- Full-frame / transition / full-scene designs (49) cover the footage by design; their interaction with baked-in graphics and subject protection is not evaluated.
- No design was audited for duplicate branding against a clip's baked-in graphics.
