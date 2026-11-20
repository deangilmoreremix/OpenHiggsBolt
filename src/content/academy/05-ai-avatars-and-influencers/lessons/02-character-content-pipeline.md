# Character to Content Pipeline

> **Time:** about 12 minutes. **You will finish with:** a lip-synced talking-head clip of your character that passes a quality audit.

---

## Before you start

A still avatar only works on photo grids, but the highest reach and advertiser payments are on video feeds (TikTok, YouTube Shorts, Reels). Run a consistent character through a standard image-to-video model and the face warps as soon as the head moves: hair changes, clothing textures slide, and the uncanny valley drives viewers away. The professional answer is a lip-sync pipeline that animates only the mouth, jaw and eyes:

```
Static Avatar Portrait + Clean Voice Audio  ──►  Lip-Sync Engine  ──►  Talking Head Video
```

You need: your master portrait from the previous lesson (for example `emma-master.jpg`), a clean voiceover file (for example `01_intro.mp3`), the [lip-sync spec sheet](templates/lipsync-spec-sheet.md), and SmartVideo GO AI's **Lip-Sync Studio** and **Video Studio**. This lesson covers the render; part 2 covers the edit.

## Step by step

### 1. Prep your assets

1. Open [`templates/lipsync-spec-sheet.md`](templates/lipsync-spec-sheet.md).
2. Check that your master portrait (centered face) and your clean narration meet its visual and audio guidelines.

**You should see:** both files ticked off against the checklist.

**If not:** fix the failing item (re-crop the face, re-export clean audio) before rendering; bad inputs cost credits.

### 2. Submit to the lip-sync engine

In **Lip-Sync Studio**, or via the `/sync-lipsync` (or volcengine lip-sync) endpoint through muapi, provide:

* **Audio URL:** the public URL of your narration file.
* **Image URL:** the public URL of your avatar portrait.
* **Aspect ratio:** `9:16` or `1:1`, to match your target feed.

**You should see:** a render that finishes as an `.mp4` of the same length as your audio (a 4.5 second hook gives a 4.5 second clip).

**If not:** if it rejects the files, check that both URLs are public and the formats match the spec sheet. Menus move; follow the current screen.

### 3. Download and audit the render

Download the `.mp4` and play it through, checking two things:

* **Mouth warping:** the mouth should not stretch unnaturally on fast words.
* **Drift:** lips should match the syllables.

**You should see:** natural mouth movement and blinks with the head, hair and clothing unchanged.

**If not:** if the lips lag slightly, shift the audio track by -50ms to -100ms in your timeline. If the mouth warps badly, re-render with a cleaner, more front-facing portrait.

## Check yourself

* [ ] My portrait and audio passed the spec sheet.
* [ ] I rendered a lip-sync clip in the right aspect ratio.
* [ ] I audited the clip for mouth warping and sync drift.

## Common mistakes

* Running the character through plain image-to-video and letting the face warp.
* Rendering before checking the spec sheet, then paying for a bad clip.
* Ignoring a small audio lag instead of nudging the track by -50ms to -100ms.

## Go further

**Worked example, animating "Emma" for a 60-second Short:** `emma-master.jpg` plus `01_hook.mp3` ("Hey, it's Emma here. Today we are...", 4.5 seconds) went into `/sync-lipsync`; the output is 4.5 seconds with natural blink animation. The real motion loop was made from the consistent cafe image with `seedance-2-image-to-video-fast` (image-to-video, $0.50/clip) on the `images_list` param with a vertical aspect ratio and a prompt describing Emma's facial movement; see [the clip](templates/examples/emma-clip.mp4).

**Compare tools:**

| Tool | Quality | Cost | Setup |
|---|---|---|---|
| muapi `/sync-lipsync` | High; keeps background, natural blinking | ~$0.50 per clip | Low (direct API call) |
| HeyGen / Synthesia | Very high; pre-built bodies and gestures | $30-$200/mo | Low |
| Local ComfyUI (LivePortrait) | Ultra-high; tracks a webcam actor | Free | Very high (heavy GPU setup) |

For client content factories, `/sync-lipsync` scales best: pay per call, no subscription lock-in.

**Exercises:**

1. Easy: gather one clean front-facing face image and a 5-second audio clip; verify they meet the spec checklist.
2. Medium: submit them to a lip-sync engine, download the video, align the audio and fix any small delay.
3. Hard: see part 2 for the 30-second edit.

**Template:** [`templates/lipsync-spec-sheet.md`](templates/lipsync-spec-sheet.md) has prep checklists and sync logs.

Next: Character to Content Pipeline, part 2.
