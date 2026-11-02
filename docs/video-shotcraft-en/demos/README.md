# demos/ — reference implementation source for the shot cards

Most shot cards point to this directory in their "reference implementation"; you must read the card first, then locate the exact
demo file by the explicit path it gives — you can't assume the directory structure from the card name alone. The components here are tuned Remotion implementations —
**before using a card, read the exact source** (SKILL.md principle 5).

`_legacy/` only keeps retired shots for old workbench projects; it is not part of the current shot library and is not for picking cards for new videos;
it takes no part in the asset library, the Gallery or the sample smoke scans; see [`_legacy/README.md`](_legacy/README.md) for compatibility notes.

Usage: copy the .tsx you need into your Remotion project (30fps / 1920×1080),
register it as a Composition and it runs. Every component does `export const <Stem>: React.FC` and also exports
`<UPPER_SNAKE_CASE>_DURATION` (frame count at 30fps), which you use directly when registering:

```tsx
import { BlurSlide, BLUR_SLIDE_DURATION } from './blur-slide/BlurSlide';
<Composition id="BlurSlide" component={BlurSlide}
  durationInFrames={BLUR_SLIDE_DURATION} fps={30} width={1920} height={1080} />
```

All animations are pure functions of the frame (no true randomness / no Date), rendered deterministically frame by frame. In 2026-10 the whole library went through two rounds of revision comparison;
for each shot the author picked one of the original / the first revision (polish) / the second revision (final-cut-grade redesign) to finalize, and 66 shots were removed
(decision record `shot-polish/decisions.json`). Then a brand replacement was done: the logo / brand name appearing on screen is uniformly
video-shotcraft, and suitable copy was replaced with its taglines — to use them for your own product, just swap the pieces in `Brand.tsx` for your mark and copy.

Shared dependencies (when copying a demo, bring along the ones it uses and fix the import paths):

- `_fixtures/Brand.tsx` — video-shotcraft brand pieces: the Frame Chisel ("镜刻") mark `<ShotcraftMark>` (can be drawn on segment by segment), the wordmark
  `<ShotcraftWordmark>`, brand colors `BRAND`, the tagline library `PITCH` (spec in `assets/brand/BRAND.md`). Depends only on react.
- `_fixtures/Look.tsx` — the second round's visual system: 8 palettes `LOOKS` (dark: midnight / aurora / ember / graphite / lime;
  light: paper / porcelain / sand), the type scale `TYPE` and `type()`, the
  stage `<Stage>` with key light/fill glow/horizon light band/vignette/grain, the perspective grid floor `<GridFloor>`, deterministic floating dust `<Dust>`, single-pass sheen `<Sheen>`,
  per-character/word/line reveal `<TextReveal>`, `stagger` / `springAt` / `glow`. All second-revision demos import it; it depends on `./Polish`.
- `_fixtures/Polish.tsx` — polish utility pieces: Bézier easing `EASE` / `ramp` / `mix` / `velocity`, velocity-based directional blur
  `SpeedBlur`, `softShadow` / `hairline` / `surface` material helpers, `Grain` / `Vignette` / `Backdrop`. Depends only on remotion + react.
- `_fixtures/Fixtures.tsx` — fake UI scene pieces (FakeDashboard / Card / TitleBlock / G palette); the sidebar/top bar shows the
  video-shotcraft mark and name (depends on `./Brand`). About twenty of the demos finalized as first revision / original use it.
- `_fixtures/Motion.tsx` — `DesignStage` in 480×270 design coordinates + the E easing table / seg / lerp / rand / useT.
  Used by the Motion-family demos finalized as original / first revision (fracture, bezier-source-converge-merge, radial-wave and a dozen or so others).
