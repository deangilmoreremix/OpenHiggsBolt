# Voice Cloning & Dialogue, part 2

> **Time:** about 12 minutes. **You will finish with:** a script with phonetic fixes and pacing cues, rendered at locked voice settings.

---

## Before you start

A cloned voice still mispronounces brand names and acronyms (it may read "SaaS" as "S-A-A-S" or "muapi" as "myoo-api") and reads run-on sentences flat. Two tools fix this. A **phonetic dictionary** of spelling workarounds ("sass", "moo-ah-pee") forces correct pronunciation. And punctuation works as breathing cues: a comma triggers a short pause, an ellipsis (`...`) a longer reflective pause, and a dash (`-`) a sudden shift in flow.

You need: your cloned voice from part 1 (for example `Emma_V1`) and a short script containing your niche terms.

## Step by step

### 1. Generate a pronunciation test

Write a test sentence with your brand names and acronyms and generate it in ElevenLabs:

```text
Automate your invoice parsing using muapi.
```

**You should see:** audio you can listen to for each tricky term.

**If not:** if no audio plays, check that your cloned voice is selected.

### 2. Fix mispronunciations phonetically

Re-spell any wrong term in your script and regenerate:

```text
Automate your invoice parsing using moo-ah-pee.
```

Likewise, "SaaS automation with Zapier." became "Sass automation with Zapier." and was then read as one word.

**You should see:** the term pronounced correctly with natural flow.

**If not:** try another spelling and keep a note of each working fix in a phonetic dictionary.

### 3. Add pacing cues

Rewrite long sentences with punctuation cues.

Before:

```text
We connect Zapier to the database and then it populates the records automatically which takes ten seconds.
```

After:

```text
We connect Zapier to the database... and within ten seconds... the records populate... automatically.
```

**You should see:** a conversational rhythm with audible breaths and pauses.

**If not:** if it sounds choppy, remove some ellipses and use commas instead.

### 4. Lock your voice settings

Once the sliders sound right, write them down. Standard values are **Stability: 40%** and **Clarity: 75%**, which allow an expressive range without digital distortion.

**You should see:** your settings recorded in your voice checklist.

**If not:** if the voice sounds distorted, move back toward those standard values.

### 5. Batch your generations

Generate all script lines for the month in one session so volume, tone and pacing stay consistent across the batch.

**You should see:** a set of audio files with matching loudness and tone.

**If not:** if one file differs, regenerate it at the locked settings.

## Check yourself

* [ ] I fixed any mispronounced term with a phonetic spelling.
* [ ] My script uses commas, ellipses and dashes for pacing.
* [ ] I wrote down Stability 40% and Clarity 75% (or my tuned values).
* [ ] I generated my lines in one batch.

## Common mistakes

* Trusting the default spelling of acronyms and brand names.
* Writing long run-on sentences.
* Changing slider settings between videos.
* Generating lines on different days with different settings.

## Go further

**Worked example:** the draft line "SaaS automation with Zapier." came out as "S-A-A-S"; changing the script to "Sass automation with Zapier." fixed it. The final audio was clear, with natural breathing.

**Exercise (Hard):** write a script with three brand names or acronyms, generate the voice, audit the pronunciation, design phonetic workarounds for errors and render a clean final audio file.

Next: Monetization Tiers by Follower Count.
