# Full Studio Re-Audit and Completion Plan

## Objective
Independently re-audit every studio that exists in both `upstream/main` and the current repo, without relying on the earlier pass. For each studio, identify what upstream has that the current repo is missing, and produce an additive-only execution plan.

## Scope
- **In scope:** All 14 common studios in `packages/studio/src/components/`
- **Out of scope:** AppsStudio, McpCliStudio, MotionControlStudio, `src/apps/*`, `app/brand-studio`, `app/photo-studio`

## Additive-Only Rule
- ✅ Add new functions, props, UI, handlers, integrations
- ❌ Never remove existing functionality
- ❌ Never replace a current studio with an upstream rewrite

## Re-Audit Methodology
For each studio:
1. Fetch upstream version to a temp file
2. Grep upstream for key feature markers
3. Grep current version for same markers
4. Classify: PRESENT, MISSING, or INTENTIONAL_DIVERGENCE
5. Record exact file paths and line markers

---

## Studio 1: PromptComposer.jsx
**File:** `packages/studio/src/components/prompt/PromptComposer.jsx`

**Upstream checks:**
- Exports: `promptControlClassName`, `promptMediaButtonClassName`, `PROMPT_MEDIA_PREVIEW_CLASS`, `PROMPT_CONTROL_LABEL_CLASS`, `PromptChevronIcon`, `PromptAspectRatioIcon`, `PromptDurationIcon`, `PromptQualityIcon`, `PromptPopover`, `PromptPopoverHeader`, `PromptMenuList`, `PromptMenuItem`, `PromptAction`, `PromptFooter`, `PromptControls`, `PromptSegmentedControl`, `PromptSegmentOption`, `PromptTextarea`, `PromptComposer`
- Design tokens: `DEFAULT_PANEL_CLASS`, `DEFAULT_TEXTAREA_CLASS`, `DEFAULT_ACTION_CLASS`, `CONTROL_LAYOUT_CLASS`, `CONTROL_IDLE_CLASS`, `CONTROL_ACTIVE_CLASS`, `MEDIA_CONTROL_LAYOUT_CLASS`, `DEFAULT_POPOVER_POSITION_CLASS`, `DEFAULT_POPOVER_CLASS`

**Current checks:**
- grep for all exports above
- grep for all design tokens above

**Classification:** COMPLETE if all markers present.

---

## Studio 2: ImageStudio.jsx
**File:** `packages/studio/src/components/ImageStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `PromptPopover` wrapper around upload panel
2. `promptMediaButtonClassName` usage on trigger
3. UploadButton props: `persistedHistory`, `onHistoryChange`, `copy`
4. UploadButton state: `isDragging`, `dragCounterRef`
5. UploadButton handlers: `handleTriggerDragEnter`, `handleTriggerDragLeave`, `handleTriggerDragOver`, `handleTriggerDrop`, `processFiles`
6. UploadButton i18n: `t.tooLargeAlert`, `t.uploadFailedAlert`, `t.headerTitle`, `t.selectUpTo`, `t.doneButton`, `t.uploadFilesButton`, `t.uploadNewButton`, `t.emptyState`, `t.selectedCount`, `t.useSelected`
7. ModelDropdown props: `copy`
8. ModelDropdown state: `selectedCategory`, `modelCategories`
9. ModelDropdown filter: `activeCategory.entries`
10. ModelDropdown category tabs UI
11. ModelDropdown i18n: `t.categoryAll`, `t.categoryT2I`, `t.categoryI2I`, `t.modelsSuffix`, `t.noModelsFound`
12. Main component: `locale` prop
13. Main component: `resolveCopy(en, zh, locale)`
14. i18n imports: `en`, `zh`, `resolveCopy`

**Current checks:**
- grep for each marker above in current file

**Classification:**
- PRESENT if marker found
- MISSING if upstream has it and current doesn't
- INTENTIONAL_DIVERGENCE if upstream removed it but current has it

---

## Studio 3: VideoStudio.jsx
**File:** `packages/studio/src/components/VideoStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `ReferenceMediaLabel` function
2. `ReferencePreview` function
3. `ReferenceUploadButton` function
4. `PromptComposer` wrapper around prompt bar
5. `PromptTextarea` replacing textarea
6. `Toaster` component
7. `toast` import
8. `locale` prop
9. `resolveCopy(en, zh, locale)`
10. i18n imports: `en`, `zh`, `resolveCopy`
11. ReferenceUploadButton drag handlers
12. ReferencePreview media type handling

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 4: AudioStudio.jsx
**File:** `packages/studio/src/components/AudioStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `AudioFileUploader` props: `copy = en`
2. `AudioFileUploader` state: `isDragging`, `dragCounterRef`
3. `AudioFileUploader` handlers: `handleDragEnter`, `handleDragLeave`, `handleDragOver`, `handleDrop`
4. `AudioFileUploader` i18n: `copy.uploader.sizeLimitError`, `copy.uploader.uploadFailedError`, `copy.uploader.clear`, `copy.uploader.uploadPrompt`, `copy.uploader.uploadHint`, `copy.uploader.uploading`, `copy.uploader.ready`
5. `AudioFileUploader` `handleInputChange`
6. `AudioListUploader` props: `copy = en`
7. `AudioListUploader` i18n: `copy.uploader.maxSuffix`, `copy.uploader.trackLabel`
8. Main component: `locale` prop
9. Main component: `resolveCopy(en, zh, locale)`
10. i18n imports: `en`, `zh`, `resolveCopy`

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 5: LipSyncStudio.jsx
**File:** `packages/studio/src/components/LipSyncStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `MediaPickerButton` props: `mediaCopy = en.media`
2. `MediaPickerButton` state: `isDragging`, `dragCounterRef`
3. `MediaPickerButton` handlers: `handleDragEnter`, `handleDragLeave`, `handleDragOver`, `handleDrop`
4. `MediaPickerButton` className: `promptMediaButtonClassName`
5. `MediaPickerButton` i18n: `mediaCopy.clickToClear`, `mediaCopy.uploadFilePrefix`, `mediaCopy.uploadFileSuffix`
6. `Dropdown` uses `PromptPopover`
7. `Dropdown` uses `PromptPopoverHeader`
8. `Dropdown` uses `PromptMenuList`, `PromptMenuItem`
9. Prompt area wrapped in `PromptComposer`
10. `PromptTextarea` replacing textarea
11. Main component: `locale` prop
12. Main component: `resolveCopy(en, zh, locale)`
13. i18n imports: `en`, `zh`, `resolveCopy`
14. PromptComposer imports

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 6: DrawModal.jsx
**File:** `packages/studio/src/components/DrawModal.jsx`

