# Round 9 — release readiness

Branch `claude/motion-director-pipeline-audit` (not merged, no PR, not deployed). The browser renderer (`@remotion/web-renderer`), its codecs and export infrastructure are unchanged; no rendering backend, database or auth change.

**Four claims, never collapsed:** code implemented · unit tests passed · real browser tested (Chromium, offline, director route mocked at the network layer) · live AI tested.

## 1. Live AI status
**BLOCKED — NO AUTHORIZED KEY.** Live planning, per-shot source adaptation, adapted-source validation against a model answer, frame review and final review have **not** been exercised. `round9/live-results.json` is the BLOCKED record; `round9/live-harness-dryrun.json` only proves the harness wiring with a stubbed route (never counted as live). Mocked-route e2e results below are labelled "mocked director" and are not live evidence. The offline adaptation proof uses the recipe's own source as a labelled stand-in for the model.

Model: `gpt-6-astra` is configured (`MOTION_STUDIO_DIRECTOR_MODEL` overrides it). OpenAI's documentation lists it as supporting the Responses API and Structured Outputs, so it was not changed. The route falls back to the next allowed model only if OpenAI answers 404/model_not_found for the account and no explicit model is set. **Unverified:** that a user's BYOK key has access to it, and that live requests succeed. To run live: export an authorized key as `MS_LIVE_OPENAI_KEY` (dev only, never written to disk or logs) and run `e2e/live/live-director.spec.ts` and `e2e/live/adaptation.spec.ts`.

## 2. What changed this round (code implemented)
| Area | Change |
|---|---|
| Readiness | `finalStatus` requires every stage completed or legitimately waived; QA `required == done`; review schema-valid, covering P/F/V/S/B/D/Q, tied to the film's fingerprint; stale review → `review-pending`; unavailable reviewer → `needs-review` warning (was a red failure) (`lib/productionRun.ts`, `lib/filmFingerprint.ts`) |
| Scene QA / sound | entering/peak/settled checks, mechanical vs visual-judgement; camera shots that fill the frame are judged visually; sound cues carry intent and timing (`sceneChecks.ts`, `sceneQa.ts`, `soundRecord.ts`) |
| OpenAI path | refusal/incomplete/empty outputs → typed errors; every schema strict-valid (unit-tested); Retry-After honoured; model fallback only on a real 404; dev-only live key path |
| Adaptation | acceptance gate in the loop; geometry helpers allowed to adapted code; proof for 3 recipes |
| Recovery | `lib/runStore.ts` + Resume / Start over in the chat; co-creation stages recorded as completed-with-the-person |
| DocumentTypewriterReveal | structured document content, no screenshot; export draws that recipe's camera with a transform instead of CSS zoom when a document is present (preview unchanged) |
| UX defect found by tests | opening the Workbench during a render asked for confirmation **twice** (since 2026-11-06); the second, unhandled prompt cancelled the navigation. One confirmation now. |

## 3. Exact test results
**Unit + API (vitest, `src/apps/motion-director tests/api`):** 77 files passed, 1 skipped; **553 tests passed, 1 skipped** (the skipped one is the live-key test). **tsc:** 2 errors, both the known `src/access/__tests__/preview-mode.test.tsx` (`AccessState` missing `hasSmartVideoViral`, `isSuperUser`); none in Motion Director.

