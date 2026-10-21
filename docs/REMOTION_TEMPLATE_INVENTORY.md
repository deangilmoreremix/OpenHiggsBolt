# Remotion Template Source Inventory

**Status:** Inventory complete. Since this document was written, **five** templates have been adapted into this repository as `src/shared/personalization/remotion/designs/*.tsx` (`bounce-in-headline`, `logo-mask-wipe`, `lower-third-glass-card`, `social-reel`, `particle-explosion`). No upstream `package.json`, `remotion.config.ts` or `Root`/entry scaffolding was copied, and the repo's Remotion version is unchanged. See §15 for the per-repo provenance of what was and was not taken.
**Scope:** Three upstream Remotion template repositories plus the React Video Editor reference gallery.
**Target repo:** `feat/remotion-phase1-personalization-templates` (this repository).
**Target repo Remotion version:** `remotion@4.0.499`, `@remotion/player@4.0.499`, `@remotion/web-renderer@4.0.499`, `@remotion/media@4.0.499` (all pinned, from root `package.json`).

---

## 1. Executive summary

### 1.1 Per-repository counts

| # | Source repository | URL | Template entries | Slugs unique to this repo | Licence | Usable in this product |
|---|---|---|---:|---:|---|---:|
| 1 | `remotion-templates` (RVE "Remotion Templates by RVE") | `https://github.com/deangilmoreremix/remotion-templates` | **81** | 67 | MIT (README) — **no `LICENSE` file in repo** | **61** |
| 2 | `free-remotion-templates` (RenderComp / Trimora Inc.) | `https://github.com/deangilmoreremix/free-remotion-templates` | **50** | 36 | `MIT License` / `Copyright (c) 2026 Trimora Inc.` | **50** |
| 3 | `remotion-video-templates` (Alejandro Brito) | `https://github.com/deangilmoreremix/remotion-video-templates` | **7** | 7 | `MIT License` / `Copyright (c) 2026 Alejandro Brito` | **7** |
| — | **Total before deduplication** | | **138** | | | **118** |
| — | **Total after cross-repo deduplication** | | | **124** | | **118** |
| — | *Reference gallery only (not in any repo)* | `https://www.reactvideoeditor.com/remotion-templates` | *14* | *14* | RVE catalogue "Pro" tier — source not public | **0** |

- **138** source template entries were enumerated across the three repositories, matching the expected "~138" figure.
- **14 slugs appear in two repositories** (repo 1 ∩ repo 2 = 14; repo 3 shares none): `bokeh-circles`, `camera-shake`, `chapter-title`, `end-card`, `glitch-text`, `logo-blur-reveal`, `logo-bounce-drop`, `logo-split-reveal`, `logo-stroke-draw`, `parallax-pan`, `slide-wipe`, `split-screen`, `starfield`, `whip-pan`. They are **different implementations by different authors under different licences**, not copies — see §11.1.
- **124 distinct templates** remain after deduplication (81 + 50 + 7 − 14). For every shared slug this inventory recommends **repo 2's version** as canonical, because repo 2's components are typed, prop-driven and resolution-adaptive while repo 1's are zero-prop (§14).
- **6 of the 124 are licence-blocked** (see §4): `area-chart`, `chart-animation`, `comparison-chart`, `donut-chart`, `progress-bars`, `stat-counter` are distributed in repo 1 but the vendor's own catalogue marks them `tier: "pro"` and refuses to serve their source publicly. **118 templates are usable.**
- **5 templates need code changes** before they can run through the browser export engine (see §6): repo 1's `ken-burns`, `parallax-pan`, `zoom-pulse` (CSS `@keyframes` / `next/image`), and repo 3's `LogoIntro` and `PromoTemplate` (`staticFile()`; `PromoTemplate` additionally needs `@remotion/transitions` and a local font stack).

### 1.2 The union of distinct templates (124)

**From repo 1 only — 67 slugs (61 usable; the 6 premium ones are marked ⚠):**
`animated-list`, `animated-text`, `area-chart`⚠, `blinds-transition`, `bounce-text`, `bubble-pop-text`, `card-flip`, `cinematic-title-intro`, `circular-progress`, `clock-wipe`, `comparison-chart`⚠, `countdown-intro`, `countdown-timer`, `credits-roll`, `cross-dissolve`, `donut-chart`⚠, `fade-through-black`, `film-burn`, `floating-bubble-text`, `gallery-grid`, `geometric-patterns`, `gradient-shift`, `grid-pulse`, `image-carousel`, `image-comparison-slider`, `image-zoom-reveal`, `iris-transition`, `ken-burns`⚠, `letterbox-reveal`, `line-chart`, `liquid-wave`, `logo-fade-reveal`, `logo-glitch-reveal`, `logo-scale-rotate`, `logo-spin-reveal`, `logo-typewriter`, `lower-third`, `masonry-gallery`, `matrix-rain`, `morph-transition`, `noise-grain`, `notification-pop`, `particle-explosion`, `photo-stack`, `picture-in-picture`, `pie-chart`, `pixel-transition`, `polaroid-frame`, `popping-text`, `progress-bars`⚠, `progress-steps`, `pulsing-text`, `push-transition`, `quote-card`, `rotating-carousel`, `slide-text`, `sound-wave`, `spotlight-reveal`, `stat-counter`⚠, `subscribe-reminder`, `text-highlight`, `title-split`, `typewriter-subtitle`, `vignette-pulse`, `zoom-pulse`⚠, `zoom-through`

