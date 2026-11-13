# The Multi-Step Production Pipeline

> **Time:** about 15 minutes. **You will finish with:** a factory folder set up, a locked script, and a logged voiceover, ready for the visuals in part 2.

---

## Before you start

A single 60-second video can eat an afternoon when you jump between writing, images, voice and editing. At $50 per video and 4 hours of work, you earn $12.50 an hour. A factory fixes this by splitting the work into stations where assets only move forward: Idea, Script, Voiceover, Visuals, Assembly, Polish, Schedule. You never edit a script after the voiceover exists, and never generate visuals after editing starts.

You will need a folder on your computer, a video idea, and a voice tool (the worked example used ElevenLabs). In SmartVideo GO AI you can use the **Storyboard / Campaign Planner** for scripts and batch briefs. Part 2 covers visuals, editing and export.

## Step by step

### 1. Create the factory folders

On your hard drive, create this structure:

```text
[Factory_Batch_01]/
├── 01_scripts/     # Locked script drafts
├── 02_audio/       # Voiceover narrations (.mp3/.wav)
├── 03_assets/      # Visual clips, overlays, and screens
├── 04_edit/        # Timeline project files (CapCut/Premiere)
└── 05_exports/     # Completed masters checked against specs
```

**You should see:** five numbered folders inside one batch folder.

**If not:** if your system sorts them oddly, keep the number prefixes exactly; they enforce the order.

### 2. Pick one idea and write the script

Choose one angle (the worked example used "How physical grocery stores use AI cameras to count inventory"). Draft a script under 180 words for short-form, following a hook structure. Save it in `01_scripts/`.

**You should see:** a script file under 180 words (the worked example was 140).

**If not:** if it runs over, cut the weakest sentences rather than speeding up the voice.

### 3. Lock the script

Read it once, fix it, then call it locked. From now on, no script changes after voiceover is generated.

**You should see:** a final script you will not touch again.

**If not:** if you want to change it later, delete the voiceover and redo this station; do not patch backward.

### 4. Generate the voiceover

Feed the locked script into your voice tool (the example used a warm narration voice profile). Save the file in `02_audio/`.

**You should see:** one audio file for the script, in `.mp3` or `.wav`.

**If not:** if the tool rejects the length, check the script is within your plan's limit.

### 5. Cut silences and log the duration

Cut starting and trailing silence from the audio. Write the final duration in your narration log (a simple note or the pipeline template: [`templates/pipeline-flowchart-template.md`](templates/pipeline-flowchart-template.md)).

**You should see:** a trimmed file and a duration logged next to its name.

**If not:** if you cannot tell where silence ends, zoom the waveform in your editor until the speech edge is clear.

## Check yourself

* [ ] My folders mirror the five stations.
* [ ] My script is under 180 words and locked.
* [ ] My voiceover is trimmed and its duration is logged.
* [ ] I know the one-way flow: Idea, Script, Voiceover, Visuals, Assembly, Polish, Schedule.

## Common mistakes

* Editing the script after voiceover exists.
* Opening the video editor before audio and visuals are finished.
* Skipping the duration log, which you need to time visuals.

## Go further

**Worked example, "AI in Retail" explainer (widescreen):** Idea 2 min, Script 140 words 6 min, Voice 3 min, Visuals 8 min (4 widescreen clips with `nano-banana-2` and `seedance-2`), Edit and polish 10 min, Export check 2 min. Total: **31 minutes** from blank page to finished export.

**Compare tools:** Manual CapCut editing is medium speed (about 30 mins/video) with high quality, best for client work. Programmatic rendering (`AI-Youtube-Shorts-Generator`) is fast (about 5 mins/video) with medium quality, best for faceless channels. Premiere/DaVinci is slow (60+ mins/video) with ultra-high quality. CapCut is the agency standard; past 3 channels, consider programmatic generators.

**Monetize:** a Pipeline Audit Service (audit a business's workflow and design a flowchart for **$500-$1,000**), or hire freelance assistants to run single stations while you keep scripting and editing.

**Exercises:** Easy: set up the folder structure with mock files. Medium: write your current workflow and rewrite it as strictly one-way. Hard: build a 60-second video with a stopwatch, time each of the 6 stations, and plan to fix the slowest.

**Templates:** [`templates/pipeline-flowchart-template.md`](templates/pipeline-flowchart-template.md), [`templates/asset-specs-checklist.md`](templates/asset-specs-checklist.md).

Next: The Multi-Step Production Pipeline, part 2.
