# AI Dubbing & Translation

> **Time:** about 16 minutes. **You will finish with:** a dubbed version of a short video in a second language that keeps the original speaker's voice, plus a pacing audit.

---

## Before you start

If you publish only in English you ignore over 80% of the world's internet users, and traditional localization (translators, voice actors, studios, manual alignment) is slow and expensive. Automated dubbing preserves the speaker's timbre and pitch while a translation engine speaks the target language. Different languages take different times: "Automate your billing" becomes "Automatice su facturación" in Spanish, which has more syllables, so the engine compresses speech slightly (for example 1.1x) to fit the original slot.

You will need: a short source video (10 seconds is enough), an ElevenLabs account, an editor with a timeline, and [`templates/dubbing-translation-checklist.md`](templates/dubbing-translation-checklist.md). Prerequisite: lesson 1, Voice Cloning & TTS Basics. SmartVideo GO AI studios that help: Video Studio and Lip-Sync Studio (see Go further).

## Step by step

### 1. Prepare the source dialogue

Open [`templates/dubbing-translation-checklist.md`](templates/dubbing-translation-checklist.md). Export the text transcript of your source video, remove filler words, and extract timecode logs, for example `Line 1: 0:00.00 to 0:04.50`.

**You should see:** a clean transcript where every line has a start and end time.

**If not:** play the video and note the times by hand in the checklist.

### 2. Configure the dubbing project

Open ElevenLabs and go to the **Dubbing** tab (or call the `/dubbing` API route). Set:

1. **Source Language:** English, or detect automatically.
2. **Target Language:** Spanish (or German, French, Hindi, etc.).
3. **Resolution:** "Highest Resolution", to preserve background music isolation.

**You should see:** a project ready to submit with both languages shown.

**If not:** menus move; follow the current ElevenLabs screen for dubbing.

### 3. Submit the video

Upload the video file and start the dub. The engine separates dialogue from background music (stem splitting), translates, re-synthesizes the dialogue in the original speaker's cloned voice, and recombines it with the original music.

**You should see:** a finished dub you can play, in the target language.

**If not:** if processing fails, try a shorter clip or a supported file format.

### 4. Listen for voice and meaning

Play the dub with the transcript beside it.

**You should see:** a voice that sounds like the English speaker, with the music still present under it.

**If not:** if the voice differs a lot, retry with cleaner source audio.

### 5. Audit pacing and syllable speed

Zoom in on the timeline in your editor. Check for "chipmunk" speed where the translation was compressed too much for a short slot.

**You should see:** each dubbed line starting and ending inside its original timecodes.

**If not:** if a line is clipped at the end, split the background clip and add a 0.5-second freeze frame so the voice can finish.

### 6. Translate the metadata

Translate your title, description and tags using the checklist, so a Spanish audio track does not carry an English title.

**You should see:** translated metadata recorded in the checklist.

**If not:** ask a native speaker to check short phrases before publishing.

## Check yourself

* [ ] My dub keeps the original speaker's voice and the background music.
* [ ] Each line fits its original timecodes with no clipped endings.
* [ ] No line sounds sped up like a chipmunk.
* [ ] Title, description and tags are translated.

## Common mistakes

* Uploading a Spanish track with an English title and description.
* Ignoring that translated lines run longer and getting clipped endings.
* Leaving filler words in the transcript, which waste time slots.
* Not checking that sound effects still land on the same frames.

## Go further

**Worked example (English to Spanish tutorial):** original 4.5 seconds: "Here is how to parse your invoice files instantly." Spanish: "Aquí le mostramos cómo analizar sus archivos de facturas al instante." The voice matched the speaker's timbre; the engine auto-compressed speech by **1.12x**; audio started at 0:00.00 and ended at 0:04.45, so it sits on the original timeline. Demo: [rachel-vocal-dubbed.mp3](templates/examples/rachel-vocal-dubbed.mp3).

**Compare tools:**

| Tool | Voice preservation | Pacing | Best for |
|---|---|---|---|
| ElevenLabs Dubbing API | Ultra-high, with background music separation | Good, auto-compresses speed | Faceless videos and ads |
| HeyGen Video Translate | High, with lip-sync to foreign mouth shapes | Fair | Face-to-camera videos |
| Local pipeline (Whisper + XTTS) | Medium | Manual alignment | Custom builds with zero API costs |

**Publishing tip:** YouTube lets you upload multiple audio tracks (English, Spanish, Portuguese) to one video, consolidating views on one URL.

**Exercises:**

1. Easy: translate a 3-sentence script into Spanish and time both versions read aloud.
2. Medium: dub a 10-second video and audit the voice similarity.
3. Hard: dub a video with sound effects and verify they hit the same visual frames as the original.

**Templates:** [`templates/dubbing-translation-checklist.md`](templates/dubbing-translation-checklist.md).

**Produce this in SmartVideo GO AI:** **Video Studio** for the clips, **Lip-Sync Studio** for voice plus mouth-sync, **Storyboard / Campaign Planner** for batching languages as briefs.

Next: Podcast Production & Audio Cleaning.
