# Storyboard Studio — Feature Audit (current state)

> Re-audit performed 2026-07-16. **Supersedes `docs/storyboard-audit.md`**, which was written
> against an earlier stub and is now stale — the app was substantially rewritten after that
> audit (a `StoryboardContext`, a real `src/shared/api/storyboard.ts` client, and an
> `app/api/storyboard` Next.js proxy route were all added afterward and were absent when the
> old audit was written).

## What was audited

| Layer | Path | Status |
|---|---|---|
| Shell mount | `components/StandaloneShell.js` (line 12 import, line 401 render) | ✅ mounted, lazy-loaded under `MemoryRouter` |
| Router | `src/apps/storyboard/Storyboard.tsx` | ✅ 3 routes |
| State | `src/apps/storyboard/StoryboardContext.tsx` | ✅ real context + localStorage persistence |
| Planner UI | `src/apps/storyboard/pages/StoryboardPlanner.tsx` | ✅ functional |
| Shot editor | `src/apps/storyboard/pages/ShotEditor.tsx` | ✅ functional |
| Analysis view | `src/apps/storyboard/pages/SceneAnalysis.tsx` | ✅ functional |
| API client | `src/shared/api/storyboard.ts` | ✅ real client, async + polling |
| API route | `app/api/storyboard/[[...path]]/route.ts` | ✅ proxies to MuAPI |

## Feature inventory (storyboarding essentials)

| Capability | Implemented? | Evidence |
|---|:---:|---|
| Define project (name) | ✅ | `projectName` in context + Planner input; persisted to localStorage |
| Add / edit / remove scenes | ✅ | `addShot` / `updateShot` / `removeShot`; editable textareas in Planner & ShotEditor |
| Per-scene duration | ✅ | `duration` field per shot; clamped 0–10s; shown in analysis |
| Aspect ratio selection | ✅ | `16:9` / `9:16` select; passed to API |
| Episode / total length target | ✅ | `episodeDuration` (10/15/25s) |
| Reference image (optional) | ✅ | `images_list` URL input → API `images_list` |
| Async generation (submit → request id) | ✅ | `generateStoryboard()` POST → `request_id` |
| Job polling for completion | ✅ | `pollStoryboardResult()` (120 × 5s) with status mapping |
| Asset extraction (video URL) | ✅ | `extractStoryboardAsset()` handles multiple response shapes |
| Playback of result | ✅ | `<video controls>` in Planner |
| Persistence across reloads | ✅ | localStorage `storyboard_context` (project, shots, result) |
| Scene list / breakdown view | ✅ | SceneAnalysis stats + ordered breakdown |
| Reorder / Shot Editor flow | ⚠️ partial | ShotEditor can add/edit/remove; **no drag-reorder** (scenes only appended) |
| Backend wired to real model | ✅ | `openai-sora-2-pro-storyboard` via `MUAPI_BASE` (`api.muapi.ai`) |
| Auth / API key handling | ✅ | Key resolved from header / `MUAPI_API_KEY` env / `muapi_key` cookie+localStorage |

## Gap analysis (what a full storyboard tool would still want)

These are **enhancements**, not defects — the app is functional for its stated purpose
("build scenes, generate a cohesive multi-scene Sora video").

1. **No drag-and-drop reorder.** Scenes are appended and edited inline but cannot be
   reordered visually. `removeShot` exists but there is no `reorderShots`/`moveShot`.
2. **No per-shot camera spec / shot-type taxonomy.** Real storyboarding wants
   angle (wide/close-up/POV), shot type (establishing/insert), movement (pan/tilt/dolly).
   The current model only carries a free-text `scene` + `duration`.
3. **No character persistence.** No reusable character entity (traits / outfits /
   reference images) across scenes — each scene re-describes characters in prose.
4. **No episodic / multi-project structure.** A single in-progress project per browser
   (localStorage key is fixed, not per-project). No project list, no save/load multiple.
5. **No per-shot still-frame preview.** Only a single final video is returned; there is
   no per-scene thumbnail/storyboard cell grid (the classic storyboard "frames" view).
6. **No export** (PDF / JSON / animatic). SceneAnalysis shows context but offers no export.
7. **No error surfacing of partial failures** beyond a top-level message; polling failures
   throw a generic timeout if the backend never completes.
8. **Prop mismatch (minor):** `StandaloneShell` passes `apiKey={apiKey}` to `<Storyboard>`,
   but `Storyboard.tsx` ignores it and the API client reads the key from
   `window.__MUAPI_KEY__` / `localStorage['muapi_key']` / `muapi_key` cookie. It works
   because the shell writes the cookie+localStorage, but the prop is dead — clean it up or
   thread it through `StoryboardContext` for clarity.

## Correctness / robustness notes

- `pollStoryboardResult` polls `GET /api/storyboard/result?id=...` which proxies to
  `MUAPI_BASE/api/v1/predictions/{id}/result` — matches the MuAPI predictions pattern.
- Server route validates: requires key, ≥1 shot, duration ∈ {10,15,25}, aspect ratio
  normalized, `images_list` capped at 1. Good input hardening.
- Status mapping covers `completed/succeeded/success` and `failed/error`. Robust enough.
- `tsc --noEmit` on the storyboard files: **no type errors.**

## Verdict

The Storyboard Studio is **no longer a stub**. It is a working, end-to-end scene-to-video
composer wired to the MuAPI Sora 2 Pro Storyboard model, with persistence and result
playback. It covers the core storyboarding loop (compose scenes → generate → review).

**Missing vs. a "full" storyboard tool:** drag-reorder, camera/shot taxonomy, character
persistence, multi-project/episodic structure, per-shot frame grid, and export. None of
these block the current feature from working; they are scoped enhancements.

**Recommended follow-ups (priority order):**
1. Add `reorderShots` to context + a simple up/down or drag control in ShotEditor.
2. Thread `apiKey` through context instead of the ignored prop (cosmetic).
3. Add per-shot camera-angle / shot-type fields and a still-frame grid (closer to classic storyboarding).
4. Add multi-project save/load (namespace the localStorage key) + JSON/PDF export.
5. Consider character entities if reuse across scenes becomes a real user need.
