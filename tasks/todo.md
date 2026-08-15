# Social Publishing — Task Checklist (all studios except Audio)

## Foundation (DONE)
- [x] `components/SocialPublishModal.tsx` — platform/media-type aware modal.
- [x] `components/SocialPublishProvider.tsx` — `useSocialPublish` + `PublishStep` (the "step" UI) + `PublishButton`.
- [x] `components/StandaloneShell.js` — wrap studio content in `SocialPublishProvider`.
- [x] `src/lib/muapi.js` — `connectSocialAccount` accepts `platform`.
- [x] `npx tsc --noEmit` passes.

## Studio wiring (DONE — verified by grep across repo)
PublishStep is imported and rendered in ALL of the following. Audio is excluded (not a publish target).
- [x] VFX Studio (`src/apps/vfx-studio/pages/VFXGenerate.tsx`) — video.
- [x] Design Agent (`src/apps/design-agent/DesignAgent.tsx`) — image/video asset modal.
- [x] Thumbnail Studio (`src/apps/thumbnail-studio/ThumbnailStudio.tsx`) — image.
- [x] Clipping (`packages/studio/src/components/ClippingStudio.jsx`) — `clipUrl` per clip.
- [x] Image Studio (`packages/studio/src/components/ImageStudio.jsx`) — image.
- [x] Video Studio (`packages/studio/src/components/VideoStudio.jsx`) — video.
- [x] Vibe Motion (`packages/studio/src/components/VibeMotionStudio.jsx`) — `entry.url`.
- [x] Lip Sync (`packages/studio/src/components/LipSyncStudio.jsx`) — `entry.url`.
- [x] Cinema (`packages/studio/src/components/CinemaStudio.jsx` + `src/apps/cinema/pages/CinemaGenerate.tsx`) — video/image.
- [x] Marketing (`packages/studio/src/components/MarketingStudio.jsx`) — video/image.
- [x] Recast / Body Swap (`packages/studio/src/components/RecastStudio.jsx`) — video/image.
- [x] AI Influencer (`packages/studio/src/components/AiInfluencerStudio.jsx`) — image.
- [x] Storyboard (`src/apps/storyboard/pages/ShotEditor.tsx`) — shot frame url.
- [x] Photo Studio (`app/photo-studio/page.tsx`) — image.
- [x] Video Studio app variant (`src/apps/video-studio/pages/VideoGenerate.tsx`) — video.
- [x] Audio Studio — EXCLUDED (audio not a publish target).

NOTE: A previous version of this checklist claimed "9 studios remaining". That was incorrect — every studio except Audio is already wired (verified by grep). The only thing not yet done is the live runtime smoke-test (below).

## Cost hint (DONE)
- [x] "~$0.01 / publish" hint exists in `src/apps/social-publishing/SocialPublishing.tsx`.

## Remaining / OPEN
- [ ] Live smoke-test publish (manual — needs a running app + MuAPI OAuth key): image→Instagram + video→TikTok from at least two studios.
- [ ] Unit tests:
  - [ ] Modal platform filtering (image → Instagram only; video → YouTube + Instagram + TikTok).
  - [ ] Payload shaping for each platform/media-type.
  - [ ] `PublishStep` null-url guard (renders nothing without a media URL).
  - [ ] NOTE: `packages/studio/src/components/VideoStudio.test.jsx` already exists but covers only Quality/Mode rendering — not the items above.
- [ ] README / per-studio docs note (being added separately).
- [ ] Video Studio audit findings (see plan.md "Video Studio audit" section):
  - [ ] Broaden `VideoStudio.test.jsx`: payload assembly + `models.js` helpers + Playwright T2V→Extend / I2V end-frame.
  - [ ] Surface `inputs.examples` / `description` in the UI.
  - [ ] Logo / color by provider + family badge.
  - [ ] Dead-code removal.
  - [ ] `models.js` CI generation.
  - [ ] CSP / cookie hardening.

## One-line pattern (package studios)
```jsx
import { PublishStep } from '../../../../components/SocialPublishProvider';
// next to the existing Download action:
<PublishStep mediaUrl={url} mediaType={'image'|'video'} className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center" />
```
(App studios use `@/components/SocialPublishProvider` instead.)
