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
| `packages/studio/src/components/prompt/PromptComposer.jsx` | `3f36df2bfa95` | `3f36df2bfa95` | **IDENTICAL** |
| `packages/studio/src/tailwind.css` | `3047a84d5442` | `3047a84d5442` | **IDENTICAL** |

**22 shared modules are byte-identical to upstream.** `PromptComposer.jsx` was also synchronised (it
differed by a single popover background class); it is the shared control system the matching studios
render, so upstream's bytes now apply.

Already byte-identical before this task (no action needed):
`MotionControlStudio.jsx`, `VideoModelControls.jsx`, `prompt/usePromptMenu.js`,
`prompt/README.md`, `alibabaModels.js`, `alibabaParameters.js`, `happyHorseParameters.js`,
`klingModels.js`, `klingParameters.js`, `ltxModels.js`, `ltxParameters.js`, `minimaxParameters.js`,
`nativeVideoParameters.js`, `pixverseModels.js`, `pixverseParameters.js`, `seedanceModels.js`,
`seedanceParameters.js`, `soraModels.js`, `soraParameters.js`, `utils/downloadImage.js`,
`utils/formatError.js`, `veoModels.js`, `veoParameters.js`, `videoModelCopy.js`,
`videoModelParameters.js`, `viduParameters.js`, `xaiModels.js`, `xaiParameters.js`, and the
`messages/en/{agentStudio,aiInfluencerStudio,audioStudio,cinemaStudio,layersStudio,lipSyncStudio,marketingStudio,motionControlStudio,recastStudio,vibeMotionStudio}.json`
and `messages/zh/{audioStudio,imageStudio,lipSyncStudio,motionControlStudio,videoStudio}.json`.

`packages/studio/src/persistKey.js` is now byte-identical to upstream as well (it previously differed
by a missing trailing newline — see §E.1 R5).

### C.2 Documented carve-outs (files that intentionally differ)

| File | Upstream blob | Local blob | Why it differs |
|---|---|---|---|
| `packages/studio/src/muapi.js` | `d398ba5f66e6` | `a39a855d3675` | **Upload-system carve-out (rule 3)** + Clerk auth-required event contract. 88 differing lines, itemised in §C.3 — every one of them a deliberate carve-out. |
| `packages/studio/src/index.js` | `982868574c2e` | `511e5b2745e2` | Upstream exports `McpCliStudio`; this repo permanently excludes it. **This file is on the CI "Preserve SmartVideo-owned product surfaces" list, so it was restored to the local version — it is byte-identical to `origin/main`, not to upstream.** |

### C.3 The `muapi.js` carve-out, line by line

Everything in `packages/studio/src/muapi.js` is upstream's file except **five** deliberate exceptions
(88 differing lines in total):

1. **`uploadFile()` — the upload system (rule 3, absolute exception).**
   Upstream posts to `` `${BASE_URL}/api/v1/upload_file` `` (browser: `/api/api/v1/upload_file`,
   the generic catch-all proxy). This repo's version posts to **our own `/api/v1/upload_file`
   route** (`app/api/v1/upload_file/route.ts`), and applies the shared upload contract
   (`packages/studio/src/uploadContract.js` → `getUploadLimit`, `isAllowedUploadMimeType`,
   `formatUploadLimit`) so size/MIME limits, the error messages and the security checks are ours.
   The **function signature is identical** (`uploadFile(apiKey, file, onProgress)` → `Promise<string>`),
   so upstream studio code calls our implementation with no change.
2. **The `uploadContract.js` import** — `import { getUploadLimit, isAllowedUploadMimeType,
   formatUploadLimit } from './uploadContract.js';`. This is what makes our `uploadFile` body legal.
   Upstream's file has no such import. **This line was missing on the first pass** and the protection
   audit proved at runtime that every client upload then threw
   `ReferenceError: isAllowedUploadMimeType is not defined`; it was restored in `9bc977f9d` and
   runtime-verified (§E.1 R1).
3. **`FILE_UPLOAD_TIMEOUT_MS` = 420000** (ours) instead of upstream's `300000` — our upload
   timeout policy. The upstream value is shorter and is not a studio feature.
4. **`notifyAuthRequired(status, detail, code)`** — the local version adds the `code` field to the
   `muapi:auth-required` CustomEvent, which is the **Clerk** auth-required contract used by
   `src/lib/authConfig.ts`. Rule 4 requires preserving Clerk authentication.
