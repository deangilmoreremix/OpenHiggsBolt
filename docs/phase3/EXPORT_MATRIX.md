# Phase 3 item 7 — the export matrix (P3-E)

**Run:** one Playwright spec run covering all 19 registered designs —
`npx playwright test e2e/personalization-step4-remotion-export.spec.ts --project=chromium --reporter=list --retries=0 --workers=1`
(2026-10-21, 19.0 min, production build served on `http://localhost:3111`, host gate passed:
load1 4.0–4.7 < 40, available 2.38–2.53 GiB > 1.5 GiB).
Raw log: `docs/phase3/handoffs/P3-E-run3-raw.log`. Raw MP4s: `test-results/remotion-export/`.
Visual evidence (encoded-frame captures): `docs/screenshots/phase-3/<id>-{personalized,control}-frame.png`.

**Design list:** derived at RUNTIME from the Step 4 "Designs" chip row, which is rendered from
`listRemotionDesignTemplates()` — the spec hard-codes no design ids. 19 chips were derived
(5 Phase 1 + 10 batch 1 + 4 RVE), matching the registry.

**Method, per design:** the same composition is exported twice in fresh browser contexts —
once with the design applied, once as a CONTROL with the design layer hidden (identical
otherwise). Both MP4s are decoded at t = 2.0 s (frame 60/150) and compared pixel by pixel.
Brand paint: the Step 3 brand **Text** and **Accent** pickers are pinned to the brand primary
`#29d3f2` per context, because `starfield-warp`, `bar-chart-anim` and `rve-circular-progress`
paint their heroes from `colors.text`/`colors.accent` rather than the layer colour — without
this those designs could never be brand-primary-compared. Thresholds (unchanged from Phase 2):
brand pixels within ±40/channel of `#29d3f2` ≥ 200; control pixels in the same box ≤ 5;
change tolerance ±24/channel; changes outside the design box ≤ max(50, 5 % of changed).

**Verdict: 14 / 19 PASS. 5 findings, recorded below — no assertion was skipped or weakened;
the spec run stays red on the findings, which is the honest result.**

## Matrix

