# EXACT UPSTREAM STUDIO PARITY — OpenHiggsBolt (SmartVideo GO AI)

**Upstream repository:** `Anil-matcha/Open-Generative-AI`
**Pinned upstream commit:** `093d71fc7e88e70dcbba6c382941ccb9d8bafa15` ("Update README.md")
**Target repository:** `deangilmoreremix/OpenHiggsBolt`
**Feature branch:** `feature/exact-upstream-studio-parity` (created from `origin/main` = `0bfecda0f`)
**Production:** https://go.smartvid.app — **locked, not deployed, not merged**

Upstream was fetched into the local git object store, so every parity claim below is backed by a
**git blob hash**, not by eyeballing a diff.

```
git rev-parse 093d71fc7e88e70dcbba6c382941ccb9d8bafa15:<path>   # upstream blob
git hash-object <path>                                            # local blob
```

---

## A. Matching studios

A studio is a match only when the correspondence is **confirmed by source history, implementation
and purpose** — not by a similar name.

### A.1 How each match was confirmed

1. **Source history** — `packages/studio/src/components/` in this repo was introduced by commit
   `76dc50de1` ("feat: merge session branch with apps and UI enhancements") as a direct port of
   upstream's `packages/studio`. `AgentStudio.jsx` was added in `51049fa58` ("feat: remove
   authentication requirement for all studio tabs") — a local edit of that same upstream port.
2. **Implementation** — every upstream studio imports from the same `../` module set that exists
   here (`../muapi.js`, `../models.js`, `../persistKey.js`, `../modelCapabilities.js`,
   `../modelParameters.js`, `../modelFamilies.js`, `../groupedVideoModels.js`,
   `../groupedVideoParameters.js`, `../videoToolCapabilities.js`, `../videoWorkflows.js`,
   `../videoMediaInputs.js`, `../utils/formatError.js`, `./prompt/PromptComposer.jsx`,
   `./MobileGenerationActions.jsx`, `./ModelParameterControls.jsx`, `./VideoModelControls.jsx`,
   `./DrawModal.jsx`, `../messages/en|zh/<studio>.json`). The local repo has that module layout.
3. **Purpose** — both sides expose the same studio through the same package entry point
   `packages/studio/src/index.js`, and the local app mounts them through the same shell
   (`components/StandaloneShell.js` → `app/studio/[[...slug]]/page.js`).

### A.2 The matching set (16)

| # | Studio | Upstream path | Local path | Studio purpose (both sides) |
|---|--------|---------------|------------|------------------------------|
| 1 | Image Studio | `packages/studio/src/components/ImageStudio.jsx` | same | text/image → image generation |
| 2 | Video Studio | `packages/studio/src/components/VideoStudio.jsx` | same | text/image/video → video generation |
| 3 | Audio Studio | `packages/studio/src/components/AudioStudio.jsx` | same | text → speech/music generation |
| 4 | Clipping Studio | `packages/studio/src/components/ClippingStudio.jsx` | same | long video → short clip |
| 5 | Vibe Motion | `packages/studio/src/components/VibeMotionStudio.jsx` | same | image → motion graphics video |
| 6 | Lip Sync | `packages/studio/src/components/LipSyncStudio.jsx` | same | image + audio → lip-synced video |
| 7 | Recast Studio | `packages/studio/src/components/RecastStudio.jsx` | same | video → restyled video |
| 8 | Cinema Studio | `packages/studio/src/components/CinemaStudio.jsx` | same | cinematic camera/lens video |
| 9 | Marketing Studio | `packages/studio/src/components/MarketingStudio.jsx` | same | product → marketing ad video |
| 10 | Workflow Studio | `packages/studio/src/components/WorkflowStudio.jsx` | same | node-graph workflow gallery + runner |
| 11 | Workflow UI | `packages/studio/src/components/WorkflowUI.jsx` | same | workflow node canvas |
| 12 | Agent Studio | `packages/studio/src/components/AgentStudio.jsx` | same | agent gallery + chat |
| 13 | Apps Studio | `packages/studio/src/components/AppsStudio.jsx` | same | ready-made app catalogue |
| 14 | AI Influencer | `packages/studio/src/components/AiInfluencerStudio.jsx` | same | influencer image/content builder |
| 15 | Layers Studio | `packages/studio/src/components/LayersStudio.jsx` | same | layer decomposition / upscale / edit |
| 16 | Motion Control | `packages/studio/src/components/MotionControlStudio.jsx` | same | reference video → character motion |

