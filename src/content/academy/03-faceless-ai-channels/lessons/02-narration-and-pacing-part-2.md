# Duration-Matched Narration & Pacing, part 2

> **Time:** about 14 minutes. **You will finish with:** a timeline where narration runs gap-free on A1 and every visual cut lands on an audio boundary.

---

## Before you start

The audio track is the spine of the timeline. Once your narration is generated and logged (part 1), you assemble in a fixed order: audio first, then visuals cut to the audio boundaries. This is what removes dead air and resets the viewer's attention at each cut.

You will need: your numbered audio files, your filled-in [`templates/narration-duration-log.md`](templates/narration-duration-log.md), the visuals you planned (generated clips or stills, for example from SmartVideo GO AI's Video Studio and Image Studio), and an editor such as CapCut or Premiere.

## Step by step

### 1. Set up a clean project folder

Create this structure on your computer:

```text
[project-folder]/
├── audio/          # Narrations and voiceovers
├── visuals/        # Generated b-roll and graphics
├── project_files/  # Saved CapCut/Premiere project
└── exports/        # Completed renders
```

**You should see:** four empty folders; put your audio files in `audio/`.

**If not:** any equivalent folder layout works; just keep audio, visuals and exports separate.

### 2. Batch-generate the visuals

With the log open, generate all the backgrounds in one session and save them in `visuals/`. Doing audio first, then all visuals, keeps you in one mindset at a time.

**You should see:** one visual per logged line, each at least as long as its audio line.

**If not:** if a generated clip is shorter than its line, plan to slow it slightly or choose a still with a zoom instead.

### 3. Lay the narration on track A1

Place all narration files back-to-back on audio track A1. Trim blank noise or silence at the start and end of each clip so the voice flows without gaps.

**You should see:** a continuous voice line with no gaps and a total length close to your sum of logged durations.

**If not:** if there are small gaps, nudge each clip left until it touches the previous one.

### 4. Place visuals on V1 and cut to the audio

Put each visual on video track V1 and cut it exactly to the audio file boundaries. Trim extra frames from clips (a 5.0 s clip for a 4.2 s line loses its last 0.8 s). Stretch stills to the full line length.

**You should see:** each visual changing at the exact moment the narrator finishes a line.

**If not:** zoom into the timeline and snap clip edges to the audio edges.

### 5. Add subtle motion to stills

Add a slow scale animation (about a 10% zoom-in) or a pan to static images so the screen stays dynamic.

**You should see:** gentle movement on every still, and a visual change every 2.5-4.0 seconds.

**If not:** if the zoom feels distracting, reduce it; it should be barely noticeable.

### 6. Play it back and export a draft

Watch the whole timeline once, then export to `exports/`.

**You should see:** narration that feels natural, with no dead air and no rushed lines.

**If not:** if a line sounds rushed, the visual needs to be longer, not the audio faster; regenerate the line, update the log and re-cut.

## Check yourself

* [ ] The narration sits back-to-back on A1 with no silences at clip edges.
* [ ] Every visual cut matches an audio boundary.
* [ ] No visual stays on screen longer than about 4 seconds.
* [ ] I exported a draft into `exports/`.

## Common mistakes

* Leaving trailing pauses and silent frames, which break the pacing.
* Cutting visuals by eye instead of snapping to the audio.
* Editing before the audio is locked.

## Go further

**Exercise.** Take your 6-line script from part 1 and assemble all six visuals to their clips to the frame.

**Compare tools.** For a single channel, manual editing in CapCut is the fastest way to good pacing. For a network of 5+ channels, a programmatic pipeline like `AI-Youtube-Shorts-Generator` saves editing hours.

Next: Honest RPM & Earnings Math.
