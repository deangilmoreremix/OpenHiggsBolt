# Shot redesign · Round 2 execution brief (required reading for every agent taking part in the revision)

## 0. What this round wants

Round 1 (`shot-polish/after-v1/`) only did "conservative polishing": it kept the original geometry, original colors and original rhythm, and added shadows/grain/easing.
The result was clean but bland — light gray background + the same indigo, small text, empty composition, unchanged rhythm. The user's feedback:

> I want **substantial** improvements in **rhythm, motion curves, visual effects, color, design and typography**;
> **you don't have to follow the original video; just follow the rough shot design of the original video**.

So this round is a **redesign**, not polishing. The standard: treat each shot as one that will go into a top-tier product launch film (Apple keynote,
the launch films of Linear / Stripe / Vercel / Arc) or a motion designer's portfolio reel.
Pausing on any frame should look like a designed poster; during playback the rhythm should have tension and release, and the motion should have weight.
**Side by side with before and after-v1, the improvement must be visible at a glance, and substantial.** Changes that only add a bit of shadow and grain do not pass.

## 1. What to keep, what to free up

**Keep only "the rough shot design"** — that is, the technique itself described in the card md's "一句话 (one-liner) / 意图 (intent)":
crash zoom is still a sharp push-in, clock wipe is still a clock-style sweeping transition, split text stagger is still a per-character staggered entrance,
counter confetti still fires confetti when the count reaches the end. The technique's recognizability must be stronger; it must not turn into a different technique.

**Everything else can be redone**:
- Colors (change the look), background, light, materials;
- Layout and composition (subject size, position, grid, whitespace);
- Content and copy (product names, numbers, titles, UI content — make up better ones; use only fictional brands, no real company/product names);
- Typography (font size, weight, letter spacing, hierarchy, mixed Chinese/English);
- Rhythm and duration (the **value** of `*_DURATION` can change, the constant **name** stays); motion curves, staggering, springs, camera paths;
- You may stop using `_fixtures/Fixtures.tsx`'s FakeDashboard / Card / TitleBlock and build visuals tailor-made for the shot yourself
  (they are generic small-text dashboards that are unreadable and unattractive in most shots).
- Copy language: if the original shot is in English use English, if Chinese use Chinese; placeholder/debug text (such as the card name in caps in a corner) must all be deleted or replaced with content.

**Still off limits**:
- Export signatures: `export const <Stem>: React.FC`, duration constant names, other exports imported elsewhere
  (confirm with `grep -rn "<export name>" demos template workbench/src assets`). Components take no required props.
- Do not change `demos/_fixtures/`, `demos/_textures/`, `template/`, `workbench/src/`, `gallery/`. If you need a shared helper, write a local function in your own
  demo file.
- Shots that use real screenshot textures (`staticFile('textures/...')`): the screenshots represent "the product's existing pages" (Q1); the textures themselves stay,
  but camera moves, color grading, light, background stage, rhythm, and accompanying text and elements can all be redone.
