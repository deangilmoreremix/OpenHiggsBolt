# Upstream creation parity (Round 8)

Upstream: `Vincentwei1021/video-shotcraft` (vendored at `.claude/skills/video-shotcraft`: SKILL.md, references/pipeline.md, guided-free-creation, aesthetic-rules, final-review, sequences/promo-energy-arc, music-beat-sync, sound-design, sfx-sourcing, workbench, template/).
Application: `src/apps/motion-director/`. Renderer (`@remotion/web-renderer`), Netlify/Supabase/auth/BYOK, Workbench and the Round 6-7 repairs are unchanged.

**Four separate claims per stage** — never collapsed into "done":
**C** code exists · **T** automated tests pass (unit, vitest) · **B** real browser verified (Playwright + Chromium, offline, director route mocked) · **L** live AI verified (real OpenAI planning / adaptation / review).
**L is NOT verified for any stage**: there is no OpenAI key in this environment. Every "B" below that involves the director used a mocked director route (shapes of the real contract), labelled "simulated".

## Stage table

| Upstream stage | Existed before Round 8 | Missing | Implemented in Round 8 (code) | C | T | B | L |
|---|---|---|---|---|---|---|---|
| Modes (Ink Press / autonomous / co-creation / single) | yes (`filmChat.ts`, `useFilmDirector.ts`, `coCreate.ts`) | a single record of which mode ran; autonomous planning failure silently handled | `ProductionRun.mode`; directions/mapping failures retried then recorded (derived direction) or stop the plan (`MAPPING_EMPTY`), no arbitrary shots; key-missing still falls to the template with a stated reason | yes | yes (`productionRun`, `useFilmDirector` suites) | director spec (11 tests) incl. no-key Ink Press, co-creation approvals | no |
| 0 Product understanding | heuristic design spec only | structured brief, business kind, decision table that affects the build | `lib/productBrief.ts` (`classifyBusiness`, `buildProductBrief`, `decisionTable`), `lib/material.ts` (what is in hand); brief logged to the chat; restrictions per business (real estate, restaurant, health) | yes | yes (`productBriefGate`) | upload film: brief says real estate | no (rule-based; no model brief) |
| 1 Visual direction + styleframes | directions + styleframes for co-creation only; styleframes rendered after the storyboard | direction recorded as a stage; styleframes at the right time; no silent null | direction retried once, else derived from the product (kind, palette, motion voice) and labelled `derived`; styleframes render the moment a direction exists (`onDirection`), before shots are chosen; direction recorded in the run | yes | partly (run invariants) | upload film (direction mocked) | no |
| 2 Feature → shot map | yes (`requestMapping`, `releaseCheck`) | failure became a warning and planning went on | retry once; empty map stops with `StoryboardError`; map recorded in the run and the spec | yes | yes | upload film (map mocked) | no |
| 3 Storyboard + gate | yes (shotRules, fitNativeLengths, chooseSeams, releaseCheck) | gate on business suitability / material / sample-only; per-scene source of truth | `lib/storyboardGate.ts`: recipes exist, suit the business and the material in hand, not sample-only, length; swaps (never the person's picks, those are reported); `lib/recipeNeeds.ts` per-recipe needs; per-scene records (`sceneRecords`) | yes | yes | upload film: Spotlight Hero Card (needs a page) swapped for a gallery shot, said in the chat | no |
| 4 Final asset collection | targeted capture, picture assignment, layout from capture (Round 7) | gating by what a recipe reads; uploads-only films | needs gate (`page`/`images`/`document`/`text`/`logo`/`abstract`); gallery recipes (Multiplane, WhipBrake, FreezeAnnotate) accept uploaded images (cover-cropped); missing material → stage `needs-input` naming the scenes | yes | yes | upload film (3 photos, no URL) builds and shows the photos | no |
| 5 Per-shot build from recipe source | adaptation loop (12 shots/3 rounds/3 lanes/240 s), props, Round 7 geometry | adaptation skipped without a capture; leftover shots silently plain; no per-scene proof | adaptation eligible per recipe input (not per capture), continuation pass for shots beyond the limit/budget (`pending`), reviewer hints as first problems; `lib/sceneQa.ts`: each shot rendered alone with and without the person's content, must differ ≥1% of the frame; result stored per scene | yes | yes (`sceneQa`, `adaptLoop` incl. continuation) | upload film: Multiplane content changes 31.9 % of its frame, product-card shot 15.6 %; photos present in the export frame | **no** (real source adaptation untested) |
| 6 Sound + beat sync | yes (bundled SFX/BGM, `beatSync`, `renderedAudio`) | evidence that cues belong to events; edit → recompute | `lib/soundRecord.ts` (cue → event, cuts with/without sound, licence record = bundled library); sound stage fails on silent cuts; cues recomputed by the rebuild path on edits | yes | yes | upload film + edit film (7 SFX hits; cues present after edit) | n/a |
| 7 Independent review + correction | yes (`finalReview`), run after "ready" | review state as a gate; correction | film shown as a **draft**; `ready` only if QA completed AND a reviewer ran and passed; no-key / empty answer → `unavailable`, never passed; findings stored with second/frame; one correction pass rebuilds the failed shot with the reviewer's note; edits invalidate the review | yes | yes | reviewer passes → "Ready for final export"; failing finding → correction rebuild → not ready; no reviewer → "independent review did not run" (simulated reviewer) | **no** |
| Deliver + Workbench | yes | run not persisted | `ProjectData.run` saved with the film; scene-level edits (`lib/editFilm.ts`): keep/replace/stronger ending → storyboard edit → rebuild, untouched shots keep adapted source, touched shots re-checked | yes | yes (`editFilm`) | edit e2e passes; run present in the saved project after opening the Workbench | no |

## Evidence executed this round
- Unit (vitest, `src/apps/motion-director`): 394 passed, 1 skipped (new: `productionRun`, `productBriefGate`, `sceneQa`, `editFilm`, `soundRecord`, adaptLoop continuation, retext repeat).
- `e2e/motion-director-production.spec.ts` (4 tests, passed): uploaded-photo film (real estate brief, gate swap, scene QA, photos in the export frame, saved run), edit by scene, reviewer pass → ready, failed shot → correction pass.
- `e2e/motion-director-acceptance.spec.ts` A–H2 re-run on Round 8 code: A–G, H1 passed; H2 failed once (my adaptation-eligibility change skipped the source fetch) and passed after the fix. This includes **C: real `https://www.connections.com/` capture, no mock** and **F: browser MP4 export decoded with ffprobe/ffmpeg**.
- `e2e/motion-director-director.spec.ts` (11 non-render tests) passed; its mock capture now carries cards and one assertion follows the "draft" wording.
- Trace: `round8/run-upload-film.json` is the saved run of the uploaded-photo film (below).

## Example production trace (uploaded photos, no website; director route simulated)
Request: "20-second luxury real estate video with these three photos … Seaside Homes … end with a call to book a tour." (3 supplied images)
1. **brief** completed — kind `real-estate`, material 3 images, restrictions: no invented room counts/views/prices; decision row "3 supplied images are the visual subjects"; "no software-dashboard recipes".
2. **direction** completed — "Quiet luxury" (simulated director).
3. **mapping** completed — feature "The home" → MultiplaneReal (simulated).
4. **storyboard** completed — plan of 4 scenes; gate swapped SpotlightHeroCard (needs a captured page) → ProductCardProgressiveAssemble; chat reports the swap.
5. **assets** completed — all scenes' needs satisfied by the images.
6. **build** completed — scenes: 1 title (text), 2 `ProductCardProgressiveAssemble` (images, parameterized, scene QA passed: content changes 15.6 % of frame), 3 `MultiplaneReal` (images, parameterized, passed: 31.9 %), 4 title. Adaptation: no model (director route mocked 502 for `adapt`), shots keep parameterised recipes.
7. **sound** completed — 7 SFX hits, library music chosen for the motion voice.
8. **qa** completed — frame QA 14+ frames.
9. **review** — reviewer unavailable (401 with no key) → recorded `unavailable`; status line "Draft passed the technical checks · independent review unavailable" — **not** ready.
Export frame of the Multiplane shot contains the supplied photo colours (≥1 of 3 detected, counts in trace JSON).

## Remaining limitations (honest)
- **No live AI verification**: planning, brief (model), mapping, source adaptation and review are untested against a real model. The "source adaptation" path is proven only with a fake model (unit) and by 502/404 failure handling (acceptance H1/H2).
- Business classification is rule-based (keyword evidence), not model judgement.
- DocumentTypewriterReveal still has no structured-document input (flagged unsupported, plays as sample + inset).
- Run persistence: the run is saved with the project when the film is installed in the Workbench; an interrupted run is not auto-resumed on reload (`recoverRun`/`resumePoint`/`scenesToBuild` exist and are unit-tested but not wired to a reload prompt).
- Co-creation approval boundaries were covered by the existing director spec, not re-tested with the new run; Ink Press scene-by-scene replacement is Round 6/7 behaviour (the gate does not swap Ink Press scenes).
- The sound stage verifies cut coverage and records licences; whether the sound *feels* right is not machine-verifiable.
- Freesound per-project sourcing (upstream sfx-sourcing) is not adopted: bundled library kept (documented difference).
- Browser MP4 export and ffprobe were verified by acceptance F on the Round 8 code; the Workbench edit → save → reload → re-export loop was not run end to end this round.
