# Voice Cloning & TTS Basics

> **Time:** about 18 minutes. **You will finish with:** a cleaned mono `.wav` sample, a cloned voice profile, and a saved stability and clarity setting in your cloning log.

---

## Before you start

Default text-to-speech sounds robotic: static pitch curves, no emotional context, no breathing. Viewers of faceless videos, courses and ads notice and swipe away. A **cloned voice profile** captures a real speaker's timbre, accent and breaths, so you can generate hours of narration from text. There are two kinds: **Instant Voice Cloning (IVC)** needs only 1 to 5 minutes of sample audio and is fast and cheap, while **Professional Voice Cloning (PVC)** needs 30+ minutes of studio-quality speech and is nearly indistinguishable from the speaker. This lesson uses IVC.

You will need: a cardioid condenser microphone, a room with soft furnishings (carpet, curtains), Audacity (free), an ElevenLabs account, and the spec sheet [`templates/voice-cloning-spec.md`](templates/voice-cloning-spec.md). No prerequisites. The studios in SmartVideo GO AI that use a finished voice are Lip-Sync Studio and AI Influencer Studio (see Go further).

## Step by step

### 1. Set up your recording space

Open [`templates/voice-cloning-spec.md`](templates/voice-cloning-spec.md). Place the cardioid condenser microphone 6 inches from your mouth, in a room with carpets or curtains to stop echo.

**You should see:** a quiet room where a test clap does not ring or echo.

**If not:** move to a smaller, softer room, or hang blankets on bare walls.

### 2. Record at least 6 minutes of varied speech

Read a mix of texts with different emotional tones: news paragraphs, technical explainers and conversational stories. Keep a consistent volume and do not rush.

**You should see:** a recording at least 6 minutes long with no long gaps or clipping.

**If not:** record more passages until you reach 6 minutes. Clip warnings mean you should move back slightly or lower the input gain.

### 3. Clean the audio in Audacity

Import the file into Audacity, then run these in order:

1. **Noise Reduction:** sample the silent room noise, then apply noise reduction at level 12dB.
2. **Noise Gate:** set the threshold to **-48dB** to silence gaps between breaths.
3. **Normalize:** set peak amplitude to **-3.0dB**.

**You should see:** quiet gaps between phrases and a loud, undistorted voice that peaks near -3.0dB.

**If not:** if word starts are chopped, raise the gate threshold slightly (for example to -50dB, as in the worked example) and rerun on the original file. Menus move; follow the current screen.

### 4. Export as mono WAV

Export the cleaned file as a mono `.wav` file. Keep your raw originals in a separate local master folder.

**You should see:** a `.wav` file that plays as one channel.

**If not:** set the track to mono (Tracks menu in Audacity) before exporting.

### 5. Upload to the cloning engine

Open ElevenLabs. Go to VoiceLab, then Add Instant Voice. Upload the cleaned `.wav` files and write the label specification, for example:

```text
energetic male, American accent, clear presentation tone
```

Submit the files for synthesis.

**You should see:** your new voice listed in your voice library.

**If not:** the menu names may have moved; follow the current ElevenLabs screen for adding an instant voice clone.

### 6. Generate a 20-second test paragraph

Type or paste a short paragraph of about 20 seconds in your cloned voice and generate it with the default settings.

**You should see:** audio in a voice recognisably like yours.

**If not:** if it sounds off, check your sample for noise or too-short length and re-upload more clean audio.

### 7. Tune the sliders and log them

Regenerate the same paragraph while adjusting the two sliders:

1. **Stability (target 40% to 45%):** lower is more expressive; higher locks a consistent style.
2. **Clarity / Similarity (target 75% to 80%):** higher enforces exact timbre, but too high can add digital crackles.

Write your best settings in the cloning log from the spec template.

**You should see:** a version that is expressive, with soft breaths, and no crackle.

**If not:** monotone means lower Stability; crackle means lower Clarity.

## Check yourself

* [ ] My recording is at least 6 minutes, cleaned, and exported as mono `.wav`.
* [ ] The gate is at -48dB (or a documented nearby value) and the peak at -3.0dB.
* [ ] My cloned voice reads a test paragraph without sounding robotic.
* [ ] My best Stability and Clarity settings are saved in the cloning log.

## Common mistakes

* Recording in an echoey room or with a laptop microphone.
* Setting Stability and Clarity too high (60% and 90% gave a monotone voice in the worked example).
* Deleting the raw training files; keep them in a master folder so you can retrain.
* Sharing your cloned Voice ID publicly; others could generate audio against your API limits.

## Go further

**Worked example, "Arthur" (B2B SaaS spokesperson):** 7 minutes of clean, dry wav of a SaaS guide, normalized to -3dB peak, gate at -50dB, cloned in ElevenLabs IVC as `Arthur_B2B_V1`. Run 1 (Stability 60%, Clarity 90%): clean timbre but monotone, no breath pauses. Run 2 (Stability 40%, Clarity 75%): expressive, soft inhalations at sentence starts, tone shifts on question marks. Result: ready for bulk narration. Demo audio: [rachel-vocal-cloned.mp3](templates/examples/rachel-vocal-cloned.mp3).

**Compare tools:**

| Tool | Realism | Settings | Best for |
|---|---|---|---|
| ElevenLabs IVC / PVC | Ultra-high (breaths, emotional pacing) | Stability, Clarity, Exaggeration | Narrations, ads, spokesperson clones |
| Play.ht (v2.0) | High | Speed and pitch | Customer service avatars, explainers |
| Coqui TTS (local) | Medium | Python integration | Bulk rendering with zero API credits (XTTS v2 also works locally) |

**Exercises:**

1. Easy: record a 1-minute sample and check the peak level of the silences in a free editor.
2. Medium: upload a 3-minute sample, generate a test script, and find the slider settings where the voice stops sounding robotic.
3. Hard: record 6 minutes, apply noise reduction and a gate below -48dB, export mono wav, and train a profile that passes the similarity test.

**Templates:** [`templates/voice-cloning-spec.md`](templates/voice-cloning-spec.md) has hardware guidelines, gate parameters and stability logs.

**Produce this in SmartVideo GO AI:** use your voice with **Lip-Sync Studio** (voice plus mouth-sync for avatar performances), **AI Influencer Studio** (consistent recurring characters) and **Video Studio** (talking-head clips).

Next: AI Dubbing & Translation.
