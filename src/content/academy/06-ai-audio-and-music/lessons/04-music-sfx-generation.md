# AI Music & Sound Effects

> **Time:** about 16 minutes. **You will finish with:** a custom instrumental loop, a transition sound effect, and a three-track timeline with music ducked under narration.

---

## Before you start

Stock music is expensive, and popular music can get your video muted, demonetized or struck. Even copyright-free tracks must be fitted to your script by hand. Instead, generate your own loops and sound effects (SFX) and automate the mix. Write structured prompts with **tempo (BPM), genre, lead instruments and vocal exclusions** ("instrumental only") rather than abstract moods. Generate SFX in isolation with no echo. Then duck the music under the voice: -18dB while speaking, -12dB during silence.

You will need: an AI music engine (Suno or Udio), an ElevenLabs account for Sound Effects, a video editor, a voiceover, and [`templates/audio-prompt-library.md`](templates/audio-prompt-library.md). No prerequisites. SmartVideo GO AI's Video Studio is where the finished soundtrack goes (see Go further).

## Step by step

### 1. Pick a prompt formula

Open [`templates/audio-prompt-library.md`](templates/audio-prompt-library.md) and choose a music formula.

**You should see:** a formula with BPM, genre, instruments and "instrumental only".

**If not:** use the example in the next step.

### 2. Generate a background loop

Open Suno or Udio and use this prompt:

```text
120 BPM, clean corporate tech house loop. Minimalist synthesizer, warm deep bass, soft digital percussion, optimistic mood. Instrumental only, seamless audio loop, high fidelity.
```

Download the instrumental `.mp3`.

**You should see:** a loop with no vocals.

**If not:** if a voice appears, repeat "no vocals" in the prompt and regenerate.

### 3. Generate a transition SFX

Open ElevenLabs and choose the **Sound Effects** tool (or call the `/sound-effects` API). Use:

```text
Cinematic sub-bass whoosh transition sound effect, deep low rumble, clean isolated track.
```

Download the output.

**You should see:** a short, clean whoosh without background reverb.

**If not:** add "clean isolated track, no echo" and regenerate.

### 4. Set up three timeline tracks

In your video editor set: **A1** voiceover at 0dB, **A2** SFX at -6dB, **A3** background music at -18dB.

**You should see:** three labelled audio tracks with your files placed.

**If not:** drag each file onto its own track.

### 5. Enable auto-ducking

If your editor supports it (for example Premiere Pro or CapCut), enable ducking on the music track A3, link it to the voiceover A1, set the ducking amount to **-18dB** and the fade in/out speed to **0.3 seconds**.

**You should see:** music dipping automatically when the voice speaks.

**If not:** menus move; follow the current screen.

### 6. Or duck manually with keyframes

Without auto-ducking, place keyframes on A3: **-18dB** during talking sections and **-12dB** during visual-only sections.

**You should see:** a volume line that dips and rises with the narration.

**If not:** zoom the timeline so keyframes land exactly on speech start and stop.

### 7. Check the final level

Play the mix and confirm the music never exceeds -10dB.

**You should see:** a clear voice with music underneath.

**If not:** lower the music; loud music gets compressed by phone speakers and distorts the voiceover.

## Check yourself

* [ ] My music prompt included BPM, instruments and "instrumental only".
* [ ] The SFX is clean and isolated.
* [ ] Tracks are A1 0dB, A2 -6dB, A3 -18dB.
* [ ] Music ducks under narration and never exceeds -10dB.

## Common mistakes

* Prompting with vague moods like "cool coding music".
* Forgetting "instrumental only", so vocals fight the narrator.
* Music too loud for phone speakers.
* Regenerating common SFX each time instead of reusing a saved vault.

## Go further

**Worked example (15-second vertical SaaS ad):** narrator speaks 0:00 to 0:03, silent 0:03 to 0:06 for the demo, speaks 0:06 to 0:15. Music at -18dB, rises to -12dB during the demo, drops back to -18dB for the call to action. A UI click SFX sits at 0:03.50 when the cursor clicks a button.

**Compare tools:**

| Tool | Purpose | Control | Best for |
|---|---|---|---|
| Suno / Udio | Songs and loops | Good, supports extension | Unique genre-specific tracks |
| Mubert / Soundraw | Loop-based audio | High, can mute stems | Fast modular B2B tracks (mute the melody, keep drums and bass) |
| ElevenLabs SFX | Isolated effects | Instant, 2-4s clips | Whooshes and button taps |

**Organize:** keep an SFX vault of reusable files such as `whoosh_fast.wav` and `click_modern.wav`.

**Exercises:**

1. Easy: generate a 1-minute loop with "instrumental" and "loop" in the prompt.
2. Medium: keyframe music down 6dB under speech.
3. Hard: generate 3 transition SFX and align them to the frames of a logo reveal or cut.

**Templates:** [`templates/audio-prompt-library.md`](templates/audio-prompt-library.md).

**Produce this in SmartVideo GO AI:** **Video Studio** for ad clips, **Storyboard / Campaign Planner** for ad briefs and test plans.

Next: Singing Voice Conversion & Vocal Synthesis.
