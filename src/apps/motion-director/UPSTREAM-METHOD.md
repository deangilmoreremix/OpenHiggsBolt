# How upstream video-shotcraft makes a video (and where Motion Director stands)

Source: the in-repo copy of `Vincentwei1021/video-shotcraft` at `.claude/skills/video-shotcraft` (READMEs in EN/CN/JA/RU, SKILL.md, references/*, template/, workbench/, shot-polish/, assets/audio/*, 124 shot cards = 150 styles). This file is the one place that records the whole method, so work is planned against it instead of being built in pieces. Scope rule from the owner: change **Motion Director only**.

## The method, stage by stage

0. **Mode.** After a read-only look at the product, offer three modes with a recommendation: Ink Press template, autonomous free creation, co-creation. Named shots or "Ink Press" skip the question. Co-creation asks 1–3 questions per turn, recommendation first; "you decide" switches to autonomous.
1. **Brief + decision table.** Product position, audience, purpose, selling points, must-show features, usable page states, length/ratio/language, music, data口径 (rules for real/fictional data). Every row is filled with a judgement and its evidence; the decision table links each confirmed need to what it changes. Saved as the **design spec**, which the final review checks against.
2. **Visual direction.** Up to 3 text directions from the product's own tokens (font, palette, radius, density, light, motion personality); user picks 1–2; then **styleframes**: 2–3 static 1920×1080 key images per direction from real captures/tokens (HTML/CSS, no video). Ink Press is only a candidate when the product suits paper/editorial. Motion tokens come from brand energy × tone (6 presets: trust, premium, bold, playful, calm, friendly).
3. **Feature → shot map.** For each feature a first-choice and alternate shot card. Names are resolved against `gallery/api/library.json` (card name + style key), never invented. Every chosen card is read in full, and its exact demo TSX is located. "Reference only" styles are not recommended unless named.
4. **Storyboard.** Energy arc: brand open (low, wordmark hold ≥1 s) → one protagonist shot (≥3 s) → feature climb (55–65 %) with breathing title cards (~50–55 f, 2–4 per film) → finale (group photo or equivalent, sign-off hold ≥1 s). One main motion per shot; a technique is the protagonist once; ≤3 flash cuts / whole-frame hits; no repeated tagline; bulk effects end with 0.5 s still. Per-seam transitions are chosen here. Approval of storyboard + spec = **release**.
5. **Final capture.** Puppeteer at 1920×1080 @2x: full-page 2x shot after fonts/settle, transparent element cutouts, `layout.json` (boxes in page CSS px + pageH), empty plate, hi-res (4x) crops for close-ups; data frozen/fictional. Real screenshots, never hand-drawn imitations.
6. **Per-shot build.** A coding agent edits the card's exact demo TSX: keep easings, durations, hold budgets and "known pitfalls"; replace only screenshots, coordinates, copy, brand tokens. Text that is part of the technique (≈25 cards) keeps word count and length ±15 %. Render at least entering / peak / settled stills per shot and look. Deterministic rendering (no random/clock). One look per film. Native card lengths are the quality: extra time becomes hold, never speed changes.
7. **Sound design.** SFX from the film-vocabulary library only (no synthetic UI beeps); each pinned to its action by measured peak (`from = targetPeak − peakLag − outputOffset`, offset measured on the render pipeline); long samples get explicit durations; quiet files (true peak < −12 dB, 7 of them) boosted; BGM at 0.34 with ~1 s in / 1.7 s out; ending riser → impact → sparkle; beat sync (kick/snare/hat, ≤3 f) only for supplied music, re-measured after render; keep a `bgm` switch so two versions come from one timeline.
8. **Independent review.** A clean-context reviewer gets the render, keyframes, spec, map, storyboard, cards and `final-review.md` and reports numbered findings with frame numbers (P product, F features, V visual direction, S shot cards, B storyboard, D data safety, A audio, Q visual quality); never "all ✓". Failures loop back to stages 3/5/6.
9. **Deliver.** Two renders (with / without music, same timeline), open the workbench (timeline of tracks, library, inspector, agent), then three closing notes (author mention, showcase invitation, JianYing export) — the last three are deliberately **not** in this app.

## Status in Motion Director (as of this file)

| Stage | State |
|---|---|
| 0 mode question (3 buttons) | done |
| 1 brief / decision table / design spec (`lib/designSpec.ts`, `coCreate.ts`) | done |
| 2 directions + styleframes + motion presets (`styleframes.ts`, `motionPreset.ts`) | done |
| 3 feature → shot map; gallery names | done for the catalog; legacy cards hidden |
| 4 storyboard: arc, caps/exclusions, native lengths, seams (`shotRules.ts`, `filmChat.ts`, `directorPlan.ts`) | done |
| 5 capture: 2x page, crops, cutouts, layout, empty plate, background function | done; hi-res 4x crops and extra page states unconfirmed |
| 6 per-shot build | done in code, **not run live**: text/colour/picture overrides plus per-shot code adaptation (`adapt` route -> `lib/shotAdapter.ts` sandbox -> `lib/adaptLoop.ts` 3 stills + reviewer, up to 3 rounds, 12 shots, 3 lanes, 240 s, waits and retries a rate limit; clip prop `adaptedCode` played by `cards/demoProps.tsx`, plain recipe on any failure). Site pictures: `brand/people-gallery` scene |
| 7 sound + music (`buildFilm.ts`, `beatSync.ts`, `defaultMusic.ts`) | done, not listened to by ear; a film with no attached track gets a licensed library track chosen by its motion voice, cuts snapped to its beat |
| 8 review (`filmReview.ts`, `filmFix.ts`, `designSpec.ts`) | programmatic checks + safe auto-fixes (A7, A5, Q11, B3) + optional model frame review + rendered-audio clipping check (`renderedAudio.ts`). D2 (named people) and P3 (unsupported claims) added. Still missing: F1, bulk-finish, recipe-swap fixes, beat back-test of the render; no runnable Remotion-project export (social publishing is present: ExportButton → Post to social) |
| 9 deliver | two renders + workbench done; closing notes excluded |

## Rules that must not be broken
- Motion Director files only; nothing removed from other studios.
- A recipe plays once per film; picked recipes are the only catalog shots.
- Never claim a live run, listening test or beat sync that was not measured.
- Generated code never runs without `checkAdaptedSource`.

## Order of the remaining work (do not split into new threads)
1. A live run once a key and a session are available (nothing above has run against a real site or model). 2. Missing review checks F1/P3/D2/bulk-finish and recipe-swap fixes. 3. Beat back-test of the render; 4x crops and extra page states in capture.

## Sibling method: video-talkcraft (vendored at `.claude/skills/video-talkcraft`, not integrated)

Narration videos. **Licence: PolyForm Noncommercial 1.0.0**, so commercial use needs the author's permission (see NOTICE.md).
- Inputs: a finished voiceover (`audio/full.wav`) and a matching script (`script.json`), or Fish Audio TTS from the script (`FISH_AUDIO_API_KEY`), plus optional host footage, B-roll and screenshots. Built for Chinese narration; numbers are written as Chinese characters so word timestamps align.
- Pipeline: script (one message per sentence, hook first) → word timestamps (`scripts/timestamps_cpu.py`, FireRedASR2-CTC with a faster-whisper fallback, or TTS timestamps) → `timing.json` → semantic annotation → SHOTBOOK layer matrix → `beats.json` derived from timing (never hand-typed seconds; `beat_lint.py` ≤ 0.1 s) → per-shot render → three QA gates (machine checks, a fresh-context reviewer writing `REVIEW.md`, cinematography rules) → delivery with two-pass loudnorm (I = −15, TP = −1.5).
- Captions: whole sentence at once, no typing effect, ≤ 3 keyword pops per film. SFX capped at 0.35 volume, one per frame.
- Workbench: port 5199, edits written to `remotion/overrides.json`; changing copy does not move beats.
- What integrating it into Motion Director would need: a voiceover or TTS source, a word-timestamp aligner (a Python service or a hosted API), a `timing.json` / `beats.json` model, a narration mode in the chat flow, and a decision on the licence. None of that exists yet.

## Upstream audio (shotcraft, 2026-10-29)
Per-project Freesound sourcing replaced the shared SFX library (see NOTICE.md). Motion Director keeps its bundled library for now. Moving over means: a Freesound client and per-clip licence/credit fields, replacing `SEAM_SOUNDS` / `BRAND_SOUNDS` in `lib/buildFilm.ts`, regenerating `sfxPeaks.ts` from fetched files, and changing the `sfxlib/` path checks in `filmFix.ts`, `filmReview.ts` and `useFilmDirector.ts`.

## Preview / export parity (what is and is not checked)
- Same component both ways: the Player preview and `renderMediaOnWeb` / `renderStillOnWeb` draw `MainComposition`.
- Known, deliberate differences (locked in `__tests__/previewExportParity.test.ts`): the preview runs one second past the export; export mode draws about a third of the motion-blur samples; audio gain above 1 plays in the export but is clamped to 1 in the preview; `OUTPUT_AUDIO_OFFSET_F` compensates encoder delay in the export only. Frame QA now renders its stills in export mode (`renderStillOnWebExport(…, asExport)`), so it checks what the MP4 will show.
- Pixel comparison (`e2e/motion-director-parity.spec.ts`, run offline with `MS_OFFLINE_CLERK=1` against `next dev -p 3100`): the Player frame is screenshotted and the export's frame for the same number is rendered (`window.__motionParity`, dev-only hook in `registerParityHook`), then compared at preview size. Measured 2026-11-10 on the Ink Press film (22 s, 1920×1080), counting a pixel as different when a colour channel is off by more than 32:
  - settled title cards (frames 25 and 617): 1.2 % and 1.4 % of pixels differ, mean channel difference about 3 (text edges: the Player and the web renderer paint text differently). Asserted at ≤ 3 %.
  - mid-film 3D shot (frame 315, the page wall): 27 % differ, mean 39. The preview draws a brushed-metal backdrop texture that the export draws as a plain gradient, and the page wall sits at a slightly different scale and tilt. **A real preview/export difference in that shot; not asserted equal, not yet explained or fixed.**
  - Three frames of one film is a sample, not a proof. The comparison ignores the bottom fifth of the frame (the Player's control bar).
  - Upstream's own check is `npm run parity` (< 0.1 % differing pixels between two Remotion CLI renders), a stricter and different comparison.
