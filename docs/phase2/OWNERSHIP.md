# Phase 2 — File Ownership Ledger

**Baseline (pinned):** `84a9d1586` (`feature/remotion-personalization-phase-1`)
**Branch:** `feature/remotion-personalization-phase-2` (stacked on Phase 1)
**Rule:** an agent may ONLY edit files listed against its ID. If it needs a file owned by
another agent, it posts a `REQUEST` to the board and waits for a reassignment. Editing a file
you do not own is a **wave violation** and the orchestrator will reject the change.

## Exclusive lanes

A lane is a single-writer resource. Only the orchestrator grants a lane, and only one agent
holds a lane at a time.

| Lane | Covers |
|---|---|
| `catalog` | `src/shared/personalization/templates/catalog.ts` |
| `core` | `src/shared/personalization/preview/{types,presets}.ts`, `src/shared/personalization/preview/PersonalizationComposition.tsx` |
| `provider` | `src/shared/personalization/DemoPersonalizeProvider.tsx` |
| `modal` | `src/shared/personalization/PersonalizationModal.tsx` |
| `ui` | `src/shared/personalization/guided/*` |

## Ownership

| Wave | ID | Role | Owns (exclusive) | Lane | Notes |
|---|---|---|---|---|---|
| 1 | A1 | Export Evidence Engineer | `e2e/personalization-step4-remotion-export.spec.ts`, `e2e/fixtures/remotion-export/**` | — | new files only |
| 1 | A2 | CI Triage Analyst | *(read-only)* → `docs/ci/CI_OUTAGE_REPORT.md` | — | must not edit `src/` |
| 1 | A3 | Modal Robustness Engineer | `src/shared/personalization/PersonalizationModal.tsx` | `modal` | 2 defects only |
| 1 | A4 | Inspector Slot Engineer | `src/shared/personalization/guided/OverlayEditor.tsx` → `docs/phase2/INTERFACE-slots.md` | `ui` | must NOT edit `preview/types.ts` |
| 1 | A5 | Package & Lint Gatekeeper | *(read-mostly)*; eslint config only if lint itself is broken | — | final `build:packages` runs after A9 |
| 1 | A6 | Upstream & Dependency Analyst | *(read-only)* → `docs/phase2/handoffs/A6.md` memo | — | must not edit `src/` |
| 2 | A7 | Catalog Curator — batch 1 | `src/shared/personalization/templates/_upstream/<new>/**`, `src/shared/personalization/templates/designs/<new>Design.tsx`, `src/shared/personalization/templates/catalog.ts` | `catalog` | new designs only |
| 2 | A8 | Catalog Curator — batch 2 | `src/shared/personalization/templates/_upstream/rve-<ids>/**`, `src/shared/personalization/templates/designs/rve<Name>Design.tsx` | — | new files only; registration deferred to A11 |
| 2 | A9 | Studio Integration Engineer | `packages/studio/src/components/{ImageStudio,ClippingStudio,VibeMotionStudio,MotionControlStudio,LipSyncStudio,CinemaStudio,RecastStudio,MarketingStudio,AiInfluencerStudio}.jsx` | — | additive only; no provider changes |
| 2 | A10 | Deterministic Type Engineer | `src/shared/personalization/templates/designs/fonts.ts`, `src/shared/personalization/templates/typography.ts` | — | new files only |
| 3 | A11 | Integration Lane Engineer | `catalog` + `core` + `provider` + all A3/A4/A9/A10 changes | all | serial, last writer |
| 3 | A12 | Verification & Report Engineer | `docs/REMOTION_PHASE_2_REPORT.md`, `docs/REMOTION_PHASE_1_REPORT.md` (append) | — | runs the full matrix |

## Build lock

`docs/phase2/BUILD_LOCK` names the single agent permitted to run `npm run build`,
`npm run build:packages`, `npm run test:unit`, `npm run build:studio` or
`npx playwright test`. The orchestrator grants it; the holder releases it by clearing the file.
**Do not run these without the lock** — a saturated host produced 2–4 *different* phantom
failures per run in Phase 1.

## Verification contract

Every agent runs its named commands and pastes **raw output** into
`docs/phase2/handoffs/<ID>.md`. The orchestrator decides pass/fail. An agent may not self-certify,
and may not report success for a test it did not execute.
