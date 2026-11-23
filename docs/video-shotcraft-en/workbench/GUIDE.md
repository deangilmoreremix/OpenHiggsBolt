# Motion Workbench · Illustrated guide

After the final cut is delivered, keep editing in the browser: move shots, change speed, change text, adjust colors, add motion, add sound effects, and export in one click when you're done.
This page introduces each feature by interface area. For the integration contract and production conventions see [references/workbench.md](../references/workbench.md);
for technical notes see [workbench/README.md](README.md).

## How to open it

The skill runs the command below automatically during delivery wrap-up and opens the browser; you can also run it manually at any time:

```bash
node workbench/scripts/open.mjs <final-cut project dir>     # the first run installs dependencies automatically
```

- The address is always `http://localhost:5198/`; when opened with `?import=project`, it splits the video into multiple tracks according to the final-cut manifest.
- When the same version of the final cut is opened again, your previous changes are kept; only when the final-cut code has changed (the manifest content hash differs) is it re-imported, with the old changes pushed onto the undo stack, recoverable with ⌘Z.
- All changes are saved automatically in the browser's local storage (localStorage), so closing the page loses nothing. To stop the service: `kill $(cat workbench/.dev.pid)`.

## Interface overview

![Workbench overview](docs/overview.png)

Five areas, from left to right and top to bottom:

| Area | Position | What it does |
|---|---|---|
| Top bar | Top | Project name, undo / redo, export final cut, export / import JSON, reset sample |
| Asset library | Left column | Final-cut units, project assets, 150 demo motions, sound effects and BGM; click to preview, drag onto a track |
| Preview | Center | Remotion Player live preview + transport controls |
| Properties panel | Right column | The selected clip's copy / font size / color, time and speed, layer |
| Timeline | Bottom | Multi-track editing: move, trim edges, split, duplicate, change speed, layer order |

All three dividers can be dragged to adjust the width of the left and right columns and the height of the timeline; the sizes are remembered.

## Top bar

![Top bar](docs/topbar.png)

- **Project name**: click to edit it directly; it is used for the exported MP4 / JSON file names.
- **Undo / Redo** (⌘Z / ⇧⌘Z): one step per editing gesture; consecutive input into the same control within 0.8 seconds is merged into one step.
- **Export final cut**: hands the current project to the dev server to render with Remotion, showing a progress percentage on the button; when finished it becomes "✓ Exported · Show file", and clicking it reveals the MP4 in Finder (output goes to `workbench/exports/`). The export duration is exact to the end of the last clip.
- **Export JSON / Import**: a project is a JSON file that you can archive, send to someone else, or paste into Remotion Studio's Props panel.
- **Reset sample**: switches back to the built-in demo project (undoable).

## Asset library

Three tabs; for every entry, **click = preview in the center, drag to the timeline = add a clip**.

### Assets

![Assets tab](docs/library-media.png)

- **Import final cut**: re-breaks down and imports according to the final-cut project's `src/workbench.ts` manifest (one undo step).
- **Final-cut units (can add another copy)**: every kind of shot, title card, caption bar and transition in the video is its own card, marked with its duration and "Tunable". If you want another title card of the same kind elsewhere, just drag a copy onto a track.
- **Asset files (project public/)**: images and videos that come with the final-cut project, collapsed and grouped by directory.

### Motion library

![Motion library tab](docs/library-cards.png)

- The "Workbench" group is 4 native parameterized cards: generic text, Ink Press title card, narration caption bar, warm-white flash transition, with copy, color and font size all adjustable.
- Below, all **150 demo motions** are listed by Gallery category (Openings & Brand, Typography, Data Charts…). Thumbnails are hero frames and **only loop on mouse hover**, so the screen doesn't flash all over.
- Tags show the card's duration; cards marked "Tunable" have a content and style section in the properties panel. Once on a track, demo cards can be trimmed, speed-changed, frozen and given layer transforms.

### Sound effects

![Sound effects tab](docs/library-sfx.png)

