# template/ — final-cut template Ink Press: a paper-and-ink morning-read style product promo (36.2s)

An accepted, complete promo project serving as the template for "extremely close reproduction": swap in screenshot assets of a different web/desktop
product, replace and adapt shot by shot according to this document, and you get a final cut of the same polish.

- Spec: 1920×1080 @ 30fps, 1085 frames (36.2s), SFX-only (the no-BGM version)
- Style: paper, ink and amber (paper background `#f2eee6`, ink text, large serif headings, amber accent color)
- To run it: `npm install && npx remotion studio src/index.ts` (preview)
  / `npx remotion render src/index.ts AiflPromo out/promo.mp4` (render)
- Acceptance still: `npx remotion still src/index.ts AiflPromo out/qa/f150.png --frame=150`

## 1. Video structure (AIFL_SHOTS in src/aifl/Main.tsx)

Energy skeleton: brand open (low) → feature segments ×3 alternating with title-card breathing slots (medium-high/low) →
the final assembly pushes to the whole video's peak. At the two wordmark moments (open, close), hold for a full 1s after landing.

| # | Frame range | Duration | Scene file | Content | Corresponding shot card |
|---|--------|------|----------|------|-----------|
| 1 | 0–220 | 7.3s | live/SceneOpen.tsx | Ink-line drawing + wordmark stamp open → dashboard wide shot → spotlight hero card (hover + light-beam sweep + return to place) | brand-ink-open / spotlight-hero-card (for the high-res rasterization technique see aesthetic rule Q2) |
| 2 | 220–275 | 1.8s | PaperTitleCard.tsx | Title card ① "All your team's research, one place to go." | paper-title-card |
| 3 | 275–465 | 6.3s | live/SceneFlyIn.tsx | Card-deck close-up orbit → cards dealt flying into the grid → scroll → search typing → filter → click push-in | deck-deal-flyin / type-and-filter |
| 4 | 465–565 | 3.3s | live/SceneDetail.tsx | Macro close-up of the detail page, row elements embedded one by one | row-embed |
| 5 | 565–620 | 1.8s | PaperTitleCard.tsx | Title card ② "Paper Radar…" (with a DigitRoll numeric subtitle) | paper-title-card |
| 6 | 620–725 | 3.5s | live/ScenePapers.tsx | Paper Radar list stacking and pressing in + counter landing | list-stack-press |
| 7 | 725–775 | 1.7s | PaperTitleCard.tsx | Title card ③ "Every project, linked to your weekly report." | paper-title-card |
| 8 | 775–885 | 3.7s | live/SceneWbr.tsx | Typewriter reveal of the weekly-report page "writing itself" + past weekly reports popping into the sidebar one by one | document-typewriter-reveal |
| 9 | 885–940 | 1.8s | PaperTitleCard.tsx | Title card ④ "The whole team, on the same page." | paper-title-card |
| 10 | 940–1085 | 4.8s | live/SceneOutroLive.tsx | Defocus → group-photo assembly of elements → letterpress wordmark slams down (riser→impact→sparkle) → 1s hold | outro-group-photo-launch |

Overlay layers (all managed declaratively in Main.tsx, and all `export`ed — the `src/workbench.ts` manifest
imports them from here, and the Motion Workbench uses them to split the final cut into multiple tracks, see ../references/workbench.md):
- **TITLE_CARDS**: the copy table for the four title cards (`*word*` = amber italic emphasis word, parsed by `parseWords`);
  card2 has a subtitle + rolling number
- **CAPTIONS**: 6 full-width narration captions at the bottom (absolute frame number table), laid over the feature segments; not added to the title-card/outro segments
- **FLASH_CUTS / FlashCut**: warm-white flash transitions at 4 places, `from = cut point − 5`, straddling the seam by 5f on each side
- **SFX frame-pin table**: 30+ entries `{from, src, volume}`, each commented with the on-screen action it corresponds to;
  long keyboard samples are truncated by context with Sequence duration (`sfxDuration`: 24f/44f)

## 2. Shared foundation components

