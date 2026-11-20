# Upstream audit: Anil-matcha/Open-Generative-AI vs OpenHiggsBolt

Audited 2026-11-17 against upstream `main` @ `b57f02f7`.

## How this was measured

- **No shared git history.** `git merge-base` returns nothing, so `git log HEAD..upstream/main` (532 commits) is meaningless as a "what's missing" count.
- **Sync point estimated by blob matching.** For each of the 140 newest upstream commits I counted files whose blob is identical to ours. The best matches are `ce82e993` / `bb2cf5ce` (2026-10-03 to 2026-10-07). I used `bb2cf5ce` as the baseline.
- **Fork is heavily customised.** Only ~124 of 237 upstream files at that point still match ours exactly (ours has 6,956 tracked files). Treat the baseline as "last upstream state we demonstrably absorbed", not an exact fork point.
- **Delta since baseline:** 59 files, +8,670 / -1,022 lines. Per-file status vs. ours:
  - 26 missing in ours (new files)
  - 13 unchanged from baseline in ours (clean take)
  - 19 diverged (both sides edited)
  - 1 already identical (`viduModels.js`)
- Diverged files were dry-run with `git merge-file` (3-way, base = `bb2cf5ce`).

## What upstream added that we don't have

### 1. Model catalog (`packages/studio/src/models.js`, +4.7k lines): 46 model IDs missing
Upstream has 628 model IDs, we have 582, and we have none upstream lacks.
- Kling 4.0 and Kling 4.0 Flash: t2v, keyframe, reference (6)
- Flux 3: dev, t2i, i2i, klein t2i, klein edit, omni (6)
- GPT Image 2.6 Flare and Sunburst: t2i and i2i (4)
- Grok Imagine Video 1.5 and Lite: t2v, i2v, reference (5)
- MiniMax H3 Max Spicy and Turbo Spicy: t2v, i2v, ref (5)
- Gemini Omni Flash 1.2: t2v, i2v, ref, edit (4)
- Seedance 2.1: t2v, i2v (2)
- PixVerse V6 Max: t2v, i2v (2)
- Wan 3.0: t2i, image-edit (2)
- Audio: ElevenLabs v4 Turbo, Gemini 3.8 Flash TTS and Flash-Lite TTS (3)
- OmniHuman 2.0, plus tools: ai-clipping, autocrop, motion-graphics, photo-pack, tiktok-carousel, video-combiner (7)

Companion registry edits, all clean takes in ours: `minimaxModels.js`, `modelFamilies.js` (gpt-image-2.6 and wan3.0 families), `videoToolCapabilities.js`. Dry-run 3-way merge of `models.js`: **0 conflicts**.

### 2. API robustness (`src/lib/muapi.js`, `components/ApiKeyModal.js`)
- `formatApiError()` gives clear 401/403 ("invalid/missing key") and 402 ("insufficient credits") messages.
- API key validation rejects spaces and non-ASCII characters, which otherwise make `fetch()` throw on the header. New file `components/apiKeyValidation.mjs`.
- `3973b4c9`: stop retrying terminal errors for 30 minutes.
- `ae4a2634`: don't replay buffered generation stages. We already have the "terminal error" marker at `muapi.js:13`, so check whether it matches upstream's fix.
- Dry-run merge of `muapi.js`: 0 conflicts.

### 3. Local inference and Wan2GP (Electron)
- **New files:** `electron/lib/localInferenceDownload.js` (resumable download rewrite, 5 min inactivity timeout, relative-redirect fix) and `wan2gp{Catalog,Local,Mcp,Output}.js`.
- **Changed:**
  - `localInference.js` has +274 lines: Windows engine validation, ranking of CPU/CUDA/Vulkan builds, NTSTATUS exit-code mapping, custom `sd-cli` path.
  - Clean takes: `localInferenceAssets.js`, `localInferenceRuntime.js`, `localModels.js`, `LocalModelManager.js`, `localInferenceClient.js`, `modelCatalog.js`, `wan2gpProvider.js`, `wan2gpModelAvailability.js`, `preload.js`, `scripts/stage-local-ai-binary.js`.
- `#397`: ImageStudio applies local-model step/guidance defaults.
- **~14 new test files** cover the above, plus `tests/fixtures/fake-wan2gp/wgp.py`.

