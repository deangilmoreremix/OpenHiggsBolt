# final-review — Independent Final Review of the Finished Video

The independent review Agent uses this checklist to verify "whether the finished video meets the production baseline of the current creation mode", and combines it with
`aesthetic-rules.md` to check visual technical quality. The review Agent must be in a clean context and not take part in
production; do not give it reasons, justifications, change history or expected conclusions from the production process.

## Review inputs

- The latest finished MP4 and key frames for each shot;
- Creation mode: use the template directly, autonomous free creation, or co-creation;
- The product video brief and the features that must be shown;
- The requirement-to-execution decision table;
- The visual direction, brand tokens,
  styleframe (or reason for skipping it) and banned styles confirmed by the user in co-creation or recorded by the Agent in autonomous free creation; in template mode provide the original template structure and the actual replacement record;
- The feature-to-shot mapping;
- The Gallery card names and specific variants specified by the user or recorded by the Agent in the design spec;
- The corresponding card and `style-key` records in `gallery/api/library.json`;
- The exact demo TSX source code located via the card documents;
- The corresponding Gallery reference samples, or key frames/contact sheets extracted from the reference samples;
- The final storyboard, captions, page states and SFX plan;
- The selected `references/shots/*.md`;
- `aesthetic-rules.md`;
- The data compliance policy.

When an input is missing, mark it "unable to verify"; do not guess the production baseline yourself. When the index, card documents,
demo source code and Gallery reference samples conflict with each other, report the source of the conflict explicitly; do not pick one yourself as the truth.

## Check items

### P — Product goals

- P1: Are the product positioning, target users and core selling points clear;
- P2: Does the finished video focus attention on the feature priorities confirmed or recorded in the current mode;
- P3: Are there feature claims that don't exist in the project, are unconfirmed, or are easily misleading.
- P4: Can the execution choices in the requirement-to-execution decision table be found implemented in the storyboard, copy, page states, audio and assets;
  a fixed stereotyped "audience/purpose → style" mapping must not replace project evidence.

### F — Feature completeness

- F1: Does each "feature that must be shown" have at least one clearly recognizable shot;
- F2: Does each shot provide new information; are there repeated features or repeated taglines;
- F3: Do page states let the audience understand the feature, rather than being merely decorative motion.

### V — Visual direction

- V1: Do fonts, palette, materials, corner radii, light quality and information density match the confirmed or recorded visual direction;
- V2: Do motion speed, overshoot, holds and energy curve match the confirmed or recorded motion personality;
- V3: Does it depart from the production baseline, drifting toward Ink Press, cyber neon or other unrelated styles;
- V4: Are banned colors, effects or brand characteristics used.

### S — Shot cards and Gallery variants

- S1: Do the shot cards in the feature mapping actually appear in the corresponding shots;
- S2: When the user named `card name · style name`, do the `style-key`, the exact demo TSX and the Gallery
  reference sample point to the same variant, and does the finished video use that variant;
- S3: Compared against the exact demo TSX and the Gallery reference sample, are the recipe card/demo's motion
  grammar, key timings, easing relationships and mask timing preserved;
- S4: Are the card's annotated "Known pitfalls / critical points" violated;
- S5: Are the adapted product screenshots, coordinates and brand tokens natural.
- S6: Have styles marked "reference only, requires custom implementation" been explicitly named by the user, with their
  implementation risk noted in the report; do styles marked "missing preview" avoid claiming consistency with a motion sample.

Pixel-level consistency with the Gallery samples is not required. What is checked is whether the motion grammar and key parameters are faithful, while
allowing adjustments of screenshots, coordinates, copy, brand visuals and necessary composition for the target product.

### B — Storyboard consistency

- B1: Do shot order, durations and feature information match the confirmed or recorded final storyboard;
- B2: Are the main actions, page states, asset sources, captions, transitions and SFX consistent;
- B3: Is the brand wordmark hold at least 1 second, and does batch motion end with at least 0.5 seconds of stillness;
- B4: After the final storyboard was released, were key shots deleted, replaced or added without justification.

### D — Data and asset safety

- D1: Is the real data, fictional data or anonymization policy followed;
- D2: Is any customer, personal, secret, internal address or other sensitive information exposed;
- D3: When showing real product pages, are real screenshots used rather than low-quality hand-built reproductions;
- D4: Are screenshot states, fonts, images and dynamic data fully loaded.
- D5: Does public demo data have a verifiable public nature; have customer, personal, internal, secret, live
  or other sensitive data been made fictional, anonymized or frozen.

### A — Audio and rhythm

- A1: Does the BGM match the confirmed or recorded audio direction, and does its volume leave room for SFX and optional voiceover;
- A2: Are SFX pinned to real action keyframes; is there obvious misalignment;
- A3: For strong-rhythm music, is the cut point error no more than 3 frames;
- A4: Do the ending energy peak and the riser→impact→sparkle phrase hold up (if the storyboard uses them; the sparkle beat is taken from `sfx/light/`);
- A5: Have all long samples (>5s, 21 in the library) been given an explicit `durationInFrames`; does any sound effect keep sounding after the action ends;
- A6: Is every SFX actually audible in the **rendered output** (don't rely on the preview — the preview clamps volume to 1.0); for assets that are inherently recorded quietly (peak <-12dB, 7 in the library), which may still be buried by the BGM even at 1.0, have they been swapped / pre-normalized / given sufficient >1 gain, with max_volume not clipping after rendering;
- A7: Are UI-type sound effects real object textures rather than synthesized feedback prompt sounds (the S1 deciding question) — if synthesized sounds in `sfx/ui/` such as `ui-confirm-*` `ui-*-tone` `ui-notify-*` appear in the finished video, is there a narrative reason of "the system is speaking" and has it been written into the project documentation (per-file texture table in sound-design 3.3).
- A8: For videos with BGM, have both the with-BGM / without-BGM (keeping SFX) versions been delivered,
  and do both come from the same timeline (the without-BGM version's picture and SFX are frame-by-frame identical to the with-BGM version);
- A9: For beat-synced/SFX-dense videos, have the output audio track offset and source peak
  lag been measured on the finished video and compensated (sound-design §4.6); does the compensation constant come with a measurement record (the four render pipeline elements,
  probe, measurement method, date); are source analysis values and the output offset accounted for separately (SOURCE_BEAT0
  not contaminated); is the post-render back-test error table free of systematic same-direction offset (music-beat-sync §5b).

### Q — Visual technical quality

Execute `aesthetic-rules.md` in full. At minimum check text sharpness, composition, rounded-corner masks, 3D texture
clarity, element placement, camera shake, transition seams, cheapness of light effects, readable duration and deterministic rendering.

## Report format

Each conclusion uses an ID, and issues come with frame numbers or screenshots:

```text
P1 ✓ Product positioning and core selling points are clear.
F2 ✗ Frame 340: the confirmed knowledge graph feature does not appear in the finished video.
V3 ✗ Frame 420: large areas of amber paper material depart from the confirmed deep-blue tech direction.
S2 ✗ Frame 515: the user chose whip-pan, but it was actually implemented as flash-cut.
Q2 ✗ Frame 615: body text is blurry after the 3D push-in; see key frame f615.png.
```

Finally, list must-fix items, suggested improvements and unverifiable items by severity. Do not replace item-by-item checks with an unsupported
"overall good", and do not mark everything as passed to make the report look good.
