# Remotion Phase 1 — Completion Report

**Repository:** `OpenHiggsBolt` (origin: `https://github.com/deangilmoreremix/OpenHiggsBolt.git`)
**Worktree:** `.kilo/worktrees/fix-the-video-previews`
**Feature branch:** `feat/remotion-phase1-personalization-templates`
**Base commit:** `0bfecda0f` ("merge: integrate origin/main into `fix-the-video-previews`")
**Current HEAD:** `603c60d6f` ("feat(personalization): expand the demo library from 12 to 123 verified videos")
**Date:** 2026-10-20
**Status:** Phase 1 implementation complete and verified. **The Phase 1 work is UNCOMMITTED in the working tree and staged for commit by the coordinator** — the coordinator creates the commit. Nothing was merged, pushed or deployed.

---

## 1. Repository and branch baseline

| Item | Value |
|---|---|
| Repository | `OpenHiggsBolt` — origin `https://github.com/deangilmoreremix/OpenHiggsBolt.git`; upstream read-only mirror `https://github.com/Anil-matcha/Open-Generative-AI.git` |
| Worktree | `/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/.kilo/worktrees/fix-the-video-previews` |
| Feature branch | `feat/remotion-phase1-personalization-templates` (not switched, not renamed) |
| Base commit | `0bfecda0f` — `merge: integrate origin/main into fix-the-video-previews` |
| `origin/main` tip | `0bfecda0f8fb7366a33dbe7d422a68b30911750e` — **identical to the base commit** |
| Merge base with `origin/main` | `0bfecda0f8fb7366a33dbe7d422a68b30911750e` |
| Current HEAD | `603c60d6f4a34fafde56e61331042a43ab566f95` |
| Branch commits ahead of `origin/main` | 1 (`603c60d6f`) plus the uncommitted Phase 1 working tree |
| PR for this branch | **none** — this branch has no pull request of its own |

### Relationship to the sibling demo-library branch and PR

The demo-library expansion work is **commit `603c60d6f`**, and that commit is the tip of **two** branches:

- `feat/expand-demo-library-categories` — the sibling demo-library branch, published as **PR #63** (*"feat(personalization): expand the demo library from 12 to 123 verified videos"*, base `main`, head `603c60d6f`, state **OPEN**, mergeable **MERGEABLE**).
- `feat/remotion-phase1-personalization-templates` — this branch.

`git diff HEAD origin/feat/expand-demo-library-categories` is **empty**: the two branches are byte-identical at their tips. The Remotion Phase 1 branch was therefore cut from the demo-library branch's tip and adds the Phase 1 work **on top, uncommitted**. The demo-library work is described in `docs/DEMO_LIBRARY_EXPANSION_REPORT.md`; it is context only for this report and is not re-summarised here.

