# Phase 2 — Template Plan (candidate tables)

**Owner:** A6 (Upstream & Dependency Analyst) · **Consumers:** A7 (batch 1), A8 (batch 2), A11 (integration)

**Surveyed:** 2026-10-21 · **Pinned baseline:** `84a9d1586` · **Branch:** `feature/remotion-personalization-phase-2`

Companion memo: [`docs/phase2/handoffs/A6.md`](./handoffs/A6.md).

Upstream clones inspected **in place** (not re-cloned), at
`/private/tmp/remotion-src/{free-remotion-templates,remotion-templates,remotion-video-templates}`:

| Short id | HEAD commit | Licence | Attribution |
|---|---|---|---|
| repo 1 `free-remotion-templates` | `f648980e528defb7594e24c6447055f0540f340b` | MIT-TRIMORA, © 2026 Trimora Inc. | **mandatory** |
| repo 2 `remotion-templates` | `6209b724798e48ff395f8df1a6fa2d26082372b5` | MIT-RVE (README prose only, no `LICENSE` file) | optional (recommended) |
| repo 3 `remotion-video-templates` | `90149464d51a43fcb90e15491bf0d681c1b0fa49` | MIT-BRITO, © 2026 Alejandro Brito | mandatory |

> The task brief points at `/var/folders/2q/…/T/kilo/remotion-src/`. That path does **not** exist on
> this machine; the clones are at `/private/tmp/remotion-src/`. Same three repos, same commits
> (verified against the Phase 1 inventory, §"Method"), so the inventory's evidence still holds.

---

## 1. Dependency decision for repo 3 — **SKIP**

| | Target (`OpenHiggsBolt`) | repo 3 upstream |
|---|---|---|
| `remotion` | **4.0.499** | 4.0.200 |
| `@remotion/media` / `player` / `web-renderer` | **4.0.499** | — |
| `@remotion/zod-types` | **absent** | 4.0.200 |
| `@remotion/google-fonts` | **absent** | 4.0.200 |
| `@remotion/transitions` | **absent** | 4.0.200 |
| `zod` | **not a direct dependency** (only transitive 4.4.3 / 3.25.76) | 3.22.3 (direct) |
| `react` | **^19.0.0** | 18.3.1 |

**Decision: do not add the dependencies. Skip repo 3 for Phase 2.**

Reason 1 — **it breaks the zero-network render property, and the existing test cannot see it.**
`@remotion/google-fonts` loads the font **at render time, in the browser**, from a hardcoded
`fonts.gstatic.com` URL:

```js
// @remotion/google-fonts@4.0.200/dist/cjs/base.js
const handle = delayRender(`Fetching ${meta.fontFamily} font …`);
const fontFace = new FontFace(meta.fontFamily, `url(${font}) format('woff2')`, {…});
fontFace.load().then(() => { document.fonts.add(fontFace); continueRender(handle); });
// Inter.js: 'latin': 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
```

`FontFace.load()` is a browser-internal network request — it is **not** `window.fetch`, so
`src/shared/personalization/__tests__/noNetworkDuringBrandRender.test.ts` (which spies on
`fetch` / `XMLHttpRequest` / `WebSocket`) would **still pass** while the render silently talks to
Google. That is the worst failure mode: a green test over a broken property. Beyond that, the
`delayRender` handle makes the web-renderer **block** on a network round-trip, an offline export
falls back to a system face (non-deterministic typography), and 5 of the 7 designs would each
issue 5 woff2 fetches.

Reason 2 — **Remotion version lockstep.** Every `@remotion/*` package must match `remotion`
exactly. Repo 3 pins `4.0.200`; the target is `4.0.499`. Pinning `4.0.200` is a hard version
mismatch. The `4.0.499` builds **do** exist on npm (verified), but adding them means
3 new direct `@remotion/*` deps + `zod`, and `@remotion/transitions@4.0.499` drags in
`@remotion/paths` + `@remotion/shapes` — 6 packages — which contradicts `ADAPTER-SPEC.md` §0.3
rule 9 ("No new npm dependencies") and this phase's "do not touch `package.json`" constraint.

Reason 3 — **the decisive one: 0 of the 7 repo-3 designs is an overlay.** Even with every
dependency installed, all 7 paint an opaque full-canvas stage that cannot be turned off:

| Design | Root paint | Turn-offable? |
|---|---|---|
| `LogoIntro` | `<AbsoluteFill style={{ backgroundColor }}>` (LogoIntro.tsx:129) + `staticFile(logoSrc)` (line 162) | no — and it needs a served `public/logo.svg` |
| `LowerThirds` | `<StageBackground />` → `linear-gradient(120deg, palette.zinc100, palette.zinc200)` (LowerThirds.tsx:57, 93) | **no — the colour is a hard-coded literal, not a prop** |
| `KineticText` | `<AbsoluteFill style={{ backgroundColor }}>` (KineticText.tsx:161) | prop, but it is a full-scene type composition, not a bounded overlay |
| `BarChartRace` | `<AbsoluteFill style={{ backgroundColor: palette.white }}>` (BarChartRace.tsx:90) | **no — hard-coded white** |
| `LineChartDraw` | `<AbsoluteFill style={{ backgroundColor: palette.white }}>` (LineChart.tsx:54) | **no — hard-coded white** |
| `CaptionedShort` | `background: linear-gradient(160deg, ${backgroundColor}, ${mix(backgroundColor, …)})` (CaptionedShort.tsx:117) | no — `mix()` needs a hex |
| `PromoTemplate` | `palette.white` / `palette.zinc50` / `palette.ink` `AbsoluteFill`s (PromoTemplate.tsx:91, 155, 261, 348) | **no** |

Reason 4 — **assets.** `LogoIntro` → `public/logo.svg` via `staticFile()`; `PromoTemplate` →
`public/screenshot-1.svg` + `public/screenshot-2.svg` via `staticFile()`; `CaptionedShort` →
`public/captions.sample.json` imported at build time. The browser web-renderer would need to
**serve** those files, i.e. more network traffic during the "no network" render.

**Quantified deferral:** 7 of 138 upstream templates (5.1 %) deferred. 6 of the 7 are unusable as
overlays for a reason unrelated to dependencies; the 7th (`LogoIntro`) would need a served asset.
**Net new overlay designs available from repo 3 = 0.** The cost of unblocking them is 6 npm
packages + a network fetch in the render path. Deferred, not cancelled.

**Re-open the decision when** (a) a `fonts.ts` that embeds a font locally exists (A10 owns
`templates/designs/fonts.ts` — a *local* `@font-face`/base64 font avoids the network entirely),
and (b) the product can serve a `public/` directory to the web-renderer.

---

## 2. Batch 1 — repo 1 (`free-remotion-templates`), for **A7**

Selection criteria, in the order given in the brief:

1. no `@remotion/media` `<Video>`/`<Audio>`; no hard `staticFile()` dependency — **all 50 repo-1
   designs pass** (verified: 0 hits for `staticFile`, `<Video`, `<Audio`, `@remotion/media` across
   `src/components/**`).
2. transparent / absolutely-positioned background — the root `<AbsoluteFill>` background must be a
   **prop** that can take the literal `"transparent"`, and no other element may paint the canvas
   opaquely.
3. props that map cleanly onto `RemotionDesignTextField`, or a role that needs no text at all.
4. no `@remotion/google-fonts` — **all 50 pass** (only `-apple-system, "Segoe UI", Roboto, sans-serif`).
5. composes well over a video (a bounded box, not a full-frame effect).
6. duration ≤ 150 frames.

### 2.1 The 10 recommended candidates