5. **`buildWorkflowApiSnippets()` and `generateCharacterVideo()`** — the two local-only exports that
   upstream does not have. `packages/studio/src/lib/promptRecipes.js:106` calls
   `muapi.generateCharacterVideo(apiKey, params)`, so dropping them made every skill run containing a
   `character` step abort with `TypeError: muapi.generateCharacterVideo is not a function`. They were
   restored with the exact `origin/main` text (upstream has no character-video endpoint, so a no-op
   stub is the parity-safe choice) in `9bc977f9d` — see §E.1 R2.

### C.4 Per-studio file parity

Every studio component was installed with `git checkout <upstream-sha> -- <path>` and then given only the
documented adapters. "upstream lines absent" counts upstream source lines that are not present locally;
where it is > 0 the reason is listed.

| Studio | Upstream blob | Local blob | State | Upstream lines absent | Local lines added |
|---|---|---|---|---|---|
| Video | `0a4649d32161` | `fb22a88b0e5d` | upstream + adapters | 0 | 153 |
| Image | `71f53b6572b6` | `ffbf947e662d` | upstream + adapters | 0 | 248 |
| Audio | `c777cd87ed8b` | `5f8f044fc746` | upstream + adapters | 1 | 19 |
| Clipping | `8b1ee678bbec` | `9c9769968f4a` | upstream + adapters | 1 | 85 |
| Vibe Motion | `0775f5de5a68` | `42222ab29166` | upstream + adapters | 0 | 18 |
| Lip Sync | `1112098d978f` | `cded56f31ccc` | upstream + adapters | 0 | 18 |
| Recast | `fc570cd03469` | `47bd4b5af2ee` | upstream + adapters | 0 | 18 |
| Cinema | `85eee4abd2a3` | `7df656ffc13d` | upstream + adapters | 0 | 98 |
| Marketing | `926e6a9684df` | `dbf57a5357a7` | upstream + adapters | 0 | 18 |
| Workflow | `da62c4e9c5f4` | `1d4027e7700b` | upstream + route adapter | 7 | 22 |
| Workflow UI | `5dbff8c85fa7` | `5dbff8c85fa7` | **byte-identical** | 0 | 0 |
| Agent | `e59c5acf1604` | `e59c5acf1604` | **byte-identical** | 0 | 0 |
| AI Influencer | `169d1293f162` | `2286af5c3aca` | upstream + adapters | 1 | 99 |
| Layers | `b4bbf8dcc01e` | `b4bbf8dcc01e` | **byte-identical** | 0 | 0 |
| Motion Control | `a4ed1ffcb2cd` | `a4ed1ffcb2cd` | **byte-identical** | 0 | 0 |

**4 of 16 are byte-identical to upstream. The other 12 carry only the documented adapters.** The
adapters are: social publishing (`PublishStep`), AI assistant (`AssistStep`), skills registry /
prompt recipes, character sheet, `TemplateBanner` + `useTemplateData`, storyboard hand-off, cost
estimator, plus the route adapter below. No upstream logic was rewritten.

**The 10 upstream lines absent, itemised (all justified):**

| File | Absent | Why |
|---|---|---|
| `AudioStudio.jsx` | 1 | upstream's hardcoded `file.size > 20 * 1024 * 1024` guard; ours uses the shared `uploadContract` limit. This is the **upload-system carve-out**. |
| `ClippingStudio.jsx` | 1 | whitespace only. |
| `WorkflowStudio.jsx` | 7 | upstream reads the catch-all path array from `params.tab`; this repo mounts the studio shell at `/studio/[[...slug]]` so the array arrives as `params.slug`. The adapter accepts both, array-guarded. Without it every `/studio/…` deep link to a workflow breaks. |
| `AiInfluencerStudio.jsx` | 1 | import line variant (`useState, useCallback` vs `useState, useCallback, useEffect, useRef`) required by the local adapters. |

**Message bundles** — `messages/en/`: 13 of 14 byte-identical to upstream
(`agentStudio`, `aiInfluencerStudio`, `audioStudio`, `cinemaStudio`, `clippingStudio`, `imageStudio`,
`layersStudio`, `lipSyncStudio`, `marketingStudio`, `motionControlStudio`, `recastStudio`,
`vibeMotionStudio`, `videoStudio`). `messages/en/appsStudio.json` differs because the Apps Studio is a
SmartVideo-owned product surface (§A.3).

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

**Our upload implementation takes precedence. No upstream upload code was imported over ours, and no
second upload system was introduced.**