A **separate, independent** Phase 1 implementation exists on branch `feature/remotion-personalization-phase-1` (**PR #62**, head `84a9d1586`, OPEN, base `main`). That is a different worktree and a different design model (its registry lives in `src/shared/personalization/templates/`); it is **not** this branch and the two are not interchangeable.

### Merge cleanliness with `main`

- `git merge-base origin/main HEAD` → `0bfecda0f…`, and `git merge-base --is-ancestor origin/main HEAD` succeeds: **`origin/main` is an ancestor of this branch.**
- The base commit `0bfecda0f` is itself the merge commit that integrated `origin/main` into the line of work this branch descends from. The integration was clean — no conflict markers, no unresolved paths, no manual "ours/theirs" resolutions recorded in the tree.
- There is **nothing left to merge**: the branch is exactly one commit ahead of `origin/main`, and the Phase 1 delta is uncommitted on top.

### Nothing was merged or deployed

No `git merge`, no `git push`, no `git commit`, no PR creation, no Netlify/Vercel/other deploy was performed for the Phase 1 work. `origin/main` is still at `0bfecda0f`. The only remote write associated with this line of work is the already-existing demo-library PR #63, which was opened by the sibling work, not by Phase 1.

---

## 2. Current Step 4 architecture

### The four-step wizard

`src/shared/personalization/guided/SimpleModeWizard.tsx` renders exactly four steps, all reading and writing the **single** provider state in `DemoPersonalizeProvider`:

| Step | Component | Responsibility |
|---:|---|---|
| 1 | `StepFindBusiness` | find / pick the customer's business |
| 2 | `StepChooseVideo` | pick the source video (demos, uploads, Motion Studio templates) |
| 3 | `StepPersonalize` | write the copy, pick the layout preset |
| 4 | `StepPreviewApprove` | preview, adjust, approve, produce the final video |

**Step 4 is `src/shared/personalization/guided/StepPreviewApprove.tsx`.** Before Phase 1 it contained, top to bottom: the `BeforeAfterPreview` panel, a "Quick adjustments" panel (the five layout pills, aspect ratio, fps, duration, end-card toggle), the `OverlayEditor`, and the "Approve and create" panel (approve / render branded video / generate with AI / download / upload). Phase 1 added **one** element to it — the `RemotionDesignPicker` — and changed nothing else in that file.

### How the preview composition is built

```
buildPreviewInput({ source, previewSettings, previewVideo, clientForm, assets })
        │  (src/shared/personalization/guided/buildPreviewInput.ts)
        ▼
PreviewInputProps {
  videoUrl, posterUrl, isImageSource,   // the source media
  audioUrl,                             // the customer's chosen music track
  settings: PersonalizationPreviewSettings,
  brand:   { businessName, headline, offer, cta, phone, website,
             logoUrl, productUrl, serviceUrl },
  remotionDesignId?, remotionDesignProps?   // ← added by Phase 1 (optional)
}
```

`buildPreviewInput` is a pure helper used by **three** surfaces — Step 4, the Advanced Editing overlay editor and the modal's overlay section — so all of them build the identical input from the identical data.

### `previewSettings` → `inputProps`

`previewSettings` is the provider's persisted `PersonalizationPreviewSettings`:

| Field | Meaning |
|---|---|
| `layout` | one of the five `PREVIEW_LAYOUTS` presets (`business-introduction`, `product-showcase`, `service-promotion`, `special-offer`, `branded-ending`) |
| `layers[]` | the overlay/pill stack — each `PreviewLayer` has `kind`, `x`/`y` (normalised 0..1 fractions), `scale`, `animation` + `animationDelay`, `startFrame`/`endFrame`, `opacity`, `text`, `color`, `fontFamily`, `imageUrl` |
| `brandColors` | `primary`, `accent`, `text`, `backgroundDim` |
| `aspectRatio` | `16:9` \| `9:16` \| `1:1` \| `4:5` |
| `fps`, `durationInFrames`, `width`, `height` | the composition geometry |
| `showEndCard` | whether the branded end card plays |
| `audio` | the customer's audio track (`{url, name}`) or `null` |
| `remotionDesignId?` | **Phase 1** — the selected registry design id (optional, additive) |
| `remotionDesignProps?` | **Phase 1** — the customer's edits to that design (optional, additive) |

`buildPreviewInput` copies `previewSettings` into `inputProps.settings` verbatim, maps the customer's business data into `inputProps.brand`, and (Phase 1) resolves the selected design's prop bag through `buildDesignProps()` in `guided/designProps.ts`.

### The overlay / pill system

- The five layout presets are **not** layout code: they are *presets* that populate `settings.layers`. `setPreviewLayout(id)` replaces the layer stack with the preset's layers; the customer then edits those layers.
- Each layer is drawn by `PersonalizationComposition` as an `AbsoluteFill` positioned with `toBox(layer, compW, compH)` — a normalised 0..1 box converted into pixels for the current composition size.
- The **pill** is the CTA layer: `layer.kind === 'cta'` renders a `<span>` with `borderRadius: 999`, the brand accent as background and `#041014` as the text colour. The "pill-shaped options" the brief refers to in the UI are the *chip rows* (`chipStyle`) used for the layout presets, the aspect ratio, the fps, the end-card toggle and — Phase 1 — the design picker; `PREVIEW_LAYOUTS`, `LAYOUT_IDS` and the `PreviewLayoutId` union are unchanged.

### The Remotion Player

`BeforeAfterPreview` (`src/shared/personalization/preview/BeforeAfterPreview.tsx`) mounts **two** `PersonalizationPlayer`s (via `@remotion/player` 4.0.499) — the "before" pane and the "after" pane — and keeps them frame-synchronised (`seekTo` + the `frameupdate` event). The "before" pane is built by `buildBeforeInputProps()`, which hides every overlay layer and (Phase 1) also clears `remotionDesignId`/`remotionDesignProps`, so the before pane always shows the untouched original.

Both panes render the **same** component, `PersonalizationComposition` (`src/shared/personalization/preview/PersonalizationComposition.tsx`), which:

1. renders the background — `<Video src>` from `@remotion/media` (or `<Img>` for an image source), with a poster fallback and a media-failure channel;
2. renders the customer's audio track (`<Audio src>`);
3. renders the dim layer (`brandColors.backgroundDim`) — skipped for a full-frame design;
4. **(Phase 1)** renders the selected design through `RemotionDesignLayer` — and, when a design is selected, **replaces** the built-in layer stack and the end card, exactly as the browser export does;
5. otherwise renders the built-in layers and the end card `<Sequence>`.

The whole tree is wrapped in `Internals.SequenceManager.Provider value={NOOP_SEQUENCE_MANAGER}` — the no-op shim that lets `<Sequence>`-based templates render in the browser path.

### The browser export path

```
provider.createFinalVideo()                                   (DemoPersonalizeProvider.tsx)
   └─ await import('./webExport')                             (renderer kept out of the main bundle)
        └─ registerPersonalizationRemotionDesigns()           (Phase 1: registry → export seam)
        └─ exportPersonalizedVideo({ inputProps, design? , onProgress, signal })
             ├─ resolveDesignSelection(design)                (Phase 1; rejects unknown / preview-only)
             ├─ buildRemotionDesignExportPlan(...)            (Phase 1: component, size, duration, props)
             ├─ loadWebRenderer() → @remotion/web-renderer
             ├─ detectCodecSupport() / chooseWebExportProfile()
             ├─ canRenderMediaOnWeb()                         (capability check BEFORE any frame)
             └─ renderMediaOnWeb({ composition, inputProps, container, videoCodec, audioCodec, muted, signal })
                   └─ result.getBlob() → Blob → downloadWebExportBlob()
```

Without a design this path is **byte-for-byte the path it always was**: the composition handed to the renderer is still `PersonalizationComposition` with the approved `inputProps` as both `defaultProps` and `inputProps`, and the codec/container profile is untouched (asserted by the regression test *"keeps the codec/container profile identical without a design"*).

### Data flow (text diagram)

```
 customer data            provider state                 preview                     export
 ─────────────            ──────────────                 ───────                     ──────
 clientForm  ─┐
              ├─► buildPreviewInput() ─► PreviewInputProps ─► <Player> ─► frame
 assets       ─┤        ▲                   { videoUrl,          (Remotion)      │
 preview      ─┤        │                     posterUrl,              │            │
  Settings   ─┘        │                     settings,               │            │
   (layers,             │                     brand,                 ▼            │
    brandColors,        │                     remotionDesignId? }  Personalization  │
    aspect, fps,        │                              │        Composition       │
    duration,           │                              │             │             │
    remotionDesignId?,  │                     resolveRemotionDesignProps()        │
    remotionDesignProps?)│                     + designProps.ts derivation          │
                         │                              │                            │
                         └──────────────────────────────┘                            │
                                                                                    ▼
                                                              @remotion/web-renderer
                                                              renderMediaOnWeb() → Blob
```

---

## 3. Existing functionality preserved

Everything below was **not** changed, or was changed in an additive, backward-compatible way only:

| Area | Status |
|---|---|
| **Step 1** (`StepFindBusiness`) | untouched — file not modified |
| **Step 2** (`StepChooseVideo`) | untouched by Phase 1 — file not modified (it was changed by the sibling demo-library work, in a different commit) |
| **Step 3** (`StepPersonalize`) | untouched — file not modified |
| Wizard layout / step chrome | untouched — `SimpleModeWizard.tsx` not modified; the four steps and their order are unchanged |
| The existing pill-shaped options | untouched — `PREVIEW_LAYOUTS`, `LAYOUT_IDS` and the `PreviewLayoutId` union are unchanged; the five layout pills still render in Step 4 with the same `chipStyle` |
| Remotion Player and Composition behaviour **when no design is selected** | unchanged — with `remotionDesignId` absent the composition renders the identical layer stack, dim layer and end card. Covered by *"keeps the previous behaviour when no design is selected"* and *"leaves the input props untouched when no design is selected"* |
| Drag-and-drop editing | untouched — `OverlayEditor` and `overlayGeometry` are not modified by Phase 1 |
| Asset upload | untouched — `assetUploadService.ts` not modified |
| AI image editing | untouched — `PersonalizationImageEditing` path not modified |
| `OverlayEditor` | untouched — file not modified; it still edits the built-in layer stack |
| `overlayGeometry` | untouched — file not modified |
| `finalOutput` | untouched — `chooseWebExportProfile` / `chooseFinalOutputPath` / `PERSONALIZATION_COMPOSITION_ID` are unchanged; the export engine calls the same helpers as before |
| `preview/types.ts` | **only optional fields added**: `PreviewRemotionDesignId` (type alias), `PreviewLayer.remotionDesignId?`, `PreviewLayer.designProps?`, `PersonalizationPreviewSettings.remotionDesignId?`, `PersonalizationPreviewSettings.remotionDesignProps?`, `PreviewInputProps.remotionDesignId?`, `PreviewInputProps.remotionDesignProps?`. No existing field changed type or meaning |
| `src/access/**` | untouched — not modified |
| `src/apps/**` | only `src/apps/thumbnail-studio/ThumbnailStudio.tsx` was touched, and only to add the "Personalize with AI" button (§7) |
| `packages/studio/**` | untouched — the `@/` alias blocker is documented, not worked around in code (§7, §11) |
| `src/shared/personalization/preview/presets.ts` | additive only — a `normalizeDesignProps()` helper and a branch in `normalizePreviewSettings()` that restores the selected design and the customer's edits. The default settings and every existing normalisation branch are unchanged |
| `src/shared/personalization/preview/BeforeAfterPreview.tsx` | 4 added lines — the "before" pane now also drops the design |
| `src/shared/personalization/DemoPersonalizeProvider.tsx` | additive only — `onComplete` on `OpenPersonalizeOptions`, `setPreviewDesign`, `updatePreviewDesignProps`, the design-aware export call, and the one-line registry registration. Every pre-existing entry point keeps working exactly as before |

---

## 4. Inventory of the three template repositories

Source document: **`docs/REMOTION_TEMPLATE_INVENTORY.md`** (690 lines, this repository). It is an exhaustive, read-only inventory: **no template source, asset, font or configuration file was copied into this repository at that stage** (§15 of the inventory).

### Per-repository counts

| # | Source repository | Entries | Slugs unique to it | Licence | Usable |
|---|---|---:|---:|---|---:|
| 1 | `remotion-templates` (React Video Editor / RVE) | **81** | 67 | MIT **asserted in the README only — there is no `LICENSE` file in the repository** | **61** |
| 2 | `free-remotion-templates` (RenderComp / Trimora Inc.) | **50** | 36 | `MIT License` / `Copyright (c) 2026 Trimora Inc.` — a real `LICENSE` file, plus SPDX headers on every source file | **50** |
| 3 | `remotion-video-templates` (Alejandro Brito) | **7** | 7 | `MIT License` / `Copyright (c) 2026 Alejandro Brito` | **7** |
| — | **Total before deduplication** | **138** | | | **118** |
| — | **Total after cross-repo deduplication** | **124** | | | **118** |
| — | React Video Editor gallery (reference only, in no repository) | 14 | 14 | `tier: "pro"` — source withheld by the vendor | **0** |

**138** template entries were enumerated (matching the expected "~138"), **124** remain after cross-repo deduplication, and **118** are usable in this product.

### The 14 slug collisions

These slugs exist in **both** repo 1 and repo 2. They are **different implementations by different authors under different licences**, not copies:

`bokeh-circles`, `camera-shake`, `chapter-title`, `end-card`, `glitch-text`, `logo-blur-reveal`, `logo-bounce-drop`, `logo-split-reveal`, `logo-stroke-draw`, `parallax-pan`, `slide-wipe`, `split-screen`, `starfield`, `whip-pan`

Repo 3 shares none. The inventory recommends **repo 2's version as canonical** for every collision, because repo 2's components are typed, prop-driven and resolution-adaptive while repo 1's are zero-prop (§11.1, §14.1).

### Licence status

- **Repo 1** — MIT is asserted *only* in prose in the README (*"All templates in this repository are available under the MIT License … attribution is appreciated where applicable"*); there is **no `LICENSE`/`LICENSE.md`/`COPYING` file anywhere in the repository**. Every template file carries the per-file header *"Free Remotion Template Component … Credit appreciated but not required. Created by the team at https://www.reactvideoeditor.com"*. This is a **documentation** gap, not a blocker — and it is the *only* licence record for repo 1, which is why the attribution is carried forward verbatim in the adapted sources and in `registry.ts`.
- **Repo 2** — `MIT License` / `Copyright (c) 2026 Trimora Inc.`, with a real `LICENSE` file, `// SPDX-License-Identifier: MIT` on every file, and `ASSETS.md` declaring 0 fonts / 0 images / 0 audio / 0 video bundled.
- **Repo 3** — `MIT License` / `Copyright (c) 2026 Alejandro Brito`, with a real `LICENSE` file. `public/*.svg` are original (MIT). **Inter is fetched at render time from Google Fonts (OFL) and is not redistributed.**

All three are MIT-family and therefore compatible with this repository's own MIT licence. No Apache-licensed or copyleft content was found.

### Premium-tier exclusions

- **6 repo-1 templates are blocked** because the vendor's own catalogue marks them `tier: "pro"` and withholds their source: `area-chart`, `chart-animation`, `comparison-chart`, `donut-chart`, `progress-bars`, `stat-counter`. They are present in repo 1 with full source, but they are **paid content** and must not be imported into an MIT product.
- **14 further gallery-only Pro templates** are not present in any repository at all (`bar-chart-race`, `candlestick-chart`, `multi-line-chart`, `radar-chart`, `gauge-meter`, `stacked-bar-chart`, `bubble-chart`, `waterfall-chart`, `kpi-dashboard`, `heatmap-grid`, `coverflow-carousel`, `toast-stack`, `onboarding-steps`, `animated-leaderboard`). Their source is withheld; they are out of scope.
- The gallery's MCP endpoint is a **paid service** and must not be wired into this repository.

### Templates judged unusable (and the reasons)

| Template(s) | Reason |
|---|---|
| `ken-burns`, `parallax-pan`, `zoom-pulse` (repo 1) | **CSS `@keyframes` are not frame-accurate** — they run on wall-clock time, so the output is non-deterministic between preview and export. Two of them also use `next/image` with a remote Pexels/Unsplash URL. They also replace the frame rather than overlay it |
| `LogoIntro`, `PromoTemplate` (repo 3) | **`staticFile()` has no browser `public/` directory** — the browser export path has no Remotion bundler, so `staticFile()` cannot resolve. `PromoTemplate` additionally needs `@remotion/transitions` and nests `Sequence`s |
| All 7 repo-3 templates | **`@remotion/google-fonts` fetches Inter from Google Fonts at render time** — a third-party network call inside a product whose export is otherwise 100% local. The fix is to substitute this repository's own `fontStackById()` |
| 78 of 81 repo-1 templates | **zero props** — copy, colour and geometry are hardcoded (e.g. `lower-third.tsx` literally contains `"John Smith"` / `"Senior Producer"`). They cannot be driven by a personalization flow without being rewritten |
| 69 of 81 repo-1 templates | **16:9-only in practice** — hardcoded pixels and `rem` units tuned for 1920×1080, which misposition at the 9:16 / 1:1 / 4:5 outputs this product offers |
| All 57 repo-2 + repo-3 templates | **not overlay-capable as shipped** — every one paints an opaque `AbsoluteFill` background. A mechanical background removal is required to place them over a customer's footage |
| `lower-third-glass-card` | `backdrop-filter: blur(14px)` is **lost in canvas compositing** — the glass degrades to a flat translucent panel (fidelity caveat, not a blocker) |
| `community-chat`, `flip-page-transition`, `social-reel`, `KineticText`, `PromoTemplate` | use `<Sequence>`, which throws without a `SequenceManager` provider — this repository's `NOOP_SEQUENCE_MANAGER` shim covers it, but the template must be rendered as a descendant of it |

### Remotion version compatibility

| Where | Remotion |
|---|---|
| **This repository** | `4.0.499` (`remotion`, `@remotion/player`, `@remotion/web-renderer`, `@remotion/media` — all pinned in the root `package.json`) |
| Repo 1 | unpinned (no `package.json` at all) |
| Repo 2 | `4.0.518` |
| Repo 3 | `4.0.200` |

**All usable templates work without a version bump.** Remotion's public component API is stable across `4.0.200 → 4.0.499 → 4.0.518`; the API surface the templates use (`useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`, `random`, `AbsoluteFill`, `Sequence`, `Series`, `Img`) is all present in `4.0.499`. The hard rule encoded in the integration: **every `remotion` / `@remotion/*` package in this repository stays at `4.0.499`**; template **source** is lifted, never the source repository's `package.json` (two Remotion copies in one bundle is the classic cause of "Cannot read properties of undefined (reading 'useCurrentFrame')").

---

## 5. Registry and file structure implemented

### File tree

```
docs/
  REMOTION_TEMPLATE_INVENTORY.md          (new — 690-line upstream inventory)
  PERSONALIZATION_ENTRY_POINT.md          (new — studio entry-point contract)

src/shared/personalization/
  remotion/                                (new — the design catalogue)
    index.ts                              public surface (re-exports tokens, registry, designs)
    registry.ts                           the typed catalogue + lookup helpers
    designTokens.ts                       shared font stack, scale() and withAlpha()
    designs/
      bounce-in-headline.tsx
      logo-mask-wipe.tsx
      lower-third-glass-card.tsx
      social-reel.tsx
      particle-explosion.tsx
    __tests__/
      registry.test.ts                    (11 tests)
      designs.render.test.tsx             (5 tests)
  remotionExportRegistry.ts               (new — closes the registry → export-engine seam)
  entryPoint.ts                           (new — the studio entry-point contract)
  webExport.ts                            (modified — design option, registry seam, calculateMetadata)
  preview/types.ts                        (modified — optional fields only)
  preview/PersonalizationComposition.tsx  (modified — renders the selected design)
  preview/BeforeAfterPreview.tsx           (modified — the before pane drops the design)
  preview/presets.ts                      (modified — restores the design selection)
  guided/RemotionDesignPicker.tsx         (new — the Step 4 picker)
  guided/designProps.ts                   (new — business data → design props)
  guided/StepPreviewApprove.tsx           (modified — renders the picker)
  guided/buildPreviewInput.ts             (modified — carries the design into the input props)
  DemoPersonalizeProvider.tsx             (modified — setPreviewDesign / updatePreviewDesignProps / export)
  index.ts                                (modified — re-exports the contract)
  demoSources.ts                          (modified — two helpers made exportable)

src/apps/thumbnail-studio/ThumbnailStudio.tsx   (modified — the representative studio integration)

src/shared/personalization/__tests__/
  entryPoint.test.ts                      (new — 24 tests)
  webExport.design.test.ts                (new — 25 tests)
  remotionDesigns.browser.test.tsx        (new — 24 tests, real Remotion runtime)
src/shared/personalization/guided/__tests__/
  remotionDesigns.test.tsx                (new — 22 tests)
  remotionDesignExport.test.ts            (new — 3 tests)
```

### The `RemotionDesign` contract

`src/shared/personalization/remotion/registry.ts` defines one typed record per design. Every field and what it enables:

| Field | Type | What it enables |
|---|---|---|
| `id` | `RemotionDesignId` | the stable key used by the picker, the persisted settings, the export engine and the composition id. A closed union of the five known ids |
| `name` | `string` | the label on the design pill and in error messages |
| `category` | `'headline' \| 'logo' \| 'lower-third' \| 'cta' \| 'effect'` | groups the catalogue; `getRemotionDesignsByCategory()` |
| `source` | `{ repo, file, license, attribution? }` | **provenance**: the upstream repository, the exact upstream file, the SPDX-style licence and the human-readable attribution line that is also repeated in the adapted source file header |
| `component` | `React.FC<RemotionDesignProps>` | the adapted component, mounted by the player, the composition and the export engine |
| `defaultProps` | `Record<string, unknown>` | the props the design renders correctly with **alone** — a design never needs a caller to supply anything |
| `editableText` | `string[]` | which props carry editable copy → the picker renders a textarea for each, and the business-data derivation may fill them |
| `brandColorProps` | `string[]` | which props carry a brand colour → the picker renders a colour input for each, and the derivation fills them from `brandColors` |
| `brandAssetProps` | `string[]` | which props carry a customer asset (e.g. `logoImageUrl`) → the derivation fills them from the customer's own logo |
| `durationInFrames` | `number` | the design's own length — used by the export plan and the player |
| `placement` | `'full-frame' \| 'overlay'` | **`full-frame` replaces the frame; `overlay` composites transparently over the customer's footage.** This one field decides what sits under the design in both the preview and the export |
| `aspectRatios` | `string[]` | the ratios the design is verified to lay out in — drives the exported pixel size |
| `requiredMedia` | `RemotionDesignRequiredMedia[]` | each slot: `name`, `kind` (`logo`/`image`/`video`/`font`), `required`, `suppliedBy` (the props that can fill it), `fallback` (`inline-art` / `prop-default` / `system-font` / `none`) — so a consumer can always answer "what happens if the customer supplies nothing?" |
| `exportCapable` | `boolean` | `false` means preview-only. The export engine **refuses** such a design with `reason: 'unsupported-design'` rather than silently producing something other than what the customer approved |
| `notes?` | `string` | the fidelity caveats and usage hints shown in the picker |

Helpers: `getRemotionDesign(id)`, `getRemotionDesignsByCategory()`, `getRemotionDesignsByPlacement()`, `isRemotionDesignId()`, `resolveRemotionDesignProps(id, overrides)` (merges overrides over the defaults, **ignoring keys the design does not declare**), plus `REMOTION_DESIGN_IDS` and `REMOTION_DESIGN_ASPECT_RATIOS` (`16:9`, `9:16`, `1:1`, `4:5`).

### The backward-compatible `preview/types.ts` additions

Every addition is **optional**, so a project persisted by an older build (or by a newer build) round-trips unchanged:

- `PreviewRemotionDesignId = RemotionDesignId | (string & {})` — keeps editor autocomplete for the known ids while still accepting any string, so a document written by a newer build is not rejected. The value is resolved against the registry with `getRemotionDesign()`; an unknown id simply renders no design.
- `PreviewLayer.remotionDesignId?` and `PreviewLayer.designProps?` — per-layer design hook.
- `PersonalizationPreviewSettings.remotionDesignId?` and `.remotionDesignProps?` — the Step 4 selection plus the customer's edits.
- `PreviewInputProps.remotionDesignId?` and `.remotionDesignProps?` — what the composition and the export consume.

### The `webExport.ts` additions

| Addition | Detail |
|---|---|
| `WebExportOptions.design?` | `RemotionDesignSelection` — either `{ id, props? }` (resolved through the registry) **or** a full design record handed over directly. Omit it and the export behaves exactly as it always did |
| `WebExportOptions.designResolver?` | lets a caller override the id lookup for a single call |
| `WebExportOptions.calculateMetadata?` | dynamic composition metadata, forwarded to the renderer |
| `registerRemotionDesign(design)` / `registerRemotionDesigns(designs)` / `getRegisteredRemotionDesign(id)` / `clearRegisteredRemotionDesigns()` | a small, replaceable **seam**: `webExport.ts` does not import the registry, so the two sides stay decoupled. `remotionExportRegistry.ts` closes the seam once, idempotently |
| `exportCapable` guard | `resolveDesignSelection()` rejects a design that is not `exportCapable` with `reason: 'unsupported-design'` and the message *"… is preview-only and cannot be exported to a video."* — **before the renderer is even loaded** |
| `buildRemotionDesignExportPlan()` | returns `{ compositionId, component, width, height, durationInFrames, props, placement, compositesSourceVideo }` — the exact plan the renderer is handed |
| `createDesignExportComponent()` | the wrapper the renderer mounts. For an **`overlay`** design it renders the customer's source video (or its poster) as the background layer; for a **`full-frame`** design it renders nothing underneath. The customer's audio track is kept in **both** placements. The wrapper installs the same no-op `SequenceManager` shim the composition uses, and the source media is closed over rather than passed as a prop, so the design's prop bag stays exactly `defaultProps + overrides` |
| `calculateMetadata` forwarding | `options.calculateMetadata ?? design?.calculateMetadata` is attached to the composition object; when neither exists the key is **omitted entirely** |
| Placement handling | `remotionDesignAspectRatio()` (the preview's ratio when the design supports it, otherwise the first the design declares), `canonicalDimensionsForAspectRatio()` (short side at 1080 → 16:9 = 1920×1080, 9:16 = 1080×1920, 1:1 = 1080×1080, 4:5 = 1080×1350), `remotionDesignDimensions()` (keeps the preview's own pixel size when the design supports the preview's ratio) and `evenDimension()` (h264 needs even dimensions) |
| `unsupported-design` | added to `WebExportFailureReason` |

---

## 6. The five templates integrated and verified

### 6.1 `bounce-in-headline`

| Field | Value |
|---|---|
| id | `bounce-in-headline` |
| name | Bounce In Headline |
| category | `headline` |
| source repo + file | `https://github.com/deangilmoreremix/free-remotion-templates` → `src/components/bounce-in-headline/BounceInHeadline.tsx` |
| licence | MIT — `Copyright (c) 2026 Trimora Inc.` (upstream `LICENSE` file; SPDX header retained in the adapted file) |
| placement | `full-frame` (paints `background`, so it replaces the footage) |
| duration | 120 frames @ 30 fps = **4.00 s** |
| aspect ratios | `16:9`, `9:16`, `1:1`, `4:5` |
| editable text props | `headline` |
| brand colour props | `background`, `color` |
| required media | one optional `font` slot (`sans-serif`, supplied by `fontFamily`, fallback `system-font`) |
| adapted for | the fixed 130 px headline is re-derived from the composition height and the bounce height is scaled by the same factor, so the design holds its proportions at all four ratios; the upstream system font stack is kept verbatim (no network font); **no `staticFile()`, no CSS `@keyframes`, no `<Sequence>`**; the upstream `FONT_SANS` stack is byte-identical |
| verified by | `registry.test.ts` (declared props, placement, defaults), `designs.render.test.tsx` (mounts, paints an opaque background, renders the editable copy), `remotionDesigns.browser.test.tsx` (real Remotion runtime + export plan), and a **real browser encode**: `out-bounce-in-headline.webm` — 255,775 bytes, WebM, VP8 1920×1080 + Opus 48 kHz stereo, 4.00 s |

### 6.2 `logo-mask-wipe`

| Field | Value |
|---|---|
| id | `logo-mask-wipe` |
| name | Logo Mask Wipe |
| category | `logo` |
| source repo + file | `https://github.com/deangilmoreremix/free-remotion-templates` → `src/components/logo-mask-wipe/LogoMaskWipe.tsx` |
| licence | MIT — `Copyright (c) 2026 Trimora Inc.` |
| placement | `full-frame` (paints `backgroundColor`) |
| duration | 100 frames @ 30 fps = **3.33 s** |
| aspect ratios | `16:9`, `9:16`, `1:1`, `4:5` |
| editable text props | `monogram`, `brandText` |
| brand colour props | `backgroundColor`, `accentColor`, `textColor` |
| required media | `monogram` (kind `logo`, optional, supplied by the `monogram` prop, fallback `prop-default`); `brand-logo` (kind `logo`, optional, supplied by `logoImageUrl`, fallback `inline-art` — the design draws the monogram itself); `sans-serif` (kind `font`, optional, fallback `system-font`) |
| adapted for | the exit fade is driven by a `durationInFrames` prop instead of an upstream module constant; the SVG `clipPath` id is made **unique per instance** (the before/after preview mounts two players on one page, and duplicate ids would make the second wipe resolve against the first); the accent glow is built with `withAlpha()` instead of the upstream `accentColor + '22'` hex suffix, so a non-hex brand colour cannot invalidate the whole `background` shorthand; an **optional `logoImageUrl`** lets the customer's own raster logo replace the inline SVG monogram — it must be an absolute URL, because the browser export path has no `public/` directory and therefore no `staticFile()`; the upstream font stack is kept verbatim; **no `staticFile()`, no CSS `@keyframes`, no `<Sequence>`** |
| verified by | the same four layers, plus a **real browser encode**: `out-logo-mask-wipe.webm` — 1,036,097 bytes, WebM, VP8 1920×1080 + Opus 48 kHz stereo, 3.32 s. The decoded frames show the lockup (mean luminance rises 6 → 20, ~800 distinct colour buckets, peak luminance 251) |

### 6.3 `lower-third-glass-card`

| Field | Value |
|---|---|
| id | `lower-third-glass-card` |
| name | Lower Third Glass Card |
| category | `lower-third` |
| source repo + file | `https://github.com/deangilmoreremix/free-remotion-templates` → `src/components/lower-third-glass-card/LowerThirdGlassCard.tsx` |
| licence | MIT — `Copyright (c) 2026 Trimora Inc.` |
| placement | **`overlay`** — transparent, composites over the customer's footage |
| duration | 120 frames @ 30 fps = **4.00 s** |
| aspect ratios | `16:9`, `9:16`, `1:1`, `4:5` |
| editable text props | `nameText`, `titleText` |
| brand colour props | `backgroundColor`, `accentColor`, `textColor` |
| required media | one optional `font` slot (`sans-serif`, fallback `system-font`) |
| adapted for | **the upstream full-frame `AbsoluteFill` background and the ambient radial wash were removed** so the design composites over the footage; `backgroundColor` now tints the card itself, because the canvas renderer drops the frosted-glass `backdrop-filter` (there is no backdrop to blur) and the panel would otherwise be illegible over arbitrary footage — the `backdrop-filter` is kept for the in-browser preview; the exit fade is driven by a `durationInFrames` prop; the name and title are clipped with an ellipsis so a long personalised name cannot spill out of the card; the upstream font stack is kept verbatim; **no `staticFile()`, no CSS `@keyframes`, no `<Sequence>`** |
| verified by | the same four layers, plus the **real-encode proof in §6.7** — this is the design that was encoded over the customer's actual video |

### 6.4 `social-reel`

| Field | Value |
|---|---|
| id | `social-reel` |
| name | Social Reel Promo |
| category | `cta` |
| source repo + file | `https://github.com/deangilmoreremix/free-remotion-templates` → `src/components/social-reel/SocialReel.tsx` |
| licence | MIT — `Copyright (c) 2026 Trimora Inc.` |
| placement | `full-frame` (paints the stage and the player gradient) |
| duration | 150 frames @ 30 fps = **5.00 s** |
| aspect ratios | `16:9`, `9:16`, `1:1`, `4:5` |
| editable text props | `brandName`, `handle`, `headline`, `headlineAccent`, `secondCopy`, `infoLines`, `ctaText`, `caption` |
| brand colour props | `accentColor`, `bgFrom`, `bgVia`, `bgTo` |
| required media | one optional `font` slot (`sans-serif`, fallback `system-font`) |
| adapted for | the upstream hardcodes a 1920×1080 stage with a 608×1080 phone mock-up — both are now derived from the composition size and every internal pixel value is scaled by the same factor, so the design keeps its proportions at all four ratios; the Ken-Burns zoom and the progress bar are driven by a `durationInFrames` prop; the upstream font stack is kept verbatim; **no `staticFile()`, no CSS `@keyframes`**; `<Sequence>` is used exactly as upstream for the progressive reveal, so the design **must** be rendered as a descendant of the no-op `SequenceManager` provider (which the composition and the export wrapper both supply) |
| verified by | the same four layers, plus a **real browser encode**: `out-social-reel.webm` — 812,184 bytes, WebM, VP8 1920×1080 + Opus 48 kHz stereo, 5.00 s; and the frame-accurate scene assertions in `designs.render.test.tsx` and the browser suite (scene 1 at frame 0, scene 3 at frame 100) |

### 6.5 `particle-explosion`

| Field | Value |
|---|---|
| id | `particle-explosion` |
| name | Particle Explosion |
| category | `effect` |
| source repo + file | `https://github.com/deangilmoreremix/remotion-templates` → `templates/particle-explosion.tsx` |
| licence | MIT **per the upstream README — that repository ships no `LICENSE` file.** Attribution: *"Credit appreciated but not required. Created by the team at https://www.reactvideoeditor.com"* |
| placement | **`overlay`** — the upstream root already painted no background, so the effect composites cleanly over the footage |
| duration | 90 frames @ 30 fps = **3.00 s** |
| aspect ratios | `16:9`, `9:16`, `1:1`, `4:5` |
| editable text props | `text` |
| brand colour props | `color` |
| required media | one optional `font` slot (`sans-serif`, fallback `system-font`) |
| adapted for | the hardcoded `"BOOM!"` word became an **optional `text` prop that defaults to empty**, so the design is a pure effect unless the caller asks for a word; the particle count, burst length and burst origin became props; the particle size is derived from the composition height; the **seeded PRNG (`random(i)`) is kept**, so the burst stays deterministic and frame-accurate across renders; the root stays transparent; **no `staticFile()`, no CSS `@keyframes`, no `<Sequence>`, no network fonts** |
| verified by | the same four layers, plus a **real browser encode**: `out-particle-explosion.webm` — 977,897 bytes, WebM, VP8 1920×1080 + Opus 48 kHz stereo, 3.00 s; the decoded frames show the burst fading over its 90 frames (peak luminance 255, ~1.9 % non-black pixels, decaying to 0.89 % at t = 3.0 s) |

### 6.6 Verification layers (all four)

1. **Registry contract** — `src/shared/personalization/remotion/__tests__/registry.test.ts` (11 tests): exactly five designs, unique ids, an MIT-family licence with upstream attribution on every design, every `requiredMedia` slot satisfiable, the placement of every design declared (and the two overlays marked), non-empty default props, a complete description per design, only advertised props declared, lookup by id and by category, the id type guard, and prop merging that ignores unknown keys.
2. **Render** — `src/shared/personalization/remotion/__tests__/designs.render.test.tsx` (5 tests): every design mounts with its default props; the overlays stay transparent while the full-frame designs paint a background; the editable copy of the headline and the lower third is rendered; the particle burst draws with no opaque backdrop; the social reel reveals its scenes on the expected frames.
3. **Real Remotion runtime + export chain** — `src/shared/personalization/__tests__/remotionDesigns.browser.test.tsx` (24 tests): every design is mounted through the **real** `@remotion/player` 4.0.499 (not a stub) and the assertions read Remotion's own output — a non-blank DOM, an **opaque** background for a full-frame design and **none** for an overlay (measured from the inline styles Remotion actually produced), every editable copy value present in the rendered text (sampled across the duration, because the social reel reveals copy through `<Sequence>`), and the design's own `durationInFrames` proven by the player's last-frame clamp plus `seekTo`/`frameupdate` advancement. The suite then verifies the export plan for all five designs, the **exact composition object handed to the renderer**, the plan's component rendering in the real runtime, the customer's audio surviving in **both** placements, the `exportCapable`/unknown-id rejections happening *before* the renderer is loaded, `calculateMetadata` forwarding (including a read of the **installed** `@remotion/web-renderer` source and Remotion's own `resolveVideoConfig()`), and the no-op `SequenceManager` shim being both load-bearing and effective.
4. **Real browser + real encode** — §6.7.

### 6.7 Real-browser and real-encode results

A verification harness (kept in the system temp directory, **not** committed) served the repository's real components to a real headless Chrome, mounted them through the real Remotion runtime and drove the real `@remotion/web-renderer` to produce actual files. The artifacts were then inspected independently.

**Containers and codecs (measured with `mediabunny` 1.50.8, the same library the web-renderer muxes with):**

| Artifact | Bytes | Container | Video track | Audio track | Duration |
|---|---:|---|---|---|---:|
| `out-bounce-in-headline.webm` | 255,775 | WebM (EBML magic `1a45dfa3`) | VP8, 1920×1080 | Opus, 48 kHz, stereo | 4.00 s |
| `out-logo-mask-wipe.webm` | 1,036,097 | WebM | VP8, 1920×1080 | Opus, 48 kHz, stereo | 3.32 s |
| `out-lower-third-glass-card.webm` | 1,890,231 | WebM | VP8, 1920×1080 | Opus, 48 kHz, stereo | 4.00 s |
| `out-lower-third-glass-card-mp4.mp4` | 1,608,650 | MP4 | **AVC (H.264)**, 1920×1080 | **AAC**, 48 kHz, stereo | 4.07 s |
| `out-particle-explosion.webm` | 977,897 | WebM | VP8, 1920×1080 | Opus, 48 kHz, stereo | 3.00 s |
| `out-social-reel.webm` | 812,184 | WebM | VP8, 1920×1080 | Opus, 48 kHz, stereo | 5.00 s |

Every file's duration equals the design's own duration (4.00 / 3.33 / 4.00 / 3.00 / 5.00 s) — the export runs the **design's** duration, not the customer's.

**The decoded-frame proof that an overlay design composites over the customer's actual video** (`lower-third-glass-card`, the overlay design, encoded over the repository's real sample footage `public/academy/13-ai-tools-mastery/templates/examples/tools-workflow-motion.mp4`):