### 4. UI features
- Light/dark theme toggle (`components/ThemeToggle.js`, `globals.css`, `layout.js`; PR #403, issue #290).
- Provider logos in the video model picker (`src/lib/providerLogos.js`, PR #338).
- History delete (`src/lib/historyDom.mjs`).
- Safer error rendering.
- LipSync studio: audio play/pause preview and upload fix (`62c7a0f9`).
- VideoStudio +289 lines; i18n +46 lines.
- `CinemaStudio` and `ImageStudio` tweaks.

### 5. Infra and docs
- `Dockerfile`: Node 22 base image and fail-clearly-on-missing-submodules.
- `.dockerignore`, `CONTRIBUTING.md`, `npm test` script, Docker docs (#388).
- README: many video-link churn commits (low value), "Open Duet" promo, v2.0.0 download links, Discord invite fix.

### 6. Submodule pointers (`.gitmodules`)
- Upstream tracks `packages/Vibe-Workflow` (@`4fed751`), `packages/Open-AI-Design-Agent` (@`e179fe1`) and `packages/Open-Poe-AI` (@`3e21ebc`, same as ours).
- We don't have Vibe-Workflow or Open-AI-Design-Agent. We vendored our own `packages/workflow-builder` and have no design-agent package.
- Upstream workspaces reference `packages/Vibe-Workflow/packages/workflow-builder` and `packages/Open-AI-Design-Agent/packages/design-agent`; ours reference `packages/workflow-builder` and `apps/cutai/frontend`.
- **Decision needed.** Don't take upstream's pointer bumps blindly: the architectures differ.

## Merge risk (3-way dry run, base `bb2cf5ce`)

| Risk | Files |
|---|---|
| Clean / trivial | `models.js`, `muapi.js`, `CinemaStudio.js`, `tests/localInferenceProgress.test.js`, `tests/wan2gpModelAvailability.test.js`, all 13 clean-take files, all 26 new files |
| Conflicts, ours heavily customised (hand-merge) | `StandaloneShell.js` (ours +1,934 lines vs upstream +2), `ImageStudio.js` (2 conflicts), `i18n.js` (2), `app/globals.css`, `app/layout.js`, `ApiKeyModal.js` (2), `package.json`, `README.md` (5), `Dockerfile` |
| Conflicts, upstream-driven | `electron/lib/localInference.js` (2), `VideoStudio.js` (3), `LipSyncStudio.js` and `.jsx` (1 each), `tests/localInferenceAssets.test.js` |

## Recommended order
1. Take the 26 new files plus the 13 clean-take files (local inference, Wan2GP, tests, provider logos, history, API-key validation).
2. Apply the `models.js` / `minimaxModels.js` / `modelFamilies.js` catalog sync.
3. Hand-merge `muapi.js` (error formatting, key validation), `ApiKeyModal.js`, `VideoStudio.js`, `localInference.js`, `LipSyncStudio*`.
4. Theme toggle: ours has its own globals.css and layout. Port the toggle, don't overwrite.
5. Skip README video-link churn. Decide separately on submodule structure.
6. Run `npm run test:unit` and the Electron local-inference tests after each step.

## Caveats
- The baseline is inferred. If our real sync point was earlier than 2026-10-07, there are more missing changes than listed. Per-file blob comparison above is exact for the files listed, though.
- Not audited: our own `ours-only` code (about 6,800 files). It is out of scope for upstream drift, but it is where most merge conflicts will come from.
- I did not apply any of these changes. The `upstream` remote was added locally to this checkout only.

## Sync status (updated 2026-11-20)

Upstream re-checked at `46cf201c` (only a README change since `b57f02f7`). Branch `claude/keen-brahmagupta-3m8q5l`.

**Applied (additive, nothing of ours removed):**
- 25 new upstream files and +46 model IDs (582 -> 628).
- `muapi.js`: `formatApiError()` for clear 401/402/403 messages.
- `localInferenceAssets.js`: `rankWindowsAssets`, `describeExitCode`, `resolveRedirectUrl`; Windows picker prefers the CPU build (incl. `win-cpu-x64`).
- `VideoStudio.js`: provider logos in the model picker, history download/delete helper.
- `LipSyncStudio.js`: history download/delete helper, `textContent` for error text.
- `electron/lib/localInference.js`: replaced with upstream's current version. Ours was byte-identical to upstream's 2026-05-23 version (no local edits), so only older upstream code was replaced. Adds lazy path init (#232), resumable downloader, CUDA runtime fetch, binary validation, `OPEN_GENERATIVE_AI_SD_CLI`. All 8 IPC handlers preserved.
- `packages/studio/.../LipSyncStudio.jsx`: already contained upstream's changes (3-way merge was a no-op).

**Deliberately not applied:**
- Wan2GP rewrite (Gradio server -> local folder / MCP): `wan2gpProvider.js`, `localModels.js`, `LocalModelManager.js`, `preload.js`, `localInferenceClient.js`, `stage-local-ai-binary.js`, and the VideoStudio "Local" toggle/progress panel that depends on it. All-or-nothing; replaces existing code.
- `ApiKeyModal.js` (ours already validates keys), theme toggle, i18n/globals/layout edits, submodule pointers, README churn.

**Verification:** vitest 7,021 passed / 4 failed, identical to the pre-sync baseline (the 4 fail on the untouched commit too). `npm run test:local-ai`: 50/53 (3 expect the Wan2GP rewrite). `next build` cannot complete in this container because the `Open-Poe-AI` submodule is not checked out (`ai-agent` unresolved); no errors mention changed files.