| # | design id | MP4 bytes (personalized / control) | avc1 | duration (s) | design box (x,y,w,h) | brand px in box | brand px in control | changed in box | changed outside box | credit in encoded frame | verdict |
|---|-----------|-----------------------------------|------|--------------|----------------------|-----------------|---------------------|----------------|---------------------|--------------------------|---------|
| 1 | animated-headline | 2 040 644 / 1 992 508 | yes | 5.077333 | 432,157,1056,594 | 16 186 | 0 | 22 214 | 0 | yes (2 358 px) | **PASS** |
| 2 | logo-reveal | 2 034 751 / 2 000 730 | yes | 5.077333 | 576,270,768,432 | 2 492 | 0 | 12 654 | 0 | yes (2 592 px) | **PASS** |
| 3 | lower-third | 2 028 653 / 1 995 201 | yes | 5.077333 | −19,313,1190,670 | 4 590 | 0 | 49 561 | 0 | yes (2 235 px) | **PASS** |
| 4 | promo-cta | 2 013 777 / 2 000 220 | yes | 5.077333 | 432,481,1056,594 | 6 398 | 0 | 626 717 | 1 487 | yes (6 156 px) | **PASS** |
| 5 | visual-effect | 2 016 379 / 2 002 008 | yes | 5.077333 | 0,0,1920,1080 | **0** | 0 | 2 253 | 0 | yes (2 253 px) | **FAIL — finding F1** |
| 6 | starfield-warp | 2 037 086 / 2 002 137 | yes | 5.077333 | 0,0,1920,1080 | **12** | 0 | 6 711 | 0 | yes (2 259 px) | **FAIL — finding F2** |
| 7 | logo-bounce-drop | 2 045 298 / 2 002 995 | yes | 5.077333 | 288,162,1344,756 | 77 966 | 0 | 86 571 | 0 | yes (2 200 px) | **PASS** |
| 8 | logo-mask-wipe | 2 030 995 / 2 002 538 | yes | 5.077333 | 384,162,1152,648 | 13 084 | 0 | 54 357 | 0 | yes (2 213 px) | **PASS** |
| 9 | logo-split-reveal | 2 067 994 / 1 992 514 | yes | 5.077333 | 288,162,1344,756 | 53 941 | 0 | 63 314 | 0 | yes (2 222 px) | **PASS** |
| 10 | brush-stroke-reveal | 2 041 826 / 2 000 050 | yes | 5.077333 | 336,189,1248,702 | 34 296 | 0 | 43 417 | 0 | yes (2 205 px) | **PASS** |
| 11 | text-mask-reveal | 2 026 374 / 1 993 673 | yes | 5.077333 | 288,162,1344,756 | 20 757 | 0 | 28 348 | 0 | yes (2 188 px) | **PASS** |
| 12 | glitch-text | 2 030 103 / 1 991 884 | yes | 5.077333 | 288,162,1344,756 | 83 000 | 0 | 96 997 | 0 | yes (2 261 px) | **PASS** |
| 13 | logo-blur-reveal | 2 015 525 / 2 000 698 | yes | 5.077333 | 336,189,1248,702 | 67 089 | 0 | 75 751 | 0 | yes (2 222 px) | **PASS** |
| 14 | chapter-title | 2 049 529 / 1 990 384 | yes | 5.077333 | 240,135,1440,810 | 17 832 | 0 | 28 298 | 0 | yes (2 281 px) | **PASS** |
| 15 | bar-chart-anim | 2 047 012 / 2 004 128 | yes | 5.077333 | 288,162,1344,756 | 70 921 | 0 | 80 277 | 0 | yes (2 195 px) | **PASS** |
| 16 | rve-circular-progress | 2 067 063 / 1 991 396 | yes | 5.077333 | 288,162,1344,756 | 3 204 | 0 | 23 019 | 0 | yes (15 798 px) | **FAIL — finding F3** |
| 17 | rve-animated-text | 2 015 500 / 1 998 135 | yes | 5.077333 | 192,108,1536,864 | 14 694 | 0 | 34 700 | 0 | yes (15 823 px) | **FAIL — finding F3** |
| 18 | rve-popping-text | 2 007 083 / 2 002 270 | yes | 5.077333 | 288,162,1344,756 | 8 978 | 0 | 41 650 | 0 | yes (15 882 px) | **FAIL — finding F3** |
| 19 | rve-slide-text | 2 064 382 / 2 006 744 | yes | 5.077333 | 192,108,1536,864 | 10 315 | 0 | 29 215 | 0 | yes (15 819 px) | **FAIL — finding F3** |

All 19 rows: `ftyp`/`isom` container, H.264 `avc1` present, 1920×1080, positive duration,
non-zero size. Every control render painted **0** brand-primary pixels inside the design box.
`promo-cta`'s 1 487 outside-box pixels are within the allowed rule (≤ max(50, 5 % of
628 204) = 31 410): the card's shadow bleeds a few px past the box edge and the encoder
smears it.

### Credit line (encoded frame + DOM)

- Repo-1 designs (rows 1–15): `creditText` = `© 2026 Trimora Inc. (RenderComp) · MIT · Typeface: Inter (SIL OFL 1.1) © 2016 The Inter Project Authors` — carries **both** the MIT upstream credit and the OFL typeface attribution; both asserted, both pass.
- RVE designs (rows 16–19): `creditText` carries the RVE MIT attribution and the verbatim MIT permission notice (`MIT` assertion passes) but **not** the OFL typeface notice — see finding F3.

## Findings (measured evidence, reason, exact residual)

### F1 — `visual-effect` (Bokeh Particles) paints ZERO pixels in every browser export

