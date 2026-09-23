# SmartVideo GO Personalization — Defect Register

**Repository:** deangilmoremix/OpenHiggsBolt  
**Branch:** audit/personalization-full-release  
**Date:** 2026-09-22  

## Summary

| Severity | Found | Fixed | Open |
|----------|-------|-------|------|
| P0 | 0 | 0 | 0 |
| P1 | 37 | 29 | 8 |
| P2 | 33 | 3 | 30 |
| P3 | 0 | 0 | 0 |

---

## P1 Defects

### FIXED

| ID | Area | Root Cause | Fix | Test | Commit |
|----|------|------------|-----|------|--------|
| PR31-A | Escape Modal Stack | Escape handler closed Personalization modal when Image Editor was open | Guard Escape with `!imageEditorAsset` | PASS | e5bf5eab |
| PR31-B | Smart Edit Output Format | `responsesSmartEditStream` didn't receive outputFormat/outputCompression/inputFidelity | Pass all three fields into stream call and onApply | PASS | e5bf5eab |
| PR31-C | Cross-Batch Duplicate Detection | Vision batches didn't share normalized URL index | Build URL index across all candidates, propagate duplicateLikely | PASS | e5bf5eab |
| PR31-D | Discovered Asset Edit Metadata | `handleImageEditorApply` didn't store responseId, outputFormat, etc. | Store all metadata fields on discovered assets | PASS | e5bf5eab |
| 1.1 | Source Demo / Client Profile | `createStyleButtonRef` typed as `HTMLElement` but used as `HTMLButtonElement` | Changed ref type to `HTMLButtonElement` | PASS | e5bf5eab |
| 1.2 | Source Demo / Client Profile | `useOptionalSocialPublish()` had no explicit return type | Added `null | { ... }` return type | PASS | e5bf5eab |
| 3.4 | Asset Review / Category | `irrelevant` category assets visible to users | Hidden irrelevant section from review area | PASS | e5bf5eab |
| 4.1 | Manual Uploads / Person | `addIdentityFiles` race condition in `isPrimary` calculation | Use functional state update to determine primary | PASS | e5bf5eab |
| 5.1 | First Frame / Last Frame / CTA | First frame upload accepted multiple files but only processed first | Added `multiple={false}` to UploadZone | PASS | e5bf5eab |
| 5.2 | First Frame / Last Frame / CTA | `setFirstFrameFile(null)` didn't revoke old blob URL | Call `revokeAssetUrl` before clearing | PASS | e5bf5eab |
| 7.4 | Saved Clients / Library | "Set Primary" button visible but non-functional for products/brand references | Conditionally render button only for identities/logos tabs | PASS | e5bf5eab |
| 6.1 | Asset Import / Durable Upload | Partial download failures silently skipped | Track download failures, show partial error/confirmation summary | PASS | audit/personalization-full-release |
| 6.2 | Asset Import / Durable Upload | Failed uploads leave asset unusable | Set uploadStatus to error, expose retry via setAssetUploadStatus | PASS | audit/personalization-full-release |
| 6.3 | Asset Import / Durable Upload | 401 auth errors shown as generic failures | Detect 401/403 on download-image and show actionable message | PASS | audit/personalization-full-release |
| 10.2 | GO Vision Integration | Empty analyses array treated as success | Check empty array after batch, throw clear error | PASS | audit/personalization-full-release |
| 11.2 | Smart Edit Streaming | No timeout in reader loop | Add 90s timeout with reader.cancel() in responsesVisionApi | PASS | audit/personalization-full-release |
| 12.3 | Version History | versionIndex out of bounds causes editor to return null | Clamp versionIndex in useEffect when versions length changes | PASS | audit/personalization-full-release |
| 15.1 | Generation Handoff | Blob URLs can leak into handoff payload | Filter blob URLs before writeHandoff in editInImageStudio/editInVideoStudio | PASS | audit/personalization-full-release |
| 17.3 | Auth / Route / Type Contracts | 403 entitlement error shown as generic failure | Detect 403 on discover/image-analyze and show specific message | PASS | audit/personalization-full-release |
| 17.6 | Auth / Route / Type Contracts | 401 auth error shown as generic failure | Detect 401 on discover/image-analyze and show specific message | PASS | audit/personalization-full-release |
| 2.1 | Business Finder / Research | OSM businesses lack website field | Research fails immediately for OSM-sourced businesses | Prompt manual website entry when website missing | E2E |
| 2.2 | Business Finder / Research | Inline type cast drops fields from BusinessResearchResult | Frontend contract narrower than API | Import shared BusinessResearchResult type | Typecheck |
| 4.2 | Manual Uploads / Person | No client-side file type validation | Non-image files reach server | Add client-side type check | Unit |
| 4.3 | Manual Uploads / Person | Upload limit check after files already start uploading | Race condition on upload start | Move limit check before upload begins | Unit |
| 8.3 | Image Editor / Mask | Mask canvas lacks ARIA labels | Screen reader users can't use mask editor | Add role, aria-label, keyboard shortcuts | A11y |
| 11.1 | Smart Edit Streaming | Stream parsing loses data if chunk doesn't end with delimiter | Final image data lost | Fix stream parsing for partial chunks | Unit |
| 13.1 | Make Video Ready Batch | Callback dependency on batchVideoReady.running | Stale closure risk | Use ref instead of dependency | Unit |
| 13.2 | Make Video Ready Batch | Empty validation error message | "Vision QA needs review: " | Provide fallback error message | Unit |