- **This video's audio**: the sound effects in the final-cut project's `public/`; "In video ×N" on the right is the number of times it is used in the original video.
- **BGM options** and the **sound effect library** (149 entries, collapsed by category camera / counter / crowd…) come from the repository's `assets/audio/`.
- Once on a track, audio clips can be trimmed in, speed-changed (playbackRate) and have their volume adjusted, without going silent.

## Preview and transport

![Preview area](docs/preview.png)

- The center is the Remotion Player, whose picture matches the final render frame by frame (verified at the pixel level); when you change the properties panel or drag clips, the preview follows instantly.
- Transport bar: ⏮ back to start, ▶ / ⏸ play (Space), timecode (seconds.frames / total length), loop toggle, aspect ratio and frame rate.
- Clicking the picture itself also plays / pauses; ← / → steps frame by frame, holding Shift steps 10 frames at a time.
- Clicking any entry in the asset library switches to **asset preview** mode, looping that card on its own; click "Back to project" to return to the timeline preview:

![Asset preview](docs/card-preview.png)

## Properties panel

![Properties panel](docs/inspector.png)

After selecting a clip on the timeline, the right column has three sections:

- **Content and style**: generated automatically from the schema declared by the card — text, multi-line text, sliders, color, dropdowns, toggles. The shots in the final cut expose their context-level parameters (wordmark, eyebrow, annotations, font size, ink color, amber accent, paper background…) here; motion rhythm (pop-in duration, easing, camera path) is deliberately not exposed, to avoid tuning the quality badly.
- **Time and speed**: start, duration (seconds), speed slider with 0.5× / 1× / 1.5× / 2× shortcuts, trim in-point, "↺ Restore original duration". When the card's frame rate differs from the project's, a one-line hint appears here.
- **Layer**: opacity, scale, position X / Y.

"Delete clip" at the bottom is equivalent to the Delete key.

## Timeline

![Timeline](docs/timeline.png)

- **Toolbar**: ✂ Split (S, cuts the selected clip at the playhead), Duplicate (⌘D, placed right after the original clip), Delete (Delete), + Track (added at the top layer), Fit (zoom to see everything exactly), zoom slider.
- **Track headers**: drag the handle on the left up and down to adjust layer order (upper layers cover lower ones); 👁 hides / shows the whole track; × deletes the track. When importing a final cut, the track order matches the original video's z-order: transitions > captions > overlays > shots > music > sound effects.
- **Clips**: drag the body to move it (it automatically snaps to other clips' start and end points), drag up and down onto another track, drag the handles on either side to trim edges (left trims in, right trims out); badges on the clip show duration, speed multiplier, trim-in seconds and opacity.
- **Ruler**: click or drag the ruler to jump the playhead; the red line is the current playhead.
- Clips may overlap on the same track (layering is expressed with multiple tracks).

## Keyboard shortcuts

| Key | Action |
|---|---|
| Space | Play / pause |
| ← / → | Step frame by frame; hold Shift for 10 frames at a time |
| S | Split the selected clip at the playhead |
| ⌘D | Duplicate the selected clip |
| Delete / Backspace | Delete the selected clip |
| ⌘Z / ⇧⌘Z | Undo / redo |

## A typical edit

1. After delivery the workbench opens automatically, with the video already broken down on the timeline.
2. Click "S1 Ink-line opening" on the timeline, change "Wordmark" in the right column to the new brand name, drag "Wordmark font size" up, and the preview updates immediately.
3. If a caption seems too early, just drag the caption clip a bit later; if you want a shot to be a bit slower, slide the speed to 0.8×.
4. From "Motion library", drag a "Data Morning-Light Opening" onto the top track as the intro, and from "Sound effects" drag a whoosh to align with its start.
5. Click "Export final cut", wait for the progress to finish, and get the MP4 via "Show file".

## Advanced

- Make your own final cut editable property by property: have shot components turn their context parameters into props + schema, and write a `src/workbench.ts` manifest; see [references/workbench.md](../references/workbench.md) §2–§3.
- Verify that the breakdown is lossless: `cd workbench && npm run parity`, which compares the imported result with the original video frame by frame.
- The Remotion Studio view: `cd workbench && npm run studio`; every card is a composition, and the Props panel shares its source with the workbench schema.
