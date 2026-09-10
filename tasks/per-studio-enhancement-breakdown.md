# Per-Studio Enhancement Breakdown

**Objective:** For every studio currently in the repo, document exactly which upstream features will be ADDED while preserving all existing functionality.

**Rule:** All changes are ADDITIVE ONLY. No existing features, functions, or files are removed or replaced.

---

## Table of Contents

1. [ImageStudio](#1-imagestudio)
2. [VideoStudio](#2-videostudio)
3. [VideoStudioParity](#3-videostudioparity)
4. [LayersStudio](#4-layersstudio)
5. [CinemaStudio](#5-cinemastudio)
6. [AudioStudio](#6-audiostudio)
7. [LipSyncStudio](#7-lipsyncstudio)
8. [VibeMotionStudio](#8-vibemotionstudio)
9. [ClippingStudio](#9-clippingstudio)
10. [RecastStudio](#10-recaststudio)
11. [WorkflowStudio](#11-workflowstudio)
12. [AgentStudio](#12-agentstudio)
13. [DesignAgentStudio](#13-designagentstudio)
14. [AiInfluencerStudio](#14-aiinfluencerstudio)
15. [MarketingStudio](#15-marketingstudio)
16. [BrandStudio (App)](#16-brandstudio-app)
17. [PhotoStudio (App)](#17-photostudio-app)
18. [ThumbnailStudio (App)](#18-thumbnailstudio-app)
19. [VFXStudio (App)](#19-vfxstudio-app)
20. [VideoStudio (App)](#20-videostudio-app)

---

## 1. ImageStudio

**Current file:** `packages/studio/src/components/ImageStudio.jsx` (~1,879 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| T2I/I2I modes | Text-to-image and image-to-image generation |
| Swap Face | `swapImageUrl` → `swap_url` for face swapping |
| Grok Edit mode | `grokEditMode`, `grokRequestId`, `grokMask` |
| UploadButton | Multi-image upload with history panel, 10MB limit |
| ModelDropdown | Provider logos, model descriptions, invertLogos for dark/light |
| Skills browser | `applyRecipe(skill)` with prompt templating |
| Storyboard handoff | `readStoryboardHandoff("image")` |
| Template data | `useTemplateData` for landing page prefill |
| Batch generation | `batchSize` state for parallel generation |
| Provider logo map | `PROVIDER_LOGOS` with `invertLogos` |
| 500ms localStorage persistence | `hg_image_studio_persistent` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Drag-and-drop upload** | Upstream `ImageStudio.jsx` | Add `isDragging`, `dragCounterRef` state; add `handleTriggerDragEnter/Leave/Over/Drop` handlers to UploadButton trigger |
| 2 | **Persisted history sync** | Upstream `ImageStudio.jsx` | Add `persistedHistory` and `onHistoryChange` props to UploadButton; sync upload history with parent state |
| 3 | **Process files helper** | Upstream `ImageStudio.jsx` | Extract `processFiles(files)` helper from `handleFileChange`; reuse across click and drag-drop paths |
| 4 | **i18n support** | Upstream `ImageStudio.jsx` | Add `en/imageStudio.json` messages; use `resolveCopy(en, zh, locale)`; wrap UI text with `copy.*` |
| 5 | **Toast notifications** | Upstream `ImageStudio.jsx` | Add `Toaster` component; add `toast` calls for success/error alongside existing `alert()` |
| 6 | **Scoped persistence** | Upstream `ImageStudio.jsx` | Add `scopedPersistKey`, `migrateLegacyPersistKey` usage; keep unscoped as fallback |
| 7 | **Model category filtering** | Upstream `ImageStudio.jsx` | Add `modelCategories` with `all`, `t2i`, `i2i` tabs to ModelDropdown |
| 8 | **Model search** | Upstream `ImageStudio.jsx` | Add search input to ModelDropdown |
| 9 | **PromptPopover styling** | Upstream `ImageStudio.jsx` | Wrap UploadButton panel in `PromptPopover` instead of custom div |

### What Stays Unchanged

- All existing tools, handlers, and state variables
- All existing API calls (`generateImage`, `generateI2I`, `uploadFile`)
- All existing integrations (Skills, Storyboard, Template)
- Batch size indicator on generate button
- Provider logo map and invertLogos logic

---

## 2. VideoStudio

**Current file:** `packages/studio/src/components/VideoStudio.jsx` (~1,380 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| T2V/I2V/V2V modes | Three-mode generation system |
| Advanced controls panel | Model-specific advanced parameters |
| Model selector | Family/model selection with mode switching |
| Workflow integration | Workflow-aware media slots |
| PublishStep/AssistStep | Social publishing and AI assist |
| History gallery | Card grid with hover actions |
| Advanced values | `advancedValues` state for seed, audio, camera, etc. |
| Upload progress | Image (10MB) and video (50MB) upload with progress |
| Storyboard handoff | Reads `firstFrameUrl`, `videoUrl` |
| Template data | Landing page prefill |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **PromptComposer wrapper** | Upstream `VideoStudio.jsx` | Import `PromptComposer`, `PromptControls`, `PromptPopover`, `PromptTextarea`; wrap existing prompt textarea |
| 2 | **ReferenceUploadButton** | Upstream `VideoStudio.jsx` | Create `ReferenceUploadButton` component for image/video/audio references with drag-drop |
| 3 | **ReferencePreview** | Upstream `VideoStudio.jsx` | Create `ReferencePreview` component for media thumbnails with remove button |
| 4 | **ModelParameterControls** | Upstream `VideoStudio.jsx` | Add PARAMS button to prompt composer; wire to `modelParameterValues` state |
| 5 | **MobileGenerationActions** | Upstream `VideoStudio.jsx` | Import `MobileGenerationActions`, `GenerationCopyButtons`; add to result view |
| 6 | **i18n support** | Upstream `VideoStudio.jsx` | Import `en/videoStudio.json`, `zh/videoStudio.json`; use `resolveCopy()` |
| 7 | **Toast notifications** | Upstream `VideoStudio.jsx` | Add `Toaster` component; add `toast` calls alongside existing alerts |
| 8 | **Scoped persistence** | Upstream `VideoStudio.jsx` | Add `scopedPersistKey`, `migrateLegacyPersistKey` usage |
| 9 | **Drag-drop for references** | Upstream `VideoStudio.jsx` | Add drag-and-drop to reference upload buttons |
| 10 | **Reference media labels** | Upstream `VideoStudio.jsx` | Add `ReferenceMediaLabel` component for START/END/REF labels |

### What Stays Unchanged

- PublishStep/AssistStep integrations (upstream removed these, we keep them)
- Existing advanced controls panel logic
- Existing workflow integration
- VideoStudioParity.jsx (completely separate file, untouched)
- All existing generation flows (t2v, i2v, v2v)

---

## 3. VideoStudioParity

**Current file:** `packages/studio/src/components/VideoStudioParity.jsx` (~836 lines)

### Action: DO NOT MODIFY

This file is completely preserved as-is. Upstream deleted this file and merged its logic into `VideoStudio.jsx`, but we keep both files independently.

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Workflow-aware generation | `selectedWorkflowId`, `workflowMedia`, `baseMedia` |
| Model families | `selectedFamilyId`, family/variant resolution |
| Model parameters | `modelParameterValues`, `ModelParameterControls` |
| Advanced controls | `advancedValues`, `getAdvancedControlsForModel` |
| PromptComposer | Already integrated |
| MobileGenerationActions | Already integrated |
| UniversalMediaUploader | Already integrated |
| DrawModal | Already integrated |
| i18n | Already has `resolveCopy(en, null, locale)` |
| Scoped persistence | Already has `scopedPersistKey` |
| PublishStep/AssistStep | Already integrated |
| Storyboard handoff | Already integrated |
| Skills/recipes | Already integrated |

### New Features to ADD

**None.** This file is fully featured and matches the upstream parity implementation. No additions needed.

---

## 4. LayersStudio

**Current file:** `packages/studio/src/components/LayersStudio.jsx` (~1,530 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Layer decomposition | `decomposeLayers` with Seedream |
| Upscale | Topaz, SeedVR2, AI Upscaler |
| Remove background | `removeBackground` |
| Expand image | `expandImage` |
| Regional edit | Lasso selection, box selection, bbox prompt injection |
| Color grading | Live CSS filter preview, film grain, vignette |
| Drawing tools | Pencil, eraser, shapes |
| Pan/zoom | `zoomLevel`, `panOffset` |
| History/undo/redo | `historyStack`, `historyIndex` |
| Seedream bbox | 0-1000 coordinate system |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **i18n support** | Upstream `LayersStudio.jsx` | Import `zh` message bundle; use `resolveCopy(en, zh, locale)` |

### What Stays Unchanged

- All existing tools and features
- All existing API calls
- All existing state management
- Credit costs (if present in current repo, keep them)

---

## 5. CinemaStudio

**Current file:** `packages/studio/src/components/CinemaStudio.jsx` (~1,177 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Camera controls | Camera, lens, focal length, aperture presets |
| ScrollColumn | Scroll-snapping list with proximity selection |
| CameraControlsOverlay | Full-screen overlay with 4 scroll columns |
| Nano Banana prompt | `buildNanoBananaPrompt()` |
| Reference image upload | `uploadFile` for reference |
| History | `internalHistory`, `activeHistoryIndex` |
| Skills/recipes | `applyRecipe(skill)` |
| Storyboard handoff | `readStoryboardHandoff("cinema")` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream `CinemaStudio.jsx` | Identify any UX improvements; add if beneficial |

### What Stays Unchanged

- All existing camera controls
- All existing presets
- All existing generation flows

---

## 6. AudioStudio

**Current file:** `packages/studio/src/components/AudioStudio.jsx` (~1,084 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Model-driven form | Dynamic form from `selectedModel.inputs` |
| AudioFileUploader | Single file upload with progress |
| AudioListUploader | Multi-file upload for array fields |
| PremiumAudioPlayer | Custom audio UI with equalizer bars |
| CostEstimator | Cost preview integration |
| TemplateBanner | Template loaded indicator |
| History | `internalHistory`, `activeHistoryIdx` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Drag-and-drop upload** | Upstream `AudioStudio.jsx` | Add drag handlers to `AudioFileUploader` (`handleDragEnter/Leave/Over/Drop`) |
| 2 | **Drag-and-drop for list** | Upstream `AudioStudio.jsx` | Add drag handlers to `AudioListUploader` |
| 3 | **i18n support** | Upstream `AudioStudio.jsx` | Import `en/audioStudio.json`, `zh/audioStudio.json`; use `resolveCopy()` |

### What Stays Unchanged

- CostEstimator integration
- TemplateBanner integration
- All existing upload logic
- PremiumAudioPlayer

---

## 7. LipSyncStudio

**Current file:** `packages/studio/src/components/LipSyncStudio.jsx` (~1,301 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Image/video input modes | `inputMode` ('image'|'video') |
| Audio upload | `audioState/Name/Url/Progress` |
| Resolution selection | `selectedResolution` |
| PublishStep/AssistStep | Social publishing and AI assist |
| MediaPickerButton | Reusable upload button with preview |
| Inline dropdown | Viewport-aware positioning |
| History thumbnails | Hover-play video preview |
| Drag-drop | Routes files by MIME type |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Enhanced drag-and-drop** | Upstream `LipSyncStudio.jsx` | Add `isDragging`, `dragCounterRef` to MediaPickerButton; add `handleDragEnter/Leave/Over/Drop` |
| 2 | **PromptComposer integration** | Upstream `LipSyncStudio.jsx` | Import PromptComposer components; wrap prompt area |
| 3 | **i18n support** | Upstream `LipSyncStudio.jsx` | Import `en/lipSyncStudio.json`, `zh/lipSyncStudio.json`; use `resolveCopy()` |

### What Stays Unchanged

- PublishStep/AssistStep integrations
- All existing upload logic
- History thumbnails with hover-play
- Inline dropdown positioning

---

## 8. VibeMotionStudio

**Current file:** `packages/studio/src/components/VibeMotionStudio.jsx` (~789 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Prompt/aspect/duration | Core generation parameters |
| Edit mode | `editMode`, `editSourceId` |
| Native audio | `nativeAudio` flag |
| Dropdown | AR, duration, source picker |
| History | `history` with `canEdit` flag |
| Fullscreen | `fullscreenUrl` |
| Skills/recipes | `applyRecipe(skill)` |
| Storyboard handoff | `readStoryboardHandoff("vibe-motion")` |
| Template data | `useTemplateData` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream `VibeMotionStudio.jsx` | Identify any UX improvements; add if beneficial |

### What Stays Unchanged

- All existing generation logic
- All existing state management
- Edit mode with source selection

---

## 9. ClippingStudio

**Current file:** `packages/studio/src/components/ClippingStudio.jsx` (~1,078 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Video clipping | `runClipping` with highlight extraction |
| Num highlights | 1-60 highlights |
| Aspect ratio | 6 options |
| Coordinates-only mode | `returnCoordinatesOnly` for timeline seek |
| Video upload | 50MB limit, progress tracking |
| History | `history` with source video thumbnails |
| Template data | `useTemplateData` |
| Storyboard handoff | `readStoryboardHandoff("clipping")` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream `ClippingStudio.jsx` | Identify any UX improvements; add if beneficial |

### What Stays Unchanged

- All existing clipping logic
- All existing UI components
- Coordinates-only mode

---

## 10. RecastStudio

**Current file:** `packages/studio/src/components/RecastStudio.jsx` (~929 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Body swap | `processRecast` for video+image |
| Video upload | 50MB limit, progress tracking |
| Image upload | 10MB limit |
| Aspect ratio | Model-specific options |
| MediaPickerButton | Reused from LipSync |
| Inline dropdown | Viewport-aware positioning |
| History | `internalHistory`, `activeHistoryIdx` |
| Template data | `useTemplateData` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream `RecastStudio.jsx` | Identify any UX improvements; add if beneficial |

### What Stays Unchanged

- All existing body swap logic
- All existing upload handlers
- All existing integrations

---

## 11. WorkflowStudio

**Current file:** `packages/studio/src/components/WorkflowStudio.jsx` (~1,154 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Template workflows | `getTemplateWorkflows` |
| User workflows | `getUserWorkflows`, `createWorkflow`, `deleteWorkflow` |
| Published workflows | `getPublishedWorkflows` |
| Workflow builder | `WorkflowUI` dynamic import |
| Playground | Form/API view |
| Input schema | `getWorkflowInputs`, `getAllNodeSchemas` |
| Execution | `executeWorkflow` with polling |
| Rename/delete | Inline rename, delete with confirmation |
| URL routing | `/workflow/[id]/[tab]` and `/studio/workflows/[id]/[tab]` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream `WorkflowStudio.jsx` | Identify any UX improvements; add if beneficial |

### What Stays Unchanged

- All existing workflow logic
- All existing routing
- WorkflowUI dynamic import

---

## 12. AgentStudio

**Current file:** `packages/studio/src/components/AgentStudio.jsx` (~333 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Template agents | `getTemplateAgents` |
| User agents | `getUserAgents` |
| Conversations | `getUserConversations` |
| Agent cards | Grid with hover effects, edit button |
| Conversation cards | Title, agent name, timestamp, message count |
| Navigation | `/agents/[id]`, `/agents/edit/[id]`, `/agents/create` |
| Icon proxy | `toProxiedIcon` for CDN images |
| Time ago | `timeAgo` helper |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream `AgentStudio.jsx` | Identify any UX improvements; add if beneficial |

### What Stays Unchanged

- All existing agent/chat logic
- All existing navigation
- Icon proxy logic

---

## 13. DesignAgentStudio

**Current file:** `packages/studio/src/components/DesignAgentStudio.jsx` (~89 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| CreativeCanvas wrapper | Third-party canvas from `design-agent` package |
| Error boundary | `ErrorBoundary`, `CreativeCanvasErrorBoundary` |
| User fetch | `getUserBalance(apiKey)` |
| LocalStorage auth | Stores `apiKey` as `token` |
| Credit conversion | `creditConversionRate={200}` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream `DesignAgentStudio.jsx` | Identify any UX improvements; add if beneficial |

### What Stays Unchanged

- All existing CreativeCanvas integration
- Error boundary logic
- Auth token storage

---

## 14. AiInfluencerStudio

**Current file:** `packages/studio/src/components/AiInfluencerStudio.jsx` (~855 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Face/body/style tabs | `TABS_CONFIG` with subcategories |
| Option selection | `selectedOptions` per subcategory |
| Aspect ratio | 3:4, 1:1, 9:16, 16:9 |
| Custom prompt | `customPrompt` input |
| Shuffle | `handleShuffle()` randomizes selections |
| History | Capped at 50 entries |
| AbortController | Per-generation cancellation |
| Hover pills | `HoverPill` with tooltip images |
| Image fallback | `character_type_human.webp` on error |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream `AiInfluencerStudio.jsx` | Identify any UX improvements; add if beneficial |

### What Stays Unchanged

- All existing tab logic
- All existing option selection
- All existing generation flows

---

## 15. MarketingStudio

**Current file:** `packages/studio/src/components/MarketingStudio.jsx` (~732 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Product image upload | `productImage` with progress |
| Avatar image upload | `avatarImage` with preset avatars |
| Additional images | `additionalImages[]` (max 6) |
| UGC presets | `ASSETS.ugc` video presets |
| Avatar presets | `ASSETS.avatar` (8 avatars) |
| Placeholder convention | `@image1`/`@image2` in prompt |
| History | `history` with fullscreen |
| Template data | `useTemplateData` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream `MarketingStudio.jsx` | Identify any UX improvements; add if beneficial |

### What Stays Unchanged

- All existing upload logic
- All existing UGC/avatar presets
- All existing generation flows

---

## 16. BrandStudio (App)

**Current file:** `app/brand-studio/page.tsx` (~176 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| URL input | Website URL for brand analysis |
| 3-step progress | Fetching, analyzing, saving |
| Recent brands | Grid of previously analyzed brands |
| Feature pills | Brand DNA, Campaigns, 8 Platforms, etc. |
| Entitlement gating | `SMARTVIDEO_GO` via `requireEntitlement` |
| Navigation | `/brand/:id` on success |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream deleted this file | No additions needed; current version is preserved |

### What Stays Unchanged

- All existing UI and logic
- All existing API calls (`/api/brands`)

---

## 17. PhotoStudio (App)

**Current file:** `app/photo-studio/page.tsx` (~173 lines)

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Brand selector | Dropdown with brand list |
| Category pills | 6 categories (E-commerce, Lifestyle, etc.) |
| Style grid | 5 styles per category |
| Product URL input | Optional product image URL |
| Generation | POST to `/api/photo-studio` |
| Polling | `pollUntilDone` (90 attempts, 2s interval) |
| History | Per-brand generation history |
| Download | Blob download fallback |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream deleted this file | No additions needed; current version is preserved |

### What Stays Unchanged

- All existing UI and logic
- All existing API calls

---

## 18. ThumbnailStudio (App)

**Current file:** `src/apps/thumbnail-studio/ThumbnailStudio.tsx`

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Streaming generation | `MuapiImageStream` |
| Gallery | `ImageGallery` component |
| Community sharing | Supabase public thumbnails |
| Model dropdown | Searchable, 4 OpenAI models |
| Template chips | 10 thumbnail templates |
| Style presets | 8 CTR-optimized styles |
| Multi-turn refinement | Image-to-image via `getImageClient` |
| Cross-studio handoff | `readStoryboardHandoff("thumbnail-studio")` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream deleted this directory | No additions needed; current version is preserved |

### What Stays Unchanged

- All existing generation logic
- All existing gallery logic
- All existing Supabase integration

---

## 19. VFXStudio (App)

**Current files:**
- `src/apps/vfx-studio/VFXStudio.tsx`
- `src/apps/vfx-studio/pages/VFXGenerate.tsx`
- `src/apps/vfx-studio/components/BottomInputBar.tsx`
- `src/apps/vfx-studio/components/ApiKeyModal.tsx`
- `src/apps/vfx-studio/components/ImageUrlModal.tsx`
- `src/apps/vfx-studio/components/VideoPopup.tsx`

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Effect selection | 32+ effects (AI, Motion, VFX) |
| Image upload | Drag-drop, URL paste, file upload |
| BottomInputBar | Fixed input bar with dropdowns |
| ApiKeyModal | API key input when missing |
| ImageUrlModal | URL input modal |
| VideoPopup | Floating video player |
| Generation lifecycle | `useVideoGeneration` hook |
| Progress tracking | Real-time progress updates |
| Cancellation | `/api/vfx/cancel` |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream deleted this directory | No additions needed; current version is preserved |

### What Stays Unchanged

- All existing VFX logic
- All existing UI components
- All existing API calls

---

## 20. VideoStudio (App)

**Current files:**
- `src/apps/video-studio/VideoStudio.tsx`
- `src/apps/video-studio/pages/VideoGenerate.tsx`
- `src/apps/video-studio/pages/VideoEditor.tsx`
- `src/apps/video-studio/pages/VideoLibrary.tsx`

### Existing Features (Preserved)

| Feature | Description |
|---|---|
| Text-to-video | Kling, Veo, Sora, LTX models |
| Model selector | 4 model options |
| Duration/aspect ratio | Configurable generation params |
| Advanced controls | Model-specific parameters |
| VideoEditor | Placeholder with duration slider |
| VideoLibrary | Placeholder grid |

### New Features to ADD

| # | Feature | Source | Implementation |
|---|---------|--------|----------------|
| 1 | **Review upstream diff** | Upstream deleted this directory | No additions needed; current version is preserved |

### What Stays Unchanged

- All existing generation logic
- All existing UI components

---

## Summary: Feature Addition Matrix

| Studio | Total Existing Features | New Features to ADD | Removals |
|--------|------------------------|---------------------|----------|
| **ImageStudio** | 15 | 9 | 0 |
| **VideoStudio** | 12 | 10 | 0 |
| **VideoStudioParity** | 18 | 0 | 0 |
| **LayersStudio** | 12 | 1 | 0 |
| **CinemaStudio** | 8 | 1 (review) | 0 |
| **AudioStudio** | 7 | 3 | 0 |
| **LipSyncStudio** | 11 | 3 | 0 |
| **VibeMotionStudio** | 10 | 1 (review) | 0 |
| **ClippingStudio** | 9 | 1 (review) | 0 |
| **RecastStudio** | 8 | 1 (review) | 0 |
| **WorkflowStudio** | 11 | 1 (review) | 0 |
| **AgentStudio** | 8 | 1 (review) | 0 |
| **DesignAgentStudio** | 5 | 1 (review) | 0 |
| **AiInfluencerStudio** | 9 | 1 (review) | 0 |
| **MarketingStudio** | 8 | 1 (review) | 0 |
| **BrandStudio (App)** | 6 | 0 | 0 |
| **PhotoStudio (App)** | 8 | 0 | 0 |
| **ThumbnailStudio (App)** | 8 | 0 | 0 |
| **VFXStudio (App)** | 8 | 0 | 0 |
| **VideoStudio (App)** | 6 | 0 | 0 |
| **TOTAL** | **~170** | **~25** | **0** |

---

## Cross-Cutting Enhancements (Apply to Multiple Studios)

### Drag-and-Drop Pattern

Applied to:
- ImageStudio.UploadButton
- AudioStudio.AudioFileUploader
- AudioStudio.AudioListUploader
- LipSyncStudio.MediaPickerButton
- DrawModal (background + overlay)

**Pattern:**
```javascript
// State
const [isDragging, setIsDragging] = useState(false);
const dragCounterRef = useRef(0);

// Handlers
const handleDragEnter = (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounterRef.current += 1;
  if (e.dataTransfer?.items?.length > 0) setIsDragging(true);
};

const handleDragLeave = (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounterRef.current -= 1;
  if (dragCounterRef.current <= 0) {
    dragCounterRef.current = 0;
    setIsDragging(false);
  }
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounterRef.current = 0;
  setIsDragging(false);
  const files = Array.from(e.dataTransfer?.files || []);
  // Process files...
};
```

### i18n Pattern

Applied to:
- ImageStudio
- VideoStudio
- LayersStudio
- AudioStudio
- LipSyncStudio

**Pattern:**
```javascript
import en from "../messages/en/studioName.json";
import zh from "../messages/zh/studioName.json";
import { resolveCopy } from "../i18nUtils";

const copy = resolveCopy(en, zh, locale);

// Usage
<button>{copy.actions.generate}</button>
```

### Toast Notification Pattern

Applied to:
- ImageStudio
- VideoStudio

**Pattern:**
```javascript
import toast, { Toaster } from "react-hot-toast";

// In component
<Toaster position="bottom-right" />

// On success
toast.success("Generation complete!");

// On error
toast.error(formatErrorMessage(err));
```

### Scoped Persistence Pattern

Applied to:
- ImageStudio
- VideoStudio

**Pattern:**
```javascript
import { scopedPersistKey, migrateLegacyPersistKey } from "../persistKey.js";

const persistKey = scopedPersistKey("hg_studio_persistent", apiKey);

// On mount, migrate legacy key
useEffect(() => {
  migrateLegacyPersistKey("hg_studio_persistent", persistKey);
}, [persistKey]);
```

---

## Implementation Order

### Priority 1: Core Infrastructure
1. `muapi.js` — Add `processMotionControl()`
2. `models.js` — Add `getMotionControlModelById()`, update names, add new models
3. `persistKey.js` — Add `migrateLegacyPersistKey()`
4. `i18nUtils.js` — Enhance with `mergeCopy()`, `resolveRuntimeLocale()`
5. Model infrastructure — Merge updates to `modelFamilies.js`, `modelCapabilities.js`, `modelParameters.js`, `videoWorkflows.js`, `videoToolCapabilities.js`, `videoMediaInputs.js`

### Priority 2: Shared Components
6. `DrawModal.jsx` — Add drag-and-drop
7. `ImageStudio.jsx` — Add drag-drop, i18n, toast, scoped persistence
8. `VideoStudio.jsx` — Add PromptComposer, reference uploads, i18n, toast, scoped persistence

### Priority 3: Remaining Studios
9. `LayersStudio.jsx` — Add i18n
10. `AudioStudio.jsx` — Add drag-drop, i18n
11. `LipSyncStudio.jsx` — Add drag-drop, PromptComposer, i18n
12. Remaining studios — Review and add beneficial changes

### Priority 4: Verification
13. Studio-by-studio testing
14. Regression testing
15. Build verification

---

## Verification Checklist

For each studio, verify:

- [ ] All existing features work exactly as before
- [ ] New features are accessible alongside existing ones
- [ ] No console errors
- [ ] No 404s for any files
- [ ] API calls succeed
- [ ] Upload/download flows work
- [ ] History persists correctly
- [ ] localStorage persistence works
- [ ] Cross-studio handoff works
- [ ] Skills/recipes apply correctly
- [ ] Template data prefill works

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Accidental removal of features | Strictly additive rule; every change adds, never removes |
| Breaking existing flows | Test each studio individually after changes |
| i18n incompleteness | Keep English as fallback; add zh as optional |
| Drag-drop breaking click | Add drag-drop alongside click, never replace |
| Persistence migration issues | Keep unscoped keys as fallback |

---

## Files Modified Summary

| File | Action | Changes |
|------|--------|---------|
| `packages/studio/src/muapi.js` | Modify | ADD `processMotionControl()` |
| `packages/studio/src/models.js` | Modify | ADD `getMotionControlModelById()`, update names, add models |
| `packages/studio/src/persistKey.js` | Modify | ADD `migrateLegacyPersistKey()` |
| `packages/studio/src/i18nUtils.js` | Modify | ADD `mergeCopy()`, `resolveRuntimeLocale()` |
| `packages/studio/src/modelFamilies.js` | Modify | ADD new aliases/families |
| `packages/studio/src/modelCapabilities.js` | Modify | ADD improvements |
| `packages/studio/src/modelParameters.js` | Modify | ADD improvements |
| `packages/studio/src/videoWorkflows.js` | Modify | ADD new workflow definitions |
| `packages/studio/src/videoToolCapabilities.js` | Modify | ADD new overrides |
| `packages/studio/src/videoMediaInputs.js` | Modify | ADD improvements |
| `packages/studio/src/generationLifecycle.js` | Modify | ADD improvements |
| `packages/studio/src/components/DrawModal.jsx` | Modify | ADD drag-and-drop |
| `packages/studio/src/components/ImageStudio.jsx` | Modify | ADD drag-drop, i18n, toast, scoped persistence |
| `packages/studio/src/components/VideoStudio.jsx` | Modify | ADD PromptComposer, ref uploads, i18n, toast |
| `packages/studio/src/components/LayersStudio.jsx` | Modify | ADD i18n |
| `packages/studio/src/components/AudioStudio.jsx` | Modify | ADD drag-drop, i18n |
| `packages/studio/src/components/LipSyncStudio.jsx` | Modify | ADD drag-drop, PromptComposer, i18n |
| `packages/studio/src/components/CinemaStudio.jsx` | Review | ADD beneficial changes |
| `packages/studio/src/components/ClippingStudio.jsx` | Review | ADD beneficial changes |
| `packages/studio/src/components/RecastStudio.jsx` | Review | ADD beneficial changes |
| `packages/studio/src/components/VibeMotionStudio.jsx` | Review | ADD beneficial changes |
| `packages/studio/src/components/WorkflowStudio.jsx` | Review | ADD beneficial changes |
| `packages/studio/src/components/AgentStudio.jsx` | Review | ADD beneficial changes |
| `packages/studio/src/components/DesignAgentStudio.jsx` | Review | ADD beneficial changes |
| `packages/studio/src/components/AiInfluencerStudio.jsx` | Review | ADD beneficial changes |
| `packages/studio/src/components/MarketingStudio.jsx` | Review | ADD beneficial changes |

**Files explicitly NOT modified:**
- `packages/studio/src/components/VideoStudioParity.jsx`
- `packages/studio/src/components/CostEstimator.jsx`
- `packages/studio/src/components/PromptLibrary.jsx`
- `packages/studio/src/components/SkillsBrowser.jsx`
- `packages/studio/src/components/TemplateBanner.jsx`
- `packages/studio/src/components/UniversalMediaUploader.jsx`
- `packages/studio/src/components/WorkflowUI.jsx`
- `packages/studio/src/hooks/useTemplateData.js`
- `packages/studio/src/lib/characterStore.js`
- `packages/studio/src/lib/costEstimate.js`
- `packages/studio/src/lib/promptRecipes.js`
- `packages/studio/src/lib/skillStore.js`
- `packages/studio/src/skills/registry.json`
- `packages/studio/src/storyboardHandoff.js`
- `packages/studio/src/thumbnail-map.js`
- `packages/studio/src/thumbnail-map.json`
- `packages/studio/src/videoAdvancedControls.js`
- `packages/studio/src/videoAdvancedControls.test.js`
- `packages/studio/src/videoWorkflows.test.js`
- `packages/studio/src/muapi.advanced.test.js`
- `app/brand-studio/page.tsx`
- `app/photo-studio/page.tsx`
- `src/apps/thumbnail-studio/`
- `src/apps/vfx-studio/`
- `src/apps/video-studio/`