The exported frames were decoded back in a browser (`<video>` → `seek` → `drawImage` → `getImageData`) and compared with the **same frame of the customer's source video** on a normalised 16×9 grid of per-cell mean RGB:

| Timestamp | Source | Export | Cells identical to the source | Cells changed > 12 (card region) | Cells changed > 12 (rest of the frame) |
|---:|---|---|---:|---:|---:|
| 0.5 s | 1280×720 | 1920×1080 | 4 / 144 | **21 / 24** | **0 / 120** |
| 1.0 s | 1280×720 | 1920×1080 | 6 / 144 | **22 / 24** | **0 / 120** |
| 2.0 s | 1280×720 | 1920×1080 | 7 / 144 | **22 / 24** | **0 / 120** |
| 3.0 s | 1280×720 | 1920×1080 | 12 / 144 | **23 / 24** | **0 / 120** |

Reading: **the only pixels that differ from the customer's footage are the ones the design draws.** Not one of the 120 cells outside the lower-third card region changed by more than 12 (summed over RGB) at any of the four sampled timestamps, while 21–23 of the 24 cells inside the card region (bottom-left, where the design's card sits) did. The exported frame's overall mean tracked the source frame's mean at every timestamp (e.g. 131/144/156 vs 140/151/162 at t = 0.5 s), and the WebM and the MP4 encode of the same design differ by 1–2 per channel — the same picture in both containers.

