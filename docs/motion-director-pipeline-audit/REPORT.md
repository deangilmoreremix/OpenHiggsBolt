# Motion Director pipeline audit and repair

Branch `claude/motion-director-pipeline-audit` (from `claude/dreamy-hawking-qlcpya` at 52213b8). Not merged, not deployed.
Scope: `src/apps/motion-director/` and its own routes. The other studio (`src/apps/motion-studio/`) is untouched.

## How it was tested
Every acceptance test renders real frames in Chromium through the export renderer (and F decodes a real exported MP4 with
ffmpeg). Only the paid AI director is stubbed (no OpenAI key here). C uses a real, unmocked capture of https://www.connections.com/.
Run: `MS_OFFLINE_CLERK=1 EVIDENCE_DIR=<dir> npx playwright test -c playwright.ms.config.ts e2e/motion-director-acceptance.spec.ts --timeout 2700000`
(dev server: `next dev -p 3100 -H 0.0.0.0` with placeholder Clerk keys; sign-in is bypassed by the dev-only cookie).

## Results (acceptance tests A-H)
| Test | Before (unmodified code) | After |
|---|---|---|
| A one personalised shot from 3 supplied images | FAIL (sample line "in motion." stayed) | PASS: a supplied image fills up to 67 % of a frame; no branding |
| B three-shot film with transitions | FAIL (demo text) | PASS: named shots in order, back to back, a seam per transition, audio inside the film, music present |
| C film from a real website (connections.com) | PASS | PASS (real capture, logo, site words and pages in frames) |
| D film from uploaded images, no website | FAIL ("REAL PAGE CAPTURES", SmartVideo mark) | PASS (product name replaces the brand; pictures tile the wall) |
| E film from user-selected recipes | FAIL (HitCounter's sample UI + "SmartVideo GO", not reported) | PASS: HitCounter's sample UI is *reported* as unmodified ("only 0 of its 14 lines of text could be replaced"); brand is the product's |
| F export to a playable MP4 | PASS | PASS: h264 1280x720 (draft), 630 frames, 21.0 s, audio present, ffmpeg decodes every frame with no errors, frames non-blank |
| G no demo branding / sample UI in personalised output | FAIL | PASS: no studio/Shotcraft branding in any shot; sample content only in shots the chat reports as unmodified |
| H1 failed adaptation reported | FAIL | PASS: "Personalised 3 of 3 shots: 0 adapted, 3 parameterised, 0 unmodified" and "Shot adaptation: 0 of 3 shots rewritten" |
| H2 undeployed recipe sources | FAIL (blamed on the model) | PASS: "The recipe sources are not deployed (... returned 404) ... a build problem, not a model failure" |

Other checks run on the final code: unit suite `src/apps/motion-director` + route/build-guard tests: 394 passed (59 files);
existing e2e director + parity specs (minus the 2 slow render tests): 14 passed. `tsc --noEmit`: 2 errors, both in
`src/access/__tests__/preview-mode.test.tsx` (not touched by this branch).

## What was repaired (by your list)
1. Recipe sources: `scripts/verify-motion-sources.mjs` runs after `gen-demo-sources.mjs` in `prebuild` and fails the build if any of the 150 catalog recipes lacks a source or shot card; the 2 recipes with no upstream card (BrandInkOpen, DocumentTypewriterReveal) get a card generated from the build's shot facts. At runtime a 404 on a source is reported as a deployment problem (`SourcesUnavailableError`).
2. Director/BYOK: the route maps OpenAI 401/403, 429, 5xx, timeout, bad request and malformed output to distinct codes with the upstream status and message (`app/api/motion-studio/lib/directorFailure.ts`). A failed plan now stops with the real code/message and puts the request back on the table with "try again" / "use Ink Press" (`StoryboardError`); the template stands in silently only when the person chose Ink Press or there is no usable key. Silent `.catch(() => null)` on directions/mapping/retext now log why.
3. Capture: `lib/captureQuality.ts` (complete / partial / failed). A partial capture shows a warning step and says "only your site's words"; "uses your site" / "using your captured pages" appear only for a complete capture.
4. Binding (partly): films with no website now speak as the product (brand from the prompt name, `neutralTexts` replaces "Your product", studio brands and the false "real page captures" claim). Recipe motion, easing, camera and timing were not touched.
5. Recipe contract: `lib/recipeContract.ts` (required assets, accepted props, aspect ratios, reference frames, renderable, personalizable) with MEASURED results from `e2e/motion-director-recipe-sweep.spec.ts` (every recipe rendered with supplied pictures, a brand and words; words must visibly change the frame). Result for the 150 recipes: **100 tested, 33 partly, 16 sample-only, 1 not renderable**. The picker and the director's catalog use it; only "tested" recipes are called personalizable.
6. Adaptation reporting: per-shot state adapted / parameterised / unmodified with a reason (`lib/personalization.ts`), a summary line in the film-ready message, the Animate step turns to a warning when nothing was personalised, and skipped/stopped adaptation says why.
7. Assembly: `lib/filmAssembly.ts` checks the built film against the approved storyboard (all scenes, recipe order, gapless, a seam per transition, sound inside the film); a missing scene is an error. (Earlier on the parent branch: a scene whose recipe cannot be drawn becomes a title card instead of silently vanishing.)
8. Preview = export: both use the same `MainComposition`; frame parity is measured (earlier on the parent branch; see `UPSTREAM-METHOD.md`).
9. Export errors: `lib/exportErrors.ts` turns WebCodecs/WebGL/H.264/timeout/memory problems into a cause and a remedy, shown inline (the toolbar `alert()` calls are gone). Export mechanism unchanged.
10. Existing UI, timeline, gallery and brand integration kept; no feature removed.

## Remaining failures and limits (not hidden)
- **The real AI director, per-shot adaptation and the final review were not exercised live** (no OpenAI key here). Adaptation behaviour is proven only with a fake model in unit tests and with stubbed 502/404 responses in H1/H2.
- **Captured page layout is not remapped (R4a not done).** 15 recipes import the sample site's `live-layout.json`; a real page is still placed into the sample's boxes. Not changed because it touches 15 tuned recipes.
- **Sample-UI recipes stay sample UI without site words.** With no website only 2 of 131 text recipes can have 50 % of their lines replaced from the product name alone (HitCounter: 0 of 14). They are now *reported* as unmodified, not fixed.
- 33 recipes are only partly personalizable and 16 are sample-only (list: `src/apps/motion-director/lib/_generated/recipeSweepResults.json`). `JumpCutPunchIn` renders blank when played alone (not investigated).
- A (spotlight-hero-card) shows the supplied image full-frame in its opening and as the hero card; the rest of the shot is dark by the recipe's own design (matches the recipe's reference previews).
- Export/preview differences for CSS `zoom` and SVG-background recipes (about 26 recipes) are documented, not fixed (one 3D shot differs 27 % of pixels).
- F exports a 720p draft; the full 1080p export passed earlier on the parent branch (about 15 min in this sandbox). Only headless Chromium was tested: no Safari/Firefox, and the codec-error wording is unit-tested, not provoked in a browser that lacks WebCodecs.
- The review item "S3: Cut short before they finish: row-embed" (a scene shorter than the recipe's native length) still appears in some films.
- C needs network access to connections.com and, in this sandbox, the egress CAs added to Chromium's trust store (an environment step, not a repo change).
- The narration/talkcraft feature you started to scope is parked (talkcraft is vendored and documented, not integrated).

## Files changed (excluding vendored skills and this evidence folder)
- `app/api/motion-studio/director/route.ts`
- `app/api/motion-studio/lib/directorFailure.ts`
- `e2e/helpers/film-evidence.ts`
- `e2e/motion-director-acceptance.spec.ts`
- `e2e/motion-director-recipe-sweep.spec.ts`
- `package.json`
- `scripts/gen-demo-sources.mjs`
- `scripts/verify-motion-sources.mjs`
- `src/apps/motion-director/ExportButton.tsx`
- `src/apps/motion-director/MotionStudio.tsx`
- `src/apps/motion-director/__tests__/adaptLoop.test.ts`
- `src/apps/motion-director/__tests__/exportErrors.test.ts`
- `src/apps/motion-director/__tests__/filmAssembly.test.ts`
- `src/apps/motion-director/__tests__/filmChat.test.ts`
- `src/apps/motion-director/__tests__/filmPipeline.test.ts`
- `src/apps/motion-director/__tests__/personalization.test.ts`
- `src/apps/motion-director/__tests__/recipeContract.test.ts`
- `src/apps/motion-director/components/FilmDirectorChat.tsx`
- `src/apps/motion-director/components/useFilmDirector.ts`
- `src/apps/motion-director/lib/_generated/recipeSweepResults.json`
- `src/apps/motion-director/lib/adaptLoop.ts`
- `src/apps/motion-director/lib/captureQuality.ts`
- `src/apps/motion-director/lib/directorClient.ts`
- `src/apps/motion-director/lib/directorPlan.ts`
- `src/apps/motion-director/lib/exportErrors.ts`
- `src/apps/motion-director/lib/filmAssembly.ts`
- `src/apps/motion-director/lib/filmChat.ts`
- `src/apps/motion-director/lib/filmPipeline.ts`
- `src/apps/motion-director/lib/filmSteps.ts`
- `src/apps/motion-director/lib/personalization.ts`
- `src/apps/motion-director/lib/recipeContract.ts`
- `src/apps/motion-director/lib/recipeSweep.ts`
- `src/apps/motion-director/lib/retext.ts`
- `src/apps/motion-director/pages/MotionStudioEntry.tsx`
- `src/apps/motion-director/webRenderer.ts`
- `tests/motion-sources-verify.vitest.test.ts`
- `tests/motion-studio-director-errors.vitest.test.ts`

## Visual evidence
Before: `before/frames/` (HitCounter with "SmartVideo GO" and sample UI, DeckDealFlyin with "REAL PAGE CAPTURES", real-site and MP4 frames) and `before/RESULTS.md`.
After: `after/frames/` plus the raw JSON of every test in `after/` and the Playwright log `after/run.log`.
