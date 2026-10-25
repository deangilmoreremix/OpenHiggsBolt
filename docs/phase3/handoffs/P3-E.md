# P3-E — Export Matrix Engineer

**Agent:** P3-E
**Wave:** 3
**Status:** ⚠️ partial (14/19 designs PASS with full encoded-pixel proof; 5 designs FAIL with documented findings F1–F3 — no assertion skipped or weakened; the run is intentionally red on the findings)
**Lane used:** browser-e2e holder for Wave 2 (build lock held by orchestrator; no build/test:unit run by P3-E)
**Files changed:**
- `e2e/personalization-step4-remotion-export.spec.ts` (Phase 3 matrix test + helpers; the three Phase 2 tests are untouched)
- `docs/phase3/EXPORT_MATRIX.md` (the matrix + findings)
- `docs/screenshots/phase-3/**` (38 PNGs: personalized + control encoded-frame capture per design)
- `docs/phase3/handoffs/P3-E-run3-raw.log` (complete raw run log, 95 KB)

**Files NOT changed (owned by others):** everything else. In particular `rveSharedDesign.tsx` (F3 owner), `BokehCircles.tsx`/`Starfield.tsx` (F1/F2 upstreams), `@remotion/web-renderer` (F1 rasterizer), P3-F's `e2e/personalization-studio-triggers.spec.ts`.

## Commands run and raw output

### Host gate (before the final run — earlier checks failed and the run was delayed)

```
16:11  up  3:43, 1 user, load averages: 147.89 122.93 71.42      ← GATE FAIL (delayed the run)
16:30  up  4:01, 1 user, load averages: 123.70 93.99 86.96       ← GATE FAIL (delayed the run)
17:01  up  4:33, 1 user, load averages: 4.04 13.30 76.93
available: 2.53 GiB                                               ← GATE PASS → run started
```

### Spec collection check

```
$ npx playwright test e2e/personalization-step4-remotion-export.spec.ts --project=chromium --list
Total: 4 tests in 1 file
```

### Final run (run 3 — the verdict run; runs 1–2 failed on plumbing, see below)

```
$ npx playwright test e2e/personalization-step4-remotion-export.spec.ts --project=chromium --reporter=list --retries=0 --workers=1

Running 4 tests using 1 worker
  ✓  1 [chromium] › .../personalization-step4-remotion-export.spec.ts:603:7 › Phase 2 › the browser export produces a real encoded MP4 that contains the design (29.6s)
  ✓  2 [chromium] › .../personalization-step4-remotion-export.spec.ts:657:7 › Phase 2 › the design is in the encoded pixels, and the un-personalized render has none (39.6s)
  ✓  3 [chromium] › .../personalization-step4-remotion-export.spec.ts:911:7 › Phase 2 › every registered design exports to a real encoded MP4 (2.0m)
  ✘  4 [chromium] › .../personalization-step4-remotion-export.spec.ts:1193:7 › Phase 3 — the export matrix › every registered design is encoded, pixel-compared against its control, and carries the credit line
  1 failed
    [chromium] › ...:1193:7 › Phase 3 — the export matrix …
  3 passed (19.0m)
```

Test 4's failure is the summary assertion after ALL 19 designs were measured — it lists the
five findings and points at the matrix logged above it. The per-design raw rows (verbatim,
from the run log; `creditText` omitted per row for brevity — full credit evidence below):

