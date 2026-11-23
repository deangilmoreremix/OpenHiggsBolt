# P3-C — Credit, Font & Capability Engineer (Wave 1, lane `catalog` + `ui`)

**Items 2, 3, 4, 13** and **decisions D1, D2, D3**.

## ALREADY DONE (do NOT redo — build on it)

`src/shared/personalization/templates/typography.ts` currently has:
- ✅ `DESIGN_FONT_LICENSE_FILE = '/fonts/OFL.txt'`
- ✅ `DESIGN_FONT_ATTRIBUTION = 'Typeface: Inter (SIL OFL 1.1) © 2016 The Inter Project Authors'`
- ✅ `DESIGN_FONT_FACE_CSS` now points at `DESIGN_FONT_DATA_URI`
- ❌ **but `DESIGN_FONT_DATA_URI` is built by `readFileSync()` at module scope, and the file does
  `import { readFileSync } from 'fs'` / `import { join } from 'path'`.** That is the critical defect
  below. `DESIGN_FONT_ATTRIBUTION` is also **not yet wired** into the rendered credit line.

Nothing else for P3-C has landed: `templates/catalog.ts`, `templates/designs/shared.tsx`,
`guided/StepPreviewApprove.tsx`, `guided/OverlayEditor.tsx`, `preview/presets.ts`,
`preview/__tests__/presets.test.ts`, `__tests__/noNetworkDuringBrandRender.test.ts` are all
unmodified, and `src/shared/personalization/templates/fonts/` does not exist.

## Files you own EXCLUSIVELY
- `src/shared/personalization/templates/typography.ts`
- `src/shared/personalization/templates/catalog.ts`
- `src/shared/personalization/templates/fonts/**` (new — static payload + generator)
- `src/shared/personalization/templates/designs/shared.tsx` — **the `DESIGN_VIDEO_CREDIT` constant and
  `DesignCreditLine` only**
- `src/shared/personalization/templates/__tests__/typography.test.ts`
- `src/shared/personalization/templates/__tests__/fixedSvgIdWarning.test.tsx` (new)
- `src/shared/personalization/guided/StepPreviewApprove.tsx`
- `src/shared/personalization/guided/OverlayEditor.tsx` — **the font-picker `<select>` block only**
- `src/shared/personalization/preview/presets.ts` — **the font-picker block only**
- `src/shared/personalization/preview/__tests__/presets.test.ts` — **the `fontStackById` block only**
- `src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts`
- `public/fonts/**`

Do not edit any other file. If you need one, post a board message `type: "ASK"`, `to: "ALL"`.

## Context you must read
`docs/phase3/EXECUTION_PLAN.md` (§1 items 2/3/4/13, §2 D1–D3, §4 Wave 1) ·
`docs/phase3/OWNERSHIP.md` · `docs/phase3/VERIFICATION_SPEC.md` · `docs/phase3/DECISIONS.md` ·
`docs/phase3/WAVE1_AUDIT.md` (§0, the P3-C row of §1, **§2.3**, **§2.4**, §3, §4, §5) ·
`docs/phase3/validate.sh` (the P3-C case).

## ⚠️ CRITICAL DEFECT — fix this FIRST (audit §2.3)
`typography.ts` is imported by `templates/designs/fonts.ts` → **every** design adapter
(`shared.tsx`, `LogoMaskWipeDesign.tsx`, …) → the Remotion composition → the **browser bundle**.
Webpack 5 does not polyfill `fs`/`path` for the client, so `npm run build` **fails** with
*Module not found: Can't resolve 'fs'*. This would ship straight into the app build.

**Required rework (mandatory):**
- The base64 payload must become a **static source file**, e.g.
  `src/shared/personalization/templates/fonts/personalizationSansDataUri.ts`, exporting
  `export const PERSONALIZATION_SANS_DATA_URI = 'data:font/woff2;base64,…'`, generated from
  `public/fonts/personalization-sans-latin.woff2` (48 432 B → ≈ 64 KB base64).
- The generator goes at `src/shared/personalization/templates/fonts/generate-font-data-uri.mjs` (or
  similar). It **may** use `fs` — it runs on a developer machine / CI step, never in the bundle.
  It must be idempotent and documented.
- `typography.ts` imports the constant and must **not** import `fs`/`path`/`process.cwd()` in a way
  that reaches the browser bundle.
- `DESIGN_FONT_FACE_CSS` references the data URI; the rendered `@font-face` must contain **no**
  `http(s)://` URL and no `/fonts/…` path.
- `public/fonts/personalization-sans-latin.woff2` and `public/fonts/OFL.txt` **keep shipping** — the
  OFL notice must accompany every copy of the font.
- `templates/__tests__/typography.test.ts` must keep passing **and** gain an assertion that the data
  URI decodes to the exact bytes of the shipped woff2, and that the `@font-face` rule carries no
  remote URL.
- **Proof you owe:** `grep -rn "from 'fs'\|from \"fs\"\|require('fs')" src/shared/personalization/templates src/shared/personalization/preview src/shared/personalization/guided` must return **nothing** except the generator script, and the generator must not be imported by any runtime module. Paste that output.

## D1 — make zero-network *enforceable*
Extend `src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts` with a
**`FontFace.load()` spy** asserting **zero** font network requests during a branded render. Stub
`globalThis.FontFace` with a class whose `load()` records the `source` argument and resolves a
FontFace-like object; assert no recorded source is a remote URL (ideally that no `load()` is called
with a URL at all), and assert the injected `@font-face` CSS contains no `http` URL.
**Keep the existing 3 tests passing and intact — do not weaken them.**

