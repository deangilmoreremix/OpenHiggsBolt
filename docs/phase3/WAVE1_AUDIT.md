# Phase 3 — Wave 1 pre-flight audit (orchestrator)

**Date:** 2026-10-21 · **Base:** `ef13ab9bc` · **Branch:** `feature/remotion-personalization-phase-2`

The previous Wave 1 dispatch died on `Too Many Requests` (model capacity, not implementation).
The agents' *file* work partially landed in the shared working tree. Per the E1 recovery rule
("audit the filesystem first — the agent may have finished its file work"), the tree was inspected
before anything was re-dispatched. **This document is that audit.** It is the input to the
re-dispatch.

## 0. Host / baseline gate (re-run by the orchestrator immediately before release)

| Check | Value | Verdict |
|---|---|---|
| `uptime` load1 | `5.62` | PASS (< 40) |
| available memory (free+inactive+spec+purgeable) | `2.31 GiB` | PASS (> 1.5 GiB) |
| `git rev-list --count ef13ab9bc..origin/main` | `0` | PASS — no baseline drift (E5 clear) |
| `git ls-remote origin refs/heads/main` | `7ebc20967c31293d7bc133ac6aed28885b1baefc` | matches the pin — QA-12 target |

## 1. What already landed (keep it, do not redo it)

| Agent | Landed | State |
|---|---|---|
| **P3-A** | `app/api/personalization/project/route.ts` — reads `sourceId`, filters the list RPC result server-side, returns `{projects: filtered}` (200, empty array) instead of falling through to the 400. `src/shared/personalization/supabaseProjectPersistence.ts` — `loadProject()` now sends `?list=true&sourceId=<id>` when there is no `projectId`, and hard-fails on an empty/whitespace id. | **usable, but incomplete** — see §2.1 |
| **P3-B** | `packages/studio/src/components/MotionControlStudio.jsx` `z-[300]` → `z-[240]`; `src/apps/vfx-studio/components/ImageUrlModal.tsx` `zIndex: 1000` → `240`; `src/apps/vfx-studio/pages/VFXGenerate.tsx` `zIndex: 2000` → `240`. New regression test `packages/studio/src/components/__tests__/studioLayering.test.jsx`. | **usable** — see §2.2 |
| **P3-C** | `src/shared/personalization/templates/typography.ts` — added `DESIGN_FONT_LICENSE_FILE`, `DESIGN_FONT_ATTRIBUTION`, and a `DESIGN_FONT_DATA_URI` built by `readFileSync()` at module scope; `DESIGN_FONT_FACE_CSS` now points at the data URI. | **BROKEN — must be reworked.** See §2.3 |
| **P3-D** | `.gitignore` — explicit `packages/studio/dist/` rule. `packages/studio/dist/**` — all 29 files removed from the index (`git ls-files packages/studio/dist` → **0**). | **usable for item 10**; item 9 (the flaky test) is untouched |

## 2. Blocking defects found in the landed work

### 2.1 P3-A — the landed fix does not yet cover the real call path

`DemoPersonalizeProvider.tsx:1708` calls `loadProject({ sourceId: src.id })`. The landed
`loadProject()` therefore now sends `?list=true&sourceId=…`, and the route filters the list RPC
result on `row.sourceDemoId` / `row.source_demo_id`.

**Risk:** the RPC `personalization_saved_projects_list` may not return a `sourceDemoId` column at
all, in which case the filter drops every row and the restore silently returns "no saved project"
— the same user-visible symptom as the 400, just quieter. The landed code has **no test** and
**no proof** that the column exists. P3-A must verify the column name against the migration/SQL
in the repo, and must make the filter tolerant of a missing column (fall back to the unfiltered
list) rather than silently returning nothing. The contract's real invariant is:
**no request may reach the server without an `id` or `list` param**, and the restore must actually
restore.

### 2.2 P3-B — the ceiling is only *partly* met

The three known residuals are lowered to `240`, which is below the Personalization Modal's `z-[250]`.
**But** the plan requires a **hand survey** of the whole app for further modal-shaped layers ≥ 250,
because `validate.sh P3-B` only scans `packages/studio/src/components`,
`src/apps/vfx-studio` and `src/apps/thumbnail-studio`. Files under `src/components`, `src/access`,
`src/apps/**` (other studios) and the app root are **not** covered by the validator. P3-B must
survey by hand and must record every hit it lowers or explicitly justifies.

Note: the landed `studioLayering.test.jsx` scans `src/components`, `src/access` and
`src/shared/personalization` as well — good — but it does **not** scan `src/apps/**` beyond
vfx/thumbnail, and its `looksLikeModal()` only matches `fixed inset-0`, so a modal positioned with
`position: fixed` + `inset: 0` split across attributes, or `top-0 left-0 right-0 bottom-0`,
would slip through. P3-B must broaden the survey and the test.

### 2.3 P3-C — the landed `typography.ts` will break the application build ⚠️ (critical)

The landed code does:

```ts
import { readFileSync } from 'fs'
import { join } from 'path'
…
export const DESIGN_FONT_DATA_URI = loadInlinedFontDataUri()
```

