---
name: Zack D Studio
area: studio
status: live
added: 2026-11-11
pr: deangilmoreremix/OpenHiggsBolt#250
route: Studio > Zack D Studio
code:
  - src/apps/zackd/ZackD.jsx
  - src/apps/zackd/templates.js
  - src/apps/zackd/zackdPrompts.js
---

## What it does
Turns one curiosity question into a 9:16 3D animated explainer short: a starter script to edit, then character sheets, keyframes, clips and a final cut. Nothing is generated or charged until the script is approved.

## Where in the app
Studio > Zack D Studio. The empty state is a compact hero (sample thumbnails, headline, description, template buttons) that fits above the prompt bar, like the other studios. Below it, a "Templates" grid lists the finished demo and script-only templates. The demo card plays muted on hover and toggles on click or tap, with no native video controls. The page scrolls on desktop and phone widths.

## Depends on
MuAPI key for paid steps (not needed for the script), `studio/src/components/prompt/PromptComposer`, template assets under `public/zackd/templates/`.

## How to test
Open the studio with no project: confirm the headline is fully visible under the header, scroll to the template cards, hover the demo card to play it, and click "Use script" on a template. Unit tests: `npx vitest run src/apps/zackd`.
