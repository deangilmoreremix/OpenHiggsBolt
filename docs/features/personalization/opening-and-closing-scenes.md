---
name: Opening and closing scenes (Personalization Step 4)
area: personalization
status: live
added: 2026-11-20
pr: deangilmoreremix/OpenHiggsBolt#230
route: Personalize a video > Step 4 (Preview and approve) > Opening and closing scenes
code:
  - src/shared/personalization/guided/DesignGallery.tsx
  - src/shared/personalization/guided/StepPreviewApprove.tsx
  - src/shared/personalization/guided/OverlayEditor.tsx
  - src/shared/personalization/preview/presets.ts
  - src/shared/personalization/preview/PersonalizationComposition.tsx
  - src/shared/personalization/templates/designs/sceneCatalogEntries.ts
---

## What it does
Lets a personalized video open and/or close with a full-screen animated design (an "opening scene" and a "closing scene"). Each scene
uses the customer's own logo, text and colors and plays around the video: opening scene, then the whole video, then closing scene.
A closing scene replaces the branded end card. The preview, the editor timeline and the exported video all follow the same timeline.

## Where in the app
Personalize a video > Step 4 (Preview and approve) > Quick adjustments > "Opening and closing scenes". Pick a card in the gallery
(hover to play it, click to add it); "None" clears the slot. Designs that sit on top of the video are still added in "Added to your video".

## Depends on
No new endpoints. Designs come from the design catalog (13 full-screen scene designs plus any other design, which plays on a brand-colour
backdrop). The video's own length is unchanged; the total length is `totalDurationInFrames` (scenes add to it).

## How to test
Unit: `npx vitest run src/shared/personalization/preview/__tests__/sceneSlots.test.ts src/shared/personalization/preview/__tests__/timelineComposition.test.tsx src/shared/personalization/__tests__/brandedRenderEvidence.test.ts`.
Manual: pick an opening and a closing scene in Step 4, press play in the editor (the scrubber covers the scenes; a note says which scene is
playing), then render and check the exported video starts and ends with the scenes.