```
P3E: matrix row {"id":"animated-headline","label":"Animated Headline","size":2040644,"controlSize":1992508,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":432,"top":157,"width":1056,"height":594},"brandInBox":16186,"brandInBoxControl":0,"changedInBox":22214,"changedOutsideBox":0,"changedTotal":22214,"creditChanged":2358,"creditBrighter":2033,"error":null}
P3E: matrix row {"id":"logo-reveal","label":"Logo Reveal","size":2034751,"controlSize":2000730,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":576,"top":270,"width":768,"height":432},"brandInBox":2492,"brandInBoxControl":0,"changedInBox":12654,"changedOutsideBox":0,"changedTotal":12654,"creditChanged":2592,"creditBrighter":1969,"error":null}
P3E: matrix row {"id":"lower-third","label":"Lower Third","size":2028653,"controlSize":1995201,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":-19,"top":313,"width":1190,"height":670},"brandInBox":4590,"brandInBoxControl":0,"changedInBox":49561,"changedOutsideBox":0,"changedTotal":49561,"creditChanged":2235,"creditBrighter":2101,"error":null}
P3E: matrix row {"id":"promo-cta","label":"Promo CTA","size":2013777,"controlSize":2000220,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":432,"top":481,"width":1056,"height":594},"brandInBox":6398,"brandInBoxControl":0,"changedInBox":626717,"changedOutsideBox":1487,"changedTotal":628204,"creditChanged":6156,"creditBrighter":2524,"error":null}
P3E: matrix row {"id":"visual-effect","label":"Bokeh Particles","size":2016379,"controlSize":2002008,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":0,"top":0,"width":1920,"height":1080},"brandInBox":0,"brandInBoxControl":0,"changedInBox":2253,"changedOutsideBox":0,"changedTotal":2253,"creditChanged":2253,"creditBrighter":2322,"error":"Bokeh Particles: only 0 brand-primary pixels inside the design box"}
P3E: matrix row {"id":"starfield-warp","label":"Starfield Warp","size":2037086,"controlSize":2002137,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":0,"top":0,"width":1920,"height":1080},"brandInBox":12,"brandInBoxControl":0,"changedInBox":6711,"changedOutsideBox":0,"changedTotal":6711,"creditChanged":2259,"creditBrighter":2305,"error":"Starfield Warp: only 12 brand-primary pixels inside the design box"}
P3E: matrix row {"id":"logo-bounce-drop","label":"Logo Bounce Drop","size":2045298,"controlSize":2002995,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":288,"top":162,"width":1344,"height":756},"brandInBox":77966,"brandInBoxControl":0,"changedInBox":86571,"changedOutsideBox":0,"changedTotal":86571,"creditChanged":2200,"creditBrighter":2199,"error":null}
P3E: matrix row {"id":"logo-mask-wipe","label":"Logo Mask Wipe","size":2030995,"controlSize":2002538,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":384,"top":162,"width":1152,"height":648},"brandInBox":13084,"brandInBoxControl":0,"changedInBox":54357,"changedOutsideBox":0,"changedTotal":54357,"creditChanged":2213,"creditBrighter":2262,"error":null}
P3E: matrix row {"id":"logo-split-reveal","label":"Logo Split Reveal","size":2067994,"controlSize":1992514,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":288,"top":162,"width":1344,"height":756},"brandInBox":53941,"brandInBoxControl":0,"changedInBox":63314,"changedOutsideBox":0,"changedTotal":63314,"creditChanged":2222,"creditBrighter":2196,"error":null}
P3E: matrix row {"id":"brush-stroke-reveal","label":"Brush Stroke Headline","size":2041826,"controlSize":2000050,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":336,"top":189,"width":1248,"height":702},"brandInBox":34296,"brandInBoxControl":0,"changedInBox":43417,"changedOutsideBox":0,"changedTotal":43417,"creditChanged":2205,"creditBrighter":2245,"error":null}
P3E: matrix row {"id":"text-mask-reveal","label":"Text Mask Reveal","size":2026374,"controlSize":1993673,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":288,"top":162,"width":1344,"height":756},"brandInBox":20757,"brandInBoxControl":0,"changedInBox":28348,"changedOutsideBox":0,"changedTotal":28348,"creditChanged":2188,"creditBrighter":2198,"error":null}
P3E: matrix row {"id":"glitch-text","label":"Glitch Headline","size":2030103,"controlSize":1991884,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":288,"top":162,"width":1344,"height":756},"brandInBox":83000,"brandInBoxControl":0,"changedInBox":96997,"changedOutsideBox":0,"changedTotal":96997,"creditChanged":2261,"creditBrighter":2186,"error":null}
P3E: matrix row {"id":"logo-blur-reveal","label":"Logo Focus Reveal","size":2015525,"controlSize":2000698,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":336,"top":189,"width":1248,"height":702},"brandInBox":67089,"brandInBoxControl":0,"changedInBox":75751,"changedOutsideBox":0,"changedTotal":75751,"creditChanged":2222,"creditBrighter":2246,"error":null}
P3E: matrix row {"id":"chapter-title","label":"Chapter Title","size":2049529,"controlSize":1990384,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":240,"top":135,"width":1440,"height":810},"brandInBox":17832,"brandInBoxControl":0,"changedInBox":28298,"changedOutsideBox":0,"changedTotal":28298,"creditChanged":2281,"creditBrighter":2278,"error":null}
P3E: matrix row {"id":"bar-chart-anim","label":"Animated Bar Chart","size":2047012,"controlSize":2004128,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":288,"top":162,"width":1344,"height":756},"brandInBox":70921,"brandInBoxControl":0,"changedInBox":80277,"changedOutsideBox":0,"changedTotal":80277,"creditChanged":2195,"creditBrighter":2193,"error":null}
P3E: matrix row {"id":"rve-circular-progress","label":"Progress Ring","size":2067063,"controlSize":1991396,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":288,"top":162,"width":1344,"height":756},"brandInBox":3204,"brandInBoxControl":0,"changedInBox":23019,"changedOutsideBox":0,"changedTotal":23019,"creditChanged":15798,"creditBrighter":15972,"error":"Progress Ring lost the OFL typeface attribution"}
P3E: matrix row {"id":"rve-animated-text","label":"Animated Text","size":2015500,"controlSize":1998135,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":192,"top":108,"width":1536,"height":864},"brandInBox":14694,"brandInBoxControl":0,"changedInBox":34700,"changedOutsideBox":0,"changedTotal":34700,"creditChanged":15823,"creditBrighter":16279,"error":"Animated Text lost the OFL typeface attribution"}
P3E: matrix row {"id":"rve-popping-text","label":"Popping Text","size":2007083,"controlSize":2002270,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":288,"top":162,"width":1344,"height":756},"brandInBox":8978,"brandInBoxControl":0,"changedInBox":41650,"changedOutsideBox":0,"changedTotal":41650,"creditChanged":15882,"creditBrighter":16290,"error":"Popping Text lost the OFL typeface attribution"}
P3E: matrix row {"id":"rve-slide-text","label":"Sliding Text","size":2064382,"controlSize":2006744,"magic":"ftyp","majorBrand":"isom","hasAvc1":true,"duration":5.077333,"controlDuration":5.077333,"width":1920,"height":1080,"designBox":{"left":192,"top":108,"width":1536,"height":864},"brandInBox":10315,"brandInBoxControl":0,"changedInBox":29215,"changedOutsideBox":0,"changedTotal":29215,"creditChanged":15819,"creditBrighter":15843,"error":"Sliding Text lost the OFL typeface attribution"}
```

