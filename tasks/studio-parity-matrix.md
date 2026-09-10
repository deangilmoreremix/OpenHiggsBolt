# Studio Parity Matrix

**Reference:** upstream `main` @ `b9894e12ad392ab19b7628658a3f6b364b13b1ba`
**Target:** OpenHiggsBolt `main` @ `38deb1a2be0b1dcd79ab6615867a0c816847c223`
**Date:** 2026-09-10

## Summary

| Metric | Value |
|--------|-------|
| Studios in scope | 14 |
| Complete for upstream parity | 14 |
| Actual incomplete studios | 0 |
| Not-applicable requests | 11 |
| Blocked features | 0 |

## Parity Matrix

| # | Studio | Status | Notes |
|---|--------|--------|-------|
| 1 | ImageStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | Remaining items are not in upstream ImageStudio |
| 2 | VideoStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 3 | AudioStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 4 | LipSyncStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 5 | AgentStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | Remaining items are not in upstream AgentStudio |
| 6 | AiInfluencerStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 7 | CinemaStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 8 | ClippingStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 9 | DesignAgentStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 10 | LayersStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 11 | MarketingStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 12 | RecastStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 13 | VibeMotionStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |
| 14 | WorkflowStudio.jsx | ✅ COMPLETE FOR UPSTREAM PARITY | — |

## Shared Components (Non-Studio)

| Component | Status | Notes |
|-----------|--------|-------|
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

## Not Applicable / Not Upstream Parity Requirements

These items were identified in the original 32-feature audit but are not required for upstream parity because they do not exist in the upstream reference implementations. They are not blockers for deployment.

| Studio | Feature | Evidence |
|--------|---------|----------|
| ImageStudio.jsx | AdvancedField | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/ImageStudio.jsx | grep -n "AdvancedField"` returns no matches |
| ImageStudio.jsx | buildAdvChips | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/ImageStudio.jsx | grep -n "buildAdvChips"` returns no matches |
| ImageStudio.jsx | getQualitiesForModel | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/ImageStudio.jsx | grep -n "getQualitiesForModel"` returns no matches |
| ImageStudio.jsx | DropdownItem | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/ImageStudio.jsx | grep -n "DropdownItem"` returns no matches |
| AgentStudio.jsx | PublishStep | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/AgentStudio.jsx | grep -n "PublishStep"` returns no matches |
| AgentStudio.jsx | AssistStep | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/AgentStudio.jsx | grep -n "AssistStep"` returns no matches |
| AgentStudio.jsx | useTemplateData | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/AgentStudio.jsx | grep -n "useTemplateData"` returns no matches |
| AgentStudio.jsx | TemplateBanner | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/AgentStudio.jsx | grep -n "TemplateBanner"` returns no matches |
| AgentStudio.jsx | readStoryboardHandoff | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/AgentStudio.jsx | grep -n "readStoryboardHandoff"` returns no matches |
| AgentStudio.jsx | getPendingRecipe | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/AgentStudio.jsx | grep -n "getPendingRecipe"` returns no matches |
| AgentStudio.jsx | fillTemplate | Not present in upstream `main`: `git show upstream/main:packages/studio/src/components/AgentStudio.jsx | grep -n "fillTemplate"` returns no matches |

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