- Deterministic-rendering iron rule: no `Math.random()` / `Date.now()`; pseudo-randomness uses fixed seeds; every interpolate is clamped; components are pure functions of the frame.
- No new npm dependencies (you may use remotion, @remotion/motion-blur, @remotion/three + three (for cards already using them);
  don't use `@remotion/google-fonts` — demos get copied into projects that only have remotion installed; use the system font stack).

## 2. Toolbox: `demos/_fixtures/Look.tsx` (new) + `Polish.tsx`

Read these two files first (both are short). `import { ... } from '../../_fixtures/Look'` (adjust the relative path for the nesting level).

- `LOOKS`: 8 complete palettes; choose one per shot —
  dark: `midnight` (deep blue · electric blue, tech/AI/data), `aurora` (purple-pink, launch/brand/magic), `ember` (warm black · orange, impact/speed),
  `graphite` (near-monochrome, cinematic/restrained/premium), `lime` (graphite · fluorescent yellow-green, sport/data impact/rhythm);
  light: `paper` (warm white paper · ink · vermilion, editorial layout/text), `porcelain` (cool white · cobalt blue, SaaS UI/interaction demos), `sand` (beige · terracotta, warm/lifestyle).
  Each contains bg/light/surface/surface2/line/ink/ink2/ink3/accent/accent2/onAccent/shadow.
  **The accent color is only for the hero and key information**; accent2 is only for touches. You can fine-tune on top of a look, but don't go back to gray background + indigo.
- `<Stage look keyLight fill horizon breathe>`: a stage background with key light, fill glow, optional horizon light band, vignette and grain.
- `<GridFloor>` perspective grid floor, `<Dust>` deterministic floating-dust bokeh, `<Sheen>` single-pass sheen (Q4: only once, only for the hero, clipped into the rounded corners).
- `TYPE` type scale (mega 260 / display 180 / h1 120 / h2 84 / h3 60 / body 40 / small 32 / label 22) and
  `type(size, weight, {caps, serif, mono})` for a heading style in one line; `SERIF` serif stack (large serif headings look great in editorial-feel shots).
- `<TextReveal text by="char|word|line" variant="rise|blur|drop|scale|track" start each gap ease out>`: per-character/word/line reveal.
- `stagger(i, n, span, ease)` stagger distribution, `springAt(frame, start, {damping, stiffness})` physical spring, `glow()` / `glowFilter()` bloom.
- `Polish.tsx`: `EASE` (snappy/out/smooth/swift/exit/anticip/overshoot), `ramp`, `mix`, `velocity`, `SpeedBlur`,
  `softShadow`, `surface`, `Grain`, `Vignette`.

The toolbox is a starting point, not a ceiling. Write whatever the shot needs yourself (local functions): SVG path animation, masks, gradient strokes, particles,
3D transforms, depth of field, chromatic aberration, halos and so on are all fine.

## 3. Standards for professional motion (self-check item by item)

**Rhythm**
- First write a **timetable** (as a comment at the top of the component): anticipation → main action → follow-through/aftermath → landing hold. How many frames per beat, and why.
- Have contrast: fast-slow-fast, dense-sparse. The main action is decisive (entrance 10–20f, large displacement 18–32f); after key information lands, hold ≥ 20–30f (R1);
  the tail holds 15–30f and lands cleanly (the workbench freezes the last frame). The first frame should not be a blank dead frame: within the first 3 frames there should already be something on screen
  (stage light, an element's starting state), unless the shot is meant to rise from black.
- No long dead stretches where nothing moves (>1s with no motion at all); hold segments can have an extremely slow camera push (1–3%) or breathing light to keep the image alive —
  but no handheld shake (Q3).
- Batch element entrances: distribute the stagger along a curve (`stagger` + EASE), getting faster or dense-then-sparse, with a physical metaphor (R2).

**Motion curves**
- Choose a curve for each action by its meaning: entrances strong ease-out (snappy/expo), exits ease-in (exit), position swaps asymmetric in-out,
  anticipation before big actions (anticip), settling overshoot ≤ one visible rebound (overshoot / spring damping 14–20). No linear motion (except for mechanical/constant-speed meanings).
- Overlap and follow-through: the parent moves first, children 2–4 frames later; position arrives first, scale/rotation/shadow converge a bit later; text lines a beat later than their backing plate.
- Sense of speed: during fast translation/scaling/rotation add directional blur according to velocity (`SpeedBlur` or blur computed from velocity), 0 when still.
- Camera: smooth, no abrupt velocity changes at start and end; push/pull/orbit all need a clear target and landing point.

**Visual effects (look)**
- One look per shot; consider dark first (most product launch films are dark + light), but choose according to the shot's intent, and make light looks equally premium.
  **Shots in the same batch should not all use the same look**, and the whole library should have variety: before choosing, run
  `grep -ho '"look": "[a-z]*"' shot-polish/notes/*.json | sort | uniq -c` to see the distribution already used across the library, and, as long as it fits the shot's intent, prefer the less-used ones.
  The style should also vary: text shots shouldn't all become "paper + serif editorial", UI shots shouldn't all become "purple glass" — switch techniques between shots of the same kind
  (Swiss grid / heavy-black-type poster / monospace tech / neon / film subtitles / magazine / product launch event / data dashboard……).
- Space and depth: foreground/midground/background layering, parallax, depth of field (blurred background + lowered contrast), two layers of soft shadow, consistent key-light direction.
- Light: the hero has light (one of rim light, underlight, bloom, sheen), the background has light spots/a horizon light band/floating dust, not a dead flat color. Light effects follow Q4.
- Materials: hairline thin edges on panels, inner top highlight, subtle gradients; dark-mode panels use a hued dark color + low-opacity white stroke; glass is possible (simulate the backdrop-blur feel
  with layered gradients). Overlay Grain on large gradients to prevent banding.

**Color**
- Neutrals + 1 accent color + at most 1 touch color; the accent covers a small but key area. Dark looks use hued darks, not pure #000; light looks don't use large areas of pure #fff.

**Design & typography**
- **Text must be big and have hierarchy**: main title ≥ h1 (120px), key numbers can be mega/display; supporting text meant to be read ≥ 32px (Q11).
  In a 1080p frame, 14–20px small text can only serve as "texture" (blurred/dimmed), not as content.
- Negative letter spacing on titles, widened letter spacing on all-caps small text, weight contrast (900 vs 400), tabular-nums for numbers; large serif titles can give an editorial feel,
  or mono a tech feel. When mixing Chinese and English, mind the baseline and weight.
- Composition: the subject should have weight in the frame (a UI subject generally takes 50–75% of the frame width), safe margin ≥ 96px, aligned to a grid, a clear visual center of gravity, intentional whitespace.
- UI shots: make "UI designed for the shot" — fewer elements, bigger text, stronger contrast, keeping only the information needed to explain the technique;
  still like a real product (realistic copy, icons, data), publication-grade (Q10).
- The final frame is a complete poster.

**Transitions/stacked multiple pages**: two pages share one background (draw only one `Stage`), otherwise seams and stacked vignettes will give it away; place the hero outside the `Stage`,
and put only background decoration in `Stage`'s children.

**Sharpness**: text in 3D/magnified shots must not blur (Q2: magnify via CSS zoom or lay out at the target size); thin lines must not flicker after scaling.

**Performance**: single-shot render (check-demo 1920×1080) should ideally be < 90s. Full-screen `filter: blur()` that changes every frame is very expensive; if you can simulate it with gradients/pre-blurring/
small elements, don't do full-screen real-time blur; keep particle counts moderate.

## 4. Workflow (per demo)

1. Read the card md (`references/shots/<category>/<card>.md`) and the demo source, and grasp what "the rough shot design" is.
2. Look at before (original) and after-v1 (round 1):
   `python3 shot-polish/sheet.py shot-polish/before/<Stem>.mp4 /tmp/<Stem>.before.jpg 8`, then Read the image;
   the v1 contact sheet already exists: `shot-polish/after-v1/<Stem>.sheet.jpg`. Single frame: `ffmpeg -v error -y -ss <seconds> -i <mp4> -frames:v 1 /tmp/x.jpg`.
3. **Make the design decisions before writing code** (write them into the comment at the top of the component): which look, what the subject is, composition, timetable, key curves,
   the content/copy to make up. Ask yourself: how would a top motion designer shoot this technique?
4. Rewrite the code. Keep it readable, with Chinese comments explaining the intent of key constants (consistent with the repository's style).
5. Self-check render (in the `workbench/` directory): `node scripts/check-demo.mjs <category>/<card>/<Stem>.tsx --frames 20,60,100`
   Outputs are in `shot-polish/after/<Stem>.mp4`, `.sheet.jpg` (8-frame contact sheet), `.f<N>.jpg` (full size).
   **You must Read the contact sheet and 2–3 full-size key frames** (middle of the main action, the landing frame, the last frame), and compare with before / v1.
   Iterate at least two rounds: after the first round, pick out the 3 weakest points and change them again. Until you're confident "this shot wouldn't be an embarrassment in a launch film".
6. Type check (repository root): `shot-polish/tsc-demos.sh <category>/<card>` only passes when it outputs `tsc OK` (known false positive: ClipCardLooping can't find
   `assets/lib/ClipCard`, ignore it).
7. If you changed duration, colors, key values or the visual description, update the affected sentences in the card md: the frame count in the frontmatter / "时长:" (Duration:) line,
   the values in the parameter table, frame numbers or color descriptions hard-coded in "动效核心" (Motion core). When the redesign invalidates the original measured values wholesale, the Motion core / parameter table / pitfalls
   sections can be heavily rewritten according to the new implementation; if the "一句话" (one-liner) describes a specific visual (e.g. "gray card"), it can be changed to the new visual, but the meaning of the technique stays the same.
   Keep the card's overall structure, and don't break the frontmatter format (the gallery sync script parses it). When one card md corresponds to multiple demos and some of those demos
   aren't yours, only rewrite the sentences related to your demo.

## 5. Concurrency constraints

- Only change the demo directories assigned to you (`demos/<category>/<card>/`) and the corresponding card md. Other agents are changing other directories at the same time.
- Do not git commit / push / switch branches; do not `git checkout` / `git stash` / `git reset` any file. The coordinator commits everything.
- Keep check-demo.mjs at the default `--concurrency 3`; do not raise it; do not run multiple render processes at once.
- Do not delete `shot-polish/before/` or `shot-polish/after-v1/`.

## 6. Revision notes (data source for the comparison page, mandatory)

After each demo is finished, **overwrite** (write the LOOKS name you used in `look`; for custom colors write `custom`) `shot-polish/notes/<Stem>.json` (UTF-8). The comparison page compares **original vs this round**, so
issues describes the original's problems and changes describes this round's changes relative to the original:

```json
{
  "stem": "CounterConfetti",
  "issues": ["Problems with the original, one per sentence, 3–5 items, specific to the observed symptom"],
  "changes": ["What this round changed, one per sentence, 4–6 items, specific to design decisions and techniques (look, layout, timetable, curves, effects)"],
  "issuesEn": ["same in English"],
  "changesEn": ["same in English"],
  "look": "ember",
  "mdChanged": true
}
```

## 7. Delivery report (final reply, concise)

Item by item per demo: `<Stem>`: look / new duration / 3–4 key changes, whether the md was changed, render OK / tsc OK, remaining issues.
The last line lists the paths of all files you changed.