`templates/typography.ts` is imported by `templates/designs/fonts.ts` → every design adapter
(`shared.tsx`, `LogoMaskWipeDesign.tsx`, …) → the Remotion composition → the **browser** bundle.
Webpack 5 does not polyfill `fs`/`path` for the client, so `npm run build` fails with
*Module not found: Can't resolve 'fs'*. **This defect would have shipped straight into the app
build.** It is the single most important thing Wave 1 must fix.

**Required rework (mandatory, not a preference):**

- The base64 payload must become a **static source file** in the repo, e.g.
  `src/shared/personalization/templates/fonts/personalizationSansDataUri.ts`, exporting
  `export const PERSONALIZATION_SANS_DATA_URI = 'data:font/woff2;base64,…'`.
  It is generated once from `public/fonts/personalization-sans-latin.woff2` (48 432 B → ≈ 64 KB
  base64) and committed. `typography.ts` imports the constant. **No `fs` / `path` / `process.cwd()`
  in anything reachable from the browser bundle.**
- The generator script may live under `src/shared/personalization/templates/fonts/` (or
  `scripts/`) and may use `fs` — it runs on a developer machine / CI step, never in the bundle.
- `DESIGN_FONT_FACE_CSS` keeps pointing at the data URI. The `@font-face` `src` must contain **no**
  `http(s)://` URL and no `/fonts/…` path.
- `public/fonts/personalization-sans-latin.woff2` and `public/fonts/OFL.txt` **keep shipping** — the
  OFL notice must accompany every copy of the font.
- The existing `templates/__tests__/typography.test.ts` must keep passing **and** must gain an
  assertion that the data URI decodes to the same bytes as the shipped woff2 and that the
  `@font-face` rule carries no remote URL.

### 2.4 P3-C — items 2, 3, 4, 13 are still entirely unimplemented

Nothing has landed for: the OFL attribution in the rendered credit line (D2), the deterministic
font picker (D3), the `FontFace.load()` spy that makes zero-network *enforceable* (D1), or the
fixed-SVG-id warning in the Step 4 UI (item 13). These are the bulk of P3-C's work.

### 2.5 P3-D — item 9 untouched

`src/shared/personalization/__tests__/PersonalizationModal.test.tsx:441`
("keeps retry button visible when business research fails") is the known flake and has not been
touched. P3-D must make it deterministic **without weakening the assertion** — the assertion
("the Retry button is still visible after a business-research failure") is the intent and must
survive. The fix is to remove the race (await the settled state / use `findBy*` with the real
event), not to loosen the expectation.

## 3. Ownership amendments granted by the orchestrator (Wave 1)

The `OWNERSHIP.md` rows were written before this audit. The following additions are granted, and
only these — every file stays single-writer:

| Agent | Newly owned file | Why |
|---|---|---|
| P3-C | `src/shared/personalization/templates/fonts/**` (new, generated payload + generator) | the data-URI payload must be a static module (§2.3) |
| P3-C | `src/shared/personalization/templates/designs/shared.tsx` (the `DESIGN_VIDEO_CREDIT` constant and `DesignCreditLine` only) | D2 — the OFL attribution belongs in the *rendered* credit line |
| P3-C | `src/shared/personalization/preview/__tests__/presets.test.ts` (the `fontStackById` block only) | D3 changes the font list; this is that test |
| P3-C | `src/shared/personalization/templates/__tests__/typography.test.ts` | D1 — the data-URI assertions live there |
| P3-C | `src/shared/personalization/guided/OverlayEditor.tsx` (the font-picker `<select>` block only) | D3 — the picker UI itself; `presets.ts` supplies the data |
| P3-B | `src/apps/**` (survey only; edits limited to modal z-index values) | §2.2 — the hand survey spans all studios |

**Still protected for every agent:** `netlify.toml`, `package.json`, `pnpm-lock.yaml`,
`package-lock.json`, `.github/**`, `origin/main`, and every file owned by another agent.

## 4. Heavy-command policy for Wave 1

`npm run build`, `npm run build:packages`, `npm run build:studio`, `npm run test:unit` and
`npx playwright test` require the **build lock**, which the **orchestrator** holds for the whole
of Wave 1. No Wave 1 agent may run them, including P3-D's `npm run build:studio` check — the
orchestrator runs it after Wave 1 and records the raw output in the P3-H handoff.

Agents may run: scoped `npx vitest run <file> --maxWorkers=1`, `npx tsc --noEmit` **only if the
orchestrator has not queued one for the same moment** (prefer: do not run it at all — the
orchestrator runs it centrally), `git` read commands, `grep`, `node -e`.

## 5. Completion bar for Wave 1

An agent is complete only when: its files are changed in the working tree, its scoped validation
passes, its handoff file `docs/phase3/handoffs/<ID>.md` exists with **raw** output, and it has
posted a ≤ 12-line `RESULT` to the board. **The orchestrator's `validate.sh <ID>` run is the
evidence, not the agent's claim.**
