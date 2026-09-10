# Full Studio Re-Audit and Completion Plan (Corrected)

## Objective
Independently re-audit every actual studio that exists in both `upstream/main` and the current repo. DrawModal.jsx and PromptComposer.jsx are shared components, not studios.

## Scope
- **Studios in scope:** All 14 common studio components in `packages/studio/src/components/*Studio.jsx`
- **Shared components (not studios):** PromptComposer.jsx, DrawModal.jsx, MobileGenerationActions.jsx, ModelParameterControls.jsx, WorkflowUI.jsx, WorkflowStudio.jsx
- **Out of scope:** AppsStudio, McpCliStudio, MotionControlStudio, `src/apps/*`, `app/brand-studio`, `app/photo-studio`

## Additive-Only Rule
- ✅ Add new functions, props, UI, handlers, integrations
- ❌ Never remove existing functionality
- ❌ Never replace a current studio with an upstream rewrite

## Corrected Studio Inventory (14 studios)

| # | Studio | Status |
|---|--------|--------|
| 1 | ImageStudio.jsx | PARTIALLY COMPLETE |
| 2 | VideoStudio.jsx | PARTIALLY COMPLETE |
| 3 | AudioStudio.jsx | COMPLETE |
| 4 | LipSyncStudio.jsx | COMPLETE |
| 5 | AgentStudio.jsx | PARTIALLY COMPLETE |
| 6 | AiInfluencerStudio.jsx | PARTIALLY COMPLETE |
| 7 | CinemaStudio.jsx | PARTIALLY COMPLETE |
| 8 | ClippingStudio.jsx | PARTIALLY COMPLETE |
| 9 | DesignAgentStudio.jsx | COMPLETE |
| 10 | LayersStudio.jsx | COMPLETE |
| 11 | MarketingStudio.jsx | PARTIALLY COMPLETE |
| 12 | RecastStudio.jsx | PARTIALLY COMPLETE |
| 13 | VibeMotionStudio.jsx | PARTIALLY COMPLETE |
| 14 | WorkflowStudio.jsx | COMPLETE |

## Shared Components Status (not studios)

| Component | Status |
|-----------|--------|
| PromptComposer.jsx | COMPLETE — exact upstream match |
| DrawModal.jsx | COMPLETE — drag-drop + model names |
| MobileGenerationActions.jsx | COMPLETE — no diff |
| ModelParameterControls.jsx | COMPLETE — no diff |
| WorkflowUI.jsx | NEEDS FIX — props diverged from upstream |

---

## Re-Audit Results by Studio

### 1. ImageStudio.jsx — ⚠️ MISSING FEATURES
**File:** `packages/studio/src/components/ImageStudio.jsx`

**PRESENT:**
- ✓ PromptPopover, promptMediaButtonClassName
- ✓ UploadButton: persistedHistory, onHistoryChange, copy, isDragging, dragCounterRef, drag handlers, processFiles, PromptPopover wrapper, i18n strings
- ✓ ModelDropdown: copy, selectedCategory, modelCategories, activeCategory, category tabs, search
- ✓ Main: locale, resolveCopy(en, zh, locale), i18n imports
- ✓ readStoryboardHandoff, getPendingRecipe, PublishStep, AssistStep, setCharacterSheet, i2iModels

**MISSING:**
- ✗ AdvancedField component
- ✗ buildAdvChips helper
- ✗ getQualitiesForModel helper
- ✗ DropdownItem component
- ✗ useTemplateData integration
- ✗ TemplateBanner integration

**Action:** Add 6 missing features additively

---

### 2. VideoStudio.jsx — ⚠️ MISSING FEATURES
**File:** `packages/studio/src/components/VideoStudio.jsx`

**PRESENT:**
- ✓ ReferenceMediaLabel, ReferencePreview, ReferenceUploadButton
- ✓ PromptComposer wrapper, PromptTextarea, Toaster, toast
- ✓ locale, resolveCopy(en, zh, locale), i18n imports
- ✓ AdvancedField, buildAdvChips, getQualitiesForModel, DropdownItem
- ✓ readStoryboardHandoff, getPendingRecipe, setCharacterSheet
- ✓ i2vModels, v2vModels, videoAdvancedControls

