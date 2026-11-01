---
name: outline-word-fill
one_liner: An outline word (thin warm-grey stroke, weight 500) snaps from 3.2× with a fast-then-slow contraction into place, a large dashed circle then shrinks from 2.8× to surround the word and slowly rotates, and horizontal dashed lines extend inwards from the left and right frame edges; the stroke first brightens slightly, then the solid white-hot word hard-cuts on within a single frame, with one flash of glow before it freezes
use_when: The heavy hammer beat for a one-word benefit / slogan; a "nail" shot on a rhythm hit point; the emphasis frame of a dark-background brand film
length: about 3.0s (90f@30fps, a short single beat + 36f landed)
energy: high (3.2× contraction + instant lighting, high impact in a short time)
---

## Intent
To drive a word home like a nail, what you need is not a slow fade-in but **two landings**: first the giant outline word
contracts rapidly into place (the landing of size), then the stroke turns solid white within one frame (the landing of
texture). The 1.5s of dashed-circle contraction and horizontal dashed lines extending inwards in between is the "aiming" process — a technical
drafting vocabulary that makes the lighting moment read as "confirmed". The fill **must be instantaneous**: a slow sweep fill turns
the nail into a slow beautification animation.

## Motion core
(The demo is calibrated in native 1920×1080 coordinates and frame numbers; look = ember warm black · orange)
- Outline word fast-then-slow contraction: `scale = mix(3.2, 1, ramp(f, 2, 11, EASE.snappy))`, fade-in over 2–8f —
  **the contraction window is only 11f**, so fast it's almost a single impact; momentary defocus by scale velocity (zero once settled)
- Two text layers: `outline` (`color:transparent` + `-webkit-text-stroke:2px` warm grey) and `solid`
  (white-hot #fff5ee, initial opacity 0) stacked, 220px / **weight 500** Helvetica Neue
  (a medium weight, not a title's 800 — an outline word that's too bold smears into a block)
- Large dashed circle (r=410, `dasharray 22 18`) + an inner 72-tick ring (a long tick every 30°, slowly rotating in reverse) + four registration marks:
  fade in over 8–18f, `scale 2.8 → 1` slowly contracting over 8–52f (EASE.out, **44f, the slowest curve in the piece**); the main circle rotates 0.22°/f,
  braking to a stop the moment it lights up ("locked"), while the inner ring keeps turning slowly so the frame still breathes during the hold
- Left and right horizontal dashed lines (`dasharray 14 12`): over 28–46f they extend inwards from the frame edges to 28px outside the circle edge, with crosshair dots at the line ends;
  above the lines, mono readouts "BEFORE 1 week" / "AFTER 4 hrs" — telling "faster" as a before/after pair of data (a week of hand keyframing vs one afternoon with video-shotcraft to a finished film)
- Stroke pre-heat: 44–53f warm grey → bright orange-white with a little outer glow, giving the hard cut a "charging" prelude
- **Instant fill**: on frame 54 `lit = frame >= 54 ? 1 : 0`, solid and outline opacities hard-cut with no in-between state;
  on the same frame the circle / horizontal lines lock to orange and the right-hand readout turns orange
- A glow that flashes and vanishes: `flash = lit · (1 − ramp(f, 54, 8))`, two text-shadow layers of white 14px + orange 60px; after decaying over 8f
  only a very faint orange halo remains; a shockwave ring expands 160px out from the circle edge and dissipates over 14f (once only); the stage key light pulses once in sync
- Landing: over 56–70f, the eyebrow inside the circle (small video-shotcraft logo + all-lowercase mono wordmark) / subline (40px, "One prompt to a finished promo.") rise, 70–90f hold, with an extremely slow push-in 1→1.015 throughout

## Parameters
| Parameter | Typical value | Tuning feel |
|------|--------|----------|
| Contraction | `scale 3.2 → 1`, 11f window, snappy | 3.2× is the amount for "backing away from your face"; <2× reads as ordinary scaling; a window >20f becomes a slow zoom and all the impact is lost |
| Weight and size | 220px / **500**, about a third of the frame width | 700+ on an outline word makes the thin stroke wrap a large empty area and it reads as balloon lettering; 500 is the sweet spot for outline type |
| Stroke | 2px warm grey (138,118,104), pre-heated to bright orange-white before lighting | A thin stroke is drafting vocabulary; >4px becomes graffiti; delete the pre-heat step and the hard cut seems to come from nowhere |
| Dashed circle | r=410, `dash 22 18`, scale 2.8→1 (44f), rotating 0.22°/f, braking on lighting | The 44f slow contraction is the piece's "breath", contrasting fast/slow with the 11f word contraction; compress the window to 20f and the two collide |
| Horizontal dashed lines | `dash 14 12`, 28–46f extending inwards to 28px outside the circle edge | The inward end must stop outside the circle edge (not inside the circle); extending across the full width reads as a crosshair, overdone |
| Instant fill | hard cut on frame 54 (by
