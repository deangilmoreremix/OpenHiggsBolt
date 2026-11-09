# Personalization — Phase 0 baseline report

Baseline commit: `4d49522` (branch `claude/ecstatic-ritchie-fak2d5` before any change). Everything run **after** changes is labelled *post-change* and is not baseline evidence.

## Environment
- Install: `pnpm install --frozen-lockfile` (the repo's patches only apply under pnpm; an earlier `npm install` run was discarded).
- Full `next build` fails on `/agents/*` (`ai-agent` workspace package not built) — unrelated to personalization. Browser runs use `next dev` with a dummy Clerk key and the local-only bypass (`docs/e2e-auth-bypass.md`).

## Baseline Vitest — `npx vitest run src/shared/personalization` at `4d49522`
Result: **1590 passed, 4 failed, 2 skipped, 13 unhandled errors.** (unit / mocked jsdom evidence only)

### The 4 failures (all `sharedDiscovery.test.tsx`) — test-expectation mismatches, not regressions
| Cause | Evidence | Resolution |
|---|---|---|
| Advanced stepper now has a "Client" step label, so `getByText('Client')` matched two elements | DOM dump: `<span>Client</span>` + `<button>Client</button>` | Query by role+name (post-change) |
| Find My Brand is offered in every modal | comment + `id="pz-find-my-brand"` in `PersonalizationModal.tsx`; test asserted it absent for authenticated | Assertion updated to the intended behaviour |
| Selecting a business now runs research + discovery automatically in every mode | commit `071b990` ("Lead Finder: find businesses' own websites…"), `handleSelectBusiness` comment "In every mode the selection runs the same automated workflow"; the "Research Business" button now reads "Research Complete" | Intended workflow change, **not** a regression. Tests rewritten to assert automatic run (1 research + 1 discovery call), manual buttons as re-runs, plus the unchanged no-clobber and discovery-reset assertions |

### The 13 unhandled rejections — "Durable storage is not configured…"
- 11 in `PersonalizationImageEditing.test.tsx`, 1 in `AssetDragDrop.test.tsx`, 1 in `sharedDiscovery.test.tsx`; all via `applyEditedPersonalizationAsset` → `uploadAsset` → `uploadPersonalizationAsset`.
- Root cause is the **test harness**: the application intentionally rethrows an upload failure after marking the asset `uploadStatus: 'error'`; its real caller (`PersonalizationModal.handleImageEditorApply` ← `ImageEditorModal`) awaits it and shows the message. The tests called it un-awaited with no storage backend.
- Fix (post-change): the durable upload is stubbed in the three files that do not test storage; new `editedAssetUploadFailure.test.tsx` proves a failed upload still rejects and marks the asset errored. No global suppression.

## Post-change Vitest
`npx vitest run src/shared/personalization` → **105 files, 1612 passed, 2 skipped, 0 failed, 0 unhandled errors.**

## Baseline Playwright (real Chromium against local dev server, bypass cookie)
| Spec | Result | Class |
|---|---|---|
| `personalization-step4-remotion-designs` | 4/4 pass | deterministic, browser-only |
| `personalization-step4-remotion-export` | 3/3 pass; real MP4 exports (see Phase 5 report for files/hashes) | deterministic, **real browser Remotion render** |
| `marketing-demos/personalization-demo` | 1 pass (needs cookie on `localhost`), 2 fail | stale expectations: sample source is now "Luxury Perfume Commercial" not "Viral Roofing Demo"; "Settings" button assertion not separately investigated |
| `personalization-asset-dnd-certification` | 13/13 fail in `beforeEach` | stale precondition: spec fills Advanced-mode fields (`ABC Roofing` …) on load but the demo opens in Simple Mode. Independent of Phase 5 changes (not run on `4d49522` itself) |
| `personalization-ai-assist` | fails | needs live AI services — **unverified integration** |
| `personalization-full-flow`, `-remaining-flows`, `-studio-handoff`, `-motion-template-video`, `-step4-remotion-designs-all` | **not completed** (run aborted: live-service specs time out slowly) | **unverified** |

## Not verified
Live MuAPI / AI prompt endpoints, real Clerk auth, Supabase persistence, production build/`next start`, recast jobs, discovery against real sites.
