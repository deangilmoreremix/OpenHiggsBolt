# SMARTVIDEO GO AI — Remotion Personalization, Phases 1–3: Final Audit

**Date:** 2026-10-23
**Branch / PR:** `feature/remotion-personalization-phase-2` →
[deangilmoreremix/OpenHiggsBolt#67](https://github.com/deangilmoreremix/OpenHiggsBolt/pull/67)
**Audited tree:** the PR head after the final-review corrections and a merge of current `origin/main`
(see §6 for SHAs).
**Production:** not deployed. The Netlify production site is **intentionally locked against automatic
publishing** (a release-control lock, not a billing lock). That lock was not touched.

> **Bottom line.** Phase 3's code scope is complete and the three final-review findings are fixed.
> **The three-phase program is not yet fully verified for release:** the browser-level suites (the
> 19-design MP4 export matrix and the 6 runtime Playwright tests) were **not re-executed** after the
> final-review changes and the `main` merge, because the audit environment's Chromium cannot reach a
> loopback server (§5.3). Those runs, plus the open defects in §7, are the remaining gates.

---

## 1. Sources of the original requirements

| Phase | Requirement source (in this repo) |
|---|---|
| 1 | `docs/REMOTION_PHASE_1_REPORT.md` §3 (preservation requirements), §5–§7 (registry, designs, studio contract), §10 (declared remaining work) |
| 2 | `docs/REMOTION_PHASE_2_REPORT.md` §1.1 (the Phase 1 open items Phase 2 had to close), §2–§8, §13 (declared remaining work) |
| 3 | `docs/phase3/EXECUTION_PLAN.md` §1 (13 items) and §2 (decisions D1–D5), `docs/phase3/VERIFICATION_SPEC.md` (QA-1…QA-14) |
| Final review | Three findings from the senior sub-agent review (duplicate persistence, edited frozen upstream, font attribution) |

The audit re-checked implementation evidence on the merged tree rather than trusting the earlier
reports. Where a report's claim could not be reproduced it is called out.

---

## 2. Phase 1 — foundation & first studio

### Requirements
Shared Remotion design registry; five designs from one upstream repo with MIT attribution; a new
"Designs" chip row in Step 4 that leaves the five existing layout pills, the modal, the four-step
wizard and the Remotion Player untouched; one shared studio hand-off contract
(`studioEntry.ts`) wired into Video Studio; browser-only export that renders the same composition
as the preview; no paid rendering, no workflow changes, no deploy.

### Implemented (verified on the merged tree)
| Requirement | Evidence |
|---|---|
| Registry (`templates/{types,registry,index,catalog}.ts`) | present; `registry.test.ts` passes |
| 5 Phase 1 designs | `catalog.ts` (animated-headline, logo-reveal, lower-third, promo-cta, visual-effect) |
| Existing pills unchanged | `layoutCompatibility.test.ts` passes |
| Studio contract + Video Studio | `studioEntry.ts`; `VideoStudio.jsx` passes `studioPersonalizeOptions` to `renderPersonalizeAction` (re-applied on top of main's refactor in the merge — see §6) |
| Same composition for preview and export | `webExport.ts` renders `PersonalizationComposition`; export unit suites pass |

### Automated tests
`registry.test.ts`, `catalog.test.tsx`, `layoutCompatibility.test.ts`, `overlayGeometry.test.ts`,
`webExport*.test.ts`, `noNetworkDuringBrandRender.test.ts`, `e2e/personalization-step4-remotion-designs.spec.ts`.

### Verification evidence in this audit
Unit: all pass in the full suite (§5.2). E2E: **not re-run** (§5.3).

### Missing / partial
Real MP4 encode proof and per-slot editing were deferred to Phase 2 (and closed there).

### Status: **Complete** (its deferred items were carried and closed in Phases 2–3).

---

## 3. Phase 2 — library scale-up, studio hand-off, robustness, typography

### Requirements (Phase 1 open items + Phase 2 scope)
Encoded-MP4 export proof; more designs; secondary-slot editing; remaining studios; fix the
`z-[100]` collision and the body-overflow clobber; deterministic fonts; credits for every upstream.

### Implemented (verified on the merged tree)
| Requirement | Evidence |
|---|---|
| 19 designs (15 repo-1 + 4 repo-2) | 15 template objects in `catalog.ts`, 4 in `designs/rveCatalogEntries.ts` |
| 10 studios receive the Personalize trigger | `renderPersonalizeAction` in Video, Image, Clipping, VibeMotion, MotionControl, LipSync, Cinema, Marketing, Recast, AiInfluencer; wired from `components/StandaloneShell.js` |
| No cross-package import from `packages/studio` | `e2e/structural-studio-provider-ancestors.mjs` → `ALL CHECKS PASSED` (run in this audit) |
| Multi-slot editing (`textSlotOverrides`) | `OverlayEditor.tsx`; `designSlotEditing.test.tsx` passes |
| Modal `z-[250]`, overflow capture/restore | `PersonalizationModal.tsx:1469`, `:1036-1044`; `PersonalizationModalRobustness.test.tsx` passes |
| Bundled typeface | Inter 4.001 Latin subset under the local alias "Personalization Sans" (`templates/typography.ts`) |

### Missing / partial at Phase 2 close (all carried into Phase 3)
`400 MISSING_PROJECT_ID`; C11 font decision; OFL credit decision; non-deterministic font picker;
five studios without a provider; z-index residuals; 18 designs not colour-compared in an encoded
frame; test debt; retry flake; tracked `packages/studio/dist`; fixed-SVG-id warning.

### Status: **Complete as scoped**; its declared backlog became Phase 3.

---

## 4. Phase 3 — persistence, layering, fonts, coverage, export matrix, test debt

### Requirements — the 13 items of `docs/phase3/EXECUTION_PLAN.md` §1, plus the final review

| # | Item | Implementation (merged tree) | Automated test | Evidence in this audit | Status |
|---|---|---|---|---|---|
| 1 | `400 MISSING_PROJECT_ID` | `loadProject` always sends `id` or `list=true&sourceId=` | `projectPersistence.test.ts` | passes | ✅ |
| 2 | C11 font (D1) | woff2 inlined as a data URI | `typography.test.ts`, `noNetworkDuringBrandRender.test.ts` | pass | ✅ |
| 3 | OFL credit (D2) | `DESIGN_FONT_ATTRIBUTION` in every credit line | `catalog.test.tsx`, **new** `fontAttribution.test.ts` | pass | ✅ |
| 4 | Font picker (D3) | every id resolves to the bundled stack | `presets.test.ts` | passes | ✅ |
| 5 | Five more studios | Brand, Photo, Academy, VFX, Thumbnail | structural script; `personalization-studio-triggers.spec.ts` | script passes; **spec not re-run** | ✅ code / ⚠ e2e pending |
| 6 | z-index residuals | lowered to 240 | `studioLayering.test.jsx` | passes | ✅ |
| 7 | Export-proof all designs | F1 adapter, F2 adapter (corrected), F3 credit | `personalization-step4-remotion-export.spec.ts` | **not re-run** (§5.3) | ⚠ pending re-run |
| 8 | Test debt | 32→3 failing files at P3 close | full suite | 13 env failures here, identical on `main` (§5.2) | ✅ (no new) |
| 9 | Retry flake | `waitFor` (main's equivalent fix kept in the merge) | `PersonalizationModal.test.tsx` | passes | ✅ |
| 10 | Untrack `dist` (D4) | `.gitignore`; kept untracked through the merge | `git ls-files packages/studio/dist` → 0 | ✅ | ✅ |
| 11 | CI/Netlify model (D5) | no workflow change | — | — | ✅ recorded |
| 12 | Gallery-only designs | not obtainable | — | — | ❌ not actionable |
| 13 | Fixed-SVG-id warning | `REMOTION_DESIGN_FIXED_SVG_IDS` + Step 4 warning | `fixedSvgIdWarning.test.tsx` | passes | ✅ |
| R1 | Duplicate Supabase persist effect | one effect remains | **new** `DemoPersonalizePersistence.test.tsx` (7) | passes; fails on the old code | ✅ |
| R2 | Frozen starfield edited | upstream restored byte-for-byte; thick cores in the adapter | **new** `starfieldUpstreamIntegrity.test.tsx` (24) | passes; fails on the old code | ✅ code / ⚠ MP4 re-run pending |
| R3 | Font attribution | alias documented; attribution derived from Inter metadata | **new** `fontAttribution.test.ts` (7) | passes; fails on a misattribution | ✅ |

### Final-review corrections — detail

**R1 — duplicate persistence.** `DemoPersonalizeProvider.tsx` had two byte-identical effects (same
body, same 21-entry dependency list, no cleanup) that both called
`projectPersistence.current.persist(buildProjectPayload())`. Because `persist` resets one debounce
timer, the network never saw two requests — but every commit built and scheduled the payload twice.
One effect was removed; debounce, restore-cancel, close and unmount behaviour are unchanged and the
persistence API is untouched. The new test runs the **real** `createProjectPersistence` (short
debounce) under a spy and a stubbed `fetch`, and pins: one `persist` per commit (the old code gave
2 — verified by running the test against `0e0403b`), one POST per completed debounce cycle carrying
the latest payload under rapid edits, restore cancels the pending write and settles into one write,
closing keeps the pending write and schedules nothing new, unmount cancels the pending write,
approval flushes immediately, anonymous sessions never persist.

**R2 — starfield upstream.** The Phase 3 commit changed `sizeBase: 1 + r*2.5` to `3 + r*4` inside
`_upstream/starfield-warp/Starfield.tsx`. The file was restored to its Phase 2 content, whose body is
byte-identical to `free-remotion-templates@f648980e…/src/components/starfield/Starfield.tsx`
(SHA-256 `a77d1319…`, fetched from GitHub during this audit). The adapter now renders
`ThickCoreStarfield`, a local derivative of the upstream render function with one parameter — the
core size range (`EXPORT_STAR_CORE_SIZE` = 3–7 px). Recorded as decision D7 and in the catalog
notes. The integrity test pins **all 19** `_upstream/` files by SHA-256 (10 are verified verbatim
against upstream; 9 carry header-documented Phase 1/2 deviations and are pinned as-is), and proves
the derivative renders markup identical to the frozen upstream at frames 0–149 when given the
upstream's own range. No other frozen upstream was edited.

**R3 — font attribution.** The bundled `public/fonts/personalization-sans-latin.woff2` (SHA-256
`c9407645…`) **is Inter**: its own `name` table reads family "Inter", "Version 4.001;git-66647c0bb",
copyright "Copyright 2016 The Inter Project Authors". "Personalization Sans" is only the CSS
`@font-face` family alias (chosen so the app's `next/font` "Inter" cannot shadow it). The existing
credit "Typeface: Inter (SIL OFL 1.1) © 2016 The Inter Project Authors" was therefore correct and is
kept; it is now derived from explicit Inter metadata constants, and the full licence notice gains a
sentence explaining the alias. Inter's OFL declares no Reserved Font Name, so the subset and the
alias are permitted. `public/fonts/OFL.txt` still ships. The new test parses the WOFF2 (Node's
built-in brotli) and checks family, version, copyright, licence URL and `OFL.txt` against the
exported attribution.

### Phase 3 status: **Code complete; browser-level re-verification pending.**

---

## 5. Verification run in this audit (merged tree)

### 5.1 Gates

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | **exit 0** |
| Package build | `npm run build:packages` | **exit 0** (88 files) |
| App build | `npm run build` | **exit 1 without env** (`Missing NEXT_PUBLIC_SUPABASE_URL…` during page-data collection — the container has no app env); **exit 0, 23/23 pages** with clearly fake, non-secret placeholder public env values |
| Lint | `npm run lint` | exit 1 repo-wide (1 281 errors, almost all `no-explicit-any` in files this work did not touch). Every file changed in the final review lints clean or with exactly its pre-existing count. See §7 on the Phase 3 "302 errors" claim. |
| New regression suites | `vitest run` on the 3 new files | **38/38 pass** |
| Full unit suite | `npm run test:unit` | final head: 2 948 pass, 13 fail, 6 skipped. **All 13 failures reproduce identically on a pristine `origin/main` worktree** (discovery/network/DNS tests that need outbound network or Supabase, plus the known `DiscoveredAssets` failure). No new failures. |
| Stripe suites | 3 files | 65/65 pass (incl. the new trialing test) |
| Structural studio script | `node e2e/structural-studio-provider-ancestors.mjs` | **ALL CHECKS PASSED** |
| `docs/phase3/validate.sh` | see §5.4 | see §5.4 |

### 5.2 Unit failures, classified
`api-gates-contract` (1), `discoverAssets` (3), `personalizationDiscovery` (3), `businessDiscovery`
(2), `DiscoveredAssets` (1), `browser-discovery-ssrf` (1), `discover-assets-status-auth` (1),
`s3-dns-pinning` (1) — same 13 on `origin/main` (`diff` of the two failure lists: identical).

### 5.3 Not executed — and why
- **19-design MP4 export matrix** (`e2e/personalization-step4-remotion-export.spec.ts`) and
- **6 runtime Playwright tests** (`e2e/personalization-studio-triggers.spec.ts`).

The production server ran and answered `200` to `curl`, but the container's Chromium routes every
request — including `localhost`/`127.0.0.1`, with `--no-proxy-server`, proxy bypass lists or a
`direct://` proxy — through the sandbox egress proxy, which refuses loopback tunnels
(`net::ERR_TUNNEL_CONNECTION_FAILED`). The runtime suite also needs real Clerk test keys. **These
tests are not reported as passing.** The last recorded passes (19/19 and 6/6) are from the Phase 3
run on commit `0e0403b`, i.e. **before** the starfield adapter change and the `main` merge.

### 5.4 `docs/phase3/validate.sh`
The script's supported environment is the macOS orchestrator host (its host gate calls `vm_stat`).
It was run here on Linux; the raw output is in `docs/phase3/raw/final-review-validate.txt`.
| Id | Result | Notes |
|---|---|---|
| P3-A Persistence contract | **ALL CHECKS PASSED** | |
| P3-B Layering | **ALL CHECKS PASSED** | |
| P3-C Credit / font | **ALL CHECKS PASSED** | |
| P3-D Hygiene | **ALL CHECKS PASSED** | modal test 5/5 clean runs |
| P3-F Studio coverage | **ALL CHECKS PASSED** | typecheck clean |
| P3-H Full matrix | **CHECKS FAILED** (exit 1) | host gate FAIL (`vm_stat` absent on Linux); typecheck PASS; app build PASS; package build PASS; unit `14 failed / 2 947 passed` (a quiet re-run gave the same 13 pre-existing failures as `main` — the 14th was load from the dev server the script's Playwright step started); Playwright `1 passed`, the rest failed to reach the browser (§5.3) — and that step's `webServer` started `next dev` over the production `.next`, which the repo's own BUILD_LOCK warns about; protected files PASS |

P3-E and P3-G are subsets of P3-H and were not run separately.

---

## 6. Integration with `main`

`origin/main` was 45 commits ahead. Merged (no rebase, no force-push). Conflicts were confined to
seven `packages/studio` studios, one test and the untracked `dist/`:
main's refactored studio code was kept and the branch's Personalize hand-off re-applied on top. In
Image and Video Studio main had removed `selectedModelName`/`uploadedVideoName`; the hand-off now
reads `selectedModelDisplayName`/`selectedPickerLabel`, derives the clip name from
`uploadedVideoUrl`, and is declared after those values. Main also restored `@crawlee/core` as a
direct dependency, which fixed the one typecheck error the pre-merge branch had.

---

## 7. Outstanding defects and release blockers

| # | Severity | Item | Status |
|---|---|---|---|
| B1 | **blocker** | Export matrix (19) and runtime Playwright (6) not re-run on the final tree | run on the supported host before release |
| B2 | high | **Restored projects carry asset IDs as URLs.** `restoreProject` maps `identityAssetIds` etc. to `{ id, url: id }` (`DemoPersonalizeProvider.tsx:1717-1727`). Pre-existing on `main`, but unreachable there because restore always 400'd; Phase 3's working restore makes it reachable (Codex P2 on PR #67). | open — needs an asset lookup or persisting asset URLs |
| B3 | medium | Source restore filters **after** the RPC's `limit 50` (`20261013000000_personalization_saved_projects.sql:125`), so a project older than the user's 50 latest is not restored (Codex P2). Pre-existing SQL. | open — needs a migration |
| D1 | low | Studio project keys use the URL basename (Image/Marketing/Video). Two different uploads with the same basename would share saved state (Codex P2). | open — use the full URL |
| D2 | info | `visual-effect` and `starfield-warp` pass the matrix on a changed-in-box presence criterion, not the brand-pixel threshold (documented in the spec). | accepted |
| D3 | info | The Phase 3 report's "lint 302 < 1224" could not be reproduced: the merged tree lints at 1 281 errors repo-wide. No new errors come from this work; the figure in the earlier report should not be relied on. | documented |
| D4 | info | 12 gallery-only designs not integrable (no source). | not actionable |
| D5 | info | `validate.sh` is macOS-only (`vm_stat`). | documented |

Fixed during this audit (beyond R1–R3), each with a regression test:
- **Stripe:** `customer.subscription.updated` with status `trialing` revoked access; this PR had
  narrowed main's behaviour. Now granted, matching `mapSubscriptionStatus` (Codex P1).
- **Image hand-offs without a poster** rendered an empty background (the image was fed to `<Video>`);
  the poster now defaults to the image (Codex P1).

---

## 8. Completion status

| | Status |
|---|---|
| Phase 1 | ✅ Complete |
| Phase 2 | ✅ Complete as scoped |
| Phase 3 (code scope + final-review corrections) | ✅ Complete |
| Phase 3 verification on the final tree | ⚠ Partial — B1 |
| **Three-phase program, release-ready** | ❌ **Not yet** — B1 must pass; B2 should be fixed or explicitly accepted before paying users rely on restore; B3/D1 are follow-ups |

Netlify production stays locked; release is a separate, approved, manual step.