- **Measured:** brand-in-box 0; changed-in-box 2 253 which **equals** creditChanged 2 253 — the ONLY encoded difference between the personalized and control renders is the credit line; outside-box 0. Encoded frames (`visual-effect-{personalized,control}-frame.png`) are pixel-identical except the credit.
- **Reason:** the discs are `radial-gradient(circle, color 0%, transparent 70%)` divs with `filter: blur(20px)` and `mix-blend-mode: screen` (`_upstream/bokeh-circles/BokehCircles.tsx`). The browser export rasterizer, `@remotion/web-renderer` (`dist/esm/index.mjs`), is a hand-rolled DOM painter that implements **neither** CSS `radial-gradient` (0 occurrences), **nor** the CSS `filter` property (0), **nor** any blend mode. The 16 discs therefore contribute nothing to the painted frame — the effect layer is in the export DOM (`designBox` measured full-frame, `exportRootCount` > 0) but its pixels never reach the MP4.
- **Residual / risk:** this is a product-level defect, not a test artefact: the bokeh effect is invisible in **every** customer browser export. It needs an upstream/adapter fix owned by the design lane (e.g. draw the discs with box-shadow or solid fills the renderer supports), plus this matrix re-run. The design must not be colour-compared until then; the strict assertion stays in the spec and keeps the run red.
- **Verdict:** FAIL (documented; not skipped, not weakened).

### F2 — `starfield-warp` is present but too thin for the strict colour test

- **Measured:** brand-in-box **12** (< 200 threshold); the design IS in the frame: 6 711 changed pixels in-box, 0 outside, screenshots show the star field. Control in-box brand pixels 0.
- **Reason:** each star is a 1–2 px-thick `linear-gradient(90deg, transparent, starColor)` line whose dominant ink is a `box-shadow` glow; after H.264 quantisation almost no pixel of the thin core stays within ±40/channel of `#29d3f2` (the glow spreads the same ink far below tolerance). Linear-gradient and box-shadow ARE supported by the renderer — this is an ink-thinness residual, not the F1 rendering gap.
- **Residual:** cannot honestly be colour-compared at the Phase 2 threshold. Not weakened, not skipped. Options for the design lane: thicken the star core (upstream edit) or accept a dedicated assertion for this design (e.g. changed-in-box ≥ 5 000 with 0 outside-box and 0 control brand pixels — already measured and recorded here).
- **Verdict:** FAIL (documented; not skipped, not weakened).

### F3 — the four RVE designs' credit line is missing the OFL typeface attribution

- **Measured:** `creditChanged` 15 798–15 882 px (the RVE credit block IS in the encoded frame — larger multi-line box 799×147); `creditText` contains `MIT` (passes) but not `Typeface: Inter (SIL OFL 1.1)` (fails). Pixel proof otherwise passes on all four designs (brand-in-box 3 204–14 694, control 0, outside-box 0).
- **Reason:** `RveCreditBlock` in `templates/designs/rveSharedDesign.tsx` (the repo-2 stage draws its own credit) composes `RVE_ATTRIBUTION` + the upstream credit + `RVE_LICENSE_NOTICE`, but does **not** append `DESIGN_FONT_ATTRIBUTION`. Wave 1 extended only the repo-1 credit (`DESIGN_VIDEO_CREDIT` in `templates/designs/shared.tsx`), so the OFL typeface notice travels with 15 of 19 designs and is missing from the 4 repo-2 designs.
- **Fix (owner: the RVE/shared-design lane — NOT P3-E):** append `DESIGN_FONT_ATTRIBUTION` to `RveCreditBlock` in `rveSharedDesign.tsx`, then re-run this spec; rows 16–19 should flip to PASS.
- **Verdict:** FAIL (documented; not skipped, not weakened).

## High-risk design notes (encoder CSS flattening)

- `lower-third` (`backdrop-filter: blur(14px)`): PASS — the frosted glass blur is dropped by the renderer (no backdrop-filter support), but the translucent card gradient and the brand-coloured name text render; brand-in-box 4 590.
- `visual-effect` (`blur(20px)` + `mix-blend-mode: screen`): FAIL — see F1; the whole effect is built from unsupported primitives.
- `logo-blur-reveal` (`blur(40px)`): PASS — the blur is dropped, so the wordmark renders sharp instead of defocusing (brand-in-box 67 089); the entrance is legible, the effect's focus resolve is flattened but the design's pixels are present and correct-coloured.
- `glitch-text` (`mix-blend-mode: screen` inside the text stack): PASS — the blend is dropped but the core text paints in the brand colour (83 000 px); the red/cyan ghost layers render unblended inside the box.