**Upstream feature markers to check in current repo:**
1. State: `isBgDragging`, `bgDragCounterRef`
2. State: `isOverlayDragging`, `overlayDragCounterRef`
3. Handlers: `handleBgDragEnter`, `handleBgDragLeave`, `handleBgDragOver`, `handleBgDrop`
4. Handlers: `handleOverlayDragEnter`, `handleOverlayDragLeave`, `handleOverlayDragOver`, `handleOverlayDrop`
5. `handleUploadBg` accepts `filesOrEvent`
6. `handleInsertImage` accepts `filesOrEvent`
7. Setup card has drag handlers
8. Setup card has conditional styling: `border-[#b5f500]`
9. Insert-image button has drag handlers
10. Model names: `"Nano Banana Pro"` (not `"Nano Banana Pro Edit"`)
11. Model names: `"Nano Banana 2"` (not `"Nano Banana 2 Edit"`)

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 7: AgentStudio.jsx
**File:** `packages/studio/src/components/AgentStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `toProxiedIcon` helper
2. `imgError` state
3. `handleImgError` handler
4. `PublishStep` integration
5. `AssistStep` integration
6. `useTemplateData` hook
7. `TemplateBanner` component
8. `readStoryboardHandoff` / `clearStoryboardHandoff`
9. `getPendingRecipe` / `clearPendingRecipe`
10. `fillTemplate`
11. i18n: `resolveCopy`, `en`, `zh`

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 8: AiInfluencerStudio.jsx
**File:** `packages/studio/src/components/AiInfluencerStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `PublishStep` integration
2. `AssistStep` integration
3. `getPendingRecipe` / `clearPendingRecipe`
4. `fillTemplate`
5. `useTemplateData`, `normalizeAspectRatio`
6. `TemplateBanner`
7. `readStoryboardHandoff` / `clearStoryboardHandoff`
8. `abortRef` cleanup
9. `applyRecipe` function
10. `handoffApplied` ref
11. `toast` / `Toaster`
12. `formatErrorMessage`
13. `MobileGenerationActions` / `GenerationCopyButtons`
14. i18n: `resolveCopy`, `en`, `zh`

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 9: CinemaStudio.jsx
**File:** `packages/studio/src/components/CinemaStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `PublishStep` integration
2. `AssistStep` integration
3. `getPendingRecipe` / `clearPendingRecipe`
4. `fillTemplate`
5. `useTemplateData`, `isValidAspectRatio`, `normalizeAspectRatio`
6. `TemplateBanner`
7. `readStoryboardHandoff` / `clearStoryboardHandoff`
8. `isSnapEnabled`
9. `getSelectedDescription`
10. Improved `Dropdown` with snap behavior
11. `scopedPersistKey` / `migrateLegacyPersistKey`
12. `MobileGenerationActions` / `CopyContentIcon`
13. PromptComposer imports
14. i18n: `resolveCopy`, `en`, `zh`

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 10: ClippingStudio.jsx
**File:** `packages/studio/src/components/ClippingStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `PublishStep` integration
2. `getPendingRecipe` / `clearPendingRecipe`
3. `fillTemplate`
4. `useTemplateData`, `normalizeAspectRatio`
5. `TemplateBanner`
6. `readStoryboardHandoff` / `clearStoryboardHandoff`
7. `ClockIcon`, `CheckIcon`, `ChevronDownIcon`
8. `toast` / `Toaster`
9. `formatErrorMessage`
10. `scopedPersistKey` / `migrateLegacyPersistKey`
11. `MobileGenerationActions` / `GenerationCopyButtons`
12. PromptComposer imports

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 11: DesignAgentStudio.jsx
**File:** `packages/studio/src/components/DesignAgentStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `ErrorBoundary` class
2. `CreativeCanvasErrorBoundary` class
3. `sessionStorage.setItem("fromDesignAgent", "true")`
4. `localStorage.setItem("token", apiKey)`

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 12: LayersStudio.jsx
**File:** `packages/studio/src/components/LayersStudio.jsx`

**Upstream feature markers to check in current repo:**
1. Credit cost badges: `opt.cost`
2. Credit badge UI: `copy.removeBg.credit`, `copy.expandCrop.credit`
3. i18n: `resolveCopy`, `zh` (upstream removed zh, current has it — intentional divergence)

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 13: MarketingStudio.jsx
**File:** `packages/studio/src/components/MarketingStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `PublishStep` integration
2. `getPendingRecipe` / `clearPendingRecipe`
3. `fillTemplate`
4. `useTemplateData`, `normalizeAspectRatio`
5. `TemplateBanner`
6. `readStoryboardHandoff` / `clearStoryboardHandoff`
7. `UploadSlot` component
8. `scopedPersistKey` / `migrateLegacyPersistKey`
9. `MobileGenerationActions` / `GenerationCopyButtons`
10. PromptComposer imports

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 14: RecastStudio.jsx
**File:** `packages/studio/src/components/RecastStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `PublishStep` integration
2. `getPendingRecipe` / `clearPendingRecipe`
3. `fillTemplate`
4. `useTemplateData`, `normalizeAspectRatio`
5. `TemplateBanner`
6. `readStoryboardHandoff` / `clearStoryboardHandoff`
7. `toast` / `Toaster`
8. `formatErrorMessage`
9. `scopedPersistKey` / `migrateLegacyPersistKey`
10. `MobileGenerationActions` / `GenerationCopyButtons`
11. PromptComposer imports

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 15: VibeMotionStudio.jsx
**File:** `packages/studio/src/components/VibeMotionStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `PublishStep` integration
2. `getPendingRecipe` / `clearPendingRecipe`
3. `fillTemplate`
4. `useTemplateData`, `normalizeAspectRatio`
5. `TemplateBanner`
6. `readStoryboardHandoff` / `clearStoryboardHandoff`
7. `toast` / `Toaster`
8. `formatErrorMessage`
9. `scopedPersistKey` / `migrateLegacyPersistKey`
10. `MobileGenerationActions` / `GenerationCopyButtons`
11. PromptComposer imports

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 16: WorkflowStudio.jsx
**File:** `packages/studio/src/components/WorkflowStudio.jsx`

**Upstream feature markers to check in current repo:**
1. `buildWorkflowApiSnippets` import
2. `imgError` state
3. `handleImgError` handler
4. Thumbnail `onError` handler
5. `buildWorkflowApiSnippets` usage

**Current checks:**
- grep for each marker above in current file

**Classification:** Same as above

---

## Studio 17: WorkflowUI.jsx
**File:** `packages/studio/src/components/WorkflowUI.jsx`

**Upstream feature markers to check in current repo:**
1. Props: `apiKey`
2. Props: `onGenerationStart`
3. Props: `onGenerationEnd`
4. Props: `onGenerationComplete`
5. Props: `onGenerationError`
6. Props forwarded to `<WorkflowBuilder>`: `apiKey`, `onGenerationStart`, `onGenerationEnd`, `onGenerationComplete`, `onGenerationError`

**Current checks:**
- grep for each marker above in current file

**Classification:**
- MISSING if upstream has these and current doesn't

---

## Execution Order
1. Re-audit all 17 studios using the methodology above
2. Produce missing-feature table
3. Create execution plan ordered by dependency
4. Implement changes additively
5. Verify build after each change

## Verification
- Run `npm run build` after each change
- Run `git diff upstream/main -- <file>` to confirm only additive changes
- No existing features removed
