# Voice/Audio Models — Which One for Which Use Case

> **Time:** about 15 minutes. **You will finish with:** an audio plan with a voice, a music prompt, a transcript step and a mix level for one video.

---

## Before you start

Viewers tolerate mediocre resolution but click away from bad audio. Low-end TTS sounds robotic, full songs with vocals bury dialogue when the scene needed ambient instrumentals, and voice cloning without noise-cleaned reference audio gives distorted artifacts. The audio stack keeps speech, music and effects separate: Text Script, then ElevenLabs voice, then a Suno/Udio instrumental, then stem mix and mastering. Three pillars: voice synthesis and cloning (**ElevenLabs** / **Bark**), generative music (**Suno v3.5** / **Udio**), and speech-to-text (**Whisper**).

You will need a short script for a video and the template [`templates/video-audio-stack-matrix.md`](templates/video-audio-stack-matrix.md). In SmartVideo GO AI you will use **Video Studio** and **Lip-Sync Studio** for voice and mouth-sync.

## Step by step

### 1. Open the stack matrix

Open [`templates/video-audio-stack-matrix.md`](templates/video-audio-stack-matrix.md).

**You should see:** voice parameter setups, music prompt structures and stem mixing checklists.

**If not:** check the link path as written, or use the Compare Tools table in Go further.

### 2. Map each audio need to a tool

1. Narration and commercial voiceover: **ElevenLabs Multilingual v2** (high emotional dynamics, stability `0.45`, clarity `0.85`).
2. Cinematic score or background beat: **Suno v3.5** (instrumental prompt mode) or **Udio**.
3. Subtitles and transcripts: **OpenAI Whisper** (Large-v3 model).

**You should see:** three lines, one tool per need.

**If not:** if your video has no narration, skip line 1.

### 3. Set the voice parameters

In ElevenLabs set **Stability** to `0.40 - 0.50` for expressive, natural modulation and **Clarity + Similarity Boost** to `0.80` for clean studio presence.

**You should see:** both values noted, then a voiceover generated from your script.

**If not:** if the voice sounds monotone, lower stability slightly within the range. Menus move; follow the current screen.

### 4. Write the music prompt

Ask for an instrumental, not a song with vocals. Use this as a model:

```text
Ambient corporate piano, warm uplifting strings, 110 bpm
```

**You should see:** a background track with no vocals that fits your voiceover tempo.

**If not:** if vocals appear, switch to instrumental prompt mode.

### 5. Plan the transcript

Run the finished voiceover through **OpenAI Whisper** to get timestamped subtitles (an SRT file).

**You should see:** a transcript with timestamps.

**If not:** if words are wrong, check the voiceover for background noise and re-run.

### 6. Mix the stems

In your video editing, duck the background music **-14dB** below the voiceover track.

**You should see:** dialogue clearly on top of the music.

**If not:** if you still strain to hear the speech, lower the music further.

### 7. Note the voice-cloning rule

If you ever clone a client voice, provide at least 3 minutes of background-noise-free, 44.1kHz studio WAV audio.

**You should see:** a note in your plan about clean reference audio.

**If not:** without clean reference audio, expect distorted artifacts and do not clone.

## Check yourself

* [ ] I mapped voice, music and transcript to separate tools.
* [ ] ElevenLabs stability is `0.40 - 0.50` and clarity about `0.80`.
* [ ] My music prompt asks for an instrumental.
* [ ] Music sits -14dB under the voiceover.

## Common mistakes

* Using a low-end TTS engine, which sounds robotic and monotone.
* Generating music with vocals under dialogue.
* Cloning a voice from noisy reference audio.
* Leaving music at full level under narration.

## Go further

**Worked example: "Commercial Real Estate Ad."** Voiceover: ElevenLabs "Adam - Deep Corporate Narrator" (stability `0.45`). Score: Suno v3.5 instrumental (`"Ambient corporate piano, warm uplifting strings, 110 bpm"`). Transcription: Whisper auto-generated SRT subtitles. Production time: 8 minutes. Audio cost: $0.12 credit cost vs. $400 for a voice actor plus stock music license.

| Model / platform | Category | Strengths | Best for |
|---|---|---|---|
| **ElevenLabs** | Voice synthesis and cloning | Emotional dynamics, multi-speaker dialogue, voice cloning | Commercial voiceovers, audiobooks, podcasts |
| **Suno v3.5** | Generative music | Full song structure (verses, chorus), fast generation | Background tracks, jingles, scores |
| **Udio** | Generative music | Superior fidelity and vocal mix control | High-fidelity music production and stems |
| **Whisper (OpenAI)** | Speech-to-text | 99%+ transcription accuracy across 50+ languages | Subtitles, transcripts, closed captions |

Exercises:

1. **Easy:** generate a 30-second commercial voiceover script using ElevenLabs.
2. **Medium:** create an instrumental track in Suno v3.5 matching your voiceover tempo.
3. **Hard:** produce a complete mix (voiceover, music, subtitles) for a 60-second video ad.

Template: [`templates/video-audio-stack-matrix.md`](templates/video-audio-stack-matrix.md).

Other SmartVideo GO AI studios that use this: Image Studio, AI Influencer Studio, Storyboard / Campaign Planner.

Next: API vs. Local: A Decision Framework.