## D2 — OFL attribution in the rendered credit line
The rendered credit is `DESIGN_VIDEO_CREDIT` in `src/shared/personalization/templates/designs/shared.tsx`
(currently `'© 2026 Trimora Inc. (RenderComp) · MIT'`), drawn by `DesignCreditLine`.
`DESIGN_FONT_ATTRIBUTION` already exists in `typography.ts` — **wire it in**. The rendered credit line
must carry BOTH the MIT upstream credit and the OFL typeface attribution. Also make the typeface
notice reachable from the credits surface in `catalog.ts` (`getRemotionDesignAttributionLine()` /
`getRemotionDesignLicenseNotice()`) so the aggregated credit is coherent. Add a test asserting the
rendered credit line string contains both notices.

## D3 — deterministic customer font picker
`src/shared/personalization/preview/presets.ts` currently exports `PREVIEW_FONTS` with 4 per-OS
entries (`inter`, `georgia`, `impact`, `monospace`) and `fontStackById` resolves them, so a customer
can force a per-OS font and break export fidelity. Implement:
- `PREVIEW_FONTS` keeps the historical entries (so saved layers with `fontFamily: 'georgia'` still
  resolve to *something*) but each gets `available: false` and a label suffixed with
  `" (unavailable)"`.
- Add ONE available entry: `{ id: 'personalization-sans', label: 'Personalization Sans', stack: DESIGN_FONT_STACK, available: true }`.
- `fontStackById` must resolve **the bundled face for every id** — a saved Georgia layer renders with
  the bundled face, guaranteeing export fidelity. The invariant: the rendered font MUST be the
  bundled face for every id, and the picker MUST NOT offer a per-OS choice. **Decide and document the
  exact mapping in the handoff.**
- The picker UI is in `src/shared/personalization/guided/OverlayEditor.tsx` (~line 664,
  `{PREVIEW_FONTS.map((font) => …)}`): show the available face as the selectable option and list the
  unavailable ones as **disabled / labelled** options — not silently omitted, not silently offered.
- Update `src/shared/personalization/preview/__tests__/presets.test.ts` (the `fontStackById` block,
  lines ~513-522) to the new contract. The test's intent — "the picker is deterministic" — must
  survive. Do not delete the test; change the expectations to the NEW correct contract and add a case
  asserting every id resolves to the bundled stack.
- `src/shared/personalization/preview/PersonalizationComposition.tsx` calls `fontStackById()` — you do
  **NOT** own that file. Because every id now maps to the bundled stack, the composition needs NO
  change. Verify this and say so in the handoff.

## Item 13 — fixed-SVG-id constraint declared but not enforced
`logo-mask-wipe`, `rve-circular-progress` and `logo-reveal` use fixed SVG `id=` attributes, so a
second instance is clipped by the first — with no warning anywhere. Implement a **visible warning in
the Step 4 UI**:
- Declare the constraint in `src/shared/personalization/templates/catalog.ts`: a per-template marker
  (e.g. a `fixedSvgIds?: string[]` field or a dedicated exported map) plus a helper such as
  `getRemotionDesignFixedSvgIdWarning(templateId): string | null` listing the affected design ids.
- Render a non-blocking, accessible warning in `src/shared/personalization/guided/StepPreviewApprove.tsx`
  near the "Designs" chip row when the selected design has the constraint. Use the existing
  `tokens.ts` styles (`hintStyle`, `softPanelStyle`, …) — do not invent a new visual language, and do
  not change the layout of anything else.
- Test it in `src/shared/personalization/templates/__tests__/fixedSvgIdWarning.test.tsx`: a unit test
  on the catalog helper, plus a test that the Step 4 UI renders the warning for a constrained design
  and does **not** render it for an unconstrained one. If the full Step 4 render is too heavy to set
  up, still prove the warning text is produced by the **same constant** Step 4 renders — and say so
  plainly in the handoff.

## Validation (scoped only)
```
npx vitest run src/shared/personalization/templates src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts src/shared/personalization/preview/__tests__/presets.test.ts --maxWorkers=1 --reporter=dot
```
**Do NOT run** `npm run build`, `build:packages`, `build:studio`, `test:unit`, `playwright` — the
build lock is held by the orchestrator for all of Wave 1. **Do NOT run `npx tsc --noEmit`** — the
orchestrator runs it centrally. If something fails twice, stop and report the blocker with a proposed
fallback instead of looping.

**Host note:** this host has been heavily loaded (load1 206 at one point). A failure that vanishes on a
re-run is host noise — re-run before changing code, and never weaken an assertion because of a
failure you could not reproduce.

## CRITICAL SAFETY RULE
The working tree is **shared with other agents**. **NEVER** run `git stash`, `git checkout`,
`git reset`, `git clean`, `git restore` — the pre-existing-failure proof rule is **suspended** for
Wave 1 (prove read-only with `git show ef13ab9bc:<path>` and record that method). Only `git status`,
`git diff`, `git show`, `git ls-files` are allowed. **Do not commit, push, merge, or deploy.**

## Deliverables
1. **`docs/phase3/handoffs/P3-C.md`** — follow `docs/phase2/handoffs/TEMPLATE.md` (read it). Paste
   **raw** command output, never a summary. Include: the `fs`-import grep proof, the raw test output,
   the exact font-id → stack mapping, and every residual.
2. **A board post** — `board_post`, `to: "ALL"`, `type: "RESULT"`, body **at most 12 short lines**.

## Report back
The files you changed, the raw test output, the `fs`-import grep proof, the font mapping, and any
residual blocker.
