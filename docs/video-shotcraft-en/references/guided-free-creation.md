# guided-free-creation — Co-creation Guided Workflow

Co-creation mode is for when the user wants to take part in the key business and creative decisions of the product short. It hands the product brief,
requirement decisions, visual direction, shot mapping and final storyboard to the user for confirmation, and hands the video engineering details to the
Agent to execute. Autonomous free creation does not read this file, nor does it use the stage-by-stage confirmation checkpoints here.

## Contents

- Product brief and safe asset pre-check
- Requirement-to-execution decision table
- Visual direction and styleframe
- Feature-to-shot mapping
- Gallery shot name resolution
- Storyboard confirmation and production release

## 1. Product brief

First do a read-only inspection of the project: do not write video code, do not modify the business project, do not capture or export sensitive content. Check the tech stack,
entry points, startup commands, page routes, main components, interaction states, APIs, page copy, CSS visual tokens,
external dependencies and data risks, and judge which features can be clearly expressed through real page states.

Output a product brief table filled in first by the Agent. Every row must first give a judgment or recommendation,
then state the evidence; do not hand all the fields to the user to fill in as-is.

```text
Current stage: Product understanding

| Item | Agent's judgment or recommendation | Evidence |
|---|---|---|
| Project positioning |  |  |
| Target users |  |  |
| Video purpose |  |  |
| Core selling points |  |  |
| Features that must be shown |  |  |
| Available pages/states |  |  |
| First-screen claim |  |  |
| Expected duration/aspect ratio/language |  |  |
| Music/voiceover |  |  |
| Data compliance policy |  |  |
| Visual cues |  |  |

Needs confirmation:
1. List only items that cannot be determined from the project or the user's existing description.
2. For items that can be recommended but still need the user's decision, first write "recommended option + evidence", then ask here.
```

Filling rules:

- Whatever can be determined from the README, source code, routes, page states, copy or computed styles, fill in directly with the
  judgment and evidence, without asking;
- Whatever cannot be fully determined but can be reasonably recommended based on the project, fill in a dynamic recommendation, the reasoning, and the options needing the user's
  decision;
- Whatever cannot be judged at all, write explicitly "cannot be judged from the current materials", and put it only in the questions below;
- Each round follow up with only 1–3 questions that most affect the video outcome; do not show a "confidence" field;
- Recommendations must come from the currently uploaded project or pages; fixed answers must not be used.

After the user confirms the brief, first do one **temporary safe asset pre-check** according to the data policy: only capture the small number of page screenshots or tokens needed to make the
styleframe; do not do full slicing, full export or final asset ingestion.
Public demo data may be kept only after the brief explicitly confirms it; customer, personal, internal, secret, live or other
sensitive data must first be replaced, anonymized or frozen. Do not ask again about information already explicitly provided.

## 2. Requirement-to-execution decision table

Write the confirmed user requirements, project evidence and the Agent's execution choices into one traceable table. It is not
a fixed "audience → style" rule table: each row must state the evidence brought by the current project and the user's materials,
and the Agent is allowed to propose recommendations that differ from common formulas.

```text
Current stage: From requirements to production decisions

| Confirmed requirement | Project/user evidence | Affected execution scope | Agent recommendation | Items needing confirmation |
|---|---|---|---|---|
| Video purpose |  | Narrative structure, information volume, CTA |  |  |
| Target audience and their context |  | Scenes, language, rhythm, feature priority |  |  |
| Core selling points and features that must be shown |  | Page states, shots, copy |  |  |
| Duration/aspect ratio/language |  | Number of shots, caption density, composition |  |  |
| Music/voiceover |  | Rhythm, pauses, SFX headroom |  |  |
| Data compliance policy |  | Capture, mock, redaction, final review |  |  |
| Visual direction |  | Tokens, materials, transition tone |  |  |
```

The table records only items that have an actual impact on the current video. Items that cannot be determined stay in "Items needing confirmation",
with only 1–3 asked in total per round; already confirmed items must not be asked again. The subsequent visual direction, shot mapping,
storyboard, asset capture, sound design and final review must all be traceable back to this table, and it is saved in the design spec.

## 3. Visual direction

Extract fonts, palette, corner radii, information density, light quality and motion
personality from the pages, source code or computed styles. The visual direction is confirmed in two rounds:

1. First give at most 3 text directions generated from the current project. Each direction states: name, a one-sentence
   visual claim, 3–5 keywords, fonts/colors/materials, camera-motion personality, why it fits, and trade-offs.
   List Ink Press as a candidate only when the product genuinely suits a paper, editorial or narrative texture; it must not
   be added as a fixed option just because it is in the repo.
2. The user picks 1–2 shortlisted directions, or explicitly authorizes the Agent to choose. For the shortlisted directions make an actual pure
   HTML/CSS styleframe comparison page: each direction shows 2–3 static 1920×1080
   key frames (e.g. brand opening, core feature, brand close), using the current product's real
   page assets or extracted visual tokens; do not write Remotion code, do not render a complete video.
3. Use Playwright/Puppeteer to capture the styleframe comparison images, showing side by side the directions' fonts, palette,
   materials, composition, light quality and information density. Only after the user confirms the final direction can you move on to feature-to-shot mapping.

The styleframe is for confirming the static visual language; it cannot on its own prove easing, camera-move speed or rhythm; these still need to be
judged together with the motion tokens and Gallery reference samples. If motion differences can't be judged from text and samples, then do
a short motion test. When the user has already provided strict brand guidelines, an explicit reference video, directly selected Ink Press, or
explicitly authorized the Agent to choose and skip visual confirmation, the styleframe comparison may be skipped after recording the reason.

