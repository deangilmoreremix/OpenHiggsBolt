# The Multi-Step Production Pipeline, part 2

> **Time:** about 15 minutes. **You will finish with:** an edited, spec-checked export from your locked script and logged audio.

---

## Before you start

Part 1 gave you folders, a locked script and a trimmed voiceover. Now you run the last stations: visuals, edit and polish, and the specs check. Exports are checked against strict parameters before delivery so you avoid revision loops.

You will need your part 1 batch folder, an editor (CapCut is the agency standard), and access to the SmartVideo GO AI **Image Studio** and **Video Studio** (the worked example used `nano-banana-2` for images and `seedance-2` for clips).

## Step by step

### 1. Generate the visuals before editing

Using your logged audio duration, generate or download background visuals to cover it. The example made 4 widescreen background clips. Keep them in `03_assets/` in a subfolder per video number. Do not open the editor yet.

**You should see:** enough clips to cover the audio length, sorted in subfolders.

**If not:** if a clip is off-style, regenerate it now; changing visuals after editing breaks the one-way flow.

### 2. Import everything into the editor

Open your editor, import the audio and visuals, and save the project in `04_edit/`.

**You should see:** the audio on the timeline with your clips ready to place.

**If not:** if files are missing, relink from `02_audio/` and `03_assets/`.

### 3. Cut visuals to the audio

Cut the visual clips to the exact audio milestones.

**You should see:** visuals changing in time with the narration.

**If not:** if cuts feel late, nudge them to the start of the spoken phrase.

### 4. Polish: captions and color

Apply a text caption template and a LUT color profile.

**You should see:** readable captions and a consistent look across clips.

**If not:** if captions are hard to read, raise contrast before exporting.

### 5. Run the specs check

Open [`templates/asset-specs-checklist.md`](templates/asset-specs-checklist.md) and verify:

* Aspect ratio is correct (`9:16` for vertical, `16:9` for widescreen).
* Peak audio volume sits at **-3dB** to **-1dB**.
* The file name contains the primary target keyword.

**You should see:** every checklist line passing.

**If not:** fix the failing item in the editor and re-run the check.

### 6. Export to 05_exports

Export the master (the example used H.264 settings) into `05_exports/`.

**You should see:** a finished file in `05_exports/` with the keyword in its name.

**If not:** if the export is the wrong shape, recheck the project aspect ratio.

## Check yourself

* [ ] I generated all visuals before opening the editor.
* [ ] Cuts match the audio milestones.
* [ ] Aspect ratio, peak audio (-3dB to -1dB) and file name passed the checklist.
* [ ] My export sits in `05_exports/`.

## Common mistakes

* Moving backward: generating new visuals after editing starts.
* Exporting before the specs check.
* Forgetting the target keyword in the file name.

## Go further

Compare your actual minutes per station against the worked example (31 minutes total). Use [`templates/pipeline-flowchart-template.md`](templates/pipeline-flowchart-template.md) to record yours and find the slowest station.

Next: Building a TikTok/Reels Factory.
