# Personalization AI Assist — Mismatch Classification Report

**Audit Date:** 2026-10-02  
**System:** Personalization AI Assist (SmartVideo GO Personalization)  
**Scope:** `src/shared/personalization/`, `supabase/functions/enhance-prompt/`, `app/api/personalization/`, `components/AiAssistantModal.tsx`  
**Classification Definitions:**
- **CORRECT** — Implementation matches the locked provider architecture.
- **LEGACY BUT OUTSIDE PERSONALIZATION** — Code exists but is not part of Personalization's responsibility; do not migrate.
- **INCORRECT PERSONALIZATION ROUTING** — Personalization code routes to the wrong provider or bypasses the domain abstraction.
- **MISSING** — Required capability or routing does not exist.

---

## Executive Summary

The Personalization AI Assist system contains **11 architectural mismatches** against the locked provider architecture. Of these:

| Classification | Count | Severity |
|---|---|---|
| INCORRECT PERSONALIZATION ROUTING | 6 | High — breaks provider abstraction, risks data leakage, and couples Personalization to MuAPI internals |
| MISSING | 5 | High — required capabilities (OpenAI v2.5 path, persistence, reasoning model config) are absent |
| LEGACY BUT OUTSIDE PERSONALIZATION | 1 | Medium — separate system must not be absorbed into Personalization |

**Primary Root Cause:** The generation and post-processing layers were partially migrated from MuAPI to OpenAI but still contain direct provider imports, hardcoded MuAPI model IDs, and raw `fetch` calls in route handlers. Persistence of generated assets and project state was never implemented.

**Recommended Remediation Order:**
1. Fix routing in `generationRouter.ts` and `postProcessor.ts` (highest blast radius).
2. Introduce domain-level asset upload and compositing tools.
3. Add OpenAI Image Editing v2.5 dispatch path.
4. Persist generated assets and project state to Supabase.
5. Make reasoning model configurable in `enhance-prompt`.
6. Replace raw `fetch` calls in route handlers with shared `openaiClient.ts`.

---

## File-by-File Violation List

### 1. INCORRECT PERSONALIZATION ROUTING — `generationRouter.ts`

| Attribute | Detail |
|---|---|
| **File** | `src/shared/personalization/generationRouter.ts` |
| **Lines** | 7–16 (imports), 208 (`generateI2I`), 228 (`generateImage`) |
| **Classification** | INCORRECT PERSONALIZATION ROUTING |

**Evidence:**

```typescript
// Lines 7-16: Direct MuAPI imports inside Personalization shared layer
import {
  generateImage,
  generateI2I,
  generateVideo,
  generateI2V,
  processRecast,
  processV2V,
  processLipSync,
  uploadFile,
} from '@/packages/studio/src/muapi'
```

```typescript
// Line 208: keep_design / replace_face / replace_person modes
const result = await generateI2I(apiKey, {
  model: imageModel,
  prompt,
  image_url: imageUrl,
  ...
})

// Line 228: recreate / complete modes
const result = await generateImage(apiKey, {
  model: imageModel,
  prompt,
  ...
})
```

**Impact Assessment:**
- All image personalization modes (`keep_design`, `replace_face`, `replace_person`, `recreate`, `complete`) route through MuAPI instead of the locked OpenAI Image Editing v2.5 direct API.
- Bypasses the domain abstraction; any MuAPI contract change breaks Personalization.
- Model catalog IDs are resolved against the MuAPI catalog, not OpenAI's.

**Recommended Fix:**
- Remove direct MuAPI imports from `generationRouter.ts`.
- Introduce domain-level image generation tools (e.g., `personalizeImageWithOpenAI`) that wrap `/v1/images/edits` and `/v1/responses`.
- Dispatch image personalization to the new domain tools; keep video personalization on MuAPI until video provider is locked.

---

### 2. INCORRECT PERSONALIZATION ROUTING — `postProcessor.ts`

| Attribute | Detail |
|---|---|
| **File** | `src/shared/personalization/postProcessor.ts` |
| **Lines** | 16 (imports), 190 (`generateI2I` for image watermark), 213 (`processV2V` for video watermark) |
| **Classification** | INCORRECT PERSONALIZATION ROUTING |

**Evidence:**

```typescript
// Line 16: Direct MuAPI import
import { generateI2I, uploadFile } from '@/packages/studio/src/muapi'
```