**MISSING:**
- ✗ useTemplateData integration
- ✗ TemplateBanner integration

**Action:** Add 2 missing features additively

---

### 3. AudioStudio.jsx — ✅ COMPLETE
**File:** `packages/studio/src/components/AudioStudio.jsx`

**PRESENT:**
- ✓ AudioFileUploader: copy, isDragging, dragCounterRef, drag handlers, handleInputChange, i18n strings
- ✓ AudioListUploader: copy, maxSuffix, trackLabel
- ✓ Main: locale, resolveCopy(en, zh, locale), i18n imports

**Action:** None needed

---

### 4. LipSyncStudio.jsx — ✅ COMPLETE
**File:** `packages/studio/src/components/LipSyncStudio.jsx`

**PRESENT:**
- ✓ MediaPickerButton: mediaCopy, isDragging, dragCounterRef, acceptPrefix, drag handlers, promptMediaButtonClassName, i18n
- ✓ Dropdown: PromptPopover, PromptPopoverHeader, PromptMenuList, PromptMenuItem
- ✓ PromptComposer wrapper, PromptTextarea
- ✓ Main: locale, resolveCopy(en, zh, locale), i18n imports

**Action:** None needed

---

### 5. AgentStudio.jsx — ⚠️ MISSING FEATURES
**File:** `packages/studio/src/components/AgentStudio.jsx`

**PRESENT:**
- ✓ toProxiedIcon helper
- ✓ imgError state

**MISSING:**
- ✗ handleImgError function
- ✗ PublishStep integration
- ✗ AssistStep integration
- ✗ useTemplateData integration
- ✗ TemplateBanner integration
- ✗ readStoryboardHandoff / clearStoryboardHandoff
- ✗ getPendingRecipe / clearPendingRecipe
- ✗ fillTemplate
- ✗ i18n: resolveCopy, en, zh

**Action:** Add 9 missing features additively

---

### 6. AiInfluencerStudio.jsx — ⚠️ MISSING FEATURES
**File:** `packages/studio/src/components/AiInfluencerStudio.jsx`

**PRESENT:**
- ✓ PublishStep, AssistStep
- ✓ getPendingRecipe, clearPendingRecipe, fillTemplate
- ✓ useTemplateData, normalizeAspectRatio
- ✓ TemplateBanner
- ✓ readStoryboardHandoff, clearStoryboardHandoff
- ✓ abortRef, applyRecipe, handoffApplied

**MISSING:**
- ✗ toast/Toaster
- ✗ i18n: resolveCopy, en, zh

**Action:** Add toast/Toaster and i18n additively

---

### 7. CinemaStudio.jsx — ⚠️ MISSING FEATURES
**File:** `packages/studio/src/components/CinemaStudio.jsx`

**PRESENT:**
- ✓ PublishStep, AssistStep
- ✓ getPendingRecipe, clearPendingRecipe, fillTemplate
- ✓ useTemplateData, isValidAspectRatio, normalizeAspectRatio
- ✓ readStoryboardHandoff, clearStoryboardHandoff
- ✓ isSnapEnabled, getSelectedDescription
- ✓ Improved Dropdown with snap behavior

**MISSING:**
- ✗ TemplateBanner
- ✗ scopedPersistKey, migrateLegacyPersistKey
- ✗ i18n: resolveCopy, en, zh

**Action:** Add TemplateBanner, scoped persistence, and i18n additively

---

### 8. ClippingStudio.jsx — ⚠️ MISSING FEATURES
**File:** `packages/studio/src/components/ClippingStudio.jsx`

**PRESENT:**
- ✓ PublishStep
- ✓ getPendingRecipe, clearPendingRecipe, fillTemplate
- ✓ useTemplateData, normalizeAspectRatio
- ✓ TemplateBanner
- ✓ readStoryboardHandoff, clearStoryboardHandoff
- ✓ ClockIcon, CheckIcon, ChevronDownIcon

