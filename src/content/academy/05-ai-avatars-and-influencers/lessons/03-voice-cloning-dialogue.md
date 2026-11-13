# Voice Cloning & Dialogue

> **Time:** about 15 minutes. **You will finish with:** a cloned voice profile (for example `Emma_V1`) built from clean training audio.

---

## Before you start

A photorealistic avatar with a generic computer voice breaks the illusion: cheap text-to-speech lacks breath sounds, natural pauses, rising inflections on questions and varied emphasis, and viewers swipe away. The fix is a custom cloned voice built from real human samples. Quality is capped by the input: background noise, static or room echo gets learned by the model and comes back as a raspy, low-fidelity voice. You need dry, clean, isolated mono recordings.

```
Clean Audio Samples (Dry/Mono)  ──►  Cloning Engine (ElevenLabs)  ──►  High-Fidelity Vocal Profile
```

You need: a microphone, a quiet carpeted space, a free editor such as Audacity, an ElevenLabs account, and the [voice cloning checklist](templates/voice-cloning-checklist.md). In SmartVideo GO AI, the **Audio** and **Lip-Sync Studio** use the finished voice. Prerequisites: the previous two lessons. Part 2 covers pronunciation and pacing.

## Step by step

### 1. Read the checklist

Open [`templates/voice-cloning-checklist.md`](templates/voice-cloning-checklist.md) and note the training audio requirements and noise gate steps.

**You should see:** a short list of recording requirements you can follow.

**If not:** if anything is unclear, follow the checklist wording rather than guessing.

### 2. Record training samples

Record speaking samples in a normal, conversational tone. The worked example used 8 minutes of clean reading from a desk USB microphone inside a carpeted closet.

**You should see:** a recording with no echo or fan hum in a quiet playback.

**If not:** move to a smaller, softer room (carpet, clothes) and record again.

### 3. Clean and export

1. Import the audio into Audacity (or another free editor).
2. Apply a **Noise Gate** to strip silent floor noise and background hiss.
3. Export as a mono `.wav` file.

**You should see:** a mono `.wav` with silent gaps clean and speech intact.

**If not:** if the voice sounds chopped, lower the noise gate strength and redo it.

### 4. Upload to the cloning engine

1. Open ElevenLabs and go to Voices -> Add Generative or Cloned Voice (menus move; follow the current screen).
2. Upload your training `.wav`.
3. Write a clear tone description, for example: "Conversational, professional 20s female voice, warm and clear."
4. Generate the voice profile and name it, for example `Emma_V1`.

**You should see:** your named voice in your voice list, ready to generate from.

**If not:** if upload fails, check the file format and size limits shown on the current screen.

### 5. Test it with one sentence

Generate a short test line and listen.

**You should see:** clear audio with natural breathing and no hiss.

**If not:** if it sounds raspy, the training audio was noisy; clean it again or re-record.

## Check yourself

* [ ] My training audio is a clean mono `.wav`.
* [ ] I cloned a named voice profile.
* [ ] A test line sounds clear without hiss or echo.

## Common mistakes

* Uploading audio with background noise, static or room echo.
* Recording in a hard, echoing room.
* Skipping the checklist.

## Go further

**Worked example, "Emma_V1":** 8 minutes recorded with a desk USB mic in a carpeted closet; cleaned in Audacity with a noise gate and hiss removal; cloned in ElevenLabs as `Emma_V1`.

**Compare cloning paths:**

| Path | Fidelity | Cost | Setup |
|---|---|---|---|
| ElevenLabs PVC (Professional) | Ultra-high | High (high-tier subscriptions) | High (30+ minutes of audio) |
| ElevenLabs IVC (Instant) | High | Low | Low (1-2 minutes of audio) |
| Local XTTS v2 | Medium | Free (local GPU) | High (Python environment) |

PVC is the industry standard for professional influencers; IVC suits early testing and simple client explainers.

**Exercises:**

1. Easy: record 2 minutes of speech and clean it in Audacity to remove silent gaps and fan hum.
2. Medium: upload a 2-minute sample to an Instant Voice Cloning tool, generate a 15-second test paragraph and judge the clarity.

**Template:** [`templates/voice-cloning-checklist.md`](templates/voice-cloning-checklist.md) covers training audio requirements, noise gates and post-clone validation.

Next: Voice Cloning & Dialogue, part 2.
