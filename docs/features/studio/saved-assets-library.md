---
name: Saved assets library
area: studio
status: live
added: 2026-11-07
pr: deangilmoreremix/OpenHiggsBolt#158 (buttons in more places: #241)
route: Any image or video studio > Library / Saved button in the prompt bar
code:
  - packages/studio/src/components/AssetLibraryButton.jsx
  - packages/studio/src/lib/assetStore.js
  - app/api/assets/library/route.ts
  - app/api/assets/library/upload/route.ts
  - supabase/migrations/20261106000000_user_assets.sql
  - packages/studio/src/components/UniversalMediaUploader.jsx
  - src/apps/motion-director/components/MotionPromptBar.jsx
  - src/apps/motion-studio/components/MotionPromptBar.jsx
  - components/social-publishing/thumbnail/ReferenceUploadZone.tsx
---

## What it does
Every image, video or audio file you upload, and every result a studio generates, is saved to your account. A "Library" or "Saved" button in the studio lets you pick any of them again instead of uploading the file twice. Saved copies are kept in your own storage, so they keep working after the one-hour address the upload service gives out has expired.

## Where in the app
A "Library" (Image, Video, Cinema, Lip Sync, Clipping, Layers, Edit tools) or "Saved" (Motion Control, Recast, Marketing, Motion Studio, Motion Director, the shared media uploader, and the reference picker in the publish dialog's thumbnail step) button next to the upload controls. Choosing an item fills the input the way an upload would. The x on an item removes it from your library.

## Depends on
- Table `public.user_assets` (migration `20261106000000_user_assets.sql`; RLS on, server access only).
- Routes `GET/POST/DELETE /api/assets/library` and `POST /api/assets/library/upload`. Signed-in users only.
- Public Supabase storage bucket `uploads`, under `smartvideo/<user>/library/`.
- Saving is best effort: signed-out users or missing storage never block an upload or a generation.

## How to test
Signed in, upload an image in Image Studio, open Library, and check it is listed. Open Library in Motion Control and pick it. Automated: `packages/studio/src/components/__tests__/assetLibraryButton.test.jsx`, `universalMediaUploaderLibrary.test.jsx`, and `tests/assets-library-routes.vitest.test.ts`.
