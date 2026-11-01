# Motion Workbench: visual fine-tuning after the final cut is delivered

`workbench/` is a JianYing-style browser workbench (multi-track timeline + asset library + properties panel + Remotion
live preview + one-click export), ported from `workbench/` in the sister project of the series, video-talkcraft.
After the skill renders the final cut, it **opens the workbench proactively**, so that without going back into the code to edit tsx the user can: move a shot, lengthen a
hold, change a line of title-card copy, swap a sound effect, or change the speed of a section, and then export the MP4 directly.

**When to trigger**: after the final cut is delivered in any mode, first run the command below to open the workbench and tell the user the address, then give
the 1-2-3 of "delivery wrap-up" (see `SKILL.md`). Do not wait for the user to ask.

```bash
# Run in the skill root; <final-cut project dir> = the level that contains package.json / remotion.config.ts
node workbench/scripts/open.mjs <final-cut project dir>
# → link the project's src/ and public/ → generate the index → start the dev server (5198) → open the browser and auto-import the final cut
```

The first run does an automatic `npm install` (one-time, about 1 minute). The dev server stays resident in the background; stop it with `kill $(cat workbench/.dev.pid)`.
The two skills' workbench ports are staggered (talkcraft 5199 / shotcraft 5198), so both can be open at the same time.

## 1. Three layers of editability: what can be changed, and what the code must satisfy

The workbench breaks the video into clips (Project → Track → Clip); every clip has three layers of editable surface:

| Layer | What the user can change | Requirements on the motion code |
|---|---|---|
| **Time and layer** (every clip has this) | Start / duration (beyond the original length the last frame freezes) / speed 0.25×–4× / trim in-point / opacity / scale / position / move to another track / hide the whole layer | The component is a pure function of `useCurrentFrame()`, every tween is clamped, no `Date.now`/`Math.random` — iron rule 9 of this skill already guarantees this. **The existing demos (150 of 152 hooked up automatically, see §4) and all final-cut shots need no changes** to go onto a track |
| **Content and style** (properties panel) | Copy / color / font size / position / toggles / enums, each adjusted visually | The component exposes its context-level parameters as **props with default values** and provides a `schema` (field list, see §3). A demo's top-level `CONFIG` constants are not adjustable unless changed — only time/layer can be edited |
| **Breakdown import** (split the final cut into multiple tracks in one click) | Each shot / transition / caption / sound effect becomes its own segment, which can be moved, deleted or duplicated individually | The final-cut project provides a `src/workbench.ts` manifest (§2) whose timeline is **from the same source** as Main.tsx; after import, rendering without changing anything gives the original video |

This maps one-to-one onto talkcraft's approach: talkcraft copied its 79 template cards one by one into `gen/*.tsx`
(CONFIG → props + schema, with the "rhythm crux" kept FIXED), while the final cut is symlinked into the project via `@kbsrc`,
broken down by the `SHOTS`/`SFX_CUES`/`WIPE_TIMES` tables, and per-shot parameterization relies on a hand-written `kscene-sNN` card for each shot.
The difference on the shotcraft side: all 150 demo components are **hooked up as-is** (no per-card parameterized copies, to avoid maintaining two versions),
and the per-shot editability of the final cut is declared by the **`schema` in the manifest** — so "whether future videos can be edited property by property"
depends on whether the shot components are written according to §3 during production, not on changing the workbench afterwards.

## 2. The final-cut project's integration manifest `src/workbench.ts`

Export a `WORKBENCH` constant with the following structure (the TypeScript types are in `workbench/src/cards/manifest.ts`; the project
file does not need to import them, it only has to be structurally compatible):

```ts
export const WORKBENCH = {
  name: 'Ink Press · AIFL promo',
  fps: 30, width: 1920, height: 1080,
  total: AIFL_TOTAL,                 // total frame count of the final cut
  background: '#f2eee6',             // background color of Main's outermost AbsoluteFill
  revision: undefined,               // optional revision number; if omitted, "is this the same version of the final cut" is decided by a hash of the manifest content
  shots: [                           // shots: from/duration correspond one-to-one with <Sequence> (absolute frames)
    { id: 'morning', label: 'S1 Ink-line opening', from: 0, duration: 220, component: SceneOpen },
    { id: 'card1', label: 'Title card ①', from: 220, duration: 55,
      component: TitleCardUnit,                     // a component that takes props
      props: { text: 'All your team’s research, *one* place to go.' },  // the actual value in the final cut
      schema: [{ type: 'textarea', key: 'text', label: 'Copy', default: '' }],
      durationProp: 'duration',                     // inject the clip duration into this prop (the tail fade-out follows it)
      cardId: 'title-card', cardName: 'Title card' },     // the four title cards share one card
    …
  ],
  transitions: [...],                // transition layer (white flash / light bar), same structure as above
  captions: [...],                   // captions / narration bars
  overlays: [...],                   // overlays that persist across the whole video (grid / vignette)
  sfx: SFX.map(s => ({ from: s.from, duration: 90, src: `audio/${s.src}`, volume: s.volume })),
  bgm: [{ from: 0, duration: TOTAL, src: 'audio/bgm.mp3', volume: 0.34 }],
  order: ['transitions', 'captions', 'overlays'],   // overlay z-order (top → bottom); this is the default
  original: AiflMain,                // the original composition, for parity comparison
};
```