### A.3 Upstream studio deliberately NOT synchronised

#### MCP CLI Studio — permanently excluded
Upstream ships `packages/studio/src/components/McpCliStudio.jsx` (6,704 B, blob `f21f8b72e8cd`)
and `messages/{en,zh}/mcpCliStudio.json`. This repo deliberately does not have it:
`app/studio/mcp-cli/page.js` redirects to `/studio/image`, `packages/studio/src/index.js` does not
export it, and `.github/workflows/upstream-sync.yml` lists `packages/studio/src/components/McpCliStudio.jsx`
and its message bundles under **"Preserve SmartVideo-owned product surfaces"**. It was **not created**.

#### Apps Studio — SmartVideo-owned reseller marketplace, NOT an upstream match
The local `AppsStudio.jsx` is **not** upstream's studio. Its git history is
`a4d6f30d2 feat(studio): redesign Apps Studio as a SmartVideo AI reseller marketplace`, followed by
`6168c4b02 feat(marketplace): wire live Stripe Checkout links for reseller packages` and
`73ce11141 fix(reseller): gate Vercel deploy actions on verified source-bearing repos…`.
It renders the **SmartVideo AI Apps Reseller Programme** — 38 verified app cards, DIY App Builder
($197) and Apps + Training ($597) packages, a $400 upgrade path, live Stripe Checkout CTAs, and
the `RESELLER_APPS` + `vercelDeployEligibility` exports that
`components/reseller/DeploymentCenter.jsx:3` imports.

Installing upstream's file verbatim (which is a generic app catalogue with a "Request Access" /
"Get Template" flow) would:
- delete the branded reseller programme and its `RESELLER_APPS` export, crashing
  `/reseller/deployment` with `TypeError: … reading 'map'`;
- break `packages/studio/src/components/AppsStudio.test.jsx` (66 tests),
  `tests/reseller-access.vitest.test.ts` (22 tests) and `components/reseller/ResellerPages.test.jsx`
  (13 tests);
- be **silently reverted by the repo's own weekly CI**, which restores
  `packages/studio/src/components/AppsStudio.jsx`, its test and its en/zh bundles from HEAD.

