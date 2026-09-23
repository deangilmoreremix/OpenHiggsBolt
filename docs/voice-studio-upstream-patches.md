# VoiceStudio Upstream Patches

This file records direct modifications applied to vendored upstream VoiceStudio source for the SmartVideo GO integration branch. Each entry documents why the patch is required, its scope, and future sync risk so maintainers can re-evaluate when updating the vendor bundle.

---

## Patch 1 — Scope upstream global CSS to prevent shell/style leakage

- **FILE:** `vendor/VoiceStudio/frontend/src/index.css`
- **ORIGINAL UPSTREAM SHA:** upstream v0.5.2 as vendored in this worktree (`38c2405fa17841e9b53cb43a8af7641969bea90b`)
- **ORIGINAL FILE HASH:** `vendor/VoiceStudio/frontend/src/index.css` original SHA-256: see git history for unpatched upstream content
- **ORIGINAL BEHAVIOR:** Imports Tailwind v3-specific stylesheets (`tailwindcss/theme.css`, `tailwindcss/utilities.css`) and emits global selectors (`:root`, `html`, `body`, `#root`) with top-level `@layer` rules. When bundled inside SmartVideo GO, these rules escape the VoiceStudio mount and affect host chrome/navigation. Additionally, the Tailwind v3 imports are incompatible with the Tailwind v4 installed in this workspace.
- **PATCH:** `node scripts/scope-voice-studio-css.mjs` generates a scoped replacement for `vendor/VoiceStudio/frontend/src/index.css`. The generator removes the Tailwind v3-only import lines and prefixes top-level global selectors with `[data-voice-studio]`. The generated output overwrites the vendored upstream file so that both webpack and turbopack consume the safe stylesheet without additional module-replacement hacks.
- **WHY REQUIRED:** SmartVideo must not inherit VoiceStudio chrome tokens, fonts, or base resets. Alias-only redirection from `vendor/...` did not resolve consistently for transitive vendor CSS imports during production build. `NormalModuleReplacementPlugin` works for webpack but is ignored by turbopack. The only verified path to reliable CSS isolation for both build systems is replacing the vendored entrypoint stylesheet with the generated scoped output.
- **WHY BUILD-LAYER ALTERNATIVES FAILED:**
  - `resolve.alias` in webpack: did not intercept CSS imports from transitive vendor modules.
  - `NormalModuleReplacementPlugin` in webpack: worked for production build, but turbopack ignores webpack plugins.
  - Turbopack `resolveAlias`: does not replace CSS module contents for turbopack-bound client components.
- **FUTURE UPSTREAM SYNC PROCEDURE:**
  1. Update `vendor/VoiceStudio/frontend/src/index.css` to the new upstream version.
  2. Re-run `node scripts/scope-voice-studio-css.mjs`.
  3. Diff the regenerated file against the committed version.
  4. If the diff introduces new unprefixed global selectors, update the scoping script.
  5. Do NOT edit the scoped file by hand.
- **FUTURE SYNC RISK:** Medium. Any upstream change to `vendor/VoiceStudio/frontend/src/index.css` must be re-scoped. The scoping script covers the known global selectors today; new upstream global selectors would require script updates.

---

## Patch 2 — TanStack Table downgrade to v8 API compatibility

- **FILE:** `package.json`, `package-lock.json`
- **ORIGINAL UPSTREAM SHA:** upstream v0.5.2 as vendored in this worktree
- **ORIGINAL BEHAVIOR:** Vendored VoiceStudio frontend imports `@tanstack/react-table` v8 API (`useReactTable`, `getCoreRowModel`, `getSortedRowModel`).
- **PATCH:** Ensured `@tanstack/react-table` resolves to v8 in the SmartVideo workspace instead of v9.
- **WHY REQUIRED:** The repository had v9 installed; v9 removed the v8 named exports used by ModelSection and other catalogue UI paths. Keeping v8 preserves upstream UI behavior without rewriting vendored components.
- **FUTURE SYNC RISK:** Medium. Re-syncing vendor deps may reintroduce v9 or another breaking API surface. Treat `@tanstack/react-table@8` as a VoiceStudio-compatible constraint until upstream explicitly migrates.

---