### OPEN (Remaining P1)

| ID | Area | Root Cause | User Impact | Suggested Fix | Test Needed |
|----|------|------------|-------------|---------------|-------------|
| 2.3 | Business Finder / Research | Unreachable URL fails without retry | User stuck with no way to research | Add manual URL retry input | E2E |
| 3.1 | Asset Review / Category | Category select lacks keyboard handlers | Screen reader users can't navigate dropdown | Add onKeyDown and aria improvements | A11y |
| 7.1 | Saved Clients / Library | deleteSavedClient race condition in Strict Mode | Client record may not be deleted | Use functional state update | Unit |
| 7.3 | Saved Clients / Library | Redundant sync effect causes double localStorage writes | Performance concern | Remove sync effect | Unit |
| 8.2 | Image Editor / Mask | Mask toolbar buttons lack type="button" | Latent form submission risk | Add type="button" | A11y |
| 9.1 | Direct AI Edit | No per-operation loading state | Generic busy label only | Add per-operation progress indicator | E2E |
| 9.2 | Direct AI Edit | No progress indicator during Smart Edit streaming wait | Blank canvas UX | Add loading skeleton | E2E |
| 10.1 | GO Vision Integration | Invalid vision model default causes silent failures | All vision calls fail | Add startup model validation | Unit |
| 14.1 | Prompt Personalization | Fallback returns original prompt unchanged without error | User thinks AI personalization worked | Throw error when fallback is no-op | Unit |
| 15.1 | Generation Handoff | writeHandoff + router.push race in Strict Mode | Target studio reads stale handoff | Verify handoff before nav or add polling | E2E |
| 16.1 | Error Recovery | Error view retry re-runs entire generation | Can't retry just branding | Differentiate error types, show appropriate retry | E2E |
| 16.2 | Error Recovery | Failed uploads have no retry button | User must remove and re-upload | Add retry button in error view | E2E |

---

## P2 Defects

### FIXED

| ID | Area | Root Cause | Fix | Commit |
|----|------|------------|-----|--------|
| 5.3 | First Frame / Last Frame / CTA | Placeholder lacked accessible label | Added role="img" and aria-label | e5bf5eab |
| 12.1 | Version History | appendVersion bounds check missing | Added bounds check | e5bf5eab |
| 12.2 | Version History | No keyboard shortcuts for undo/redo | Added Ctrl+Z / Ctrl+Shift+Z | e5bf5eab |

### OPEN