**How parameterized the example is**: the template's six scenes + title cards + narration bar all export `*_DEFAULTS` (copy / font size / palette) and read them as props
with default values, and the manifest schema references the very same object — what you change in the properties panel is the value on screen; easing / timing values / camera keys are not exposed.
A demo's scene constants (`CONFIG` / top-level `const`) can be hooked up by extracting them into `DEFAULTS + Partial<typeof DEFAULTS>` following this pattern.

**Same-source principle**: every table in the manifest is `import`ed from Main.tsx (`SHOTS` / `CAPTIONS` / `SFX` / the title-card copy table);
do not hand-copy a second version. Example: `template/src/workbench.ts` + `template/src/aifl/Main.tsx`
(`AIFL_SHOTS` / `TITLE_CARDS` / `CAPTIONS` / `SFX` / `FLASH_CUTS` / `sfxDuration` are all `export`ed, so
rendering and the manifest share one set of data).

**Version criterion**: when opened with `?import=project`, the project is re-imported only if the saved `source` differs from `manifestKey(manifest)`. key = name + total frame count + `revision`;
when `revision` is not written, a hash of the manifest content is used (timeline / labels / props / the unit→card grouping topology / component displayName / sound-effect table) — changing a shot's position, copy,
sound effects or swapping a component counts as a new version; the old save is pushed onto the undo stack and can be recovered with ⌘Z.

**Grouping rule**: units with the same `cardId` (or the same `component` reference) share one "final-cut unit card",
which appears only once in the asset library and can be dragged onto a track again; `label` is the display name on the timeline track (Chinese or English both work: the workbench defaults to an English UI, and when displaying it translates Chinese labels into the current UI language (English / Russian) using the dictionary in `workbench/src/i18n.ts`, showing them as-is if not found). The card id is
`proj:<kind>:<cardId|first unit id>`; when an explicit `cardId` collides with another group's first unit id (or unit ids are duplicated),
the group that appears later gets a `~2` suffix and a warning is printed in the console — give the unit a different id or write an explicit `cardId`; don't rely on the suffix.

**Asset paths**: `sfx[].src` and the like are always relative to the project's `public/` (the workbench links the project's `public/*` into its own
`public/`). The `*word*` notation in caption/title-card copy is the emphasis-word DSL of the Ink Press title cards (`parseWords`);
other projects can define their own DSL — as long as props are strings/numbers/booleans they can go into the properties panel.

## 3. How to write shots when producing a new video (to make them "editable in the future")

When implementing each shot in pipeline stage 5:

1. **Context-level parameters → props (with default values)**: copy, color, font size, position, toggles, data (multiple entries use a line-by-line
   text DSL). **Keep the rhythm crux as constants** (pop-in duration, stagger interval, easing curve, camera path) — they determine
   the quality of the motion, and exposing them makes it easy to tune them badly. This matches talkcraft's "FIXED / open" boundary.
2. **Actually use `duration`/`dur`-type props** (compute the exit fade-out from them) and declare `durationProp` in the manifest, so that
   when the clip is lengthened the fade-out moves with it instead of freezing at the original duration.
3. **Write the timeline only once**: `SHOTS` in `timeline.ts`/`Main.tsx` is the single source of truth; SFX frame pins, the caption
   table and transition points are all derived from it and `export`ed; `workbench.ts` only imports and adds component/schema.