**The honest limits of this evidence — stated plainly:**

1. **The app's own `exportPersonalizedVideo()` wrapper was never observed returning a real `Blob` in a browser.** The two halves are each proven — the *wrapper→plan* half by the unit suite (the exact composition object handed to the renderer) and the *renderer→file* half by the real encode above — but the **joining call** (the app's wrapper driving the real renderer and returning a Blob through the app's own code path) was not observed end-to-end in a browser. The real encode drove `renderMediaOnWeb()` directly with the plan the wrapper produces.
2. **Audio content was not waveform-verified.** Every file carries an audio track (Opus / AAC, 48 kHz, stereo), but the samples were not decoded and compared against the customer's track, so "the audio is the customer's music" is not proven by the encode — only "an audio track is present and survives in both placements" (which the unit suite asserts by inspecting the composition's media layer).
3. **Only one design was encoded to MP4** (`lower-third-glass-card`, H.264/AAC). The other four were encoded to WebM/VP8/Opus only. The other four MP4s are not proven.
4. **The `particle-explosion` encode was produced without a source video**: its decoded frames are the burst over black, not over the footage. The overlay-over-footage proof is therefore specific to `lower-third-glass-card`.
5. **No licence key was supplied** to the Remotion runtime. The designs are used under the upstream MIT terms, and the attribution lines are carried in the adapted source headers and in `registry.ts`; the runtime's own licence acknowledgement was not exercised in the encode harness.
6. The encode harness and its artifacts live in the system temp directory and are **not committed**; re-running them is described in §12.

