# Fork Diff: OpenHiggsBolt vs Open-Generative-AI

## Upstream

- Repo: https://github.com/Anil-matcha/Open-Generative-AI
- Scope: BYOK (Bring Your Own Key) MuAPI client. Single-user desktop/web app where users supply their own `muapi_key`. 14 studios for image, video, audio, lip-sync, cinema, workflow, etc., all powered by [MuAPI](https://muapi.ai).
- Stack: Next.js + Vite/Electron hybrid. Client-side MuAPI calls with optional Electron local-inference providers (sd.cpp, Wan2GP).

## Local fork

- Repo: https://github.com/deangilmoreremix/OpenHiggsBolt
- Scope: Multi-tenant studio platform. Users authenticate via Clerk; tenant/workspace state lives in Supabase. Adds CutAI (script-to-storyboard), brand management, design agent, photo studio, VFX studio, storyboard, social publishing, and workspace provisioning. MuAPI key is managed server-side; end users no longer bring their own key.

---

## Intentionally missing upstream files

| File | Reason removed |
|------|----------------|
| `packages/studio/src/components/AppsStudio.jsx` | Template-app marketplace page (AI Headshot Studio, Nano Banana Studio, etc.). Fork scope is an internal multi-tenant studio, not a white-label template catalog. |
| `packages/studio/src/components/MobileGenerationActions.jsx` | Mobile-specific generation UI. Fork consolidated generation actions into per-studio components. |
| `packages/studio/src/components/prompt/PromptComposer.jsx` | Upstream prompt-composer UI. Fork uses per-studio prompt handling (`CinemaStudio.jsx`, `ImageStudio.jsx`, etc.) and the new `src/apps/storyboard` prompt pipeline. |
| `packages/studio/src/components/prompt/README.md` | Documentation for the removed PromptComposer. |
| `packages/studio/src/persistKey.js` | Upstream local-storage API-key persistence. Replaced by Clerk auth + Supabase-backed user records; the fork no longer stores raw MuAPI keys client-side. |
| `packages/studio/src/utils/formatError.js` | Upstream error-formatting helper. Fork uses different error-handling patterns (server-side route error shaping + client toast messages). |
| `app/api/v1/upload-binary/route.js` | Dead duplicate. The in-repo `app/api/upload-binary/route.js` comment notes it had no client callers and was removed. |
| `docs/assets/video-23-thumbnail-v2.png` | Orphaned doc asset not referenced by any fork documentation. |
| `docs/assets/video-23-thumbnail.png` | Orphaned doc asset. |
| `thumbnail-ai-v2-1920x1080.png` | Orphaned root-level asset. |
| `thumbnail.png` | Orphaned root-level asset. |
| `video-27-minimax-hailuo-h3-guide-v3.png` | Orphaned root-level asset. |

### Verification of user-queried files

| Upstream file | Present in fork? | Verdict |
|---------------|------------------|---------|
| `packages/studio/src/muapi.js` | Yes (modified) | Needed — core MuAPI client used by `packages/studio`. |
| `src/lib/uploadHistory.js` | Yes (unchanged) | Needed — imported by `src/components/UploadPicker.js`. |
| `src/lib/pendingJobs.js` | Yes (unchanged) | Needed — imported by `src/components/VideoStudio.js`, `ImageStudio.js`, `LipSyncStudio.js`. |
| `src/lib/localInferenceClient.js` | Yes (unchanged) | Needed — imported by `src/components/VideoStudio.js`, `ImageStudio.js`, `SettingsModal.js`, `LocalModelManager.js`. |
| `src/lib/localModels.js` | Yes (unchanged) | Needed — imported by `src/components/VideoStudio.js`, `ImageStudio.js`, `localInferenceClient.js`. |
| `src/lib/promptUtils.js` | Yes (unchanged) | Needed — imported by `src/components/CameraControls.js`, `CinemaStudio.js`, `ImageStudio.js`. |
| `packages/studio/src/components/AppsStudio.jsx` | **No** | Removed — template marketplace out of scope (see table above). |

---

## New files / directories in this fork

### Auth & multi-tenancy
- `middleware.js` — Clerk middleware with security headers and MuAPI passthrough rewrite.
- `app/sign-in/[[...sign-in]]/page.js`, `app/sign-up/[[...sign-up]]/page.js`, `app/sign-in/page.js`, `app/sign-up/page.js`
- `app/forgot-password/page.js`
- `clerkAppearance.js`
- `app/api/webhooks/clerk/route.ts`
- `app/api/auth/muapi-key/route.ts`, `app/api/auth/whoami/route.ts`
- `components/landing/` (`AuthShell.js`, `DemoStage.js`, `LandingAuthControls.js`, `LandingPage.js`, `LandingPageClient.js`, `landingData.js`)
- `supabase/migrations/20260709153700_create_users_table.sql`
- `app/actions/tenant.js`

### New studio apps (under `src/apps/` and `app/`)
- `src/apps/cinema/` — Cinema studio pages.
- `src/apps/design-agent/` — Design agent UI.
- `src/apps/social-publishing/` — Social publishing UI.
- `src/apps/storyboard/` — Full storyboard tool (canvas, camera controls, timeline, export).
- `src/apps/thumbnail-studio/` — Thumbnail studio.
- `src/apps/vfx-studio/` — VFX studio.
- `app/brand-studio/`, `app/brand/[id]/`, `app/campaign/[id]/` — Brand management.
- `app/photo-studio/` — Photo studio.
- `app/vfx/` — VFX pages.
- `app/account/` — User account page.

### New API routes
- `app/api/design-agent/` (approve, assets, chat, jobs, run-skill, sessions, skills)
- `app/api/photo-studio/route.ts`
- `app/api/storyboard/[[...path]]/route.ts`
- `app/api/thumbnail/route.js`
- `app/api/vfx/` (generate, status, cancel, upload)
- `app/api/brand/`, `app/api/brands/`
- `app/api/workspace/provision/route.ts`

### CutAI app
- `apps/cutai/backend/` — Python/FastAPI backend (projects, scenes, scripts, storyboard routers + LLM/image services).
- `apps/cutai/frontend/` — Vite + React frontend (script editor, storyboard canvas, timeline, analysis panels).

### Other additions
- `e2e/` — Playwright E2E suite.
- `tests/` — Unit tests.
- `hooks/useVideoGeneration.js`
- `lib/muapi.js` — Additional MuAPI client focused on VFX (`generateVFX`, `pollGeneration`, etc.).
- `scripts/invite-users.mjs`
- `docs/superpowers/` — Planning and design docs.

---

## Scope difference summary

| Dimension | Upstream | Fork |
|-----------|----------|------|
| Auth | BYOK — user supplies `muapi_key` client-side | Clerk (SSR) + Supabase users table. Server-side key management. |
| Tenancy | Single-user desktop/web app | Multi-tenant workspaces with Clerk orgs + Supabase. |
| App surface | 14 MuAPI-powered studios + Electron local-inference | All upstream studios **plus** CutAI, Design Agent, Photo Studio, Brand Studio, Storyboard, VFX Studio, Social Publishing, Workspace provisioning. |
| Backend | Thin Next.js API routes + middleware rewrite to `api.muapi.ai` | Rich Next.js route layer (`app/api/design-agent`, `app/api/vfx`, `app/api/storyboard`, etc.) plus CutAI Python backend. |
| Key persistence | `localStorage` (`persistKey.js`) | Supabase-backed user record; `localStorage` no longer stores raw API keys. |

---

## `app/api/api/v1/[[...path]]/route.js` usage audit

- **Purpose**: Proxies `/api/api/v1/*` → `https://api.muapi.ai/api/v1/*`. The comment states this exists because the AiAgent library hardcodes a double `/api/api` prefix.
- **Client references**: A codebase-wide search for `/api/api/v1/` found **zero** client-side fetch/axios calls to that path. The only match is the explanatory comment inside the route file itself.
- **Middleware interaction**: `middleware.js` already rewrites **all** `/api/v1/*` traffic directly to `https://api.muapi.ai` (lines 65-87). This means the `[[...path]]` route is only reached if a request explicitly uses the double `/api/api/v1/` prefix.
- **Verdict**: The route is preserved from upstream as a safety net for the AiAgent library. It is not directly invoked by any verified client code in the fork. If the AiAgent submodule (`packages/Open-Poe-AI`) is ever confirmed to no longer emit double-prefixed URLs, this route can be considered dead code.
