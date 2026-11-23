# Round 7 report: customer-layout geometry, remaining recipes, JumpCutPunchIn

Branch `claude/motion-director-pipeline-audit` (no PR, no merge). Evidence: `round7/` (original | repaired-sample | customer frames per recipe, fidelity JSON), `RECIPE-REPAIR-PLAN.md` (generated).

## Layout-dependent recipes
The count is 12, not 15 (3 of the 15 were hidden `_legacy` files).
- **Fixed (11):** SpotlightHeroCard, DeckDealFlyin, RowEmbed, CrashZoomReal, CrashImpactReal, MultiplaneReal, TypeAndFilter, FreezeAnnotateReal, WhipBrakeReal, OutroGroupPhotoLaunch, ListStackPress. Plus JumpCutPunchIn (not one of the 12).
- **Not fixed (1):** DocumentTypewriterReveal. It types out a document's text blocks, rails and issue list; a page capture has none of these. It plays as the sample demo plus the site inset (`GEOMETRY_UNMAPPED`).
- Method: geometry read at render time from the customer's captured cards/rows (`lib/customerLayout.ts`, `LiveLayoutContext`); the authored camera/target is carried over by one similarity transform that is the identity for the sample page. Easing/timing/perspective untouched. The layout is handed only to recipes whose required part (`LAYOUT_NEEDS`) the capture really contains.
- Tests (`e2e/motion-director-fidelity.spec.ts`, synthetic customer pages with known rectangles): identity, hero lands/camera target vs a sample-geometry twin, no duplicate beneath, zoom steps for JumpCutPunchIn. All pass. Where a check was relaxed (area-only, ROI, tolerances) the reason is in the spec.
- Original vs repaired sample (export): identical for CrashImpact, CrashZoom, FreezeAnnotate, JumpCut, ListStack, Multiplane. Different where export bugs were fixed (preview unchanged): WhipBrakeReal drew no cards/ unclipped digit wheel; RowEmbed flying row, TypeAndFilter sliding card, Outro strip not painted; 3D camera stage (DeckDeal, Spotlight); FakeDashboard cropped from the middle. Parity frame 315: 27% -> 10% differing pixels.

## JumpCutPunchIn
Works standalone (sample and customer page; three distinct zoom steps). The earlier "blank" came from the sweep's flat-colour stand-in. Now zooms the customer's own card; standalone e2e + unit tests added.

## Recipe totals (sweep re-run, 150 recipes, 0 not renderable)
tested 138 / partly 3 / sample-only 8 / not-applicable 1 / untested 0 (before: 100/33/16/1).
**Caveat:** the jump is mostly measurement and input change, not 38 recipes repaired: (a) the sweep now measures the brand on its own, which many "sample-only" shots (they draw the company wordmark/logo) already honoured; (b) the sweep's fixture site now has a realistic amount of words (12 headings, 6 nav, 4 CTAs) and retext repeats site words when they run out instead of keeping template copy. Real sites with little content will land between the old and new numbers.
- partly (3): BrakeReticleLock, CraneRiseReveal, WordRelayFilmstrip (lines the retext rules cannot replace).
- sample-only (8): GrazeFaceTour, PickerCarouselFeatureCycle, Fracture, ValueStaggerGradient (words replaced but not visible in sampled frames), BrandInkOpen, LetterspaceMaterialize (fixed wordmark as glyph outlines), DroneDiveLanding and FlylineArc (hard-coded to the sample dashboard's card position, not retargeted).
- not-applicable (1): RadialWave.
Per-recipe detail: `RECIPE-REPAIR-PLAN.md`. Of the 16 old sample-only, 8 are now measured as personalised via brand/words; 8 remain flagged above.

## Not done / not verified
- Acceptance A–H, director and parity specs were NOT re-run after the last changes (unit suite 357 passed, tsc clean except the 2 known `preview-mode.test.tsx` errors; parity spec passed once mid-round).
- Live OpenAI planning, source adaptation and final AI review are not validated (no key). All customer-page evidence uses synthetic pages, not a live site capture.
- DroneDiveLanding/FlylineArc and other FakeDashboard-geometry recipes remain unretargeted.