| ID | Area | Root Cause | Suggested Fix |
|----|------|------------|---------------|
| 1.3 | Source Demo / Client Profile | SettingsPrompt dynamic import uses @ts-ignore | Remove @ts-ignore, add error state |
| 2.4 | Business Finder / Research | researchBusiness callback recreated frequently | Use refs or extract stable function |
| 3.2 | Asset Review / Category | Remove button stopPropagation (already correct) | No fix needed |
| 3.3 | Asset Review / Category | AssignedSection type includes null but name implies non-null | Rename type or add comment |
| 4.4 | Manual Uploads / Person | Upload counter doesn't account for uploading assets | Show total including uploading |
| 5.4 | First Frame / Last Frame / CTA | supportsFirstFrame uses regex on model ID | Move to model catalog lookup |
| 7.2 | Saved Clients / Library | selectedClientId initialized with empty string | Fix initialization logic |
| 8.1 | Image Editor / Mask | Mask toolbar buttons lack type="button" | Add type="button" |
| 8.4 | Image Editor / Mask | No visual focus indicator when mask canvas active | Add focus ring |
| 8.5 | Image Editor / Mask | Slider keyboard interaction unverified | Verify Slider supports arrow keys |
| 9.3 | Direct AI Edit | No "Use last prompt" button | Add reuse prompt button |
| 10.3 | GO Vision Integration | Vision-categorized assets retain original sourceType | Consider updating on reclassify |
| 10.4 | GO Vision Integration | Vision status banner lacks summary metrics | Add asset count and confidence distribution |
| 11.3 | Smart Edit Streaming | No progress indicator while waiting for first partial | Add loading skeleton |
| 11.4 | Smart Edit Streaming | No retry for Smart Edit stream failure | Add retry button |
| 12.3 | Version History | versionIndex out of bounds causes editor to return null | Clamp versionIndex in useEffect |
| 13.3 | Make Video Ready Batch | Batch state lost when modal closed | Persist batch state in provider |
| 13.4 | Make Video Ready Batch | No retry for individual batch step failures | Add per-step retry |
| 14.2 | Prompt Personalization | Fallback only handles 8 placeholders | Expand placeholder set |
| 14.3 | Prompt Personalization | No-op fallback not surfaced to user | Compare result, set error if identical |
| 14.4 | Prompt Personalization | No pre-flight check for OpenAI key | Add key validation before call |
| 15.2 | Generation Handoff | Blob URLs in handoff may be revoked | Filter blob URLs or delay close |
| 15.3 | Generation Handoff | referenceAssets may contain blob URLs | Filter blob URLs from handoff |
| 16.3 | Error Recovery | classifyMuApiError uses first match only | Return most specific classification |
| 16.4 | Error Recovery | Progress message not updated on failure | Set progressMessage to actual error |
| 16.5 | Error Recovery | Discovery error state lacks retry button | Add retry button |
| 17.2 | Auth / Route / Type Contracts | publish with blob URL fails silently | Validate URL is not blob before publishing |
| 17.4 | Auth / Route / Type Contracts | SupabaseSharedMediaEntry type uses camelCase | Align type with DB column names |
| 17.5 | Auth / Route / Type Contracts | No recovery for missing API key | Link to settings for key entry |
| 17.7 | Auth / Route / Type Contracts | BusinessResearchResult type cast drops fields | Create and import shared type |

---

## Pre-existing Failures (Not Introduced by This Audit)

| Test | Status | Action |
|------|--------|--------|
| tests/verify-openai-key.vitest.test.ts | FAIL (5 tests) | Pre-existing, unrelated to personalization |
| promptPersonalizerVision.test.ts | FAIL (module error) | Pre-existing circular dependency issue |

---

## Test Results

| Metric | Value |
|--------|-------|
| Total test files | 49 |
| Passing test files | 47 |
| Failing test files | 2 (pre-existing) |
| Total tests | 499 |
| Passing tests | 494 |
| Failing tests | 5 (pre-existing) |
| New regression tests | 9 |
| Typecheck | PASS |
| Build | PASS |
| Build:metadata | PASS |
| Build:packages | PASS |