**MISSING:**
- ✗ toast/Toaster
- ✗ i18n: resolveCopy, en, zh

**Action:** Add toast/Toaster and i18n additively

---

### 9. DesignAgentStudio.jsx — ✅ COMPLETE
**File:** `packages/studio/src/components/DesignAgentStudio.jsx`

**PRESENT:**
- ✓ ErrorBoundary class
- ✓ CreativeCanvasErrorBoundary class
- ✓ sessionStorage.setItem("fromDesignAgent", "true")
- ✓ localStorage.setItem("token", apiKey)

**Action:** None needed

---

### 10. LayersStudio.jsx — ✅ COMPLETE
**File:** `packages/studio/src/components/LayersStudio.jsx`

**PRESENT:**
- ✓ Credit cost badges: opt.cost
- ✓ Credit badge UI: copy.removeBg.credit, copy.expandCrop.credit
- ✓ resolveCopy (with null zh — intentional divergence from upstream)

**Note:** Upstream removed zh i18n; current repo intentionally preserves it.

**Action:** None needed

---

### 11. MarketingStudio.jsx — ⚠️ MISSING FEATURES
**File:** `packages/studio/src/components/MarketingStudio.jsx`

**PRESENT:**
- ✓ PublishStep
- ✓ getPendingRecipe, clearPendingRecipe, fillTemplate
- ✓ useTemplateData, normalizeAspectRatio
- ✓ TemplateBanner
- ✓ readStoryboardHandoff, clearStoryboardHandoff
- ✓ UploadSlot component

**MISSING:**
- ✗ i18n: resolveCopy, en, zh

**Action:** Add i18n additively

---

### 12. RecastStudio.jsx — ⚠️ MISSING FEATURES
**File:** `packages/studio/src/components/RecastStudio.jsx`

**PRESENT:**
- ✓ PublishStep
- ✓ getPendingRecipe, clearPendingRecipe, fillTemplate
- ✓ useTemplateData, normalizeAspectRatio
- ✓ TemplateBanner
- ✓ readStoryboardHandoff, clearStoryboardHandoff

**MISSING:**
- ✗ toast/Toaster
- ✗ i18n: resolveCopy, en, zh

**Action:** Add toast/Toaster and i18n additively

---

### 13. VibeMotionStudio.jsx — ⚠️ MISSING FEATURES
**File:** `packages/studio/src/components/VibeMotionStudio.jsx`

**PRESENT:**
- ✓ PublishStep
- ✓ getPendingRecipe, clearPendingRecipe, fillTemplate
- ✓ useTemplateData, normalizeAspectRatio
- ✓ TemplateBanner
- ✓ readStoryboardHandoff, clearStoryboardHandoff

**MISSING:**
- ✗ toast/Toaster
- ✗ i18n: resolveCopy, en, zh

**Action:** Add toast/Toaster and i18n additively

---

### 14. WorkflowStudio.jsx — ✅ COMPLETE
**File:** `packages/studio/src/components/WorkflowStudio.jsx`

**PRESENT:**
- ✓ buildWorkflowApiSnippets import
- ✓ imgError state, handleImgError handler
- ✓ Thumbnail onError handler

**Action:** None needed

---

## Shared Components (Non-Studio)

### WorkflowUI.jsx — ⚠️ MISSING PROPS
**File:** `packages/studio/src/components/WorkflowUI.jsx`

**PRESENT:**
- ✓ workflowId, initialNodeSchemas, initialWorkflowData

**MISSING:**
- ✗ apiKey prop
- ✗ onGenerationStart prop
- ✗ onGenerationEnd prop
- ✗ onGenerationComplete prop
- ✗ onGenerationError prop
- ✗ Forwarding these to WorkflowBuilder

**Action:** Restore full props interface and forward to WorkflowBuilder additively

---

### DrawModal.jsx — ✅ COMPLETE (Shared Component)
**File:** `packages/studio/src/components/DrawModal.jsx`

**PRESENT:**
- ✓ Background drag-and-drop
- ✓ Overlay drag-and-drop
- ✓ Model name updates

