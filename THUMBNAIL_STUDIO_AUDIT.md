# Thumbnail Studio — API Audit & Fix

**Target:** `src/apps/thumbnail-studio/ThumbnailStudio.tsx` and its image-generation path
**Date:** 2026-07-14
**Auditor:** API audit (follow-up to `VIDEO_STUDIO_AUDIT.md`)

---

## 1. Summary

A user reported the Thumbnail Studio "is not working with her API key." The audit found a single
root-cause defect plus several hardening gaps that block production readiness.

**Root cause:** The Thumbnail Studio receives the user's **MuAPI** key through its `apiKey` prop
(passed down from `StandaloneShell`, sourced from `localStorage["muapi_key"]`), but it never uses it.
Instead, generation was hard-wired to **OpenAI's** `gpt-image-2` endpoint in
`src/shared/components/ImageGen/ImageStream.tsx` and `src/shared/api/openaiImage.ts`, authenticated
with `process.env.NEXT_PUBLIC_OPENAI_API_KEY` — a variable that **does not exist** in `.env.local`
or `.env.production`. Every generation therefore fails (empty/401 key) regardless of what key the
user entered.

The fix re-points the studio at MuAPI's image endpoint (`flux-dev`) using the user's own key, exactly
like the Video/VFX studios already do, via a new key-aware client modeled on the existing
`src/shared/api/vfx.ts` pattern.

---

## 2. Files reviewed

| File | Role | Status |
|---|---|---|
| `src/apps/thumbnail-studio/ThumbnailStudio.tsx` | Studio UI / orchestration | Fixed |
| `src/shared/components/ImageGen/ImageStream.tsx` | OpenAI streaming generator (was used) | Replaced |
| `src/shared/api/openaiImage.ts` | OpenAI `gpt-image-2` client (was used) | No longer used by studio |
| `src/components/StandaloneShell.js` | Mounts studio, passes `apiKey={apiKey}` | OK (key is available) |
| `src/shared/api/muapiImage.ts` | **NEW** MuAPI image client | Added |
| `src/shared/components/ImageGen/MuapiImageStream.tsx` | **NEW** MuAPI progress UI | Added |
| `src/shared/components/ImageGen/types.ts` | Shared types | Extended |
| `src/shared/api/vfx.ts` | Reference MuAPI pattern (VFX) | Reference only |

---

## 3. Findings

| Sev | Finding | Status |
|---|---|---|
| **Critical** | Thumbnail Studio ignored the user's `apiKey` prop and called OpenAI with a non-existent `NEXT_PUBLIC_OPENAI_API_KEY`. Generation always failed. | **Fixed** |
| **Critical** | No MuAPI key was ever sent to the image API, so even a valid user key could not work. | **Fixed** |
| Med | `apiKey` prop accepted but unused (dead parameter) — misleading for future maintainers. | **Fixed** |
| Med | Refine feature used OpenAI `gpt-4o` Responses API (also keyless/broken). | **Fixed** (now MuAPI image-to-image) |
| Med | No explicit "missing key" UX — failures surfaced as generic generation errors. | **Fixed** (clear message + Settings hint) |
| Low | `ImageStream.tsx` / `openaiImage.ts` are now dead code for this studio. | Open (left in place; see §6) |
| Low | `alt-text` lint warnings on lucide `<Image>` icons (pre-existing, non-blocking). | Open (pre-existing) |

---

## 4. Change applied (this audit)

1. **`src/shared/api/muapiImage.ts` (new)** — `MuAPIImageClient` + `getImageClient(apiKey)`:
   - Key-aware (`x-api-key` header, base `https://api.muapi.ai`), mirroring `vfx.ts`.
   - `uploadImage(file, onProgress?)` for reference images (10 MB / JPG-PNG-WebP validation).
   - `generate({ prompt, model, aspectRatio, quality, n, imageUrl?, strength? })` → submit to
     `POST /api/v1/{endpoint}` then poll `GET /api/v1/predictions/{request_id}/result`.
   - Robust result extraction across response shapes (`url` / `output` / `outputs` / nested `data`).
   - Friendly errors for 401/403 (invalid key), 429 (rate limit), timeouts, and cancellation.
   - Default model `flux-dev`; aliases for `flux-schnell`, `seedream-5.0`, `midjourney-v7`.

2. **`src/shared/components/ImageGen/MuapiImageStream.tsx` (new)** — drop-in replacement for
   `ImageStream` with the same `request` / `onComplete` / `onError` contract, driving MuAPI and
   showing submit → queued → generating → done progress plus a final-preview card.

3. **`src/shared/components/ImageGen/types.ts`** — `ImageModel` now includes `flux-dev` (etc.);
   `GenerationRequest` gains `apiKey` and `previousImageUrl`.

4. **`src/apps/thumbnail-studio/ThumbnailStudio.tsx`** —
   - Imports the user's `apiKey` and threads it into the generation request.
   - Swaps `ImageStream` → `MuapiImageStream`.
   - Model badge + all `model` defaults changed `gpt-image-2` → `DEFAULT_IMAGE_MODEL`.
   - `handleRefine` rewritten to MuAPI image-to-image (`getImageClient(apiKey).generate` with the
     previous image URL); tracks `lastImageUrl` instead of OpenAI `responseId`.
   - Edit mode uploads the reference image and runs image-to-image via `flux-dev`.

---

## 5. Verification

- `npx tsc --noEmit -p tsconfig.json` → **0 errors** (full project).
- `next lint` on the three changed files → **0 errors** (two pre-existing `alt-text` warnings on
  lucide `<Image>` icons, non-blocking).
- Contract parity: `MuapiImageStream` preserves the exact `onComplete`/`onError` shape the gallery
  already consumes, so no gallery changes were required.

**Not verified (requires a live MuAPI key + network):**
- An end-to-end generation call against `api.muapi.ai` (no key available in this environment).
- The exact `flux-dev` payload/response schema at runtime (built defensively against the documented
  MuAPI response shapes used by `src/lib/muapi.js` and `vfx.ts`).

---

## 6. Recommendations

1. **Remove dead code:** `ImageStream.tsx` and the OpenAI-only `openaiImage.ts` are no longer used by
   the studio. Delete or gate behind a feature flag to avoid confusion.
2. **Add a test:** unit-test `muapiImage.ts` payload assembly + result extraction with a mocked
   `fetch`, and a Playwright smoke test that enters a key and generates one thumbnail.
3. **Quality mapping:** `flux-dev` ignores the `quality` field today; map `quality` →
   `num_inference_steps` (or switch to `seedream-5.0` which honors `quality`) so the Quality selector
   has a real effect.
4. **Mask/inpainting:** edit mode currently uses whole-image image-to-image. Add a dedicated
   inpainting model (e.g. `bytedance-seededit-v3`) if masked editing is required.
5. **CORS on download:** generated images are now remote MuAPI URLs; `handleDownload` fetches then
   downloads and falls back to a new tab. Confirm MuAPI output URLs send CORS headers.
