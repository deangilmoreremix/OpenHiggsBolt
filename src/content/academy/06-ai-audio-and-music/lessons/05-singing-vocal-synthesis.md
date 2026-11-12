# Singing Voice Conversion & Vocal Synthesis

> **Time:** about 16 minutes. **You will finish with:** a converted singing vocal mixed over an instrumental, with the conversion settings logged in a brief.

---

## Before you start

You want a theme song or musical ad but cannot sing, and text-to-speech reads lyrics like a lecture. **Singing Voice Conversion (SVC)** takes your guide vocal and outputs the same melody in another voice. It uses **Retrieval-based Voice Conversion (RVC)**, which looks up a target singer's characteristics from a trained model, to do timbre transfer: swap the voice's colour while keeping pitch and timing. The guide must be dry and isolated; background music in the recording gets converted into screeches. Crossing male to female needs a transpose of **+12 semitones** (one octave).

You will need: a microphone, an audio editor with a pitch-correction tool (GSnap or Auto-Tune), an RVC interface (or ElevenLabs Voice-to-Voice), a target voice model you have the rights to use, an instrumental track, and [`templates/vocal-conversion-brief.md`](templates/vocal-conversion-brief.md). Prerequisite: lesson 1. SmartVideo GO AI's Lip-Sync Studio and AI Influencer Studio can give the voice a face (see Go further).

## Step by step

### 1. Record a dry guide vocal

In silence, with no music playing, record yourself singing the lyrics. Do not worry if you sound flat.

**You should see:** a vocal-only recording.

**If not:** if music bleeds into it, rerecord with headphones and silence the room.

### 2. Snap the pitch

Import the track into your editor and apply a pitch-correction tool (GSnap or Auto-Tune) to snap notes to the key. Save it as `guide_vocal.wav`.

**You should see:** notes sitting in the chosen key.

**If not:** check the key setting matches your melody (the worked example used C-Major).

### 3. Upload and choose the target model

Open your RVC interface (or call the `/voice-to-voice` API) and upload `guide_vocal.wav`. Choose the target model, for example `emma_singing_v2`.

**You should see:** the file and model both selected.

**If not:** confirm the model is installed or available to your account.

### 4. Set the transpose

Male guide to female target: **+12 semitones**. Female guide to male target: **-12 semitones**. Record this in [`templates/vocal-conversion-brief.md`](templates/vocal-conversion-brief.md).

**You should see:** the pitch shift value in the settings.

**If not:** if the output is strained, check you did not apply the wrong direction.

### 5. Set the retrieval parameters

1. **Feature Retrieval Index Rate:** target **0.65 to 0.70**. Too high (0.90) sounds robotic; too low (0.40) keeps too much of the guide singer's tone.
2. **Consonant Protection:** target **0.33**, to stop "s", "t" and "sh" sounding like static.

**You should see:** both values set in range.

**If not:** adjust in small steps and re-run.

### 6. Convert and download

Click convert and download the output `.wav`.

**You should see:** the melody sung in the target voice.

**If not:** if it screeches, return to step 1 and check the guide is dry.

### 7. Mix the final vocal

Import the converted vocal into your editor with the instrumental. Add a subtle plate reverb and a stereo delay, and limit the vocal peak to -3dB.

**You should see:** a vocal that blends with the music without peaking.

**If not:** lower the reverb wet level (the worked example used 15% wet).

## Check yourself

* [ ] My guide vocal was dry, with no backing music.
* [ ] Transpose matches the guide and target voices (+12 or -12 semitones).
* [ ] Index rate is about 0.65 to 0.70 and consonant protection 0.33.
* [ ] The final vocal peaks at -3dB and sits over the instrumental.

## Common mistakes

* Recording the guide with music playing.
* Index rate set too high or too low.
* Using models trained on famous pop stars for commercial work; platforms remove these tracks and legal risk is real.
* Forgetting to transpose across male and female ranges.

## Go further

**Worked example (theme song, male guide to Emma avatar):** guide sung "Automate your SaaS...", snapped to C-Major. Target `emma_singing_v2`, pitch +12, index rate 0.68. Output: on-pitch female vocal with Emma's timbre, mixed with a lofi backing, reverb 15% wet, mastered to -16 LUFS.

**Compare tools:**

| Tool | Quality | Cost | Setup |
|---|---|---|---|
| RVC | High | Free (local GPU) | Medium (WebUI script) |
| ElevenLabs Voice-to-Voice | Ultra-high, keeps breaths | High (per character) | Low (web dashboard) |
| So-Vits-SVC 4.0 | Ultra-high | Free | High (Python training) |

**Copyright:** train a custom singing model, for example from 20 minutes of scales and songs by a local singer, and lock the IP ownership.

**Exercises:**

1. Easy: record a 10-second rhythmic sing-song guide.
2. Medium: convert it with +12 semitones and analyze the octave shift.
3. Hard: make a 15-second loop: acapella guide, auto-tune, RVC convert, delay and reverb, mix over an instrumental.

**Templates:** [`templates/vocal-conversion-brief.md`](templates/vocal-conversion-brief.md).

**Produce this in SmartVideo GO AI:** **Lip-Sync Studio** (voice plus mouth-sync), **AI Influencer Studio** (a recurring character), **Image Studio** and **Video Studio** for visuals.
