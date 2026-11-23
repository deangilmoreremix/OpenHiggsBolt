# Legacy Project Compatibility Implementations

This directory freezes the 66 demos removed from the shot library in 2026-10, along with the shared components they use; the source version is recorded in `manifest.json`.
It is used only by the workbench to resolve legacy `demo:<Stem>` cardIds: it is not added to the asset library, the gallery, or Studio's list of standalone compositions,
and the shots, timing, speed changes and properties in legacy projects are not migrated, replaced, or rewritten.

`manifest.json` stores the names and default frame counts from the legacy registry (including demos that previously did not export a duration).
`workbench/scripts/gen-index.mjs` generates a hidden compatibility index; legacy cards go only into the `CARDS` lookup table,
not into `CARD_LIST`, which is used by the asset library and for registering standalone compositions.

Legacy screenshots are served from `_textures/` here via `workbench/public/legacy-textures`,
kept separate from the new `textures/live/` and from user-linked finished-video assets, so that new screenshots do not change the layout of legacy shots.
In the source files, these `staticFile` paths were changed from `textures/live/` to `legacy-textures/`,
and the JPG backplate for `StreamResponse` is also now loaded from this namespace (the image content is unchanged).
Do not delete the implementations here to clean up the shot library; otherwise old localStorage saves, imported JSON, and CLI exports will once again be missing frames.
