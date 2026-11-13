# Building a YouTube Shorts Factory

> **Time:** about 18 minutes. **You will finish with:** a Short whose ending flows straight back into its start, with no silence, no fades and matching first and last frames.

---

## Before you start

YouTube Shorts rewards **Retention Percentage**. If a viewer watches to the end and stays into the first 3 seconds of the replay, retention is recorded as **105%**, and enough of those push a Short onto the Shorts shelf. Most creators kill it with "Thanks for watching", a subscribe button, or a 2-second music fade. The fix is a seamless loop: the final half-sentence connects to the opening, audio never fades, and the first and last visuals match.

You will need a short script, a voice tool, an editor (CapCut works), and lessons 1 and 2. In SmartVideo GO AI use **Image Studio** for a 9:16 anchor image and **Video Studio** to animate it.

## Step by step

### 1. Draft the loop hook

Open [`templates/shorts-looping-blueprint.md`](templates/shorts-looping-blueprint.md). Write the end line unfinished and the start line completing it. Example:

```text
Ending text: The best secret to high productivity is...
Starting text: ...this simple time-management trick.
```

**You should see:** the two lines read as one sentence when joined: "The best secret to high productivity is... this simple time-management trick."

**If not:** reword the opener until the grammar flows from the ending.

### 2. Generate the audio in two parts

Generate the script with your voice tool. Output the ending phrase and the starting phrase as separate files, so the voice does not drop its pitch the way it does at the end of a sentence.

**You should see:** separate ending and starting audio files, with the ending still sounding "open".

**If not:** if the pitch still falls, add a connecting word in the prompt or regenerate the ending alone.

### 3. Trim the audio tail

Place the audio on your timeline and zoom to frame level. Find the exact frame where the voice stops, then slice and delete all trailing silence. Leave not even a 0.1-second gap.

**You should see:** the timeline ends exactly on the last spoken word.

**If not:** if you hear a click, shift the cut a frame or two earlier or later.

### 4. Lock the music

Put background music on A2. Cut it exactly at the video end. Lock its level (for example -18dB) from start to finish, with no fade-in or fade-out at the edges.

**You should see:** a flat music level and no fade at either edge.

**If not:** delete any default fade handles your editor added.

### 5. Match the first and last frames

Compare the first and last frame. If the first is dark, make the last dark too. Apply a constant **pan-right** or slow zoom-out to both edges so motion flows across the loop.

**You should see:** a replay with no visual flash or jump.

**If not:** adjust color grading or framing on the last clip until it matches the first.

### 6. Preview the loop

Set playback to loop and watch three passes.

**You should see:** the join is hard to spot, and the sentence reads on from the end into the start.

**If not:** note whether the problem is audio (silence, pop) or visual (flash), and revisit step 3, 4 or 5.

## Check yourself

* [ ] Ending half-sentence completes with the opening line.
* [ ] No trailing silence, not even 0.1 seconds.
* [ ] Music is locked at one level with no fades.
* [ ] First and last frames match in tone and motion.

## Common mistakes

* "Thanks for watching" or a subscribe button at the end.
* Fading music out over a blank screen.
* One audio file for the whole script, so the voice drops pitch at the end.

## Go further

**Worked example, "Focus Blueprint" (productivity):** Start (0:00-0:03.0) glowing digital clock, caption `[is this simple rule.]` (0.0-1.5s) then `[If you want focus,]` (1.5-3.0s). Body (0:03.0-0:56.0) explains the 90-minute focus block. End (0:56.0-0:59.0) glowing clock, caption `[The best hack for work]`. Narration ends on "work" at exactly 0:59.00, timeline length exactly 0:59.00, and on loop the voice goes straight to "is this simple rule." The viewer hears "...The best hack for work... is this simple rule. If you want focus..."

**How the example clip was made:** anchor image via `nano-banana-2` (text-to-image, $0.06/image, 9:16); uploaded with muapi's `upload_file` endpoint; fed to `seedance-2-image-to-video-fast` (image-to-video, $0.50/clip) on `images_list` with a vertical aspect ratio and a camera-zoom prompt; the `.mp4` was converted to a silent GIF with `ffmpeg`.

**Compare tools:** manual CapCut editing gives high loop precision for custom loops; programmatic automation (`AI-Youtube-Shorts-Generator`, [repo](https://github.com/Anil-matcha/awesome-generative-ai-apps/tree/main/video_generation/AI-Youtube-Shorts-Generator)) cuts silence automatically, good for mass production; phone apps have low precision. For volume, programmatic loop audio ensures zero tail silence.

**Launch tips:** pin a comment that completes the loop or asks "Did you catch the loop?"; keep titles under **40 characters** (for example "Automate your invoices in 10 mins").

**Exercises:** Easy: write a 3-sentence script whose last sentence connects to the first, and read it aloud. Medium: trim a voiceover's silent tail to the millisecond. Hard: export a 15-second loop, upload to a test channel, and check for stutter or audio pop.

**Template:** [`templates/shorts-looping-blueprint.md`](templates/shorts-looping-blueprint.md).

Next: AI Thumbnail Design.
