# Captions: Capite styles

The Captions card now offers the 27 caption styles from [Capite](https://github.com/muneebkhan08/Capite) (MIT, Copyright (c) 2026 Capite Contributors; the license is kept at `src/shared/personalization/preview/capite/LICENSE`).

## What was copied, and from where
Every file under `preview/capite/` names its source and is copied rather than rewritten:
- `caption-styles.config.json`: the 27 styles, byte for byte (`frontend/src/lib/caption-styles.config.json`).
- `captionStyles.ts` and `types.ts`: the style list, the id-to-config builder and the types (`frontend/src/lib/caption-styles.ts`, `frontend/src/types/caption.ts`). Only the `~` import paths changed.
- `subtitleExport.ts`: `transcriptToSrt`, `transcriptToVtt`, `transcriptToTxt`, `downloadBlob` (`frontend/src/lib/subtitle-export.ts`). Only the type import changed.
- `activeWord.ts`: the active-word effect numbers (pop 1.16, bounce -5px and 1.18, scale 1.12, glow 8px and 18px, box padding/radius/1.08) and the five-word window, taken from `globals.css` and `video-overlay-player.tsx`.

## What is ours, and why
- Capite applies its effects with CSS transitions; Remotion and the in-browser exporter have no CSS transitions, so the same end-state values are applied per frame (`CaptionsLayer.tsx`, a 0.12 s ramp like Capite's transitions).
- Capite burns captions with ASS subtitles through FFmpeg in Python. That cannot run here, so its outline, shadow, letter and word spacing are drawn with CSS (text stroke, text shadow) and converted from ASS pixels on a 1080x1920 frame to em units (`captionStyleFromCapite` in `captions.ts`).
- Fonts: Capite's styles name fonts such as Montserrat or Bebas Neue. The exporter can only draw the font this app bundles, so all styles use it.

## Using it
Captions card: style chips grouped by Capite's categories (Trending, Pop, Film, Clean) plus our five brand styles; a "Word animation" row (Plain, Highlight, Karaoke, Pop, Bounce, Scale, Glow, Box); **Download .srt / .vtt**. Saved styles keep the new fields. Older projects open unchanged.

## Not included
Capite's automatic speech-to-text (`faster-whisper`, a Python server) and ASS export. Words are still pasted or loaded from SRT.

## Tests
`preview/__tests__/captionsCapite.test.ts` and `e2e/personalization-captions-capite.spec.ts` (real browser and export: the spoken word on a cyan block moves along the line, five-word window, SRT/VTT downloads).