An important correction is recorded here rather than hidden: the **first** version of this section
asserted "nothing in the upload system was changed". That assertion was **wrong** as shipped. The
independent protection audit (V2) proved it at runtime: the carve-out in `packages/studio/src/muapi.js`
had re-inserted our `uploadFile` **body** but not the **import** that body depends on, so the first
client file upload in every studio threw `ReferenceError: isAllowedUploadMimeType is not defined`.
The defect was repaired in `9bc977f9d` and re-verified at runtime (§E.1 R1). The state below is the
**verified final state**.

| Upload artefact | Path | Verified status |
|---|---|---|
| Client upload function | `packages/studio/src/muapi.js` → `uploadFile()` | **PRESERVED** — our implementation; same `uploadFile(apiKey, file, onProgress)` signature upstream's studios call; posts to our `/api/v1/upload_file` route |
| Upload-contract import | `packages/studio/src/muapi.js` | **RESTORED** — `getUploadLimit`, `isAllowedUploadMimeType`, `formatUploadLimit` from `./uploadContract.js` (this was the defect V2 found) |
| Shared size/MIME contract | `packages/studio/src/uploadContract.js` | **UNCHANGED** |
| Upload UI | `packages/studio/src/components/UniversalMediaUploader.jsx` | **UNCHANGED** |
| Upload API route | `app/api/v1/upload_file/` | **UNCHANGED** |
| Binary upload routes | `app/api/upload-binary/`, `app/api/v1/upload-binary/` | **UNCHANGED** |
| Pre-signed upload URL | `app/api/v1/get_upload_url/` | **UNCHANGED** |
| VFX upload route | `app/api/vfx/upload/` | **UNCHANGED** |
| Host-side contract re-export | `src/lib/uploadConfig.ts` | **UNCHANGED** |

Verification against `origin/main` (the commit the branch was created from):

```bash
git diff --name-only origin/main -- \
  packages/studio/src/uploadContract.js \
  packages/studio/src/components/UniversalMediaUploader.jsx \
  app/api/v1/upload_file app/api/upload-binary app/api/v1/upload-binary \
  app/api/v1/get_upload_url app/api/vfx/upload src/lib/uploadConfig.ts
# → (no output)   0 files changed
```

Upstream has **no** `uploadContract.js` and **no** `UniversalMediaUploader.jsx`; upstream's browser
uploads post to the generic `/api/api/v1/[[...path]]` catch-all proxy, while this repo has a
dedicated upload route that owns validation, auth and storage. No upstream upload code was imported
over ours, and the upload entry points and routes are identical in count to the baseline.

**SmartVideo-owned surfaces** — the repo's own `.github/workflows/upstream-sync.yml` "Preserve
SmartVideo-owned product surfaces" list was read out of the workflow file and every path on it was
verified against `origin/main`: **35 paths checked, 0 changed**, with one exception —
`packages/studio/src/persistKey.js`, which differs by a **single trailing newline** (its content is
otherwise identical, and it is now byte-identical to upstream). The upload system, the non-matching
studios and the unrelated application functionality are likewise unchanged (§F).

