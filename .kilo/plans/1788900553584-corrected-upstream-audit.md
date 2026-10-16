# Corrected Upstream Audit & Sync Plan

## Upstream State
- Repo: `https://github.com/Anil-matcha/Open-Generative-AI`
- Upstream has a single commit: `ce624ff9` — *"remove hardcoded credit-cost badges from LayersStudio"*
- This means upstream’s entire codebase is essentially one initial bulk add, with one tiny follow-up change in `LayersStudio.jsx`.

## Actual Differences

### Current repo has, upstream does NOT
These are **local additions** in this fork. They are not missing upstream features; they are extra features this repo added on top of upstream.

| File | Notes |
|------|-------|
| `packages/studio/src/components/CostEstimator.jsx` | Embedded in Audio Studio |
| `packages/studio/src/components/PromptLibrary.jsx` | Embedded in SkillsBrowser |
| `packages/studio/src/components/SkillsBrowser.jsx` | Embedded in multiple studios |
| `packages/studio/src/components/TemplateBanner.jsx` | Local component |
| `packages/studio/src/components/UniversalMediaUploader.jsx` | Local component |
| `packages/studio/src/components/VideoStudio.test.jsx` | Local test |
| `packages/studio/src/components/VideoStudioParity.jsx` | This repo’s Video Studio implementation |
| `packages/studio/src/hooks/useTemplateData.js` | Local hook |
| `packages/studio/src/lib/characterStore.js` | Local lib |
| `packages/studio/src/lib/costEstimate.js` | Local lib |
| `packages/studio/src/lib/promptRecipes.js` | Local lib |
| `packages/studio/src/lib/skillStore.js` | Local lib |
| `packages/studio/src/skills/registry.json` | Local asset |
| `packages/studio/src/storyboardHandoff.js` | Local utility |
| `packages/studio/src/thumbnail-map.js` | Local asset |
| `packages/studio/src/thumbnail-map.json` | Local asset |
| `packages/studio/src/utils/downloadImage.js` | Local utility |
| `packages/studio/src/utils/formatError.js` | Local utility |
| `packages/studio/src/utils/generationLifecycle.js` | Local utility |
| `packages/studio/src/videoAdvancedControls.js` | Local module |
| `packages/studio/src/videoAdvancedControls.test.js` | Local test |
| `packages/studio/src/videoMediaInputs.js` | Local module |
| `packages/studio/src/videoToolCapabilities.js` | Local module |

### Upstream has, current repo does NOT
These are the **actual missing upstream items**.

| File | Notes |
|------|-------|
| `packages/studio/src/components/AppsStudio.jsx` | Explore Apps page |
| `packages/studio/src/components/McpCliStudio.jsx` | MCP/CLI studio |
| `packages/studio/src/messages/en/appsStudio.json` | English copy for AppsStudio |
| `packages/studio/src/messages/en/mcpCliStudio.json` | English copy for McpCliStudio |
| `packages/studio/src/messages/zh/*.json` (14 files) | Chinese localization bundles |
| `packages/studio/src/muapi.advanced.test.js` | Advanced muapi tests |
| `packages/studio/src/videoWorkflows.js` | Video workflow definitions |
| `packages/studio/src/videoWorkflows.test.js` | Video workflow tests |

### Routes
- Current repo has `app/studio/apps/page.js` and `app/studio/mcp-cli/page.js`
- Upstream does **not** have these routes
- Upstream uses the generic `app/studio/[[...slug]]/page.js` for all studios

## Newest Upstream Change
- **Commit:** `ce624ff9`
- **File:** `packages/studio/src/components/LayersStudio.jsx`
- **Change:** Removed hardcoded per-model credit-cost badges because they were static estimates, not actual generation costs

## Decisions Needed

1. **AppsStudio** — User previously asked to remove it. Should we keep it removed, or add it back?
2. **McpCliStudio** — User said “no mcp things.” Should we exclude it permanently?
3. **Chinese localization (`messages/zh/*`)** — User said not needed. Should we exclude it permanently?
4. **Local additions (CostEstimator, PromptLibrary, SkillsBrowser, VideoStudioParity, etc.)** — These are NOT in upstream. Should we keep them, remove them to match upstream, or treat them as intentional local features?
5. **videoWorkflows.js + test** — These are in upstream but missing here. Should we add them?
6. **muapi.advanced.test.js** — In upstream but missing here. Should we add it?
7. **LayersStudio credit-cost badges** — Upstream removed them. Should we apply the same removal here to stay aligned?

## Recommended Defaults
- Keep AppsStudio removed
- Keep McpCliStudio excluded
- Keep Chinese localization excluded
- Keep local additions unless user explicitly asks to remove them
- Add `videoWorkflows.js` + `videoWorkflows.test.js` from upstream
- Add `muapi.advanced.test.js` from upstream
- Apply the LayersStudio credit-cost badge removal from upstream
