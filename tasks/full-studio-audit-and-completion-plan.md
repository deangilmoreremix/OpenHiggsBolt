# Full Studio Audit and Completion Plan

## Objective
For every studio that exists in both `upstream/main` and the current repo, verify the current state against upstream, identify missing additive features, and produce an ordered execution plan with exact file paths and acceptance criteria.

## Scope
- **In scope:** All 14 common studios in `packages/studio/src/components/`
- **Out of scope:** AppsStudio, McpCliStudio, MotionControlStudio, `src/apps/*`, `app/brand-studio`, `app/photo-studio`

## Additive-Only Rule
- ✅ Add new functions, props, UI, handlers, integrations
- ❌ Never remove existing functionality
- ❌ Never replace a current studio with an upstream rewrite

## Studio Inventory

| # | Studio | Status |
|---|--------|--------|
| 1 | PromptComposer.jsx | COMPLETE — exact upstream match |
| 2 | ImageStudio.jsx | PARTIALLY COMPLETE — has drag-drop, PromptPopover, i18n; still missing upstream additions |
| 3 | VideoStudio.jsx | PARTIALLY COMPLETE — has ReferenceUpload/Preview/Label, PromptComposer, Toaster; still missing upstream additions |
| 4 | AudioStudio.jsx | COMPLETE — drag-drop + i18n |
| 5 | LipSyncStudio.jsx | COMPLETE — drag-drop + PromptComposer + Dropdown |
| 6 | DrawModal.jsx | COMPLETE — drag-drop + model names |
| 7 | AgentStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 8 | AiInfluencerStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 9 | CinemaStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 10 | ClippingStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 11 | DesignAgentStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 12 | LayersStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 13 | MarketingStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 14 | RecastStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 15 | VibeMotionStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 16 | WorkflowStudio.jsx | PARTIALLY COMPLETE — has upstream additions; needs verification |
| 17 | WorkflowUI.jsx | NEEDS FIX — current props diverged from upstream |

## Remaining Work by Studio

### 1. WorkflowUI.jsx
**File:** `packages/studio/src/components/WorkflowUI.jsx`

**Problem:** Current signature only accepts `workflowId, initialNodeSchemas, initialWorkflowData`. Upstream also accepts `apiKey, onGenerationStart, onGenerationEnd, onGenerationComplete, onGenerationError` and forwards them to `WorkflowBuilder`.

**Required change:** Restore the full props interface and pass them through to `WorkflowBuilder`. This is additive because it only adds optional props and forwards them.

**Acceptance criteria:**
- Component accepts `apiKey`, `onGenerationStart`, `onGenerationEnd`, `onGenerationComplete`, `onGenerationError` without breaking existing callers
- These props are forwarded to `<WorkflowBuilder>`
- Build succeeds

---

### 2. ImageStudio.jsx
**File:** `packages/studio/src/components/ImageStudio.jsx`

**Current state:** UploadButton has drag-drop, history, i18n. ModelDropdown has categories, search, provider sidebar. Main component has `locale` and `copy`.

**Missing upstream additions:**
- `AdvancedField` component for advanced controls
- `buildAdvChips` helper for summary chips
- `getQualitiesForModel` helper
- `DropdownItem` component
- Additional provider logo cases (`runway`, `hunyuan`, `pixverse`, `lightricks`, `muapi`)
- `useTemplateData` integration
- Storyboard handoff (`readStoryboardHandoff`, `clearStoryboardHandoff`)
- Skills recipe integration (`getPendingRecipe`, `clearPendingRecipe`, `fillTemplate`)
- Social publish (`PublishStep`) and AI assistant (`AssistStep`)
- Template banner
- Character sheet (`setCharacterSheet`)
- Additional model imports (`i2iModels`)

**Required change:** Add the missing components/integrations alongside existing ones. Do not remove MobileGenerationActions, PromptComposer wrappers, or existing imports.

**Acceptance criteria:**
- New helper components exist and are used
- New integrations are present
- Existing MobileGenerationActions still render
- Build succeeds

---

### 3. VideoStudio.jsx
**File:** `packages/studio/src/components/VideoStudio.jsx`

**Current state:** ReferenceUploadButton/Preview/Label present. PromptComposer wrapper present. Toaster present. i18n with zh present.

**Missing upstream additions:**
- `AdvancedField` component
- `buildAdvChips` helper
- `getQualitiesForModel` helper
- `DropdownItem` component
- Additional provider logo cases
- `useTemplateData` integration
- Storyboard handoff
- Skills recipe integration
- Template banner
- Character sheet
- Additional model imports (`i2vModels`, `v2vModels`)
- `videoAdvancedControls.js` integration

**Required change:** Add missing components/integrations alongside existing ones. Do not remove MobileGenerationActions, PromptDurationIcon/PromptQualityIcon, or existing imports.

**Acceptance criteria:**
- Advanced controls panel includes new fields
- New integrations present
- Existing advanced controls still render
- Build succeeds

---

