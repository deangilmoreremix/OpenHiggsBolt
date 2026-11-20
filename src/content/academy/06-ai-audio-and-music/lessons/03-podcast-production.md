# Podcast Production & Audio Cleaning

> **Time:** about 15 minutes. **You will finish with:** a voice track cleaned and mastered to -16 LUFS (stereo) or -19 LUFS (mono), logged in a production sheet.

---

## Before you start

Listeners forgive low video resolution but turn off painful audio within 10 seconds. Raw voice recordings suffer from room echo, low rumble, sibilance (sharp "S" sounds) and volume swings. A standard pipeline fixes them: a high-pass filter cuts rumble (speech has no useful information below 80Hz), a noise gate silences gaps, EQ boosts presence (3kHz to 5kHz) and cuts mud (300Hz to 400Hz), a compressor flattens volume, and loudness normalization targets **-16 LUFS** for stereo or **-19 LUFS** for mono. LUFS is the standard way to measure and match loudness across platforms.

You will need: Audacity (or Audition) and a raw voice recording, plus [`templates/podcast-production-sheet.md`](templates/podcast-production-sheet.md). No prerequisites. In SmartVideo GO AI, the Video and Lip-Sync studios use finished audio like this (see Go further).

## Step by step

### 1. Import and note your starting levels

Import your voice file into Audacity. Open [`templates/podcast-production-sheet.md`](templates/podcast-production-sheet.md) and write down the initial decibel peak levels.

**You should see:** a waveform and a filled "before" row in the sheet.

**If not:** if the file will not import, export it as WAV from the recorder and try again.

### 2. Apply the high-pass filter

Apply a High-Pass Filter at **80Hz** for male voices or **100Hz** for female voices, with rolloff of 24dB per octave.

**You should see:** less low rumble and mud, with the voice still full.

**If not:** if the voice sounds thin, lower the frequency a little.

### 3. Set the noise gate

Apply a Noise Gate with threshold **-48dB** (slightly higher if your room hums loudly), attack **10ms** and release **150ms**.

**You should see:** silent gaps between words and no chopped first or last syllables.

**If not:** if syllables are cut, lower the threshold or lengthen the release.

### 4. Apply compression

Apply a Compressor: threshold **-16dB**, ratio **3:1** (conversational dialogue), auto-makeup gain on.

**You should see:** loud and quiet parts closer in volume.

**If not:** if it sounds squashed, raise the threshold.

### 5. Normalize to the loudness standard

Run Loudness Normalization: target **-16.0 LUFS** for stereo or **-19.0 LUFS** for mono. Set the True Peak Limiter to **-1.0 dBTP**.

**You should see:** an output measuring at the target with peaks under -1.0 dBTP.

**If not:** menus move; follow the current screen, or use a loudness meter effect to check the result.

### 6. Check in mono and log the result

Switch the final mix to mono and listen. Then fill in the "after" row of the production sheet.

**You should see:** a clear voice that does not fade or cancel.

**If not:** check for phase problems between the two channels.

## Check yourself

* [ ] The high-pass filter and noise gate are applied and nothing is chopped.
* [ ] Compression uses a 3:1 ratio.
* [ ] The final track hits -16 LUFS stereo or -19 LUFS mono with true peak -1.0 dBTP.
* [ ] I logged before and after values in the production sheet.

## Common mistakes

* Recording with reverb, delay or EQ already applied; capture dry.
* Setting the gate so high it clips word endings.
* Skipping the mono check; many listeners use one earbud.
* Using the stereo target on a mono file.

## Go further

**Worked example (home-office interview):** USB desk mic with fan noise. High-pass at 90Hz, gate at -45dB, EQ presence +2dB at 4kHz, compressor 3:1 at -18dB threshold, mastered to exactly -16.0 LUFS with true peak -1.0 dBTP. Result: clean, warm, quiet background.

**Compare tools:**

| Tool | Quality | Control | Setup |
|---|---|---|---|
| Audacity / Audition | High | Ultra-high | Medium (manual) |
| Adobe Enhance API | High, but can add artificial sounds | None | Low (one click) |
| Auphonic / Wavespeed | High | Medium, strong loudness matching | Low (automated) |

**Launch ideas:** audio cleanup can be offered as a service. The original lesson cites **$50 to $150 per episode** for a 30-minute episode, or **$300 to $500 per month** for 4 episodes on retainer. Treat these as examples, not guarantees.

**Exercises:**

1. Easy: apply a high-pass at 80Hz and log the change in clarity.
2. Medium: adjust a gate until gaps read as -inf dB.
3. Hard: master a 1-minute intro with high-pass, gate, compressor and limiter targeting -16 LUFS.

**Templates:** [`templates/podcast-production-sheet.md`](templates/podcast-production-sheet.md).

**Produce this in SmartVideo GO AI:** **Video Studio** and **Lip-Sync Studio** for the visuals that pair with your audio.

Next: AI Music & Sound Effects.
