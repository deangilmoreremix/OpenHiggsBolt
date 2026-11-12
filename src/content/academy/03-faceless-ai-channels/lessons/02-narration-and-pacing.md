# Duration-Matched Narration & Pacing

> **Time:** about 14 minutes. **You will finish with:** a numbered set of narration audio files and a duration log with a visual plan matched to each line.

---

## Before you start

Visuals tell the story, but the audio duration controls the edit. If you make b-roll first and fit a voiceover to it, the narrator has to rush or pause awkwardly. Instead use Narration-First Assembly: Script Text, Voice Generation, Duration Logging, Video Clipping/Gen, Timeline Sync. At about 150 words per minute each word takes roughly 0.4 seconds, so a 10-word sentence needs a 4-second clip, and short-form needs a visual change every 2.5 to 4.0 seconds.

You will need: the finished script from Niche Selection & Script Pipeline, a text-to-speech tool (for example ElevenLabs), and [`templates/narration-duration-log.md`](templates/narration-duration-log.md). In SmartVideo GO AI, the Audio studio can generate the voice. This part covers audio and planning; part 2 assembles the timeline.

## Step by step

### 1. Split the script into lines

Divide your script into individual sentences or short thought blocks. Aim for each to be roughly 10 words or fewer so it fits one visual.

**You should see:** a numbered list of short lines.

**If not:** split any line longer than one breath at its natural pause.

### 2. Generate the narration for each line

Batch-generate the lines with a premium TTS model (for example ElevenLabs). Save each file with a sequential number, such as `01_hook.mp3` and `02_problem.mp3`.

**You should see:** one audio file per line, named in order.

**If not:** if a voice sounds rushed or flat, regenerate just that line; do not stretch the audio.

### 3. Measure each duration

Import the files into your editor or a utility script and read each file's duration to one decimal place. For example, `01_hook.mp3` = 4.2 seconds.

**You should see:** a number like 4.2 for every file.

**If not:** if your tool shows only whole seconds, switch to the editor's clip properties or timeline readout.

### 4. Log the durations

Open [`templates/narration-duration-log.md`](templates/narration-duration-log.md) and enter each file name and its duration.

**You should see:** a complete log with one row per audio file.

**If not:** copy the template into your own document if you cannot edit it in place.

### 5. Plan the visual for each line

Next to each logged line, note the visual needed. A 4.2-second line needs a visual that shows for exactly 4.2 seconds. Generated video usually comes in 4- or 5-second clips, so plan to trim the extra frames.

**You should see:** every row of the log has a visual idea and a duration.

**If not:** if a line is under about 2.5 seconds or over 4.0, merge it with a neighbour or split it so visuals change every 2.5-4.0 seconds.

## Check yourself

* [ ] My audio files are numbered in script order.
* [ ] Every duration is logged to one decimal place.
* [ ] Every line has a planned visual.
* [ ] No visual would stay on screen longer than about 4 seconds.

## Common mistakes

* Generating video first and fitting the voice to it.
* Logging rounded durations. The cut should land on the end of the voice file.
* Forgetting that video clips are 4-5 seconds, so they need trimming.

## Go further

**Worked example: "Automate Smarter", first 10 seconds.** `01_hook.mp3` is 4.2 s and `02_problem.mp3` is 3.8 s. Visual 1 (0:00-0:04.2) is a generated clip of a person typing, 5.0 s long, with the last 0.8 s cut. Visual 2 (0:04.2-0:08.0) is a still of a calculator with an error screen stretched to 3.8 s.

<p align="center">
<img src="templates/examples/faceless-anchor.jpg" alt="Narration Visual Anchor" width="240">
<img src="templates/examples/faceless-clip.gif" alt="Narration-Synced Video Loop (I2V)" width="240">
</p>

Video file: [templates/examples/faceless-clip.mp4](templates/examples/faceless-clip.mp4). In SmartVideo GO AI use Image Studio for the anchor and Video Studio for image-to-video motion.

**Exercises.** Easy: generate a 10-second voiceover, log its duration. Medium: split a 30-second script into 6 sentences, generate and log the clips, and plan 6 matching visuals. Hard: set up the [`AI-Youtube-Shorts-Generator`](https://github.com/Anil-matcha/awesome-generative-ai-apps/tree/main/video_generation/AI-Youtube-Shorts-Generator) app locally with your API key and generate a vertical video from a text prompt.

**Compare tools.** Manual NLE (CapCut/Premiere): low effort, best for single channels. Programmatic automation (`AI-Youtube-Shorts-Generator`): high setup effort (repository and Python dependencies), best for 5+ channels. ElevenLabs API via muapi: best conversational pacing and multi-voice dialogue.

**Template.** [`templates/narration-duration-log.md`](templates/narration-duration-log.md).

Next: Duration-Matched Narration & Pacing, part 2.