- `_fixtures/PageCam2D.tsx` — 2.5D page camera (same coordinate math as template's PageCam, self-contained).
  Used by spotlight-hero-card / type-and-filter / row-embed / list-stack-press / outro-group-photo-launch.
- `_textures/` — real page screenshots and `live-layout.json`. Demos that use `staticFile('textures/live/xxx.png')`
  (crash-zoom-punch both styles / depth-layer-moves / shot-transitions brake-whip / speed-ramp-freeze freeze-frame annotation /
  spotlight-hero-card / type-and-filter / deck-deal-flyin / row-embed / list-stack-press /
  document-typewriter-reveal / page-waterfall-wall / outro-group-photo-launch) require copying the same-named files under `_textures/`
  into your project's `public/textures/live/`. The screenshots represent "the product's existing pages" (aesthetic rule Q1); the site name in the page header has been changed to the
  video-shotcraft mark + wordmark (the weekly-report page title is Shotcraft Weekly); the rest of the page content is untouched.

A few demos use `@remotion/motion-blur` (CameraMotionBlur), which requires
`npm i @remotion/motion-blur`. The list (4 files / 4 cards):

- `camera/space-camera-moves/DroneDiveLanding.tsx`
- `opening/crane-rise-reveal/CraneRiseReveal.tsx`
- `opening/fracture/Fracture.tsx`
- `opening/magician-card-flourish/MagicianCardFlourish.tsx`

All other fast motion uses directional blur computed from the velocity (`SpeedBlur` or a local implementation) — CameraMotionBlur multi-sampling
is expensive, and on near-still frames it tints the whole image gray/yellow.

Fonts: only the system font stack is used (SF / Helvetica Neue / Iowan Old Style / Avenir Next Condensed / Futura and other fonts bundled with macOS),
with no dependency on `@remotion/google-fonts`. A few demos hard-code glyph widths / glyph-center coordinates measured with the local SF Pro (e.g. letter-drop-physics,
letterform-zoom, beat-step-list-theme-cycle, pill-chip-slot-cycle-handled); if you change the font or font size, re-measure per the comments;
the variable-weight animation (font-weight-pump) relies on a system variable font, and without one it degrades to stepped weights.

## Real video footage (ClipCard, assets/lib/ClipCard.tsx)

The library's 152 shot cards originally all assumed the subject is a DOM/SVG-generated object or a page screenshot; not one of them could
directly carry real mp4 footage. `assets/lib/ClipCard` fills in this form: it wraps a video clip in a
rounded "card", so that the camera-move skeletons tuned for rectangular card elements (spotlight-hero-card /
magician-card-flourish / neon-frame-orbit-drop / quad-split-parallel-scenes)
drive real footage as-is. Copy `assets/lib/ClipCard.tsx` into the project and it's ready to use.

```tsx
import { ClipCard } from './assets/lib/ClipCard';

// Put the footage at public/clips/demo.mp4; when the footage is shorter than the shot, pass loopDurationInFrames to enable
// crossfade looping (OffthreadVideo has no loop prop and freezes when it finishes)
<ClipCard src="clips/demo.mp4" size={560} caption="AI generated"
  loopDurationInFrames={60} durationInFrames={120} />
```

| Parameter | Default | Description |
|------|------|------|
| `src` | Required | Video path under public/ (resolved with staticFile) |
| `caption` / `captionSize` | None / 17 | Mono subline below the card; for small cards/distant camera positions raise captionSize to ≥32px (Q11) |
| `size` / `radius` | 560 / 20 | Card side length (square footage) / corner radius |
| `muted` | true | When `false`, looping crossfades the audio complementarily, without stacking two full-volume audio tracks |
| `startFrom` | 0 | Which video frame to start playing from (trimming) |
| `loopDurationInFrames` | None | Playable length of the video (composition frames) → enables looping |
| `loopCrossfadeInFrames` | 8 | Number of overlap crossfade frames between loop layers |
| `durationInFrames` | Composition duration | Duration of the enclosing shot — **always pass it**, otherwise a short shot nested in a long project will generate invisible layers |

Known pitfalls:
- When `durationInFrames` is not passed, the number of layers is computed from the Composition's total duration (the short-shot-in-long-project problem).
- When `startFrom` ≥ the playable length, or step < crossfade, it automatically falls back to single-layer playback (no looping).
- Looping footage is recommended at 30fps and square (the camera-move skeletons are calibrated for square cards).

Reference demo: `demos/ui-entrance/clipcard-looping/ClipCardLooping.tsx`
(three regression scenarios: muted=false looping, startFrom>0 + looping, short Sequence in a long Composition).

## Testing and verification

1. **Type compilation** (`pr-checks.yml` verify job): `find demos -name '*.tsx'`
   all go through `tsc --noEmit --strict`. New demos must pass strict compilation.
2. **Render smoke test** (`assets/scripts/smoke-render-demos.py`): scans all demos with a duration
   export (`_DURATION` / `_DUR`), automatically generates `template/src/smoke-root.tsx`
   registering them all, renders the first frame of each with `remotion still`, and asserts the output is non-empty and the process doesn't crash —
   blocking demos that "compile but can't run" (e.g. an illegal composition id, a missing runtime import,
   a missing texture). To run the full set locally:

   ```bash
   # Needs the template dependencies + motion-blur (installed temporarily in CI)
   cd template && npm ci && npm i --no-save "@remotion/motion-blur@$(node -p "require('./package.json').dependencies.remotion")"
   cd .. && python3 assets/scripts/smoke-render-demos.py        # full set
   python3 assets/scripts/smoke-render-demos.py --subset BlurSlide,GlitchCycle  # subset
   python3 assets/scripts/smoke-render-demos.py --list          # list renderable demos
   ```

   When `--subset` points to a nonexistent/not-found demo, the script exits with code 1 (an explicit error).
   Demos that need real mp4 footage (e.g. ClipCardLooping using `public/clips/`) are skipped
   and reported in the output, without blocking the full run.