| # | proposed id | upstream path | category | overlay-able? | browser-export compatible? | textSlots (INTERFACE-slots.md) | required assets | aspect ratios | duration | risks |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `starfield-warp` | `src/components/starfield/Starfield.tsx` | `visual-effect` | **yes** — `baseColor` is a plain prop → `"transparent"`; `label` is optional and must be `undefined` | **yes** — plain CSS gradients + `boxShadow`, no filter, no blend mode, no animation | `[]` (no text; the upstream's `"BACKGROUND"` label must never be reachable) | none (system font stack) | all four (geometry derives from `width`/`height`) | 150 f | It is a full-frame particle field, so it must be placed at `scale = 1`, `x 0.5`, `y 0.5`, `animation: 'none'`, `opacity 1` (same stacking-context trap as `bokeh-circles`, but this template has **no** `mix-blend-mode`, so it is safe) |
| 2 | `logo-bounce-drop` | `src/components/logo-bounce-drop/LogoBounceDrop.tsx` | `logo-reveal` | **yes** — `backgroundColor` prop → `"transparent"` | **yes** — `spring()` + `transform`, no filter/blend/animation | `[{ key: 'businessName', field: 'businessName', label: 'Business name', primary: true }]` | none | 16:9 / 9:16 / 1:1 (scale-relative, `dropHeight` is a fraction of `height`) | 90 f | `fontSize: 240` is a hard-coded px; `svgPath` must be `""` (text mode) or the adapter would have to own an SVG; the wordmark can overflow → truncate |
| 3 | `logo-mask-wipe` | `src/components/logo-mask-wipe/LogoMaskWipe.tsx` | `logo-reveal` | **yes** — `backgroundColor` prop → `"transparent"`; a low-alpha radial badge glow remains (not switchable) | **yes** — inline SVG `clipPath`, no filter/blend/animation | `[{ key: 'businessName', field: 'businessName', label: 'Business name', primary: true }]` (→ `brandText`; `monogram` = first glyph) | none | all four (every dimension is a fraction of `width`/`height`) | 100 f | **Fixed SVG id `lmw-wipe`** (line 108) — duplicate DOM id if two instances mount; the 13 %-alpha accent glow is full-canvas-ish |
| 4 | `logo-split-reveal` | `src/components/logo-split-reveal/LogoSplitReveal.tsx` | `logo-reveal` | **yes** — `backgroundColor` prop → `"transparent"` | **yes** — `clip-path: inset(...)` + `transform` | `[{ key: 'businessName', field: 'businessName', label: 'Business name', primary: true }]` | none | 16:9 / 9:16 / 1:1 (`safeFontSize` clamps to `width * 0.86`) | 120 f | `splitOffset` defaults to **960 px**, which assumes a 1920-wide canvas → the adapter must pass `Math.round(width * 0.5)`; `fontSize: 260` hard-coded px (the upstream clamps it, but the clamp is width-relative so it survives) |
| 5 | `brush-stroke-reveal` | `src/components/brush-stroke-reveal/BrushStrokeReveal.tsx` | `animated-headline` | **yes, but the prop default is a footgun** — `background` defaults to the opaque cream `"#fffdf6"` in *both* the default-props object and the destructuring default, so the adapter **must** pass `"transparent"` explicitly | **yes** — `clip-path: inset(...)` + `scaleX`, no filter/blend/animation | `[{ key: 'headline', field: 'headline', label: 'Headline', primary: true }, { key: 'offer', field: 'offer', label: 'Subline' }]` | none | 16:9 / 9:16 / 1:1 / 4:5 (content is a centred flex column) | 120 f | `fontSize: 160` + `letterSpacing: 12` are hard-coded px inside JSX (no prop); `padding: 64` fixed px; the title is one `<div>` and does not wrap per word |
| 6 | `text-mask-reveal` | `src/components/text-mask-reveal/TextMaskReveal.tsx` | `animated-headline` | **partial** — `backgroundColor` prop → `"transparent"`, but a full-canvas `radial-gradient(circle at 18% 22%, ${accentColor}22 0%, ${accentColor}00 50%)` sits on top (line 91) and cannot be switched off | **yes** — `clip-path: inset(...)`, no filter/blend/animation | `[{ key: 'headline', field: 'headline', label: 'Headline', primary: true }]` (the upstream takes `lines: string[]` — see contract addition **C1**) | none | all four (`lineHeight = height * 0.17`) | 110 f | The upstream's own fallback `["REVEAL"]` (line 43) must never be reachable; the ambient corner glow must be declared in `capabilities.notes` and the design must not be placed at `scale = 1` |
| 7 | `glitch-text` | `src/components/glitch-text/GlitchText.tsx` | `animated-headline` | **yes** — `backgroundColor` prop → `"transparent"`; the three tear bands repaint `backgroundColor` opaquely (line 214) — with `"transparent"` they read as transparent tear bands, which is the desired glitch | **yes, with a note** — `mixBlendMode: "screen"` on the R/B layers (lines 147, 158). The blend is *inside* the text stack (the parent has a `transform`, so it creates the stacking context), so it does **not** need the video and is **not** the `bokeh-circles` trap | `[{ key: 'headline', field: 'headline', label: 'Headline', primary: true }]` | none | 16:9 / 9:16 / 1:1 / 4:5 | 120 f | `fontSize: 220` hard-coded px and `whiteSpace: "nowrap"` → the adapter **must** truncate the headline or it runs off the canvas; the `screen` blend renders as flat #FF0033/#00E0FF offsets inside the scale-wrapper — that is the intended look, do not "fix" it |
| 8 | `logo-blur-reveal` | `src/components/logo-blur-reveal/LogoBlurReveal.tsx` | `logo-reveal` | **yes** — `backgroundColor` prop → `"transparent"` | **conditional** — `filter: blur(${blur}px)` (line 99). Chromium supports it, but the blur must be **verified in an exported frame** (same class as `bokeh-circles`' `filter: blur(20px)`) | `[{ key: 'businessName', field: 'businessName', label: 'Business name', primary: true }]` | none | 16:9 / 9:16 / 1:1 | 120 f | `fontSize: 260` hard-coded px; `blurAmount: 40` is a hard-coded px blur; the component **fades out over the last 0.4 s** (`fadeOut`), so the design must not be the last thing on screen; `revealDuration`/`duration` are in **seconds**, not frames |
| 9 | `chapter-title` | `src/components/chapter-title/ChapterTitle.tsx` | `other` | **partial** — `background` prop → `"transparent"`, but a full-canvas 3 %-white grid is painted at `inset: 0` (lines 184–192) and cannot be switched off | **yes** — `transform: scale()` + `linear-gradient`, no filter/blend/animation | `[{ key: 'chapterLabel', field: 'offer', label: 'Chapter label' }, { key: 'title', field: 'headline', label: 'Title', primary: true }, { key: 'subtitle', field: 'businessName', label: 'Subtitle' }]` | none | 16:9 / 9:16 / 1:1 / 4:5 (`isPortrait` switch) | 150 f | The subtitle colour is a hard-coded `rgba(255,255,255,0.6)` (line 231) — it will be invisible over a light video; the 3 %-white grid reads as a haze over the whole frame → bounded placement only |
| 10 | `bar-chart-anim` *(optional)* | `src/components/bar-chart-anim/BarChartAnim.tsx` | `other` | **yes** — `background` prop → `"transparent"`; nothing else paints the canvas (the bars use `b.color ?? accentColor`) | **yes** — `spring()` + flex, no filter/blend/animation | `[{ key: 'title', field: 'headline', label: 'Chart title', primary: true }, { key: 'subtitle', field: 'offer', label: 'Chart subtitle' }]` | none | all four (`scale = Math.min(width, height) / 1080`) | 150 f | **`bars: BarItem[]` is a required array prop and the customer cannot supply data** — the bars must be pinned in `defaultProps` as an explicitly-labelled placeholder dataset (see contract addition **C13**); the chart is a full-scene composition, so it only works as a bounded card over the video |

### 2.2 The decisive quotes (overlay-ability + browser-export safety)

| # | quote (file:line) | what it proves |
|---|---|---|
| 1 | `starfield/Starfield.tsx:76` — `<AbsoluteFill style={{ backgroundColor: baseColor, overflow: "hidden" }}>`; `:96` — `background: \`linear-gradient(90deg, transparent, ${starColor})\`` | the canvas fill is a plain prop → `"transparent"`; the only other paint is a CSS gradient |
| 2 | `logo-bounce-drop/LogoBounceDrop.tsx:120-128` — `<AbsoluteFill style={{ backgroundColor, display: "flex", alignItems: "center", justifyContent: "center", opacity: fadeOut }}>`; `:131` — `transform: \`translateY(${y}px) scale(${scaleX}, ${scaleY})\`` | plain colour prop; only `transform`/`opacity` → rasterises identically in a browser DOM capture |
| 3 | `logo-mask-wipe/LogoMaskWipe.tsx:88` — `<AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>`; `:107-118` — `<clipPath id="lmw-wipe" clipPathUnits="userSpaceOnUse">` | plain colour prop; the only SVG feature is `clipPath` (static DOM, no filter) |
| 4 | `logo-split-reveal/LogoSplitReveal.tsx:141-145` — `<AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>`; `:153` — `clipPath: "inset(0 50% 0 0)"` | plain colour prop; `clip-path: inset()` is a static DOM feature |
| 5 | `brush-stroke-reveal/BrushStrokeReveal.tsx:137-147` — `<AbsoluteFill style={{ backgroundColor: background, … padding: 64 }}>`; `:97` — `clipPath: \`inset(${top}% 0 ${bottom}% 0)\`` | the background is a prop (but see the footgun); `clip-path` only |
| 6 | `text-mask-reveal/TextMaskReveal.tsx:80-86` — `<AbsoluteFill style={{ backgroundColor, fontFamily: FONT, overflow: "hidden", opacity: fadeOut }}>`; `:171` — `clipPath: \`inset(0 ${100 - textVisiblePct}% 0 0)\`` | plain colour prop; `clip-path` only; the corner glow at `:91` is the one non-switchable paint |
| 7 | `glitch-text/GlitchText.tsx:190-195` — `<AbsoluteFill style={{ backgroundColor, opacity: opacity * fadeOut }}>`; `:147` / `:158` — `mixBlendMode: "screen"` | plain colour prop; the only risky CSS is `mix-blend-mode`, and it blends *within* the text stack, not against the video |
| 8 | `logo-blur-reveal/LogoBlurReveal.tsx:87-95` — `<AbsoluteFill style={{ backgroundColor, display: "flex", …, opacity: fadeOut }}>`; `:99` — `filter: \`blur(${blur}px)\`` | plain colour prop; the single rasteriser-dependent feature is the blur |
| 9 | `chapter-title/ChapterTitle.tsx:173-182` — `<AbsoluteFill style={{ backgroundColor, display: "flex", flexDirection: "column", … }}>`; `:184-192` — `position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, …)"` | plain colour prop; the full-canvas 3 %-white grid is the caveat |
| 10 | `bar-chart-anim/BarChartAnim.tsx:89-100` — `<AbsoluteFill style={{ backgroundColor: background, … padding: 80 * scale, gap: 56 * scale }}>`; `:63` — `const scale = Math.min(width, height) / 1080` | plain colour prop; resolution-relative geometry |

### 2.3 Repo-1 designs **rejected**, with the reason

| rejected | why (verified in the clone) |
|---|---|
| `wave-text` | `WaveText.tsx:161` — `background: \`linear-gradient(180deg, ${background} 0%, ${shade(background, -15)} 100%)\`` and `shade()` at `:48-64` does `parseInt(hex, 16)`. Executed: **`shade("transparent", -15) === "#000000"`** → the root paints an opaque black gradient over the lower half. **Not overlay-able.** (The Phase 1 inventory marked this "yes" — corrected here.) |
| `scramble-text` | `ScrambleText.tsx:157-160` — `backgroundImage: \`linear-gradient(180deg, ${background} 0%, ${shiftLightness(background, 8)} 100%), …\`` and `shiftLightness()` at `:54-60`. Executed: **`shiftLightness("transparent", 8) === "#001200"`** → an opaque near-black gradient. **Not overlay-able.** (Phase 1 inventory said "yes" — corrected.) |
| `line-chart-anim` | `LineChartAnim.tsx:215` — `stroke={background}` → `"transparent"` makes the axis/grid strokes invisible |
| `camera-shake` | `CameraShake.tsx` root is `<AbsoluteFill style={{ backgroundColor: "#000" }}>` — the background is **hard-coded**, not a prop |
| `whip-pan` | same hard-coded `"#000"` root, plus `filter` |
| `gradient-text-sweep` | `background-clip: text` + `WebkitTextFillColor: transparent` (the CSS most likely to break under browser rasterisation) **and** a full-canvas `radial-gradient(circle at 50% 46%, ${accentColor}26 …)` that cannot be disabled |
| `kinetic-word-stack` | full-canvas `radial-gradient(circle at 50% 50%, ${accentColor}22 …)` + a centre guide line, neither switchable |
| `particle-snow` | `ParticleSnow.tsx:122` — `<rect width={width} height={height} fill="url(#snow-sky)" />` → an opaque sky gradient over the whole canvas even with a transparent root |
| `four-tone-mono-titler` | `FourToneMonoTitler.tsx:100` — `hexToRgb(tone0)`; the pixel kit needs **hex** colours, so `"transparent"` cannot be passed. Also needs the 5-file `src/pixel-kit/**` helper and a 4-tone opaque base |
| `pixel-typewriter-quote`, `pourover-drip-fill-gauge`, `pixel-candlestick-ohlc`, `pixel-waterfall-cycle` | 180 f > the 150 f budget; all need `src/pixel-kit/**`; all are opaque pixel stages |
| `racing-chart` | 210 f > 150 f |
| `end-card` (full-frame transparent variant) | `CtaButton` sets `labelColor={background}` — already handled in Phase 1 by bounding the card |
| `flip-page-transition`, `wave-hello` | CSS `animation` / `@keyframes` → wall-clock driven, not frame-synchronised (breaks `ADAPTER-SPEC` §0.3 rule 10) |
| `neon-sign`, `card-flip-transition`, `whip-pan` | `filter` on a full-canvas scene, plus a full-canvas opaque root |
| `typewriter`, `eye-reveal`, `pencil-draw`, `fireworks-burst` | full-canvas SVG scenes — a bounded box would crop the drawing |
| `social-reel`, `split-screen`, `community-chat` | a hard-coded 608×1080 phone mock / two opaque panels / an opaque app window |
| `bar-chart-anim` (top pick) | accepted as #10, see the risk column |

---

## 3. Batch 2 — repo 2 (`remotion-templates`), for **A8**

78 of the 81 files hardcode every string, colour and dimension in JSX. The shortlist is the four
repo-2 files whose **root element has no background at all** and which contain no `Math.random`,
no CSS `animation`/`transition`, no `filter` and no `mix-blend-mode`:

| file | root background | `Math.random` | CSS anim/transition | filter | blend |
|---|---|---|---|---|---|
| `templates/circular-progress.tsx` | none | 0 | 0 | 0 | 0 |
| `templates/animated-text.tsx` | none | 0 | 0 | 0 | 0 |
| `templates/popping-text.tsx` | none | 0 | 0 | 0 | 0 |
| `templates/slide-text.tsx` | none | 0 | 0 | 0 | 0 |
| *(runner-up)* `templates/typewriter-subtitle.tsx` | none | **1** (line 43) | **1** (line 55) | 0 | 0 |

### 3.1 `rve-circular-progress` — `templates/circular-progress.tsx`

Hardcoded values:

| file:line | value | role |
|---|---|---|
| `circular-progress.tsx:29` | `const radius = 80;` | ring radius in a `0 0 200 200` viewBox |
| `:73` | `stroke="rgba(255, 255, 255, 0.1)"` | track colour |
| `:74`, `:94` | `strokeWidth="12"` | ring weight |
| `:93` | `stroke="url(#progressGradient)"` | progress ring paint |
| `:108` | `<stop offset="0%" stopColor="#3b82f6" />` | gradient start (brand blue) |
| `:109` | `<stop offset="100%" stopColor="#1e3a8a" />` | gradient end (dark brand blue) |
| `:102` | `id="progressGradient"` | **fixed SVG id** |
| `:124` | `<circle cx="100" cy="20" r="8" fill="#3b82f6" />` | rotating dot |
| `:136` | `color: "white"` | percentage text |
| `:134` | `fontSize: "3rem"` | percentage text size |

Parameterisation (all additive props with the upstream values as defaults):

- `trackColor` (default `"rgba(255, 255, 255, 0.1)"`) → `trackColor`
- `progressFrom` (default `"#3b82f6"`) → `colors.accent`
- `progressTo` (default `"#1e3a8a"`) → a darkened `colors.accent` (`darkenColor()` from `designs/shared.tsx`)
- `dotColor` (default `"#3b82f6"`) → `colors.accent`
- `textColor` (default `"white"`) → `props.color ?? colors.text`
- `fontSize` (default `"3rem"`) → keep, but note `rem` is document-relative, not canvas-relative

**Faithful?** Yes for the colours. **One caveat:** the progress value is time-driven —
`interpolate(frame % 90, [0, 90], [0, 100])` (line 21) — it is a *looping loading ring*, not a
data value. Making the percentage meaningful would change the design's semantics, so **do not**
parameterise the value; brand the colours and the text colour only, and keep the loop.

### 3.2 `rve-animated-text` — `templates/animated-text.tsx`

| file:line | value | role |
|---|---|---|
| `animated-text.tsx:20` | `const text = "Hello Remotion".split("");` | the copy |
| `:30` | `textAlign: "center"` | layout |
| `:66` | `color: "white"` | text colour |
| `:67` | `fontSize: "5rem"` | text size |
| `:68` | `fontWeight: "bold"` | text weight |

Parameterisation: `text: string` (default `"Hello Remotion"`), `color: string` (default
`"white"`), `fontSize: string` (default `"5rem"`), `fontWeight: string` (default `"bold"`).
The per-character choreography (`delay = i * 5`, three springs with `mass: 0.5`, `damping: 10/12`,
`from: -50 / -180`) is **not** touched.

**Faithful?** Yes — a one-line change (`const text = props.text.split("")`) plus colour/size
props. The upstream design is byte-for-byte identical when the defaults are used.

### 3.3 `rve-popping-text` — `templates/popping-text.tsx`

| file:line | value | role |
|---|---|---|
| `popping-text.tsx:20` | `const text = "BINGO!".split("");` | the copy |
| `:22-26` | `const colors = ["#1e3a8a", "#3b82f6", "#A9D6E5"];` | the 3-colour palette |
| `:45` | `const colorIndex = i % colors.length;` | the per-character rotation |
| `:70` | `color: colors[colorIndex]` | per-character colour |
| `:71` | `fontSize: "8rem"` | text size |
| `:74-78` | `textShadow: \`0 0 10px ${colors[colorIndex]}80, -2px -2px 0 #fff, …\`` | glow + a hard-coded **white** 4-way outline |
| `:80` | `fontFamily: "'Impact', 'Arial Black', sans-serif"` | the display face |
| `:81` | `letterSpacing: "0.05em"` | tracking |

Parameterisation: `text`, `colors: string[]` (default the three upstream blues), `outlineColor`
(default `"#fff"`), `fontSize`, `fontFamily`, `letterSpacing`. The `i % colors.length` rotation
is preserved, so the brand palette rotates across the characters exactly as upstream.

**Faithful?** Yes. Map `colors` to `[colors.accent, colors.primary, colors.text]`; keep 3 entries
so the rotation looks the same.

### 3.4 `rve-slide-text` — `templates/slide-text.tsx`

| file:line | value | role |
|---|---|---|
| `slide-text.tsx:59` | `Sliding Text!` | the copy (inside the `<h1>`) |
| `:54` | `color: "white"` | text colour |
| `:55` | `fontSize: "4rem"` | text size |
| `:56` | `fontWeight: "bold"` | text weight |
| `:20-38` | the two springs (`from: 0 → 1`, `from: 200 → 0`, `durationInFrames: 30`) | the motion — **do not touch** |

Parameterisation: `text`, `color`, `fontSize`, `fontWeight`. The entrance is a single
`translateX(200px → 0)` spring.

**Faithful?** Yes. This is the smallest edit of the four.

### 3.5 Runner-up: `rve-typewriter-subtitle` — `templates/typewriter-subtitle.tsx`

| file:line | value | problem |
|---|---|---|
| `:19` | `const text = "I like typing...";` | the copy → `text` prop |
| `:42` | `const hue = 210 + (index * 40) / text.length;` | **dead code** (never used) |
| `:43` | `const isGlitching = frame % 30 === 0 && Math.random() > 0.7;` | **`Math.random()` during render** — the result is unused, so the *output* is deterministic today, but the call violates `ADAPTER-SPEC` §0.3 rule 10 and any future use of the variable breaks determinism |
| `:50` | `fontFamily: "'Courier New', monospace"` | hard-coded |
| `:51` | `fontSize: "3rem"` | hard-coded |
| `:53` | `color: \`white\`` | hard-coded |
| `:55` | `transition: "all 0.05s ease-out"` | **CSS transition — wall-clock driven**, not frame-synchronised |
| `:64` | `fontSize: "3rem"` (cursor) | hard-coded |
| `:65` | `color: "#60a5fa"` | hard-coded cursor colour |

**Only ship this one if** the two lines above are removed in the same edit (they change nothing
visually, so the edit stays faithful) — otherwise it is a determinism regression.

### 3.6 Licence position and the exact credit line for repo 2

- **There is no `LICENSE` file** at the repo root. The only licence statement is README prose:
  *"All templates in this repository are available under the MIT License. You can use them in
  personal and commercial projects, but attribution is appreciated where applicable."*
  There is **no MIT copyright line and no named copyright holder**, so the MIT "retain the
  copyright notice" clause has nothing to name.
- Every template file carries this header (verbatim, e.g. `circular-progress.tsx:1-10`):

  ```
  /**
   * Free Remotion Template Component
   * ---------------------------------
   * This template is free to use in your projects!
   * Credit appreciated but not required.
   *
   * Created by the team at https://www.reactvideoeditor.com
   *
   * Happy coding and building amazing videos! 🎉
   */
  ```

- **Attribution required?** No — optional. **Recommended anyway**, and the copied file must keep
  its original header (that is the upstream's own credit line).

**Exact strings to use if any repo-2 design ships:**

- `source.attribution` (the short credit the catalog carries):

  ```
  Remotion templates by React Video Editor (reactvideoeditor.com) — MIT License.
  ```

- The in-file credit line that must stay in the copied header (verbatim):

  ```
  Free Remotion Template Component — This template is free to use in your projects! Credit appreciated but not required. Created by the team at https://www.reactvideoeditor.com
  ```

- The **verbatim MIT permission notice** (the licence *body*, reproduced because the copied file is
  a "substantial portion of the Software"):

  ```
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  ```

  (identical to `REMOTION_DESIGN_LICENSE_NOTICE` in `templates/catalog.ts` except that it has **no**
  `Copyright (c) 2026 Trimora Inc.` line, because repo 2 names no copyright holder.)

- `source.repository` = `remotion-templates`,
  `source.repositoryUrl` = `https://github.com/deangilmoreremix/remotion-templates`,
  `source.sourcePath` = `templates/<file>.tsx`, `source.license` = `MIT`.

**Repo-2 designs that must never be selected:** `ken-burns`, `parallax-pan`, `zoom-pulse` (remote
unsplash/pexels images + `next/image`), `floating-bubble-text` (CSS `animation: rotate 3s linear
infinite` — wall-clock driven), and anything from the **pro** tier (see §4).

---

## 4. The 14 gallery-only designs

The React Video Editor gallery (<https://www.reactvideoeditor.com/remotion-templates>) lists **95**
entries. The cloned repo 2 has **81** files. The difference is exactly **14** slugs that exist
only in the gallery.

**How they were located (evidence):**

1. The gallery page embeds a 95-entry JSON array. Parsed from the cached page
   (`/private/tmp/remotion-src/gallery.html`): every entry carries `slug`, `tier`, `isNew`,
   `component` and `sourceCode`. All **14** gallery-only entries are `"tier": "pro"` and
   `"sourceCode": ""` — the source is **not published** in the page.
2. The gallery's public MCP server (`POST https://www.reactvideoeditor.com/api/mcp`,
   `tools/call` → `get_template`) was queried for all 14 slugs. **Every response returns
   `sourceCode: ""`** — the code is withheld.
3. The per-template page (e.g. `/remotion-templates/gauge-meter`) shows a **"Source Code / Get Pro"**
   tab, and the site's own nav sells *"RVE Pro — Complete source-code template"* /
   *"Get the Editor! $149"*. The source is behind a paid product.
4. Cross-check against the clones: the gallery's **81 free-tier** entries *do* have their source
   embedded (the MCP `get_template` returns the full `sourceCode`), and those 81 are exactly the
   81 files in the cloned repo 2 — which is how the 14-gallery-only figure was confirmed.

**The 14:** `bar-chart-race`, `candlestick-chart`, `multi-line-chart`, `radar-chart`,
`gauge-meter`, `stacked-bar-chart`, `bubble-chart`, `waterfall-chart`, `kpi-dashboard`,
`heatmap-grid`, `coverflow-carousel`, `toast-stack`, `onboarding-steps`, `animated-leaderboard`.

**Located source: 0 of 14.** The gallery publishes metadata (name, subtitle, a 2-paragraph
description that names the constants — `RACERS`, `CANDLES`, `SERIES`, `AXES`, `TARGET`/`ZONES`,
`SEGMENTS`/`CATEGORIES`, `BUBBLES`, `BARS`, `KPIS`/`COLS`, `DATA`, `CARDS`/`CYCLES`, `TOASTS`,
`STEPS`, `ENTRIES` — plus duration/fps), but **not the code**.

**Design-equivalent MIT source available for 2 of 14** (a different implementation, different
licence, in repo 1):

| gallery-only (pro, paywalled) | repo-1 MIT equivalent | evidence |
|---|---|---|
| `bar-chart-race` | `src/components/racing-chart/RacingChart.tsx` (repo 1) | "Racing bar chart. Horizontal bars grow and reorder by rank as the chart 'races'…" (header, lines 1-5); prop-driven `RacingChartDatum[]` |
| `candlestick-chart` | `src/components/pixel-candlestick-ohlc/PixelCandlestickOhlc.tsx` (repo 1) | "an 8-bit OHLC candlestick chart … bull(green)/bear(red) bodies … (candlestick, not line)" (header, lines 3-7) |

(repo 3 also has a `BarChartRace`, but it is one of the opaque, dependency-bound designs of §1.)

**The other 12 have no twin in repo 1 or repo 3 and are pro-tier → not usable.**
Do not attempt to source them.

---

## 5. Recommended order

### 5.1 A7 — batch 1, repo 1 (10 designs, ship in this order)

```
1.  starfield-warp          src/components/starfield/Starfield.tsx
2.  logo-bounce-drop        src/components/logo-bounce-drop/LogoBounceDrop.tsx
3.  logo-mask-wipe          src/components/logo-mask-wipe/LogoMaskWipe.tsx
4.  logo-split-reveal       src/components/logo-split-reveal/LogoSplitReveal.tsx
5.  brush-stroke-reveal     src/components/brush-stroke-reveal/BrushStrokeReveal.tsx
6.  text-mask-reveal        src/components/text-mask-reveal/TextMaskReveal.tsx
7.  glitch-text             src/components/glitch-text/GlitchText.tsx
8.  logo-blur-reveal        src/components/logo-blur-reveal/LogoBlurReveal.tsx
9.  chapter-title           src/components/chapter-title/ChapterTitle.tsx
10. bar-chart-anim          src/components/bar-chart-anim/BarChartAnim.tsx   (optional)
```

Ship 1–9 as the wave-2 set; #10 only if A7 has budget, because of the placeholder-data caveat.

### 5.2 A8 — batch 2, repo 2 (4 designs)

```
1.  rve-circular-progress   templates/circular-progress.tsx
2.  rve-animated-text       templates/animated-text.tsx
3.  rve-popping-text        templates/popping-text.tsx
4.  rve-slide-text          templates/slide-text.tsx
```

Optional 5th: `rve-typewriter-subtitle` — only after deleting the unused `Math.random()` and the
CSS `transition`.

### 5.3 Repo 3

**Nothing in Phase 2.** See §1.

### 5.4 Catalog id hygiene

The 5 shipped designs already use the ids `animated-headline`, `logo-reveal`, `lower-third`,
`promo-cta`, `visual-effect`. The 14 new ids above (`starfield-warp`, `logo-bounce-drop`,
`logo-mask-wipe`, `logo-split-reveal`, `brush-stroke-reveal`, `text-mask-reveal`, `glitch-text`,
`logo-blur-reveal`, `chapter-title`, `bar-chart-anim`, `rve-circular-progress`, `rve-animated-text`,
`rve-popping-text`, `rve-slide-text`) do not collide with them. Every new `textSlots` entry
complies with `docs/phase2/INTERFACE-slots.md` §5: **exactly one** `primary: true`, unique stable
`key`, and a `field` from `{businessName, headline, offer, cta, phone, website}`.
