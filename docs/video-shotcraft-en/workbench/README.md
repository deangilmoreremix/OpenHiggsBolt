# ShotCraft Workbench · Motion Workbench

> For the user-facing illustrated guide (each area and feature, with screenshots) see [GUIDE.md](GUIDE.md); this document is the technical notes.

A JianYing-style post-production desk for the final cut: multi-track timeline + asset library (final-cut units / 150 shot card demos / sound effect library / backgrounds) +
schema properties panel + Remotion live preview + one-click export. After the skill delivers the final cut it is opened automatically by
`scripts/open.mjs`, so without going back into the code to edit tsx the user can move shots, change copy, swap sound effects, change speed and export.
Ported from [video-talkcraft/workbench](https://github.com/Vincentwei1021/video-talkcraft);
the data model and UI share the same source, while card sources and final-cut integration have been adapted for this repository.

For the methodology and the final-cut integration contract see [`references/workbench.md`](../references/workbench.md).

```bash
# After delivery (in the skill root): link the final-cut project → generate the index → start the dev server → open the browser and auto-import
node workbench/scripts/open.mjs <final-cut project dir>

# Play with it standalone (no final cut attached):
cd workbench && npm install && npm run dev      # http://localhost:5198
```

## What it can do

- **Four asset library tabs**: Assets (final-cut units + images and videos in the project's public/) · Motion library (the 150 demos in demos/ collapsed into the Gallery's
  10 categories; those with local sample videos loop in preview, those without show a hero frame and only play on hover) · Sound effects (this video's audio + the 149 sound effects in `assets/audio/sfx` in 16 categories +
  5 BGM tracks) · Backgrounds (paper / pure white / ink black / brightened paper). **Click = preview in the center screen, drag to the timeline = add**
- **Timeline**: multiple tracks (upper layers cover lower ones, drag track headers to reorder), dragging, trimming both ends, moving across tracks, snapping, splitting (S),
  duplicating (⌘D), zoom/fit; the dividers of the three columns and the timeline can all be dragged
- **Properties panel (schema-driven)**: the copy / color / font size / position of final-cut units and workbench native cards are adjustable item by item;
  generic clip properties: start / duration (extended by freezing) / speed 0.25×–4× / trim in-point / opacity / scale / position
- **Final-cut breakdown import**: following the project's `src/workbench.ts` manifest, split it in one click into a multi-track project of shots / transitions / captions / overlays / music /
  sound effects, with placements matching the original `<Sequence>`s frame by frame (provable with `npm run parity`)
- **Saving**: auto-saves to localStorage (800ms debounce), export/import project JSON, undo/redo
- **Old project compatibility**: the 66 shots retired in 2026-10 are kept as frozen implementations in `demos/_legacy/`; old saves / JSON still preview and export with their original
  `cardId`, timing, speed changes and properties. Compatibility cards do not reappear in the asset library or the Studio list of standalone compositions.
- **Interface language**: English by default; switch between English / 中文 / Русский with the dropdown on the right of the top bar (the choice is remembered in
  localStorage `shotcraft-workbench-locale`). The language only affects display; it does not rewrite the project JSON or track names. The interface chrome goes through the string table in `src/i18n.ts`;
  card names / schema field names / categories / track names / shot labels in the manifest are written in their original text and translated at display time with the zh→en / zh→ru
  dictionaries in the same file (any of the Chinese, English or Russian spellings can be translated into the others), shown as-is if not found; demo cards' English names and one-line descriptions are taken by gen-index directly from Gallery data
  (`nameEn` / `summaryEn`), and Russian from `i18n/ru/*.json` (a flat "Chinese original → Russian" map that generates `DEMO_TEXT_RU`, including names and categories of the `_legacy/` compatibility cards);
  theme preset names are written as "中文 · English" and the half matching the language is taken, with Russian looked up in the dictionary by the Chinese half. When adding interface copy, write all three languages;
  when changing the Chinese labels / one-line descriptions of native cards or the template manifest, update both dictionaries; when adding or rewriting a demo, also add to `i18n/ru/*.json`
- **Export final cut**: top bar "Export final cut" → the dev server starts the Remotion CLI to render the current project to MP4 → `exports/`
- **Remotion Studio**: `npm run studio` (a Zod schema is generated automatically for each card; `ProjImported` / `ProjOriginal` for comparison)
- **Lossless verification**: `npm run parity` — exit code 0 identical / 1 differences / 2 cannot compare (python3+Pillow missing); never a false green

## Integrating a final-cut project

```bash
node scripts/open.mjs <final-cut project dir>        # dir = the level that contains package.json; source in src/ or remotion/src/
node scripts/open.mjs                     # reuse the project linked last time (only restarts/reuses the dev server)
node scripts/open.mjs <dir> --no-open     # don't pop up the browser
```

What it does: `ln -sfn <project>/src proj`, links each item of `<project>/public/*` into `public/`, runs `gen-index`,
starts vite (5198), and opens `http://localhost:5198/?import=project` (when the save isn't this version of the final cut, it auto-imports according to the manifest,
with the old save going onto the undo stack; when it is this version, your changes are kept). Everything is a machine-local symlink and is not committed.

Giving a project directory restarts the dev server (the `@proj` alias is fixed when vite starts), but it only restarts the one this script started itself
(verified via `.dev.pid` + the process command line, so a reused pid won't be killed by mistake); if the port is occupied by a manual `npm run dev`, it errors out directly —
stop that first or add `--port`.

A project must provide a `src/workbench.ts` manifest to be broken down and imported (how to write it: references/workbench.md §2, example
`template/src/workbench.ts`); without a manifest it can still be opened, but the Assets tab has no import button.

## Keyboard shortcuts

| Key | Action |
|---|---|
| Space | Play / pause |
| S | Split the selected clip at the playhead |
| Delete / Backspace | Delete the selected clip |
| ⌘D | Duplicate the selected clip |
| ⌘Z / ⇧⌘Z | Undo / redo |
| ← / → (+Shift) | Step 1 frame (10 frames) |

## Architecture

```
src/
  types.ts                data model: Project → Track → Clip (time unit = frames)
  store.ts                zustand state (undo stack / auto-save / ?import=project auto-import)
  i18n.ts                 interface language (en default / zh / ru): chrome string table + content label zh→en / zh→ru dictionaries + bilingual split of theme names
  projectImport.ts        manifest → multi-track project (greedy bin packing of shots/transitions/captions/overlays/music/sound effects)
  dnd.ts                  asset library → timeline drag-and-drop protocol
  preview/Composition.tsx clip → <Sequence> + TimeRemap(Freeze) / native media channel / durationProp injection
  preview/PreviewPanel.tsx Player + transport + asset click preview
  timeline/               ruler / tracks / clip drag and trim / drop receiving
  panels/                 the four asset library tabs / schema properties panel
  remotion/               Remotion CLI entry (shared by Studio + render export + parity)
  cards/
    types.ts              CardDef / PropField (schema field types)
    manifest.ts           final-cut project manifest type WorkbenchManifest
    registry.ts           registry: native cards + media cards + background cards + final-cut unit cards + demo cards
    demoCards.ts          full integration of demos/ (demo-index.ts + demoMeta.ts generated by gen-index)
    projectCards.ts       manifest units → final-cut unit cards (same cardId / same component share one)
    inkpress/             parameterized native cards: title card / narration caption bar / warm-white flash transition (sourced from template components)
    text-basic.tsx        generic text card
scripts/
  gen-index.mjs           static index + asset list + repository-level links (run automatically on prepare / predev / prebuild / prestudio)
  open.mjs                one-click open after delivery (link project → gen → dev server → browser)
  parity.mjs              frame-by-frame comparison of ProjImported vs ProjOriginal
proj-stub/                fallback implementation when no final-cut project is linked
demosrc -> ../demos       demo source (relative symlink, committed)
public/                   all generated by scripts from local links (not committed)
remotion.config.ts        CLI bundling config (@proj/@demos aliases + jpeg/angle/concurrency 4, same settings as template)
vite.config.ts            Vite + export render API (POST /api/export → Remotion CLI)
```

## Known limits

- Clips may overlap on the same track (layering is expressed with multiple tracks); speed changes are uniform remaps (no curve speed ramps)
- The card library is laid out at 30fps and final-cut units at the final cut's fps; in a non-30fps project, dragging a card onto a track converts the duration + applies an inverse speed change (media cards only have the duration converted), so playback speed stays the same; the rhythm of demos timed in seconds (spring) will drift, and the panel shows a hint
- Demo card schemas are empty: they can be trimmed / speed-changed / frozen / layer-transformed, but copy and color can't be changed — to make them tunable, first extract CONFIG into props
- Export goes through the dev server (available while `npm run dev` is running). Remotion's static server refuses to serve symlinks, so before export
  `public/` is automatically dereferenced and synced to `.render-public/`; the same applies to manual command-line rendering:
  `npx remotion render src/remotion/index.ts Main out.mp4 --props=<{"project":…,"renderExact":true}> --public-dir=.render-public`
- The project source is bundled into the workbench via symlink, with `react`/`remotion` resolving to the workbench's node_modules
  (remotion 4.0.484 / React 19; `@remotion/motion-blur` `@remotion/three` `three` `@react-three/fiber` `@remotion/google-fonts` are installed)
