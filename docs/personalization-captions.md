# Personalization Studio: captions

Step 4, **Captions** card (right column, above Layers). Free: nothing is listened to, transcribed or generated; the words are yours.

## What it does

- **Your words**: paste a script or subtitles in SRT format. Plain words are split into lines of about six words (breaking at sentence ends)
  and timed evenly across the video; SRT keeps its own times. **Time my words** turns captions on.
- **Lines**: edit each line's words and its start and end time, add a line, delete a line (up to 200).
- **Style**: one-click looks that take your brand colors (Clean, Word highlight, Boxed, Brand bar, Big middle), then position (top, middle,
  bottom), size, **highlight the spoken word**, a rounded **box**, CAPS, and colors for the text, the highlight and the box.
- The line rises and fades in as it starts. While a line plays the active word is highlighted: words share the line's time in proportion
  to their length, so the highlight moves along the line.
- Captions are saved with the project (`settings.captions`, optional and normalized, so existing projects are unchanged).

## Languages, scripts and more downloads

- **Language of the words.** Once there are lines, **Language of these words** can be set to any of Whisper's languages (or left on "Work it out from the
  words"). It is saved with the captions (`settings.captions.language`, optional, normalized). Nothing is listened to here, so this only decides how the
  words are drawn and exported.
- **Scripts.** Arabic and Hebrew are set right to left; Cyrillic, CJK, Devanagari, Thai and the rest get their font stack after the look's own, and wide letters are
  set a little smaller (never below 60 %) so a line holds about as many letters as a Latin one. With no language saved the script is read from the letters.
  The script table follows [ai-video-captions](https://github.com/nicolaigaina/ai-video-captions) (MIT). Fonts are only named: no font is downloaded, so a
  script shows in a font that is installed on the device, or the browser's fallback.
- **Downloads.** Besides `.srt` and `.vtt`: `.txt` (the words, one line per caption) and `.ass` (Advanced SubStation Alpha: the style, colours, outline,
  shadow, spacing, casing and the word effect of the look, at the chosen height; for editors and players that take styled subtitles). Shared pure code in
  `captions/` (`assExport.ts`, `scripts.ts`, `textTools.ts`), identical in remix-new-editor.

## How it works

`preview/captions.ts` is pure (parsing, timing, which line and word are active at a frame, normalizing); `preview/CaptionsLayer.tsx` draws the
line with plain text, a text shadow or a rounded box (the radius is `0.6em`, not `999px`, which the browser exporter does not clamp). The live
Player and the export both draw it with this one component, above the layers and below the end card.

## Verified (real modal, real export, measured with ffmpeg)

`e2e/personalization-captions.spec.ts`: a line from 0.6 s to 3.2 s with a magenta highlight and a box. In the exported MP4 there is no
highlight before the line (0.3 s) or after it (3.3 s), the highlight is on screen while it plays, and it moves from the first word (left) at
0.8 s to the last word (right) at 2.9 s; the middle word is highlighted at 1.9 s. The live Player shows the same words and highlight.

## Known limits

- **Timing is not speech recognition.** Lines are spread evenly (or use your SRT times); adjust them by hand to match the speech.
- The lines are listed in the Captions card, not as lanes in the main timeline.
- With **Live off** (the still-poster editor view) captions are not drawn; turn Live on to see them. The exported video always includes them.
- Captions sit above layers and the look but below the end card; they are not keyframed.
- Reusable brand text styles are the caption presets above (they follow the brand colors); there is no separate saved-styles library, and no
  separate "logo reveal" presets beyond the existing Logo Reveal animation and the keyframe motions.
