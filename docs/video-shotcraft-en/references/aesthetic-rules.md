# Aesthetic Rules (Precedent-Based)

Source: precedents distilled from real-world rework on several promos (for the finished-video template see `template/`).

**How to use**:
- Each entry = rule (one actionable sentence) + precedent (the user's own words / the rework history) + self-check question; all three elements are required.
- During stage 7 acceptance in pipeline.md, **go through every entry one by one** and output a self-check report in the format: `ID ✓` or `ID ✗(location)` (location = shot name/frame number).
- Rules may be consciously violated (when the style requires it), but every violation must be written into that project's documentation (stating which rule was violated and why).
- Numbering system: R (rhythm) / Q (texture · camera · composition) / S (sound) / C (copy) / P (process); once published, numbers are never reordered; new entries are only appended.

## Contents

- Rhythm (R)
- Texture, camera movement and composition (Q)
- Sound (S)
- Copy (C)
- Process (P)

---

## Rhythm (R)

### R1. Key information must breathe after it lands; the brand wordmark holds for a full 1 second
Rule: elements carrying information (title cards / numbers / the full view of a grid) stay still for ≥1s after landing before cutting; breathing pauses are given preferentially to brand memory points (the moment the wordmark lands), not to ordinary content cards.
Precedent: User: "After the first title is typed out, hold for one second", "Not the first title card — I mean the animation where AI field lab appears at the beginning and end; extend the hold by 1 second after it appears." The pause was first put on the wrong target, reverted and redone; finalized as a full 1-second hold on each of the two wordmarks at the beginning and end.
Self-check: does every "frame you want the audience to remember" have a complete moment of stillness? Is the pause given to the brand/key information, or carelessly to an ordinary element?

### R2. A sense of speed comes from acceleration, not uniform fast motion; attach group motion to a physical metaphor, and leave a 0.5s pause at the end
Rule: fly-ins/scrolls always use non-linear easing + non-uniform staggering; uniform motion reads as a cheap PPT; entrances of many similar elements use a hard-accelerating "faster and faster" beat, ideally bound to a physical metaphor (e.g. dealing cards from a deck), and once the board is full, stay still for 0.5s before cutting to the next beat.
Precedent: User: "As the cards keep stacking downward, it should get faster and faster, the scroll speed should also get faster and faster, and pause for 0.5 seconds at the end", "The speed at the end still isn't fast enough... the cards automatically fly to their own positions in order, returning to place faster and faster." First made as an accelerating scroll + 0.5s pause, then changed to card-dealing-style hard acceleration — the abstract flood did not converge after five rounds; switching to the card-dealing metaphor passed in one round.
Self-check: is any element doing uniform linear motion? Does the batch entrance get faster and faster, and is there still breathing room at the end?

### R3. Rhythm: rather slow than fast — slow the first version down a notch by default, main action arc ≥3s, interaction demos at real human operating speed
Rule: the opening subject's action (focus → float → return, one complete arc) takes at least 3 seconds; simulated real interactions (typing, filtering, clicking) go at the speed a real person would operate, so the audience can follow along; when laying out the timeline, reserve hold/rest frame budgets — the first version is almost always too fast.
Precedent: all six independent pieces of feedback across the whole video pointed toward "slow down/linger"; there was never once reverse feedback of "too slow". User: "The first shot is still too fast, slow it down to 3 seconds", "The process of going into the search box, typing, and then filtering out the cards is too fast, slow it down a bit." The opening was slowed down several times to a 3s macro opening, and the interaction segment was changed into an unhurried type-and-filter.
Self-check: watch each shot as if for the first time: where couldn't you see clearly? Could you yourself follow along with the interaction segment?

### R4. Beat sync constrains timing, not amplitude: whole-frame beat impacts ≤3 in the whole video; by default only move the element layer
Rule: in strong-rhythm BGM videos, "cut points on the beat" does not equal "hitting the picture on every beat" — impacts acting on the whole frame/camera layer (whole-frame scale pumps / screen shake / flash frames / negative frames) are managed as big slams: ≤3 in the whole video, pinned to the strongest-hit list of music-beat-sync §2b, with ≥16 beats between any two adjacent ones; all other on-beat motion acts only on the hero element layer; beat-pump-type consecutive hits ≤4 beats per instance and ≤1 instance in the whole video. The kick hit table is a candidate pool, not a trigger. **The counting unit is one use of a technique/set-piece, not the number of internal sub-events**: one application of a card (paparazzi triple flash, trailer-bumper triple cut) counts as one slot; the burst structure and whole-video count limits noted on the card itself still apply, and are not counted again frame by frame because of this rule.
Precedent: User feedback (2026-08-22): "If music is given, the shots shake with the rhythm, which hurts the viewing experience" — the root cause was executing music-beat-sync's kick → impact mapping as a whole-frame pump on every beat: in a strong-drum track there is a kick on almost every beat, and being "hit" on every beat layered onto the camera layer is picture shake at beat frequency. Same family as Q3: Q3 bans noise-type shake (handheld), this rule bans beat-type shake.
Self-check: in a high-energy section, take any 8 consecutive beats and play back frame by frame: is the whole-frame scale/displacement pulsing on every beat? Count the impacts acting on the whole frame/camera layer in the whole video: more than 3? Does each match the strongest-hit list?

---

## Texture · Camera Movement · Composition (Q)

### Q1. Reproducing existing pages must use real screenshots; hand-built UI is limited to non-reproduction scenarios and must meet quality/expression standards; data is handled by its risk policy
Rule: for any shot showing an existing page of the product, the first step is to use a headless browser to capture the real page (full-page texture + element-level cutouts + coordinate json); do not hand-build simulated textures to reproduce it; non-reproduction scenarios (abstract openings / brand segments / standalone showcase components that don't exist on the page) allow hand-built UI, but quality (publication-grade texture, against the Q10 standard) and clarity of expression (the audience understands at a glance what it is) are hard thresholds; if they aren't met, go back to the screenshot route. Public demo data may be kept only after the product brief explicitly confirms it; customer, personal, internal, secret, live or other sensitive content must first be made fictional, anonymized or frozen. The same policy applies to hand-built assets.
Precedent: User: "What I want is to use the real pages and then add animation", "Don't use real data, make a fake one, don't mention customer names." Rebuilt using the real dashboard page; the hand-built texture reproduction made over a whole afternoon before was scrapped entirely. Revision (user ruling 2026-07-13): "It doesn't all have to come from real page screenshots; you can hand-build UI components, just make sure of the quality and clarity of expression" — the precedent's constraint was narrowed to "don't hand-build reproductions of existing pages".
Self-check: for each UI asset: is it reproducing an existing page? If so it must come from screenshots; can the texture and expression of hand-built pieces pass Q10-level scrutiny? Does the source data conform to the confirmed data policy, and contain no unauthorized customer, personal, internal or secret information?

### Q2. Under 3D perspective, rasterize UI textures at native size and then use them scaled down; when text is blurry, check the texture resolution chain first
Rule: UI textures in 3D scenes are natively rasterized at 2–4 times the display size and downsampled in 3D (magnification goes through layout-level CSS zoom rather than transform scale); when text is blurry, check the rasterization path first; don't touch camera/DoF first.
Precedent: The user pressed on it for three rounds: "The cards have obviously become blurry", "Still not high-definition enough... there are pixelated blocks", "The text clarity of the first shot still hasn't been solved." Adjusting DoF first only treated symptoms and didn't work; switching to native-size rasterization got real 4x sharpness, and finally extending CSS zoom to all 3D page layers fixed it at the root.
Self-check: in zoom/perspective shots, screenshot frame by frame and look at text edges: are there pixel blocks? Is the texture source resolution ≥ 2 times the display size?

Technique expansion (the former hires-rasterize-3d-text technique card is distilled here; reference implementation template/src/aifl/live/PageCam.tsx):
- **Root cause**: Chromium rasterizes 3D compositing layers at the 1920 layout width and then GPU-upscales them — content that is downsampled first and then upscaled is bound to blur, regardless of camera/depth-of-field parameters.
- **Solution**: magnification goes not through `transform: scale(zoom)` but through the CSS `zoom` property (layout-level scaling), so Chromium rasterizes at the magnified device size and downsamples from a high-resolution source. Coordinates must be converted by `Tx = 960/zoom − cx` to keep framing consistent with flat mode (PageCam.tsx:100-114 has the full derivation); missing the conversion shifts the focal point.
- **Companion measures**: full-page 2x (deviceScaleFactor: 2), separate 4x element-level screenshots for hero elements, and a 6f crossfade during the push-in to cover the lower-resolution page texture (if the fade-in is too long you'll see the two layers misaligned).
- **Troubleshooting order**: blurry text → first check the texture source resolution chain (screenshot scale → rasterization path → scaling method); only consider the camera last. DoF is only for atmosphere and is never a solution for sharpness (empirically ineffective). Verify by cropping and zooming frame-by-frame screenshots to look at text edges; looking at thumbnails by eye won't reveal it.

### Q3. Shots must be steady: product promos do not add handheld shake by default
Rule: handheld shake is banned in bright-scene UI promos; camera noise is used, at a very small value, only in dark-scene atmospheric videos explicitly pursuing a documentary feel, and you must self-check rendered frames to confirm there is no unintended shake.
Precedent: User: "The camera angle is bad, and there's a slight jitter, I don't know why." After removing the handheld shake and recomposing, there were zero complaints about shake; another dark-scene atmospheric video kept shake=0.02 without complaint — the applicable boundary was drawn from this (a presumed boundary).
Self-check: look at rendered frames shot by shot: is there any camera shake without narrative intent?

### Q4. Highlight/sweep effects: better none than bad — no mass application, at most once per shot for the hero, and must be clipped within the rounded-corner boundary
Rule: glint/bloom-sweep type effects are not applied en masse — batches of elements enter through the motion itself rather than by glowing one by one; retained light effects must be clipped by the carrying element's border-radius/overflow; light spilling over rounded corners is a typical source of cheapness. The light-effect technical path itself is not banned: a single sheen/bloom, given to the hero, with solid implementation quality, can be done; after doing it, ask yourself against the rendered frames "does it look good?" before handing it in.
Precedent: The user rejected it twice: "Not every card needs to flash", "Cancel the bloom-sweep effect when the cards appear, it doesn't look good." Accordingly the per-card glints were removed, the bloom sweep withdrawn, and the chip highlight sweep clipped inside the rounded-corner boundary. Clarification (user, 2026-07-13): the rejection targeted "the implemented version doesn't look good", which "does not mean this technical path/effect type is unworkable" — the mass-application ban and rounded-corner clipping remain, but bloom/sweep techniques may be retried with a higher implementation standard.
Self-check: count the glint/sweep occurrences in the whole video: do they exceed "once for the hero element"? Is every light effect clipped by rounded corners? For every remaining light effect, have you watched it played back at normal speed yourself and found it good-looking?

### Q5. The opening has only one hero: a single subject + a complete action arc beats a group dance
Rule: opening information should be sparse and focused — one hero element, one complete arc (spotlight → push in → float → outline light → return); multiple elements dancing together cannot carry a first impression.
Precedent: User: "The first shot only needs to focus on one card and give it more texture." The opening was torn down six times in one night; once the single-card structure was set, the structure was not touched again until the finished video.
Self-check: how many things in the opening shot "want the audience to look at them"? Is the hero's action arc complete (start - development - landing)?

### Q6. Camera angle serves readability: information-dense shots head-on, text close-ups level from the side, stylized tilts verified shot by shot
Rule: stylized camera angles are decided shot by shot — narrative/emotional shots may tilt, information-dense shots like lists/stacks stay head-on; close-ups of cards containing text use a level side angle, avoiding steep low/high angles that destroy text readability; applying one camera style globally across the board is forbidden.
Precedent: Making the whole video uniformly tilted was rejected by the user: "It's not done well... the changes to the content list page (in the template video, the paper list) are also bad, roll back," and the list page alone was then reverted to head-on; User: "Focus on one card... shoot from the left side rather than from below," changed to a left-side hero angle.
Self-check: for each tilted camera shot: what is the reason for the tilt? Is the text in the frame still readable at this angle?

### Q7. The four-piece object close-up: side tilt angle + perceptible height + orbit + contrasting dark material background
Rule: object/asset close-up shots give full play to the environment — a side tilted camera angle, stacking up to a perceptible volume/height, the camera orbiting the subject, a background of dark material contrasting with the main scene (e.g. brushed metal), then a synchronized pull-back to transition back to the main scene.
Precedent: User: "The camera should shoot tilted from the side, the stacked projects should have some height, and then the camera rotates around the stack. The whole scene should be a dark metallic-texture background. Then the camera pulls back, while the dashboard background appears." From the first version of the pile close-up orbit to the final — dark brushed metal background + a taller stack + orbiting camera move.
Self-check: does the close-up shot's subject have a sense of volume and environmental contrast? Is the camera locked off, or does it orbit/pull back?

### Q8. Make the ending a "launch event group photo": elements from the whole video fly in from all directions to surround the wordmark, pushing energy to the video's peak
Rule: the close of a multi-feature product uses a "family photo" structure — pick one representative element from each feature already shown to fly in from multiple directions and freeze; its scale matches the whole video's energy peak (crane camera move + stage lighting + particles); first-version endings are almost always too conservative, so step it up a notch by default.
Precedent: User: "The core elements of each page fly in from different directions... forming something like a group photo," "Add some more effects, animation, camera moves... like a product launch." From group-photo-style assembly to launch-event level — crane camera move, stage lighting, gold dust.
Self-check: is the ending the whole video's highest point of energy? Does every feature shown have a representative element in the group photo?

### Q9. The end point of a fly-in animation must be a real slot in the page layout; elements do not float above the page
Rule: after flying in, elements must "embed" into the page (return to a real grid slot, extend the scroll flow); floating above it without landing looks fake.
Precedent: User: "The list of research questions should fly in from the air and embed into the dashboard," "Don't let the 10 project cards float above it; instead keep scrolling down and line them up below, without overlapping." Accordingly the row elements were made to fly in and embed into the layout, and the grid was changed to extend with the scroll (a near whole-file rewrite).
Self-check: after each fly-in element lands, does it have real coordinates in the page layout? Is any element permanently floating above the page?

### Q10. Mock content in document-type shots must be publication-grade: native typography, text filling the space, the complete layout in frame
Rule: the audience will read every word on screen — mocks for document/report-type shots must use the product's native typography filled with fake content at real density, with layout elements like the sidebar/comment column fully in frame; a "sticker + slogan"-level fake document means reworking the whole shot.
Precedent: User: "The text of the weekly report content should match the current typography and style, just with mock content, text filling the space, and the left sidebar and right comment column fully shown" (in the template video this shot is the weekly report page). The first "sticker + slogan"-level fake document was redone for the whole shot; the final version is a full mock in native typography with both columns fully in frame.
Self-check: pause on any frame of the document shot: does the content read like the real thing? Is the layout (sidebar/comments/header) complete?

### Q11. Text meant to be read has a minimum effective glyph height: captions ≥5% of frame height, auxiliary text ≥3%; measured in final pixels, not fontSize
Rule: 1080p finished videos calibrate readability for phone/embedded small-window playback — shot narrative captions **effective glyph height ≥56px (≥5.2% of frame height, 60px tier recommended)**, auxiliary text such as subtitles/statistics/URLs ≥32px (≥3%); effective glyph height = fontSize × all ancestor scales × perspective compression (for 3D shots estimate with `cos(rotY)`); acceptance measures actual pixels on rendered frames, not the fontSize in code. Text has only two states: **"texture"** (decorative small text in screenshot cutouts, which must be clearly blurred/dimmed so the audience doesn't try to read it) or **"to be read"** (meets the size threshold + sufficient contrast, with a scrim/drop shadow when over a light background); there is no in-between state of "re-laid out but still unreadable" — text that can't be read is better deleted. The closing URL/call to action is the one line in the whole video that should least be small.
Precedent: User (2026-07-25): "In several of the shots, you can see the text it comes with is very small... the text in those shots is now too small, you simply can't see it." Reviewing the gallery intro video: S1/S2/S4 captions 38–40px (about 3.5% of frame height), S6 sub-line 30px, closing URL 25px, all below the line, and the subtitle in the S2 panel that was "re-laid out for readability" was given only 19px — re-laid out yet still not meeting the standard is the counterexample of the in-between state; after raising all six to the 60/40/34px tiers, the fix passed.
Self-check: take one frame from each shot with captions and shrink it to 480px wide (simulating a small phone window): is every line still readable? Measure frame by frame the actual pixel height of "to be read" text: captions ≥56px, auxiliary ≥32px? Is any block of text in the in-between state of "meant to be read but unreadable"?

---

## Sound (S)

### S1. Choose music and sound effects by "genre", not by "event": strong-drum electronic bed + cinematic SFX vocabulary; game sound pack timbres banned (ban the timbre, not the action)
Rule: product promo SFX vocabulary = whoosh (camera move) / impact (landing) / riser (build-up) / sparkle (light effect) / transition (transition); game sound pack timbres are banned; for BGM choose a strong-drum, strong-rhythm electronic bed (tech-house type); candidate tracks must be laid under the finished video for listening — you cannot judge the temperament by listening to the track alone.
Precedent: User: "This music and these sound effects are too much like a game. Find me something with strong drums and a strong sense of rhythm, and the sound effects should be the typical product promo video kind." Replaced the entire batch of Kenney CC0 game sounds introduced earlier with Mixkit tech-house + whoosh/impact/riser/sparkle; the BGM went through three drafts in 34 minutes before being finalized and kept.

**What is banned is the timbre, not the action** (easily misread; be sure to distinguish): what this rule rejects is the game sound pack **texture** such as "synth pluck/bloop, cartoon bounces, game-over scales", not "no sound for clicks". If the picture really has a click/toggle/shatter, it should get its foley — that is S4's requirement. Deciding question: does this sound like **the sound that real-world object makes** (shutter, mechanical switch, glass, paper), or like **a feedback prompt sound from a game engine**? Use the former, drop the latter.
- The template video itself uses `click-camera.mp3` and gives it the highest SFX loudness in the whole video, 0.6 — a real shutter sound, not a UI prompt sound.
- **`sfx/ui/` is not "approved as a whole directory"; it is precisely the category in the whole library that most needs auditioning one by one**: of its 18 files some are real object foley (`switch-light` `switch-tap` `switch-click-quick`, whose original Mixkit names are literally light switch), and more than half are synthesized UI feedback sounds (`ui-confirm-bleep` `ui-confirm-tone` `ui-notify-tech` `ui-success-soft` `ui-tone-quick` `ui-popup-dry` `ui-message-pop`, etc., original names tone/bleep/alert/notification) — **the latter are exactly the texture this rule excludes**, unless the video deliberately wants a "system prompt" narrative. The list and keep/drop decisions are in sound-design 3.3.
- `sfx/glass/` is real shattering material sound (4 files) and is not on the banned list.

Self-check: close your eyes and listen only to the audio track: does it sound like a product launch trailer, or like a mobile game? Was the BGM chosen after listening to it in the finished video? Is each UI-type sound effect a real object texture or a game feedback prompt sound?

### S2. Manage SFX pinned to frames beat by beat; for rapid-fire sound effects use two-sample alternation + stepped volume decrease + accelerating intervals, not repetition at the same loudness
Rule: SFX are centrally managed in a declarative table of "frame number + source + volume", each entry commented with its corresponding picture action, eliminating sound effects scattered by feel; when similar elements fire in succession, prevent the machine-gun effect with three tricks — two-sample alternation, stepping volume down along the sequence (e.g. 0.40→0.25 in six steps), intervals accelerating to follow the animation curve, and when it gets so dense it blurs together, let the sound fade out into a swoosh (this repo has empirically no playbackRate pitch shifting; anti-machine-gun doesn't rely on pitch shifting).
Precedent: User: "When each week appears in the left sidebar of the weekly report, you could change the sound effect, so it matches each week's appearance" (in the template video this is the weekly report page). First the beat-by-beat frame-pinned SFX frame number table structure was set up (kept until the finished video), then pluck two-sample alternation and interval acceleration 8→3f were done, and finally the per-week pop six-shot burst volume was made into a 0.40→0.25 stepped decrease.
Self-check: is every SFX pinned to a specific frame number and commented with its corresponding action? Do the rapid-fire segments sound like "a rhythm you can count" or mechanical repetition?

### S3. Do sound after the picture is locked; once the timeline moves, re-pin the whole SFX table
Rule: BGM/SFX are laid down after the picture structure is basically locked; for any change that alters shot duration/order, the wrap-up action always includes "realign SFX frame numbers across the whole table" — audio-picture misalignment is a must-check item before delivery.
Precedent: User: "After changing these, readjust the sound effect positions to match the new timeline." Accordingly the whole SFX table was re-pinned to the new timeline (total length 1085f); the chain of lessons: 11 hours after the first version of SFX was pinned, a major picture change forced re-pinning the whole table; of three re-pins, two were purely the knock-on cost of picture rework.
Self-check: did any shot duration/order change in this round? If so, has the SFX table been realigned entry by entry?

### S4. Foley takes priority over decorative sound: picture actions get the real sound of that action, and the audio is trimmed to exactly the length of the action
Rule: whatever action happens in the picture gets the corresponding sound (typing visuals get keyboard sounds, items dropping in one by one get individual pops); a generic swoosh can't cover distinctive picture actions; long samples are trimmed by picture segment (Sequence truncation), with duration exactly equal to the action.
Precedent: User: "When the weekly report page content appears, you could add a typing sound effect" (in the template video this is the weekly report page). Accordingly typewriter sound was added to the document page reveal, with keyboard.mp3 trimmed by context into two uses of 24f/44f.

Key operating points (the library's two special lists, see sound-design 4.1): **long samples >5s (21 of them) must be given an explicit `durationInFrames`**; if omitted they drag on past the end of the action; impacts with long reverb tails are the exception — let the tail decay naturally. **Quiet assets with peak <-12dB (7 of them)**: `volume` is a multiplier; giving 1.0 just plays it as-is, and it will still be buried by the BGM — the first choice is to swap the asset or pre-normalize; if necessary give gain >1 and verify the peak on the rendered output.

Self-check: does every distinctive picture action (typing/clicking/landing) have its own foley? Does any sound effect keep sounding after the action ends? Is every sound effect actually audible in the finished video (is the volume of quiet assets enough)?

### S5. Audio-picture alignment adds two offsets: measure the output audio track offset per render pipeline and subtract it uniformly; measure the source peak lag per file
Rule: the entire audio track of the rendered finished video has a fixed lag relative to the video; the root cause is in the output encoding/muxing chain (AAC encoder priming, typically 2048 samples at 48kHz ≈1.28f@30fps; tracked by Remotion in remotion-dev/remotion#7099), not in the behavior of `<Audio>`/`Sequence.from` — measure and record it per render pipeline (Remotion version + codec + sample rate + container) (extract the audio track from the rendered video and do normalized cross-correlation with the original files of 2–3 sharp SFX; it counts as measured accurately only if the residuals are consistent); subtract the compensation uniformly in the render layer's from formula, don't change frame numbers entry by entry; the source's own peak lag (peak not at the file head) is measured per file. Unified formula `from = target peak frame − peak lag − output offset`; for the method and boundaries (truncated-type sound effect windows are not lengthened; within the first 2f of the video it can't be fully compensated) see sound-design §4.6.
Precedent: AiflPromo measured a click lag of 2032 samples and an impact lag of 2066 samples (≈1.27–1.29f), matching the AAC priming fingerprint, and the rendered output's elst did not declare trimming of the padding head; in the promo-ink era 4f was measured (≈133ms, far beyond the priming magnitude, root cause not verified) — the constant cannot be carried across pipelines. Without compensation, the two combined made the heaviest hit 0.27s late, clearly reading as audio-picture out of sync; in beat-synced videos a difference of 2–3 frames is enough to make reasonable on-beat motion read as unprovoked shake (one of the causes of the 2026-08-22 user feedback).
Self-check: has this pipeline's output audio track offset been measured (where are the Remotion version/codec/sample rate/container recorded with the value)? Is the compensation subtracted uniformly in the from formula or scattered across individual frame numbers? For sources with an obvious attack peak, has the peak lag been measured?

---

## Copy (C)

### C1. After the picture is locked, rewrite the copy once against the final shots; pure animation segments also get narration
Rule: draft copy is only a placeholder — after the picture is finalized, rewrite shot by shot against the finished video; pure animation shots get short explanatory captions, leaving no "mute segments" (except the brand closing shot, which is kept clean).
Precedent: User: "Based on my current complete video content, rewrite the copy; I feel the current copy doesn't quite match the video picture, and also, shouldn't some narration be added to the animation parts?" Accordingly the title copy was rewritten and caption narration added to the live-footage shots.
Self-check: compare sentence by sentence: does each line of copy match the picture it's in? Is there any animation segment longer than 3 seconds without narration?

### C2. Taglines are written as "team + product feature name + concrete benefit"; abstract metaphor words are always made concrete
Rule: taglines should be concrete and include product feature names (Paper Radar / weekly report), avoiding abstract metaphor words (generic slogans of the board/place kind); add a lead-in title card before important features appear.
Precedent: The user edited the draft word by word: "Change 'All your research, one board' to 'All team's research, one place to go'... change the 'The morning reading' line to 'Paper Radar, tailored for your morning reading'"; "Before the final document page is shown, there should also be a text frame" (in the template video this is the weekly report page). Accordingly the three lines were replaced word by word, and a document page lead-in title card was added.
Self-check: does each tagline have a concrete feature name/benefit word? Are there any sentences propped up only by metaphor?

### C3. Annotation text in 3D shots lives in the same 3D space: page-space, same perspective, angled shot, large type + highlighter highlight
Rule: when adding in-frame annotations to a subject in a 3D scene, the text must enter the same 3D space (page coordinate system, the same camera perspective, translateZ float + cast shadow); flat overlaid text is disconnected from the scene; styling uses large serif type + marker highlight on keywords.
Precedent: User: "The text on the left, bigger to stand out, with a highlight, and the text's perspective is also 3D floating, and shot at an angle" (redone after the first flat title card was rejected). Changed to put the hero-hover annotation into 3D — angled view in the page coordinate system, marker highlight.
Self-check: for each block of text in a 3D shot: does it move with the scene camera, or is it stuck to the screen glass?

---

## Process (P)

### P1. Before delivery you must render, take frames and check them one by one yourself; don't hand the first review to the user
Rule: after each round of changes, first render key frame screenshots yourself and check them one by one (composition / shake / text sharpness / continuity errors); if necessary, prove it with pixel-level tools (crop-and-zoom / two-frame diff), then hand it to the user.
Precedent: The first time the user watched the video they demanded: "Did you check the quality with screenshots yourself? The camera angle is bad, and there's a slight jitter, I don't know why." After that, crop/diff/measure self-check scripts and per-version still archiving in out/qa/ grew into the pipeline, and both sides moved into frame-based review.
Self-check: before handing over this version, which frames have I looked at myself? Is there screenshot evidence for the key shots?

### P2. First break reference material down frame by frame into a technique list, then judge suitability shot by shot; do not apply it globally
Rule: if there is a reference video, first extract frames and do a motion breakdown (a list of how each animation/transition/effect is implemented) and write it into the spec, then keep or drop by project suitability; image references describe the feel of "a certain kind of shot", not a style order for the whole video — before implementing, judge shot by shot whether it applies, and self-check after changes before handing in.
Precedent: User: "Extract as many frames as possible from the original video... reproduce them and then adapt them to our project; don't force-fit what doesn't suit" — after writing the reference video's motion breakdown into the spec, it was released continuously; counterexample: three reference images were globally applied as a uniform tilted camera angle, rejected with "It's not done well... roll back," and then redone shot by shot.
Self-check: does each technique in the reference material have an explicit "adopt/drop" decision? Has a single reference image been treated as a style order for the whole video?

### P3. For feedback with ambiguous references, confirm the target first; if you change the wrong thing, revert the whole commit cleanly; don't patch on top of the wrong version
Rule: for vague feedback like "the first title", confirm what's meant before acting; if the wrong target was changed, immediately revert the whole commit and redo it; keep each change as an independent commit so it can be rolled back cleanly.
Precedent: User: "Not the first title card — I mean the animation where AI field lab appears at the beginning and end." It was first misunderstood and card1 was held; within 8 minutes it was cleanly reverted, then redone on the correct target and passed.
Self-check: am I sure what this feedback refers to? If the current commit granularity goes wrong, can it be rolled back in one step?

### P4. First list the feature inventory and map each to a shot; one animation technique is the star only once in the whole video; repeated shots/information are always deleted
Rule: before shooting, list the product feature inventory (dashboard / details / papers / weekly report / brand) and map each to a shot; missing a core feature means rework; one technique (fly-in/stacking/page-turn) is the star only once in the whole video; editing self-check filters by "what new information does this shot give"; the same asset/information appears only once in the whole video; repetition means deletion.
Precedent: User: "Some of the other animations are homogeneous. They don't fully show the features of the whole website," "Very good, but there's no showcase of the weekly report part?" (in the template video this is the weekly report page) — accordingly feature shots were added; "The second-to-last shot is a repeated project card shot, it can be removed" — accordingly the repeated overview shot was deleted and the closing tagline de-duplicated.
Self-check: does every item in the feature inventory have a corresponding shot? Are there two shots using the same technique as the star, or telling the same thing?
