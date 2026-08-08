# Studio Audit & Comparison — Upstream vs. This Repo

**Upstream:** `Anil-matcha/Open-Generative-AI` (`main`, commit `d4fb7ee`, audited 2026-07-11)
**This repo:** `OpenHiggsBolt` (fork, rebranded "SmartVideo GO", branch `darkened-friction`)

## Method

- Enumerated upstream `app/` routes and the shared `packages/studio` component library.
- Enumerated the upstream `StandaloneShell` studio tab list (the user-facing "studios").
- Compared against this repo's `StandaloneShell`, `packages/studio/src/components/`, and top-level `app/` route groups.
- A "studio" = a tab in `StandaloneShell` and/or a component in `packages/studio/src/components/`.

## 1. Upstream inventory (canonical)

**Shell tabs (14)** from `components/StandaloneShell.js`:
`image, video, audio, clipping, vibe-motion, lipsync, body-swap, cinema, marketing, workflows, agents, design-agent, apps, ai-influencer`

**Library components (15)** exported from `packages/studio/src/index.js`:
`ImageStudio, VideoStudio, ClippingStudio, VibeMotionStudio, LipSyncStudio, RecastStudio, CinemaStudio, AudioStudio, MarketingStudio, WorkflowStudio, AgentStudio, DesignAgentStudio, AppsStudio, McpCliStudio, AiInfluencerStudio`
(plus non-tab helpers `DrawModal`, `WorkflowUI`)

Note: `McpCliStudio` (MCP & CLI) is **exported but not wired as a tab** in the upstream shell.

**Upstream top-level `app/` routes:** `agents, assistant, studio, workflow` (+ `api`).

## 2. This repo inventory

**Shell tabs (18)** from `components/StandaloneShell.js`:
`image, video, audio, clipping, vibe-motion, lipsync, cinema, storyboard, marketing, recast, workflows, agents, design-agent, vfx-studio, thumbnail-studio, apps, ai-influencer, social-publishing`
(plus `brand-studio`, which redirects to the `/brand-studio` route).

**Library components:** identical 15 as upstream **+** `CostEstimator.jsx` (local-only file, not exported from `index.js`).

**Local top-level `app/` routes:** `agents, api, asset, assistant, brand, brand-studio, campaign, photo-studio, studio, vfx, workflow`.

## 3. Side-by-side comparison

| # | Studio | Upstream tab | This repo tab | Component source | Status |
|---|--------|:---:|:---:|---|---|
| 1 | Image Studio | ✅ `image` | ✅ `image` | `packages/studio` (shared) | MATCH |
| 2 | Video Studio | ✅ `video` | ✅ `video` | shared | MATCH |
| 3 | Audio Studio | ✅ `audio` | ✅ `audio` | shared | MATCH |
| 4 | AI Clipping | ✅ `clipping` | ✅ `clipping` | shared | MATCH |
| 5 | Vibe Motion | ✅ `vibe-motion` | ✅ `vibe-motion` | shared | MATCH |
| 6 | Lip Sync | ✅ `lipsync` | ✅ `lipsync` | shared | MATCH |
| 7 | Body Swap / Recast | ✅ `body-swap` | ✅ `recast` | shared (`RecastStudio`) | MATCH (slug renamed `body-swap`→`recast`) |
| 8 | Cinema Studio | ✅ `cinema` | ✅ `cinema` | shared | MATCH |
| 9 | Marketing Studio | ✅ `marketing` | ✅ `marketing` | shared | MATCH |
| 10 | Workflows | ✅ `workflows` | ✅ `workflows` | shared (`WorkflowStudio`) | MATCH |
| 11 | Agents | ✅ `agents` | ✅ `agents` | shared (`AgentStudio`) | MATCH |
| 12 | Design Agent | ✅ `design-agent` (label "Design Agent") | ✅ `design-agent` (label "Design Agent AI") | shared | MATCH (label tweak) |
| 13 | Explore Apps | ✅ `apps` | ✅ `apps` | shared (`AppsStudio`) | MATCH |
| 14 | AI Influencer Studio | ✅ `ai-influencer` | ✅ `ai-influencer` | shared | MATCH |
| 15 | MCP & CLI | ⚠️ exported, not wired as a tab | ❌ removed from repo | — (n/a) | **REMOVED in this repo (deliberate divergence)** |
| 16 | Storyboard | ❌ absent | ✅ `storyboard` | `src/apps/storyboard/Storyboard` | **LOCAL NEW** |
| 17 | VFX Studio | ❌ absent | ✅ `vfx-studio` | `src/apps/vfx-studio/VFXStudio` | **LOCAL NEW** |
| 18 | Thumbnail Studio | ❌ absent | ✅ `thumbnail-studio` | `src/apps/thumbnail-studio/ThumbnailStudio` | **LOCAL NEW** |
| 19 | Social Publishing | ❌ absent | ✅ `social-publishing` | `src/apps/social-publishing/SocialPublishing` | **LOCAL NEW** |
| 20 | Brand Studio | ❌ absent | route `/brand-studio` | `app/brand-studio/page.tsx` | **LOCAL NEW (route)** |
| 21 | Photo Studio | ❌ absent | route `/photo-studio` | `app/photo-studio/page.tsx` (bespoke, `/api/photo-studio`) | **LOCAL NEW (route)** |
| 22 | Cost Estimator | ❌ absent | component only | `packages/studio/src/components/CostEstimator.jsx` | **LOCAL NEW (component, not tabbed)** |

