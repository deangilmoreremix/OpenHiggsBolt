# Personalization Studio: editor enhancements

This note records the technology decisions for the next round of Step 4 editor work and documents what has shipped.
It is updated with each pull request. Nothing here adds an API route, a database migration, or changes the paid
MuAPI "Remove branding" integration.

## Technology decisions

| Technology | Decision | Why |
| --- | --- | --- |
| Remotion (`remotion`, `@remotion/media`, `@remotion/web-renderer`) | Keep as the only renderer | Preview and export already share one composition. New features extend it. |
| MediaPipe Image Segmenter (`@mediapipe/tasks-vision` 1.2.3, Apache-2.0) | **Used** (background removal) | Real per-frame person segmentation in the browser; self-hosted, no API cost. |
| Canvas 2D | **Used** | Draws the cut-out. The web exporter draws `<canvas>` elements (verified), but not raster `mask-image`, so the cut-out has to be pixels on a canvas. |
| Web Workers / OffscreenCanvas | Not yet | MediaPipe's ES module does not load reliably in a module worker. Segmentation runs on the main thread but yields to the UI after every frame, with progress and Cancel. The `Segmenter` interface lets a worker replace it later. |
| WebCodecs | Not used | `seek` + `drawImage` was fast enough (about 20 ms per frame on CPU) and keeps preview and export on the identical code path. The exporter already uses WebCodecs internally. |
| WebGL | Not used | No measured need. Effects will use canvas / CSS filters that the exporter can draw. |
| Web Audio API | Planned (waveform only) | Mixing, volume and fades will use Remotion's `<Audio>` so preview and export stay identical. |
| React Konva | Not used | The existing DOM handles, snapping and toolbar already work; replacing them risks regressions for no new capability. |
| FFmpeg.wasm | Not used | No task needs it. Multithreaded builds need COOP/COEP, which would break the Clerk and Turnstile iframes. |

## Presenter background removal (shipped in this PR)

Step 4, **Presenter background** card (right column, above Layers).