**Action:** None needed

---

## Execution Plan

### Phase 1: WorkflowUI.jsx (Highest Priority)
**Why first:** Missing props break workflow generation callbacks
**Changes:**
1. Add props: apiKey, onGenerationStart, onGenerationEnd, onGenerationComplete, onGenerationError
2. Forward all props to WorkflowBuilder

**Acceptance criteria:**
- Component accepts all upstream props without breaking existing callers
- Props are forwarded to WorkflowBuilder
- Build succeeds

---

### Phase 2: ImageStudio.jsx
**Changes:**
1. Add AdvancedField component
2. Add buildAdvChips helper
3. Add getQualitiesForModel helper
4. Add DropdownItem component
5. Add useTemplateData integration
6. Add TemplateBanner integration

**Acceptance criteria:**
- New components exist and render
- Advanced controls panel uses new components
- TemplateBanner appears when template is applied
- Build succeeds

---

### Phase 3: VideoStudio.jsx
**Changes:**
1. Add useTemplateData integration
2. Add TemplateBanner integration

**Acceptance criteria:**
- TemplateBanner appears when template is applied
- useTemplateData hook works
- Build succeeds

---

### Phase 4: AgentStudio.jsx
**Changes:**
1. Add handleImgError function
2. Add PublishStep integration
3. Add AssistStep integration
4. Add useTemplateData integration
5. Add TemplateBanner integration
6. Add readStoryboardHandoff / clearStoryboardHandoff
7. Add getPendingRecipe / clearPendingRecipe
8. Add fillTemplate
9. Add i18n: resolveCopy, en, zh

**Acceptance criteria:**
- All integrations present
- imgError fallback works with handler
- i18n resolves correctly
- Build succeeds

---

### Phase 5: AiInfluencerStudio.jsx
**Changes:**
1. Add toast/Toaster
2. Add i18n: resolveCopy, en, zh

**Acceptance criteria:**
- Toasts appear for events
- i18n resolves correctly
- Build succeeds

---

### Phase 6: CinemaStudio.jsx
**Changes:**
1. Add TemplateBanner
2. Add scopedPersistKey, migrateLegacyPersistKey
3. Add i18n: resolveCopy, en, zh

**Acceptance criteria:**
- TemplateBanner appears
- Scoped persistence works
- i18n resolves correctly
- Build succeeds

---

### Phase 7: ClippingStudio.jsx
**Changes:**
1. Add toast/Toaster
2. Add i18n: resolveCopy, en, zh

**Acceptance criteria:**
- Toasts appear for events
- i18n resolves correctly
- Build succeeds

---

### Phase 8: RecastStudio.jsx
**Changes:**
1. Add toast/Toaster
2. Add i18n: resolveCopy, en, zh

**Acceptance criteria:**
- Toasts appear for events
- i18n resolves correctly
- Build succeeds

---

### Phase 9: VibeMotionStudio.jsx
**Changes:**
1. Add toast/Toaster
2. Add i18n: resolveCopy, en, zh

**Acceptance criteria:**
- Toasts appear for events
- i18n resolves correctly
- Build succeeds

---

### Phase 10: MarketingStudio.jsx
**Changes:**
1. Add i18n: resolveCopy, en, zh

**Acceptance criteria:**
- i18n resolves correctly
- Build succeeds

---

## Verification Plan
After each phase:
1. Run `npm run build`
2. Verify no existing features removed: `git diff upstream/main -- <file>`
3. Verify new features present: grep for added markers
4. No console errors in dev mode

## Total Missing Features Count
- WorkflowUI.jsx: 5 props
- ImageStudio.jsx: 6 features
- VideoStudio.jsx: 2 features
- AgentStudio.jsx: 9 features
- AiInfluencerStudio.jsx: 2 features
- CinemaStudio.jsx: 3 features
- ClippingStudio.jsx: 2 features
- MarketingStudio.jsx: 1 feature
- RecastStudio.jsx: 2 features
- VibeMotionStudio.jsx: 2 features

**Total: 34 missing features across 9 studios + 1 shared component**
