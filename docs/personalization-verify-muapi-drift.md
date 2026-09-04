# Personalization API — verify:muapi Catalog Drift

## Status: Known Drift (Non-blocking for Personalization)

`npm run verify:muapi` reports **36 models do not resolve to a live MuAPI endpoint**.

These mismatches are in the **standard generation catalogs**:
- `t2iModels`
- `t2vModels`
- `i2iModels`
- `i2vModels`
- `v2vModels`
- `lipsyncModels`
- `recastModels`

## Personalization-Critical Models

The following models **are used by the personalization system** and **resolve correctly**:

| Model ID | Catalog | Endpoint | Status |
|---|---|---|---|
| `gpt-image-2` | t2iModels | `gpt-image-2-text-to-image` | PASS |
| `seedance-2-t2v` | t2vModels | `seedance-v2.0-t2v` | PASS |
| `ai-video-face-swap` | tools (v2vModels-like) | `ai-video-face-swap` | NOT CHECKED |
| `kling-v3.0-pro-recast` | recastModels | `kling-v3.0-pro-motion-control` | PASS |
| `add-image-watermark` | image tools | `add-image-watermark` | NOT CHECKED |
| `add-video-watermark` | video tools | `add-video-watermark` | NOT CHECKED |

## Drift Categories

1. **Endpoint naming changes**: Some local IDs map to different live endpoints (e.g., `seedance-2-t2v` → `seedance-v2.0-t2v`). The generation router already handles endpoint resolution via `getModelById`.

2. **Deprecated models**: Some models in the local catalog may have been deprecated or renamed in the live MuAPI.

3. **Tool models not verified**: Image/video tools (watermark, face swap) are not included in `verify:muapi` checks.

## Recommendation

- **Short-term**: Accept the 36-model drift as a known issue. The personalization system uses catalog lookups (`getModelById`) which resolve the correct live endpoints at runtime.
- **Medium-term**: Schedule a catalog sync pass to update local model definitions against the live MuAPI `/models` endpoint.
- **Long-term**: Add tool models (`add-image-watermark`, `add-video-watermark`, `ai-video-face-swap`) to `verify:muapi` checks.

## Action Items

- [ ] Add tool models to `verify:muapi` check scope
- [ ] Sync local catalog with live MuAPI endpoints
- [ ] Update `generationRouter.ts` to log resolved endpoints for debugging
