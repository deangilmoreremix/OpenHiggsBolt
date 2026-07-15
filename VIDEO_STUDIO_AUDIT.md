# Video Studio — Code Audit & Feature Inventory

**Target:** `packages/studio/src/components/VideoStudio.jsx` (web build) in `Anil-matcha/Open-Generative-AI` (upstream `main`, @ `7c8df61`).
**Scope:** the Video Studio only — its component, the `muapi` video functions it calls, and the video model data/helpers in `models.js`. Other studios, the Electron/`src/` legacy tree, and sd.cpp/Wan2GP are out of scope.
**Date:** 2026-07-14

---

## 1. Component interface (props)
| Prop | Purpose |
|---|---|
| `apiKey` | MuAPI key (passed down from `StandaloneShell`; no server-held key) |
| `droppedFiles` | Drag-and-drop handoff from the shell |
| `onFilesHandled` | Callback after dropped files are consumed |
| `onGenerationComplete` | Integration hook → `{ url, model, prompt, type: "video" }` |
| `historyItems` | Optional external history injection (falls back to internal `localHistory`) |

---

## 2. User-facing features
1. **Four generation modes**
   - **T2V** (text-to-video)
   - **I2V** (image-to-video) — start-frame, optional **end-frame** (first-last-frame models via `lastImageField`), and **multi-image** (`images_list`, up to model `maxItems`)
   - **V2V / Video Tools** — watermark remover + Kling motion-control (video + reference image)
   - **Extend** — Seedance 2.0 Extend (`requiresRequestId`); optional reference images/videos
2. **Model picker** — searchable, **provider filter tabs** (computed dynamically), provider logos (`PROVIDER_LOGOS` CDN), letter-badge fallback, "generation" vs orange **"Video Tools"** grouping, selected check.
3. **Parameter controls rendered:** Aspect Ratio, Effect (I2V effect `name`), Duration, Resolution, **Quality**, **Mode** *(Quality/Mode UI added in this audit — see §7)*.
4. **Media uploads** with **progress %**: start-frame image, end-frame image, video, multi-image set (per-image remove + order badges).
5. **Auto mode-switching:** uploading an image to a T2V model switches to its I2V sibling (matched by `family`); uploading a video switches to first V2V model; motion-control detection (`isMotionControlSelection`) keeps model + image.
6. **Drag-and-drop** (`droppedFiles` → image or video).
7. **File limits:** image 10 MB, video 50 MB (alert on exceed).
8. **Prompt** textarea, auto-resize, mode-specific placeholder.
9. **Output gallery** grid (1/2/3 cols) with **hover-to-play** preview.
10. **Per-result actions:** fullscreen, download (`downloadFile`), **Extend** (Seedance 2.0 only), delete (confirm).
11. **Fullscreen modal** player.
12. **Session persistence** — `localStorage["hg_video_studio_persistent"]`, capped at 30 history items, with **full restore** of model, mode, all params, uploaded URLs, prompt, and history on load.
13. **Generation UX** — spinner on Generate button, error label (4 s auto-clear), Extend banner.
14. **Responsive** layout + empty-state hero (model name + floating cards).
15. **111 video models** (43 T2V / 64 I2V / 4 V2V) driven by `models.js`.

---

## 3. Functions defined in `VideoStudio.jsx`

**Module-level helpers**
- `getQualitiesForModel(modelList, modelId)`
- `downloadFile(url, filename)` — blob download with fallback to new tab
- `CheckSvg()`, `VideoIconSvg({className})`, `VideoReadySvg()` — icons
- `DropdownItem({label, selected, onClick})`
- `PROVIDER_LOGOS` (const map), `invertLogos` (const array)
- `ModelDropdown({imageMode, selectedModel, onSelect, onClose})` → internals: `getProviderStyle(provider)`, `getIconColor(m, isV2V)`, `renderItem(m, isV2V)`, `filterFn(m)`

**`VideoStudio` component**
- **State (35):** `imageMode, v2vMode, selectedModel, selectedModelName, selectedAr, selectedDuration, selectedResolution, selectedQuality, selectedMode, selectedEffect, imageProgress, videoProgress, showAr, showDuration, showResolution, showQuality, showMode, showEffect, uploadedImageUrl, uploadedImageUrls, imageUploading, uploadedEndImageUrl, endImageUploading, endImageProgress, uploadedVideoUrl, videoUploading, uploadedVideoName, generating, generateError, fullscreenUrl, canvasUrl, canvasModel, showCanvas, lastGenerationId, lastGenerationModel, localHistory, activeHistoryIdx, openDropdown, prompt, promptDisabled`
- **Refs (8):** `containerRef, textareaRef, dropdownRef, imageFileInputRef, endImageFileInputRef, videoFileInputRef, resultVideoRef, hasRestored`
- **Derived:** `history`, `getCurrentModels`, `getCurrentAspectRatios`, `getCurrentDurations`, `getCurrentResolutions`, `getCurrentModel`, `isMotionControlSelection`
- **Handlers/callbacks:** `applyControlsForModel(modelId, isImageMode, isV2V)`, `handlePromptInput`, `processDroppedImage`, `processDroppedVideo`, `handleImageFileChange`, `clearImageUpload`, `removeImageAtIndex`, `handleEndImageFileChange`, `clearEndImage`, `handleVideoFileChange`, `clearVideoUpload`, `handleModelSelect`, `addToLocalHistory`, `showVideoInCanvas`, `handleGenerate`, `resetToPromptBar`, `handleNewPrompt`, `handleExtend`, `toggleDropdown`
- **Effects (6):** debounced persistence-save (500 ms), dropped-files handler, init controls on mount, close-dropdown-on-outside-click, textarea auto-resize on load, persistence **load/restore**

