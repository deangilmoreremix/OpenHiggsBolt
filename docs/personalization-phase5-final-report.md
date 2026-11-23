# Personalization Phase 5 — final report (template alignment, source-aware placement, quality check)

Baseline `4d49522`; this report covers everything after it on branch `claude/ecstatic-ritchie-fak2d5`. Earlier details: `docs/personalization-phase0-baseline-report.md`, `docs/personalization-phase5-visual-quality-report.md`, `docs/template-coverage-ledger.md`.

## Verdict
**Met for the three primary layouts on a verified clip; NOT a blanket certification.** Specifically: composition parity (card ↔ live preview ↔ exported MP4) passes for Business Introduction, Product Showcase and Service Promotion at 16:9, 9:16, 1:1 and 4:5. Composition quality passes on the clip whose subject was verified (perfume). On clips with no verified subject area the system does not claim automation: it reports **Review required** and leaves placement to the customer. 111 of 124 designs have no real-export evidence (ledger). Phase 5 should be signed off by the owner with these exceptions, not assumed complete.

## What was built (Phase 5)
| Area | Implementation | Verified by |
|---|---|---|
| Text/box geometry | boxes sized from the *drawn* text, safe-area clamp (`toBox`), no mid-word wraps | unit tests; baseline-vs-fixed real frames |
| Layout geometry per aspect | Product Showcase / Service Promotion image beside text (16:9) or below (portrait/square/4:5); untouched layers follow layout/aspect | 8 geometry tests + exports |
| Duplicate branding | fallback headline/tagline yield to identical visible text; tagline not seeded with the name when the headline is the name | composition tests + frames |
| Media-role contract | `preview/mediaRoles.ts` (9 roles; PiP/full-frame explicit ids; contain for logo/product) | 9 tests incl. every registered design |
| Placement engine | `preview/placement/*`: deterministic scoring (subject zones, overlaps, fit, measured contrast over the visible time, template intent, hierarchy), bounded size candidates (text ≥ 80 %, images ≥ 65 %), never moves locked/hand-placed layers; overlays judged only before the end card | 29 placement tests |
| Source model | `preview/sourceProfile.ts`: family, real dimensions, letterbox fit (verified against real frames), verified zones/baked-in only for inspected clips, rights `unverified` by default, third-party brand flag | 8 tests + pixel check |
| Quality check UI | Ready / Needs adjustment / Review required, issue list with layer + time, Show, Fix, Apply/Restore recommended, subject marking, lock control; only critical failures block export; rights confirmation before a final export | 5 panel tests + real browser |
| Automatic placement | recommended placement applied automatically **only** when a verified/marked subject area exists | real exports (below) |

## Evidence
**Parity (12 real MP4 exports — 3 layouts × 4 shapes; hashes/SSIM in `docs/phase5-evidence/final/layout-export-metrics.csv`).** Card, live preview (seeked to 1.5 s through its slider) and exported frame at 1.5 s agree in layout, rounding, wrapping and branding in all 12; card↔export SSIM 0.77–0.90 at 16:9/1:1 and 0.45–0.70 at 9:16/4:5 (the card crops portrait differently, so SSIM is a signal, not the verdict — verdicts are visual).
**Quality before/after automatic placement (same 12 exports, perfume clip with verified bottle zone):** `layouts-exports-before-auto-placement.png` shows text/product over the bottle in portrait/square/4:5; `layouts-exports-after-auto-placement.png` shows the bottle clear in all 12 (product beside it or smaller at the bottom-left in portrait; names on the black bars).
**Real footage (6 demos × 4 shapes, 24 exports, then re-exported after the size candidates):** with no verified zones the panel reports Review required; recommended placement resolves 5 further cases (perfume 4:5, all serum shapes) to Review required; burger (4) and perfume 16:9 still "needs adjustment" after the pre-auto recommendation (not re-measured after the auto-placement change).

## Tests (labelled)
- Unit/jsdom (personalization suite): 114 files, **1707 passed, 2 skipped, 0 failed** (baseline was 1590 pass / 4 fail). Mocked renderer: unit only.
- Real browser, bypassed auth, local dev server: designs spec 4/4, export spec 3/3, Phase 5 layout export 12/12 ×2, real-footage 24/24 ×2, styling 8/8.
- **Intermittent**: a single unhandled error appeared in 2 of ~12 full Vitest runs and did not reproduce in 6 consecutive runs; unidentified, not fixed.

## Unresolved
1. 111/124 designs: no real-export evidence; 9 designs are aspect-limited (their other shapes not exercised).
2. Subject protection is automated only where a subject area is verified (one clip) or customer-marked; no face/object detection exists. On other clips overlays can still land on faces/products (flagged Review required).
3. The perfume clip is the only verified profile; baked-in graphics are unknown for the other 122 demos (flagged).
4. Burger-type clips (bright footage) still show low-contrast text that no candidate position fixes; reported, not solved.
5. Rights: a confirmation (not a hard block) gates a final export of unverified/third-party-brand clips — owner decision pending.
6. Playwright: broader specs not completed (live-AI full-flow etc.); `personalization-asset-dnd-certification` fails in `beforeEach` (spec expects Advanced-mode fields on load; pre-existing/stale); marketing-demo 2 stale expectations.
7. Placement is verified on the layout templates; designs keep their own geometry (not auto-placed by role contract).