### Credit line evidence (from the export DOM probe, verbatim)

Repo-1 designs (15/19):

```
"creditText":"© 2026 Trimora Inc. (RenderComp) · MIT · Typeface: Inter (SIL OFL 1.1) © 2016 The Inter Project Authors"
```

RVE designs (4/19) — carries the RVE MIT credit but NOT the OFL notice (finding F3):

```
"creditText":"Remotion templates by React Video Editor (reactvideoeditor.com) — MIT License.Free Remotion Template Component — … THE SOFTWARE IS PROVIDED \"AS IS\", …"
```

### Runs 1–2 (plumbing failures — fixed, never weakened an assertion)

Run 1 (`3 passed (1.8m)`, matrix aborted at design 1):

```
Error: Animated Headline: only 0 brand-primary pixels inside the design box
```

Cause: for runtime-derived designs `applyDesign` had no `primarySlotLabel`; the inspector
renders per-slot fields only (`textareas:["Headline"]`, no generic `Layer text`), so no text
was ever filled and the demo's brand fallback headline is empty → no glyphs → 0 pixels.
Fix: fill every slot textarea the inspector shows (registry-agnostic).

Run 2 (`3 passed (3.3m)`, matrix aborted at design 5):

```
Error: Bokeh Particles: only 0 brand-primary pixels inside the design box
```