**Real-browser (Playwright, offline, `--workers 1`):**
| Spec | Result |
|---|---|
| `motion-director-director.spec.ts` (non-render, 14 tests) | **14 passed** |
| `…director.spec.ts` › Render MP4 encodes the film (real in-browser render) | **FAIL with the spec's original 15-min cap; PASS (15.9 min) with a 60-min cap.** The render takes 15.9 min in this sandbox (02:44→03:00). The spec's caps were raised to 40 / 35 min. A sandbox-speed limit, not a functional failure. |
| `…director.spec.ts` › opening the workbench mid-render asks before cancelling | **FAIL** (double confirmation, a real defect) → fixed → **PASS** (27.6 s) |
| `motion-director-workbench-loop.spec.ts` | **2 passed** (3.2 min): create → edit title/scene/image → save → reload → reopen intact → draft MP4 export (h264 1280×720, AAC, 19.5 s; replacement logo and photos found in exported frames; evidence `round9/workbench/`); and interrupt → reload → Resume → edit |
| `motion-director-resume.spec.ts` | 3 passed |
| `motion-director-modes.spec.ts` | 2 passed (+ the co-creation assertions inside the director spec) |
| `motion-director-document.spec.ts` | 1 passed |
| `motion-director-production.spec.ts` | 5 passed |
| `motion-director-acceptance.spec.ts` A–H (C = real connections.com capture, F = real MP4 export + ffprobe/ffmpeg decode) | **12 passed** (A, B, C, D, E, F, G, H1, H2) |
| `motion-director-fidelity.spec.ts` (Round 7: 12 layout recipes identity/target/no-duplicate + JumpCutPunchIn standalone) | **13 passed** |
| `adaptation-proof.spec.ts` (reference source, not a model) | 3 passed |
| `motion-director-parity.spec.ts` | **FAIL** in the full run (closing frame 15.9 % > 3 %): the screenshot of the Player included its control-bar gradient (shown after the seek), the composition itself matched. Wait for the controls to hide raised 1.5 → 4.5 s; thresholds unchanged → **PASS**. Mid-film 3D frame remains a recorded known difference (not asserted). |
| `motion-director-workbench.spec.ts` | **FAIL — not fixed.** Stale test: its mocked plan assumes shots (HitCounter, CrashImpactReal) survive with no site; the storyboard gate now swaps shots whose material is missing, so the film has no Transitions/Captions tracks and the assertion `track Transitions` fails. The Workbench behaviours it targets are covered by `workbench-loop` (passed). Needs its mock updated, not an app change. |
| Recipe sweep (150 recipes) | **not re-run this round** |
| `e2e/live/*` | **BLOCKED — NO AUTHORIZED KEY** |

## 4. Persistence and review invalidation
`ProjectData.run` is saved with the project: unit test round-trips every stage record and the review through JSON; the workbench-loop spec reads it back after a reload; its fingerprint excludes the run so saving does not disturb the review. Editing a caption/title, replacing an image, changing a duration or editing adapted source each change the film fingerprint and return `finalStatus` from `ready` to `review-pending` (unit tests, parametrised).

## 5. Remaining defects / limits
1. **Live AI untested** (BLOCKED). Prompt quality, real adaptation output, real review verdicts and rate/time behaviour are unknown.
2. `motion-director-workbench.spec.ts` fails (stale mock, see above).
3. Export differs from preview for sample recipes that use CSS `zoom` (22 recipes) and SVG-texture backgrounds (known since Round 4; the mid-film parity frame differs ~27 %). Only the document recipe has an export-only camera path.
4. MP4 export of a 22 s film takes ~16 min in this sandbox; the toolbar draft export of the Workbench-loop film took ~3 min.
5. Offline, uploads have no storage: photos are tab-only (`blob:`), so Resume reports they must be re-attached (with a configured bucket they are durable).
6. The route's `maxDuration = 60` and per-call 55 s timeout versus long per-shot adaptation calls on the hosting platform are unmeasured.
7. A recipe marked `parameterized` can still show sample strings in the Workbench inspector's text list (ProductCardProgressiveAssemble); whether they are drawn in the frame was not checked this round.
8. Sound quality ("does it feel right") and visual taste are not machine-verifiable; scene QA lists these as needs-visual-judgement.

## 6. Readiness
Ready for **live AI testing** of the pipeline end to end: every stage, gate, recovery path, Workbench edit and browser MP4 export is verified with a mocked director; the harness for the live operations exists and is BLOCKED only for lack of a key. **Not ready to claim** a production release: the final acceptance milestone — a complete real-AI film following the upstream workflow (understanding → storyboard → source adaptation → review → editable Workbench project → browser MP4) — has not happened.

## 7. Exact release blockers
1. An authorized key run of the live harness and of one full film (real planning, adaptation, review) — `BLOCKED — NO AUTHORIZED KEY`.
2. Confirm BYOK access to `gpt-6-astra` for real accounts, and the route time limits on the deployment.
3. Update or retire the stale `motion-director-workbench.spec.ts`.
4. Decide whether the 22 zoom recipes' export difference is acceptable or needs per-recipe export paths.