4. **Pure functions, deterministic**: do not read `useVideoConfig().durationInFrames` to make absolute-time assumptions (the motion-lab
   family's `useT()` normalization is an exception and is handled correctly by the workbench: lengthening the clip = slowing the animation down).
5. Before delivery, run `npm run parity` once (§5) to confirm the breakdown is lossless.
6. **Live preview must be able to keep up**: the Player composites in real time, unlike rendering, which waits for rasterization to finish on every frame before capturing. Procedural gradients / `backdrop-filter`
   covering giant planes (thousands of px square) placed in a 3D layer like PageCam that changes `zoom` every frame will flicker in and out as whole blocks when
   Chrome's rasterization can't keep up — the metal desktop in S3 of the Ink Press template once flashed wildly in preview because of this,
   while the remaining shots had 0 anomalies across the whole video (measured with CDP screencast, frame by frame, looking for brightness pulses). For purely decorative repaint content like this, branch on
   `getRemotionEnvironment().isRendering`: rendering uses the original effect, preview uses a solid color / lighter stand-in, with geometry
   and timing unchanged (`METAL_PREVIEW` in `SceneFlyIn.tsx` is the example). Parity only compares render output, so it still holds.

schema field types: `text` / `textarea` / `number` (min/max/step/unit) / `slider` / `color` /
`select` (options) / `boolean`, defined in `workbench/src/cards/types.ts`.

## 4. What the motion library (demos/) looks like in the workbench

`scripts/gen-index.mjs` scans `demos/<category>/<card>/<component>.tsx`; anything that exports `<component>: React.FC` (no required
props) is hooked up as a card (150 of 152 tsx files are hooked up: `ClipCardLooping` needs a real mp4 asset and
`page-waterfall-wall/VerticalTicker` is a helper component, so both are skipped). Chinese name / category / one-line description come from the Gallery's `library.json` + `translations.js`;
the preview uses `gallery/media/<style>.mp4` (fetch them first with `gallery/fetch-media.sh`, otherwise the Player loops live).
Duration lookup chain: the demo's exported `*_DURATION|*_DUR` → the `NNNf` in the shot recipe card md's "时长:" (Duration:) → an in-file
`const *DUR*` → default 150f; the source is recorded in `DEMO_MODULES[].durationSource`, and the clip can be trimmed at any time once on a track.
All demo schemas are empty (time/layer editable, properties not editable) — to tune parameters property by property, extract CONFIG into
props per §3 and add `export const schema`… this is not read automatically yet and is a future extension point.

The workbench ships 4 parameterized native cards: generic text, Ink Press title card, narration caption bar, warm-white flash transition
(`workbench/src/cards/inkpress/`, sourced from the template components, with motion identical down to the letter, and copy/color/font size open).

## 5. Export, Studio and lossless verification

- **Export the final cut**: top bar "导出成片" (Export final cut) → the dev server starts the Remotion CLI to render the current project (`workbench/exports/`).
  Before rendering, `public/` is dereferenced and synced to `.render-public/` (Remotion's static server refuses to serve symlinks).
  `remotion.config.ts` uses the same settings as template: jpeg frames, ANGLE GL, concurrency 4.
- **Remotion Studio**: `cd workbench && npm run studio` — `Main` (paste project JSON), `ProjImported`
  (the freshly imported final cut), `ProjOriginal` (the original composition) + one composition per card (the schema is converted to Zod automatically, and parameters are tuned with the official Inspector).
- **Lossless verification**: `npm run parity -- --frames 150,240,470,1000` renders same-frame PNGs of `ProjImported` and `ProjOriginal`
  and compares them pixel by pixel (requires python3 + Pillow); differing pixels < 0.1% count as identical. Exit code 0 identical / 1 differences /
  2 no conclusion could be reached (Pillow missing, comparison not run) — it never gives a false green. Run it once after changing the manifest or the timeline in Main.tsx.

## 6. Known limits

- Clips may overlap on the same track (layering is expressed with multiple tracks); speed changes are uniform remaps (no curve speed ramps).
- The card library (demos / native cards) is laid out at 30fps (`CARD_FPS`), while final-cut unit cards use the fps of the final-cut manifest (`CardDef.sourceFps`);
  when the project fps differs, dragging a card onto a track converts the duration via `clipDefaultsFor` and applies an inverse speed change so playback speed stays the same; media cards
  (video / audio / image, `timing: "realtime"`) only have their duration converted, without a speed change. Freeze does not change `useVideoConfig().fps`,
  so if a card times things in seconds, e.g. with `spring({fps})`, its rhythm will drift in non-30fps projects — the properties panel shows a hint; final-cut units are not affected
  (their frame rate matches the project). Timecodes / segment seconds / preview margin are all counted in the project fps.
- `open.mjs` only restarts the dev server it started itself (verified via `.dev.pid` + the process command line); if the port is occupied by a manually started server
  it exits with an error, because the `@proj` alias is fixed when vite starts and refreshing will not switch projects.
- Audio clips are truncated to the final cut's total length on import (in the original video, `<Sequence>`s extending past the end of the composition are already truncated).
- Grayscale textures needed by demo cards (`textures/live/*.png`): when the project brings its own `public/textures`, the project's take precedence;
  otherwise the workbench falls back to linking `demos/_textures`; when a project texture and a demo texture share a name but are different images, the demo preview will be "reskinned".
- The project's `src/` is bundled into the workbench via symlink, with `react`/`remotion` resolved from the workbench's node_modules
  (remotion 4.0.484 / React 19); if the project uses packages other than `@remotion/three`, `three`, `@remotion/motion-blur`,
  `@remotion/google-fonts`, install the same versions in `workbench/` first.
- Division of labor with the JianYing export (`jianying-export.md`): JianYing is for users who want to "keep editing in external editing software"; the workbench is for
  users who want to "change a few things in a local browser and get the video out", and it can change the parameterized properties inside a shot (JianYing can only change the speed of whole segments).