Cause: genuine — see finding F1. Fix (spec-level): the loop was restructured so every design
is always measured (failure recorded per row, run fails at the end with the complete matrix).

## Decisions

- **Design list derived at runtime** from the Step 4 "Designs" chip row (rendered from `listRemotionDesignTemplates()`); the spec hard-codes no design ids and asserts ≥ 19 chips. A registry drift changes the matrix automatically — that is the defect item 7 exists to prevent.
- **Brand Text + Accent pinned to `#29d3f2` per context (Step 3 pickers):** `starfield-warp`, `bar-chart-anim` and `rve-circular-progress` paint their heroes from `colors.text`/`colors.accent`, not the layer colour; without this they could never be brand-primary-compared.
- **Every slot textarea filled** with the headline text (see runs 1–2).
- **Failures never abort the loop:** a failing design is recorded with its measured numbers + the failing assertion + PNG evidence, the loop continues, and the run fails at the end with the full matrix logged. Nothing skipped, nothing weakened.
- **Screenshot evidence is written BEFORE the assertions**, so failures also leave captures.
- `promo-cta`'s 1 487 outside-box changed pixels pass the existing rule (≤ max(50, 5 % of 628 204)); the card shadow bleeds past the box edge and the encoder smears it. Not special-cased.

## Interface changes (consumers must know)

- `e2e/personalization-step4-remotion-export.spec.ts` exports two new helpers other suites may reuse: `openStep4WithBrandPrimary(page)` and `compareEncodedFrames(page, args)`; `runPersonalizedExport` gained the `brandPrimaryColours?: boolean` option. No existing test's behaviour changed.

## Open questions / blockers

- **F1 (owner: design lane / `@remotion/web-renderer`):** `visual-effect` paints zero pixels in every browser export — the rasterizer implements neither CSS `radial-gradient`, nor `filter`, nor blend modes. Product defect; needs an upstream/adapter fix, then a matrix re-run.
- **F2 (owner: design lane):** `starfield-warp` is present (6 711 changed px in-box, 0 outside) but its 1–2 px gradient lines leave only 12 near-brand pixels after H.264 quantisation — below the 200 threshold. Needs thicker star ink or a dedicated accepted assertion.
- **F3 (owner: RVE/shared-design lane):** `RveCreditBlock` in `templates/designs/rveSharedDesign.tsx` does not append `DESIGN_FONT_ATTRIBUTION`, so the OFL typeface notice is missing from the 4 repo-2 designs' credit lines (the repo-1 credit has it). One-line fix + matrix re-run.
- **Host gate:** the run was held twice (load1 147.9 and 123.7 > 40) until the gate passed; final run executed at load1 4.0–4.7, available 2.38–2.53 GiB.

## Wave compliance

- [x] Edited only files listed against my ID in `docs/phase3/OWNERSHIP.md` (spec, EXPORT_MATRIX.md, docs/screenshots/phase-3/**, handoff + raw log)
- [x] Did not run a build/test/e2e command without authorization (no `npm run build*`, no `test:unit`; browser e2e only, as designated browser holder; `--workers=1`, `--retries=0`)
- [x] Did not rebase, reset, stash, checkout, restore, clean, or touch `origin/main`, `netlify.toml` or `.github/`
- [x] Wrote this handoff file and posted a `RESULT` to the board