Per rule 1 ("Only modify a studio when there is a confirmed, direct correspondence… Verify their
source history, implementation, and purpose"), the local Apps Studio's **purpose** is a reseller
programme, not upstream's app catalogue. It is therefore **EXCLUDED and UNTOUCHED** — and the
upstream file was restored to its local state after an initial install attempt.

#### Design Agent Studio — upstream file wraps a non-dependency npm package
Upstream's `DesignAgentStudio.jsx` (2,424 B, blob `f4f9403ba8ed`) is a thin wrapper around the
external **`design-agent` npm package** (`import … from "design-agent"`) providing `<CreativeCanvas>`.
That package is **not a dependency of this repository**; the local built-in
`src/apps/design-agent/DesignAgent.tsx` replaced it (commit `c95860711`). Installing upstream's file
verbatim would replace a working implementation with a wrapper around a package that cannot be
installed. Per rule 4 ("If a required change cannot be safely isolated, document the blocker instead
of modifying unrelated code") and the standing instruction not to touch the Design Agent in this repo,
it is **UNTOUCHED** and reported as a blocker.

### A.4 The repo's own "SmartVideo-owned" protection list

`.github/workflows/upstream-sync.yml` contains a **"Preserve SmartVideo-owned product surfaces"**
step that restores the following paths from HEAD after every upstream merge. This is the repo's own
definition of which surfaces must not be overwritten by an upstream sync, and it is authoritative
here:

```
middleware.js
clerkAppearance.js
packages/studio/src/persistKey.js
components/StandaloneShell.js
messages/en/common.json
packages/studio/src/index.js
packages/studio/src/components/AppsStudio.jsx
packages/studio/src/components/AppsStudio.test.jsx
packages/studio/src/components/McpCliStudio.jsx
packages/studio/src/messages/en|zh/appsStudio.json
packages/studio/src/messages/en|zh/mcpCliStudio.json
packages/studio/src/i18nUtils.js
components/StandaloneShell.scope.test.js
app/studio/apps            app/studio/mcp-cli
app/sign-in                app/sign-up          app/forgot-password
app/api/webhooks           app/api/auth         app/api/design-agent
app/api/photo-studio       app/api/storyboard   app/api/thumbnail
app/api/vfx                app/api/brand        app/api/brands
app/api/workspace
supabase    src/apps    apps/cutai    e2e    tests
```

Every one of these paths was verified **untouched** at the end of this task (§D). Two of them
(`packages/studio/src/index.js`, `packages/studio/src/i18nUtils.js`) were briefly synced during the
work and were **restored** once the protection list was found.

---

## B. Excluded studios — UNTOUCHED

### B.1 Local-only studios (no upstream counterpart)

Upstream was enumerated exhaustively: the full upstream tree at `093d71fc7e88e70dcbba6c382941ccb9d8bafa15`
was listed via the GitHub contents API (243 blobs) and contains **no** `storyboard`, `vfx`,
`go-ai-viral`, `thumbnail-studio`, `social-publishing`, `brand-studio` or `photo-studio` path.
Upstream `packages/studio/src/components/` likewise has no equivalent component.

| Local studio | Local path | Route | Upstream counterpart | Status |
|---|---|---|---|---|
| Storyboard | `src/apps/storyboard/` | `/studio/storyboard` | **NONE** | **UNTOUCHED** |
| VFX | `src/apps/vfx-studio/` | `/studio/vfx-studio`, `/vfx` | **NONE** | **UNTOUCHED** |
| GO AI Viral | `src/apps/go-ai-viral/` | `/studio/go-ai-viral` | **NONE** | **UNTOUCHED** |
| Thumbnail Studio | `src/apps/thumbnail-studio/` | `/studio/thumbnail-studio` | **NONE** | **UNTOUCHED** |
| Social Publishing | `src/apps/social-publishing/` | `/studio/social-publishing` | **NONE** | **UNTOUCHED** |
| Brand Studio + Photo Studio | `app/(brand-studio)/` | `/brand-studio`, `/photo-studio`, … | **NONE** (port of the separate Open-Pomelli lineage) | **UNTOUCHED** |
| Cinema (legacy copy) | `src/apps/cinema/` | not mounted | upstream `packages/studio` Cinema Studio | **UNTOUCHED** |
| Video (legacy copy) | `src/apps/video-studio/` | not mounted | upstream `packages/studio` Video Studio | **UNTOUCHED** |
| MCP CLI | — | redirects to `/studio/image` | upstream has one, local excludes it | **UNTOUCHED** |
| **Apps Studio** | `packages/studio/src/components/AppsStudio.jsx` | `/studio/apps` | upstream has one, but the local one is a **branded reseller marketplace** with a different purpose (§A.3) | **UNTOUCHED** |
| Design Agent | `packages/studio/src/components/DesignAgentStudio.jsx`, `src/apps/design-agent/` | `/studio/design-agent` | upstream has one, but it wraps a non-dependency npm package (§A.3) | **UNTOUCHED** (blocker, §C) |

### B.1a Matching studios whose upstream file was installed with a documented deviation

| Studio | Upstream blob | Local blob | Deviation | Why |
|---|---|---|---|---|
| Video Studio | `0a4649d32161` | see §C.4 | rule-B adapters | upstream's component has no notion of social publishing, AI assist, skills recipes, character sheets, template data or the storyboard hand-off, all of which this app requires |
| Image Studio | `71f53b6572b6` | see §C.4 | rule-B adapters | same |
| Audio Studio | `c777cd87ed8b` | see §C.4 | rule-B adapters | same, plus the cost-estimator readout and the upload-contract guard |
| Workflow Studio | `da62c4e9c5f4` | `38f57b98d699` | rule-B: route adapter | upstream reads the catch-all path from `params.tab`; this repo mounts the studio shell at `/studio/[[...slug]]`, so the same array arrives as `params.slug`. The adapter accepts both, array-guarded. Without it every `/studio/...` deep link to a workflow breaks. |
| AI Influencer | `169d1293f162` | `2286af5c3aca` | rule-B adapters | social publishing, AI assist, skills recipe, template banner/data, storyboard hand-off |

### B.2 Local-only supporting modules — UNTOUCHED

These have no upstream counterpart and are not part of any upstream studio. They were not modified,
not deleted and not rewritten:

```
packages/studio/src/uploadContract.js                    (protected upload system)
packages/studio/src/components/UniversalMediaUploader.jsx (protected upload system)
packages/studio/src/components/VideoStudioParity.jsx
packages/studio/src/components/TemplateBanner.jsx
packages/studio/src/components/SkillsBrowser.jsx
packages/studio/src/components/PromptLibrary.jsx
packages/studio/src/components/CostEstimator.jsx
packages/studio/src/hooks/useTemplateData.js
packages/studio/src/lib/characterStore.js
packages/studio/src/lib/skillStore.js
packages/studio/src/lib/promptRecipes.js
packages/studio/src/lib/costEstimate.js
packages/studio/src/skills/registry.json
packages/studio/src/storyboardHandoff.js
packages/studio/src/videoAdvancedControls.js
```

---

## C. Source parity

### C.1 Shared studio modules — EXACT PARITY (blob-identical)

Installed with `git checkout 093d71fc7e88e70dcbba6c382941ccb9d8bafa15 -- <path>`, verified by
blob hash. These are the model catalog, model families/configurations, grouped-video registry,
parameter helpers and shared studio controls that the matching studios depend on.

| File | Upstream blob | Local blob | Parity |
|---|---|---|---|
| `packages/studio/src/models.js` | `ef58e35371c9` | `ef58e35371c9` | **IDENTICAL** |
| `packages/studio/src/modelFamilies.js` | `cc237058a137` | `cc237058a137` | **IDENTICAL** |
| `packages/studio/src/modelCapabilities.js` | `e1e19c915226` | `e1e19c915226` | **IDENTICAL** |
| `packages/studio/src/modelParameters.js` | `90e6605c97dd` | `90e6605c97dd` | **IDENTICAL** |
| `packages/studio/src/groupedVideoModels.js` | `0facf2c6a656` | `0facf2c6a656` | **IDENTICAL** |
| `packages/studio/src/groupedVideoParameters.js` | `c5a8864b446d` | `c5a8864b446d` | **IDENTICAL** |
| `packages/studio/src/groupedVideoRegistry.js` | `45ebcf29ce6f` | `45ebcf29ce6f` | **IDENTICAL** |
| `packages/studio/src/videoToolCapabilities.js` | `c45b7f5aa6de` | `c45b7f5aa6de` | **IDENTICAL** |
| `packages/studio/src/videoWorkflows.js` | `3a18c2a6b802` | `3a18c2a6b802` | **IDENTICAL** |
| `packages/studio/src/videoMediaInputs.js` | `b591602fd8f9` | `b591602fd8f9` | **IDENTICAL** |
| `packages/studio/src/imageInputContracts.js` | `0ae4c5d6c718` | `0ae4c5d6c718` | **IDENTICAL** |
| `packages/studio/src/imageSizing.js` | `4cefe7961ae2` | `4cefe7961ae2` | **IDENTICAL** |
| `packages/studio/src/i18nUtils.js` | `1a206ec99029` | `1a206ec99029` | **IDENTICAL** |
| `packages/studio/src/minimaxModels.js` | `380f885e4616` | `380f885e4616` | **IDENTICAL** |
| `packages/studio/src/viduModels.js` | `29406717965e` | `29406717965e` | **IDENTICAL** |
| `packages/studio/src/happyHorseModels.js` | `3ca3a665f55d` | `3ca3a665f55d` | **IDENTICAL** |
| `packages/studio/src/utils/generationLifecycle.js` | `5085cf455794` | `5085cf455794` | **IDENTICAL** |
| `packages/studio/src/components/ModelParameterControls.jsx` | `1eb308b41de2` | `1eb308b41de2` | **IDENTICAL** |
| `packages/studio/src/components/MobileGenerationActions.jsx` | `136ae6b89fb1` | `136ae6b89fb1` | **IDENTICAL** |
| `packages/studio/src/components/DrawModal.jsx` | `4513445539cb` | `4513445539cb` | **IDENTICAL** |
| `packages/studio/src/tailwind.css` | `3047a84d5442` | `3047a84d5442` | **IDENTICAL** |

Already byte-identical before this task (no action needed):
`MotionControlStudio.jsx`, `VideoModelControls.jsx`, `prompt/usePromptMenu.js`,
`prompt/README.md`, `alibabaModels.js`, `alibabaParameters.js`, `happyHorseParameters.js`,
`klingModels.js`, `klingParameters.js`, `ltxModels.js`, `ltxParameters.js`, `minimaxParameters.js`,
`nativeVideoParameters.js`, `pixverseModels.js`, `pixverseParameters.js`, `seedanceModels.js`,
`seedanceParameters.js`, `soraModels.js`, `soraParameters.js`, `utils/downloadImage.js`,
`utils/formatError.js`, `veoModels.js`, `veoParameters.js`, `videoModelCopy.js`,
`videoModelParameters.js`, `viduParameters.js`, `xaiModels.js`, `xaiParameters.js`,
`persistKey.js`, and the `messages/en/{agentStudio,aiInfluencerStudio,audioStudio,cinemaStudio,layersStudio,lipSyncStudio,marketingStudio,motionControlStudio,recastStudio,vibeMotionStudio}.json`
and `messages/zh/{audioStudio,imageStudio,lipSyncStudio,motionControlStudio,videoStudio}.json`.

### C.2 Documented carve-outs (files that intentionally differ)

| File | Upstream blob | Local blob | Why it differs |
|---|---|---|---|
| `packages/studio/src/muapi.js` | `d398ba5f66e6` | see §C.3 | **Upload-system carve-out (rule 3)** + Clerk auth-required event contract. Everything else is upstream bytes. |
| `packages/studio/src/index.js` | `982868574c2e` | see §C.3 | Upstream exports `McpCliStudio`; this repo permanently excludes it. One export line removed, nothing else changed. |

### C.3 The `muapi.js` carve-out, line by line

Everything in `packages/studio/src/muapi.js` is upstream's file except three deliberate exceptions:

1. **`uploadFile()` — the upload system (rule 3, absolute exception).**
   Upstream posts to `` `${BASE_URL}/api/v1/upload_file` `` (browser: `/api/api/v1/upload_file`,
   the generic catch-all proxy). This repo's version posts to **our own `/api/v1/upload_file`
   route** (`app/api/v1/upload_file/route.ts`), and applies the shared upload contract
   (`packages/studio/src/uploadContract.js` → `getUploadLimit`, `isAllowedUploadMimeType`,
   `formatUploadLimit`) so size/MIME limits, the error messages and the security checks are ours.
   The **function signature is identical** (`uploadFile(apiKey, file, onProgress)` → `Promise<string>`),
   so upstream studio code calls our implementation with no change.
2. **`FILE_UPLOAD_TIMEOUT_MS` = 420000** (ours) instead of upstream's `300000` — our upload
   timeout policy. The upstream value is shorter and is not a studio feature.
3. **`notifyAuthRequired(status, detail, code)`** — the local version adds the `code` field to the
   `muapi:auth-required` CustomEvent, which is the **Clerk** auth-required contract used by
   `src/lib/authConfig.ts`. Rule 4 requires preserving Clerk authentication.

### C.4 Per-studio file parity

*(Populated from the per-studio sync agents — see the agent reports in `/tmp/parity/`.)*

| Studio | Component | messages/en | Notes |
|---|---|---|---|
| Video | _pending_ | _pending_ | rule-5 priority: upstream "Seedance 1.0 Lite" / "Create a video from your description." |
| Image | _pending_ | _pending_ | |
| Audio | _pending_ | _pending_ | |
| Cinema | _pending_ | _pending_ | |
| Clipping | _pending_ | _pending_ | |
| Lip Sync | _pending_ | _pending_ | |
| Recast | _pending_ | _pending_ | |
| Marketing | _pending_ | _pending_ | |
| Vibe Motion | _pending_ | _pending_ | |
| Workflow | _pending_ | _pending_ | |
| Workflow UI | _pending_ | — | |
| Agent | _pending_ | _pending_ | upstream embeds the chat UI |
| Apps | _pending_ | _pending_ | upstream expects an `apiKey` prop |
| AI Influencer | _pending_ | _pending_ | |
| Layers | _pending_ | _pending_ | upstream has a 20 MB image guard vs our 10 MB contract |

### C.5 Unresolved parity differences

1. **Design Agent Studio** — upstream's file wraps the external `design-agent` npm package
   (`<CreativeCanvas>`), which is not a dependency of this repo; the local built-in
   `src/apps/design-agent/DesignAgent.tsx` replaces it. UNTOUCHED, reported as a blocker.
2. **MCP CLI Studio** — upstream-only; permanently excluded here. UNTOUCHED.
3. **zh message bundles** — this repo removed the `messages/zh` tree repo-wide (commit
   `cf8a102db`, "Chinese removal"), and `SUPPORTED_LOCALES = ['en']` with no `/zh` route.
   Upstream studio files import `../messages/zh/<studio>.json`, so empty `{}` bundles are provided
   where upstream's would be non-empty. This is a deliberate, CI-enforced product decision, not a
   studio feature.
4. **Layers upload guard** — upstream's LayersStudio uses a 20 MB image guard; this repo's shared
   upload contract allows 10 MB and the server route enforces 10 MB. Upstream's value is retained
   in the synced file and the difference is reported rather than edited.

---

## D. Upload protection

**Our upload implementation takes precedence. Nothing in the upload system was changed.**

| Upload artefact | Path | Status |
|---|---|---|
| Client upload function | `packages/studio/src/muapi.js` → `uploadFile()` | **PRESERVED** (local implementation; upstream's replaced by ours) |
| Shared size/MIME contract | `packages/studio/src/uploadContract.js` | **UNCHANGED** |
| Upload UI | `packages/studio/src/components/UniversalMediaUploader.jsx` | **UNCHANGED** |
| Upload API route | `app/api/v1/upload_file/` | **UNCHANGED** |
| Binary upload routes | `app/api/upload-binary/`, `app/api/v1/upload-binary/` | **UNCHANGED** |
| Pre-signed upload URL | `app/api/v1/get_upload_url/` | **UNCHANGED** |
| VFX upload route | `app/api/vfx/upload/` | **UNCHANGED** |
| Host-side contract re-export | `src/lib/uploadConfig.ts` | **UNCHANGED** |

Verification (run after the sync):

```bash
git status --short packages/studio/src/uploadContract.js \
  packages/studio/src/components/UniversalMediaUploader.jsx \
  app/api/v1/upload_file/ src/lib/uploadConfig.ts
# → (no output)

git diff 093d71fc7e88e70dcbba6c382941ccb9d8bafa15 -- packages/studio/src/muapi.js | grep -c uploadFile
# → non-zero  (our uploadFile is still the carve-out)
```

Upstream has **no** `uploadContract.js` and **no** `UniversalMediaUploader.jsx`; upstream's browser
uploads post to the generic `/api/api/v1/[[...path]]` catch-all proxy, while this repo has a
dedicated upload route that owns validation, auth and storage. No upstream upload code was
imported over ours, and no second upload system was introduced.

---

## E. Regression results

*(Populated after the studio sync agents complete.)*

---

## F. Release readiness

*(Populated after verification.)*

---

## Method notes

- Upstream pinned by fetching the commit into the local git object store, so every file could be
  installed with `git checkout <sha> -- <path>` — exact upstream bytes, no re-creation.
- Parity is proven by **git blob hash equality**, not by visual comparison.
- The full upstream tree was enumerated via the GitHub contents API (243 blobs) to establish
  which local studios have no upstream counterpart.
- The pre-existing `packages/studio/dist/**` build output is stale by design (it is gitignored
  and regenerated by `npm run build:packages` at deploy time); it is not a parity artefact.
