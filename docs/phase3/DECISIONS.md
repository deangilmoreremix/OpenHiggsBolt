# Phase 3 — Decision log

Each decision has a **default that the agents implement** so work is never blocked, and a
**revert cost** so a different preference is cheap to apply later.

| # | Decision | Default implemented | Revert cost | Implemented by | Status |
|---|---|---|---|---|---|
| D1 | Font asset strategy | Inline the woff2 as a base64 data URI in `templates/typography.ts` (strict C11 reading) + a `FontFace.load()` spy in `noNetworkDuringBrandRender.test.ts` so zero font network requests is enforceable | one file + one test | P3-C | ☑ **implemented — with one amendment** (WAVE1_AUDIT §2.3): the payload is a **static generated module** `templates/fonts/personalizationSansDataUri.ts`, produced by `templates/fonts/generate-font-data-uri.mjs`, NOT a runtime `readFileSync()` — the latter would have broken the browser bundle (`npm run build` → "Can't resolve 'fs'"). `templates/__tests__/typography.test.ts` asserts byte-identity with the shipped woff2. The FontFace spy is in progress. |
| D2 | OFL attribution in the rendered credit line | Yes — the aggregated credit gains `Typeface: Inter (SIL OFL 1.1) © 2016 The Inter Project Authors`; `public/fonts/OFL.txt` keeps shipping | one file | P3-C | ☑ **implemented** — `DESIGN_VIDEO_CREDIT` now carries the MIT credit AND the OFL typeface attribution; `getRemotionDesignAttributionLine()`/`getRemotionDesignLicenseNotice()` expose both; `catalog.test.tsx` grew (+41/−0, additive) to pin it. Residual: the rendered line's fit at 10px validated arithmetically, not in an exported frame — P3-E's e2e matrix is the authoritative check. |
| D3 | Customer font picker determinism | Reduce the picker to the single bundled face ("Personalization Sans"); relabel the per-OS entries as unavailable | one file + picker UI | P3-C | ☑ **implemented** — every picker id (`inter`/`georgia`/`impact`/`monospace`/`personalization-sans`/unknown/persisted stack) resolves to `DESIGN_FONT_STACK`; historical entries kept as disabled "(unavailable)" options so persisted layers never break; `PersonalizationComposition.tsx` verified to need no change (its 7 `fontStackById()` sites all return the bundled stack). |
| D4 | `packages/studio/dist` | Untrack (`git rm --cached`), keep in `.gitignore` | one git operation | P3-D | ☑ **implemented + re-verified** — `git ls-files packages/studio/dist` → 0; `npm run build:studio` succeeded (88 files), `dist/` produced, still untracked, `check-ignore` ✓. |
| D5 | CI/Netlify model | **No code change.** The repo-wide CI red is a **billing lock** on the owner account ("The job was not started because your account is locked due to a billing issue"), 0 successes in 612 runs — not a workflow defect. Removing the workflows would hide the real problem. Recommend re-applying the owner's own `d3267cee9` retirement, but only after the billing lock is cleared. | n/a | orchestrator | ☑ recorded |
| D6 *(Wave 2 amendment)* | Bokeh adapter vs frozen upstream | **Re-implement the discs in the adapter** (`templates/designs/VisualEffectDesign.tsx`) with rasterizer-safe primitives — solid disc + `boxShadow` glow, same seeded motion/palette/opacity. The upstream file stays frozen. Reason: `@remotion/web-renderer`'s drawing stage has `parse-linear-gradient` and box-shadow support but **no radial-gradient parser and no blend-mode support**, so the upstream's `radial-gradient + blur(20px) + mix-blend-mode: screen` discs rasterized to fully transparent divs — the design was invisible in EVERY export (P3-E finding F1, measured: changed-in-box == credit-only). Dropping the blend also retires the stacking-context hazard the old adapter comment tracked. Trade: the discs read as soft glowing circles rather than gradient-falloff discs, identically in preview and export. `catalog.test.tsx`'s two bokeh assertions were updated to the new contract (intent kept: translucent discs, no demo label, nothing painted behind the video). | one adapter + 2 test blocks | orchestrator | ☑ implemented + verified in the encoded matrix (visual-effect row now `error:null`) |

**Why D5 is "no code change":** the owner hit this exact problem before and deleted all eight
workflows for it in `d3267cee9` ("chore(ci): retire GitHub Actions — Netlify is the build and
deployment gate"); `28a1c96d9` re-added three of them and silently re-created the outage.
Retiring them again while the billing lock stands would make the red disappear without fixing
anything, and would remove the only signal that the account is locked.

## Open for the owner

D1–D4 are implemented to the defaults above. A different preference is a one-file change each —
say so and it will be applied as a follow-up rather than a rework.
