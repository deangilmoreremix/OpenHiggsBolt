# Assembling a Short Film

> **Time:** about 15 minutes. **You will finish with:** your clips cut together on a timeline, with a narration track and a continuous ambience track.

---

## Before you start

Raw silent clips played back to back feel jarring: one has a green tint, the next a warm yellow, motion speeds differ, and the silence reveals the artificial footage. The film is made in the editor. Because AI clips are silent, you build sound from scratch in a hierarchy: **dialogue/narration**, **ambience/room tone**, **Foley/SFX** and **music**. This part covers the cuts, narration and ambience; part 2 adds Foley, music, the color grade and export. You will need your clips from lesson 3 (Camera Movement & Cinematography Prompts), your script from lesson 1, an NLE (non-linear editor, a program that arranges and cuts clips on a timeline) such as DaVinci Resolve, Premiere Pro or CapCut, a text-to-speech or voice tool such as ElevenLabs, and the checklist [`templates/sound-design-checklist.md`](templates/sound-design-checklist.md). SmartVideo GO AI's **Audio** and **Lip-Sync Studio** can also produce voice; follow the current screen.

## Step by step

### 1. Lay out the clips on V1

Import your generated clips into your editor and place them in order on the main video track (V1). Trim glitches at the very start or end of a clip, because models often dissolve or warp in the final half-second.

**You should see:** your shots in order on V1, with clean first and last frames.

**If not:** if a clip warps at the end, trim a few frames more or re-render that shot.

### 2. Generate the voiceover

In ElevenLabs or another high-quality TTS or voice tool, paste your script lines from lesson 1. Add line breaks or punctuation (commas, ellipses) to force natural pauses. Download the audio.

**You should see:** an audio file where the pauses sound natural.

**If not:** if the voice rushes, add more commas or ellipses, or shorten the line.

### 3. Place the narration on A1

Import the audio onto track A1 and sync the start of each line with the character's visual entrance (in the worked example, the voice line begins at 0:05). Settings used there: centered mono channel, volume -3dB.

**You should see:** narration lined up with the right shots.

**If not:** if it drifts, nudge the audio clip, or trim the picture length to match the line.

### 4. Add the ambient soundscape on A2

Find or generate a continuous background track that matches your brief (for example a spaceship drone or rain). Place it on A2, fade it in at the first frame and let it run continuously under all the cuts, which unifies them. The worked example used volume -18dB.

**You should see:** a sound bed that never drops out between shots.

**If not:** if you hear a gap at a cut, extend the ambience clip across the whole timeline.

## Check yourself

* [ ] My clips are ordered and trimmed on V1.
* [ ] The narration is on A1 and starts at the right moment.
* [ ] One ambience track runs under the whole timeline.
* [ ] I know what Foley, music and grade come next.

## Common mistakes

* Judging clips in silence and skipping sound.
* Keeping the warped last half-second of generated clips.
* Cutting the ambience track at each shot instead of letting it run continuously.

## Go further

**Worked example, first 12 seconds of "The Last Signal" Scene 1:** V1 holds Shot 1.1 (wide cockpit, 0:00-0:04), Shot 1.2 (astronaut slow dolly-in, 0:04-0:08) and Shot 1.3 (close-up of static screen, 0:08-0:12). A1: JOHN (V.O.) "No one has answered in six months." from 0:05 to 0:08. A2: continuous loop of "Low spaceship drone hum with computer static" for 0:00-0:12. Part 2 completes the A3, A4 and grade layers.

**Exercise.** Easy: import 3 random silent clips, add a continuous ambience and a simple music track. Medium: take a silent 4-second clip of a character speaking, generate a line in ElevenLabs, import it and edit the clip's visual duration to match the audio exactly.

**Compare tools.** DaVinci Resolve / Premiere Pro: professional multi-track editing, ducking and LUT grading, high setup effort, for widescreen films and festival entries. CapCut Desktop: lightweight, auto-captions, built-in sound effects, low effort, best for vertical micro-dramas and fast social formats. ElevenLabs: best voice cloning and natural emotional inflection, plus text-prompted SFX; low setup. Use CapCut for high-volume vertical series and DaVinci Resolve for narrative shorts.

**Automation reference.** The [`Open-AI-Micro-Drama-Generator`](https://github.com/Anil-matcha/awesome-generative-ai-apps/tree/main/video_generation/Open-AI-Micro-Drama-Generator) app maps dialogue transcripts to video durations and builds combined assets programmatically.

**Launch it.** Offer "Assembly and Sound Design Packages" at **$100-$300** per finished minute, or edit 1-minute vertical drama episodes at **$150-$350** per episode. Cold pitch AI influencers who post silent loops, with a 10-second sample of their footage edited with voiceover and effects.

**Templates:** [`templates/sound-design-checklist.md`](templates/sound-design-checklist.md).

Next: Assembling a Short Film, part 2.
