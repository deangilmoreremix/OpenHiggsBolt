# Implementation Plan: Social Publishing as a Studio "Step" (all studios except Audio)

## Overview

Add one-click **social publishing** (YouTube, Instagram, TikTok) to **every image and video studio** in the app, built on the [MuAPI Social Publishing API](https://muapi.ai/docs/social-publishing). Publishing is exposed as a natural **"Post to social" step** inside each studio's existing result panel (next to Download / Copy URL), not a separate screen. A single shared modal is mounted once and reused everywhere.

**Status:** Foundation + `PublishStep` UX delivered and typechecked. VFX, Design Agent, and Thumbnail studios are fully wired and verified; Clipping demonstrates the validated package-studio pattern. The remaining studios follow the same one-line pattern (enumerated below). Audio Studio is excluded (audio is not a supported publish target).

## UX / UI Design — the "step"

- A generated asset's result panel gains a **"Post to social"** control rendered by `<PublishStep>`:
  - Shows a `Share2` icon, the label **"Post to social"**, and the platform chips this media supports (image → Instagram only; video → YouTube + Instagram + TikTok).
  - Clicking it opens the shared `SocialPublishModal`, pre-filled with the asset URL and media type.
  - Renders nothing when there is no media URL, so it is safe to drop in unconditionally next to Download.
- The modal handles: platform picker, OAuth account connect (per platform), account select/manual id, platform-specific fields, publish + result polling, and the final post URL.
- Fits the existing dark studio theme (explicit neutral/cyan styling) so it reads as a native step in any studio, package-based or app-based.

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

## Per-studio rollout (all except Audio)

| Studio | File | Output variable | Type | Status |
|--------|------|----------------|------|--------|
| VFX | `src/apps/vfx-studio/pages/VFXGenerate.tsx` | `videoUrl` | video | ✅ done |
| Design Agent | `src/apps/design-agent/DesignAgent.tsx` | `asset.url` (image/video only) | image/video | ✅ done |
| Thumbnail | `src/apps/thumbnail-studio/ThumbnailStudio.tsx` | `lastImageUrl` | image | ✅ done |
| Clipping | `packages/studio/src/components/ClippingStudio.jsx` | `clipUrl` (per clip) | video | ✅ done (validated pattern) |
| Image | `packages/studio/src/components/ImageStudio.jsx` | `entry.url` / `selectedEntries[0].url` | image | ⬜ snippet below |
| Video | `packages/studio/src/components/VideoStudio.jsx` | result video url | video | ⬜ snippet below |
| Vibe Motion | `packages/studio/src/components/VibeMotionStudio.jsx` | `entry.url` (per card) | video | ⬜ snippet below |
| Lip Sync | `packages/studio/src/components/LipSyncStudio.jsx` | `entry.url` | video | ⬜ snippet below |
| Cinema | `packages/studio/src/components/CinemaStudio.jsx` | result image url | image | ⬜ snippet below |
| Marketing | `packages/studio/src/components/MarketingStudio.jsx` | `entry.url` | video/image | ⬜ snippet below |
| Recast / Body Swap | `packages/studio/src/components/RecastStudio.jsx` | `entry.url` (`videoUrl`/`imageUrl`) | video/image | ⬜ snippet below |
| AI Influencer | `packages/studio/src/components/AiInfluencerStudio.jsx` | `previewUrl` / `item.url` | image | ⬜ snippet below |
| Storyboard | `src/apps/storyboard/Storyboard.tsx` | shot frame url | image | ⬜ snippet below |
| **Audio** | — | — | — | ❌ excluded (not a publish target) |

### Ready-to-apply snippets (package studios)
Each: (1) add the import line at the top; (2) drop a `<PublishStep>` next to the existing Download action.

- **ImageStudio** (in the result/download card, `mediaType="image"`), **VibeMotion** (per `entry.url` card), **LipSync** (per `entry.url` card), **Recast** (per `entry.url` card, `mediaType` from `videoUrl ? 'video' : 'image'`), **AiInfluencer** (`previewUrl`, `mediaType="image"`), **Marketing** (per `entry.url`, `mediaType` from item type) — identical shape:
```jsx
import { PublishStep } from '../../../../components/SocialPublishProvider';
// next to Download:
<PublishStep mediaUrl={entry.url /* or videoUrl / previewUrl */} mediaType="video" className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10 flex items-center justify-center" />
```
- **Cinema** (`mediaType="image"` with the rendered shot url), **Video** (`mediaType="video"` with the result video url) — same import + `<PublishStep>`.
- **Storyboard**: add `PublishStep` in the shot/frame export panel using the frame image url (`mediaType="image"`), import via `@/components/SocialPublishProvider`.

## Architecture notes
- No new backend: `middleware.js` already proxies every `/api/v1/*` to `https://api.muapi.ai` and forwards `x-api-key`. All social endpoints match that rule. (The legacy `/api/social/accounts` is not proxied — the modal uses `/api/v1/social/ext/...` instead.)
- Uses the external-user OAuth flow so it works for end users without a MuAPI dashboard account.

## Checkpoints
- [x] `npx tsc --noEmit` passes (app-layer + shared components).
- [x] VFX / Design Agent / Thumbnail wired and verified in code.
- [x] Package cross-import pattern validated (Clipping compiles in the runtime bundle path).
- [ ] Apply the remaining per-studio snippets (one-liners) and smoke-test publish from two studios (one image→Instagram, one video→TikTok).
- [ ] Add unit tests for the modal (platform filtering + payload shaping) and `PublishStep` (null-url guard).

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Package studios aren't covered by app `tsc` | Low/Med | Runtime-transpiled; pattern validated on Clipping. Smoke-test after applying. |
| Instagram needs a Business account | Medium | Modal surfaces API errors; account list shows `connected:false`. |
| OAuth redirect loses studio context | Low | `redirectTo` = current origin+path; modal re-polls accounts on return. |
| Publish cost ($0.01) surprises users | Low | Add "~$0.01 / publish" hint in modal/step. |