---

## 4. Client/API functions used (`muapi.js`)
- `generateVideo(apiKey, params)` — T2V + extend (prompt/aspect_ratio/duration/resolution/quality/mode/images_list/videos_list/`request_id`)
- `generateI2V(apiKey, params)` — resolves `imageField`/`lastImageField`, supports `images_list` and effect `name`
- `processV2V(apiKey, params)` — video upload + optional reference image + prompt
- `uploadFile(apiKey, file, onProgress)` — `POST /api/v1/upload_file` with XHR progress

All calls go through the Next proxy (`/api/*` → `api.muapi.ai`); the proxy strips caller cookies/headers and re-attaches only the user key server-side.

---

## 5. Model-helper functions used (`models.js`)
`t2vModels, i2vModels, v2vModels, getAspectRatiosForVideoModel, getDurationsForModel, getResolutionsForVideoModel, getAspectRatiosForI2VModel, getDurationsForI2VModel, getResolutionsForI2VModel, getEffectsForI2VModel, getDefaultEffectForI2VModel, getModesForModel, getMaxImagesForI2VModel` (+ local `getQualitiesForModel`).

Each video model object carries: `id, name, endpoint?, provider, provider_name, inputs` (schema with `title/description/type/default/enum/examples`), and capability flags `family, imageField, videoField, lastImageField, hasPrompt, promptRequired, requiresRequestId`.

**Catalog:** 43 T2V, 64 I2V, 4 V2V (Seedance, Kling v2.1→v3.0, Veo 3/3.1, Wan 2.1→2.6, Sora/Sora 2/2 Pro, Pixverse, Hailuo, Hunyuan, Vidu, Minimax, LTX, Grok, Midjourney, Leonardo, Runway, MuAPI effects).

---

## 6. Video model display (`ModelDropdown`)
- Provider logos via `PROVIDER_LOGOS` (CDN `cdn.muapi.ai`); letter-badge fallback (`getProviderStyle`/`getIconColor`).
- Dynamic provider tabs + name/id search; generation models vs orange "Video Tools" section; selected check.
- Shown per item: logo/letter, `name`, and `provider_name` (only when "all" tab active).

---

## 7. Findings

| Sev | Finding | Status |
|---|---|---|
| High | No tests for any video-studio code path | Open |
| Med | **Quality & Mode had no UI controls** — state was initialized, updated by `applyControlsForModel`, and sent to the API, but no dropdown buttons existed, so users were locked to each model's default. Regression vs the legacy `VideoStudio.js`. | **Fixed** (this audit) |
| Med | `inputs` metadata (`description`/`examples`/`placeholder`) is rich but never shown — wasted prompt-starter/help value | Open |
| Med | `getIconColor` id-sniffing (`m.id.includes("veo")`) is provider-agnostic/fragile; `invertLogos` is a manual per-logo list | Open |
| Med | Effect/tool `family` not surfaced as a badge in the picker | Open |
| Low | External CDN provider logos = third-party load dependency + tracking surface | Open |
| Low | `models.js` auto-generated from `models_dump.json`, committed, manual regen → drift risk | Open |
| Low | Dead state/code: `activeHistoryIdx` set but never read; `resultVideoRef` declared but unused; `VideoIconSvg`/`VideoReadySvg` defined but not rendered | Open |
| Low | `historyItems` (external) vs `localHistory` (internal) duality can desync the gallery when both are present | Open |
| Low | `localStorage` + non-HttpOnly `muapi_key` cookie in `StandaloneShell` expose the key to XSS (not introduced by the studio, but in its runtime) | Open |

---

## 8. Recommendations
1. Add unit tests for `generateVideo`/`generateI2V`/`processV2V` payload assembly and the `models.js` video helpers; add a Playwright test for T2V→Extend and I2V end-frame flows.
2. Surface `inputs.examples` as prompt suggestions and `description` as tooltips.
3. Drive logo/color by `provider` (not id substring); replace `invertLogos` with a per-provider `invert` flag.
4. Badge `family` (`effects`/`tools`) in the picker.
5. Remove dead state (`activeHistoryIdx`, `resultVideoRef`) and unused icon helpers.
6. Generate `models.js` in CI from `models_dump.json`.
7. Tighten CSP for the web app (drop `unsafe-eval`/`unsafe-inline`); avoid the non-HttpOnly `muapi_key` cookie.

---

## 9. Change applied (this audit)
- **`packages/studio/src/components/VideoStudio.jsx`** — added **Quality** and **Mode** dropdown buttons to the prompt-bar control row, gated by the existing `showQuality`/`showMode` state. They reuse `toggleDropdown("quality"|"mode")`, `dropdownRef`, `CheckSvg`, and the local `getQualitiesForModel` / imported `getModesForModel` helpers; selection updates `selectedQuality`/`selectedMode`, which `handleGenerate` already forwards to `generateVideo`/`generateI2V`. Brace balance verified (456/456). Not yet committed.