## Patch 3 — Clerk webhook request type assertion

- **FILE:** `app/api/webhooks/clerk/route.ts`
- **ORIGINAL UPSTREAM SHA:** current main branch state
- **ORIGINAL BEHAVIOR:** Passed `NextRequest` directly to `verifyWebhook`, which expects `RequestLike`. Type-check failed because the worktree and main installed different Next.js type shapes for `NextRequest`.
- **PATCH:** Added a type assertion at the `verifyWebhook` call site.
- **WHY REQUIRED:** This failure blocks `npm run build` in this environment. It is not caused by VoiceStudio integration, but must be kept green to ship or verify other changes.
- **FUTURE SYNC RISK:** Low if the underlying type mismatch is resolved upstream. If Next.js types are unified across installs, the assertion can be removed.

---

## Patch 4 — VoiceStudio API base override for web mount

- **FILE:** `src/integrations/voice-studio/api.js` (integration layer, not vendored upstream)
- **ORIGINAL UPSTREAM SHA:** upstream v0.5.2 as vendored in this worktree
- **ORIGINAL BEHAVIOR:** Upstream `api/client.ts` resolves API base at import time from `window.__OMNIVOICE_API_BASE__` or falls back to `window.location.origin`. When bundled inside SmartVideo GO at `/studio/voice`, the fallback resolves to the SmartVideo origin, which does not expose the VoiceStudio backend endpoints on the root path.
- **PATCH:** `src/integrations/voice-studio/api.js` sets `window.__OMNIVOICE_API_BASE__ = '/api/voice'` at module-body time, before `App.jsx` imports `api/client.ts`. The SmartVideo Next.js app proxies all `/api/voice/*` requests to the Modal-backed backend via `app/api/voice/[...path]/route.ts`.
- **WHY REQUIRED:** Without this override, all upstream API calls target `window.location.origin` (SmartVideo root) and 404. The override is the single verified interception point that works for both webpack and turbopack without module-replacement plugins.
- **WHY ALIAS-BASED ALTERNATIVES WERE NOT USED:** `resolve.alias` in webpack does not intercept the `window.__OMNIVOICE_API_BASE__` runtime check inside `api/client.ts`. The override must happen at the global variable level before the module executes.
- **FUTURE UPSTREAM SYNC PROCEDURE:**
  1. Verify `api/client.ts` still reads `window.__OMNIVOICE_API_BASE__` at import time.
  2. If upstream changes the API base resolution mechanism, update `src/integrations/voice-studio/api.js` accordingly.
- **FUTURE SYNC RISK:** Low. The override targets a stable global variable name (`__OMNIVOICE_API_BASE__`). If upstream renames or removes this variable, the integration will fail loudly (all API calls 404) and the override can be updated in one place.

---

## Patch 5 — VoiceStudio app version injection for web runtime

- **FILE:** `src/integrations/voice-studio/VoiceStudioWebApp.jsx` (integration layer, not vendored upstream)
- **ORIGINAL UPSTREAM SHA:** upstream v0.5.2 as vendored in this worktree
- **ORIGINAL BEHAVIOR:** Upstream expects `window.__APP_VERSION__` to be injected at build time by Vite (via `import.meta.env`). In the SmartVideo Next.js build, this variable is undefined, causing version-dependent UI (About tab, bug report, first-run notes) to crash with `Cannot read properties of undefined`.
- **PATCH:** `VoiceStudioWebApp.jsx` sets `window.__APP_VERSION__ = '0.5.2'` at module-body time if the variable is not already defined. This satisfies upstream version checks without requiring Vite build-time injection.
- **WHY REQUIRED:** The upstream `resolveAboutVersion` utility and other version-dependent code paths read `window.__APP_VERSION__` during render. Without this injection, the About tab and bug report button throw runtime errors.
- **FUTURE UPSTREAM SYNC PROCEDURE:**
  1. When updating VoiceStudio version, update the hardcoded string in `VoiceStudioWebApp.jsx` to match `vendor/VoiceStudio/frontend/package.json` version.
  2. If upstream changes the version variable name or mechanism, update this injection accordingly.
- **FUTURE SYNC RISK:** Low. The variable name is stable in upstream v0.5.2. Version string must be kept in sync with upstream `package.json` during vendor updates.

