# Template coverage ledger
Generated from the live registry (`templates/__tests__/templateInventory.test.ts`). Total: **5 layout templates + 124 registered designs** in 9 categories.
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
- **111 of 124 designs have never been exported through the real browser renderer** in this work; only registration/unit coverage exists for them. Do not read the three primary layouts as proof that every template is fixed.
- Aspect-limited designs (declared 16:9|1:1 or 16:9 only) are disabled elsewhere by `isRemotionDesignTemplateSupported`; their 9:16/4:5 behaviour was not exercised.
- Layout-level scene-aware placement applies to the five layouts; designs keep their own geometry (not auto-placed, by role contract).
- Full-frame / transition / full-scene designs (49) cover the footage by design; their interaction with baked-in graphics and subject protection is not evaluated.
- No design was audited for duplicate branding against a clip's baked-in graphics.
