---
name: Free branded render for visitors, and AI generation on your own keys
area: personalization
status: live
added: 2026-11-23
pr: deangilmoreremix/OpenHiggsBolt#233
route: Personalize a video > Step 4 (Preview and approve) > Render branded video / Generate with AI
code:
  - src/shared/personalization/guided/StepPreviewApprove.tsx
  - src/shared/personalization/DemoPersonalizeProvider.tsx
  - src/shared/personalization/generationRouter.ts
---

## What it does
The two final actions in Step 4 are separate and both always available. "Render branded video" bakes the approved overlays onto the
selected video entirely in the visitor's browser (no server, no storage, no paid request), so it needs no account. "Generate with AI"
runs on the visitor's own key: a MuAPI key for videos, an OpenAI key for images. If no key is saved it asks for one in place and then
generates. Neither needs a sign-in.

## Where in the app
Personalize a video > Step 4 (Preview and approve) > the two buttons under "Approve this personalization".

## Depends on
The visitor's own MuAPI key (videos) or OpenAI key (images), kept in their browser (`useAuthConfig`). Local inputs (demo-library videos,
`blob:` uploads, inline data) are uploaded to MuAPI before a video call, because MuAPI can only read public URLs. The MuAPI key is never
sent to OpenAI.

## How to test
`npx vitest run src/shared/personalization/guided/__tests__/aiGenerateButton.test.tsx src/shared/personalization/__tests__/generationRouterRemoteInputs.test.ts src/shared/personalization/__tests__/brandedRenderEvidence.test.ts`.
Manual: open Personalize signed out, reach Step 4, approve, render the branded video; then press Generate with AI with no key saved and
paste a key into the prompt.
