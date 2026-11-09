# Personalization — Phase 5 visual-quality report (CHECKPOINT, not certification)

Status: **in progress — Phase 5 is NOT complete.** Commits: `3e346a5`, `af33e5a` (+ test/infra commits up to `be6e29a`). Baseline = `4d49522`.

## Method
`e2e/personalization-phase5-layout-templates.spec.ts` (real Chromium, deterministic fixtures, no network/AI): long business name "Kreindler & Kreindler LLP", a 3:1 logo and a square product image drawn on a canvas, then the Step 3 template cards for the three layouts at 16:9, 9:16, 1:1, 4:5; asserts nothing hangs outside the frame and saves the cards.
Evidence images: `docs/phase5-evidence/`.

## Before / after (same fixture, same spec)
- `layout-templates-baseline-4d49522.png` — source files at `4d49522`: bounds check **fails at 16:9, 1:1, 4:5**. Reproduces the reported defects: names broken mid-word ("Kreindle / r & / Kreindle / r LLP"), text clipped off the left edge ("eindle"), offer text under the product image, business name drawn twice in Service Promotion.
- `layout-templates-after-phase5-checkpoint.png` — current code: bounds check passes at all four ratios; names wrap on word boundaries; image has its own region; name drawn once.

## Root causes (file paths)
| Defect | Source of the element | Root cause | Fix |
|---|---|---|---|
| Mid-word wraps | layout layers `businessName`/`headline`/`tagline` | `toBox` (`preview/presets.ts`) sized width from `layer.text`, but unset text is drawn from the brand → 8-char fallback ⇒ ~4.4 em box; `wordBreak:'break-word'` split words | size from drawn text; `overflowWrap` |
| Clipped left edge | layout layers, logo | box centred on `x`; defaults use `x=0.08` | clamp text/image boxes to the 2 % safe area (designs intentionally **not** clamped; tested) |
| Image over offer text | layout layers `productImage`/`serviceImage` vs `offer` | all layouts shared one default geometry (image x=0.62 vs offer x=0.5) | per-layout, per-aspect default geometry `layoutLayerGeometry`; untouched layers follow layout/aspect, edited layers stay (`reflowLayersForAspect`, `applyLayoutPreset`) |
| Name twice (Service Promotion) | **layout layers** (headline falls back to name; tagline seeded with name) — not the footage | existing dedupe only covered a `businessName` layer | fallback headline/tagline yields to any other visible layer with the same text; tagline not seeded when headline already is the name; editor mirrors the rule; **own text is never dropped** |
| "MINIMAX / Hailuo AI" mark | **baked into the source footage** | cannot be removed by moving Remotion layers | **not removed**; no claim made |

## Tests
Unit (post-change): new tests in `preview/__tests__/presets.test.ts` (text sizing, safe area, designs unclamped, per-aspect image/text non-overlap ×8, reflow), `repeatedBusinessName.test.tsx` (dedupe, own-text kept). Full personalization suite: 1612 passed, 0 failed.
Browser (post-change): Phase 5 spec 4/4 pass.

## Real exported video evidence (post-change run of `personalization-step4-remotion-export`)
Files in `test-results/remotion-export/` (git-ignored): 1920×1080 H.264, 30 fps, 150 frames, 4.97 s.
| File | sha256 | bytes |
|---|---|---|
| `design-Starfield Warp.mp4` | `e2b6729090987739562ac69e738cc07978c3f0a38bfcd3e9aff0e22333ae6144` | 2047115 |
| `design-Logo Reveal.mp4` | `3941b52a9f7db28a064535db5acebfb3ab668ad14b5b3a0462536df84365273f` | 2012814 |
| `design-Lower Third.mp4` | `b4da6670291dc2960ba953779049179b1a1769f3efa63eb25672c73d459e2479` | 2010161 |
Frames at t = 2.5 s, control (left) vs design (right): `docs/phase5-evidence/export-frames-control-vs-design-t2.5s.png` — Starfield Warp renders real drifting star particles (no "Starfield Warp" label: the editor's label is preview-only, defect S1), Logo Reveal shows the logo mark, Lower Third shows the lower-third bar.

## Unresolved / not yet verified (Phase 5 stays open)
1. **The three layout templates have not been exported to MP4 and compared with their preview frames** (only the designs above were). Preview/export parity for Business Introduction / Product Showcase / Service Promotion is unverified.
2. **Readability/subject protection not addressed:** white text still sits over bright footage (e.g. 1:1 / 4:5 Business Introduction) and the product/service image overlays the subject. The scene-aware placement scoring (spec §Phase 5 addendum) is **not implemented**.
3. Explicit overlay media-role table, picture-in-picture role rules and Layout Quality Check UI: not started. Product/service image is still a layout layer by design (Product Showcase/Service Promotion), not conditional on the footage.
4. Fixture logo/product are synthetic; real-asset aspect ratios (tall/wide) and real footage categories (speaker left/right, restaurant, real-estate, moving camera) are not tested.
5. 2-line widow wrapping ("…Kreindler / LLP" at 9:16) remains: width estimate uses 0.55 em/char.
6. Remaining template categories: **not audited** (coverage ledger not started); designs were only export-smoke-tested (38 registered designs exported in the matrix test).
7. Live-AI specs and the other Playwright specs listed in the Phase 0 report remain unverified.

## Auth bypass verification (post-change, running dev server)
Only `cookie=1` + loopback + no forwarding + `/personalization-demo` bypasses (200). No cookie, `cookie=0`, `X-Forwarded-For: 8.8.8.8`, `Host: evil.com`, a `Forwarded` header, `/studio`, `/api/v1/protected/x` all go to Clerk (307) and `/api/personalization/discover-assets` is not bypassed. `NODE_ENV=production` is rejected in code and unit tests (`tests/e2e-auth-bypass.vitest.test.ts`, 37 cases); a production-mode run was not possible (build blocked). Note: a **pre-existing** non-production-only cookie bypass inside `middleware.js` (`__e2e_auth_bypass=1` skips auth after Clerk runs) predates this work and was left unchanged.