```typescript
// Line 190: Image watermark via MuAPI
const result = await generateI2I(apiKey, {
  model: 'add-image-watermark',
  prompt: '',
  image_url: imageUrl,
  watermark_image_url: watermarkUrl,
  ...
})

// Lines 212-213: Video watermark via MuAPI
const { processV2V } = await import('@/packages/studio/src/muapi')
const result = await processV2V(apiKey, {
  model: 'add-video-watermark',
  video_url: videoUrl,
  image_url: watermarkUrl,
})
```

**Impact Assessment:**
- Watermark overlay bypasses the domain abstraction, coupling deterministic compositing to MuAPI endpoint availability.
- `uploadFile` is used for end-card generation, again bypassing the domain asset-upload tool.
- Failure of MuAPI watermark endpoints breaks post-processing silently (fallback returns `null`).

**Recommended Fix:**
- Replace MuAPI watermark calls with domain-level compositing tools that use canvas-based overlay or a dedicated compositing service.
- Replace `uploadFile` with a domain-level asset-upload tool.

---

### 3. INCORRECT PERSONALIZATION ROUTING — `DemoPersonalizeProvider.tsx`

| Attribute | Detail |
|---|---|
| **File** | `src/shared/personalization/DemoPersonalizeProvider.tsx` |
| **Line** | 78 (`uploadFile` import) |
| **Classification** | INCORRECT PERSONALIZATION ROUTING |

**Evidence:**

```typescript
// Line 78: Direct provider import in Personalization state layer
import { uploadFile } from 'studio/src/muapi'
```

**Impact Assessment:**
- The provider context/state layer should not import from `studio/src/muapi` directly.
- Asset uploads are a cross-cutting concern and should go through a domain-level tool to maintain testability and provider independence.

**Recommended Fix:**
- Remove the direct `uploadFile` import.
- Consume a domain-level `uploadPersonalizationAsset` tool instead.

---

### 4. INCORRECT PERSONALIZATION ROUTING — `modelCapabilityResolver.ts`

| Attribute | Detail |
|---|---|
| **File** | `src/shared/personalization/modelCapabilityResolver.ts` |
| **Line** | 41 (`DEFAULT_I2I_MODEL = 'gpt-image-2-edit'`) |
| **Classification** | INCORRECT PERSONALIZATION ROUTING |

**Evidence:**

```typescript
// Line 41: Default I2I model is a MuAPI catalog model
export const DEFAULT_I2I_MODEL = 'gpt-image-2-edit'
```

**Impact Assessment:**
- The default image model resolves to a MuAPI catalog entry, not an OpenAI v2.5 model.
- When no explicit model is selected, Personalization silently falls back to the wrong provider's catalog.

**Recommended Fix:**
- Change `DEFAULT_I2I_MODEL` to `'gpt-image-2.5-flare'` or `'gpt-image-2.5-sunburst'`.
- Ensure `resolveModelCapabilities` can resolve OpenAI v2.5 model capabilities from the OpenAI catalog, not only the MuAPI catalog.

---

### 5. MISSING — OpenAI Image Editing v2.5 Path in `generationRouter.ts`

| Attribute | Detail |
|---|---|
| **File** | `src/shared/personalization/generationRouter.ts` |
| **Lines** | Entire file (no OpenAI branch) |
| **Classification** | MISSING |

**Evidence:**
- The file routes all image personalization to MuAPI (`generateI2I`, `generateImage`).
- There is no branch that dispatches image personalization to the OpenAI direct API (`/v1/images/edits` or `/v1/responses` with `image_generation` tool).

**Impact Assessment:**
- The locked architecture requires OpenAI Image Editing v2.5 as the primary image provider.
- Without this path, Personalization cannot fulfill the provider contract and will continue to depend on MuAPI for all image work.

**Recommended Fix:**
- Add a new `handleOpenAIImageGeneration` branch in `runGeneration` / `handleImageGeneration`.
- Wrap OpenAI `/v1/images/edits` and `/v1/responses` in domain-level tools.
- Dispatch image personalization to the OpenAI branch when the resolved model is an OpenAI v2.5 model.

---

### 6. MISSING — Prompt Personalizer with Reasoning Model

| Attribute | Detail |
|---|---|
| **File** | `supabase/functions/enhance-prompt/index.ts` |
| **Line** | 15 (`OPENAI_MODEL = "gpt-4o"`) |
| **Classification** | MISSING |

**Evidence:**

