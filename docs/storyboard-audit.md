# Storyboard App — MuAPI Storyboarding API Parity Audit

> READ-ONLY investigation. No source code was modified.

## Summary

The Storyboard app is a **client-side stub built on generic generative endpoints**, not on MuAPI's documented Storyboarding API. It does **not** call `POST /api/storyboard/projects`, does **not** use webhooks/async job polling, and contains **no server-persisted concept of characters, scenes, shots, or episodes**. Only one real API call exists (an LLM text prompt), and even the image-generation import is unused.

## What the app actually does

Source: `src/apps/storyboard/`

- `Storyboard.tsx` — router with three routes:
  - `/` → `StoryboardPlanner`
  - `/shots/:sceneId` → `ShotEditor`
  - `/analysis/:sceneId` → `SceneAnalysis`
- `pages/StoryboardPlanner.tsx`
  - Imports `generateText, generateImage` from `@/api/muapi` (alias → `src/shared/api/muapi.ts`).
  - Only `generateText` is called (`StoryboardPlanner.tsx:17`). It sends a plain LLM prompt (`"Break down this script into N scenes..."`) with a system prompt acting as a "storyboard artist".
  - The response is split on blank lines into local React state `scenes` (`StoryboardPlanner.tsx:25`). No IDs tie to a backend; `scene.id` is just an array index.
  - `generateImage` is imported but **never invoked**.
- `pages/ShotEditor.tsx` — purely static UI. The "Generate Shot" / "Regenerate" buttons (`ShotEditor.tsx:73-79`) have **no `onClick` handlers**. Camera angle/shot-type `<select>` boxes are hardcoded options with no state binding or API call. The large preview is an empty `aspect-video` div.
- `pages/SceneAnalysis.tsx` — fully hardcoded static content (e.g. "Hans Zimmer – Time", `SceneAnalysis.tsx:24`). No API, no data.

### Where API calls actually go

`src/shared/api/muapi.ts` (note: proxied to `/.netlify/functions/muapi`, but **no such Netlify function exists** in `netlify/functions/` — only `assets.js`, `brand.js`, `brands.js`, `campaigns.js`, `photo-studio.js`). The module exposes only generic endpoints: `/video`, `/image`, `/audio`, `/text`, `/video/:id`, `/models/:category`. There is **no** `/storyboard/projects` and no webhook handling anywhere in the repo.

Reproducible search: `grep -rn "storyboard\|webhook\|/projects\|episode\|character" src/` returns only the LLM system-prompt string and unrelated references (e.g. `design-agent` templates). No code path builds or consumes a storyboard project resource.

## MuAPI documented Storyboarding API (reference)

From the project brief on MuAPI's `/docs/storyboarding`:

- **Character Persistence** — define a character once (traits, outfits, reference images) and reuse across scenes/episodes.
- **Scene Management** — organize by mood/atmosphere/cinematic settings.
- **Shot-by-Shot Logic** — scenes broken into shots with camera specs (angle, shot type) and visual descriptions.
- **Episodic Structure** — projects contain episodes, each with a storyboard.
- **API** — large generations are async via webhooks; primary endpoint `POST /api/storyboard/projects`. Assets generated per shot using models like Flux and Runway, and can feed into Workflows for post-processing (VFX, color grading).

## Parity gaps

| Documented capability | Implemented? | Notes |
|---|---|---|
| `POST /api/storyboard/projects` | ❌ No | App never calls any storyboard endpoint. |
| Async generation + webhooks | ❌ No | Only a single synchronous `generateText` LLM call. No job IDs, no status polling, no webhook receiver. |
| Character Persistence | ❌ No | No character entity, traits, outfits, or reference-image storage. |
| Scene Management | ⚠️ Partial (local only) | Scenes exist only as ephemeral React state from a text split; never persisted, no mood/atmosphere fields. |
| Shot-by-Shot Logic | ❌ No | `ShotEditor` shot-type/angle selects are static and unbound; "Generate Shot" has no handler. No per-shot asset generation. |
| Episodic Structure | ❌ No | No projects/episodes data model at all. |
| Flux/Runway per-shot assets | ❌ No | `generateImage` imported but unused; no model targeting. |
| Feed into Workflows (VFX/grading) | ❌ No | `scene-planner` app is actually a generic node WorkflowBuilder, unrelated to storyboard assets. |

## Recommendations

1. **Adopt `POST /api/storyboard/projects`** as the source of truth instead of in-memory `scenes` state; persist projects/episodes/scenes/shots server-side.
2. **Implement async + webhooks** (or job-polling via returned IDs) for shot asset generation, replacing the single synchronous `generateText` call.
3. **Add a Character model** (traits/outfits/reference images) reusable across scenes and episodes.
4. **Wire `ShotEditor`** to actually generate per-shot assets via Flux/Runway through the storyboard endpoint, binding camera angle/shot-type selects to real params.
5. **Remove dead code** — the unused `generateImage` import and handler-less buttons — or implement them against the documented API.
6. **Consider deleting/relabeling `scene-planner`** (a generic WorkflowBuilder) so it isn't confused with storyboard Scene Management.