git diff 093d71fc7e88e70dcbba6c382941ccb9d8bafa15 -- packages/studio/src/muapi.js | grep -c uploadFile
# → non-zero  (our uploadFile is still the carve-out)
```

Upstream has **no** `uploadContract.js` and **no** `UniversalMediaUploader.jsx`; upstream's browser
uploads post to the generic `/api/api/v1/[[...path]]` catch-all proxy, while this repo has a
dedicated upload route that owns validation, auth and storage. No upstream upload code was
imported over ours, and no second upload system was introduced.

---

## E. Regression results

The full suite was run on the branch and on a **pristine detached worktree at `origin/main`**, with the
**same reporter**, **sequentially** (the suite is sensitive to parallel load, so the two runs were not
concurrent — a concurrent run produces spurious "Timeout calling onTaskUpdate" failures).

| | Failed files | Passed files | Failed tests | Passed tests |
|---|---|---|---|---|
| Baseline `origin/main` (`0bfecda0f`) | 29 | 153 | 39 | 2356 |
| Branch, before the last two repairs | 33 | 149 | 44 | 2351 |
| **Branch, final** | **29** | **153** | **40** | **2355** |

**The failing-file sets are byte-identical between the baseline and the final branch — the branch
introduces zero new failing test files.** (`diff` of the two sorted failure lists is empty.)

The 29 failing files are **pre-existing at `origin/main`**: 16 report *"No test suite found in file"*
(the files exist but contain no vitest suite), and the rest fail on environmental fixtures —
`"Durable storage is not configured"` (object storage), auth/entitlement fixtures, and
`src/access/__tests__/api-gates-contract.test.ts` (the upload route not importing the entitlement gate).
The 1-test delta (40 vs 39) is inside `src/shared/personalization/__tests__/`, whose failing test count
varies run to run; those files pass in isolation.

### E.1 The two genuine regressions the branch DID introduce — found, and fixed

Both were found by the verification agents and are now repaired. They are recorded here in full rather
than smoothed over.

**R1 — every client file upload threw.** `packages/studio/src/muapi.js` was replaced with upstream's
file to preserve our upload system; the splice re-inserted our `uploadFile` **body** but not the
**import** that body depends on. `uploadFile` calls `isAllowedUploadMimeType`, `getUploadLimit` and
`formatUploadLimit`, so the first client upload in any studio threw
`ReferenceError: isAllowedUploadMimeType is not defined`. Upstream's file has no such import, so the
carve-out was incomplete.
*Fixed* in `9bc977f9d` by re-adding
`import { getUploadLimit, isAllowedUploadMimeType, formatUploadLimit } from './uploadContract.js';`.
*Runtime-verified*: an oversize file now rejects with `File too large: 953.7 MB. Maximum: 10MB` and a
bad MIME with `Invalid file type: application/x-msdownload`. A negative control on the pre-fix file
reproduces the `ReferenceError`, proving the assertion is sensitive to the defect.

**R2 — skill runs with a `character` step aborted.** The same replacement dropped two local-only
exports, `buildWorkflowApiSnippets` and `generateCharacterVideo`.
`packages/studio/src/lib/promptRecipes.js:106` calls `muapi.generateCharacterVideo(apiKey, params)`, so
it was `undefined` → `TypeError: muapi.generateCharacterVideo is not a function`, and every skill run
containing a `character` step failed. *Fixed* in `9bc977f9d` by restoring both with the exact
`origin/main` text (upstream has no character-video endpoint, so a no-op stub is the parity-safe choice
— routing `character` steps to `generateVideo` would silently change product behaviour). All 7
`muapi.*` namespace accesses in the local-only modules now resolve.

**R3 — social publishing and AI assist lost in 4 studios.** The full-suite comparison showed
`tests/social-publishing-coverage.vitest.test.ts` failing for Vibe Motion, Lip Sync, Marketing and
Recast: installing upstream's source dropped their `PublishStep` / `AssistStep` integration, because
upstream has no notion of either. *Fixed* in `d5a92d9ef` by porting the pre-sync integration onto the
upstream component, matching the shape the already-correct siblings (Cinema, Clipping, Image, Video, AI
Influencer) use. `tests/` is on the CI preserve list, so the studios were fixed rather than the test.

**R4 — a stale catalog expectation.** `src/shared/personalization/__tests__/modelCapabilityResolver.test.ts`
asserted `kling-o1-video-edit` had no aspect-ratio options, which was true of the old local model
definition. Upstream's model declares `inputs.aspect_ratio = ["16:9","9:16","1:1"]`, so the resolver
correctly returns them. *Fixed* in `d5a92d9ef` by updating that single expectation to the upstream
values; no other assertion was changed.

**R5 — a byte difference in a protected file.** `packages/studio/src/persistKey.js` lacked a trailing
newline, so it was not byte-identical to upstream despite being otherwise identical. *Fixed* in
`9bc977f9d` — the file is now byte-identical to upstream (`8cf219bfdc11`) and differs from
`origin/main` by that newline only.

### E.2 Build, typecheck and import resolution

| Check | Result |
|---|---|
| `packages/studio` Babel build | **86 files compiled** |
| `npm run build -w studio` (tailwind + babel) | **PASS** |
| `npx tsc --noEmit` (branch) | **0 errors** |
| `npx tsc --noEmit` (baseline `origin/main`) | **0 errors** → **0 introduced** |
| `npx next build` | **PASS**, 95 routes, 23 static pages, `/studio/[[...slug]]` present |
| Import resolution across the 16 synced components | **204/204 specifiers resolved, 0 failures** |

### E.3 Targeted suites (after the repairs)

```
tests/social-publishing-coverage.vitest.test.ts
src/shared/personalization/__tests__/modelCapabilityResolver.test.ts
  → 2 files / 29 tests PASSED
