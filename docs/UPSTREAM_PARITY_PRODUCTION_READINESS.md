# Upstream Parity Audit & Production Readiness — SmartVideo GO AI

**Date:** 2026-10-23/24
**Upstream:** https://github.com/Anil-matcha/Open-Generative-AI — HEAD `1fe89914527fa517c2de08344c66cbcfbf41563d` ("Use Node 22 base image")
**Previous parity pin:** `093d71fc7e88e70dcbba6c382941ccb9d8bafa15` (used by `EXACT_UPSTREAM_STUDIO_PARITY.md`)
**OpenHiggsBolt audited commit:** `836530783d90a68cd96215683acc27e63d93bd7c` (`main`, PR #76). This is also the commit production is serving.
**Branch:** `claude/nice-lovelace-1jsjuk`

## 0. Scope (as decided by the owner)

| Decision | Choice |
|---|---|
| Surfaces audited | **Web app studios** (React `packages/studio`, rendered at `/studio/*` on go.smartvid.app) |
| Desktop (Electron/Vite) app | **Out of scope.** Gaps are recorded in §6 and the app was not modified |
| Chinese (`zh`) translations | **Keep English only.** Recorded as a deliberate difference |
| Design Agent Studio | Excluded |
| Non-matching studios (Storyboard, VFX, GO-Viral, Thumbnail, Social Publishing, Brand/Photo Studio, Apps reseller, MCP CLI) | Not touched |
| Upload code | Not touched |

## 1. Verdict

**Every matching web studio now has all upstream features, functions and options.** The studio components themselves needed no change. The shell they run in was missing two upstream features (§2.6), which are now ported. The only upstream lines absent locally are the documented carve-outs (upload code, Clerk auth-event field, Workflow route adapter, one import variant, one whitespace line). No local addition hides, removes or overrides an upstream control. The browser tests (§4) exercise the main Video Studio workflows plus every studio tab.

Upstream has made **no functional change** since the previous pin. `093d71f..1fe8991` touches only `README.md` and `Dockerfile`.

## 2. How parity was established

1. `git fetch https://github.com/Anil-matcha/Open-Generative-AI`, then a **blob-hash comparison** of all 100 upstream files under `packages/studio/src` against this repo.
2. For each differing file, the **upstream lines absent locally** (`diff upstream local | grep '^<'`). An absent line is the only place an upstream feature or option can be missing.
3. A review of every **locally added** line in the matching studios, looking for code that hides, disables, filters or overrides upstream UI.
4. A comparison of host-app code the studios depend on: the API proxies, the studio route, the package dependencies, and the desktop app.
5. Runtime verification with Playwright (§4) and the studio package's unit tests.

### 2.1 Blob comparison — `packages/studio/src` (100 upstream files)

| Result | Count |
|---|---|
| Byte-identical | **71** |
| Differ | 26 |
| Missing locally | 3 (`McpCliStudio.jsx` + its two message bundles, deliberately excluded) |

The byte-identical files include the whole model catalogue and controls layer: `models.js`, `modelFamilies.js`, `modelCapabilities.js`, `modelParameters.js`, all `*Models.js` / `*Parameters.js` provider files, `groupedVideo*.js`, `videoToolCapabilities.js`, `videoWorkflows.js`, `videoMediaInputs.js`, `imageInputContracts.js`, `imageSizing.js`, `utils/generationLifecycle.js`, `ModelParameterControls.jsx`, `VideoModelControls.jsx`, `PromptComposer.jsx`, `MobileGenerationActions.jsx`, `DrawModal.jsx`, `persistKey.js`, and `tailwind.css`. The studios are also byte-identical in four cases: **Agent, Layers, Motion Control and Workflow UI**.

### 2.2 Matching studios — feature parity matrix

"Upstream lines absent" counts upstream source lines with no local counterpart (upstream HEAD `1fe8991`).

| Studio | Upstream source | Local implementation | Upstream lines absent | What is absent | UI accessible | Functional test | Status |
|---|---|---|---|---|---|---|---|
| Video | `packages/studio/src/components/VideoStudio.jsx` | same path, +153 additive lines | **0** | — | `/studio/video` ✅ | catalogue, 4 input modes, T2V payload, failure, 5xx retry, persistence (§4) | **PARITY** |
| Image | `ImageStudio.jsx` | +248 additive | **0** | — | `/studio/image` ✅ | tab renders | **PARITY** |
| Audio | `AudioStudio.jsx` | +19 | 1 | `file.size > 20MB` guard. **Upload code**; the shared upload contract applies instead | ✅ | tab renders | **PARITY** (upload carve-out) |
| AI Clipping | `ClippingStudio.jsx` | +85 | 1 | whitespace-only line | ✅ | tab renders | **PARITY** |
| Vibe Motion | `VibeMotionStudio.jsx` | +18 | **0** | — | ✅ | tab renders | **PARITY** |
| Lip Sync | `LipSyncStudio.jsx` | +18 | **0** | — (includes upstream's newest audio play/pause preview, `62c7a0f`) | ✅ | tab renders | **PARITY** |
| Recast | `RecastStudio.jsx` | +18 | **0** | — | exported + mounted | — | **PARITY** |
| Cinema | `CinemaStudio.jsx` | +98 | **0** | — | ✅ | tab renders | **PARITY** |
| Marketing | `MarketingStudio.jsx` | +18 | **0** | — | ✅ | tab renders | **PARITY** |
| Workflows | `WorkflowStudio.jsx` | +22 | 7 | upstream reads `params.tab`; this app mounts at `/studio/[[...slug]]`. The adapter accepts **both**, so it is a superset | ✅ | tab renders | **PARITY** (route adapter) |
| Workflow UI | `WorkflowUI.jsx` | — | 0 | byte-identical | ✅ | — | **IDENTICAL** |
| Agents | `AgentStudio.jsx` | — | 0 | byte-identical | ✅ | tab renders | **IDENTICAL** |
| AI Influencer | `AiInfluencerStudio.jsx` | +99 | 1 | `import { useState, useCallback }` (local imports a superset) | ✅ | tab renders | **PARITY** |
| Layers | `LayersStudio.jsx` | — | 0 | byte-identical | ✅ | tab renders | **IDENTICAL** |
| Motion Control | `MotionControlStudio.jsx` | — | 0 | byte-identical | ✅ | tab renders | **IDENTICAL** |

**Local additions are additive.** They are social publishing, the AI assist step, the skills/recipe registry, the character sheet, the template banner and template data, the storyboard hand-off and the cost estimator. The only additions that set studio state seed values from a template or storyboard hand-off (`setSelectedAr`, `setSelectedDuration`, …). Image Studio's extra resolution `<select>` renders only when a template has preset a resolution, and upstream's quality/resolution control (`currentResolutions`) is still present.

### 2.3 Shared client — `packages/studio/src/muapi.js`

29 upstream lines absent. **All of them are upload code** (`uploadFile` XHR body and `FILE_UPLOAD_TIMEOUT_MS`), apart from one: the `notifyAuthRequired` signature, which locally adds a `code` field for the Clerk auth-required event. Every upstream generation, polling, workflow, agent and account function is present. Local-only extras: `buildWorkflowApiSnippets`, `generateCharacterVideo`.

### 2.4 Upstream's newest features — presence check

| Upstream commit | Feature | Upstream refs | Local refs |
|---|---|---|---|
| `00132ec` | Nano Banana 2.1 models | 6 | 6 |
| `a3e82af` | Ideogram 4.0 text-to-image | 3 | 3 |
| `a3e82af` | Eleven v4 audio | 5 | 5 |
| `a3e82af` | Fish S2.1 Pro audio | 4 | 4 |
| `a3e82af` | Lyria 3 Pro / 3 / 2 audio | 4 / — / 4 | 4 / — / 4 |
| `3ec04d3` | Vidu Q4 image-to-video + reference-to-video | 11 | 11 |
| `62c7a0f` | Lip Sync audio play/pause preview + upload fix | 0 lines absent | ✅ |

### 2.5 Host-app code the studios depend on

| Path | Finding |
|---|---|
| `app/api/api/v1/[[...path]]` (generation proxy) | Same methods as upstream (GET, POST). Local version is hardened (timeouts, JSON errors, no cookie forwarding) |
| `app/api/workflow/[[...path]]` | Same methods (GET, POST, PUT, DELETE). Upstream's extra lines are debug logging |
| `app/api/app/[[...path]]` | Same methods. Upstream's `get_upload_file → get_file_upload_url` alias is kept (plus a `get_upload_url` alias) |
| `app/api/agents/[[...path]]` | Same methods (GET, POST, PUT, DELETE) |
| `app/api/v1/creative-agent/[[...path]]` | Same methods (GET, POST, PATCH, DELETE) |
| `packages/studio/src/index.js` | Exports reordered. Recast and Motion Control are exported. `McpCliStudio` is not exported (deliberate). `AppsStudio` is the local reseller marketplace |
| `packages/studio/package.json` | Only `design-agent` is missing (Design Agent excluded). The `exports` map is not used by this app, which resolves the package through aliases |
| `packages/studio/dist/` (git-tracked build) | Rebuilt from `src/` during this audit: **0 files changed**, so the shipped bundle matches source |

### 2.6 Studio shell (`components/StandaloneShell.js`) — gaps found and ported

The studios run inside the shell, so a missing shell feature is missing from every studio. The shell is a SmartVideo rewrite (top tab bar instead of upstream's sidebar), so it was compared feature by feature.

| Upstream shell feature | Before | Now |
|---|---|---|
| **Persistent background generation** (`32d9dcc`): studios stay mounted while hidden, so a running generation survives switching studios | **Missing.** Only the active studio was rendered, and tab switches used `router.push('/studio/<tab>')`, which in the App Router remounts the whole route segment. Every studio switch lost in-flight jobs and unsaved prompts/settings | **Ported.** A matching studio mounts on first visit and then stays mounted (hidden). Studio tabs switch with `history.pushState` + a `popstate` listener, as upstream does. The URL-sync effect reads `usePathname()` so it follows `pushState` |
| **Generation activity + result notifications**: "X is generating (n)", "Generation complete — Open →", "Generation failed" with the provider message, 12 s expiry, 3 visible, kept in sessionStorage | **Missing.** All 13 matching studios fire `onGenerationStart/End/Complete/Error`, but the shell passed none of them | **Ported** (upstream markup and copy; English copy added to `messages/en/common.json`) |
| Drag-and-drop media onto a studio | present | unchanged; files go **only to the active studio**, so a drop never uploads into hidden studios |
| Back/forward between studios | present (via router) | kept, now via `popstate` |
| Balance display, settings, API-key modal | present (SmartVideo versions) | unchanged |
| Collapsible category sidebar / mobile drawer | top tab bar instead | not ported: layout difference, every studio is reachable |
| Vadoo promo banner | absent | not ported: third-party promo, not a studio feature |

Scope guards: non-matching studios keep their mount-on-active rendering; Design Agent, the Personalization Modal/provider (`DemoPersonalizeProvider` and everything under `src/shared/personalization/`) and upload code are untouched. Template data, like dropped files, goes only to the active studio, so a hidden studio never applies another studio's template.

## 3. Deliberate differences (not parity gaps)

| Difference | Reason |
|---|---|
| Upload code (`uploadFile`, `uploadContract.js`, `UniversalMediaUploader.jsx`, `/api/v1/upload_file`, upload-binary routes, Audio Studio size guard) | Owner instruction: upload code is not changed. Local uploads use this app's own authenticated route and size/MIME contract |
| Chinese translations (`messages/zh/*` emptied, `i18nUtils.js` simplified, no `/zh` routes) | Product decision (`cf8a102db`), enforced by CI. The owner confirmed English only |
| MCP CLI Studio | Permanently excluded. `/studio/mcp-cli` redirects |
| Design Agent Studio | Excluded by the owner. Upstream wraps the external `design-agent` package; this app uses its own `src/apps/design-agent` |
| Apps Studio | The local version is the SmartVideo reseller marketplace (different product purpose) |

## 4. Runtime verification

### 4.1 Browser tests — `e2e/release-smoke.spec.ts` (new)

The public tests ran against a **local production build** (`next build` + `next start`). The studio tests ran against a dev server at the same commit, which honours the repo's E2E auth-bypass cookie. **Paid generation was never called**: every MuAPI request in the studio tests is answered by `page.route` and those tests are labelled MOCKED. Result: **19/19 passed, no retries** (8 public tests on the production build, 11 studio tests including the new shell features).

| # | Test | Mocked? | Result |
|---|---|---|---|
| 1 | Landing page renders without fatal errors | no | PASS |
| 2 | `/personalization-demo` renders without fatal errors | no | PASS |
| 3 | `/studio/video` redirects anonymous visitors to `/sign-in` | no | PASS |
| 4 | Dev auth-bypass cookie is **ignored** by a production build | no | PASS |
| 5 | **Free Business Asset Finder**: anonymous visitor enters a website, "Find My Brand" posts `{websiteUrl}`, assets render for review, no upgrade copy, no 402/403 | discovery payload only | PASS |
| 6 | Free finder endpoints (`/api/demo/discover`, `find-businesses`, `research-business`, `discover-assets`) are never 401/402/403/404 | no (real handlers) | PASS |
| 7 | `/` and `/demo` have no horizontal scroll at 390 px | no | PASS |
| 8 | Local demo media plays (`currentTime > 0`) | no | PASS |
| 9 | Video model catalogue: All / Text to Video / Image to Video / Video Tools tabs, search, selection | key endpoint | PASS |
| 10 | Video input modes: Animate image exposes a file input; Start & end frames and Use references show their controls | key endpoint | PASS |
| 11 | T2V: request carries the prompt + the user's `x-api-key`; first poll 503 is **retried**; result video renders | MOCKED | PASS |
| 12 | Failed generation surfaces the provider error and re-enables Generate | MOCKED | PASS |
| 13 | All 14 matching studio tabs render; navigating back to Video works | key endpoint | PASS |
| 14 | Selected model persists across reload (upstream's `localStorage` persistence, scoped per key) | key endpoint | PASS |
| 15 | **Background generation**: start in Video, switch to Image (URL changes), "Video Studio is generating" stays visible; on completion a toast appears and "Open →" returns to Video with the result | MOCKED | PASS |
| 16 | Unsaved prompt survives switching studios; browser back/forward follow the URL | key endpoint | PASS |
| 17 | Failed generation raises an error notification with the provider message; dismiss works | MOCKED | PASS |
| 18 | Storyboard "Send to" a studio that is already open applies the new hand-off (regression test for a review finding; fails without the fix) | key endpoint | PASS |
| 19 | Leaving a dedicated `/workflow/<id>` page lands on the requested studio (regression test for a review finding; fails without the fix) | workflow API | PASS |

Screenshots: `docs/assets/upstream-parity-2026-10-23/01…11-*.png`. External thumbnails appear broken because the sandbox blocks the CDN.

To re-run (e.g. against a preview with a Clerk storage state):

```bash
RELEASE_SMOKE_BASE_URL=<url> RELEASE_SMOKE_STUDIO_URL=<url> \
RELEASE_SMOKE_STORAGE_STATE=playwright/.clerk/<state>.json \
npx playwright test e2e/release-smoke.spec.ts --retries=0
```

### 4.2 Unit and integration tests

| Suite | Result |
|---|---|
| `packages/studio` (vitest) | **104/104** |
| Release tooling (`scripts/__tests__`, vitest with explicit config) | **25/25** (24/25 before the fix in §5) |
| `pnpm run test:muapi` (user API-key routes) | **24/24** (did not compile before the fix in §5) |
| Full `vitest run` | **45 failed** (33 files), rest passing. Before this work: 48 failed (36 files). Three are fixed by §5; the fourth (`DiscoveredAssets.test.tsx`) is deliberately left unchanged (personalization area). **No new failures** |
| `pnpm run typecheck` | **pass** |
| `pnpm run lint` | **fails**: 1,276 errors, mostly `no-explicit-any`. Same tree as production. **No files under `packages/studio` are linted.** `next.config.mjs` sets `ignoreDuringBuilds: true` |
| Production build (`build:metadata → build:packages → build`) | **pass** (needs Supabase/Clerk env at page-data collection; Netlify provides them) |
| Install (`pnpm install --frozen-lockfile`, submodules at pinned SHAs) | **pass** |

**Every remaining failure was classified, and the set is identical at `7ebc209`, the commit before the upstream sync.** The upstream sync introduced **zero** failures.

| Class | Files | Root cause |
|---|---|---|
| Wrong runner | 17 `tests/*.test.js` | `node:test` files picked up by vitest's `include` ("No test suite found"). Under `tsx --test`: 95 pass, 9 fail (4 files fail to transform with `ERR_REQUIRE_ASYNC_MODULE`, `openai-key-route` has async leaks, `api-keys-integration` asserts cookie storage that was removed for security) |
| Sandbox has no DNS / IPv6 | `discoverAssets`, `personalizationDiscovery`, `businessDiscovery`, `browser-discovery-ssrf`, `s3-dns-pinning` | Proven: with a DNS stub, 297/298 pass; the remaining one binds `::1` (`EAFNOSUPPORT`) |
| Pre-existing billing tests out of sync | `stripe-webhook-gates`, `zz-stripe-webhook-entitlements`, `webhook-reseller-branch` | See risk R3 |
| Personalization test (left untouched by owner instruction) | `src/shared/personalization/__tests__/DiscoveredAssets.test.tsx` | Test race: `importDiscoveredAssets()` is not awaited, so it asserts before the import finishes. Awaiting it makes 21/21 pass; the product behaviour is correct |
| Pre-existing, unrelated to studios | `preview-mode` (UpgradeModal copy changed), `brand-route` / `brands-route` (error codes, server-only import), `go-ai-viral/*` (missing jsdom directive, dataset semantics), `netlify/functions-entitlement` (`campaigns.js` guard shape), `byok-enforcement` (see R4) | Outside the upstream integration |

## 5. Defects fixed in this work

Production code changed only in the release tooling (F1) and the studio shell (F6). No studio component, upload code, Design Agent or Personalization Modal file was changed. **No file under `src/shared/personalization/` was changed** (owner instruction).

| # | File | Defect | Fix | Regression evidence |
|---|---|---|---|---|
| F1 | `scripts/release-log.mjs` | On hosts where `/bin/sh` is **dash** (Debian/Ubuntu, this container), outer `bash -o pipefail` does not reach a pipeline inside a nested `sh -c`, so the release harness certified a masked failure as **success**. This shipped in `a8d28b3` (#74). The prior "25/25" was measured on macOS, where `/bin/sh` is bash | A nested `sh -c` / `dash -c` pipeline with exit 0 is marked `unverifiableExitStatus` when `/bin/sh` is not bash | Existing test "(d) masked pipeline exit status" fails without the fix on Linux, passes with it. 25/25 |
| F2 | `src/access/__tests__/api-gates-contract.test.ts` | The runtime test **"Business Asset Finder is free for an UNENTITLED user"** returned 500. Its mock predated the lead-finder `classifyRecords` / `excludeNationalChains` calls (`ec4d91e`). The route itself is still free (0 gate calls) | Mock now uses the real, pure ownership-classification functions | 17/17 |
| F3 | `tests/discover-assets-status-auth.vitest.test.ts` | Still asserted 401 for anonymous polling after `790d952` deliberately allowed anonymous callers to poll their **own** job (the free feature) | Replaced with tests of the intended contract: anonymous polls are scoped to `anon-<ip>`, and another user's job returns 404 | 9/9 |
| F4 | `tests/muapi-key-route.test.js` | (a) TypeScript annotation in a `.js` file broke the documented `test:muapi` gate. (b) The Supabase mock applied `update()` before `eq()` and was not awaitable, so "saving a MuAPI key keeps the OpenAI key" failed for a mock reason | Removed the annotation; the mock models `update().eq().select()` | 24/24. **Mutation-checked**: making the route null `openai_key` fails the test |
| F5 | `src/data/__tests__/demoLibraryRegistry.test.ts` | Read every demo video in full (~450 MB) to check a 12-byte header, so it timed out under full-suite load | Reads only the header | 29/29 in 0.13 s |
| F6 | `components/StandaloneShell.js`, `messages/en/common.json` | Parity gaps in the studio shell: no background generation (studio switches remounted everything) and no generation notifications (§2.6) | Ported upstream behaviour | Browser tests 15–19 |
| — | `e2e/release-smoke.spec.ts` | New browser smoke suite (§4.1) | — | 19/19 |

## 6. Desktop app — out of scope, gaps recorded

The Electron/Vite build (`index.html → src/main.js`) has its own copies of the matching Video, Image, Lip Sync and Cinema studios (`src/components/*.js`). The web app never imports them. They lag upstream:

| File | Upstream lines absent | Notable missing upstream features |
|---|---|---|
| `src/components/VideoStudio.js` | 207 | Wan2GP "⚡ Local" toggle, progress/error panel (`8b6c04e`), failed-async handling (`c462969`) |
| `src/components/ImageStudio.js` | 116 | download-format fix (`8ab1afb`), persistent background generations (`32d9dcc`) |
| `src/components/LocalModelManager.js` | 72 | Wan2GP folder / MCP URL settings + dry-run check (`8b6c04e`) |
| `electron/lib/wan2gp{Catalog,Local,Mcp,Output}.js` | missing | Wan2GP headless CLI + MCP providers (`8b6c04e`) |
| `electron/lib/wan2gpProvider.js` | 209 | rewritten provider (`8b6c04e`) |

The owner chose web-only parity. Porting the items above would bring the desktop app to parity without affecting the web app.

## 7. Release findings (from the production-readiness pass)

| Fact | Evidence |
|---|---|
| Production (go.smartvid.app) serves **`8365307`** (PR #76), deploy `6adb33c43af234dd47892e61`, published 2026-10-23 10:21 UTC, **`locked: true`** | Netlify API |
| The preview under review, `6adb5de8cbadae845eed6976`, is built from **`93c3b72`**, a **strict ancestor** of production. Promoting it would **roll back PR #76** (10 files, +759/−72) | `git merge-base --is-ancestor 93c3b72 8365307` |
| The preview title "1449 files, 7 features, 6 fixes" is relative to `208b36b` (the upstream-parity merge). 1,361 of the 1,449 files are a vendored `.claude/skills` tree; **0** are in `packages/studio`. The 7 features / 6 fixes are lead-finder, Netlify tooling, demo library and landing videos — **not upstream features** | `git diff 208b36b..93c3b72` |
| Live preview / production browser testing was **BLOCKED** from this environment: egress policy denies `*.netlify.app` and `go.smartvid.app` | proxy 403 on CONNECT |

## 8. Remaining risks

| # | Risk | Severity |
|---|---|---|
| R1 | Preview `6adb5de8…` is older than production. It must **not** be promoted. A new preview of the release commit is required | High (process) |
| R2 | Smoke tests have not been run against a deployed preview (host blocked here). The spec is ready to run with `RELEASE_SMOKE_BASE_URL` | Medium |
| R3 | Billing: `customer.subscription.deleted` routes to `handleSubscriptionEvent`, which returns early when the payload's price is not in `NEXT_PUBLIC_STRIPE_PRODUCT_MAP`. The customer-id-based `revokeForSubscription` exists but is never dispatched, so a cancelled subscriber whose price is unmapped keeps access. Pre-existing (Oct 16), not changed here | Medium |
| R4 | BYOK policy: `src/lib/assetGenerator.ts` and `src/shared/api/openai.ts` read `process.env.OPENAI_API_KEY` (since `897cde2`, Sep 9). Pre-existing, not changed here | Medium |
| R5 | Anonymous discovery-job scope uses the **first** `x-forwarded-for` hop, which a client can supply. Mitigated by unguessable job ids | Low |
| R6 | Lint fails repo-wide (pre-existing, not a build gate). Some rules-of-hooks hits in `PersonalizationModal.tsx` are latent only: the provider mounts the modal only while it is open | Low |

## 9. Decision

**Upstream parity (web studios): VERIFIED.** No missing upstream features, functions or options in any matching studio. The studio components needed no changes; the two missing shell features (background generation, notifications) are ported and browser-tested.

**Production release: PARTIALLY VERIFIED.** The local build, unit tests and browser workflows pass. However, (a) the existing preview is the wrong (older) commit, and (b) no smoke test has been run against a deployed preview.

**Exact next release action:** after this branch is reviewed and merged, create a fresh preview from the merged `main` commit with the release script (`node scripts/release.mjs --preview`). Then run `e2e/release-smoke.spec.ts` against that preview URL with a Clerk storage state for the studio tests. Production stays locked until a human approves it with `--approve-production`. Rollback target if needed: `6adb33c43af234dd47892e61` (`8365307`).