---

## 7. Shared modal integration interface

Contract document: **`docs/PERSONALIZATION_ENTRY_POINT.md`**. Contract module: **`src/shared/personalization/entryPoint.ts`** (pure, no React). Tests: **`src/shared/personalization/__tests__/entryPoint.test.ts`** (24 tests).

### The `PersonalizationEntryPoint` contract

```ts
export interface PersonalizationEntryPoint {
  originatingStudio: string            // which studio opened it
  projectRef?: string                  // project identifier
  sourceVideo?: string                 // source video URL
  sourceImage?: string                 // source image URL (or a video's poster still)
  mediaType: 'video' | 'image' | 'prompt-only'
  aspectRatio?: string                 // e.g. '16:9'
  durationSeconds?: number
  brandAssets?: { logoUrl?, brandName?, brandColors? }
  prompt?: string                      // a prompt the studio already has
  title?: string                       // modal header title
  model?: string
  modelName?: string
  access?: 'anonymous' | 'authenticated'   // defaults to 'authenticated'
  onComplete?: (result: PersonalizationResult) => void
}
```

`PersonalizationResult` **is** the provider's own `GenerationResult` — there is exactly one result type in the system.

### The adapter helpers

| Helper | What it does |
|---|---|
| `toPersonalizationOpenRequest(entry)` | maps the contract onto the `PersonalizationSource` the provider already accepts. Guarantees: **no substitution** (a `video` entry point uses its own `sourceVideo`, an `image` entry point its own `sourceImage`), **no fabrication** (`aspectRatio`, `duration` and `model` stay `undefined` when the studio does not declare them; `durationLabel` is `"<n>s"`), **no substituted media** (a video entry point with no playable video keeps `sourceMedia: null` and is flagged with the shared `MEDIA_PENDING_KEY`, so the modal shows an actionable message instead of a broken player), **stable identity** (the source id is `<studio>:<projectRef>`, or `<studio>:<mediaType>:<media>`), and **one normaliser** (the provider's own `normalizePersonalizationSource` passes the adapter's source through untouched) |
| `createPersonalizationOpenOptions(entry, { trigger? })` | returns exactly the options the existing provider's `openPersonalize` accepts — `{ source, access, trigger, onComplete }` — so no modal, wizard step or provider behaviour is duplicated |
| `deliverPersonalizationResult(result, onComplete?)` | the single place the provider hands a result to the originating studio, so the delivery contract is unit-testable without mounting the modal |

