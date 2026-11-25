---
name: Video Pages
area: studio
status: live
added: 2026-11-25
pr: deangilmoreremix/OpenHiggsBolt#251
route: Top bar > Video Pages; any studio's result > Landing page; Video Pages window > My pages
code:
  - src/apps/video-pages/LandingPagePicker.tsx
  - src/apps/video-pages/LandingPagePickerModal.tsx
  - src/apps/video-pages/MediaChooser.tsx
  - src/apps/video-pages/MyPagesModal.tsx
  - src/apps/video-pages/VideoPagesStudio.tsx
  - src/lib/landingPages/puck/components.jsx
  - src/lib/landingPages/puck/slotFields.js
  - src/lib/landingPages/puck/viewerScope.jsx
  - components/StandaloneShell.js
---

## What it does
Turns a video or picture into a branded, editable landing page with a call to action, a lead form and analytics. Video Pages is two windows, not a studio: the page picker (choose a design, then the full page editor opens; pick or upload the video or picture if none was handed over) and "My pages" (open, edit, publish, share and see analytics for saved pages). Every design with a video offers viewer options: start and stop time, a start frame shown as the picture, a subtitles file (.vtt), text on the video (fills `{{tokens}}`), and a button that appears at a chosen second.

## Where in the app
Top bar: Video Pages opens the picker, whose header has a My pages button. Each studio's result has a Landing page button. An old `/studio/video-pages` link opens My pages over Image Studio.

## Depends on
Supabase tables and RPCs behind `src/lib/landingPages/api.js` (pages, contacts, events), the library in `studio/src/lib/assetStore.js` for the media chooser, and the page editor (`@puckeditor/core`).

## How to test
`npx vitest run src/apps/video-pages src/lib/landingPages`. By hand: top bar > Video Pages > pick a video > click a design > edit text > Save as my page; then Video Pages > My pages and open it.