```typescript
// Line 15: Hardcoded model, no env var override
const OPENAI_MODEL = "gpt-4o";
```

**Impact Assessment:**
- The enhance-prompt function always uses `gpt-4o`, even when a reasoning-capable model like `gpt-6-astra` is desired.
- No environment variable or configuration path exists to switch models without code changes.

**Recommended Fix:**
- Replace the hardcoded value with an env var, e.g., `const OPENAI_MODEL = Deno.env.get("ENHANCE_PROMPT_MODEL") ?? "gpt-4o";`.
- Validate the configured model against an allow-list before use.

---

### 7. MISSING — Edited Images Not Persisted to Supabase Storage

| Attribute | Detail |
|---|---|
| **File** | `app/api/personalization/image-edit/route.ts`, `app/api/personalization/image-smart-edit/route.ts` |
| **Lines** | 184–191 (`image-edit`), 229–239 (`image-smart-edit`) |
| **Classification** | MISSING |

**Evidence:**
- Both route handlers return edited images as transient data URLs or inline JSON:
  - `image-edit/route.ts:184` — returns `{ ...data, smartvideo: {...} }` (no storage upload).
  - `image-smart-edit/route.ts:230` — returns `imageDataUrl: data:image/...;base64,...` (no storage upload).

**Impact Assessment:**
- Edited images are lost when the browser tab is closed or the user navigates away.
- No audit trail exists for generated personalization assets.
- Cross-device workflows are impossible because results are not centrally stored.

**Recommended Fix:**
- After successful generation, upload the edited image to the `brand-assets` Supabase Storage bucket.
- Persist the storage path and metadata to a personalization outputs table (e.g., `smartvideo_go_personalization_outputs`).
- Return the durable storage URL to the client instead of the transient data URL.

---

### 8. MISSING — Generated Videos Not Persisted

| Attribute | Detail |
|---|---|
| **File** | `src/shared/personalization/generationRouter.ts` (video paths), route handlers (video endpoints) |
| **Lines** | 280–391 (video generation), route handlers for video |
| **Classification** | MISSING |

**Evidence:**
- Video generation results (`generateVideo`, `generateI2V`, `processV2V`, `processRecast`) return transient URLs.
- No code persists these URLs to Supabase tables such as `videco_videos` or `smartvideo_go_personalization_outputs`.

**Impact Assessment:**
- Generated videos are not available across devices or sessions.
- No historical record of personalization outputs exists for analytics or replay.

**Recommended Fix:**
- After video generation completes, upload the video URL or reference to Supabase Storage.
- Insert a row into the personalization outputs table with the storage path, model, mode, and prompt.
- Return the durable URL to the client.

---

### 9. MISSING — Cross-Device Project State Persistence

| Attribute | Detail |
|---|---|
| **File** | `src/shared/personalization/DemoPersonalizeProvider.tsx` and related state files |
| **Lines** | Entire provider (state managed via `useState` + `localStorage`-backed utilities) |
| **Classification** | MISSING |

**Evidence:**
- Project state (prompts, assets, client selections, modes) lives exclusively in React state and `localStorage`-backed client/asset libraries.
- There is no Supabase-backed project state table or real-time sync.

**Impact Assessment:**
- Users lose their personalization project when switching devices or clearing browser data.
- No collaboration or handoff between team members is possible.

**Recommended Fix:**
- Introduce a `personalization_projects` Supabase table.
- Persist project state on meaningful mutations (debounced).
- Load project state from Supabase on modal open when a project ID is available.

---

### 10. LEGACY BUT OUTSIDE PERSONALIZATION — Global AI Assistant Modal

| Attribute | Detail |
|---|---|
| **File** | `components/AiAssistantModal.tsx` |
| **Lines** | 29–34 (`IMAGE_TOOLS`), 310–328 (`handleGenerate` image branch) |
| **Classification** | LEGACY BUT OUTSIDE PERSONALIZATION |

**Evidence:**

```typescript
// Lines 29-34: 4 OpenAI-backed image tools
const IMAGE_TOOLS = [
  { id: 'upscale', label: 'Upscale' },
  { id: 'style-transfer', label: 'Style transfer' },
  { id: 'background-remove', label: 'Background remove' },
  { id: 'restore', label: 'Restore' },
] as const;

// Lines 310-328: Unified OpenAI edit path
const prompt =
  tool === 'upscale'
    ? `Upscale this image ${scale}x while preserving all details, text, and quality.`
    : tool === 'style-transfer'
      ? `Transform this image into a ${styleSel} style. Preserve the main subjects and composition.`
      : tool === 'background-remove'
        ? `Remove the background from this image and make it transparent. Preserve the main subject with clean, natural edges.`
        : `Restore this image by repairing damage, scratches, and artifacts while preserving the original subjects, branding, and composition.`;
const results = await editImage({ prompt, image: input });
```

