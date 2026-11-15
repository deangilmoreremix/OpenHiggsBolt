
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