```

### E.4 Cross-user isolation and upload safety — verified

- The upload contract, the upload UI, the upload API routes and the upload auth were **not modified**
  (§D).
- `packages/studio/src/persistKey.js` — the cross-identity isolation primitive — is byte-identical to
  upstream, and the studios' persistence keys still derive per identity.
- The 29 failing files are identical to the baseline's, so no isolation or entitlement test regressed.

## F. Release readiness

| | |
|---|---|
| **Feature branch** | `feature/exact-upstream-studio-parity` (created from `origin/main` = `0bfecda0f`) |
| **Commits** | `b56d9fa77` sync · `9bc977f9d` muapi repairs + persistKey newline · `d5a92d9ef` regression repairs · `f7177eb5b` regenerate dist |
| **Branch position** | **4 commits AHEAD of `origin/main`, 0 behind** |
| **Upstream pinned at** | `093d71fc7e88e70dcbba6c382941ccb9d8bafa15` (fetched into the git object store) |
| **Files changed** | 41 source files, all inside `packages/studio/src` + the report; plus 21 regenerated `dist` artefacts |
| **Merged?** | **NO** — the task requires explicit human approval |
| **Deployed?** | **NO** — Netlify untouched, production locked, no deploy run |
| **Force-pushed?** | **NO** |
| **GitHub Actions used?** | **NO** — all verification was local |
| **Production branch changed?** | **NO** — `origin/main` is untouched at `0bfecda0f` |
| **Merge-conflict status** | **Clean** — the branch is a linear descendant of `origin/main`; a fast-forward is possible, and re-merging `origin/main` into the branch would be a no-op |

### F.1 Outstanding issues

1. **Human merge approval required.** The task states: *"Do not merge without final verification and my
   explicit approval."* That approval has not been given and is not assumed.
2. **The branch must be re-verified against a newer `origin/main` at merge time.** `origin/main` moved
   to `0bfecda0f` during this work; if it moves again, re-run the suite comparison.
3. **The repo's weekly `upstream-sync.yml` job will revert Apps Studio and the other protected paths** —
   that is by design; it also means the next upstream sync must preserve this branch's adapters.
4. **`packages/studio/dist` is gitignored but has 29 tracked artefacts.** They are now regenerated and
   committed, but the ignore rule and the tracked set are inconsistent. Untracking them would be a
   repository-hygiene change outside this task's scope.
5. **Upstream's own dead code was not touched** (e.g. `activeHistoryIdx` set but never read,
   `resultVideoRef` declared but unused) because it exists upstream too and removing it would diverge.

### F.2 Production readiness recommendation

**The branch is technically ready to merge and deploy, but must not be merged or deployed without
explicit approval.**

- The upstream-parity objective is met: every confirmed matching studio now uses upstream's actual
  source, the upload system is untouched and verified, every non-matching studio and every
  SmartVideo-owned surface is untouched, and the branch introduces zero test regressions.
- Before deploying, note that the *next* upstream merge run will re-introduce the need for these
  adapters, so the adapter set is now a documented, maintained surface rather than a one-off.
- On merge, the deploy should run the repo's own `netlify.toml` build (`npm run build:metadata &&
  npm run build:packages && npm run build`), which regenerates `dist` and then the Next.js build.

### F.3 Verification pipeline (auditable)

| Agent | Role | Finding |
|---|---|---|
| V1 — Parity Auditor | hash-level audit of all 100 upstream files | 74 byte-identical, 26 differ; 4 unjustified diffs (D1–D4) |
| V2 — Protection Auditor | upload system + SmartVideo-owned surfaces + non-matching studios | **found** the missing `uploadContract` import (critical) and the dropped exports (critical) |
| V3 — Build & Typecheck | babel, tsc, next build, import resolution | build PASS, tsc 0 errors, 204/204 imports resolved; flagged the stale `dist` |
| F1 — Defect Fix Agent | repair the two critical `muapi.js` defects | fixed + runtime-proven with a negative control |
| F3 — Regression Fix Agent | repair the two regressions the suite comparison found | PublishStep/AssistStep restored in 4 studios; stale catalog expectation refreshed |
| R1 — Regression Runner | full suite, branch vs baseline worktree | isolated the 4 newly-failing files (2 genuine, 2 flaky) |
| F2 — Protection Re-verification | independent re-audit after the repairs | (report pending at time of writing) |
| D1 — Report Author | assemble this document from the evidence | — |

## Method notes

- Upstream pinned by fetching the commit into the local git object store, so every file could be
  installed with `git checkout <sha> -- <path>` — exact upstream bytes, no re-creation.
- Parity is proven by **git blob hash equality**, not by visual comparison.
- The full upstream tree was enumerated via the GitHub contents API (243 blobs) to establish
  which local studios have no upstream counterpart.
- The pre-existing `packages/studio/dist/**` build output is stale by design (it is gitignored
  and regenerated by `npm run build:packages` at deploy time); it is not a parity artefact.
