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

### Defects found, and what happened to each (2026-11-23, branch `claude/fix-sweep-defects`)
Each fix was re-exported through the real browser renderer and the frame looked at.

| # | Defect | Status | Evidence |
|---|---|---|---|
| 1 | `rve-noise-grain` crashed the export | **Fixed** | One `<rect>` per cell (~14,400 per 1080p frame) became 8 opacity-bucket `<path>`s; the export now completes (70 s) and the grain is visible. |
| 2 | `kpi-counter` printed "PLACEHOLDER 1..4" | **Fixed** | The customer types up to four figures (label + number, no brand fallback). A card without a number is not drawn; with none typed only title and subtitle show. Unit tests + real export (no placeholder text). The same placeholder convention remains in `bar-chart-anim`, `line-chart-anim`, `racing-chart` and the `rve-*` charts: **not changed** (out of this request, same class of defect). |
| 3 | `rve-animated-list` drew nothing | **Fixed** | Root cause: the adapter falls back to brand fields the design did not declare as slots, so a business with no offer / phone / website got an empty list. Hidden fallback slots added; a sparse-brand test now checks every text design shows text for a name-only business. Real export shows the row. |
| 4 | `rve-subscribe-reminder` was a bare dot | **Fixed** | Same root cause: the pill now carries the business name (real export). It is still a small pill by design. |
| 5 | `rve-vignette-pulse` barely visible | **Partly** | Darkening now starts at 25 % of the radius (upstream 40 %). On this clip, whose edges are already black, it is still faint: that is the footage, not the design. Not verified on bright footage. |
| 6 | White logo vanished on a white tile (4 logo designs) | **Fixed** | A `lightLogo` image hint (measured in the browser, kept through save/restore, carried to the trimmed logo URL) gives a white / pale logo a dark brand tile. Real export with the white wordmark shows it on all four. |
| 7 | Transitions play in the first ~2 s, nothing said so | **Fixed (wording)** | Gallery and recommendation cards add "Plays at the start of your video." No behaviour change. |

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
