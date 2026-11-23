---
name: Caption Studio
area: studio
status: live
added: 2026-11-20
pr: deangilmoreremix/OpenHiggsBolt#214
route: Clipping Studio > clip > Captions; Personalization > Captions > Studio
code:
  - src/shared/captionStudio/modal.js
  - src/shared/captionStudio/transcribeClient.js
  - components/CaptionStudioAction.js
  - src/shared/personalization/preview/captionsFromStudio.ts
  - public/caption-looks
---

## What it does
A free caption editor that runs entirely in the browser. It writes captions from a video's sound with Whisper, lets you edit the text and timing, pick one of the Capite looks or set your own colors and font, export SRT, VTT, TXT or ASS, and burn the captions into the video without using credits.

## Where in the app
Clipping Studio: the Captions button on each clip. Personalization: Captions panel > Studio.

## Depends on
Transformers.js Whisper models downloaded once from Hugging Face after the user agrees (WebGPU, falling back to WebAssembly), `@remotion/captions`, `mediabunny` for the burn-in render. The core is copied from remix-new-editor with `scripts/sync-caption-studio.mjs`, so change it there first.

## How to test
Open a clip, press Captions, Generate, edit a line, then Render captioned video. Check that the speech model prompt appears on the first run only. Not covered by automated browser tests; WebGPU, Safari, Firefox and live microphone need a manual check.