### How it reuses the existing provider

`DemoPersonalizeProvider` gained exactly **one** optional field on its public options type:

```ts
export type OpenPersonalizeOptions = {
  source: unknown
  trigger?: HTMLElement | null
  access?: PersonalizationAccessMode
  onComplete?: (result: GenerationResult) => void   // ← new, optional
}
```

- Omitting `onComplete` changes nothing — every pre-existing entry point keeps working exactly as before.
- The callback fires with the provider's own `GenerationResult` as soon as one is available (a freshly generated result **or** a restored saved project) and **never twice** for the same result (a ref guard in the provider).
- **The modal itself is unaware of the callback** — it is unaware of any studio.

### The representative integration: Thumbnail Studio

`src/apps/thumbnail-studio/ThumbnailStudio.tsx` is the worked example. It calls `useDemoPersonalize()` and hands the contract to the existing provider:

```tsx
openPersonalize(createPersonalizationOpenOptions({
  originatingStudio: 'thumbnail-studio',
  mediaType: 'image',
  sourceImage: lastImageUrl,
  prompt: enhancedPrompt || prompt,
  title: 'Personalize this thumbnail',
  aspectRatio: selectedSize.ratio,
  model: selectedModel,
  onComplete: (result) => { /* route the output back to the studio */ },
}, { trigger: event.currentTarget }))
```

The studio owns **no second modal** — it describes what it has and lets the shared provider open the one modal. The button is rendered with `data-testid="thumbnail-studio-personalize"`.

### The 24 contract tests

`src/shared/personalization/__tests__/entryPoint.test.ts` covers: normalisation for **video**, **image** and **prompt-only** sources; aspect-ratio and duration propagation (and the "no fabrication" rule); brand-asset propagation and the empty-value drop rule; the completion callback invoked with the expected result shape — both as a pure function and through the **real** `DemoPersonalizeProvider` (mocked modal, mocked generation); the trigger element carried through; and a **regression guard** asserting that the pre-existing entry points behave identically (the raw landing demo, the free-discovery flow in `anonymous` mode, and the shared demo source mappers are unchanged).

### Studios still to be wired (later phases — none of these are implemented)

| Studio | Tab / route | Media it holds | Integration note |
|---|---|---|---|
| Image Studio | `image` (`packages/studio/src/components/ImageStudio.jsx`) | generated image | **Prop bridge** from `StandaloneShell`; `mediaType: 'image'` |
| Video Studio | `video` (`VideoStudio.jsx`) | generated video | Prop bridge; `mediaType: 'video'` |
| Lip Sync | `lipsync` (`LipSyncStudio.jsx`) | lip-synced video | Prop bridge; `durationSeconds` from the clip length |
| Body Swap | `recast` (`RecastStudio.jsx`) | swapped video | Prop bridge |
| Vibe Motion | `vibe-motion` (`VibeMotionStudio.jsx`) | motion video | Prop bridge |
| Motion Control | `motion-control` (`MotionControlStudio.jsx`) | motion video | Prop bridge |
| AI Clipping | `clipping` (`ClippingStudio.jsx`) | clipped video | Prop bridge |
| Cinema Studio | `cinema` (`CinemaStudio.jsx`) | cinematic video | Prop bridge |
| Marketing Studio | `marketing` (`MarketingStudio.jsx`) | marketing video | Prop bridge |
| Layers Studio | `layers` (`LayersStudio.jsx`) | layered video | Prop bridge |
| AI Influencer Studio | `ai-influencer` (`AiInfluencerStudio.jsx`) | influencer video | Prop bridge |
| Workflows | `workflows` (`WorkflowStudio.jsx`) | workflow output | Prop bridge; `mediaType` from the produced asset |
| Agents | `agents` (`AgentStudio.jsx`) | agent output | Prop bridge |
| Audio Studio | `audio` (`AudioStudio.jsx`) | audio only | No visual media — offer `mediaType: 'prompt-only'` or skip |
| Design Agent AI | `design-agent` (`src/apps/design-agent/DesignAgent.tsx`) | conversation media | App-level studio: import the contract directly, no prop bridge |
| VFX | `vfx-studio` (`src/apps/vfx-studio/VFXStudio.tsx`) | VFX video | App-level: import the contract directly |
| Storyboard | `storyboard` (`src/apps/storyboard/Storyboard.tsx`) | shot images | App-level: `mediaType: 'image'`, `projectRef` = shot id |
| Social Publishing | `social-publishing` (`src/apps/social-publishing/SocialPublishing.tsx`) | published media | App-level: personalise the asset about to be published |
| Brand Studio | `brand-studio` (`app/(brand-studio)/brand/[id]/page.tsx`) | brand assets | **Route group with no provider mounted** — see blocker 2 |
| Photo Studio | `/photo-studio` (`app/(brand-studio)/photo-studio/page.tsx`) | product image | **Route group with no provider mounted** — see blocker 2 |
| SmartVideo GO AI Apps | `apps` (`AppsStudio.jsx`) | app directory | Not a media surface — no entry point needed |

### The two structural blockers found

1. **`packages/studio` has no `@/` alias.** That package is built with Babel (`packages/studio/babel.config.json`) and has **no `@/` path alias**, so its components **cannot import `@/shared/personalization` today**. Two options: (a) **a prop bridge from `StandaloneShell`** (recommended — `StandaloneShell` already owns the provider and can pass an `onPersonalize(payload)` callback into each package studio, with the bridge translating to the contract in one place; no build change), or (b) alias the contract into the package build (a module-resolver Babel plugin, or a `studio/src/personalization-entry.js` re-export). **Not worked around in code in this phase.**
2. **Brand Studio / Photo Studio live in a route group with no provider mounted.** `app/(brand-studio)/brand/[id]/page.tsx` and `app/(brand-studio)/photo-studio/page.tsx` are outside every mount point of `DemoPersonalizeProvider` (the landing page, `StandaloneShell`, `app/demo`, `app/demo/[slug]`, `app/personalization-demo`). **`DemoPersonalizeProvider` must be added to `app/(brand-studio)/layout.tsx` first**, and only then can those two studios personalise.

---

## 8. Tests performed and actual results

### 8.1 Suites and results

| # | Command | Result |
|---|---|---|
| 1 | `npx tsc --noEmit` | **exit 0** — 0 type errors |
| 2 | `npx next build` | **exit 0** — the production build compiles with the design registry, the picker and the export additions |
| 3 | `npx vitest run src/shared/personalization src/data/__tests__/` | **675 passed, 1 failed** (the pre-existing `DiscoveredAssets` asset / durable-storage failure — identical on `origin/main`), plus 14 pre-existing unhandled *"Durable storage is not configured"* rejections |
| 4 | `npx vitest run src/shared/personalization/remotion` | **16 passed** — `registry.test.ts` **11** + `designs.render.test.tsx` **5** |
| 5 | `npx vitest run src/shared/personalization/__tests__/webExport.design.test.ts` | **25 passed** |
| 6 | `npx vitest run src/shared/personalization/__tests__/remotionDesigns.browser.test.tsx` | **24 passed** — the **real Remotion runtime** (`@remotion/player` 4.0.499, no stubs) with pixel-level assertions on Remotion's own output; the separate **real headless-Chrome** pixel verification of the encoded files is §6.7 |
| 7 | `npx vitest run src/shared/personalization/__tests__/entryPoint.test.ts` | **24 passed** |
| 8 | `npx vitest run src/shared/personalization/guided/__tests__/remotionDesigns.test.tsx` | **22 passed** |
| 9 | `npx vitest run src/shared/personalization/guided/__tests__/remotionDesignExport.test.ts` | **3 passed** |
| 10 | `npx vitest run src/shared/personalization/preview/__tests__/PersonalizationComposition.test.tsx` | **3 passed** |
| 11 | `npx playwright test e2e/personalization-demo-video-playback.spec.ts e2e/personalization-motion-template-video.spec.ts` | **5 passed** (2 + 3 tests) — the pre-existing Step 2 playback suites, unchanged by Phase 1 |
| 12 | `DEMO_BASE_URL=http://localhost:3113 npx playwright test e2e/personalization-remotion-designs.spec.ts --project=chromium` | **9 passed** — the Step 4 acceptance suite against a real Chromium dev server, **4 consecutive runs at 9/9** — §8.2 |

**Local re-run note (honest disclosure).** Row 3 was re-run twice in this worktree while the report was being written, and the totals moved:

| Run | Result | Failing tests |
|---|---|---|
| Gate run (row 3) | **675 passed, 1 failed** + 14 unhandled *"Durable storage is not configured"* rejections | the pre-existing `DiscoveredAssets` failure |
| Local re-run 1 | **721 passed, 4 failed**, 15 errors (725 total, 314.9 s) | the same `DiscoveredAssets` failure plus timeouts |
| Local re-run 2 | **723 passed, 2 failed**, 14 errors (725 total, 236.9 s) | `DiscoveredAssets.test.tsx` → *"imports selected person assets into identities"* (durable storage) and `TemplateBrowser.test.tsx` → *"every category tab carries its catalog count badge"* (a 36 s timeout) |

**Both failing files are byte-identical to `origin/main`** (`git diff origin/main` for `DiscoveredAssets.test.tsx`, `TemplateBrowser.test.tsx` and `TemplateBrowser.tsx` is empty), and the `TemplateBrowser` suite was last touched by the *motion-studio* commit `5a09c29d6` — not by the demo-library commit and **not** by Phase 1. The run-to-run variance comes from those pre-existing timing-sensitive failures, not from the Remotion work. **The Phase 1 suites themselves (rows 4–10) are stable and green on every run.**

### 8.2 Browser acceptance results — Step 4 e2e

The dedicated Step 4 spec now **exists and passes**. Two files were written and run against a **real Chromium dev server** on `http://localhost:3113`:

| File | Size | Purpose |
|---|---|---|
| `e2e/personalization-remotion-designs.spec.ts` | 40,991 bytes, 1,019 lines | the acceptance suite — 9 tests over the real wizard |
| `e2e/capture-step4-designs.spec.ts` | 6,333 bytes, 161 lines | regenerates the three §9 screenshots — **1 passed, 8.6 s** |

The command that was run:

```
DEMO_BASE_URL=http://localhost:3113 npx playwright test e2e/personalization-remotion-designs.spec.ts --project=chromium
```

**All 9 tests pass.** Every one of them drives the real product surface — the landing demo page (`/personalization-demo?test=true`) → the Personalization Modal → Step 4 — with real media fetched over HTTP:

| # | Test | What it proves |
|---|---|---|
| 1 | `12 curated demos still play in Step 2` | **regression guard** — a representative sample of the 12 curated demos still reaches a player, points at its own clip and plays without error |
| 2 | `each Remotion design is selectable in Step 4 and renders` | all five registry designs are selectable, mount in the real player, and their copy is visible in the player DOM |
| 3 | `the preview advances after a design is selected` | the composition is really playing: the rendered pixel sum and the transport timecode both change |
| 4 | `an overlay design composites over the customer's video` | the overlay design draws only its own card region; the footage is still visible and playing underneath it |
| 5 | `the existing pill-shaped options still work` | the pre-existing layout / aspect / fps / end-card pills are unchanged |
| 6 | `brand data populates the design props` | the business data reaches the **rendered composition**, not only the editor fields |
| 7 | `a selected design survives a reload` | the selection is persisted and restored |
| 8 | `the shared entry-point contract opens the modal` | the §7 contract normalises correctly, its source resolves over HTTP, and the provider's existing landing-page path opens the one modal with a bound, playable source |
| 9 | `auth and entitlements unchanged` | `/api/personalization/project` still returns **401** unauthenticated (also with a bogus session cookie, and on `POST`) |

**Stability.** After the timing flaw described below was fixed, the suite was run **4 consecutive times with 9/9 passing every time** — 55.7 s, 54.9 s, 1.1 m, 57.5 s.

**The flaw that was found and fixed (a real finding).** Test 7 originally waited a fixed 1500 ms after selecting a design and then sampled `aria-pressed` **once**. Because the provider persists the preview state to a localStorage mirror on an **800 ms debounce** (`DemoPersonalizeProvider.tsx:1572`, writing through `writePreviewStorage(source.id, previewUserScope, {...})` under the key prefix `smartvideo_preview_state_`), and because the restore on reload resolves asynchronously (the provider re-applies the mirror on a Supabase miss), that single sample was intermittently `false` — the test flaked roughly **1 run in 3**.

The **product** behaviour was correct throughout: `src/shared/personalization/preview/presets.ts` restores `remotionDesignId` and `remotionDesignProps` from the persisted `previewSettings` (`presets.ts:693`–`697`), and `DemoPersonalizeProvider` writes them through `writePreviewStorage(source.id, previewUserScope, {...})` under the prefix `smartvideo_preview_state_`. **The fix was in the test, not the product.** The test now (a) polls `localStorage` until a mirror entry actually contains `previewSettings.remotionDesignId === 'particle-explosion'` — asserting that the product persisted it — and only then (b) reloads and polls the pill's `aria-pressed` for up to 15 s. A per-test timeout of **240 s** was added to the suite, because each test walks the whole wizard and fetches real media.

**Console / network.** The only console/network noise across the browser runs was the expected **401** from `GET`/`POST /api/personalization/project` in the unauthenticated test session. **No video or design errors.**

**One honest note on the pixel technique.** Remotion 4.0.499's `<Player>` renders the composition into the **DOM** — it does not paint into a `<canvas>` — so the older specs' "canvas pixel" probe cannot be pointed at the composition itself. The liveness check therefore samples the **rendered player region**: a PNG screenshot of the player element is decoded back inside the browser (`Image` → `canvas` → `getImageData`) and reduced to a luminance sum, while the customer's footage *is* still probed directly on the `<canvas>` the composition paints the source video into. The probe records which path it used, so the signal is never confused with the other.

---

## 9. Before-and-after Step 4 screenshots

The three screenshots **now exist** and are **reproducible**: `e2e/capture-step4-designs.spec.ts` regenerates all three from a live dev server on `http://localhost:3113` (viewport 1440×900, full-page) — **1 passed, 8.6 s**. The seeded customer is the business profile *Aurelia Beauty Co*, whose offer is *Signature Scent Collection*.

| File | Bytes | Shows |
|---|---:|---|
| `docs/screenshots/step4-before-designs.png` | 106,475 | Step 4 with **no Remotion design selected** — the Motion design panel sits on "Your layout", and only the existing layout/overlay pills are in play |
| `docs/screenshots/step4-after-designs.png` | 90,508 | Step 4 with a **full-frame** design selected (Bounce In Headline) |
| `docs/screenshots/step4-overlay-design.png` | 136,832 | Step 4 with an **overlay** design selected over the customer's video (Lower Third Glass Card) |

### Before — no design selected

![Step 4 with no Remotion design selected: the Motion design panel on "Your layout", the existing layout pills and quick adjustments below](docs/screenshots/step4-before-designs.png)

The Personalization Modal is at Step 4 ("Preview and approve"). The **MOTION DESIGN** panel is present with the five design pills (Bounce In Headline, Logo Mask Wipe, Lower Third Glass Card, Social Reel Promo, Particle Explosion) all unselected and **"Your layout"** active, so no design editor is open. Below it the unchanged **QUICK ADJUSTMENTS** panel shows the existing layout pills with *Service Promotion* selected, the video-shape / smoothness / length controls and the "End with a branded card" toggle, and the preview above still shows the customer's own footage with no design composited over it.

### After — a full-frame design selected

![Step 4 with the Bounce In Headline full-frame design selected: FULL FRAME badge, headline pre-filled with the business offer, brand colour swatches populated, and the preview replaced by the design](docs/screenshots/step4-after-designs.png)

**Bounce In Headline** is selected and the panel now carries the **FULL FRAME** badge. The design editor opened beneath the pills: the design's description, a **TEXT → HEADLINE** textarea pre-filled with *"Signature Scent Collection"* (the seeded business's own offer, carried straight into the design's editable prop), and **COLOURS → BACKGROUND** and **TEXT COLOUR** swatches populated from the brand. The preview above is now the design's own full-frame composition — the customer's footage is replaced, exactly as a full-frame design is meant to behave.

### After — an overlay design selected

![Step 4 with the Lower Third Glass Card overlay design selected: OVER YOUR VIDEO badge, name and title pre-filled, three brand colour swatches, and the customer footage still playing underneath](docs/screenshots/step4-overlay-design.png)

**Lower Third Glass Card** is selected and the badge reads **OVER YOUR VIDEO** instead of FULL FRAME. The editor shows **TEXT → NAME** ("Aurelia Beauty Co") and **TITLE** ("Signature Scent Collection"), plus three brand-coloured swatches (background, accent colour, text colour). The preview above still shows the customer's own footage playing — the overlay design composites over it rather than replacing it, which is the placement difference the two badges name.

---

## 10. Remaining work for the full template library

