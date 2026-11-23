# P3-C — Credit, Font & Capability Engineer (Wave 1 completion)

**Agent:** P3-C
**Wave:** 3 (Wave 1, finish)
**Status:** ✅ complete
**Lane used:** catalog + ui
**Files changed (this incarnation):**
- `src/shared/personalization/templates/catalog.ts` — D2 credit-surface coherence (OFL line in `getRemotionDesignAttributionLine()` / `getRemotionDesignLicenseNotice()`, re-exports of `DESIGN_FONT_ATTRIBUTION` / `DESIGN_FONT_LICENSE_FILE`) + item 13 (`REMOTION_DESIGN_FIXED_SVG_IDS`, `getRemotionDesignFixedSvgIdWarning`)
- `src/shared/personalization/templates/designs/shared.tsx` — `DESIGN_VIDEO_CREDIT` only (D2)
- `src/shared/personalization/templates/__tests__/fixedSvgIdWarning.test.tsx` — NEW (item 13)
- `src/shared/personalization/templates/__tests__/catalog.test.tsx` — expectations GROWN to the new D2/item-13 contract (per instructions)
- `src/shared/personalization/guided/StepPreviewApprove.tsx` — item 13 warning render
- `src/shared/personalization/guided/OverlayEditor.tsx` — font-picker `<select>` block only (D3)
- `src/shared/personalization/preview/presets.ts` — font-picker block only (D3)
- `src/shared/personalization/preview/__tests__/presets.test.ts` — `fontStackById` block only (D3)
- `src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts` — D1 FontFace.load spy (new describe block; the 3 existing tests untouched)

**Files NOT changed (owned by others / already done):** `templates/typography.ts`, `templates/fonts/**`, `templates/__tests__/typography.test.ts` (previous P3-C incarnation, verified intact), `designs/fonts.ts`, `designs/rveCatalogEntries.ts`, `preview/PersonalizationComposition.tsx`, `e2e/**`, `_createFinalVideoHarness`.

---

## Verification of the already-done D1 rework (not redone)

Confirmed on disk before starting: `templates/fonts/generate-font-data-uri.mjs` (generator,
standalone, imported by no runtime module) and `templates/fonts/personalizationSansDataUri.ts`
(static committed payload) exist; `typography.ts` imports
`PERSONALIZATION_SANS_DATA_URI` / `PERSONALIZATION_SANS_FONT_BYTES` and no longer imports `fs`/
`path`; `DESIGN_FONT_FACE_CSS` carries `src: url("${DESIGN_FONT_DATA_URI}")` with no URL-path
fallback; `DESIGN_FONT_ATTRIBUTION` and `DESIGN_FONT_LICENSE_FILE` are exported from
`typography.ts`; `templates/__tests__/typography.test.ts` carries the D1 block (byte-identity,
no-node-builtin, no-generator-import, D2 attribution assertions). `npx vitest run
src/shared/personalization/templates` → **134/134 passed** before this session's edits; after
them (with the new item-13 and grown-D2 assertions) the same directory is part of the 176/176
below. I edited none of these files.

## fs-import grep proof (audit §2.3 / prompt requirement)

```
$ grep -rn "from 'fs'\|from \"fs\"\|require('fs')" src/shared/personalization/templates src/shared/personalization/preview src/shared/personalization/guided
src/shared/personalization/templates/__tests__/typography.test.ts:13:import { existsSync, readFileSync, statSync } from 'fs'
$ grep -rn "from 'path'\|from \"path\"" src/shared/personalization/templates src/shared/personalization/preview src/shared/personalization/guided
src/shared/personalization/templates/__tests__/typography.test.ts:14:import { join } from 'path'
$ grep -rn "readFileSync\|process.cwd" src/shared/personalization/templates/*.ts src/shared/personalization/templates/designs/*.ts* 2>/dev/null
src/shared/personalization/templates/typography.ts:84: * module-scope `readFileSync()` would break `npm run build` (webpack 5 does   ← a COMMENT, not code
$ grep -rn "generate-font-data-uri" src/ --include='*.ts' --include='*.tsx' | grep -v fonts/
src/shared/personalization/templates/__tests__/typography.test.ts:229:    expect(typographySource).not.toMatch(/import[^\n]*generate-font-data-uri/)
src/shared/personalization/templates/__tests__/typography.test.ts:230:    expect(typographySource).not.toMatch(/require\([^)\n]*generate-font-data-uri/)
```

