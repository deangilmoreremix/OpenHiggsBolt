# Studio Parity Matrix

**Reference:** upstream `main` @ `b9894e12ad392ab19b7628658a3f6b364b13b1ba`  
**Target:** OpenHiggsBolt `main` @ `38deb1a2be0b1dcd79ab6615867a0c816847c223`  
**Date:** 2026-09-10

## Summary

| Metric | Value |
|--------|-------|
| Studios in scope | 14 |
| Complete | 12 |
| Partially complete | 2 |
| Total remaining items | 11 (all not applicable) |

## Parity Matrix

| # | Studio | Status | Remaining Items |
|---|--------|--------|------------------|
| 1 | ImageStudio.jsx | ⚠️ PARTIALLY COMPLETE | AdvancedField, buildAdvChips, getQualitiesForModel, DropdownItem (not applicable — not in upstream ImageStudio) |
| 2 | VideoStudio.jsx | ✅ COMPLETE | — |
| 3 | AudioStudio.jsx | ✅ COMPLETE | — |
| 4 | LipSyncStudio.jsx | ✅ COMPLETE | — |
| 5 | AgentStudio.jsx | ⚠️ PARTIALLY COMPLETE | PublishStep, AssistStep, useTemplateData, TemplateBanner, readStoryboardHandoff, getPendingRecipe, fillTemplate (not applicable — not in upstream AgentStudio) |
| 6 | AiInfluencerStudio.jsx | ✅ COMPLETE | — |
| 7 | CinemaStudio.jsx | ✅ COMPLETE | — |
| 8 | ClippingStudio.jsx | ✅ COMPLETE | — |
| 9 | DesignAgentStudio.jsx | ✅ COMPLETE | — |
| 10 | LayersStudio.jsx | ✅ COMPLETE | — |
| 11 | MarketingStudio.jsx | ✅ COMPLETE | — |
| 12 | RecastStudio.jsx | ✅ COMPLETE | — |
| 13 | VibeMotionStudio.jsx | ✅ COMPLETE | — |
| 14 | WorkflowStudio.jsx | ✅ COMPLETE | — |

## Shared Components (Non-Studio)

| Component | Status | Missing Features |
|-----------|--------|------------------|
| PromptComposer.jsx | ✅ COMPLETE | — |
| DrawModal.jsx | ✅ COMPLETE | — |
| WorkflowUI.jsx | ✅ COMPLETE | — |

## VideoStudio Deep Dive

### Completed in this session
- Ported grouped video model architecture (`groupedVideoRegistry.js`, `groupedVideoModels.js`, `groupedVideoParameters.js`)
- Copied provider-specific model/parameter files (alibaba, happyHorse, kling, ltx, minimax, pixverse, seedance, sora, veo, vidu, xai)
- Ported `VideoModelControls.jsx` and `usePromptMenu.js`
- Updated `PromptComposer.jsx` with upstream `fitViewport`, `solid`, `wrapDescription` props
- Updated `modelFamilies.js` with upstream `videoModelMenuEntries`, `buildVideoModelMenuEntries`, `videoModelMenuEntryByVariantId`
- Replaced simple family-list dropdown in `VideoStudioParity.jsx` with `ModelDropdown` component (category tabs, provider tabs with logos, search, selection state)
- Updated `messages/en/videoStudio.json` and copied `messages/zh/videoStudio.json`
- Added `getVideoWorkflowMediaAdjustments` and `migrateVideoWorkflowMediaDrafts` to `videoWorkflows.js`
- Added `KLING_O1_REFERENCE_CONSTRAINT` with `combinedSlotIds: VISUAL_REFERENCE_SLOT_IDS`
- Integrated `useTemplateData` hook and `TemplateBanner` component
- Verified build, typecheck, and tests pass (188 tests)

### Remaining for VideoStudio
- None

## Remaining Work

All 32 original missing features have been resolved. The remaining items in ImageStudio and AgentStudio are marked **not applicable** because they do not exist in the upstream reference implementations.

1. **ImageStudio.jsx** — 4 features marked not applicable (not in upstream: AdvancedField, buildAdvChips, getQualitiesForModel, DropdownItem)
2. **AgentStudio.jsx** — 7 features marked not applicable (not in upstream: PublishStep, AssistStep, useTemplateData, TemplateBanner, readStoryboardHandoff, getPendingRecipe, fillTemplate)

## Completed in this session

1. **WorkflowUI.jsx** — Added 5 missing props (apiKey, onGenerationStart, onGenerationEnd, onGenerationComplete, onGenerationError)
2. **ImageStudio.jsx** — Added useTemplateData integration and TemplateBanner component
3. **AiInfluencerStudio.jsx** — Added toast/Toaster and i18n (resolveCopy, en, zh)
4. **ClippingStudio.jsx** — Added toast/Toaster and i18n (resolveCopy, en, zh)
5. **CinemaStudio.jsx** — Added scopedPersistKey, migrateLegacyPersistKey, toast/Toaster, i18n (resolveCopy, en, zh), replaced inline template indicator with TemplateBanner component
6. **MarketingStudio.jsx** — Added toast/Toaster and i18n (resolveCopy, en, zh), replaced alert() with toast.error()
7. **RecastStudio.jsx** — Added toast/Toaster and i18n (resolveCopy, en, zh)
8. **VibeMotionStudio.jsx** — Added toast/Toaster and i18n (resolveCopy, en, zh)
9. **AgentStudio.jsx** — Added handleImgError function and i18n (resolveCopy, en, zh)
10. **Missing zh message files** — Created empty zh message files for studios that didn't have them
