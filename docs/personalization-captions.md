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

## More looks (27)

Under the brand presets, **More looks** offers 27 ready-made caption looks in four groups (trending, pop and expressive, clean and tech, editorial and
film): their own font, outline, shadow and colours, and how the spoken word is picked out (highlight, scale, pop, bounce, glow, a box around the word,
or a karaoke wipe that keeps spoken words lit). A look is saved as `settings.captions.style.look` (optional; an unknown id is dropped when a project is
read back) and keeps following the controls above: position, size, caps, bold, and the text and highlight colors. Picking a brand preset replaces it.
The data and CSS helpers are pure (`captions/capiteStyles.ts`); the layer draws them with the same single component as every other caption.
Each look names a font; it shows only if that font is installed on the device, otherwise the studio font is used (no font is downloaded).

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