**From repo 2 — 50 slugs (all usable; 36 are unique to repo 2, 14 are shared with repo 1 and repo 2's version is canonical):**
`bar-chart-anim`, `bokeh-circles`*shared*, `bounce-in-headline`, `brush-stroke-reveal`, `camera-shake`*shared*, `card-flip-transition`, `chapter-title`*shared*, `character-jumping`, `community-chat`, `end-card`*shared*, `eye-reveal`, `fireworks-burst`, `flip-page-transition`, `four-tone-mono-titler`, `glitch-text`*shared*, `gradient-text-sweep`, `ink-spread-transition`, `kinetic-word-stack`, `kpi-counter`, `line-chart-anim`, `logo-blur-reveal`*shared*, `logo-bounce-drop`*shared*, `logo-mask-wipe`, `logo-split-reveal`*shared*, `logo-stroke-draw`*shared*, `loop-grid-wave`, `lower-third-glass-card`, `neon-sign`, `parallax-pan`*shared*, `particle-snow`, `pencil-draw`, `pixel-candlestick-ohlc`, `pixel-mosaic-transition`, `pixel-typewriter-quote`, `pixel-waterfall-cycle`, `pourover-drip-fill-gauge`, `racing-chart`, `scramble-text`, `shatter-reveal`, `slide-wipe`*shared*, `social-reel`, `split-screen`*shared*, `starfield`*shared*, `text-mask-reveal`, `thinking-bubble`, `transition-circle-wipe`, `typewriter`, `wave-hello`, `wave-text`, `whip-pan`*shared*

**From repo 3 — 7 slugs (all usable, all with caveats):**
`LogoIntro`, `LowerThirds`, `KineticText`, `BarChartRace`, `LineChartDraw`, `CaptionedShort`, `PromoTemplate`

⚠ = licence-blocked (premium tier, see §4.2). `ken-burns`, `parallax-pan` and `zoom-pulse` additionally need code changes for the browser export engine (§6.3).

### 1.3 Headline finding

**The templates that are technically overlay-capable have no editable props; the templates that have editable props all paint a full-frame background.**

- Repo 1 has 78 zero-prop components (all copy, colour and geometry are hardcoded — e.g. `lower-third.tsx` literally contains `"John Smith"` / `"Senior Producer"`, `logo-stroke-draw.tsx` contains an inline SVG hexagon). Of the 81, only **13 are transparent overlays** (see §7.3) — and **all 13 are zero-prop**.
- Repo 2 and repo 3 have **fully typed, data-driven props** (50 + 7 = 57 templates), but **every single one** renders an opaque `AbsoluteFill` background, so none of them can be placed over an existing video without a code change (removing the background fill).

Practical consequence: for the "overlay over the customer's existing video" use case, the cheapest path is **repo 2's components with the background fill removed** (a one-line change per template), not repo 1's zero-prop components.

---

## 2. Method

```bash
git clone --depth 1 https://github.com/deangilmoreremix/remotion-templates.git      /tmp/remotion-src/remotion-templates
git clone --depth 1 https://github.com/deangilmoreremix/free-remotion-templates.git /tmp/remotion-src/free-remotion-templates
git clone --depth 1 https://github.com/deangilmoreremix/remotion-video-templates.git /tmp/remotion-src/remotion-video-templates
```

Enumeration was exhaustive, not sampled:

- **Repo 1** — `templates/*.tsx`, 81 files, one component per file. Enumerated with `find templates -name '*.tsx'`. There is no `package.json`, no `src/`, and **no `Root.tsx`**; the README documents each file.
- **Repo 2** — `src/components/<composition-id>/<Component>.tsx`, 50 directories. Composition ids, durations, fps and pixel dimensions were read from `src/Root.tsx` (`<Composition id=… durationInFrames=… fps=… width=… height=…>`). Props were read from each `export type XProps = { … }` block.
- **Repo 3** — `src/templates/<Template>/<Template>.tsx`. 7 `<Composition>` entries in `src/Root.tsx` (6 template folders; `ChartVideo/` yields two compositions, `BarChartRace` and `LineChartDraw`). Props were read from each `z.object({ … })` schema.
- **Gallery** — `https://www.reactvideoeditor.com/remotion-templates` was read both as HTML (96 `/remotion-templates/<slug>` hrefs → 95 templates + `/mcp`) and through the site's own MCP endpoint (`https://www.reactvideoeditor.com/api/mcp`, tool `search_templates` / `get_template` / `list_categories`), which returns per-template `category`, `tier`, `duration`, `fps` and `sourceCode`.

Signals used for classification (searched across every file): `Composition`, `interpolate`, `useCurrentFrame`, `AbsoluteFill`, `Sequence`, `spring`, `random`, `staticFile`, `Img`, `Video`, `Audio`, `delayRender`, `backdropFilter`, `mixBlendMode`, `@keyframes`, `style jsx`, `next/image`, `z.object`, `calculateMetadata`.

Nothing from `/tmp/remotion-src/` has been copied into this repository. This file is the only artefact.

---

## 3. Design categories across the three repositories

| Category (bucketed) | Repo 1 | Repo 2 | Repo 3 | Union |
|---|---:|---:|---:|---:|
| Logo & branding / reveal | 9 | 8 | 1 | 18 entries / 14 distinct |
| Text / headline / title | 9 | 11 | 1 | 21 entries / 20 distinct |
| Transitions | 9 | 8 | 0 | 17 entries / 16 distinct |
| Intro & outro | 9 | 0 | 0 | 9 entries / 9 distinct |
| Charts & data | 9 | 6 | 2 | 17 entries / 17 distinct |
| Content animation / UI | 9 | 9 | 3 | 21 entries / 21 distinct |
| Backgrounds / ambient | 9 | 8 | 0 | 17 entries / 15 distinct |
| Cinematic / effect | 9 | 0 | 0 | 9 entries / 9 distinct |
| Image & media | 9 | 0 | 0 | 9 entries / 9 distinct |
| **Total** | **81** | **50** | **7** | **138 entries / 124 distinct** |

Six slugs straddle two buckets (repo 1 files one, repo 2 files the other): `camera-shake` and `whip-pan` (Cinematic ↔ Transitions), `parallax-pan` (Cinematic ↔ Backgrounds), `chapter-title` (Intro ↔ Text), `end-card` (Intro ↔ UI), `split-screen` (UI ↔ Image & media). The 124 figure counts each slug once.

---

## 4. Licence summary

### 4.1 Per-repository licence facts (exact identifiers)

| Repo | Licence file present | Exact licence identifier | Attribution requirement | Non-code assets |
|---|---|---|---|---|
| `remotion-templates` | **No.** There is no `LICENSE`, `LICENSE.md` or `COPYING` file anywhere in the repository. | The README's only statement is: *"All templates in this repository are available under the MIT License. You can use them in personal and commercial projects, but attribution is appreciated where applicable."* Every template file carries the per-file header: *"Free Remotion Template Component — This template is free to use in your projects! **Credit appreciated but not required.** Created by the team at https://www.reactvideoeditor.com"*. | Attribution **appreciated, not required**. | None bundled. 9 templates reference remote Pexels/Unsplash image URLs at build time (not redistributed). |
| `free-remotion-templates` | **Yes** — `LICENSE` | `MIT License` / `Copyright (c) 2026 Trimora Inc.` | The MIT copyright + permission notice must be included in all copies or substantial portions. Every source file additionally carries `// SPDX-FileCopyrightText: 2026 Trimora Inc.` and `// SPDX-License-Identifier: MIT`. | None bundled — `ASSETS.md` states 0 fonts, 0 images, 0 audio, 0 video files; all graphics are inline SVG/CSS and the 6 pixel templates use a **code-drawn 5×7 bitmap font** (`src/pixel-kit/font.ts`). |
| `remotion-video-templates` | **Yes** — `LICENSE` | `MIT License` / `Copyright (c) 2026 Alejandro Brito` | Same MIT notice requirement. | `public/logo.svg`, `public/screenshot-1.svg`, `public/screenshot-2.svg`, `public/captions.sample.json` — all authored in this repo, so MIT. **Inter is fetched at render time from Google Fonts (OFL), not redistributed.** |

All three licences are MIT-family and therefore compatible with this repository's own MIT licence (`package.json` → `"license": "MIT"`). **No Apache-licensed or copyleft content was found, and nothing found is incompatible with MIT redistribution.**

### 4.2 ⚠ Licence conflicts and premium content — READ BEFORE INTEGRATING

**Finding 1 — Repo 1 has no `LICENSE` file.** Its MIT status is asserted only in prose in the README. For an MIT-licensed product this is a *documentation* gap, not a blocker: the upstream project (React Video Editor) publishes the same files under the same MIT terms via its own catalogue, and the repository's git history shows it merges directly from `reactvideoeditor/feat/expand-to-81-templates`. **Recommendation:** treat repo 1 as MIT, and carry the "Credit appreciated but not required" attribution line forward in the attribution file.

**Finding 2 — six repo-1 templates are paid "Pro" content in the vendor's own catalogue.** The React Video Editor catalogue exposes an MCP endpoint whose `search_templates` response carries a `tier` field per template:

```
$ curl -s -X POST https://www.reactvideoeditor.com/api/mcp … -d '{"method":"tools/call","params":{"name":"get_template","arguments":{"slug":"chart-animation"}}}'
{ … "tier": "pro", "note": "This is a Pro template — source is not available publicly. See the page for access." }
```

Of the 95 templates in the gallery, **75 are `tier: "free"` and 20 are `tier: "pro"`**. Six of those 20 Pro templates are nevertheless present in full in repo 1:

| Template | Repo 1 path | Gallery tier | Gallery source |
|---|---|---|---|
| `chart-animation` | `templates/chart-animation.tsx` | `pro` | withheld |
| `donut-chart` | `templates/donut-chart.tsx` | `pro` | withheld |
| `area-chart` | `templates/area-chart.tsx` | `pro` | withheld |
| `progress-bars` | `templates/progress-bars.tsx` | `pro` | withheld |
| `stat-counter` | `templates/stat-counter.tsx` | `pro` | withheld |
| `comparison-chart` | `templates/comparison-chart.tsx` | `pro` | withheld |

The other 14 Pro templates (`bar-chart-race`, `candlestick-chart`, `multi-line-chart`, `radar-chart`, `gauge-meter`, `stacked-bar-chart`, `bubble-chart`, `waterfall-chart`, `kpi-dashboard`, `heatmap-grid`, `coverflow-carousel`, `toast-stack`, `onboarding-steps`, `animated-leaderboard`) are **not present in any of the three repositories** and their source is withheld by the vendor — they are recorded in §9 for completeness only and are **out of scope**.

**Action: the 6 templates above are excluded from this inventory's usable set and must not be imported into this repository.** They are listed in the tables below for completeness, marked `⚠ PREMIUM`, with their browser-export verdict set to "Blocked — premium/pro tier".

**Finding 3 — free templates confirmed byte-equivalent.** For 14 free gallery templates, the gallery's own `sourceCode` was diffed against the repo-1 file. All 14 differ only by cosmetic whitespace and one `fontWeight: "bold"` → `fontWeight: 400` substitution (e.g. `lower-third.tsx`). The repo and the catalogue ship the same code, so the catalogue's `tier` flag is a *catalogue merchandising* decision, not a code-fork decision — but for the 6 chart templates it is the only signal the product owner has, and it says "paid". Treat them as paid.

**Finding 4 — no repo ships fonts, images, video or audio.** Nothing to strip out, nothing premium to import, and no third-party media licences to track. Repo 3's `public/*.svg` are original; repo 1's and repo 2's assets are all inline SVG/CSS or a code-drawn bitmap font.

---

## 5. Remotion version compatibility

### 5.1 Version matrix

| Where | Remotion | React | Other runtime deps |
|---|---|---|---|
| **This repository** (`package.json`) | `4.0.499` (`remotion`, `@remotion/player`, `@remotion/web-renderer`, `@remotion/media`) | `^19.0.0` (resolved 19.3.0) | — |
| Repo 1 `remotion-templates` | **Unpinned.** No `package.json`, no lockfile, no `remotion.config.ts`. | Not pinned | `next/image` (2 files), `styled-jsx` (3 files) |
| Repo 2 `free-remotion-templates` | `4.0.518` (`remotion`, `@remotion/cli`) | `^19.0.0` | none (plus local `src/pixel-kit/`) |
| Repo 3 `remotion-video-templates` | `4.0.200` (`remotion`, `@remotion/cli`, `@remotion/google-fonts`, `@remotion/transitions`, `@remotion/zod-types`) | `18.3.1` (pinned) | `zod@3.22.3` |

### 5.2 What the version difference actually means

Remotion's public component API is stable across `4.0.200 → 4.0.499 → 4.0.518`; all three are the same major/minor line and the diff between them is patches plus additive packages. The API surface each repository uses is:

| API | Repo 1 | Repo 2 | Repo 3 | Present in 4.0.499? |
|---|---:|---:|---:|---|
| `useCurrentFrame`, `useVideoConfig` | ✅ 78/81 | ✅ 50/50 | ✅ 7/7 | ✅ |
| `interpolate` | ✅ 47 | ✅ | ✅ | ✅ |
| `spring` | ✅ 36 | ✅ | ✅ | ✅ |
| `random` (seeded PRNG) | ✅ 4 | ✅ | ✅ | ✅ |
| `AbsoluteFill` | ❌ (plain `div`) | ✅ 50/50 | ✅ 7/7 | ✅ |
| `Sequence` | ❌ | ✅ 3 | ✅ 2 | ✅ |
| `Series` | ❌ | ❌ | ✅ 1 | ✅ |
| `Img` | ❌ | ❌ | ✅ 2 | ✅ |
| `staticFile()` | ❌ | ❌ | ✅ 2 | ⚠ bundler-dependent — see §6.4(b) |
| `CalculateMetadataFunction` | ❌ | ❌ | ✅ 6/7 | ✅ |
| `random`/`Easing`/`Internals` | ❌ | ✅ | ✅ | ✅ |

### 5.3 Verdict: which templates are usable **without a Remotion version bump**

**All 124 distinct templates are usable without changing this repository's Remotion version.** No template requires a downgrade or a bump:

- **Repo 2 (50/50) — no bump required.** `4.0.518 → 4.0.499` is a patch-level difference inside Remotion 4.0. The components use only `useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`, `AbsoluteFill`, `Sequence` — all present and behaviour-compatible in `4.0.499`. React `^19` already matches this repo. **Caveat:** repo 2's `package.json` pins `remotion@4.0.518`; the components must be copied in as *source files* (not installed as a package) so that this repo's `4.0.499` resolution applies. Never add `remotion@4.0.518` to this repo's `package.json` — two Remotion copies in one bundle is the classic cause of "Cannot read properties of undefined (reading 'useCurrentFrame')" and of `delayRender` handle mismatches.
- **Repo 3 (7/7) — no bump required for the components.** `4.0.200 → 4.0.499` is additive. **However** the *packages* `remotion@4.0.200`, `@remotion/google-fonts@4.0.200`, `@remotion/transitions@4.0.200` and `@remotion/zod-types@4.0.200` must **not** be added at version `4.0.200` — Remotion requires all `remotion`/`@remotion/*` packages to be on the *same* version. If `PromoTemplate` is used, `@remotion/transitions` must be added at **`4.0.499`**, and `@remotion/google-fonts` at **`4.0.499`** if the Inter font is kept. `zod@3.22.3` and `@remotion/zod-types` are **not needed at all** for the render path (zod schemas are Studio-only metadata — the web-renderer can take a plain `schema` object or none).
- **Repo 1 (81/81) — no bump required.** No `package.json` means nothing to bump. All 81 use only `useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`, `random` from `remotion`, which have been stable since Remotion 4.0.0.

**Hard rule to encode in the integration:** every `remotion` and `@remotion/*` package in this repository must stay at `4.0.499`. When lifting a template from repo 2 or repo 3, lift the **component source only**; never the source repo's `package.json`.

---

## 6. Can these templates run through this repository's existing browser export engine?

### 6.1 How this repo renders in the browser

`src/shared/personalization/webExport.ts` calls `@remotion/web-renderer`'s `renderMediaOnWeb()` **in the browser** — no server, no render worker, no headless browser:

```ts
const result = await renderer.renderMediaOnWeb({
  composition: {
    id: PERSONALIZATION_COMPOSITION_ID,     // 'PersonalizationComposition'
    component: PersonalizationComposition,  // a plain React component reference
    width, height, fps, durationInFrames,    // from settings
    defaultProps: inputProps,
  },
  inputProps,
  container: plan.profile.container,        // 'mp4' | 'webm'
  videoCodec: plan.profile.videoCodec,      // 'h264' | 'vp9' | 'vp8'
  audioCodec: plan.audioCodec,              // 'aac' | 'opus' | 'vorbis' | null
  muted: plan.muted,
  signal: controller.signal,
  onProgress: (p) => onProgress?.(clampProgress(p.progress)),
})
```

`src/shared/personalization/finalOutput.ts` decides the profile (`chooseWebExportProfile`) and defines the "branded-render" path: overlays are composited **into** the customer's existing video and re-encoded locally in the browser.

### 6.2 What the web-renderer supports (verified against the installed `@remotion/web-renderer@4.0.499`)

| Capability | Supported? | Evidence |
|---|---|---|
| Composition as a **plain component reference** (no `Root.tsx`, no `<Composition>` registration) | ✅ | `render-media-on-web.d.ts` → `composition: CompositionCalculateMetadataOrExplicit<Schema, Props>` with `component: LooseComponentType<Props>` |
| `calculateMetadata` | ✅ **Yes** | The implementation calls `Internals.resolveVideoConfig({ calculateMetadata: composition.calculateMetadata ?? null, … })` — so a template's own `calculateMetadata` **is** honoured, provided the caller passes it in the `composition` object |
| `width`/`height`/`fps`/`durationInFrames` explicit | ✅ | `MandatoryDimensions` branch |
| `schema` (zod) | ✅ optional | `schema: Schema \| undefined` |
| **Transparent / alpha video** | ✅ optional | `transparent: boolean` + `canRenderMediaOnWeb({ transparent })` + a `'transparent-video-unsupported'` capability issue |
| `inputProps` | ✅ plain JSON-serialisable data only | `InputPropsIfHasProps` → `inputProps: z.input<Schema> & Props` |
| `frameRange` (render only part of the timeline) | ✅ | `frameRange: FrameRange \| null` |
| `pageResponsiveness` (wait for fonts/layout) | ✅ | `'disabled' \| 'low' \| 'medium' \| 'high' \| number` |
| `<Sequence>` / `<Series>` | ⚠ **works, but only because this repo already provides a `SequenceManager` shim** | See §6.4 |
| `delayRender` / `continueRender` (async asset load) | ✅ | `waitForReady` + `DelayRenderScope` in the implementation |
| `backdrop-filter`, `mix-blend-mode`, CSS filters | ❌ **lost** | The renderer composites through `OffscreenCanvasRenderingContext2D` (`compose.d.ts`) / HTML-in-canvas. There is no real backdrop behind the element, so `backdrop-filter: blur()` has nothing to blur |
| CSS `@keyframes` animations | ❌ **not frame-accurate** | CSS animations run on wall-clock time, not on `useCurrentFrame()`. Output is non-deterministic between runs |

### 6.3 Per-template verdicts (summary)

| Verdict | Count | Which |
|---|---:|---|
| ✅ **Works as-is** | **112** | All 61 usable repo-1 templates except `ken-burns`, `parallax-pan`, `zoom-pulse`; all 44 non-pixel repo-2 templates; the 6 pixel-kit repo-2 templates (with `src/pixel-kit/` helper); 6 of repo 3 |
| ⚠ **Works with a small, well-understood change** | **5** | repo 1: `ken-burns`, `parallax-pan`, `zoom-pulse`; repo 3: `LogoIntro`, `PromoTemplate` |
| ⚠ **Works but with a fidelity caveat** | **5** | repo 2: `lower-third-glass-card` (`backdrop-filter` lost), `community-chat` / `social-reel` / `flip-page-transition` (need the `SequenceManager` shim, already present), repo 3: `KineticText` (`Sequence` + font) |
| ❌ **Blocked** | **6** | repo 1 premium tier: `area-chart`, `chart-animation`, `comparison-chart`, `donut-chart`, `progress-bars`, `stat-counter` |

(The verdicts overlap: a template can carry more than one flag — e.g. `PromoTemplate` is both a fidelity caveat and a small change, and `lower-third-glass-card` is both a fidelity caveat and an overlay adaptation. The 118 usable templates are 112 usable-as-is + 5 needing a small change + 1 needing a rewrite, with the fidelity-caveat flags applying on top.)

### 6.4 The five concrete engineering constraints

**(a) `calculateMetadata` is supported — but the current call site does not pass it.**
`webExport.ts` passes an explicit `durationInFrames` and no `calculateMetadata`. Repo 3's `LowerThirds`, `KineticText`, `BarChartRace`, `LineChart`, `CaptionedShort` and `PromoTemplate` all derive their duration from their props via `calculateMetadata`. Either
  (i) add `calculateMetadata` to the `composition` object in `webExport.ts` (the web-renderer will call it), or
  (ii) compute the duration in the caller and pass `durationInFrames`.
Option (i) is the correct fix and requires only that the composition spec type in `webExport.ts` be widened to allow `calculateMetadata`.

**(b) `staticFile()` does not work in the browser export path.**
Repo 3's `LogoIntro` and `PromoTemplate` call `staticFile(logoSrc)` / `staticFile(screenshot)`. `staticFile()` resolves against a Remotion *project's* `public/` directory via a bundler-time constant; the browser export path has no `public/` directory and no Remotion bundler. **Fix:** the props are already plain strings — change `staticFile(x)` to `x` and pass an absolute URL (the same mechanism this repo already uses for `brand.logoUrl` / `brand.productUrl` in `PersonalizationComposition`). The shipped `public/logo.svg` and `public/screenshot-*.svg` would then need to be hosted alongside the app (or replaced by the customer's own logo/imagery, which is the real intent for a personalization product).

**(c) `@remotion/google-fonts` adds a network dependency at render time.**
Repo 3's `src/lib/fonts.ts` calls `loadFont("normal", { weights: [...], subsets: ["latin"] })` for Inter. `loadFont` registers a `delayRender` handle and fetches the CSS + `woff2` from `fonts.googleapis.com`/`fonts.gstatic.com`. In a browser this works (the browser has network), but it means:
  - the export now depends on a third-party network call, which can fail or be slow;
  - it is a third-party request in a product whose export is otherwise 100% local;
  - the fetch must complete before the first frame, so the render's first frames wait on it.
**Recommendation:** do not import `src/lib/fonts.ts`; substitute this repo's own `fontStackById()` CSS font stack (`src/shared/personalization/preview/presets.ts`), which is what `PersonalizationComposition` already uses. This keeps the export fully offline and consistent with the preview.

**(d) `<Sequence>` needs a `SequenceManager` provider — and the current shim provides one, but it must stay in place.**
Remotion's `SequenceManager` context (`remotion/dist/cjs/SequenceManager.js`) has a **default value whose `registerSequence` throws** `"SequenceManagerContext not initialized"`. The real provider lives in `RemotionRoot`, which is used by the Studio and the server renderer. The web-renderer does **not** use `RemotionRoot` — it mounts `Internals.RemotionRootContexts` + `Internals.CompositionManager.Provider` only, and the string `SequenceManager` does not appear anywhere in `@remotion/web-renderer@4.0.499`.
**This repo already handles it correctly**: `PersonalizationComposition` wraps its whole tree in `Internals.SequenceManager.Provider value={NOOP_SEQUENCE_MANAGER}` (`src/shared/personalization/preview/PersonalizationComposition.tsx:349`), whose `registerSequence`/`unregisterSequence` are no-ops. `<Sequence>` computes its own timing from `from`/`durationInFrames` via the separate `SequenceContext`, so a no-op manager renders correctly.
**Rule for integration:** any template using `<Sequence>` (repo 2: `community-chat`, `flip-page-transition`, `social-reel`; repo 3: `KineticText`, and `PromoTemplate` via `TransitionSeries`) **must be rendered as a descendant of that provider**. Do not remove the shim, and do not render such a template through a path that bypasses `PersonalizationComposition`. Because `TransitionSeries` also nests `Sequence`s, `PromoTemplate` inherits the same requirement.

**(e) `backdrop-filter` and CSS filters are lost.**
`lower-third-glass-card` (repo 2) is built around `backdropFilter: "blur(14px)"` over a frosted-glass panel. Canvas compositing has no backdrop, so the glass renders as a flat translucent panel. It still renders and still animates — the frosted look is simply lost. Repo 1 uses `backdropFilter` in 3 templates (`bubble-pop-text`, `sound-wave`, `subscribe-reminder`); repo 2 in 1 (`lower-third-glass-card`); repo 3 in 1 (`LowerThirds/styles.tsx`). **No template is blocked by this**, but a glass-morphism lower third will not look like its preview in the exported file.

### 6.5 Aspect-ratio behaviour

This repo's `settings.width`/`settings.height` come from the selected source video, and the four supported ratios are `16:9`, `9:16`, `1:1`, `4:5` (`src/shared/personalization/preview/types.ts` → `PREVIEW_ASPECT_RATIOS`). The web-renderer renders at exactly `settings.width × settings.height`.

- **Repo 1 templates are 16:9-only in practice.** They hardcode pixels and `rem` units tuned for 1920×1080 (`fontSize: "1.8rem"`, `left: 40`, `bottom: "20%"`). `rem` resolves against the browser root font size (16px), not the composition size, so at 1080×1920 a "headline" stays 80px tall and a `bottom: 20%` lower third lands in a different place. Only 12 of 81 read `width`/`height` from `useVideoConfig()` and lay out proportionally (`bokeh-circles`, `credits-roll`, `geometric-patterns`, `gradient-shift`, `grid-pulse`, `liquid-wave`, `matrix-rain`, `noise-grain`, `particle-explosion`, `pixel-transition`, `sound-wave`, `starfield`). **A 9:16 or 1:1 export of a repo-1 template will look wrong.**
- **Repo 2 templates are resolution-adaptive.** 20 of 50 lay out from `width`/`height` returned by `useVideoConfig()` (`cardW = width * 0.42`, `fontSize = height * 0.058`, …), and the remaining 30 use `AbsoluteFill` + percentage/flex layout that reflows. **Repo 2 is the only repository whose templates can be trusted at 9:16 and 1:1** — which matters because the personalization flow offers 9:16 and 1:1.
- **Repo 3 templates are resolution-adaptive** (they use `useVideoConfig()`), and `CaptionedShort` is authored natively at 1080×1920 (9:16) with a `SHORT_SAFE_AREA` inset for platform UI.

### 6.6 What the export engine can and cannot express today

`webExport.ts` currently always produces a **single opaque file** containing the source video plus the overlays. `@remotion/web-renderer@4.0.499` also supports `transparent: true` (alpha video, WebM/VP9) — `canRenderMediaOnWeb({ transparent: true })` returns a `'transparent-video-unsupported'` capability issue on browsers that cannot do it, and `chooseWebExportProfile` / `webExport.ts` do not currently request it. If a *separate transparent overlay file* is ever wanted (so the customer can re-composite it in another editor), `transparent: true` is the native mechanism and it needs a small addition to `webExport.ts` + `finalOutput.ts`.

---

## 7. The five required integration archetypes

### 7.1 Summary of recommendations

| # | Archetype | **Best candidate** | Repo + path | Over video? | Through browser export? |
|---|---|---|---|---|---|
| 1 | Animated headline | **`bounce-in-headline`** | `free-remotion-templates` → `src/components/bounce-in-headline/BounceInHeadline.tsx` | ⚠ No — paints full frame; remove the background | ✅ Yes, as-is |
| 2 | Logo reveal | **`logo-mask-wipe`** | `free-remotion-templates` → `src/components/logo-mask-wipe/LogoMaskWipe.tsx` | ⚠ No — paints full frame; remove the background | ✅ Yes, as-is |
| 3 | Lower third | **`lower-third-glass-card`** | `free-remotion-templates` → `src/components/lower-third-glass-card/LowerThirdGlassCard.tsx` | ⚠ No — paints full frame; remove the background | ✅ Yes, with `backdrop-filter` fidelity caveat |
| 4 | Promotional CTA | **`social-reel`** | `free-remotion-templates` → `src/components/social-reel/SocialReel.tsx` | ⚠ No — paints full frame | ⚠ Yes, but needs the `SequenceManager` shim (already present) |
| 5 | Compatible visual effect | **`particle-explosion`** | `remotion-templates` → `templates/particle-explosion.tsx` | ✅ **Yes — transparent by design** | ✅ Yes, as-is |

**Why repo 2 for archetypes 1–4.** Repo 2's components are the only ones with **typed, JSON-serialisable props** (which is what `renderMediaOnWeb({ inputProps })` requires) **and** resolution-adaptive layout derived from `useVideoConfig()` (which is what the 9:16 / 1:1 outputs need). Repo 1's equivalent components have **zero props** — `lower-third.tsx` literally contains the strings `"John Smith"` and `"Senior Producer"`, and `logo-*-reveal.tsx` all contain a hardcoded `"Company Name"` — so they would have to be rewritten before they could be driven by a personalization flow at all. Repo 3's equivalents (`KineticText`, `LogoIntro`, `LowerThirds`, `PromoTemplate`) need `staticFile()` and/or a Google-Fonts network fetch removed first.

**Why repo 1 for archetype 5.** `particle-explosion.tsx` is genuinely transparent — its root element is `width, height, position: "relative"` with **no background**, and the particles are drawn with a seeded `random()` PRNG so the effect is deterministic and frame-accurate. It is the only template in the entire 138 that is *simultaneously* (a) transparent, (b) a real visual effect rather than a text card, and (c) free of any *remote asset* dependency — the only hardcoded content is a decorative `TEXT = "BOOM!"` string, which is a one-line deletion. Repo 2's effect-like templates (`fireworks-burst`, `particle-snow`, `pencil-draw`, `camera-shake`) all paint an `AbsoluteFill` background, and repo 1's other transparent effects (`geometric-patterns`, `matrix-rain`, `liquid-wave`, `pixel-transition`) are opaque or full-bleed.

### 7.2 Detail per archetype

#### Archetype 1 — Animated headline

**Winner: `bounce-in-headline`**
**Source:** `free-remotion-templates` → `src/components/bounce-in-headline/BounceInHeadline.tsx`
**Licence:** `MIT License` / `Copyright (c) 2026 Trimora Inc.` — compatible.

- **Props the integration would drive:** `headline: string` (the copy), `background: string`, `color: string`, `bounces: number`, `height: number`, `delay: number`, `duration: number`. All plain JSON — pass straight through as `inputProps`.
- **Assets it needs:** none. System font stack only (`-apple-system, "Segoe UI", Roboto, sans-serif`); no fonts, images, video or audio bundled.
- **Over a video?** **No, as shipped.** Its root is `<AbsoluteFill style={{ backgroundColor: background, … }}>`, so it paints the whole frame. **To place it over the existing video, remove that one `backgroundColor` line** (or set the layer's `background` to `transparent`) and render it as a child of `PersonalizationComposition` above the `<Video>` layer, with the layer's `x`/`y`/`scale` driving placement. The word-by-word bounce itself is `spring()`-driven, so it stays frame-accurate once the background is gone.
- **Through the browser export engine?** **Yes, as-is** (after the background removal). It uses only `useCurrentFrame`, `useVideoConfig`, `interpolate`, `spring`, `AbsoluteFill` — all in `4.0.499`. No `Sequence`, no `staticFile`, no `calculateMetadata`, no webfont, no `backdrop-filter`. Layout is `height`-derived, so it scales to 9:16 / 1:1.
- **Alternative if the background must stay:** `remotion-templates` → `templates/glitch-text.tsx` is a genuine transparent text overlay (root: `position:absolute; top:50%; left:50%`, no background) that works over a video as-is — but it has **zero props** (the copy is hardcoded) and is 16:9-only. It is a design reference, not a drop-in. Note that repo 1's `bounce-text.tsx` is **not** a transparent overlay: its root paints a `linear-gradient(45deg, #1e3a8a, #3b82f6)` card.

#### Archetype 2 — Logo reveal

**Winner: `logo-mask-wipe`**
**Source:** `free-remotion-templates` → `src/components/logo-mask-wipe/LogoMaskWipe.tsx`
**Licence:** `MIT License` / `Copyright (c) 2026 Trimora Inc.` — compatible.

- **Props the integration would drive:** `backgroundColor: string`, `accentColor: string`, `textColor: string`, `monogram: string` (the logo letter/mark), `brandText: string` (the business name). The customer's `brand.logoUrl` would have to be rendered separately as an `<Img>` layer — this template draws the logo as **inline SVG geometry**, not from an image, so it is a *wordmark/monogram* reveal rather than an *image* logo reveal. If the customer must use their own raster logo, `logo-bounce-drop` (which takes an `svgPath: string` prop for the mark's path) is the closer fit.
- **Assets it needs:** none (inline SVG mask geometry). No fonts, images or video.
- **Over a video?** **No, as shipped** — `<AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>`. Remove the background to make it an overlay; the diagonal mask wipe is a `clip-path`/gradient reveal and is position-independent, so it can sit anywhere in the frame.
- **Through the browser export engine?** **Yes, as-is** (after the background removal). `useCurrentFrame`, `useVideoConfig`, `interpolate`, `AbsoluteFill` only. No `Sequence`, no `staticFile`, no `calculateMetadata`.
- **Alternative — and the better fit if a *raster* logo is required:** `remotion-templates` → `templates/logo-fade-reveal.tsx` is the most conventional logo reveal, but again it has **zero props** and a hardcoded `"Company Name"`, and it paints a full-frame `#111827` background. Repo 1's whole `Logo & Branding` block (9 templates) is unusable as-is for a *personalized* product for exactly this reason.
- **Alternative for an image logo:** `remotion-video-templates` → `src/templates/LogoIntro/LogoIntro.tsx` renders a real logo **image** via `<Img src={staticFile(logoSrc)}>` with a particle burst. It is the only candidate in the 138 that takes an actual logo *file*. **But it is NOT browser-export-ready**: `staticFile()` must become an absolute URL, and it is full-scene by design. It would need work, so `logo-mask-wipe` is the recommended starting point.

#### Archetype 3 — Lower third

**Winner: `lower-third-glass-card`**
**Source:** `free-remotion-templates` → `src/components/lower-third-glass-card/LowerThirdGlassCard.tsx`
**Licence:** `MIT License` / `Copyright (c) 2026 Trimora Inc.` — compatible.

- **Props the integration would drive:** `nameText: string` (speaker name), `titleText: string` (role/job title), `backgroundColor: string`, `accentColor: string`, `textColor: string`. All JSON-serialisable.
- **Assets it needs:** none. System font stack only.
- **Over a video?** **No, as shipped** — the root is `<AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>` plus a full-frame "ambient backdrop wash" gradient (a `radial-gradient` at 120%×90% from the bottom-left). **Both must be removed** for a true overlay: the `AbsoluteFill` background and the backdrop-wash div. The card itself is already positioned as a lower third — `cardX = width * 0.06`, `restY = height * 0.74`, `cardW = width * 0.42`, `cardH = height * 0.2` — so it lands correctly over a 16:9 video and scales with `useVideoConfig()`.
- **Through the browser export engine?** **Yes, with one fidelity caveat.** The card is built around `backdropFilter: "blur(14px)"` / `WebkitBackdropFilter`. The web-renderer composites through an `OffscreenCanvasRenderingContext2D` (or HTML-in-canvas), so there is no real backdrop to blur: the frosted-glass effect degrades to a flat translucent panel. It still renders and still animates. If the glass look matters, use the **repo 3** lower third instead (`src/templates/LowerThirds/LowerThirds.tsx`), which draws opaque shapes rather than blurring a backdrop — but that one needs `calculateMetadata` wired in and the Google-Fonts import removed.
- **Alternative:** `remotion-templates` → `templates/lower-third.tsx` — the canonical "news lower third", and the **only** lower third among the 138 with *no props at all*: the name and title are hardcoded literals (`"John Smith"` / `"Senior Producer"`), its root paints a full-frame `linear-gradient(180deg, #111827, #1f2937)`, and it is 16:9-only. Unusable as-is for a personalized product; useful as a motion-design reference.
- **Note:** repo 3's `LowerThirds` component also ships a `StageBackground` (a decorative "LOWER THIRDS" label on a gradient) that exists only to make the Studio preview legible — it must be removed for a real overlay.

#### Archetype 4 — Promotional CTA

**Winner: `social-reel`**
**Source:** `free-remotion-templates` → `src/components/social-reel/SocialReel.tsx`
**Licence:** `MIT License` / `Copyright (c) 2026 Trimora Inc.` — compatible.

- **Props the integration would drive:** `brandName: string`, `handle: string`, `headline: string`, `headlineAccent: string`, `secondCopy: string`, `infoLines: string[]`, `ctaText: string`, `accentColor: string`, `bgFrom: string`, `bgVia: string`, `bgTo: string`, `caption: string`, `likeCount: string`. This is the richest CTA-shaped prop set in the 138 and maps almost 1:1 onto this repo's `PreviewInputProps['brand']` (`businessName`, `headline`, `offer`, `cta`, `phone`, `website`) and `PreviewInputProps['settings']['brandColors']` (`primary`, `accent`, `text`).
- **Assets it needs:** none. System font stack; all decoration is CSS gradients and inline SVG.
- **Over a video?** **No, as shipped** — `<AbsoluteFill>` with a three-stop `bgFrom → bgVia → bgTo` gradient. Remove the background (and, for a real overlay, the outer frame chrome) to place the CTA block over the video. The `ctaText` pill is a self-contained element that maps cleanly onto this repo's existing `layer.kind === 'cta'` rendering in `PersonalizationComposition` (`src/shared/personalization/preview/PersonalizationComposition.tsx:400-419`), so the *simplest* integration is to reuse the existing CTA layer and take only the *motion* from `social-reel`.
- **Through the browser export engine?** **Yes, but it uses `<Sequence>`** (for the progressive reveal of the headline/info lines). `<Sequence>` requires a `SequenceManager` provider — which `PersonalizationComposition` already supplies via the `NOOP_SEQUENCE_MANAGER` shim at `PersonalizationComposition.tsx:349`. As long as the template is rendered as a descendant of that provider, it works. It also uses `useCurrentFrame`/`useVideoConfig`/`interpolate`/`spring` only otherwise — no `staticFile`, no `calculateMetadata`, no webfont, no `backdrop-filter`.
- **Alternative — a true end-card CTA:** `remotion-templates` → `templates/end-card.tsx` (an "outro with subscribe CTA") and `free-remotion-templates` → `src/components/end-card/EndCard.tsx` (props: `text`, `delay`, `fillColor`, `labelColor`, `fontSize`). Both are full-scene outros with hardcoded or nearly-hardcoded copy. `subscribe-reminder` in repo 1 is a *floating* subscribe nudge but again paints a full-frame `#111827` and hardcodes the handle.
- **Alternative for a product promo (full-scene, not overlay):** `remotion-video-templates` → `src/templates/PromoTemplate/PromoTemplate.tsx` — props `productName`, `tagline`, `features[]`, `screenshots[]`, `cta`, `accentColor`; it is the closest thing to a "promotional CTA" in the 138, but it needs `staticFile()` removed **and** `@remotion/transitions` added at `4.0.499` **and** it is a multi-scene full-frame promo (hook → features → CTA), not an overlay.

#### Archetype 5 — A compatible visual effect

**Winner: `particle-explosion`**
**Source:** `remotion-templates` → `templates/particle-explosion.tsx`
**Licence:** MIT per the repo README (**no `LICENSE` file in the repo** — see §4.2) and the per-file header "Free Remotion Template Component … Credit appreciated but not required. Created by the team at https://www.reactvideoeditor.com".

- **Props the integration would drive:** **none** — the component takes no props; the particle count (`PARTICLE_COUNT = 150`) and the word (`TEXT = "BOOM!"`) are module constants. Using it as-is means also stripping the "BOOM!" text (or accepting a generic burst). The seeded PRNG (`random(i)`) makes the burst deterministic and frame-accurate, which is why it is the right *effect* to lift even though it needs a small edit.
- **Assets it needs:** none. Pure CSS/React; no fonts, images, video or audio.
- **Over a video?** **Yes — by design.** Its root element is `{ width, height, position: "relative" }` with **no background**, and the particles are absolutely-positioned translucent dots. It composites cleanly over existing footage. This is the only archetype-5 candidate that is *already* overlay-friendly.
- **Through the browser export engine?** **Yes, as-is.** `useCurrentFrame`, `useVideoConfig`, `spring`, `random` only. No `Sequence`, no `staticFile`, no `calculateMetadata`, no `AbsoluteFill` background, no webfont, no `backdrop-filter`, no CSS `@keyframes`.
- **Caveats:** (i) it is 16:9-oriented (its geometry comes from `width`/`height` so it does scale, but the particle count is tuned for a 1080p frame); (ii) it has hardcoded copy; (iii) it carries repo 1's "no `LICENSE` file" documentation gap.
- **Alternative — the strongest *transparent* text effect:** `remotion-templates` → `templates/glitch-text.tsx` (root: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)`, no background). It is a true overlay and its RGB-split glitch decays deterministically. It also has **zero props** (hardcoded copy) and is 16:9-fixed.
- **Alternative with props (not transparent, but the closest repo-2 effect):** `free-remotion-templates` → `src/components/whip-pan/WhipPan.tsx` (props `scenes: WhipPanScene[]`, `panLeft: boolean`, `maxBlur: number`). It applies `filter: blur()` to a scene list — a per-element CSS filter that **does** survive canvas compositing — but its root still paints `backgroundColor: scene.background`, so it needs the same one-line background removal as the other repo-2 templates. **No repo-2 or repo-3 template is transparent as shipped** (all 57 paint a full-frame background); the 13 in §7.3 are the complete set of overlay-capable templates in the entire 138.
- **Explicitly rejected:** repo 2's `fireworks-burst`, `particle-snow`, `pencil-draw`, `camera-shake`, `whip-pan` and repo 1's `film-burn`, `noise-grain`, `vignette-pulse`, `spotlight-reveal` all paint an opaque `AbsoluteFill` / full-frame background and would have to be modified before they could sit over a video. **Repo 2 and repo 3 have no transparent template at all** — 0 of 57.

### 7.3 The complete list of transparent / overlay-capable templates (13 in repo 1, 0 elsewhere)

These are the only templates in the 138 whose root element paints no background. **All 13 are zero-prop**, and all 13 are 16:9-fixed. Every one was verified by reading its root element.

| Template | Repo path | Transparent root | Really an overlay? | Usable as a personalized overlay? |
|---|---|---|---|---|
| `animated-text` | `templates/animated-text.tsx` | `<span>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `card-flip` | `templates/card-flip.tsx` | `<div>` — no bg (3D perspective wrapper) | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `bubble-pop-text` | `templates/bubble-pop-text.tsx` | `<span>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `floating-bubble-text` | `templates/floating-bubble-text.tsx` | `<div>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `glitch-text` | `templates/glitch-text.tsx` | `<div>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `popping-text` | `templates/popping-text.tsx` | `<span>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `pulsing-text` | `templates/pulsing-text.tsx` | `<div>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `slide-text` | `templates/slide-text.tsx` | `<div>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `typewriter-subtitle` | `templates/typewriter-subtitle.tsx` | `<span>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `animated-list` | `templates/animated-list.tsx` | `<div>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `circular-progress` | `templates/circular-progress.tsx` | `<div>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `sound-wave` | `templates/sound-wave.tsx` | `<div>` — no bg (uses `backdropFilter`) | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `particle-explosion` | `templates/particle-explosion.tsx` | `<div>` — no bg | ✅ Yes | ⚠ zero props, 16:9-fixed |
| `ken-burns` | `templates/ken-burns.tsx` | `<div>` — no bg, but fills the frame with an image | ❌ No — replaces the video | ❌ CSS `@keyframes` not frame-accurate |
| `parallax-pan` | `templates/parallax-pan.tsx` | `<div>` — no bg, but fills the frame with an image | ❌ No — replaces the video | ❌ `next/image` + CSS `@keyframes` |
| `zoom-pulse` | `templates/zoom-pulse.tsx` | `<div>` — no bg, but fills the frame with an image | ❌ No — replaces the video | ❌ `next/image` + CSS `@keyframes` |
| `liquid-wave` | `templates/liquid-wave.tsx` | `<svg style={{ background: "#111827" }}>` | ❌ No — opaque full-bleed | ❌ |
| `pixel-transition` | `templates/pixel-transition.tsx` | `<div style={{ background: "#0f172a" }}>` | ❌ No — opaque full-bleed | ❌ |
| `matrix-rain` | `templates/matrix-rain.tsx` | `<div style={{ background: linear-gradient(...) }}>` | ❌ No — opaque full-bleed | ❌ |
| `geometric-patterns` | `templates/geometric-patterns.tsx` | `<div style={{ background: linear-gradient(...) }}>` | ❌ No — opaque full-bleed | ❌ |
| `bounce-text` | `templates/bounce-text.tsx` | `<div style={{ background: linear-gradient(45deg, #1e3a8a, #3b82f6) }}>` | ❌ No — opaque gradient card | ❌ |
| `text-highlight` | `templates/text-highlight.tsx` | `<div style={{ background: linear-gradient(180deg, #111827, #1f2937) }}>` | ❌ No — opaque full-bleed | ❌ |
| `noise-grain` | `templates/noise-grain.tsx` | `<div>` root has no bg, but a child paints `inset: 0` full-frame gradient | ❌ No — opaque full-bleed child | ❌ |

---

## 8. Full inventory — Repo 1: `deangilmoreremix/remotion-templates`

**Source:** `https://github.com/deangilmoreremix/remotion-templates` · **Branch/commit:** `main` @ `6209b72` ("Merge pull request #2 from reactvideoeditor/feat/expand-to-81-templates")  
**Licence:** MIT (README) — no `LICENSE` file · **Remotion:** unpinned (no `package.json`) · **Deps:** `remotion` only (except 2 files using `next/image` and 3 using `styled-jsx`)  
**In the reactvideoeditor.com gallery:** ✅ **all 81** appear in the gallery (75 as `tier: "free"`, 6 as `tier: "pro"`).

| # | Template | Source path | Licence | Design category | Role | Editable props | Required assets | Dependencies | Aspect ratios | Over existing video? | Intro/outro, transition, effect or full-scene? | Browser export engine? |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Animated List**<br><sub>Staggered list item entrance</sub> | `templates/animated-list.tsx` | MIT (README, no LICENSE file) | Content Animation | Content animation | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed (maxWidth 600px) | Yes — transparent | Effect (content) | Yes |
| 2 | **Animated Text**<br><sub>Character-by-character text reveal</sub> | `templates/animated-text.tsx` | MIT (README, no LICENSE file) | Text | Headline / text effect | **None** (all copy/colour hardcoded) | None (system font) | `remotion` only | 16:9 fixed (rem units) | Yes — transparent | Effect (text) | Yes |
| 3 | **Area Chart**<br><sub>Gradient-filled area under a line, revealing left to right</sub> | `templates/area-chart.tsx` | ⚠ **MIT (README) BUT vendor catalogue says `tier: "pro"` — treat as paid** | Charts & Data | Full-scene (data viz) | **None** (all copy/colour hardcoded) | None (inline SVG) | `remotion` only | 16:9 fixed | No | Full-scene | Blocked — premium/pro tier |
| 4 | **Blinds Transition**<br><sub>Horizontal blinds opening</sub> | `templates/blinds-transition.tsx` | MIT (README, no LICENSE file) | Transition | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |
| 5 | **Bokeh Circles**<br><sub>Floating soft circles with drift</sub> | `templates/bokeh-circles.tsx` | MIT (README, no LICENSE file) | Background | Background / ambient | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 (uses width/height) | No | Full-scene (background) | Yes |
| 6 | **Bounce Text**<br><sub>Spring bounce entrance for titles</sub> | `templates/bounce-text.tsx` | MIT (README, no LICENSE file) | Text | Headline / text effect | **None** (all copy/colour hardcoded) | None (system font) | `remotion` only | 16:9 fixed (rem units) | No — paints a gradient card | Effect (text) | Yes |
| 7 | **Bubble Pop Text**<br><sub>Characters pop in inside bubbles</sub> | `templates/bubble-pop-text.tsx` | MIT (README, no LICENSE file) | Text | Headline / text effect | **None** (all copy/colour hardcoded) | None (system font) | `remotion` only | 16:9 fixed (rem units) | Yes — transparent | Effect (text) | Yes |
| 8 | **Camera Shake**<br><sub>Decaying shake for impact moments</sub> | `templates/camera-shake.tsx` | MIT (README, no LICENSE file) | Cinematic | Cinematic effect | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Effect | Yes |
| 9 | **Card Flip**<br><sub>3D card flip with front/back content</sub> | `templates/card-flip.tsx` | MIT (README, no LICENSE file) | Content Animation | Content animation | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed (300×400 card) | Yes — transparent | Effect (content) | Yes |
| 10 | **Chapter Title**<br><sub>Chapter number with extending lines</sub> | `templates/chapter-title.tsx` | MIT (README, no LICENSE file) | Intro & Outro | Intro / section title (full-scene) | **None** (all copy/colour hardcoded) | None (hardcoded title) | `remotion` only | 16:9 fixed | No — paints full frame | Intro (title card) | Yes (needs hardcoded text replaced) |
| 11 | **Bar Chart**<br><sub>Animated SVG bar chart with staggered bar growth</sub> | `templates/chart-animation.tsx` | ⚠ **MIT (README) BUT vendor catalogue says `tier: "pro"` — treat as paid** | Charts & Data | Full-scene (data viz) | **None** (all copy/colour hardcoded) | None (inline SVG) | `remotion` only | 16:9 fixed | No | Full-scene | Blocked — premium/pro tier |
| 12 | **Cinematic Title Intro**<br><sub>Title spring-in with growing underline</sub> | `templates/cinematic-title-intro.tsx` | MIT (README, no LICENSE file) | Intro & Outro | Intro (full-scene) | **None** (all copy/colour hardcoded) | None (hardcoded title) | `remotion` only | 16:9 fixed | No — paints full frame | Intro (countdown) | Yes (needs hardcoded text replaced) |
| 13 | **Circular Progress**<br><sub>Animated progress ring with percentage</sub> | `templates/circular-progress.tsx` | MIT (README, no LICENSE file) | Charts & Data | Effect / graphic | **None** (all copy/colour hardcoded) | None (inline SVG) | `remotion` only | 16:9 (SVG 160px fixed) | Yes — transparent | Effect (graphic) | Yes |
| 14 | **Clock Wipe**<br><sub>Radial clock-hand sweep</sub> | `templates/clock-wipe.tsx` | MIT (README, no LICENSE file) | Transition | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |
| 15 | **Comparison Chart**<br><sub>Side-by-side before/after metric comparison</sub> | `templates/comparison-chart.tsx` | ⚠ **MIT (README) BUT vendor catalogue says `tier: "pro"` — treat as paid** | Charts & Data | Full-scene (data viz) | **None** (all copy/colour hardcoded) | None (inline SVG) | `remotion` only | 16:9 fixed | No | Full-scene | Blocked — premium/pro tier |
| 16 | **Countdown Intro**<br><sub>Ring countdown 3-2-1-GO</sub> | `templates/countdown-intro.tsx` | MIT (README, no LICENSE file) | Intro & Outro | Intro (full-scene) | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No — paints full frame | Intro (countdown) | Yes |
| 17 | **Countdown Timer**<br><sub>5-4-3-2-1-GO with spring scale</sub> | `templates/countdown-timer.tsx` | MIT (README, no LICENSE file) | Content Animation | Content animation | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Effect (content) | Yes |
| 18 | **Credits Roll**<br><sub>Scrolling movie-style credits</sub> | `templates/credits-roll.tsx` | MIT (README, no LICENSE file) | Intro & Outro | Outro (full-scene) | **None** (all copy/colour hardcoded) | None (hardcoded credits) | `remotion` only | 16:9 (uses width/height) | No | Outro (credits) | Yes (needs hardcoded text replaced) |
| 19 | **Cross Dissolve**<br><sub>Classic cross-fade between scenes</sub> | `templates/cross-dissolve.tsx` | MIT (README, no LICENSE file) | Transition | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |
| 20 | **Donut Chart**<br><sub>Ring chart with animated segments and centre metric</sub> | `templates/donut-chart.tsx` | ⚠ **MIT (README) BUT vendor catalogue says `tier: "pro"` — treat as paid** | Charts & Data | Full-scene (data viz) | **None** (all copy/colour hardcoded) | None (inline SVG) | `remotion` only | 16:9 fixed | No | Full-scene | Blocked — premium/pro tier |
| 21 | **End Card**<br><sub>Outro with subscribe CTA</sub> | `templates/end-card.tsx` | MIT (README, no LICENSE file) | Intro & Outro | Outro / end card (full-scene) | **None** (all copy/colour hardcoded) | None (hardcoded CTA/handle) | `remotion` only | 16:9 fixed | No — paints full frame | Outro (end card) | Yes (needs hardcoded text replaced) |
| 22 | **Fade Through Black**<br><sub>Dip to black between scenes</sub> | `templates/fade-through-black.tsx` | MIT (README, no LICENSE file) | Transition | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |
| 23 | **Film Burn**<br><sub>Warm light leak overlay</sub> | `templates/film-burn.tsx` | MIT (README, no LICENSE file) | Cinematic | Cinematic effect / overlay | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Effect (overlay) | Yes |
| 24 | **Floating Text Chip**<br><sub>Floating label with sine-wave wobble</sub> | `templates/floating-bubble-text.tsx` | MIT (README, no LICENSE file) | Text | Headline / text effect | **None** (all copy/colour hardcoded) | None (system font) | `remotion` only | 16:9 fixed (rem units) | Yes — transparent | Effect (text) | Yes |
| 25 | **Gallery Grid**<br><sub>Staggered 2x3 grid reveal</sub> | `templates/gallery-grid.tsx` | MIT (README, no LICENSE file) | Image & Media | Full-scene (media grid) | **None** (all copy/colour hardcoded) | Remote image URLs (Pexels) | `remotion` only | 16:9 fixed | No | Full-scene | Yes (needs hardcoded image URLs) |
| 26 | **Geometric Patterns**<br><sub>Rotating/scaling geometric shapes</sub> | `templates/geometric-patterns.tsx` | MIT (README, no LICENSE file) | Background | Background / ambient | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 (uses width/height) | No — opaque full-bleed | Full-scene (background) | Yes |
| 27 | **Glitch Text**<br><sub>RGB split glitch with decay</sub> | `templates/glitch-text.tsx` | MIT (README, no LICENSE file) | Text | Headline / text effect | **None** (all copy/colour hardcoded) | None (system font) | `remotion` only | 16:9 fixed (rem units) | Yes — transparent | Effect (text) | Yes |
| 28 | **Gradient Shift**<br><sub>Slowly shifting ambient gradient</sub> | `templates/gradient-shift.tsx` | MIT (README, no LICENSE file) | Background | Background / ambient | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 (uses width/height) | No | Full-scene (background) | Yes |
| 29 | **Grid Pulse**<br><sub>Dot grid with ripple wave pulse</sub> | `templates/grid-pulse.tsx` | MIT (README, no LICENSE file) | Background | Background / ambient | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 (uses width/height) | No | Full-scene (background) | Yes |
| 30 | **Image Carousel**<br><sub>Horizontal sliding with centre focus</sub> | `templates/image-carousel.tsx` | MIT (README, no LICENSE file) | Image & Media | Full-scene (media carousel) | **None** (all copy/colour hardcoded) | Remote image URLs (Pexels) | `remotion` only | 16:9 fixed | No | Full-scene | Yes (needs hardcoded image URLs) |
| 31 | **Image Comparison Slider**<br><sub>Before/after sliding divider</sub> | `templates/image-comparison-slider.tsx` | MIT (README, no LICENSE file) | Image & Media | Full-scene (media) | **None** (all copy/colour hardcoded) | 2 remote image URLs (Pexels) | `remotion` only | 16:9 fixed | No | Full-scene | Yes (needs hardcoded image URLs) |
| 32 | **Image Zoom Reveal**<br><sub>Zoom-out focus-pull reveal</sub> | `templates/image-zoom-reveal.tsx` | MIT (README, no LICENSE file) | Image & Media | Full-scene (media) | **None** (all copy/colour hardcoded) | Remote image URLs (Pexels) | `remotion` only | 16:9 fixed | No | Full-scene | Yes (needs hardcoded image URLs) |
| 33 | **Iris Transition**<br><sub>Circular iris close/open</sub> | `templates/iris-transition.tsx` | MIT (README, no LICENSE file) | Transition | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |
| 34 | **Ken Burns**<br><sub>Pan and zoom for images</sub> | `templates/ken-burns.tsx` | MIT (README, no LICENSE file) | Cinematic | Full-scene (image) | ``imageUrl?: string``, ``duration?: number``, ``scale?: number``, ``translateX?: number``, ``translateY?: number`` | Remote image URL (Unsplash) — `imageUrl` prop | `remotion` + `next/image` + `styled-jsx` (Next.js-only) | 16:9 fixed | No — image fills frame | Full-scene | Needs work — CSS `@keyframes` + plain `<img>`; not frame-accurate |
| 35 | **Letterbox Reveal**<br><sub>Black bars retracting to reveal</sub> | `templates/letterbox-reveal.tsx` | MIT (README, no LICENSE file) | Cinematic | Transition / reveal | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |
| 36 | **Line Chart**<br><sub>SVG polyline drawing left-to-right with data points</sub> | `templates/line-chart.tsx` | MIT (README, no LICENSE file) | Charts & Data | Full-scene (data viz) | **None** (all copy/colour hardcoded) | None (inline SVG) | `remotion` only | 16:9 fixed | No | Full-scene | Yes |
| 37 | **Liquid Wave**<br><sub>Flowing SVG wave shapes</sub> | `templates/liquid-wave.tsx` | MIT (README, no LICENSE file) | Background | Background / ambient | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 (uses width/height) | No — opaque full-bleed | Full-scene (background) | Yes |
| 38 | **Logo Blur Reveal**<br><sub>Focus-pull blur to sharp</sub> | `templates/logo-blur-reveal.tsx` | MIT (README, no LICENSE file) | Logo & Branding | Logo reveal (full-scene intro) | **None** (all copy/colour hardcoded) | None (hardcoded 'Company Name') | `remotion` only | 16:9 fixed | No — paints full frame | Intro (logo reveal) | Yes (needs hardcoded text replaced) |
| 39 | **Logo Bounce Drop**<br><sub>Drop from above with bounce</sub> | `templates/logo-bounce-drop.tsx` | MIT (README, no LICENSE file) | Logo & Branding | Logo reveal (full-scene intro) | **None** (all copy/colour hardcoded) | None (hardcoded 'Company Name') | `remotion` only | 16:9 fixed | No — paints full frame | Intro (logo reveal) | Yes (needs hardcoded text replaced) |
| 40 | **Logo Fade Reveal**<br><sub>Fade in with subtle scale-up</sub> | `templates/logo-fade-reveal.tsx` | MIT (README, no LICENSE file) | Logo & Branding | Logo reveal (full-scene intro) | **None** (all copy/colour hardcoded) | None (hardcoded 'Company Name') | `remotion` only | 16:9 fixed | No — paints full frame | Intro (logo reveal) | Yes (needs hardcoded text replaced) |
| 41 | **Logo Glitch Reveal**<br><sub>RGB split glitch decaying to clean</sub> | `templates/logo-glitch-reveal.tsx` | MIT (README, no LICENSE file) | Logo & Branding | Logo reveal (full-scene intro) | **None** (all copy/colour hardcoded) | None (hardcoded 'Company Name') | `remotion` only | 16:9 fixed | No — paints full frame | Intro (logo reveal) | Yes (needs hardcoded text replaced) |
| 42 | **Logo Scale Rotate**<br><sub>Spinning scale entrance</sub> | `templates/logo-scale-rotate.tsx` | MIT (README, no LICENSE file) | Logo & Branding | Logo reveal (full-scene intro) | **None** (all copy/colour hardcoded) | None (hardcoded 'Company Name') | `remotion` only | 16:9 fixed | No — paints full frame | Intro (logo reveal) | Yes (needs hardcoded text replaced) |
| 43 | **Logo Spin Reveal**<br><sub>3D Y-axis spin reveal</sub> | `templates/logo-spin-reveal.tsx` | MIT (README, no LICENSE file) | Logo & Branding | Logo reveal (full-scene intro) | **None** (all copy/colour hardcoded) | None (hardcoded 'Company Name') | `remotion` only | 16:9 fixed | No — paints full frame | Intro (logo reveal) | Yes (needs hardcoded text replaced) |
| 44 | **Logo Split Reveal**<br><sub>Left/right halves expanding</sub> | `templates/logo-split-reveal.tsx` | MIT (README, no LICENSE file) | Logo & Branding | Logo reveal (full-scene intro) | **None** (all copy/colour hardcoded) | None (hardcoded 'Company Name') | `remotion` only | 16:9 fixed | No — paints full frame | Intro (logo reveal) | Yes (needs hardcoded text replaced) |
| 45 | **Logo Stroke Draw**<br><sub>SVG stroke drawing animation</sub> | `templates/logo-stroke-draw.tsx` | MIT (README, no LICENSE file) | Logo & Branding | Logo reveal (full-scene intro) | **None** (all copy/colour hardcoded) | None (inline SVG hexagon/triangle logo) | `remotion` only | 16:9 fixed | No — paints full frame | Intro (logo reveal) | Yes (needs hardcoded text replaced) |
| 46 | **Logo Typewriter**<br><sub>Icon + typed company name</sub> | `templates/logo-typewriter.tsx` | MIT (README, no LICENSE file) | Logo & Branding | Logo reveal (full-scene intro) | **None** (all copy/colour hardcoded) | None (hardcoded 'Company Name') | `remotion` only | 16:9 fixed | No — paints full frame | Intro (logo reveal) | Yes (needs hardcoded text replaced) |
| 47 | **Lower Third**<br><sub>News-style name/title bar</sub> | `templates/lower-third.tsx` | MIT (README, no LICENSE file) | Intro & Outro | Lower third | **None** (all copy/colour hardcoded) | None (hardcoded 'John Smith' / 'Senior Producer') | `remotion` only | 16:9 fixed (bottom 20%) | No — paints full frame | Overlay (lower third) | Yes (needs hardcoded text replaced) |
| 48 | **Masonry Gallery**<br><sub>Pinterest-style staggered grid</sub> | `templates/masonry-gallery.tsx` | MIT (README, no LICENSE file) | Image & Media | Full-scene (media grid) | **None** (all copy/colour hardcoded) | Remote image URLs (Pexels) | `remotion` only | 16:9 fixed | No | Full-scene | Yes (needs hardcoded image URLs) |
| 49 | **Matrix Rain**<br><sub>Falling code rain columns</sub> | `templates/matrix-rain.tsx` | MIT (README, no LICENSE file) | Background | Background / ambient | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 (uses width/height) | No — opaque full-bleed | Full-scene (background) | Yes |
| 50 | **Morph Transition**<br><sub>Scale-and-fade morph</sub> | `templates/morph-transition.tsx` | MIT (README, no LICENSE file) | Transition | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |
| 51 | **Noise Grain**<br><sub>Subtle film grain overlay</sub> | `templates/noise-grain.tsx` | MIT (README, no LICENSE file) | Background | Visual effect / film grain | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 (uses width/height) | No — paints a full-frame gradient child | Effect (overlay) | Yes |
| 52 | **Notification Pop**<br><sub>Stacking notification toasts</sub> | `templates/notification-pop.tsx` | MIT (README, no LICENSE file) | Content Animation | Content animation / UI overlay | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Effect (content) | Yes |
| 53 | **Parallax Pan**<br><sub>Multi-layer parallax scrolling</sub> | `templates/parallax-pan.tsx` | MIT (README, no LICENSE file) | Cinematic | Full-scene (image) | ``imageUrl?: string``, ``duration?: number``, ``direction?: 'left-right'|'right-left'|'top-bottom'|'bottom-top'``, ``scale?: number`` | Remote image URL (Pexels) — `imageUrl` prop | `remotion` + `next/image` + `styled-jsx` (Next.js-only) | 16:9 fixed | No — image fills frame | Full-scene | Needs work — `next/image` + styled-jsx CSS `@keyframes` |
| 54 | **Particle Explosion**<br><sub>Burst particles from centre</sub> | `templates/particle-explosion.tsx` | MIT (README, no LICENSE file) | Content Animation | Visual effect | **None** (all copy/colour hardcoded) | None (seeded `random()`) | `remotion` only | 16:9 (uses width/height) | Yes — transparent | Effect | Yes |
| 55 | **Photo Stack**<br><sub>Overlapping frames with rotation</sub> | `templates/photo-stack.tsx` | MIT (README, no LICENSE file) | Image & Media | Full-scene (media) | **None** (all copy/colour hardcoded) | Remote image URLs (Pexels) | `remotion` only | 16:9 fixed | No | Full-scene | Yes (needs hardcoded image URLs) |
| 56 | **Picture in Picture**<br><sub>PiP overlay layout</sub> | `templates/picture-in-picture.tsx` | MIT (README, no LICENSE file) | Image & Media | Full-scene (media layout) | **None** (all copy/colour hardcoded) | Remote image URLs (Pexels) | `remotion` only | 16:9 fixed | No | Full-scene | Yes (needs hardcoded image URLs) |
| 57 | **Pie Chart**<br><sub>Segmented circle with sequential segment reveals</sub> | `templates/pie-chart.tsx` | MIT (README, no LICENSE file) | Charts & Data | Full-scene (data viz) | **None** (all copy/colour hardcoded) | None (inline SVG) | `remotion` only | 16:9 fixed | No | Full-scene | Yes |
| 58 | **Pixel Transition**<br><sub>Pixelated grid reveal</sub> | `templates/pixel-transition.tsx` | MIT (README, no LICENSE file) | Background | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 (uses width/height) | No — opaque full-bleed | Transition | Yes |
| 59 | **Polaroid Frame**<br><sub>Polaroid-style photo with drop-in</sub> | `templates/polaroid-frame.tsx` | MIT (README, no LICENSE file) | Image & Media | Full-scene (media frame) | **None** (all copy/colour hardcoded) | Remote image URL (Pexels) | `remotion` only | 16:9 fixed | No | Full-scene | Yes (needs hardcoded image URL) |
| 60 | **Popping Scale Text**<br><sub>Spring-based scale pop entrance</sub> | `templates/popping-text.tsx` | MIT (README, no LICENSE file) | Text | Headline / text effect | **None** (all copy/colour hardcoded) | None (system font) | `remotion` only | 16:9 fixed (rem units) | Yes — transparent | Effect (text) | Yes |
| 61 | **Progress Bars**<br><sub>Horizontal bars filling to different widths</sub> | `templates/progress-bars.tsx` | ⚠ **MIT (README) BUT vendor catalogue says `tier: "pro"` — treat as paid** | Charts & Data | Full-scene (data viz) | **None** (all copy/colour hardcoded) | None (inline SVG) | `remotion` only | 16:9 fixed | No | Full-scene | Blocked — premium/pro tier |
| 62 | **Progress Steps**<br><sub>Step indicator filling in sequence</sub> | `templates/progress-steps.tsx` | MIT (README, no LICENSE file) | Content Animation | Content animation | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Effect (content) | Yes |
| 63 | **Pulsing Text**<br><sub>Continuous scale pulse for emphasis</sub> | `templates/pulsing-text.tsx` | MIT (README, no LICENSE file) | Text | Headline / text effect | **None** (all copy/colour hardcoded) | None (system font) | `remotion` only | 16:9 fixed (rem units) | Yes — transparent | Effect (text) | Yes |
| 64 | **Push Transition**<br><sub>New scene pushes old off-screen</sub> | `templates/push-transition.tsx` | MIT (README, no LICENSE file) | Transition | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |
| 65 | **Quote Card**<br><sub>Animated quotation with attribution</sub> | `templates/quote-card.tsx` | MIT (README, no LICENSE file) | Intro & Outro | Full-scene text card | **None** (all copy/colour hardcoded) | None (hardcoded quote) | `remotion` only | 16:9 fixed | No — paints full frame | Full-scene | Yes (needs hardcoded text replaced) |
| 66 | **Rotating Carousel**<br><sub>3D rotating card carousel</sub> | `templates/rotating-carousel.tsx` | MIT (README, no LICENSE file) | Content Animation | Content animation | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Effect (content) | Yes |
| 67 | **Slide Text**<br><sub>Directional slide-in text</sub> | `templates/slide-text.tsx` | MIT (README, no LICENSE file) | Text | Headline / text effect | **None** (all copy/colour hardcoded) | None (system font) | `remotion` only | 16:9 fixed (rem units) | Yes — transparent | Effect (text) | Yes |
| 68 | **Slide Wipe**<br><sub>Spring-driven panel slide</sub> | `templates/slide-wipe.tsx` | MIT (README, no LICENSE file) | Transition | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |
| 69 | **Sound Wave**<br><sub>Audio waveform bar visualiser</sub> | `templates/sound-wave.tsx` | MIT (README, no LICENSE file) | Content Animation | Visual effect / graphic | **None** (all copy/colour hardcoded) | None (seeded `random()`) | `remotion` only | 16:9 (uses width/height) | Yes — transparent | Effect (graphic) | Yes |
| 70 | **Split Screen**<br><sub>Two panels sliding to meet</sub> | `templates/split-screen.tsx` | MIT (README, no LICENSE file) | Image & Media | Full-scene (media layout) | **None** (all copy/colour hardcoded) | 2 remote image URLs (Pexels) | `remotion` only | 16:9 fixed | No | Full-scene | Yes (needs hardcoded image URLs) |
| 71 | **Spotlight Reveal**<br><sub>Expanding circle clip-path reveal</sub> | `templates/spotlight-reveal.tsx` | MIT (README, no LICENSE file) | Cinematic | Cinematic effect / reveal | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Effect (transition) | Yes |
| 72 | **Starfield**<br><sub>Flying-through-space star effect</sub> | `templates/starfield.tsx` | MIT (README, no LICENSE file) | Background | Background / ambient | **None** (all copy/colour hardcoded) | None (seeded `random()`) | `remotion` only | 16:9 (uses width/height) | No | Full-scene (background) | Yes |
| 73 | **Stat Counter**<br><sub>Large number counting up with comma formatting</sub> | `templates/stat-counter.tsx` | ⚠ **MIT (README) BUT vendor catalogue says `tier: "pro"` — treat as paid** | Charts & Data | Full-scene (data viz) | **None** (all copy/colour hardcoded) | None (inline SVG) | `remotion` only | 16:9 fixed | No | Full-scene | Blocked — premium/pro tier |
| 74 | **Subscribe Reminder**<br><sub>Floating subscribe overlay</sub> | `templates/subscribe-reminder.tsx` | MIT (README, no LICENSE file) | Intro & Outro | Overlay (CTA nudge) | **None** (all copy/colour hardcoded) | None (hardcoded handle) | `remotion` only | 16:9 fixed | No — paints full frame | Overlay (CTA) | Yes (needs hardcoded text replaced) |
| 75 | **Text Highlight**<br><sub>Sequential word highlighting</sub> | `templates/text-highlight.tsx` | MIT (README, no LICENSE file) | Content Animation | Headline / text effect | **None** (all copy/colour hardcoded) | None (system font) | `remotion` only | 16:9 fixed (rem units) | No — paints a full-frame gradient | Effect (text) | Yes |
| 76 | **Title Split**<br><sub>Split text meeting in centre</sub> | `templates/title-split.tsx` | MIT (README, no LICENSE file) | Intro & Outro | Intro / title (full-scene) | **None** (all copy/colour hardcoded) | None (hardcoded title) | `remotion` only | 16:9 fixed | No — paints full frame | Intro (title card) | Yes (needs hardcoded text replaced) |
| 77 | **Typewriter Subtitle**<br><sub>Character-by-character typing with cursor</sub> | `templates/typewriter-subtitle.tsx` | MIT (README, no LICENSE file) | Text | Subtitle / text effect | **None** (all copy/colour hardcoded) | None (Courier New system font) | `remotion` only | 16:9 fixed (rem units) | Yes — transparent | Effect (text) | Yes |
| 78 | **Vignette Pulse**<br><sub>Pulsing darkened edges overlay</sub> | `templates/vignette-pulse.tsx` | MIT (README, no LICENSE file) | Cinematic | Cinematic effect / overlay | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Effect (overlay) | Yes |
| 79 | **Whip Pan**<br><sub>Fast horizontal pan with motion blur</sub> | `templates/whip-pan.tsx` | MIT (README, no LICENSE file) | Cinematic | Cinematic effect / transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Effect (transition) | Yes |
| 80 | **Zoom Pulse**<br><sub>Rhythmic zoom in/out pulse</sub> | `templates/zoom-pulse.tsx` | MIT (README, no LICENSE file) | Cinematic | Cinematic effect | ``imageUrl?: string``, ``duration?: number``, ``minScale?: number``, ``maxScale?: number`` | None (seeded `random()`) | `remotion` + `next/image` + `styled-jsx` (Next.js-only) | 16:9 (uses width/height) | No | Effect | Yes |
| 81 | **Zoom Through**<br><sub>Zoom in then zoom out reveal</sub> | `templates/zoom-through.tsx` | MIT (README, no LICENSE file) | Transition | Transition | **None** (all copy/colour hardcoded) | None | `remotion` only | 16:9 fixed | No | Transition | Yes |

---

## 9. Full inventory — Repo 2: `deangilmoreremix/free-remotion-templates`

**Source:** `https://github.com/deangilmoreremix/free-remotion-templates` (upstream: `RenderComp/free-remotion-templates`)  
**Licence:** `MIT License` / `Copyright (c) 2026 Trimora Inc.` · **Remotion:** `4.0.518` · **React:** `^19.0.0` · **Deps:** `remotion` + `react` only (6 templates additionally import the local `src/pixel-kit/` helper)  
**In the reactvideoeditor.com gallery:** ❌ **none** — these 50 are a separate RenderComp catalogue, not in the RVE gallery.  
**Assets:** `ASSETS.md` states 0 fonts / 0 images / 0 audio / 0 video bundled; all graphics are inline SVG/CSS and the 6 pixel templates use a code-drawn 5×7 bitmap font.

| # | Template | Source path | Licence | Design category | Role | Editable props | Required assets | Dependencies | Aspect ratios | Over existing video? | Intro/outro, transition, effect or full-scene? | Browser export engine? |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Animated Bar Chart**<br><sub>Bars grow to your values in sequence.</sub> | `src/components/bar-chart-anim/BarChartAnim.tsx` | MIT (Trimora Inc.) | Data viz | Full-scene (data viz) | `title`: string, `subtitle`: string, `bars`: BarItem[], `background`: string, `titleColor`: string, `accentColor`: string | None (inline SVG) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 2 | **Bokeh Loop**<br><sub>Soft out-of-focus lights drift in a seamless loop.</sub> | `src/components/bokeh-circles/BokehCircles.tsx` | MIT (Trimora Inc.) | Background / ambient | Background / ambient | `colors`: string[], `baseColor`: string, `count`: number, `label`: string, `labelColor`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene (background) | Yes |
| 3 | **Bounce-In Headline**<br><sub>The headline lands with an elastic bounce, word by word.</sub> | `src/components/bounce-in-headline/BounceInHeadline.tsx` | MIT (Trimora Inc.) | Headline | Headline / title (full-scene) | `headline`: string, `background`: string, `color`: string, `bounces`: number, `height`: number, `delay`: number, `duration`: number | None (system font stack) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 4 | **Brush Stroke Reveal**<br><sub>A paint brush stroke sweeps in and carries your mark.</sub> | `src/components/brush-stroke-reveal/BrushStrokeReveal.tsx` | MIT (Trimora Inc.) | Logo reveal | Logo reveal (full-scene intro) | `title`: string, `description`: string, `strokes`: number, `direction`: "left" \| "right", `textColor`: string, `background`: string, `accentColor`: string | None (inline SVG brush strokes) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Intro (logo reveal) | Yes |
| 5 | **Camera Shake**<br><sub>Adds handheld impact shake to any cut or hit.</sub> | `src/components/camera-shake/CameraShake.tsx` | MIT (Trimora Inc.) | Transition / effect | Cinematic effect | `title`: string, `subtitle`: string, `background`: string, `textColor`: string, `accentColor`: string, `maxIntensity`: number, `impactAt`: number, `shakeDuration`: number | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Effect | Yes |
| 6 | **Card Flip**<br><sub>The whole frame flips over like a card to the next scene.</sub> | `src/components/card-flip-transition/CardFlipTransition.tsx` | MIT (Trimora Inc.) | Transition | Transition | `colorBefore`: string, `colorAfter`: string, `labelBefore`: string, `labelAfter`: string, `textColor`: string, `backdropColor`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Transition | Yes |
| 7 | **Chapter Title Card**<br><sub>A clean numbered chapter card for section breaks.</sub> | `src/components/chapter-title/ChapterTitle.tsx` | MIT (Trimora Inc.) | Title | Intro / section title (full-scene) | `chapterLabel`: string, `title`: string, `subtitle`: string, `background`: string, `chapterColor`: string, `titleColor`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Intro (title card) | Yes |
| 8 | **Jumping Character**<br><sub>A simple character celebrates with a loop-ready jump.</sub> | `src/components/character-jumping/CharacterJumping.tsx` | MIT (Trimora Inc.) | Character / social | Full-scene character (full-scene) | `backgroundColor`: string, `characterColor`: string, `shadowColor`: string, `accentColor`: string, `groundColor`: string, `label`: string, `textColor`: string, `jumpCount`: number | None (inline SVG) | `remotion` + `react` | 1080×1080 · 1:1 | No — `AbsoluteFill` background | Full-scene | Yes |
| 9 | **Chat Conversation**<br><sub>Message bubbles pop in like a live chat thread (9:16).</sub> | `src/components/community-chat/CommunityChat.tsx` | MIT (Trimora Inc.) | UI / social | Overlay-style UI (full-scene canvas) | `workspaceName`: string, `channelName`: string, `messages`: CommunityChatMessage[] | None | `remotion` + `react` | 1080×1920 · 9:16 | No — `AbsoluteFill` background | Full-scene (UI) | Yes — uses `<Sequence>` |
| 10 | **End Card / Outro**<br><sub>A closing card with CTA slots for subscribe and links.</sub> | `src/components/end-card/EndCard.tsx` | MIT (Trimora Inc.) | Outro / CTA | Outro / end card (full-scene) | `text`: string, `delay`: number, `fillColor`: string, `labelColor`: string, `fontSize`: number | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Outro (end card) | Yes |
| 11 | **Eye Blink Reveal**<br><sub>An eye opens and its iris reveals your scene.</sub> | `src/components/eye-reveal/EyeReveal.tsx` | MIT (Trimora Inc.) | Transition / effect | Transition / reveal (full-scene) | `backgroundColor`: string, `scleraColor`: string, `irisColor`: string, `pupilColor`: string, `lidColor`: string, `textColor`: string, `subColor`: string, `messageText`: string, `subText`: string | None (inline SVG eye) | `remotion` + `react` | 1080×1080 · 1:1 | No — `AbsoluteFill` background | Full-scene (transition) | Yes |
| 12 | **Fireworks Burst**<br><sub>Fireworks bloom on cue. Stack them for finales.</sub> | `src/components/fireworks-burst/FireworksBurst.tsx` | MIT (Trimora Inc.) | Effect | Visual effect (full-scene) | `backgroundColor`: string, `burstColors`: string[], `trailColor`: string, `sparkColor`: string, `textColor`: string, `subColor`: string, `messageText`: string, `subText`: string | None | `remotion` + `react` | 1080×1080 · 1:1 | No — `AbsoluteFill` background | Full-scene | Yes |
| 13 | **Page Flip**<br><sub>A page turn carries scene A over to scene B.</sub> | `src/components/flip-page-transition/FlipPageTransition.tsx` | MIT (Trimora Inc.) | Transition | Transition | `colorBefore`: string, `colorAfter`: string, `labelBefore`: string, `labelAfter`: string, `textColor`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Transition | Yes — uses `<Sequence>` |
| 14 | **Four-Tone Titler**<br><sub>A duotone title block that steps through four color states.</sub> | `src/components/four-tone-mono-titler/FourToneMonoTitler.tsx` | MIT (Trimora Inc.) | Title | Headline / title (full-scene) | `title`: string, `subtitle`: string, `tone0`: string; // darkest LCD tone (screen base), `tone1`: string; // dark-mid (dither light dots + subtitle-shadow + dust), `tone2`: string; // bright (title baseline + borders), `tone3`: string; // brightest (shimmer highlight + wipe head + kicker), `titleCell`: number; // internal px per title dot, `subtitleCell`: number; // internal px per subtitle dot, `wipeFrames`: number; // frames for the left-to-right reveal, `shimmerSpeed`: number; // idle specular sweep speed (internal px / frame), `ditherDensity`: number; // 0..1 shading-band coverage bias, `showAmbient`: boolean; // ambient top glow + twinkling pixel dust | None (code-drawn 5×7 bitmap font) | `remotion` + `react`; plus `src/pixel-kit/` | 1920×1080 · 16:9 | No — `PixelStage` background | Full-scene | Yes — needs `src/pixel-kit/` helper |
| 15 | **Glitch Text**<br><sub>RGB-split glitches tear the title before it stabilizes.</sub> | `src/components/glitch-text/GlitchText.tsx` | MIT (Trimora Inc.) | Headline | Headline / text effect (full-scene) | `text`: string, `glitchColor`: string, `intensity`: number, `backgroundColor`: string, `fontSize`: number, `duration`: number | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 16 | **Gradient Sweep Title**<br><sub>A color gradient sweeps through the headline.</sub> | `src/components/gradient-text-sweep/GradientTextSweep.tsx` | MIT (Trimora Inc.) | Headline | Headline / text effect (full-scene) | `backgroundColor`: string, `accentColor`: string, `textColor`: string, `headline`: string, `subline`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 17 | **Ink Spread**<br><sub>Ink blots spread and flood the frame into the next scene.</sub> | `src/components/ink-spread-transition/InkSpreadTransition.tsx` | MIT (Trimora Inc.) | Transition | Transition | `colorBefore`: string, `colorAfter`: string, `labelBefore`: string, `labelAfter`: string, `textColor`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Transition | Yes |
| 18 | **Kinetic Word Stack**<br><sub>Words punch in and stack into a bold kinetic block.</sub> | `src/components/kinetic-word-stack/KineticWordStack.tsx` | MIT (Trimora Inc.) | Headline | Headline / title (full-scene) | `backgroundColor`: string, `accentColor`: string, `textColor`: string, `words`: string[] | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 19 | **KPI Counter**<br><sub>A number counts up to your metric with its label.</sub> | `src/components/kpi-counter/KpiCounter.tsx` | MIT (Trimora Inc.) | Data viz | Full-scene (data viz) | `backgroundColor`: string, `cardColor`: string, `textColor`: string, `subtextColor`: string, `accentColor`: string, `title`: string, `subtitle`: string, `metrics`: KpiMetric[] | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 20 | **Animated Line Chart**<br><sub>A line draws itself across the axes to your data.</sub> | `src/components/line-chart-anim/LineChartAnim.tsx` | MIT (Trimora Inc.) | Data viz | Full-scene (data viz) | `title`: string, `subtitle`: string, `points`: LinePoint[], `background`: string, `titleColor`: string, `lineColor`: string, `gridColor`: string | None (inline SVG) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 21 | **Logo Blur Reveal**<br><sub>Logo sharpens out of a soft blur into focus.</sub> | `src/components/logo-blur-reveal/LogoBlurReveal.tsx` | MIT (Trimora Inc.) | Logo reveal | Logo reveal (full-scene intro) | `logoText`: string, `blurAmount`: number, `revealDuration`: number, `logoColor`: string, `backgroundColor`: string, `fontSize`: number, `duration`: number | None (inline SVG mark) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Intro (logo reveal) | Yes |
| 22 | **Logo Bounce Drop**<br><sub>Logo drops in and settles with a springy bounce.</sub> | `src/components/logo-bounce-drop/LogoBounceDrop.tsx` | MIT (Trimora Inc.) | Logo reveal | Logo reveal (full-scene intro) | `logoText`: string, `svgPath`: string, `viewBox`: string, `dropHeight`: number, `bounceStrength`: number, `logoColor`: string, `backgroundColor`: string, `fontSize`: number, `duration`: number | None (inline SVG mark + `svgPath` prop) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Intro (logo reveal) | Yes |
| 23 | **Logo Mask Wipe**<br><sub>A diagonal mask wipes across to expose the logo.</sub> | `src/components/logo-mask-wipe/LogoMaskWipe.tsx` | MIT (Trimora Inc.) | Logo reveal | Logo reveal (full-scene intro) | `backgroundColor`: string, `accentColor`: string, `textColor`: string, `monogram`: string, `brandText`: string | None (inline SVG monogram) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Intro (logo reveal) | Yes |
| 24 | **Logo Split Reveal**<br><sub>Two panels split apart to reveal the logo between them.</sub> | `src/components/logo-split-reveal/LogoSplitReveal.tsx` | MIT (Trimora Inc.) | Logo reveal | Logo reveal (full-scene intro) | `logoText`: string, `splitOffset`: number, `revealDuration`: number, `logoColor`: string, `backgroundColor`: string, `fontSize`: number, `duration`: number | None (inline SVG mark) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Intro (logo reveal) | Yes |
| 25 | **Logo Stroke Draw**<br><sub>Traces your logo outline stroke by stroke, then fills.</sub> | `src/components/logo-stroke-draw/LogoStrokeDraw.tsx` | MIT (Trimora Inc.) | Logo reveal | Logo reveal (full-scene intro) | `backgroundColor`: string, `accentColor`: string, `textColor`: string, `monogram`: string, `brandText`: string | None (inline SVG monogram badge) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Intro (logo reveal) | Yes |
| 26 | **Grid Wave Loop**<br><sub>A dot grid undulates in a hypnotic endless wave.</sub> | `src/components/loop-grid-wave/LoopGridWave.tsx` | MIT (Trimora Inc.) | Background / ambient | Background / ambient | `backgroundColor`: string, `dotColor`: string, `accentColor`: string, `amplitude`: number, `speed`: number | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene (background) | Yes |
| 27 | **Glass Lower Third**<br><sub>A frosted-glass name plate slides in from the corner.</sub> | `src/components/lower-third-glass-card/LowerThirdGlassCard.tsx` | MIT (Trimora Inc.) | Lower third | Lower third | `backgroundColor`: string, `accentColor`: string, `textColor`: string, `nameText`: string, `titleText`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background (+ `backdrop-filter: blur(14px)`) | Overlay (lower third) | Yes — but `backdrop-filter` is lost in canvas compositing |
| 28 | **Neon Sign Flicker**<br><sub>Your text buzzes on like a neon tube, flicker and all.</sub> | `src/components/neon-sign/NeonSign.tsx` | MIT (Trimora Inc.) | Logo / text reveal | Logo reveal (full-scene intro) | `backgroundColor`: string, `neonColor`: string, `glowColor`: string, `flickerColor`: string, `frameColor`: string, `textColor`: string, `subColor`: string, `signText`: string, `subText`: string | None (inline SVG) | `remotion` + `react` | 1080×1080 · 1:1 | No — `AbsoluteFill` background | Intro (logo reveal) | Yes |
| 29 | **Parallax Pan**<br><sub>Layered planes pan at different speeds for depth.</sub> | `src/components/parallax-pan/ParallaxPan.tsx` | MIT (Trimora Inc.) | Background / ambient | Background / ambient (full-scene) | `title`: string, `subtitle`: string, `skyTop`: string, `skyBottom`: string, `mountainColor`: string, `hillColor`: string, `groundColor`: string, `textColor`: string, `panDistance`: number | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene (background) | Yes |
| 30 | **Snow Particles**<br><sub>Snow drifts down in layers with gentle depth.</sub> | `src/components/particle-snow/ParticleSnow.tsx` | MIT (Trimora Inc.) | Effect | Visual effect (full-scene) | `backgroundColor`: string, `snowColor`: string, `accentColor`: string, `flakeCount`: number, `title`: string, `subtitle`: string, `textColor`: string | None | `remotion` + `react` | 1080×1080 · 1:1 | No — `AbsoluteFill` background | Full-scene | Yes |
| 31 | **Pencil Draw-On**<br><sub>A pencil sketches your shape in, line by line.</sub> | `src/components/pencil-draw/PencilDraw.tsx` | MIT (Trimora Inc.) | Effect | Visual effect / reveal (full-scene) | `backgroundColor`: string, `pencilColor`: string, `lineColor`: string, `eraserColor`: string, `textColor`: string, `subColor`: string, `messageText`: string, `subText`: string | None (inline SVG pencil) | `remotion` + `react` | 1080×1080 · 1:1 | No — `AbsoluteFill` background | Full-scene | Yes |
| 32 | **Pixel Candlestick**<br><sub>A retro pixel OHLC chart plays out your price data.</sub> | `src/components/pixel-candlestick-ohlc/PixelCandlestickOhlc.tsx` | MIT (Trimora Inc.) | Data viz | Full-scene (data viz) | `backgroundColor`: string; // chart panel base, `gridColor`: string;       // grid + axis lines, `bullColor`: string;       // up candle (close >= open), `bearColor`: string;       // down candle (close < open), `accentColor`: string;     // header / latest-price text, `candleCount`: number;     // number of candles in the series, `volatility`: number;      // 0..1 amplitude of the deterministic walk, `cycleSpeed`: number;      // subtle body color-cycle speed, `ticker`: string;          // header symbol label | None (code-drawn bitmap font) | `remotion` + `react`; plus `src/pixel-kit/` | 1920×1080 · 16:9 | No — `PixelStage` background | Full-scene | Yes — needs `src/pixel-kit/` helper |
| 33 | **Pixel Mosaic Transition**<br><sub>The frame dissolves into pixel blocks and reassembles.</sub> | `src/components/pixel-mosaic-transition/PixelMosaicTransition.tsx` | MIT (Trimora Inc.) | Transition | Transition | `backgroundColor`: string; // outer letterbox / stage fill, `screenAColor`: string;    // screen A primary (sky / theme A), `screenAAccent`: string;   // screen A accent (sun / motif A), `screenBColor`: string;    // screen B primary (sky / theme B), `screenBAccent`: string;   // screen B accent (moon / motif B), `maxCell`: number;         // coarsest block size at the swap midpoint (px at internal res), `ditherOpacity`: number;   // Bayer dither strength over dark areas | None (code-drawn bitmap font) | `remotion` + `react`; plus `src/pixel-kit/` | 1920×1080 · 16:9 | No — `PixelStage` background | Transition | Yes — needs `src/pixel-kit/` helper |
| 34 | **Pixel Typewriter Quote**<br><sub>A retro pixel-font quote typed onto the screen.</sub> | `src/components/pixel-typewriter-quote/PixelTypewriterQuote.tsx` | MIT (Trimora Inc.) | Quote / title | Full-scene text card | `quote`: string;        // body text (English glyph set), `attribution`: string;  // who said it ("- NAME"), `backgroundColor`: string, `inkColor`: string;     // settled glyph color, `accentColor`: string;  // fresh-strike flare + quote marks + cursor, `cps`: number;          // characters revealed per frame | None (code-drawn 5×7 bitmap font) | `remotion` + `react`; plus `src/pixel-kit/` | 1920×1080 · 16:9 | No — `PixelStage` background | Full-scene | Yes — needs `src/pixel-kit/` helper |
| 35 | **Pixel Waterfall**<br><sub>A pixel-art waterfall cycles forever (9:16).</sub> | `src/components/pixel-waterfall-cycle/PixelWaterfallCycle.tsx` | MIT (Trimora Inc.) | Background / ambient | Background / ambient | `backgroundColor`: string; // sky top, `accentColor`: string;     // foam / highlight, `cliffColor`: string, `cycleSpeed`: number, `showMist`: boolean | None (code-drawn bitmap font) | `remotion` + `react`; plus `src/pixel-kit/` | 1080×1920 · 9:16 | No — `PixelStage` background | Full-scene (background) | Yes — needs `src/pixel-kit/` helper |
| 36 | **Drip Fill Gauge**<br><sub>A gauge fills drop by drop to the target percentage.</sub> | `src/components/pourover-drip-fill-gauge/PouroverDripFillGauge.tsx` | MIT (Trimora Inc.) | Data viz | Full-scene (data viz) | `toneBg`: string;       // four-tone amber: darkest (background / shadow), `toneDark`: string;     // mid-dark (apparatus body, gauge frame), `toneMid`: string;      // mid-light (liquid, accents), `toneLight`: string;    // lightest (highlights, readout text), `fillSpeed`: number;    // fraction of duration spent rising (0..1); rest holds full, `showDrips`: boolean;   // animated drip particles falling into the cone, `beats`: BeatEvent[];      // MV: real onsets (pulse on readout). idle when absent., `waveform`: number[];      // MV: 0..1 levels to pace the fill. linear ramp when absent. | None (code-drawn bitmap font) | `remotion` + `react`; plus `src/pixel-kit/` | 1920×1080 · 16:9 | No — `PixelStage` background | Full-scene | Yes — needs `src/pixel-kit/` helper |
| 37 | **Racing Bar Chart**<br><sub>Ranked bars overtake each other as values change.</sub> | `src/components/racing-chart/RacingChart.tsx` | MIT (Trimora Inc.) | Data viz | Full-scene (data viz) | `data`: RacingChartDatum[], `frames`: number, `title`: string, `background`: string, `titleColor`: string | None (inline SVG) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 38 | **Scramble Text**<br><sub>Characters cycle randomly, then lock into your headline.</sub> | `src/components/scramble-text/ScrambleText.tsx` | MIT (Trimora Inc.) | Headline | Headline / text effect (full-scene) | `text`: string, `label`: string, `background`: string, `textColor`: string, `labelColor`: string, `scrambleDuration`: number, `charset`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 39 | **Shatter Reveal**<br><sub>The cover layer shatters into shards, revealing what's behind.</sub> | `src/components/shatter-reveal/ShatterReveal.tsx` | MIT (Trimora Inc.) | Logo / cover reveal | Logo reveal (full-scene intro) | `title`: string, `subtitle`: string, `pieces`: number, `spread`: number, `textColor`: string, `background`: string, `tileBackground`: string, `accentColor`: string | None (inline SVG shards) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Intro (logo reveal) | Yes |
| 40 | **Slide Wipe**<br><sub>A clean directional slide pushes the old frame out.</sub> | `src/components/slide-wipe/SlideWipe.tsx` | MIT (Trimora Inc.) | Transition | Transition | `colorBefore`: string, `colorAfter`: string, `labelBefore`: string, `labelAfter`: string, `textColor`: string, `backdropColor`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Transition | Yes |
| 41 | **Social Reel Frame**<br><sub>A reel-style frame with handle, caption and progress.</sub> | `src/components/social-reel/SocialReel.tsx` | MIT (Trimora Inc.) | Social frame | Social / UI overlay (full-scene) | `brandName`: string, `handle`: string, `headline`: string, `headlineAccent`: string, `secondCopy`: string, `infoLines`: string[], `ctaText`: string, `accentColor`: string, `bgFrom`: string, `bgVia`: string, `bgTo`: string, `caption`: string, `likeCount`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene (UI) | Yes — uses `<Sequence>` |
| 42 | **Split Screen**<br><sub>Two panels slide in for a side-by-side comparison.</sub> | `src/components/split-screen/SplitScreen.tsx` | MIT (Trimora Inc.) | Layout | Full-scene (media layout) | `direction`: "horizontal" \| "vertical", `panelA`: SplitScreenPanel, `panelB`: SplitScreenPanel, `dividerColor`: string, `dividerWidth`: number, `backdropColor`: string | None (inline SVG panels) | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 43 | **Starfield**<br><sub>Stars stream past like a slow warp-speed flight.</sub> | `src/components/starfield/Starfield.tsx` | MIT (Trimora Inc.) | Background / ambient | Background / ambient | `count`: number, `starColor`: string, `baseColor`: string, `warpSpeed`: number, `label`: string, `labelColor`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene (background) | Yes |
| 44 | **Text Mask Reveal**<br><sub>Text slides up out of an invisible mask line.</sub> | `src/components/text-mask-reveal/TextMaskReveal.tsx` | MIT (Trimora Inc.) | Headline | Headline / text effect (full-scene) | `backgroundColor`: string, `accentColor`: string, `textColor`: string, `lines`: string[] | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 45 | **Thinking Bubble**<br><sub>A thought bubble inflates with animated dots.</sub> | `src/components/thinking-bubble/ThinkingBubble.tsx` | MIT (Trimora Inc.) | Character / social | Overlay-style UI (full-scene) | `backgroundColor`: string, `characterColor`: string, `bubbleColor`: string, `bubbleBorder`: string, `dotColor`: string, `thoughtText`: string, `textColor`: string, `showText`: boolean | None (inline SVG) | `remotion` + `react` | 1080×1080 · 1:1 | No — `AbsoluteFill` background | Full-scene (UI) | Yes |
| 46 | **Circle Wipe**<br><sub>A circle expands from center to swallow the scene.</sub> | `src/components/transition-circle-wipe/TransitionCircleWipe.tsx` | MIT (Trimora Inc.) | Transition | Transition | `backgroundColor`: string, `accentColor`: string, `textColor`: string, `fromLabel`: string, `toLabel`: string | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Transition | Yes |
| 47 | **Typewriter**<br><sub>Types your copy character by character, cursor included.</sub> | `src/components/typewriter/Typewriter.tsx` | MIT (Trimora Inc.) | Headline | Headline / text effect (full-scene) | `backgroundColor`: string, `machineColor`: string, `machineDarkColor`: string, `keyColor`: string, `ribbonColor`: string, `paperColor`: string, `textColor`: string, `subColor`: string, `messageText`: string, `subText`: string | None | `remotion` + `react` | 1080×1080 · 1:1 | No — `AbsoluteFill` background | Full-scene | Yes |
| 48 | **Waving Hello**<br><sub>A friendly hand waves hello, an instant icebreaker.</sub> | `src/components/wave-hello/WaveHello.tsx` | MIT (Trimora Inc.) | Character / social | Full-scene character (full-scene) | `backgroundColor`: string, `skinColor`: string, `bodyColor`: string, `accentColor`: string, `textColor`: string, `title`: string, `subtitle`: string | None (inline SVG) | `remotion` + `react` | 1080×1080 · 1:1 | No — `AbsoluteFill` background | Full-scene | Yes |
| 49 | **Wave Text**<br><sub>Letters ride a smooth wave, one after another.</sub> | `src/components/wave-text/WaveText.tsx` | MIT (Trimora Inc.) | Headline | Headline / text effect (full-scene) | `text`: string, `subText`: string, `background`: string, `textColor`: string, `subTextColor`: string, `amplitude`: number, `waveSpeed`: number, `wavelength`: number | None | `remotion` + `react` | 1920×1080 · 16:9 | No — `AbsoluteFill` background | Full-scene | Yes |
| 50 | **Whip Pan**<br><sub>A fast blurred pan whips from one scene to the next.</sub> | `src/components/whip-pan/WhipPan.tsx` | MIT (Trimora Inc.) | Transition | Transition / cinematic effect | `scenes`: WhipPanScene[], `panLeft`: boolean, `maxBlur`: number | None | `remotion` + `react` | 1920×1080 · 16:9 | No — paints `backgroundColor: scene.background` | Effect (transition) | Yes |

---

## 10. Full inventory — Repo 3: `deangilmoreremix/remotion-video-templates`

**Source:** `https://github.com/deangilmoreremix/remotion-video-templates`  
**Licence:** `MIT License` / `Copyright (c) 2026 Alejandro Brito` · **Remotion:** `4.0.200` · **React:** `18.3.1` (pinned) · **Deps:** `remotion`, `zod@3.22.3`, `@remotion/zod-types@4.0.200`, `@remotion/google-fonts@4.0.200`, `@remotion/transitions@4.0.200`  
**In the reactvideoeditor.com gallery:** ❌ **none**.  
**Note:** 6 template folders → **7 compositions** (`ChartVideo/` registers both `BarChartRace` and `LineChartDraw`).

| # | Composition | Source path | Licence | Design category | Role | Editable props | Required assets | Dependencies | Aspect ratios | Over existing video? | Intro/outro, transition, effect or full-scene? | Browser export engine? |
|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **LogoIntro** | `src/templates/LogoIntro/LogoIntro.tsx` | MIT (Alejandro Brito) | Logo & branding | Logo reveal (full-scene intro) | `logoSrc: string, brandColor: string, accentColor: string, backgroundColor: string, particleCount: number` | logoSrc (file in `public/`, via `staticFile()`) — `public/logo.svg` shipped | remotion 4.0.200 + zod 3.22.3 + @remotion/zod-types 4.0.200 (schema only) | 1920×1080 (16:9) fixed | No — `AbsoluteFill` background | Intro (logo reveal) | Needs work — `staticFile()` → absolute URL; Google-Fonts fetch → local font stack |
| 2 | **LowerThirds** | `src/templates/LowerThirds/LowerThirds.tsx` | MIT (Alejandro Brito) | Lower third | Lower third | `name: string, role: string, accentColor: string, enterDurationInFrames: number, holdDurationInFrames: number, exitDurationInFrames: number` | None (inline SVG shapes) | remotion 4.0.200 + zod 3.22.3 + @remotion/zod-types 4.0.200 (schema only) | 1920×1080 (16:9) fixed | No — `AbsoluteFill` + `StageBackground` | Overlay (lower third) | Yes, with `calculateMetadata` wired in + local font stack |
| 3 | **KineticText** | `src/templates/KineticText/KineticText.tsx` | MIT (Alejandro Brito) | Text / headline | Headline / kinetic title (full-scene) | `lines: {text: string, emphasis?: boolean}[], backgroundColor: string, textColor: string, emphasisColor: string` | None — but `@remotion/google-fonts` fetches Inter at render time | remotion 4.0.200 + zod 3.22.3 + @remotion/zod-types 4.0.200 (schema only) | 1920×1080 (16:9) fixed | No — `AbsoluteFill` background | Full-scene | Yes, with `calculateMetadata` wired in + local font stack |
| 4 | **BarChartRace** | `src/templates/ChartVideo/BarChartRace.tsx` | MIT (Alejandro Brito) | Charts & data | Data viz (full-scene) | `title: string, steps: string[], series: {label: string, color: string, values: number[]}[]` | None (inline SVG); Inter webfont at render time | remotion 4.0.200 + zod 3.22.3 + @remotion/zod-types 4.0.200 (schema only) | 1920×1080 (16:9) fixed | No — `AbsoluteFill` background | Full-scene | Yes, with `calculateMetadata` wired in + local font stack |
| 5 | **LineChartDraw** | `src/templates/ChartVideo/LineChart.tsx` | MIT (Alejandro Brito) | Charts & data | Data viz (full-scene) | `title: string, steps: string[], series: {label: string, color: string, values: number[]}[]` | None (inline SVG); Inter webfont at render time | remotion 4.0.200 + zod 3.22.3 + @remotion/zod-types 4.0.200 (schema only) | 1920×1080 (16:9) fixed | No — `AbsoluteFill` background | Full-scene | Yes, with `calculateMetadata` wired in + local font stack |
| 6 | **CaptionedShort** | `src/templates/CaptionedShort/CaptionedShort.tsx` | MIT (Alejandro Brito) | Captions | Caption / subtitle (full-scene) | `captions: {word: string, startMs: number, endMs: number}[], title: string, accentColor: string, backgroundColor: string, mode: 'single'|'group', wordsPerGroup: number` | `public/captions.sample.json` (build-time JSON import); Inter webfont at render time | remotion 4.0.200 + zod 3.22.3 + @remotion/zod-types 4.0.200 (schema only) | 1080×1920 (9:16) fixed | No — `AbsoluteFill` background | Full-scene (captions) | Yes, with `calculateMetadata` wired in + local font stack |
| 7 | **PromoTemplate** | `src/templates/PromoTemplate/PromoTemplate.tsx` | MIT (Alejandro Brito) | Promotional CTA | Promotional CTA / product promo (full-scene) | `productName: string, tagline: string, features: {title: string, description: string}[], screenshots: string[], cta: string, accentColor: string` | screenshots[] from `public/` via `staticFile()` — `public/screenshot-1.svg`, `screenshot-2.svg` | remotion 4.0.200 + zod 3.22.3 + @remotion/zod-types 4.0.200 (schema only) + @remotion/transitions 4.0.200 | 1920×1080 (16:9) fixed | No — `AbsoluteFill` background | Full-scene (promo) | Needs work — `staticFile()` + `@remotion/transitions` + local font stack |

---

## 11. Duplicates and near-duplicates across the repositories

### 11.1 Exact slug collisions (14)

Fourteen slugs exist in **both** repo 1 and repo 2. They are **not** the same code — different authors, different licences, different implementations — but they cover the same design idea, so only one should be chosen per concept. **This inventory recommends repo 2's version in every case** (typed props, resolution-adaptive, SPDX headers, a real `LICENSE` file).

| Slug | Repo 1 | Repo 2 | Same design? | Near-duplicate siblings |
|---|---|---|---|---|
| `logo-blur-reveal` | `templates/logo-blur-reveal.tsx` (RVE, MIT) | `src/components/logo-blur-reveal/LogoBlurReveal.tsx` (Trimora, MIT) | Yes — both blur a logo into focus. Repo 1 draws an inline SVG mark; repo 2 takes `logoText`, `blurAmount`, `revealDuration`, `logoColor`, `backgroundColor`, `fontSize`, `duration`. | repo 1 also has `logo-fade-reveal`, `logo-spin-reveal`, `logo-glitch-reveal`, `logo-scale-rotate`, `logo-split-reveal`, `logo-stroke-draw`, `logo-typewriter`, `logo-bounce-drop`; repo 2 has `logo-mask-wipe`, `brush-stroke-reveal`, `neon-sign`, `shatter-reveal` |
| `logo-bounce-drop` | `templates/logo-bounce-drop.tsx` | `src/components/logo-bounce-drop/LogoBounceDrop.tsx` | Yes — springy drop-in. Repo 2's version additionally takes `svgPath`/`viewBox` so the mark is data-driven. | — |
| `logo-split-reveal` | `templates/logo-split-reveal.tsx` | `src/components/logo-split-reveal/LogoSplitReveal.tsx` | Yes — panels split apart. | — |
| `logo-stroke-draw` | `templates/logo-stroke-draw.tsx` | `src/components/logo-stroke-draw/LogoStrokeDraw.tsx` | Yes — SVG stroke draws the outline then fills. Repo 1 draws a fixed hexagon+triangle; repo 2 draws a monogram badge ring. | — |
| `bokeh-circles` | `templates/bokeh-circles.tsx` | `src/components/bokeh-circles/BokehCircles.tsx` | Yes — drifting out-of-focus lights. Repo 2 adds `count`, `colors`, `label`, `labelColor`, `baseColor` props. | repo 2 also has `loop-grid-wave`, `pixel-waterfall-cycle`, `particle-snow`; repo 1 also has `starfield` (see next row) |
| `starfield` | `templates/starfield.tsx` | `src/components/starfield/Starfield.tsx` | Yes — flying-through-space star field. Repo 2 adds `count`, `starColor`, `baseColor`, `warpSpeed`, `label`, `labelColor` props. | — |
| `camera-shake` | `templates/camera-shake.tsx` (in repo 1's "Cinematic" block) | `src/components/camera-shake/CameraShake.tsx` (in repo 2's "Transitions" block) | Yes — handheld impact shake. Repo 2 adds `maxIntensity`, `impactAt`, `shakeDuration` props. | repo 1's `whip-pan` and repo 2's `whip-pan` also collide |
| `whip-pan` | `templates/whip-pan.tsx` (in repo 1's "Cinematic" block) | `src/components/whip-pan/WhipPan.tsx` (in repo 2's "Transitions" block) | Yes — fast blurred pan. Repo 2's version is the only **transparent** repo-2 template (it applies `filter: blur()` to a scene list, no background). | — |
| `glitch-text` | `templates/glitch-text.tsx` | `src/components/glitch-text/GlitchText.tsx` | Yes — RGB-split glitch. Repo 2 adds `glitchColor`, `intensity`, `fontSize`, `duration` props. | repo 2 also has `scramble-text` and `gradient-text-sweep` (different text treatments) |
| `chapter-title` | `templates/chapter-title.tsx` | `src/components/chapter-title/ChapterTitle.tsx` | Yes — numbered section-break card. Repo 2 adds `chapterLabel`, `title`, `subtitle`, `chapterColor`, `titleColor` props. | repo 3's `KineticText` is a different text treatment |
| `end-card` | `templates/end-card.tsx` | `src/components/end-card/EndCard.tsx` | Yes — outro card with CTA slots. Repo 2 adds `text`, `delay`, `fillColor`, `labelColor`, `fontSize` props. | repo 1's `subscribe-reminder` is a floating CTA variant; repo 1's `credits-roll` is the credits variant |
| `slide-wipe` | `templates/slide-wipe.tsx` | `src/components/slide-wipe/SlideWipe.tsx` | Yes — directional slide pushes the old frame out. | repo 2 also has `ink-spread-transition`, `flip-page-transition`, `card-flip-transition`, `transition-circle-wipe`, `pixel-mosaic-transition` |
| `split-screen` | `templates/split-screen.tsx` | `src/components/split-screen/SplitScreen.tsx` | Yes — two panels slide in. Repo 2 adds `direction`, `panelA`, `panelB`, `dividerColor`, `dividerWidth`, `backdropColor` props. | — |
| `parallax-pan` | `templates/parallax-pan.tsx` (Next.js `next/image` + CSS keyframes, remote Pexels image) | `src/components/parallax-pan/ParallaxPan.tsx` (pure CSS layered parallax, no image) | Conceptually yes, implementation very different. Repo 1's is an image ken-burns-style pan; repo 2's is a synthetic multi-layer landscape. **Repo 2's is the usable one.** | repo 1's `ken-burns` and `zoom-pulse` are the same family of Next.js-only image effects |

**Resolution:** keep **repo 2's** version of all fourteen — it is typed, prop-driven, MIT-with-a-`LICENSE`-file, and resolution-adaptive. Repo 1's versions are zero-prop and 16:9-fixed.

### 11.2 Near-duplicates with different names

| Concept | Repo 1 | Repo 2 | Repo 3 |
|---|---|---|---|
| Logo reveal | `logo-fade-reveal`, `logo-spin-reveal`, `logo-glitch-reveal`, `logo-blur-reveal`, `logo-bounce-drop`, `logo-scale-rotate`, `logo-split-reveal`, `logo-stroke-draw`, `logo-typewriter` (9) | `brush-stroke-reveal`, `logo-blur-reveal`, `logo-bounce-drop`, `logo-mask-wipe`, `logo-split-reveal`, `logo-stroke-draw`, `neon-sign`, `shatter-reveal` (8) | `LogoIntro` (1) |
| Headline / kinetic text | `animated-text`, `bounce-text`, `bubble-pop-text`, `floating-bubble-text`, `glitch-text`, `popping-text`, `pulsing-text`, `slide-text`, `typewriter-subtitle`, `text-highlight` (10) | `bounce-in-headline`, `four-tone-mono-titler`, `glitch-text`, `gradient-text-sweep`, `kinetic-word-stack`, `pixel-typewriter-quote`, `scramble-text`, `text-mask-reveal`, `typewriter`, `wave-text` (10) | `KineticText` (1) |
| Lower third | `lower-third` (1) | `lower-third-glass-card` (1) | `LowerThirds` (1) — 3 distinct implementations of the same archetype |
| End card / outro | `end-card`, `credits-roll`, `chapter-title`, `cinematic-title-intro`, `countdown-intro`, `quote-card`, `subscribe-reminder`, `title-split` (8) | `end-card` (1) | — |
| Transition | `blinds-transition`, `clock-wipe`, `cross-dissolve`, `fade-through-black`, `iris-transition`, `morph-transition`, `push-transition`, `slide-wipe`, `zoom-through`, `pixel-transition` (10) | `card-flip-transition`, `flip-page-transition`, `ink-spread-transition`, `pixel-mosaic-transition`, `slide-wipe`, `transition-circle-wipe` (6) | — |
| Bar chart | `chart-animation` ⚠ | `bar-chart-anim` | `BarChartRace` |
| Line chart | `line-chart` | `line-chart-anim` | `LineChartDraw` |
| Starfield / space background | `starfield` | `starfield` | — |
| Split screen | `split-screen` | `split-screen` | — |
| Parallax background | `parallax-pan` (image-based, Next.js) | `parallax-pan` (pure CSS layers) | — |
| Whip pan | `whip-pan` | `whip-pan` | — |
| Glitch text | `glitch-text` | `glitch-text` | — |
| Chapter title | `chapter-title` | `chapter-title` | — |
| Countdown timer | `countdown-timer` | — | — |
| Scatter / bubble chart | — | — | — |
| OHLC / candlestick | — | `pixel-candlestick-ohlc` | — |
| Racing bar chart | — | `racing-chart` | `BarChartRace` |
| KPI counter / dashboard | ⚠ `stat-counter` | `kpi-counter` | — |
| Typewriter quote | — | `pixel-typewriter-quote` | — |
| Text scramble | — | `scramble-text` | — |
| Gradient text sweep | — | `gradient-text-sweep` | — |
| Ink / paint reveal | — | `ink-spread-transition`, `brush-stroke-reveal`, `shatter-reveal`, `pencil-draw` | — |
| Eye / iris reveal | — | `eye-reveal` | — |
| Pixel-art set (6) | — | `four-tone-mono-titler`, `pixel-typewriter-quote`, `pixel-mosaic-transition`, `pixel-candlestick-ohlc`, `pixel-waterfall-cycle`, `pourover-drip-fill-gauge` | — |
| Captions | — | — | `CaptionedShort` |
| Social / chat UI | `notification-pop` | `community-chat`, `social-reel`, `thinking-bubble`, `character-jumping`, `wave-hello` | — |

**Summary of the duplication shape:** repo 1 and repo 2 are two largely independent catalogues of the same design space, written by two different teams. Repo 2 is the *engineering-grade* catalogue (typed props, resolution-adaptive, SPDX headers, a `LICENSE` file, a shipped `ASSETS.md`); repo 1 is the *design-catalogue* repository (81 files, no build, no licence file, mostly zero-prop). Repo 3 is a small, high-quality, production-shaped set of 7 that adds `calculateMetadata`, zod schemas, safe-area helpers, seeded PRNG discipline and real promo/CTA/caption scenarios.

---

## 12. Gallery-only templates (premium — not usable, recorded for completeness)

The React Video Editor gallery lists **95** templates. **81** of them are repo 1 (all of which appear there), and **14** exist only in the gallery. All 14 are `tier: "pro"` and their source is withheld by the vendor (`"This is a Pro template — source is not available publicly. See the page for access."`). They are in none of the three repositories, so they are **out of scope** and **must not be imported**.

| Template | Gallery slug | Category | Duration | Tier |
|---|---|---|---:|---|
| Animated Leaderboard | `animated-leaderboard` | Content Animation | 120f @ 30 | pro |
| Bar Chart Race | `bar-chart-race` | Charts & Data | 195f @ 30 | pro |
| Bubble Chart | `bubble-chart` | Charts & Data | 120f @ 30 | pro |
| Candlestick Chart | `candlestick-chart` | Charts & Data | 150f @ 30 | pro |
| Coverflow Carousel | `coverflow-carousel` | Content Animation | 150f @ 30 | pro |
| Gauge Meter | `gauge-meter` | Charts & Data | 120f @ 30 | pro |
| Heatmap Grid | `heatmap-grid` | Charts & Data | 120f @ 30 | pro |
| KPI Dashboard | `kpi-dashboard` | Charts & Data | 120f @ 30 | pro |
| Multi-Line Chart | `multi-line-chart` | Charts & Data | 120f @ 30 | pro |
| Onboarding Steps | `onboarding-steps` | Content Animation | 150f @ 30 | pro |
| Radar Chart | `radar-chart` | Charts & Data | 120f @ 30 | pro |
| Stacked Bar Chart | `stacked-bar-chart` | Charts & Data | 120f @ 30 | pro |
| Toast Stack | `toast-stack` | Content Animation | 120f @ 30 | pro |
| Waterfall Chart | `waterfall-chart` | Charts & Data | 120f @ 30 | pro |

The gallery also exposes a paid MCP endpoint (`https://www.reactvideoeditor.com/api/mcp`) and a paid "RVE Pro" product. **Do not wire the gallery MCP server into this repository** — it is a paid service and its `get_template` tool intentionally withholds the Pro templates' source.

---

## 13. Templates judged unusable, and why

| Template(s) | Repo / path | Reason | Severity |
|---|---|---|---|
| `area-chart`, `chart-animation`, `comparison-chart`, `donut-chart`, `progress-bars`, `stat-counter` | repo 1 `templates/*.tsx` | **Premium / paid.** Present in the repo with full source, but the vendor's own catalogue marks them `tier: "pro"` and withholds their source publicly. The product owner must not import paid content into an MIT product. **Excluded.** | Blocker |
| All 14 gallery-only Pro templates | gallery only | **Premium / paid, and not in any repository.** Source withheld. | Blocker |
| `ken-burns` | repo 1 `templates/ken-burns.tsx` | Uses CSS `@keyframes` inside `<style jsx>` — animation timing is wall-clock, not `useCurrentFrame()`, so output is **not deterministic** and will drift between preview and export. Also pulls a remote Unsplash image at render time. | Needs rewrite |
| `parallax-pan` | repo 1 `templates/parallax-pan.tsx` | Same CSS `@keyframes` problem **plus** `next/image` with a remote Pexels URL (requires `next.config` `images.remotePatterns` and a Next.js runtime, and is not frame-accurate). | Needs rewrite |
| `zoom-pulse` | repo 1 `templates/zoom-pulse.tsx` | Same CSS `@keyframes` problem **plus** `next/image` with a remote Pexels URL. | Needs rewrite |
| `LogoIntro` | repo 3 `src/templates/LogoIntro/LogoIntro.tsx` | `staticFile()` has no `public/` dir in the browser export path. **Fixable:** the prop is already a plain string; pass an absolute URL. | Needs 1-line change |
| `PromoTemplate` | repo 3 `src/templates/PromoTemplate/PromoTemplate.tsx` | `staticFile()` (as above) **plus** `@remotion/transitions@4.0.200` would have to be added at `4.0.499`, and `TransitionSeries` nests `Sequence`s so it depends on the `SequenceManager` shim. | Needs 3 changes |
| Repo 3 `src/lib/fonts.ts` (affects all 7 repo-3 templates) | repo 3 | `@remotion/google-fonts` fetches Inter from Google Fonts at render time — a third-party network call inside a product whose export is otherwise fully local. Substitute this repo's `fontStackById()`. | Needs 1-line change |
| All 57 repo-2 + repo-3 templates, for the *overlay* use case only | — | **Not unusable, but not overlay-capable as shipped.** Every one of them paints an opaque `AbsoluteFill` background, so they cannot be placed over the customer's existing video without removing that background fill. This is a mechanical change, not a redesign. | Adaptation required |
| `lower-third-glass-card` | repo 2 | `backdrop-filter: blur(14px)` is lost in canvas compositing — the glass degrades to a flat translucent panel. Renders, but not as designed. | Fidelity caveat |
| `community-chat`, `flip-page-transition`, `social-reel`, `KineticText`, `PromoTemplate` | repo 2 / repo 3 | Use `<Sequence>`, which throws without a `SequenceManager` provider. This repo's `NOOP_SEQUENCE_MANAGER` shim already covers it — but the template must be rendered as a descendant of it, and the shim must not be removed. | Ordering constraint |
| 78 of 81 repo-1 templates | repo 1 | **Zero props** — copy, colour and geometry are hardcoded. They cannot be driven by a personalization flow without being rewritten. This is the dominant blocker for repo 1, not the licence. (The 3 exceptions are `ken-burns`, `parallax-pan` and `zoom-pulse`, which take an `imageUrl` but are not frame-accurate.) | Adaptation required |
| 69 of 81 repo-1 templates | repo 1 | 16:9-only in practice: hardcoded pixels and `rem` units tuned for 1920×1080. The personalization flow offers 9:16, 1:1 and 4:5, where these will be mispositioned. | Adaptation required |

---

## 14. Recommended integration plan

1. **Adopt repo 2 as the primary template source** (50 templates, MIT with a `LICENSE` file, SPDX headers, typed props, resolution-adaptive layout, zero external assets). Lift **component source only** — never repo 2's `package.json` — so this repo's `remotion@4.0.499` resolution applies.
2. **Do not import the 6 premium chart templates** from repo 1, and do not use the gallery's paid MCP endpoint.
3. **Treat repo 1 as a design reference**, not a code source: its 13 transparent overlays are the only ones that work over a video, but all 13 are zero-prop. Use them as motion-design references for the headline / effect archetypes, and reimplement against repo 2's prop model.
4. **Treat repo 3 as the reference for the "hard" templates** — `LowerThirds` (safe-area + enter/hold/exit timing), `PromoTemplate` (multi-scene CTA), `CaptionedShort` (word-timed captions) — but port them to repo 2's conventions: drop `zod`/`@remotion/zod-types`, drop `@remotion/google-fonts` in favour of `fontStackById()`, replace `staticFile()` with absolute URLs, and add `@remotion/transitions@4.0.499` only if `PromoTemplate` is actually needed.
5. **Make the overlay adaptation explicit and mechanical**: for every selected template, replace the root `<AbsoluteFill style={{ backgroundColor: … }}>` with a transparent root, and drive placement from `PersonalizationComposition`'s existing normalized layer coordinates (`x`, `y`, `scale` in `PreviewLayer`).
6. **Keep the `Internals.SequenceManager.Provider` no-op shim** in `PersonalizationComposition` — it is what makes `<Sequence>`-based templates renderable in the browser export path.
7. **Wire `calculateMetadata` into `webExport.ts`** if any repo-3-derived template is used, or compute the duration in the caller.
8. **Add an attribution file** recording: repo 2's `MIT License / Copyright (c) 2026 Trimora Inc.` notice (required), repo 3's `MIT License / Copyright (c) 2026 Alejandro Brito` notice (required), and repo 1's "Created by the team at https://www.reactvideoeditor.com — credit appreciated but not required" line (optional but requested upstream). Because repo 1 has no `LICENSE` file, this attribution is the *only* licence record for it.
9. **Keep every `remotion`/`@remotion/*` package pinned at `4.0.499`.** Do not add `4.0.518` (repo 2) or `4.0.200` (repo 3) — mixed Remotion versions in one bundle break `useCurrentFrame`, `delayRender` and the web-renderer's internals.

---

## 15. Provenance

| Source | Cloned to | Read | Copied into this repo |
|---|---|---|---|
| `https://github.com/deangilmoreremix/remotion-templates` | `/tmp/remotion-src/remotion-templates` | README, all 81 `templates/*.tsx` | **1 adapted component** — `templates/particle-explosion.tsx` → `src/shared/personalization/remotion/designs/particle-explosion.tsx` |
| `https://github.com/deangilmoreremix/free-remotion-templates` | `/tmp/remotion-src/free-remotion-templates` | `LICENSE`, `README.md`, `ASSETS.md`, `package.json`, `src/Root.tsx`, all 50 `src/components/*/*.tsx`, `src/pixel-kit/*` | **4 adapted components** — `bounce-in-headline`, `logo-mask-wipe`, `lower-third-glass-card`, `social-reel` → `src/shared/personalization/remotion/designs/*.tsx` |
| `https://github.com/deangilmoreremix/remotion-video-templates` | `/tmp/remotion-src/remotion-video-templates` | `LICENSE`, `README.md`, `package.json`, `src/Root.tsx`, all 7 template files, `src/lib/*`, `public/*` | **nothing** (its 7 templates are not compatible with the browser export engine — see §14) |
| `https://www.reactvideoeditor.com/remotion-templates` (+ its MCP catalogue) | fetched over HTTPS | 95 template metadata records; `sourceCode` for 14 free templates, diffed against repo 1 | **nothing** |

**What was and was not taken.** Only the five component bodies listed above were adapted into this repository, each carrying an `SPDX-License-Identifier: MIT` header naming its upstream repo, original file path and licence, with the same information repeated in `registry.ts` `source`. No application configuration was copied: there is **no** upstream `package.json`, **no** `remotion.config.ts`, **no** `Root`/entry scaffolding, and **no** bundled asset, font or `public/` directory anywhere in this repository. The repo's Remotion version is unchanged at `4.0.499`, and the upstream repos' own versions (`4.0.518`, `4.0.200`) appear nowhere in this repo's `package.json` or lockfile. The adaptations are described in `docs/REMOTION_PHASE_1_REPORT.md` §6.