## 4. Feature-to-shot mapping

First list the product features, then scan the purpose, energy, suggested
duration and limitations in the frontmatter of each card in `references/shots/`. For each feature that must be shown, recommend a preferred and a fallback shot:

| Feature | Preferred shot | Fallback shot | What the picture should express | Required page state |
|---|---|---|---|---|

The user can accept, replace, delete, or authorize the Agent to choose. Once the mapping is set, you must read the selected cards in full,
and locate the exact demo source code via their "Reference implementation"; when no suitable shot exists you may write new code, but you must explain the scope of the new code
and the verification risks. Styles marked by the Gallery as "reference only, requires custom implementation" are not recommended by default; custom implementation is allowed only after the user explicitly
names them, and the risk is written into the design spec.

This mapping table is not a complete storyboard; production must not start directly after the user confirms the mapping. It only determines "which
product feature uses which shot grammar"; afterward you must still proceed to section 5, and expand the shot order, durations,
page states, concrete actions, assets, captions, transitions and sound.

## 5. Gallery shot name resolution

The Gallery (https://vincentwei1021.github.io/video-shotcraft/) is only the interface for users to browse and pick
motion samples; shot definitions and implementation source code are already contained in this repo. Users don't need to describe the animation;
they only need to copy and provide the shot name.

After receiving a shot name, handle it in the following order:

1. Read `gallery/api/library.json`, validate `card-name` with its `cards[].name`,
   and validate `style-key` with that card's `styles[].key`; do not substitute fuzzy guessing for index validation;
2. Use the `source` in the index to locate and read `references/shots/*.md` in full;
3. Following the explicit path in the card's "Reference implementation", resolve the specific style to the exact demo TSX; if the document only gives the
   demo directory, read the directory's files and determine the corresponding file from export names, comments and style semantics;
4. Resolve `styles[].media.url` in the index to the reference sample (if local `gallery/media/`
   has no mp4, first run `gallery/fetch-media.sh` to pull from the release, or use the corresponding link in the online
   Gallery directly), and record in the design spec: card name, style-key, card document,
   exact demo TSX, reference sample;
5. If the card needs common components, then read and copy the corresponding files from `assets/lib/`;
6. Keep the already tuned easing, timing ratios, mask timing and "Known pitfalls / critical points" parameters in the demo;
7. Replace only the target product's screenshots, layout coordinates, copy, brand tokens and necessary composition parameters.

The Gallery may copy out two forms:

```text
spotlight-hero-card
shot-transitions · whip-pan
```

- Card name only: use the card's default variant; if multiple variants of the same card differ noticeably in expression, the Agent first recommends a specific variant based on
  the surrounding shots and the product's temperament, explains why, and if necessary lets the user confirm.
- `card name · style name`: prefer the specific variant the user named, read the corresponding implementation, and don't switch styles on your own.
- Name does not exist: report that it can't be matched, and give the closest real card name in the repo; do not invent from the name.
- Index marked "reference only, requires custom implementation": do not proactively recommend; after the user explicitly names it, state clearly that
  this style has no reusable complete implementation, build it from the recipe parameters and the reference sample, and write the implementation risk into the design spec.
- Index marked "missing preview": the exact source code can be read and used for production, but you must not claim it has been compared against a motion sample.

It is strictly forbidden to write a new approximate animation based only on the meaning of the card name. The card file provides semantics; the demo source code is the truth of the
parameters. After the user selects multiple shots, map them to product features, then go on to generate the complete storyboard.

## 6. Storyboard confirmation

Combine the confirmed features and shots into a storyboard, containing at least:

```text
| # | Time/frames | Feature information | Shot card | Main action | Asset source | Caption/SFX |
```

Check that each shot tells only one main motion, the brand wordmark holds for at least 1 second, batch motion ends with at least
0.5 seconds of stillness, and avoid repeated taglines or letting the same motion be the star repeatedly. After the user confirms the storyboard and the final design spec,
the two together constitute the **production release**: do not reopen previously confirmed business or creative questions, only fill in open items necessary
for implementation. Only now do the final full asset capture (full-page 2x screenshots, element slices, layout.json),
convert the approved storyboard into a frame-level timeline, and then move on to `pipeline.md` stage 4 final asset capture, stage 5
shot-by-shot implementation, stage 6 sound design and stage 7 final review.

Save the user-confirmed product brief, requirement-to-execution decision table, visual direction/tokens, styleframe or reason for skipping it,
feature-to-shot mapping, Gallery card names and specific variants, final storyboard and data compliance policy as a stable design spec
(or provide it in full at the final review handoff), as the review baseline for `final-review.md`. Do not make the independent
review Agent rely on scattered chat records to guess what the user confirmed.

## Default and skip rules

When the user authorizes the Agent to decide everything, it must still derive dynamically from the product content: generate directions from the visual tokens,
choose shots from the core features and page states, recommend duration/aspect ratio/
language from the publishing channel, number of features and reading density, and recommend music from brand energy and rhythm. Only when neither the project nor the user's description has relevant clues
use 30–38 seconds, 1920×1080 as the fallback. The data policy is decided by project risk: public demo data can be kept as-is,
customer, personal or internal data are switched to fictional/anonymized content. Before the first whole-video render, the storyboard must still be submitted for the record, unless
the user explicitly asks not to see intermediate artifacts.

## Per-round reply format

```text
Current stage:
Confirmed:
Needs confirmation this round:
Deliverable after confirmation:
```