1. **Remove background** measures a presenter mask for the video, in the browser, free. Progress is shown and Cancel works.
2. Choose a background: **None** (the composition's own dark background), **Color**, **Blur** (a blurred copy of the original),
   **Image** (your logo/product/service image, or a file from your computer) or **Video** (a file from your computer).
3. Place the presenter: presets (full screen, left, right, picture-in-picture) or size / horizontal / vertical / tilt sliders.
4. **Edge**: *Soften* and *Shrink/Grow* clean up halos or recover hair.
5. **Restore original video** switches back to the normal video path. Your choices are kept; turning it on again reuses the
   cached masks without measuring again.

How it works (`src/shared/personalization/preview/cutout/`):

- `segmenter.ts`: MediaPipe `ImageSegmenter` (selfie model, CPU delegate), loaded lazily. The wasm and the model are served from
  `public/mediapipe/` (no CDN, no CSP change).
- `segmentVideo.ts`: seeks the clip at up to 15 fps, downscales to at most 384 px on the long side, segments each frame, and blends
  each mask with the previous one to reduce flicker. Clips over 60 seconds are refused with a clear message.
- `maskStore.ts`: keeps the masks in memory per video URL and shares one run between callers. Masks are **never saved with the
  project** (tens of MB, far over the 5 MB project limit); a reopened project measures them again automatically.
- `CutoutBackdrop.tsx`: the composition draws the video itself (seek + canvas) when the cut-out is on, using the same
  code in the editor, the Before/After preview and the browser export. The source's own sound is kept with an audio-only element.
- `webExport.ts`: before exporting, makes sure the masks exist, so an export can never silently use the original background.

The presenter is drawn **whole** (`contain`), unlike the normal video path (`cover`), so a tall clip in a wide video does not
lose the presenter's head. Before the masks are ready the original footage is shown exactly as before.

### Verified

Real browser, real footage (`public/media/recast-example/source-performance.mp4`), real in-browser export
(`e2e/personalization-presenter-background.spec.ts`):

- The corner of the live preview is the chosen flat color on both sides; the presenter preset moves the presenter and leaves the
  corner a background.
- Restore original removes the cut-out canvas; turning it back on shows it again without re-measuring.
- The exported MP4's corner pixel matches the preview's (allowing for the brand dim overlay and h264 compression) and is not the
  original room color; the exported frame shows the whole presenter with the logo and name on top.
- A clip with sound (`avatar-sponsor-clip.mp4`) exports with its sound: mean volume -20.1 dB against -19.8 dB in the source
  (a silent clip exports at -91 dB).

### Known limits

- Quality is what the small selfie model gives. It is best for a person filling a good part of the frame; it can keep a little
  floor reflection, and fine detail such as separate strands of hair is approximate. Use the Edge controls to trim.
- Segmentation runs on the main thread (yielding between frames). A 5 second clip takes a few seconds on CPU; a 60 second clip takes
  about a minute and the editor stays usable but busy.
- During playback the cut-out is drawn by seeking a hidden video every frame (the same path the export uses). Scrubbing is
  smooth; very high resolution clips may play below real time in the live editor. The export is not affected.
- Masks are not saved. A background chosen from a file on your computer is not saved either (it is replaced by a color when the
  project is saved), because a `blob:` URL does not survive a reload. Business images are saved.
- The uploaded `blob:` video itself does not survive a reload (existing behavior).

## Keyframes (shipped in the keyframes PR)

Step 4, layer inspector, **Timing** tab, **Keyframes** section; diamonds on the layer's timeline track.

- **Add keyframe at the playhead** seeds the new keyframe with the values already in effect, so adding one never makes the layer
  jump. Edit **Move across / Move down / Size / Fade / Tilt** for each keyframe and choose how the layer travels to the next one
  (Smooth, Linear, Ease in, Ease out, Hold). **Start from…** drops in a ready-made motion (slow zoom, drift, float, fade in and
  out, gentle tilt) as ordinary keyframes you can then edit. Drag a diamond to move it in time, or use the arrow keys.
- Keyframes are **changes to the layer**, not absolute values: `dx`/`dy` as a fraction of the frame, `scale` and `opacity` as
  multipliers, `rotation` as extra degrees. The layer's own position and its entrance animation are untouched, so a layout change
  still applies. A channel only moves between keyframes that set it and holds its first/last value outside them.
- Math is pure (`preview/keyframes.ts`, `keyframeStateFor`). The composition wraps a keyframed layer in one element transformed
  about the layer's own center, only while a keyframe is changing something, so layers without keyframes render exactly as before.
  The editor's hit box follows the same state at the playhead. Existing projects restore unchanged (`keyframes` is optional and
  normalized).
- Not keyframed: design layers (full-frame animated designs) and the end card.

Verified in a real browser and real export (`e2e/personalization-keyframes.spec.ts`): two keyframes on the logo (stay, then
move 30% of the frame right); the timeline shows two diamonds, the live box is further right at 3 s than at 0 s, and in the exported
MP4 the logo's left edge goes from 5% to 32% of the frame width between 0.9 s and 3.1 s.

Known limits: scale, tilt and fade pivot about the layer's estimated center (text height is an estimate, so a tall wrapped text
may pivot slightly off its true center); "Restore default layout" resets layers and therefore removes keyframes.


## Layout keeps off the presenter (cut-out on)

With the cut-out on and its masks measured, the presenter's bounding box (over the whole clip, after the same contain-fit and
presenter position / size / tilt the cut-out is drawn with, plus a margin with extra head-room above) is added to the layout check
as a protected zone `cutout-presenter` (`preview/cutout/presenterZone.ts`, used by `useLayoutQuality`). It is recomputed, never
saved. The existing rules then apply: the quality bar flags a logo or text over the presenter, and the automatic placement moves
layers that are not hand-placed or locked off them (Undo works). Verified in a real browser: with the presenter standing under the
default top-left logo, the logo overlapped them by 63% of its area without this and under 5% with it; a locked logo does not move.
The zone is the presenter's whole-clip bounds, so a presenter who walks across the frame protects the whole path.
