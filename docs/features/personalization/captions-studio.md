---
name: Captions in the personalization editor (Caption Studio)
area: personalization
status: live
added: 2026-11-23
pr: deangilmoreremix/OpenHiggsBolt#pending
route: Personalize > Advanced Editing > Step 4 Preview and approve > Captions
code:
  - src/shared/personalization/guided/CaptionsPanel.tsx
  - src/shared/personalization/preview/StudioCaptionLine.tsx
  - src/shared/personalization/captions/studioCaptions.ts
  - src/shared/personalization/captions/studioClearance.ts
  - src/shared/personalization/guided/CaptionDragHandle.tsx
  - src/shared/captionStudio/modal.js
  - src/shared/captionStudio/fonts/captionFonts.js
  - e2e/personalization-captions-studio.spec.ts
---

## What it does
The free on-device Caption Studio is the one place to make and edit captions: transcribe in the browser, edit lines and timing, pick one of 32 looks, any of 22 embedded fonts (no font request), a five-step weight, colours, outline and background, and Arabic/Hebrew right-to-left lines. The video editor draws them live and in every export, warns when they cover another text layer, and a grip on the preview drags them (they stop just short of other text).

## Where in the app
Personalize > Advanced Editing > Step 4 > Captions > Open Caption Studio. Downloads: .srt, .vtt, .txt, .ass.

## Depends on
In-browser Whisper (`@huggingface/transformers`), `@remotion/captions`, `mediabunny`. Fonts are embedded under `src/shared/captionStudio/fonts/data/` (licences in `public/fonts/capite/LICENSES.txt`). Core files are synced from remix-new-editor with `scripts/sync-caption-studio.mjs`.

## How to test
`e2e/personalization-captions-studio.spec.ts` (imports an SRT, picks a font and background, drags the captions onto the business name, exports an MP4 and measures it). Unit tests: `vitest src/shared/personalization`.
