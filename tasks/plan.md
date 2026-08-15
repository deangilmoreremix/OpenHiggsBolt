# Implementation Plan: Social Publishing as a Studio "Step" (all studios except Audio)

## Overview

Add one-click **social publishing** (YouTube, Instagram, TikTok) to **every image and video studio** in the app, built on the [MuAPI Social Publishing API](https://muapi.ai/docs/social-publishing). Publishing is exposed as a natural **"Post to social" step** inside each studio's existing result panel (next to Download / Copy URL), not a separate screen. A single shared modal is mounted once and reused everywhere.

**Status (updated):** Foundation, `PublishStep` UX, the shared modal, AND the studio wiring are all COMPLETE and verified by grep across the repo. `<PublishStep>` is imported and rendered in every studio except Audio (see rollout table). The "~$0.01 / publish" cost hint already exists in `src/apps/social-publishing/SocialPublishing.tsx`. What remains is the live manual smoke-test, unit tests, docs, and the separate Video Studio audit (below). Audio Studio is excluded (audio is not a supported publish target).

> NOTE: An earlier plan version claimed "9 studios remaining" to be wired. That was incorrect — all studios except Audio are already wired (verified by grep). Do not re-apply wiring snippets; only the runtime smoke-test and tests remain for the publishing feature itself.

## UX / UI Design — the "step"

- A generated asset's result panel gains a **"Post to social"** control rendered by `<PublishStep>`:
  - Shows a `Share2` icon, the label **"Post to social"**, and the platform chips this media supports (image → Instagram only; video → YouTube + Instagram + TikTok).
  - Clicking it opens the shared `SocialPublishModal`, pre-filled with the asset URL and media type.
  - Renders nothing when there is no media URL, so it is safe to drop in unconditionally next to Download.
- The modal handles: platform picker, OAuth account connect (per platform), account select/manual id, platform-specific fields, publish + result polling, and the final post URL.
- Fits the existing dark studio theme (explicit neutral/cyan styling) so it reads as a native step in any studio, package-based or app-based.
- The "~$0.01 / publish" cost hint is shown in the modal/step (already implemented in `src/apps/social-publishing/SocialPublishing.tsx`).

## Files

| File | Role |
|------|------|
| `components/SocialPublishModal.tsx` | The modal: platform/media-type aware, connect + publish + poll. |
| `components/SocialPublishProvider.tsx` | Context (`useSocialPublish`), `PublishStep` (the step UI), `PublishButton` (bare). Mounts the single modal. |
| `src/lib/muapi.js` | `connectSocialAccount(apiKey, extUserId, redirectTo, platform)` now routes to the correct platform connect-url. |
| `components/StandaloneShell.js` | Studio content wrapped in `<SocialPublishProvider apiKey={apiKey}>`. |
| Per-studio files | Import `PublishStep` and place it in the result area. |

## Wiring patterns

**App-layer studios** (`src/apps/*`) — import via alias:
```tsx
import { PublishStep } from '@/components/SocialPublishProvider';
<PublishStep mediaUrl={url} mediaType={'image'|'video'} title={name} className="..." style={{...}} />
```

**Package studios** (`packages/studio/src/components/*.jsx`) — import via relative path (validated in Clipping):
```jsx
import { PublishStep } from '../../../../components/SocialPublishProvider';
<PublishStep mediaUrl={url} mediaType={'image'|'video'} className="..." />
```
(The `studio` package `main` points to `src`, so edits are live — no rebuild needed. The relative import resolves to the app's `components/` at runtime.)

## Per-studio rollout (all except Audio) — ALL DONE (verified by grep)

| Studio | File | Output variable | Type | Status |
|--------|------|----------------|------|--------|
| VFX | `src/apps/vfx-studio/pages/VFXGenerate.tsx` | `videoUrl` | video | ✅ done |
| Design Agent | `src/apps/design-agent/DesignAgent.tsx` | `asset.url` (image/video only) | image/video | ✅ done |
| Thumbnail | `src/apps/thumbnail-studio/ThumbnailStudio.tsx` | `lastImageUrl` | image | ✅ done |
| Clipping | `packages/studio/src/components/ClippingStudio.jsx` | `clipUrl` (per clip) | video | ✅ done (validated pattern) |
| Image | `packages/studio/src/components/ImageStudio.jsx` | `entry.url` / `selectedEntries[0].url` | image | ✅ done |
| Video | `packages/studio/src/components/VideoStudio.jsx` | result video url | video | ✅ done |
| Vibe Motion | `packages/studio/src/components/VibeMotionStudio.jsx` | `entry.url` (per card) | video | ✅ done |
| Lip Sync | `packages/studio/src/components/LipSyncStudio.jsx` | `entry.url` | video | ✅ done |
| Cinema | `packages/studio/src/components/CinemaStudio.jsx` + `src/apps/cinema/pages/CinemaGenerate.tsx` | result image/video url | image/video | ✅ done |
| Marketing | `packages/studio/src/components/MarketingStudio.jsx` | `entry.url` | video/image | ✅ done |
| Recast / Body Swap | `packages/studio/src/components/RecastStudio.jsx` | `entry.url` (`videoUrl`/`imageUrl`) | video/image | ✅ done |
| AI Influencer | `packages/studio/src/components/AiInfluencerStudio.jsx` | `previewUrl` / `item.url` | image | ✅ done |
| Storyboard | `src/apps/storyboard/pages/ShotEditor.tsx` | shot frame url | image | ✅ done |
| Photo Studio | `app/photo-studio/page.tsx` | photo url | image | ✅ done |
| Video Studio (app variant) | `src/apps/video-studio/pages/VideoGenerate.tsx` | result video url | video | ✅ done |
| **Audio** | — | — | — | ❌ excluded (not a publish target) |

### Ready-to-apply snippets
No longer needed — every studio above is already wired. Snippets are retained only for reference / future studios.

- **ImageStudio** (in the result/download card, `mediaType="image"`), **VibeMotion** (per `entry.url` card), **LipSync** (per `entry.url` card), **Recast** (per `entry.url` card, `mediaType` from `videoUrl ? 'video' : 'image'`), **AiInfluencer** (`previewUrl`, `mediaType="image"`), **Marketing** (per `entry.url`, `mediaType` from item type) — identical shape:
```jsx
import { PublishStep } from '../../../../components/SocialPublishProvider';
// next to Download:
<PublishStep mediaUrl={entry.url /* or videoUrl / previewUrl */} mediaType="video" className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center" />
```
- **Cinema** (`mediaType="image"` with the rendered shot url), **Video** (`mediaType="video"` with the result video url) — same import + `<PublishStep>`.
- **Storyboard**: `PublishStep` in the shot/frame export panel using the frame image url (`mediaType="image"`), import via `@/components/SocialPublishProvider`.

## Architecture notes
- No new backend: `middleware.js` already proxies every `/api/v1/*` to `https://api.muapi.ai` and forwards `x-api-key`. All social endpoints match that rule. (The legacy `/api/social/accounts` is not proxied — the modal uses `/api/v1/social/ext/...` instead.)
- Uses the external-user OAuth flow so it works for end users without a MuAPI dashboard account.

## Checkpoints
- [x] `npx tsc --noEmit` passes (app-layer + shared components).
- [x] VFX / Design Agent / Thumbnail wired and verified in code.
- [x] Package cross-import pattern validated (Clipping compiles in the runtime bundle path).
- [x] ALL studios except Audio wired and verified by grep (`<PublishStep>` imported + rendered).
- [x] "~$0.01 / publish" cost hint present in `src/apps/social-publishing/SocialPublishing.tsx`.
- [ ] Live smoke-test publish from two studios (one image→Instagram, one video→TikTok) — manual, needs running app + MuAPI OAuth key.
- [ ] Unit tests: modal platform filtering + payload shaping; `PublishStep` null-url guard. (`VideoStudio.test.jsx` exists but covers only Quality/Mode rendering.)

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Package studios aren't covered by app `tsc` | Low/Med | Runtime-transpiled; pattern validated on Clipping. Smoke-test after applying. |
| Instagram needs a Business account | Medium | Modal surfaces API errors; account list shows `connected:false`. |
| OAuth redirect loses studio context | Low | `redirectTo` = current origin+path; modal re-polls accounts on return. |
| Publish cost ($0.01) surprises users | Low | "~$0.01 / publish" hint already in modal/step. |

## Video Studio audit (separate follow-up — OPEN)
Independent of the publishing wiring; tracked here so it is not lost.
- [ ] Broaden `VideoStudio.test.jsx`: payload assembly + `models.js` helpers + Playwright T2V→Extend / I2V end-frame.
- [ ] Surface `inputs.examples` / `description` in the Video Studio UI.
- [ ] Provider logo / color by provider + model family badge.
- [ ] Remove dead code in Video Studio.
- [ ] Add `models.js` CI generation (keep model list in sync automatically).
- [ ] CSP / cookie hardening for the Video Studio surface.

## Docs note
- [ ] README / per-studio docs note for social publishing (being added separately).
