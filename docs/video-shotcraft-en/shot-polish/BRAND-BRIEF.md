# Brand replacement round execution brief (round 3, required reading for every participating agent)

## 0. Background and goal

After the first two rounds of revision, the user made choices shot by shot on the comparison page (original / first revision / second revision / remove); see `shot-polish/decisions.json`.
The demos in the repository **have already been switched to the versions the user chose** (original taken from `main`, first revision taken from `d16a3df`, second revision is the implementation on the current HEAD),
and the 66 demos marked "remove" have been deleted. The user's request for this round:

> Based on the shots I chose, replace any logo / brand name that appears in them with video-shotcraft; where appropriate, replace the text with praise or promotion of video-shotcraft.

So this round **only swaps content and does not change the design**: the user chose versions by looking at the visuals, so shot technique, motion curves, rhythm, duration, colors, layout and composition are all kept as in the chosen version.

## 1. Brand pieces: `demos/_fixtures/Brand.tsx` (read first, very short) + `assets/brand/BRAND.md` (spec)

- `BRAND`: `name: 'video-shotcraft'`, `short: 'Shotcraft'`, `repo`, brand colors `amber #D3923C` / `ink #171714` / `paper #F5F3EE` / `slate`, wordmark font `font`.
- `<ShotcraftMark size tone="dark|light" frameProgress cutProgress>`: the Frame Chisel ("镜刻") mark — an open viewfinder frame + an amber diagonal cut.
  The two paths `MARK_PATHS.frame / .cut` can be taken separately for animation (frame drawn on first, diagonal cut sliding in after, or stroke path animation, mask reveals etc.).
- `<ShotcraftWordmark size tone mark>`: mark + `video-shotcraft` wordmark in a horizontal row.
- `PITCH.en / PITCH.zh`: brand short-line motto (**Frame motion. Craft the shot. / 把运动，刻成镜头。**), taglines, features, praise, works.
  When writing slogans / titles / reviews, pick from here, or rewrite in the same voice (you may rewrite to fit the shot better, but don't make up things that aren't true).
