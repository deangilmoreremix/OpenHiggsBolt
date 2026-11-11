# Personalization modal — repair and certification report

Branch `claude/ecstatic-ritchie-fak2d5`. Evidence classes: **unit** (Vitest/jsdom), **mocked-browser** (jsdom with mocked renderer), **real-browser** (Playwright, local-only auth bypass), **verified-export** (real browser MP4, frames extracted with ffmpeg and looked at). Baseline for the personalization suite at the end: **1797 passed, 2 skipped, 0 failed** (125 files); `tsc` clean for the personalization code.

## Phase results

| Phase | Commit | What changed | Evidence | Not verified / open |
|---|---|---|---|---|
| 0 / 5 | ca3cca7 and earlier (see `personalization-phase5-final-report.md`) | baseline, alignment, placement engine, quality panel, source profiles, rights gate, coverage ledger | unit + verified-export (3 layouts x 4 shapes, 6 real demos) | 111/124 designs never real-exported; subject protection only for marked/declared zones |
| Image presets | 221049f, 390a43c, afd3ee0, 96c503d | 8 presets, px radius, borders, glow/badge, diagonal reveal/split, heart Polaroid, blob mask, roles | verified-export (`personalization-image-presets-report.md`) | corner radius not pixel-measured; Split Screen covers the bottle (flagged); Soft Masked small in 9:16 |
| 1 | ca689a4 | "Create without AI / Generate with AI"; no mode or consent needed for browser creation; AI modes only after choosing AI | unit + mocked-browser (zero prompt/generation/fetch calls) | Advanced Editing path not exercised in a real browser; "Return to editing / Retry failed operation" after an AI failure not built |
| 2 | 0a3b562 | optional Full Body Recast in Simple Mode step 2 (same pipeline/state as Advanced), credit + permission notice, default keeps original; duplicate paid starts blocked | unit; real-browser asserts the option and "Keeping your original video" | an actual recast run (needs live MuAPI) not executed |
| 3 | caf318c | imported/assigned/rendered states, "N imported / M in the video / K not used" summary, assign to Product/Service layer, Remove, automatic assignment marked | unit; real-browser shows the panel | assigning then exporting a chosen picture not frame-verified in this phase (presets exports did verify an assigned picture renders) |
| 4 | 4cd21c1 | export status split into generation / render / cloud save; a clip missing the approved layers is never offered for publishing; browser render failure keeps all edits, retry works with no AI call | unit + mocked-browser | AI-path failure still shows a completed result with a warning rather than an error state |
| 6 | 98386e9 | editor draws the real design with the composition player; full-frame designs not movable/resizable; no colour/font controls for text-less designs; timing in seconds; Restore design defaults vs Remove design (confirm) | unit (player mocked) | editor screenshot of a real design not captured; only some timing controls converted; no tab restructure |
| 7 | f3245bd | goals -> about six recommended designs -> full searchable library (one shared selection); Add vs Replace design; undo/redo (coalesced) | unit + real-browser (recommendations visible, undo/redo present) | undo/redo not exercised in a real browser; goal scoring is a deterministic category table, not learned |
| 8 | this commit | real-browser journey spec, persistence round-trip test, this report | verified-export of one journey (16:9) | other ratios and Advanced journey not run |

## Real-browser journey (verified-export, 16:9)

`e2e/personalization-phase8-journey.spec.ts`: find business -> 5 real photos -> Simple Mode step 2 (perfume demo, recast skipped) -> step 3 asset panel -> step 4 recommendations -> approve -> confirm rights -> browser render -> MP4. **60 network requests recorded, 0 matching AI / prompt personalization / MuAPI / recast** (`docs/phase8-evidence/16x9-requests.json`). Frames at 0.3 / 2.0 / 4.0 s inspected (`journey-export-frames-16x9.png`): footage, KK LAW logo, business name, and the end card at the end. The photos are "imported — not used" because the default layout was Business Introduction (no product layer): the panel said so (`16x9-1-assets.png`), which is the intended honesty.

## Screenshot acceptance (S1–S7)

| | Verdict |
|---|---|
| S1 Starfield editor | **Unverified in a real browser** — fixed in code (real design player, no name label, no drag/resize, no text controls, seconds, restore vs remove) and unit-tested |
| S2 UNAUTHENTICATED | **Partly verified** — Simple Mode journey makes no prompt/AI request (real browser); Advanced no-mode path unit-tested; AI-failure "retry/return" flow not built |
| S3 Quick Adjustments | **Pass** (real-browser screenshot): goals + 6 cards + full library; one shared selection |
| S4 Recast | **Unverified** for a real recast; option, credit notice, skip-by-default verified; duplicate-start guard unit-tested |
| S5 UX board | **Partial** — credit-free flow completes in Simple Mode; no progress/"next action" redesign |
| S6 Gallery compositions | see Phase 5 report (verified-export) |
| S7 25 assets | **Partial** — states and summary verified (unit; real browser with 5); 25-asset case unit-tested only |

## Migration manifest for `remix-new-editor` (documentation only — nothing there was modified)

Reusable, pure modules (no provider imports): `preview/placement/*`, `preview/imageStyle.ts`, `preview/imagePresets.ts`, `preview/assetUsage.ts`, `preview/mediaRoles.ts`, `preview/sourceProfile.ts`, `templates/recommendations.ts`, `addDesignTemplate`/`removeDesignLayer` in `preview/presets.ts`. React pieces that depend only on the provider contract: `guided/StyledBusinessImage` (in `preview/`), `AssetUsagePanel`, `DesignRecommendations`, `RecastOption`, `DesignLayerPlayer`. Dependencies: `@remotion/player`, `@remotion/web-renderer`, `remotion` 4.0.499 (browser export); no new packages. Behavioural differences to expect: browser creation needs no mode; designs are chosen by goal; image styles are overlay-only. OpenHiggsBolt-specific: the demo registry/rights model, `DemoPersonalizeProvider` state names, local-only Clerk bypass for tests, and the catalog of 124 designs.

## Open owner decisions

1. ~~Rights gate~~ RESOLVED: the owner confirmed all 123 registry demo clips are usable with no restrictions; they are `verified-owned` (no Review item, no export confirmation). Uploaded / non-registry clips remain unverified and keep the confirmation gate.
2. ~~Storefront/office as "property"~~ CONFIRMED by the owner.
3. RemotionUI licence is MIT (no attribution required); integrating any of its 217 components is a separate, un-started piece of work.
