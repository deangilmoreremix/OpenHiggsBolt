# Before: acceptance run on the unmodified pipeline (commit 9490bc0 + threshold fix)

Real Chromium export renderer; real connections.com capture (C); real MP4 export decoded with ffmpeg (F).
Director stubbed (no OpenAI key): films come from the Ink Press template / named recipes.

| Test | Result | What the evidence shows |
|---|---|---|
| A one personalised shot, 3 supplied images | FAIL | SpotlightHeroCard keeps the sample line "in motion."; only 1 of 3 supplied images visible (magenta 0.6 % of frame) |
| B three-shot film with transitions | FAIL | demo text seen in frames (see `run.log`); ordering/seam assertions were not reached |
| C real website (connections.com) | PASS | logo + site words + site pages in frames, no demo strings detected |
| D uploaded images, no website | FAIL | DeckDealFlyin keeps "REAL PAGE CAPTURES", "Every page, live. in motion.", the SmartVideo mark (frames/D-DeckDealFlyin.jpg) |
| E user-selected recipes | FAIL | HitCounter shows its whole sample UI: "SmartVideo GO", "Shot recipes", "Beat-synced cuts", "2.5D camera" (frames/E-HitCounter.jpg); chat does not say it is unmodified |
| F export to playable MP4 | PASS | h264 1280x720 draft, 630 frames, 20.97 s, audio present, ffmpeg decodes with no errors, frames non-blank (variance 543-4964) |
| G no demo branding | FAIL | same strings as D/E |
| H1 failed adaptation reported | FAIL | log says "3 of 3 shots kept as the plain recipe (the adapted versions did not pass their checks)" at status done; no per-shot personalisation count; Animate step shown as done |
| H2 missing recipe sources | FAIL | same misleading "did not pass their checks" wording; cause (sources 404) never named |

Root causes seen: with no website nothing replaces recipe copy or the SmartVideo brand; recipes that draw a sample UI (HitCounter) are offered and built as if personalised; adaptation/personalisation results are not summarised and are blamed on the model.