## 4. Local-only additions (not in upstream)

- **Shell tabs:** Storyboard, VFX, Thumbnail Studio, Social Publishing (4 net-new tabs).
- **Standalone routes (feature wrappers around studios):**
  - `app/photo-studio` — bespoke product-photography generator (brand-linked, `/api/photo-studio`). Conceptually overlaps Image Studio but is a separate app.
  - `app/brand-studio` — Brand-DNA extractor landing → `/brand/[id]`.
  - `app/brand/[id]`, `app/campaign/[id]`, `app/asset/[id]` — brand/campaign/asset detail pages.
  - `app/vfx` — redirect to `/studio/vfx-studio`.
- **Extra `src/apps` modules:** `cinema`, `design-agent`, `social-publishing`, `storyboard`, `thumbnail-studio`, `vfx-studio`, `video-studio` (local app implementations backing the new tabs).
- **Extra API routes:** `design-agent`, `storyboard`, `thumbnail`, `vfx`, `webhooks` (upstream only had `agents, api, app, upload-binary, v1, workflow`).
- **Extra studio-library component:** `CostEstimator.jsx`.

## 5. Deltas / changes vs upstream

- **No upstream studio is missing** in this repo — all 14 upstream tabs + the 15 library components are present.
- **Slug change:** upstream `body-swap` → local `recast` (same `RecastStudio`).
- **Label change:** upstream "Design Agent" → local "Design Agent AI".
- **MCP & CLI:** Upstream retains `McpCliStudio` (exported, unwired as a tab). **This repo has removed it entirely** — component file, library export, `dist` build, `src/` standalone entry, header nav, i18n strings, and README references all deleted.

## 6. Verdict

This repo retains every upstream studio **except MCP & CLI, which has been deliberately removed**, and adds four new shell tabs (Storyboard, VFX, Thumbnail Studio, Social Publishing), a Brand Studio + Photo Studio feature surface, and a Cost Estimator component.

**Recommended follow-ups:**
1. ~~Expose `McpCliStudio` (MCP & CLI) as a tab.~~ **Done: removed entirely from this repo** (component, export, dist, standalone entry, nav, i18n, README). This is a deliberate divergence from upstream, which still keeps the unwired component.
2. Decide if Photo Studio should reuse `ImageStudio` instead of a separate bespoke implementation to reduce drift.
3. Document the new `src/apps/*` studios in the README so they are discoverable alongside the upstream set.
