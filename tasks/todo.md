# Social Publishing — Task Checklist (all studios except Audio)

## Foundation (DONE)
- [x] `components/SocialPublishModal.tsx` — platform/media-type aware modal.
- [x] `components/SocialPublishProvider.tsx` — `useSocialPublish` + `PublishStep` (the "step" UI) + `PublishButton`.
- [x] `components/StandaloneShell.js` — wrap studio content in `SocialPublishProvider`.
- [x] `src/lib/muapi.js` — `connectSocialAccount` accepts `platform`.
- [x] `npx tsc --noEmit` passes.

## Wired & verified (DONE)
- [x] VFX Studio (`src/apps/vfx-studio/pages/VFXGenerate.tsx`) — video.
- [x] Design Agent (`src/apps/design-agent/DesignAgent.tsx`) — image/video asset modal.
- [x] Thumbnail Studio (`src/apps/thumbnail-studio/ThumbnailStudio.tsx`) — image.
- [x] Clipping (package) — `clipUrl` per clip (validated cross-import pattern).

## Remaining studios (one-line pattern; see plan.md)
- [ ] Image Studio — `entry.url`, image.
- [ ] Video Studio — result video url, video.
- [ ] Vibe Motion — `entry.url`, video.
- [ ] Lip Sync — `entry.url`, video.
- [ ] Cinema — result image url, image.
- [ ] Marketing — `entry.url`, video/image.
- [ ] Recast / Body Swap — `entry.url` (`videoUrl`/`imageUrl`), video/image.
- [ ] AI Influencer — `previewUrl`, image.
- [ ] Storyboard — shot frame url, image.
- [ ] Audio Studio — EXCLUDED (audio not a publish target).

## Polish
- [ ] Smoke-test: publish image→Instagram and video→TikTok from two studios.
- [ ] "~$0.01 / publish" hint in modal/step.
- [ ] Unit tests: modal platform filtering + payload shaping; `PublishStep` null-url guard.
- [ ] Docs note in README + per-studio help.

## One-line pattern (package studios)
```jsx
import { PublishStep } from '../../../../components/SocialPublishProvider';
// next to the existing Download action:
<PublishStep mediaUrl={url} mediaType={'image'|'video'} className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center" />
```
(App studios use `@/components/SocialPublishProvider` instead.)
