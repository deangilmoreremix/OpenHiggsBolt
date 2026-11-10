# Image Overlay Presets — real-export certification (perfume demo, real photographs)

Code: 221049f (nine alignment changes), 4th commit (placement/visual fixes). Exports: browser Remotion render, 8 presets x 16:9/9:16/1:1/4:5 (frame at 2.0 s) + badge, 2-picture collage, marked-subject runs. Photos are same-origin repo images used as stand-ins. Evidence in `docs/image-presets-evidence/`.

| Preset | Real-export verdict |
|---|---|
| Rounded Floating Card | PASS: ~30 px radius at 1080p, thin white border, all 4 ratios |
| Circular Portrait | PASS: circle + white ring |
| Product Spotlight | PASS: warm glow visible; "20% OFF" badge renders (16:9 run) |
| Cinematic Reveal | PASS: diagonal clip-path wipe + light streak render; frames 0.0–0.8 s inspected (`diagonal-reveal-frames.png`) |
| Collage | PASS: 2 pictures -> two stacked bordered tiles; 4 -> 2x2 |
| Polaroid | PASS: ~5° tilt, heart, sparkles visible; no longer on the text/bottle after "Apply recommended" |
| Split Screen | PARTIAL: diagonal divider + white line render; slide-in frames (0.05–0.7 s) clean. Panel covers the bottle (any half does) — flagged by the Quality Check. Text-on-panel is now flagged and the engine moves text to the video side (unit-tested 16:9/1:1, both sides) and RE-EXPORTED at all 4 ratios (`split-screen-after-text-fix.png`): text now sits on the video side; in 1:1 the business name ends right at the divider line (tight). Panel still covers the bottle, flagged `split-covers-footage` |
| Soft Masked | PASS (shape/glow); feather is subtle; small in 9:16 |

Added since: Polaroid and Split Screen animation frames (0.05/0.2/0.4/0.7 s, `polaroid-split-animation.png`) inspected: clean fade/slide-in. White border measured on the rounded-card export (two ~2–3 px light edge lines, expected 0.003x1080 = 3 px; H.264 softens them).

Open / not done: fixture-colour pixel script (`phase5-preset-analysis.py`) does not apply to real photos and was not re-run, so corner radius in px is NOT pixel-measured (unit-tested only); 9:16/1:1/4:5 inspected at 2.0 s only; Soft Masked is small in 9:16; rights remain `unverified` for every demo clip (Review item stays; owner decision pending). Subject avoidance claimed only for zones the customer marks or the profile declares.