| # | Item | Detail |
|---|---|---|
| 1 | **Wire the remaining 118 usable templates** | The inventory lists **118 usable** templates (124 distinct minus the 6 premium-blocked ones). **5** are integrated. The remaining **113** need to be lifted, adapted (background removal for overlay use, pixel scaling for the four ratios, `staticFile()` → absolute URL, Google-Fonts → the local `fontStackById()`, `SequenceManager` descendant requirement) and registered. Repo 2 is the recommended primary source (typed props, resolution-adaptive, real `LICENSE` file, SPDX headers) |
| 2 | **The category model must scale past five designs** | `RemotionDesignCategory` is currently a closed union of five values (`headline`, `logo`, `lower-third`, `cta`, `effect`) and the picker renders one flat row of pills. 113 more designs need either a wider union, a category hierarchy, or a searchable/grouped picker — and the category list must be derived from the data rather than hard-coded, exactly as the sibling demo-library work derives its tabs |
| 3 | **Studio-by-studio entry-point wiring** | The contract exists and is proven, but only Thumbnail Studio uses it. The 20 studios in §7 remain unwired, with the `packages/studio` prop bridge needed for 14 of them |
| 4 | **The `packages/studio` `@/` alias blocker** | Either add a module-resolver Babel plugin to `packages/studio/babel.config.json`, or standardise on the prop bridge from `StandaloneShell`. Until one is chosen, none of the 14 package studios can import the contract |
| 5 | **The two route groups with no provider** | `app/(brand-studio)/layout.tsx` must mount `DemoPersonalizeProvider` before Brand Studio and Photo Studio can personalise |
| 6 | **`calculateMetadata` / duration semantics** | **The preview runs the customer's duration; the export runs the design's own duration.** The preview shows the design looping/playing inside the customer's timeline, while `buildRemotionDesignExportPlan()` sets `durationInFrames = design.durationInFrames`, so the exported file is exactly as long as the design (4.00 s / 3.33 s / 4.00 s / 3.00 s / 5.00 s) rather than as long as the customer's video. This is a **product decision that still has to be made**: either the export must run the customer's duration (the design looping to fill it), or the UI must state plainly that a selected design produces a clip of the design's length. The same question applies to `calculateMetadata`, which is now forwarded and honoured but is not yet used by any of the five designs |
| 7 | **A real, in-app export proof** | The app's own `exportPersonalizedVideo()` wrapper was never observed returning a real `Blob` in a browser (§6.7, limit 1). The end-to-end in-app export path — wizard → provider → wrapper → renderer → Blob → download — still wants a dedicated browser test |
| 8 | **MP4 coverage** | Only `lower-third-glass-card` was encoded to MP4 (H.264/AAC). The other four are proven only in WebM/VP8/Opus |
| 9 | **Attribution file** | The inventory's §14.8 recommends a single attribution file recording repo 2's and repo 3's MIT notices and repo 1's "credit appreciated" line. The attribution currently lives per design in `registry.ts` (`source.attribution`) and in each adapted source file header; a consolidated `docs/REMOTION_ATTRIBUTION.md` is still to be written |

---

## 11. Merge conflicts and blockers

### Merge

- The merge with `origin/main` was **clean**. `origin/main` is an ancestor of this branch, the merge base is `0bfecda0f`, and the base commit itself is the merge commit *"merge: integrate origin/main into `fix-the-video-previews`"*. There are **no unresolved conflicts, no conflict markers and no manual resolutions** in the tree. The branch is one commit ahead of `origin/main` plus the uncommitted Phase 1 delta.

### Known pre-existing failures (not introduced by Phase 1)

| Failure | Status |
|---|---|
| `DiscoveredAssets` asset / durable-storage failure in the `src/shared/personalization` + `src/data/__tests__/` run | **Pre-existing.** Identical on `origin/main`; the failing files are byte-identical to `origin/main` (`git diff origin/main` for them is empty) |
| The 14 pre-existing unhandled *"Durable storage is not configured, so this file cannot be saved for later re-use."* rejections (raised by `assetUploadService.uploadPersonalizationAsset` during the image-editing tests) | **Pre-existing** |
| `TemplateBrowser.test.tsx` → *"every category tab carries its catalog count badge"* — a 36 s timeout in the motion-studio Step 2 browser | **Pre-existing.** That suite was last changed by the motion-studio commit `5a09c29d6`; it is byte-identical to `origin/main` and is not touched by Phase 1 or by the demo-library work. It appears only in some runs (the suite is timing-sensitive) |
| The `applyLocalPreviewState` localStorage-mirror flake | **Pre-existing.** `applyLocalPreviewState` (`DemoPersonalizeProvider.tsx:1604`) applies the per-user localStorage mirror wholesale when Supabase has no durable row for the source, and the writeback effect that maintains that mirror races it. It is order-dependent and intermittently observable in the durable-restore suites. Phase 1 did **not** touch this path; it only added two optional fields to the settings it restores, and `normalizePreviewSettings()` drops them when they are absent |

### Structural blockers carried forward

1. **`packages/studio` has no `@/` alias** (Babel build) → the 14 package studios cannot import `@/shared/personalization` yet. A **prop bridge from `StandaloneShell`** is the recommended route; see §7 and §10.
2. **Brand Studio / Photo Studio have no provider mounted** → `DemoPersonalizeProvider` must be added to `app/(brand-studio)/layout.tsx` first; see §7 and §10.

### Other open items

- The Step 4 e2e spec `e2e/personalization-remotion-designs.spec.ts` **now exists and passes 9/9** (§8.2) — this item is closed.
- The three Step 4 screenshots **now exist** and are reproducible from `e2e/capture-step4-designs.spec.ts` (§9) — this item is closed.
- The one browser-side gap that remains is the app's own `exportPersonalizedVideo()` wrapper returning a real `Blob` in a browser — see §6.7, limit 1 and §10, item 7.

---

## 12. Feature branch and commit SHA

| Item | Value |
|---|---|
| Branch | `feat/remotion-phase1-personalization-templates` |
| Current HEAD SHA | `603c60d6f4a34fafde56e61331042a43ab566f95` (`feat(personalization): expand the demo library from 12 to 123 verified videos`) |
| Base commit | `0bfecda0f8fb7366a33dbe7d422a68b30911750e` (= the current `origin/main` tip) |
| **Phase 1 is based on** | **`603c60d6f` — the demo-library expansion tip**, which is itself the head of the sibling branch `feat/expand-demo-library-categories` and is open as **PR #63**. The Phase 1 work sits on top of that commit |
| **Phase 1 commit state** | **The Phase 1 work is UNCOMMITTED in the working tree and staged for commit by the coordinator.** The coordinator creates the commit — **no commit SHA is claimed for the Phase 1 work here, because none exists yet.** **No commit, no push, no merge and no deploy was performed for the Phase 1 work.** |

### Working-tree state of the Phase 1 delta

Modified (12 files):

```
src/apps/thumbnail-studio/ThumbnailStudio.tsx
src/shared/personalization/DemoPersonalizeProvider.tsx
src/shared/personalization/demoSources.ts
src/shared/personalization/guided/StepPreviewApprove.tsx
src/shared/personalization/guided/buildPreviewInput.ts
src/shared/personalization/guided/index.ts
src/shared/personalization/index.ts
src/shared/personalization/preview/BeforeAfterPreview.tsx
src/shared/personalization/preview/PersonalizationComposition.tsx
src/shared/personalization/preview/presets.ts
src/shared/personalization/preview/types.ts
src/shared/personalization/webExport.ts
```

Untracked / new (12 paths: 11 files + the `remotion/` directory, which contains 10 files):

```
docs/PERSONALIZATION_ENTRY_POINT.md
docs/REMOTION_TEMPLATE_INVENTORY.md
src/shared/personalization/entryPoint.ts
src/shared/personalization/remotionExportRegistry.ts
src/shared/personalization/remotion/            (index.ts, registry.ts, designTokens.ts,
                                               designs/*.tsx ×5, __tests__/* ×2)
src/shared/personalization/guided/RemotionDesignPicker.tsx
src/shared/personalization/guided/designProps.ts
src/shared/personalization/__tests__/entryPoint.test.ts
src/shared/personalization/__tests__/remotionDesigns.browser.test.tsx
src/shared/personalization/__tests__/webExport.design.test.ts
src/shared/personalization/guided/__tests__/remotionDesigns.test.tsx
src/shared/personalization/guided/__tests__/remotionDesignExport.test.ts
```

Untracked / new — the browser acceptance artifacts of §8.2 and §9 (5 paths). **These are the files §8.2 and §9 cite, so they belong in the same commit as this report:**

```
e2e/personalization-remotion-designs.spec.ts
e2e/capture-step4-designs.spec.ts
docs/screenshots/step4-before-designs.png
docs/screenshots/step4-after-designs.png
docs/screenshots/step4-overlay-design.png
```

**Re-running the real-encode proof:** the harness (esbuild bundle + static server + headless Chrome) and the six encoded artifacts live in the system temp directory
`/var/folders/…/T/kilo/remotion-proof/` and are **not committed**. The independent frame comparison was re-run from there with a local static server that supports HTTP range requests (without range support the browser cannot seek, and the decoded frames read as flat — an artefact of the harness, not of the encodes).

---

### One-paragraph summary

Phase 1 took the Remotion design capability from "an inventory of 138 upstream templates" to "five adapted, MIT-licensed, resolution-adaptive designs that a customer can pick in Step 4, that render live in the Remotion Player over their own footage, and that encode to real video files in the browser" — plus a shared, tested entry-point contract that lets any studio in the product open the one existing Personalization modal without duplicating it. Everything that existed before still behaves exactly as it did: the wizard, the layout pills, the overlay editor, the asset and AI-editing paths, the export profile and the access-control surface are untouched, and every new field is optional. What is deliberately **not** done is stated in the same terms above: 113 of the 118 usable templates are still unwired, 20 studios are still unwired (two of them blocked structurally, one of those blocked by the `packages/studio` build), and the app's own export wrapper has not yet been observed returning a real Blob in a browser. The Step 4 e2e spec and the before/after screenshots are no longer outstanding — they were written, run and captured, and are reported in §8.2 and §9.
