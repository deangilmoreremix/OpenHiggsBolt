# Automatic rounded image styling — implementation and verification report

Scope: OpenHiggsBolt personalization only (shared Remotion composition; no new renderer, backend, provider or paid service; `remix-new-editor` untouched; not deployed). Commits: `f0304e5`, `e874175`… see `git log` (styling commits are titled "Image styling" / "Automatic rounded image styling").

## What it does
Assigned business images are framed at the **overlay layer**; the discovered/uploaded file and the Asset Library entry are never modified.

| Image | Default look | Why |
|---|---|---|
| Product / service image | rounded rectangle (radius 12 % of the frame's shorter side), **contain** fit, subtle shadow | the whole picture stays visible — nothing is cropped to get rounded corners |
| Explicit headshot/portrait only (asset categorised `person`, portrait-like shape) | circle, cover fit, crop focus 50 % / 35 %, thin brand border | a photo that merely contains a person is **not** circular |
| Logo | original proportions and transparency: no clip, no fill, no shadow, no border | never forced into a shape |
| Transparent-corner, already-shaped or already-framed image | no second frame | detected from pixels (`analyzeImagePixels`) |
| Template-declared style | wins over the defaults | `resolveImageStyle({ templateStyle })` |
| Picture-in-picture, full-frame, design roles | untouched | role contract (`preview/mediaRoles.ts`) |

Until a contained picture's size is known the automatic frame is **held back** (image shows unstyled) so a shadow is never drawn around an empty square.

## Where it lives
- `preview/imageStyle.ts` — style model, `resolveImageStyle`, geometry helpers (radius/border/shadow scale from the **composition height**, not the browser surface), exit animation factors.
- `preview/imagePixels.ts`, `preview/imageHintsLoader.ts` — transparent corners / existing frame detection; measured aspect saved in the shared `previewSettings.imageHints`.
- `preview/StyledBusinessImage.tsx` — shadow on an **unclipped outer wrapper**, clip + border + fill on the inner one; injectable image renderer (Remotion `Img` in the composition, `<img>` in the editor).
- `PersonalizationComposition.tsx` (gallery card, live preview and export all render it), `guided/OverlayEditor.tsx` (same component, scaled by the stage factor), `guided/ImageStyleControls.tsx` (shape, corner radius, border incl. brand/accent colour, shadow, fit, crop X/Y, exit, Back to automatic), `guided/buildPreviewInput.ts` (asset flags → hints), `placement/*` (styled frame + shadow bleed in collision checks).
- State: `layer.imageStyle` and `settings.imageHints` live in the shared project settings, normalised on restore (Simple ↔ Advanced and save/restore use the same settings).

## Evidence (real browser, real footage, real MP4 export)
Fixture: a 3:2 product photo (magenta backdrop, yellow **subject circle spanning 95 % of its height**) and a transparent-background wordmark logo, placed by the Product Showcase layout on two real demo clips (`seedance-1` 16:9, `minimax-h3` portrait 720×1280) at 16:9, 9:16, 1:1 and 4:5 — 8 exports, hashes in `docs/image-styling-evidence/mp4-hashes.csv`, pixel measurements in `pixel-analysis.json` (`scripts/phase5-image-analysis.py`).

| Measurement across the 8 exports | Result |
|---|---|
| Frame aspect (expect 1.5, not stretched) | 1.495 – 1.513 |
| Corners of the image frame rounded | 4/4 in all 8 |
| Subject circle aspect (expect 1.0) | 0.993 – 1.007 |
| Subject height / frame height (expect 0.95, not cropped) | 0.938 – 0.960 |
| Logo | white wordmark drawn with **no box** (transparency preserved) — visual check |

Shadow, proven by A/B (same project/frame, shadow `None` vs automatic): just below the image the frame is 9.0 levels brighter without the shadow at 2 px, 6.8 at 8 px, 3.1 at 16 px, 0.3 at 28 px; a control region far from the image differs by −0.1. (A single-frame "darker below the edge" metric is unreliable on moving footage and was not used as proof.)

Surface parity (`card-preview-export-editor-16x9-and-9x16.png`): gallery card, live preview at 1.5 s, exported frame at 1.5 s and the editor stage all show the same rounded rectangle.

Subject-aware placement: with the customer marking the subject as "centre", the engine moves the styled image off the cat's face at every shape and puts the name on the black bar in 9:16 (`styled-exports-subject-marked-center.png`).

## Tests
Vitest (preview/guided/placement): 8 component tests (clip inner / shadow outer, scaling, plain logo, injected renderer), 23 style/geometry/pixel tests, 7 editor tests (controls, automatic vs your style, Back to automatic, logo untouched, held back without size), 3 placement tests. Full personalization suite: 113 files, 1706 passed, 0 failed.

## Bug found and fixed by the real export
The first real export showed square corners: the frame analyser compared the outer ring with the deep interior and called any product photo on a solid coloured backdrop "already framed". It now compares the ring with the band just inside it (a backdrop continues inward; a frame does not). Covered by a test.

## Not done / limits (stated plainly)
- Subject protection is only as good as the subject information: with no marked/verified subject area the image can still land on a face or product (the panel reports Review Required, and the customer can mark the subject). No face or object detection exists.
- `alreadyFramed` detects only a thin, uniform, non-white ring; decorative frames that are not uniform are not recognised. Transparent corners are detected from alpha only.
- Only images assigned to layers are styled (logo, product ×2). Person/brand assets are not yet rendered at all (Phase 3 of the plan) so the headshot→circle path is unit-tested but has no real-export evidence.
- Template-declared styles are supported by the resolver but no registered template declares one yet; designs that draw their own media keep their treatment.
- Exit animation (`fade`, `shrink`) is implemented and unit-tested; it has no exported-frame evidence.
- Pixel checks use a synthetic photo; real discovered photos were not run through the export.