### 4. AgentStudio.jsx
**File:** `packages/studio/src/components/AgentStudio.jsx`

**Current state:** Has `toProxiedIcon` and `imgError` fallback.

**Missing upstream additions:**
- Verify `PublishStep`, `AssistStep` are present (appears they may be missing)
- Verify `useTemplateData`, `TemplateBanner` are present
- Verify storyboard handoff is present

**Required change:** Add any missing integrations additively.

**Acceptance criteria:**
- All upstream integrations present
- Existing `toProxiedIcon` and `imgError` preserved
- Build succeeds

---

### 5. AiInfluencerStudio.jsx
**File:** `packages/studio/src/components/AiInfluencerStudio.jsx`

**Current state:** Has PublishStep, AssistStep, skills, useTemplateData, TemplateBanner, storyboard handoff, abortRef, applyRecipe.

**Missing upstream additions:**
- None identified

**Required change:** None. Verify build passes.

**Acceptance criteria:**
- Build succeeds
- No regressions

---

### 6. CinemaStudio.jsx
**File:** `packages/studio/src/components/CinemaStudio.jsx`

**Current state:** Has PublishStep, AssistStep, skills, useTemplateData, TemplateBanner, storyboard handoff, improved Dropdown, isSnapEnabled, getSelectedDescription.

**Missing upstream additions:**
- None identified

**Required change:** None. Verify build passes.

**Acceptance criteria:**
- Build succeeds
- No regressions

---

### 7. ClippingStudio.jsx
**File:** `packages/studio/src/components/ClippingStudio.jsx`

**Current state:** Has PublishStep, skills, useTemplateData, TemplateBanner, storyboard handoff, ClockIcon, CheckIcon, ChevronDownIcon.

**Missing upstream additions:**
- None identified

**Required change:** None. Verify build passes.

**Acceptance criteria:**
- Build succeeds
- No regressions

---

### 8. DesignAgentStudio.jsx
**File:** `packages/studio/src/components/DesignAgentStudio.jsx`

**Current state:** Has ErrorBoundary, CreativeCanvasErrorBoundary, sessionStorage/localStorage handling.

**Missing upstream additions:**
- None identified

**Required change:** None. Verify build passes.

**Acceptance criteria:**
- Build succeeds
- No regressions

---

### 9. LayersStudio.jsx
**File:** `packages/studio/src/components/LayersStudio.jsx`

**Current state:** Has credit cost badges, i18n with zh fallback.

**Missing upstream additions:**
- None identified

**Required change:** None. Verify build passes.

**Acceptance criteria:**
- Build succeeds
- No regressions

---

### 10. MarketingStudio.jsx
**File:** `packages/studio/src/components/MarketingStudio.jsx`

**Current state:** Has PublishStep, skills, useTemplateData, TemplateBanner, storyboard handoff, UploadSlot.

**Missing upstream additions:**
- None identified

**Required change:** None. Verify build passes.

**Acceptance criteria:**
- Build succeeds
- No regressions

---

### 11. RecastStudio.jsx
**File:** `packages/studio/src/components/RecastStudio.jsx`

**Current state:** Has PublishStep, skills, useTemplateData, TemplateBanner, storyboard handoff.

**Missing upstream additions:**
- None identified

**Required change:** None. Verify build passes.

**Acceptance criteria:**
- Build succeeds
- No regressions

---

### 12. VibeMotionStudio.jsx
**File:** `packages/studio/src/components/VibeMotionStudio.jsx`

**Current state:** Has PublishStep, skills, useTemplateData, TemplateBanner, storyboard handoff.

**Missing upstream additions:**
- None identified

**Required change:** None. Verify build passes.

**Acceptance criteria:**
- Build succeeds
- No regressions

---

### 13. WorkflowStudio.jsx
**File:** `packages/studio/src/components/WorkflowStudio.jsx`

**Current state:** Has imgError fallback, buildWorkflowApiSnippets import.

**Missing upstream additions:**
- None identified

**Required change:** None. Verify build passes.

**Acceptance criteria:**
- Build succeeds
- No regressions

---

## Execution Order

1. **WorkflowUI.jsx** — restore props and forward them to WorkflowBuilder
2. **ImageStudio.jsx** — add AdvancedField, buildAdvChips, getQualitiesForModel, DropdownItem, provider logos, useTemplateData, storyboard handoff, skills, PublishStep/AssistStep, TemplateBanner, setCharacterSheet, i2iModels
3. **VideoStudio.jsx** — add AdvancedField, buildAdvChips, getQualitiesForModel, DropdownItem, provider logos, useTemplateData, storyboard handoff, skills, PublishStep/AssistStep, TemplateBanner, setCharacterSheet, i2vModels/v2vModels, videoAdvancedControls
4. **AgentStudio.jsx** — verify and add any missing integrations
5. **All other studios** — verify build passes, no further changes needed

## Verification
- Run `npm run build` after each studio change
- Run `git diff upstream/main -- <file>` to confirm only additive changes
- No existing features removed