---

## Patch 6 — Desktop-only persistence exit handshake no-op on web

- **FILE:** `src/integrations/voice-studio/VoiceStudioWebApp.jsx` (integration layer, not vendored upstream)
- **ORIGINAL UPSTREAM SHA:** upstream v0.5.2 as vendored in this worktree
- **ORIGINAL BEHAVIOR:** `utils/persistenceLifecycle.ts` exports `installDesktopPersistenceExitHandshake`, which registers a `window-close` event listener via Tauri's `app` API. Calling this in a web context throws because `window.__TAURI__` is undefined.
- **PATCH:** `VoiceStudioWebApp.jsx` calls `installDesktopPersistenceExitHandshake?.()` with optional chaining. The upstream module returns a no-op cleanup function in non-Tauri contexts, but the call site guards against the module itself being absent or the function throwing.
- **WHY REQUIRED:** The upstream `bootstrapApp()` calls this unconditionally. In the web mount, the Tauri module is not installed, so the import would fail or the call would throw without the guard.
- **FUTURE UPSTREAM SYNC PROCEDURE:**
  1. Verify `utils/persistenceLifecycle.ts` still exports `installDesktopPersistenceExitHandshake` and that it is a safe no-op in non-Tauri contexts.
  2. If upstream changes the export name or makes the function non-safe in web contexts, add a try/catch or feature-detection guard.
- **FUTURE SYNC RISK:** Low. The `?.()` optional chaining handles missing export. If upstream makes the function throw in web contexts, wrap in try/catch.

---

## Patch 7 — Tauri-dependent settings panels gated by isTauri()

- **FILE:** `vendor/VoiceStudio/frontend/src/pages/Settings.jsx` (vendored upstream, no direct modification)
- **ORIGINAL UPSTREAM SHA:** upstream v0.5.2 as vendored in this worktree
- **ORIGINAL BEHAVIOR:** `Settings.jsx` imports and renders `UpdatesPanel`, which calls `invoke('check_update')` from `@tauri-apps/api/core`. In a web context where Tauri APIs are not installed, these calls throw `ReferenceError: invoke is not defined`.
- **PATCH:** No direct modification to `Settings.jsx`. The upstream code already guards Tauri-dependent calls with `isTauri()` checks inside the panel components themselves (e.g., `UpdatesPanel.jsx` calls `isTauri()` before invoking Tauri APIs and shows a "desktop only" toast on web). The integration relies on these upstream guards being present and functional.
- **WHY REQUIRED:** Without upstream's `isTauri()` guards, mounting `Settings.jsx` in a web context would crash when the Updates tab or log tabs try to access Tauri-specific APIs.
- **WHY NO DIRECT PATCH:** The upstream codebase already handles this correctly. Adding a patch would be redundant and would create merge conflicts on vendor updates. The integration accepts this as upstream-correct behavior.
- **FUTURE SYNC RISK:** Low. If upstream removes the `isTauri()` guards from any settings panel, that panel will crash on web. Monitor upstream `Settings.jsx` and panel components for removal of `isTauri()` checks during vendor updates.

---

## Patch Summary Table

| Patch | File(s) | Scope | Sync Risk | Status |
|-------|---------|-------|-----------|--------|
| 1 | `vendor/VoiceStudio/frontend/src/index.css` + `scripts/scope-voice-studio-css.mjs` | CSS scoping + Tailwind v3 import removal | Medium | Active |
| 2 | `package.json`, `package-lock.json` | Dependency constraint (`@tanstack/react-table@8`) | Medium | Active |
| 3 | `app/api/webhooks/clerk/route.ts` | Type assertion | Low | Active |
| 4 | `src/integrations/voice-studio/api.js` | Runtime global variable override | Low | Active |
| 5 | `src/integrations/voice-studio/VoiceStudioWebApp.jsx` | Runtime version injection | Low | Active |
| 6 | `src/integrations/voice-studio/VoiceStudioWebApp.jsx` | Optional chaining guard for desktop-only module | Low | Active |
| 7 | `vendor/VoiceStudio/frontend/src/pages/Settings.jsx` (no modification) | Relies on upstream `isTauri()` guards | Low | Monitor |
