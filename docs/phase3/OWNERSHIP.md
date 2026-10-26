# Phase 3 — File Ownership Ledger & Lane Control

**Base (pinned):** `ef13ab9bc` (branch `feature/remotion-personalization-phase-2`)
**`origin/main` at pin:** `7ebc20967`
**Plan:** [`docs/phase3/EXECUTION_PLAN.md`](./EXECUTION_PLAN.md)

**Rule:** an agent may ONLY edit files listed against its ID. If it needs a file owned by another
agent it posts a `REQUEST` on the board and waits. Editing a file you do not own is a **wave
violation** and the orchestrator reverts it.

## Lanes (single-writer)

| Lane | Covers |
|---|---|
| `persistence` | `supabaseProjectPersistence.ts`, `app/api/personalization/project/route.ts` |
| `provider` | `DemoPersonalizeProvider.tsx`, studio provider mounts, `StandaloneShell.js` |
| `catalog` | `templates/{typography,catalog}.ts`, `templates/designs/**`, `public/fonts/**` |
| `ui` | `guided/**`, `packages/studio/src/components/**`, `src/apps/vfx-studio/**` |
| `core` | `preview/{types,presets}.ts`, `preview/PersonalizationComposition.tsx` |
| `e2e` | `e2e/**` |
| `hygiene` | `.gitignore`, tracked build output, test files outside the personalization surface |
| `integration` | everything — held only by P3-H in Wave 4 |

## Ownership

| Wave | ID | Role | Owns (exclusive) | Lane | Items |
|---|---|---|---|---|---|
| 1 | P3-A | Persistence Contract Engineer | `src/shared/personalization/supabaseProjectPersistence.ts`, `app/api/personalization/project/route.ts`, `src/shared/personalization/DemoPersonalizeProvider.tsx` (`loadProject` call site only), `src/shared/personalization/__tests__/projectPersistence.test.ts` (new) | `persistence` | 1 |
| 1 | P3-B | Layering Engineer | `packages/studio/src/components/MotionControlStudio.jsx`, `src/apps/vfx-studio/**`, `src/apps/**` *(modal z-index values only — the hand survey in WAVE1_AUDIT §2.2 spans every studio)* | `ui` | 6 |
| 1 | P3-C | Credit, Font & Capability Engineer | `src/shared/personalization/templates/typography.ts`, `src/shared/personalization/templates/catalog.ts`, `src/shared/personalization/templates/fonts/**` *(new — see WAVE1_AUDIT §2.3)*, `src/shared/personalization/templates/designs/shared.tsx` *(the `DESIGN_VIDEO_CREDIT` constant + `DesignCreditLine` only)*, `src/shared/personalization/templates/__tests__/typography.test.ts`, `src/shared/personalization/templates/__tests__/catalog.test.tsx` *(additive only — granted post-hoc when D2/item 13 required growing the credit assertions; audited +41/−0, no assertion weakened)*, `src/shared/personalization/templates/__tests__/fixedSvgIdWarning.test.tsx` *(new)*, `src/shared/personalization/guided/StepPreviewApprove.tsx`, `src/shared/personalization/guided/OverlayEditor.tsx` *(the font-picker `<select>` block only)*, `src/shared/personalization/preview/presets.ts` (font-picker block only), `src/shared/personalization/preview/__tests__/presets.test.ts` *(the `fontStackById` block only)*, `src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts`, `public/fonts/**` | `catalog` + `ui` | 2, 3, 4, 13 |
| 1 | P3-D | Repo Hygiene Engineer | `packages/studio/dist/**` (git untrack), `.gitignore`, `src/shared/personalization/__tests__/PersonalizationModal.test.tsx` (the flaky case only) | `hygiene` | 9, 10 |
| 2 | P3-E | Export Matrix Engineer | `e2e/personalization-step4-remotion-export.spec.ts`, `docs/phase3/EXPORT_MATRIX.md`, `docs/screenshots/phase-3/**` | `e2e` | 7 |
| 2 | P3-F | Studio Coverage Engineer | `app/(brand-studio)/**`, `app/brand-studio/**`, `app/academy/**`, `src/apps/vfx-studio/**` (mount half only), `src/apps/thumbnail-studio/**`, `components/StandaloneShell.js` (additive) | `provider` | 5 |
| 3 | P3-G | Test Debt Sweeper | the failing test files + the specific modules they cover, excluding `src/shared/personalization/**`, `packages/studio/**`, `src/apps/vfx-studio/**` | `hygiene` | 8 |
| 4 | P3-H | Integration, QA & Report Engineer | everything | all | all |

## Pre-registered validation (the ORCHESTRATOR runs it, not the agent)

```
docs/phase3/validate.sh P3-A   # persistence contract
docs/phase3/validate.sh P3-B   # layering ceiling
docs/phase3/validate.sh P3-C   # font / credit / picker / capability
docs/phase3/validate.sh P3-D   # hygiene
docs/phase3/validate.sh P3-E   # export matrix
docs/phase3/validate.sh P3-F   # studio coverage
docs/phase3/validate.sh P3-G   # test debt
docs/phase3/validate.sh P3-H   # full matrix + QA gates
```

An agent's own claim of success is **never** the evidence. The validator's output is.

## Dispatch prompts (on disk, so a turn interruption never loses an assignment)

- `docs/phase3/prompts/P3-E.md` — Export Matrix Engineer (Wave 2)
- `docs/phase3/prompts/P3-F.md` — Studio Coverage Engineer (Wave 2)
- `docs/phase3/prompts/P3-G.md` — Test Debt Sweeper (Wave 3)
- `docs/phase3/prompts/P3-H.md` — Integration, QA & Report Engineer (Wave 4)

Wave 1 prompts were dispatched directly (P3-A, P3-B, P3-C, P3-D) and are described in
`docs/phase3/WAVE1_AUDIT.md`.

## Protected files (nobody may touch)

`netlify.toml` · `package.json` · `pnpm-lock.yaml` · `package-lock.json` · `.github/**`
`origin/main` — no agent rebases, resets, merges, or deploys.