**Impact Assessment:**
- This is a separate global AI Assistant system, not part of Personalization.
- These operations are now implemented through OpenAI Image API 2.5 edits rather than provider-specific utility endpoints.
- Copying these operations into Personalization should reuse the same OpenAI-backed image edit path rather than duplicating legacy provider-specific code.

**Recommended Fix:**
- Keep them in the global AI Assistant modal.
- If these capabilities are needed in Personalization in the future, implement them as new domain tools backed by the OpenAI image edit proxy.

---

### 11. RAW PROVIDER CALLS — Route Handlers

| Attribute | Detail |
|---|---|
| **Files** | `app/api/personalization/image-edit/route.ts:168`, `app/api/personalization/image-smart-edit/route.ts:163`, `app/api/personalization/image-analyze/route.ts:168` |
| **Classification** | INCORRECT PERSONALIZATION ROUTING (raw provider fetch) |

**Evidence:**

```typescript
// image-edit/route.ts:168
const response = await fetch(OPENAI_EDIT_URL, {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + key },
  body: upstream,
  signal: AbortSignal.timeout(120_000),
})

// image-smart-edit/route.ts:163
const upstream = await fetch(RESPONSES_URL, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ... }),
  signal: AbortSignal.timeout(110_000),
})

// image-analyze/route.ts:168
async function callResponses(key: string, body: Record<string, unknown>) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(110_000),
  })
  ...
}
```

**Impact Assessment:**
- Each route handler constructs its own `fetch` with hardcoded OpenAI URLs.
- Auth headers, timeouts, and error handling are duplicated.
- No shared client means retries, logging, and telemetry cannot be centralized.

**Recommended Fix:**
- Create a shared `openaiClient.ts` utility in the personalization shared layer.
- Route all OpenAI calls through this client to centralize auth, timeout, retry, and error mapping.

---

## Summary Table

| # | File | Lines | Classification | Impact |
|---|---|---|---|---|
| 1 | `src/shared/personalization/generationRouter.ts` | 7–16, 208, 228 | INCORRECT PERSONALIZATION ROUTING | All image modes route to MuAPI instead of OpenAI v2.5 |
| 2 | `src/shared/personalization/postProcessor.ts` | 16, 190, 213 | INCORRECT PERSONALIZATION ROUTING | Watermark/end-card processing bypasses domain abstraction |
| 3 | `src/shared/personalization/DemoPersonalizeProvider.tsx` | 78 | INCORRECT PERSONALIZATION ROUTING | State layer imports provider upload function directly |
| 4 | `src/shared/personalization/modelCapabilityResolver.ts` | 41 | INCORRECT PERSONALIZATION ROUTING | Default image model is MuAPI catalog ID, not OpenAI v2.5 |
| 5 | `src/shared/personalization/generationRouter.ts` | entire file | MISSING | No OpenAI Image Editing v2.5 dispatch path |
| 6 | `supabase/functions/enhance-prompt/index.ts` | 15 | MISSING | No env-var-configurable reasoning model |
| 7 | `app/api/personalization/image-edit/route.ts`, `image-smart-edit/route.ts` | 168, 163 | MISSING | Edited images not persisted to Supabase Storage |
| 8 | `src/shared/personalization/generationRouter.ts` + route handlers | 280–391 | MISSING | Generated videos not persisted to Supabase |
| 9 | `src/shared/personalization/DemoPersonalizeProvider.tsx` + state files | entire provider | MISSING | Project state lives only in localStorage |
| 10 | `components/AiAssistantModal.tsx` | 53–83, 360 | LEGACY BUT OUTSIDE PERSONALIZATION | Separate system; must not be absorbed |
| 11 | `app/api/personalization/image-edit/route.ts`, `image-smart-edit/route.ts`, `image-analyze/route.ts` | 168, 163, 168 | INCORRECT PERSONALIZATION ROUTING | Raw `fetch` to OpenAI URLs; no shared client |

---

## End of Report