The only `fs`/`path` imports left in the browser-reachable tree are in `__tests__/typography.test.ts` —
a Vitest test file, never imported by any runtime module and never part of the app bundle. The
generator (`templates/fonts/generate-font-data-uri.mjs`) is imported by no runtime module (the
only references are the test's *negative* assertions). The `readFileSync` hit in `typography.ts`
is inside a doc comment.

## D2 — OFL attribution in the rendered credit line

`designs/shared.tsx` now reads:

```ts
export const DESIGN_VIDEO_CREDIT = `© 2026 Trimora Inc. (RenderComp) · MIT · ${DESIGN_FONT_ATTRIBUTION}`
// = '© 2026 Trimora Inc. (RenderComp) · MIT · Typeface: Inter (SIL OFL 1.1) © 2016 The Inter Project Authors'
```

`DESIGN_FONT_ATTRIBUTION` is imported **directly from `../typography`** — `designs/fonts.ts`
does NOT re-export it and that file is not this lane's, so no detour. The rendered line keeps
`whiteSpace: 'nowrap'`, `fontSize: 10`, `opacity` via `rgba(255,255,255,0.55)`, the text shadow
and `pointerEvents: 'none'` — unchanged, not redesigned. The line grew to ~105 characters; at
10px on a 1920px composition it occupies well under half the width and remains legible at the
existing opacity; `whiteSpace: 'nowrap'` guarantees it stays one line. Catalog coherence:

- `getRemotionDesignAttributionLine()` appends `DESIGN_FONT_ATTRIBUTION` as the last line after
  the two upstream repository attributions.
- `getRemotionDesignLicenseNotice()` appends a sentence pointing at `DESIGN_FONT_LICENSE_FILE`
  (`/fonts/OFL.txt`), satisfying OFL 1.1 clause 2 from the aggregated credits surface.
- `DESIGN_FONT_ATTRIBUTION` / `DESIGN_FONT_LICENSE_FILE` are re-exported from `catalog.ts`, so
  the credits surface reaches every upstream AND typeface notice from one module.
- `templates/__tests__/catalog.test.tsx`: the existing containment assertions survive untouched;
  added: `line` contains `DESIGN_FONT_ATTRIBUTION`, `notice` contains `/fonts/OFL.txt`, and a new
  test asserting `DESIGN_VIDEO_CREDIT` contains BOTH `'MIT'` and `DESIGN_FONT_ATTRIBUTION`.

`e2e/personalization-step4-remotion-export.spec.ts` was NOT touched; its `'MIT'` assertion still
passes because the MIT credit remains the first segment of the line.

## D3 — deterministic customer font picker — exact mapping

`DESIGN_FONT_STACK` (read from `templates/typography.ts`) is:

```
"Personalization Sans", Inter, ui-sans-serif, system-ui, sans-serif
```

`presets.ts` imports it from `../templates/typography` — verified cycle-free: `templates/typography`
imports only `react`, `remotion` and `./fonts/personalizationSansDataUri`, nothing from `preview/`
(a module-scope comment in `presets.ts` documents this). The exact id → stack mapping:

| id (persisted `fontFamily`) | picker label | available | RENDERED stack (`fontStackById`) |
|---|---|---|---|
| `inter` | `Inter (unavailable)` | false | `"Personalization Sans", Inter, ui-sans-serif, system-ui, sans-serif` |
| `georgia` | `Georgia (unavailable)` | false | (same bundled stack) |
| `impact` | `Impact (unavailable)` | false | (same bundled stack) |
| `monospace` | `Monospace (unavailable)` | false | (same bundled stack) |
| `personalization-sans` | `Personalization Sans` | **true** | (same bundled stack) |
| anything else / missing / a raw stack string | — | — | (same bundled stack) |

Every id — historical, unknown, or a persisted raw stack string — resolves to the bundled stack;
`DEFAULT_FONT_STACK` is the bundled stack. The historical entries keep their original `stack`
strings (documentation of what the id used to mean, and so an old saved layer still matches its
entry in the `<select>` and displays its "unavailable" label). `OverlayEditor.tsx` renders the
available face as the only selectable option and the four historical ones as `disabled` options
with their unavailable labels — not omitted, not silently offered.

**`preview/PersonalizationComposition.tsx` needs NO change — verified.** It only ever calls
`fontStackById()` / `fontStackById(layer.fontFamily)` (7 call sites, lines 238, 254, 274, 389,
402, 552, 568), which now return the bundled stack for every input, and it passes
`fontFamily={layer.fontFamily}` to design components, which the adapters ignore for upstream
text (the injected stylesheet overrides it). Not edited.

`presets.test.ts`: the `fontStackById` describe block was rewritten to the new contract (intent
"the picker is deterministic" survives): every id/stack/unknown/missing resolves to the bundled
stack, historical ids keep resolving, exactly one available entry exists and the rest are
labelled unavailable. The describe block was not deleted.

## Item 13 — fixed-SVG-id constraint warning

**Why the constraint exists:** SVG `id`s are document-global. `logo-mask-wipe` draws
`<clipPath id="lmw-wipe">`, `logo-reveal` draws `<clipPath id="lsd-shine-clip">` and
`rve-circular-progress` draws `<linearGradient id="progressGradient">`. If two instances of the
same design are mounted in one composition, both instances reference the id and the
browser/renderer resolves it to the FIRST instance in the document — the second instance is
clipped (or gradient-filled) against the first one's geometry. The upstreams are frozen
(contract addition C7), so the constraint is declared, not fixed.

**Implementation:**
- `catalog.ts`: standalone exported map `REMOTION_DESIGN_FIXED_SVG_IDS: Record<string, string[]>`
  keyed by template id (a map, not a field on the RVE template objects, because
  `rveCatalogEntries.ts` is another lane's file) + helper
  `getRemotionDesignFixedSvgIdWarning(templateId) → string | null` returning e.g.
  `This design uses fixed SVG ids ("lmw-wipe"), so only ONE instance of it can appear per
  composition — a second instance is clipped by the first because the SVG ids collide.`
- `StepPreviewApprove.tsx`: when the currently selected design is constrained, a
  `<p role="note" style={{ ...hintStyle, marginTop: 8 }}>` renders directly under the
  "Designs" chip row (above the existing `remotionDesignError` line). Non-blocking, accessible,
  existing token style only, no other layout change.

**Test** (`templates/__tests__/fixedSvgIdWarning.test.tsx`): unit tests on the helper (the three
constrained ids return a warning naming their fixed SVG ids; unconstrained/unknown/empty/null/
undefined return null) AND a real Step 4 mount: the full `StepPreviewApprove` renders with the
provider (`useDemoPersonalize`), `BeforeAfterPreview`, `OverlayEditor` and `buildPreviewInput`
mocked out — everything else (chip row, error line, warning line) is real. Asserts the warning
renders with `role="note"` for `logo-mask-wipe` and no `role="note"` exists for
`animated-headline`. No fallback assertion was needed — the full mount worked.

## D1 enforcement — the FontFace.load spy

`noNetworkDuringBrandRender.test.ts` gained a new describe block
`'no font network requests during branded render (D1)'` with one test:

- Installs `globalThis.FontFace = class RecordingFontFace` whose constructor records the
  `source` argument and whose `load()` records the source, sets `status = 'loaded'` and resolves
  `{ family, status: 'loaded' }`. The stub is installed and restored **inside the test only**
  (a `try/finally`), so the harness for the three existing tests is untouched —
  `_createFinalVideoHarness` needed NO change.
- Runs the same full branded render as test 1 (provider → source → approve →
  `createFinalVideo`).
- Asserts, in the strongest form, `expect(recordedSources).toEqual([])` — `FontFace` is never
  constructed at all during a branded render (the data-URI `@font-face` needs no `load()`), plus
  defence-in-depth that no recorded source matches `/https?:\/\//i`.
- Asserts `DESIGN_FONT_FACE_CSS` contains `data:font/woff2;base64,` and no `https?://`, no
  `url("/fonts/` and no `url(.../` path reference at all.

The 3 existing tests were not modified in any way.

## Commands run and raw output

### `npx vitest run src/shared/personalization/templates src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts src/shared/personalization/preview/__tests__/presets.test.ts --maxWorkers=1 --reporter=dot` (final run)
```
··························································································

 Test Files  10 passed (10)
      Tests  176 passed (176)
   Start at  15:53:18
   Duration  20.42s (transform 1.63s, setup 3.50s, tests 2.65s, environment 7.99s, prepare 990ms)
```
(Interim runs surfaced three real defects, each fixed once: a missing re-export of
`DESIGN_FONT_ATTRIBUTION` from `catalog.ts`, a wrong `vi.mock` path for
`DemoPersonalizeProvider` (it lives at the personalization root, not `guided/`), and missing
testing-library `cleanup()` (no vitest `globals` → no auto-cleanup). No host-noise failures
occurred; no assertion was weakened.)

### Not run (per instructions): `npm run build`, `build:packages`, `build:studio`, `test:unit`, `playwright`, `npx tsc --noEmit` — orchestrator holds the build lock and runs tsc centrally.

## Residuals

- **Type check deferred:** `npx tsc --noEmit` was NOT run (orchestrator-owned). The largest
  un-reviewed surface is the new `available` field on `PREVIEW_FONTS` — its only consumer
  (`OverlayEditor.tsx`) was updated in the same commit-set.
- **Credit line length:** the D2 line is ~105 chars at 10px with `nowrap`. Verified visually
  acceptable by arithmetic (≈530px on a 1920px composition), not in a real exported frame — the
  orchestrator's e2e run (P3-E's spec, untouched) is the authoritative check.
- **`FontFace` in jsdom:** jsdom defines no `globalThis.FontFace`; the stub adds one for the
  duration of the new test only, so any future code that legitimately constructs a FontFace with
  a data URI would fail `expect(recordedSources).toEqual([])`. That failure would be a correct
  signal to revisit, not a flake.
- `packages/studio/dist/**` deletions and other dirty files visible in `git status` belong to
  other lanes; I touched none of them.

## Wave compliance

- [x] Edited only files listed against my ID in `docs/phase3/OWNERSHIP.md` (plus
      `catalog.test.tsx`, explicitly authorised by the task instructions)
- [x] Did not run a build/test/e2e command without the build lock (scoped vitest only)
- [x] Did not rebase, reset, commit, push, or touch `origin/main`, `netlify.toml` or `.github/`
- [x] Wrote this handoff file and posted a `RESULT` to the board
