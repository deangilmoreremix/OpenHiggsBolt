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
| Split Screen | PARTIAL: diagonal divider + white line render. Panel covers the bottle (any half does) and, in 1:1, business-name text overlaps the panel. Quality Check flags the subject; text-over-panel is not yet resolved |
| Soft Masked | PASS (shape/glow); feather is subtle; small in 9:16 |

Open / not done: pixel-analysis script not re-run on the new look; mid-animation frames only inspected for Cinematic Reveal; Polaroid/Split animation frames and 9:16/1:1/4:5 inspected at 2.0 s only; split-panel vs text collision; rights remain `unverified` for every demo clip (Review item stays; owner decision pending). Subject avoidance claimed only for zones the customer marks or the profile declares.