| File | Role | Key points |
|------|------|--------|
| live/Scene*.tsx · PaperTitleCard · Caption | Each scene exports `*_DEFAULTS` (copy / font size / palette) and reads them as props with default values; the schema in `src/workbench.ts` references the very same object, so these are what you change in the workbench properties panel. Easing / timing values / camera keys are not exposed | When switching products, change DEFAULTS first rather than scattered literals; the color values are the sRGB render values of the original oklch tokens (ink #13110f · amber #955905 · gray ink #65635f · deep amber #ae6700) |
| live/PageCam.tsx | 2.5D page camera — the foundation of every "real page" shot | Full-page screenshot + keyframes `{frame,cx,cy,zoom,rotX/Y/Z,persp}` interpolated into camera moves; children are positioned in page CSS px (same coordinate system as layout.json); **3D mode uses CSS `zoom` for layout-level magnification** (transform scale downsamples first and then upscales, making text blurry — for the root fix see aesthetic rule Q2); optional dof top gradient blur band |
| PaperTitleCard.tsx | Title-card breathing slot | Large serif text enters word by word, accent words in amber; a DigitRoll numeric subtitle can be attached |
| FlashCut.tsx | Warm-white flash transition | Only covers 10f on either side of a hard cut; not used as a decorative light effect |
| Caption.tsx | Full-width narration at the bottom | Small monospace text + letter spacing, with a light push on entry and exit |
| DigitRoll.tsx | Odometer digit roll | Rolls and lands digit by digit |
| live-layout.json | Page element coordinate table | Each element `{x,y,w,h}` (full-page CSS px coordinate system) + pageH per page; scene code imports it to determine flight target positions/mask positions |

## 3. Asset list (public/)

- `textures/live/*.png` — full-page 2x screenshots (projects-full / detail-full / papers-full /
  wbr-full), element slices (card1–10, paper1–5, float-*, nav), empty board
  (projects-empty), high-res close-up card (card4-hires, captured separately at 4x)
- `audio/*.mp3` — the 11 SFX used in this video (Mixkit; licensing in ../assets/audio/ATTRIBUTION.md)

> Note: this template's screenshot assets come from an internal research-management tool (the data is fictional demo data).
> Before distributing a final cut externally, be sure to replace the whole set with the target product's own screenshots.

## 4. Product-swap reproduction guide (the shortest path that preserves quality)

1. **Capture assets** (for the specific capture method see ../references/pipeline.md stage 4; the template route only borrows
   the capture method and does not run the free-creation stages 0–3):
   copy `../assets/scripts/capture-template.mjs` into the target product project, change BASE_URL
   and the selectors, and produce the three-piece set — full-page 2x screenshots, element slices with transparent backgrounds, layout.json.
   Name the assets to match this template (projects-full/detail-full/…), so they can directly overwrite public/.
2. **Swap the layout coordinates**: replace `src/aifl/live-layout.json` with the new layout.json.
   All flight target positions/mask positions/floating-piece positions in the scene code are read from it, so when the coordinates change the animation follows.
3. **Adapt shot by shot** (in the order of the table in section 1):
   - For each shot, **first read the full text of the corresponding shot card + the scene source**, understand what the parameters mean, then change them;
   - Must change: PageCam's keys (re-set cx/cy/zoom for the new page composition),
     element slice file names, card count/slot cycling, copy;
   - Do not touch: easing curves, duration ratios, hold frame budgets, the SFX frame-pin structure —
     these are where the polish lives; changing them amounts to redoing the tuning.
4. **Copy**: the `TITLE_CARDS` table (title cards, `*word*` marks emphasis), the CAPTIONS table, the outro brand name/tagline.
   If the shot structure changes, update `src/workbench.ts` accordingly (add a `scene(...)` line for a new shot; follow `title(...)` for title cards),
   then run `cd ../workbench && npm run parity` to confirm the breakdown is lossless.
5. **Acceptance**: after finishing each shot, output stills with `npx remotion still` for self-check (for each shot at least
   three frames: mid-entrance / action peak / after landing); once everything is changed, render the whole video + extract frames with ffmpeg to review;
   finally go through the checklist against ../references/aesthetic-rules.md.
6. **Duration scaling**: when adding/removing shots, shift the `from` of AIFL_SHOTS as a whole (it is the single source of truth),
   and the absolute frame number tables of CAPTIONS/SFX/FlashCut shift along with it — it's recommended to finalize the new timeline before touching
   the SFX table (every time the picture moves, the whole frame-pin table gets rearranged).

## 5. Polish checklist (hard metrics for reproduction)

- Text must be sharp under 3D/magnification: 2x full-page textures + PageCam layout-level zoom +
  separate 4x screenshots of the close-up elements — all three are indispensable
- Always breathe after landing: wordmark hold ≥30f, batch motion wrap-up ≥15f still
- Each animation technique is the star only once in the whole video
- Flying-in elements must land in the page's real slots (layout.json coordinates), not hang in mid-air
- SFX use film vocabulary (whoosh/impact/riser/sparkle/transition);
  game-UI timbres are forbidden; the ending uses the fixed phrase riser→impact→sparkle
- If BGM is added to a reproduction, the final render always delivers two versions: with BGM + without BGM (keeping SFX);
  wrap the BGM `<Audio>` in a `bgm` inputProp and render the no-BGM version from the same timeline:
  `--props=props-nobgm.json` (content `{"bgm":false}`; on Windows, inline JSON
  has its quotes stripped by the shell, so use a file)
- Deterministic rendering: no Math.random/Date.now; all pseudo-randomness uses fixed seeds