- Spec highlights: the wordmark is **all lowercase** `video-shotcraft` (no all-caps tech wordmark; caps labels in small eyebrow text don't count as the wordmark); the mark is not distorted, the diagonal cut angle isn't changed,
  the mark itself gets no glow / gradient / stroke / drop shadow, and the amber diagonal cut doesn't change color (on dark backgrounds use the `tone="dark"` reversed version, on light backgrounds use `tone="light"`).
  Stage lighting around the mark and the mark's entrance animation (scale / flip / draw-on / reveal) can be done as usual.
- import path: `import { BRAND, ShotcraftMark, ShotcraftWordmark, PITCH } from '../../_fixtures/Brand';` (adjust for the nesting level).
- `_fixtures/Fixtures.tsx`'s FakeDashboard has already been updated by the coordinator (sidebar mark + video-shotcraft name); demos that use it need no attention.

## 2. What to replace

**Must replace (logo / brand name)**:
- Fictional brand names, product names, company names, app names (Lumen, Stride, Northwind, Acme, Orbit…), as well as any leftover real company / product names;
- Placeholder logos: geometric-shape logos, letter logos, logo squares, brand badges, and the one among app icons that represents "this product";
- Brand wordmarks / closing lockups / end-credit signatures / watermarks;
- Brand-related URLs, domains, @handles, emails (replace with `BRAND.repo` or simply remove; don't make up nonexistent domains such as `shotcraft.com`).
- How to replace: put `<ShotcraftMark>` in the logo's position on screen (or draw it yourself with `MARK_PATHS` and animate it yourself); replace wordmarks with `<ShotcraftWordmark>` or
  `BRAND.name` text; when the shot technique itself is "something turns into a logo / a logo enters" (logo sting, UI turns into brand, icon flips into logo…),
  the end-point logo is the video-shotcraft mark — the technique must still hold up, so if necessary recompute paths / masks / landing points for the shape of the new mark.

**Replace where appropriate (copy → praise / promotion of video-shotcraft)**:
- Titles, slogans, subtitles, hero copy, end CTAs, reviews / testimonials, notifications / toasts, promotional sentences in chat bubbles → replace with promotion of video-shotcraft
  (motto / taglines / features / praise). One main message per shot; don't pile on all of PITCH.
- When the visual is demonstrating "a product's UI" (dashboard, editor, command palette, chat, form, list): the product is video-shotcraft —
  replace the app name; if it's convenient, replace the UI content with the world of video-shotcraft (shot recipe cards, storyboards, render queue, timeline, workbench, sample Gallery,
  `Render launch film`, `Add shot: crash zoom`……), so the visual tells the story of this product; where replacing the content would actually feel awkward, or the data itself is the star of the shot
  (e.g. the values of a pure data chart), just leave it as it is.
- **Don't force it where it doesn't fit**: purely abstract / pure light-effect / text-free shots; cases where the text itself is a prop of the technique and replacing it would break the technique (e.g. masks / zooms built on specific letter shapes,
  alignment based on hand-measured glyph widths) — if you do replace, fix the measurements along with it and verify by rendering; if you can't get it right, keep the original text.
- Language: if the original shot is in English write English, if Chinese write Chinese; keep copy length as close to the original as possible (the layout was designed for the original length).
- Don't write numbers that will go stale / aren't true: don't put card counts, star counts, user counts, "#1" and the like on screen; demo data in UIs (render counts, frame counts, durations) can be reasonable illustrative values.

## 3. Off limits

- Shot technique, timetable, motion curves, duration (the values of `*_DURATION` stay the same), color look, composition and subject size — only make minimal layout tweaks to accommodate the new text.
- Export signatures: `export const <Stem>: React.FC`, duration constant names and values, other exports imported elsewhere.
- Do not change `demos/_fixtures/` (including Brand.tsx, Fixtures.tsx), `demos/_textures/`, `template/`, `workbench/src/`, `gallery/`.
- Text inside real screenshot textures (`staticFile('textures/...')`) can't be changed, so keep it; the logos / copy we drew ourselves around it are replaced as usual.
- Deterministic-rendering iron rule: no `Math.random()` / `Date.now()`; every interpolate is clamped.
- No new npm dependencies, no `@remotion/google-fonts`.

## 4. Card md (handle according to the instructions given at assignment)

- Update the sentences in the md that mention the replaced brand names / copy (e.g. "Lumen wordmark lands" → "video-shotcraft wordmark lands").
- **Multi-style cards with removed styles** (the assignment instructions will list them): delete these styles' rows / paragraphs / parameters / pitfalls / reference implementation paths from the md, and change counts like "six styles" or "four styles",
  the one-liner, the selection table and the enumerations in the intent to the remaining styles; renumber the remaining styles in their original letter order (A/B/C…), and update references to style letters in the body along with them.
  Don't break the frontmatter format (`gallery/sync-from-cards.py` parses it).
- **Multi-style cards where different styles chose different versions** (the assignment instructions will mark them): the md currently has the second revision's text; for a style that chose the first revision / original, change its description (approach, parameters, pitfalls,
  duration in frames) back to match the chosen version's implementation — refer to `git show d16a3df:<md path>` (the first revision's md) / `git show main:<md path>` (the original's md),
  and check the values against the demo's current source.
- For cards rolled back wholesale to the first revision / original, the coordinator has already rolled back the md; only the brand-related sentences need handling.

## 5. Workflow (per demo)

1. Read the demo source and the card md, list every logo / brand name / piece of copy on screen, and decide item by item whether to replace it and with what.
2. Change the code. Chinese comment style consistent with the surroundings.
3. Self-check render (under `workbench/`): `node scripts/check-demo.mjs <category>/<card>/<Stem>.tsx --out ../shot-polish/final --frames <2–3 key frames>`
   — **you must add `--out ../shot-polish/final`** (`shot-polish/after/` is the second revision's comparison archive and must not be overwritten).
   Read the contact sheet `shot-polish/final/<Stem>.sheet.jpg` and the key frames, and confirm: the new text doesn't overflow / isn't clipped / doesn't clash with other elements, the mark is crisp with correct proportions, and
   the technique still holds up. Compare with before the change (pre-change renders: original `shot-polish/before/<Stem>.mp4`, first revision `shot-polish/after-v1/<Stem>.mp4`,
   second revision `shot-polish/after/<Stem>.mp4`; generate contact sheets with `python3 shot-polish/sheet.py <mp4> /tmp/<Stem>.prev.jpg 8`).
   Demos that weren't changed at all don't need rendering.
4. Type check (repository root): `shot-polish/tsc-demos.sh <category>/<card>` outputs `tsc OK` (ignore the ClipCardLooping `assets/lib/ClipCard` false positive).

## 6. Concurrency constraints

- Only change the demo files assigned to you and the corresponding card md; other agents are changing other directories at the same time.
- Do not git commit / push / switch branches; do not `git checkout` / `git stash` / `git reset` / `git restore` any file (read-only viewing with `git show <rev>:<path>` is fine).
- Keep check-demo.mjs at the default `--concurrency 3`, and run only one render process at a time.

## 7. Change notes (data source for the final confirmation page, mandatory)

For every demo assigned to you (including unchanged ones), write `shot-polish/final-notes/<Stem>.json` (UTF-8, overwrite):

```json
{
  "stem": "LogoStingButton",
  "changed": true,
  "brand": ["What was changed, one per sentence, 1–4 items: the original X → replaced with Y (logo / brand name / original copy → new copy)"],
  "brandEn": ["same in English"],
  "styleKey": "logo-sting-button",
  "mdChanged": true
}
```

For unchanged ones write `"changed": false`, with one sentence in `brand` explaining why no replacement was needed (e.g. "Pure light-effect shot, no text or logo on screen").
`styleKey` only needs to be filled in for multi-style cards (the style key this demo corresponds to in the Gallery, i.e. that card's `styles[].key` in `gallery/api/library.json`; leave an empty string for single-style cards).

## 8. Delivery report (final reply, concise)

One line per demo: `<Stem>`: what was replaced / render OK / tsc OK / remaining issues. For multi-style cards, additionally list: the style keys that should be removed from the Gallery, and the style key each kept demo corresponds to.
The last line lists the paths of all changed files.
