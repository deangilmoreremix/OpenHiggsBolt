# Thumbnail Studio — Production-Readiness Audit (MuAPI Image Layer)

**Scope:** the MuAPI image integration delivered for the Thumbnail Studio
(`src/shared/api/muapiImage.ts`, `src/shared/components/ImageGen/MuapiImageStream.tsx`,
and the Thumbnail Studio `generate`/`refine` paths in `src/apps/thumbnail-studio/ThumbnailStudio.tsx`).
**Date:** 2026-07-14
**Method:** static analysis of the current source + the request/response contract used by the
rest of the app (`src/lib/muapi.js`, `src/shared/api/vfx.ts`, `middleware.js`).
**Goal:** stability, security, scalability, maintainability, performance, resource
management, and production-failure modes.

---

## 1. Scorecard

| Dimension | Rating | Notes |
|---|---|---|
| Stability / error handling | **B+** | Strong 401/403/429/timeout handling; gaps on unmount + transient 5xx |
| Security | **C+** | Key handling in this layer is fine; **inherited** localStorage + non-HttpOnly cookie key exposure + direct browser→api.muapi.ai calls drag it down |
| Scalability / performance | **C** | Sequential `n` loop, 6-minute client hold, no parallelism, no backoff |
| Maintainability | **A-** | Fully typed, documented, dead OpenAI code removed, 22 unit tests green |
| Resource management | **C+** | AbortController + timers leak on unmount; no post-unmount state guards |

---

## 2. Findings (severity-rated)

| Sev | Area | Finding | Location |
|---|---|---|---|
| **High** | Resource mgmt / stability | `MuapiImageStream` has **no unmount cleanup**. On unmount mid-generation the `setInterval` (stepTimer), the `setTimeout` hide, the in-flight `fetch`, and the `AbortController` all keep running; `setState` fires after unmount (React warning) and the poll loop keeps hitting the server for up to 6 min after the user left. | `MuapiImageStream.tsx:125-128`, `:114-122` |
| **High** | Performance / UX | `generate()` runs the `n` variations **sequentially** (one submit+poll cycle after another). With `maxPollAttempts=90 × 4000 ms ≈ 6 min` per image, `n=4` can hold the UI for **up to ~24 min**. The Variations selector implies parallelism that does not exist. | `muapiImage.ts:351-363` |
| **Med** | Security / architecture | Calls go **directly from the browser to `https://api.muapi.ai`** (`baseUrl`), exposing the user's `x-api-key` to the client and depending on MuAPI CORS. The app already has a proxy (`middleware.js:44-47` rewrites `/api/v1/*` → `api.muapi.ai`), but the image client bypasses it. | `muapiImage.ts:14`, `:376`, `:434` |
| **Med** | Security (inherited) | The MuAPI key is stored in `localStorage` **and** a **non-HttpOnly** `muapi_key` cookie (set in `StandaloneShell`). XSS in any studio can exfiltrate it. Not introduced here, but this layer consumes it. | `components/StandaloneShell.js` (context) |
| **Med** | Data integrity | `saveToSupabase` is fire-and-forget inside `handleStreamComplete` and swallows errors (`try/catch → console.warn`). A failed DB write silently drops the "Share to community" state with no retry/queue. | `ThumbnailStudio.tsx` `saveToSupabase`/`handleStreamComplete` |
| **Med** | Stability | Transient **5xx during polling only retries after the full 6-min window**; there is no backoff/jitter, so a brief MuAPI blip wastes all 90 attempts before failing. | `muapiImage.ts:447-451` |
| **Low** | Stability | `await res.json()` in `poll()` (line 456) is **not guarded**; a 200 with non-JSON body throws an opaque "Unexpected token" instead of a friendly error. | `muapiImage.ts:456` |
| **Low** | Maintainability | The `request.mode === 'refine'` branch and `request.previousImageUrl` in `MuapiImageStream` are **effectively dead** — `handleGenerate` only ever sets `mode` to `generate`/`edit`, and refine is handled separately in `handleRefine`. | `MuapiImageStream.tsx:67,69` |
| **Low** | Correctness | `cleanKey` strips every character outside U+0000–U+00FF (`/[^\u0000-\u00FF]/g`). Valid for ASCII keys, but would **corrupt** a key containing any non-Latin-1 character before it ever reaches the API. | `muapiImage.ts:174` |
| **Low** | UX / honesty | For the default `flux-dev` model `quality` is a **no-op** (intentionally, to avoid 422). The Quality selector still shows a "speed" tag, implying it changes output. Acceptable but should be communicated. | `muapiImage.ts:64-67`, `MuapiImageStream.tsx:148-153` |
| **Low** | Durability | Community gallery stores **remote MuAPI result URLs**. If those URLs are ephemeral, public/shared thumbnails will 404 over time. | `ThumbnailStudio.tsx` `loadCommunityGallery`/`saveToSupabase` |
| **Info** | Robustness | Download uses `fetch(url).then(blob)` then falls back to `window.open`. Works only if MuAPI sends CORS headers on result URLs. | `ThumbnailStudio.tsx` `handleDownload` |

---

## 3. Detailed remediation (actionable)

### 3.1 [High] Clean up generation on unmount — abort + clear timers + guard state
In `MuapiImageStream.tsx`, add a cleanup effect that aborts the client and clears both
timers, and bail out of post-unmount `setState`.

```tsx
// inside the component, keep a ref to the client
const clientRef = useRef<MuAPIImageClient | null>(null)
const [mounted, setMounted] = useState(true)
useEffect(() => () => setMounted(false), [])

useEffect(() => {
  if (!request) return
  run()
  return () => {
    clientRef.current?.cancel()   // stops in-flight fetch + poll
    clearInterval(stepTimerRef.current)
  }
}, [request])

// in run(): store client + timers in refs; guard every setState:
if (!mounted) return
```
Also wrap the `setTimeout` hide in the same `mounted` guard.

### 3.2 [High] Parallelize `n` variations
`generate()` should fire the `n` calls concurrently and cap total wall time.

```ts
const tasks = Array.from({ length: count }, () =>
  this.runOnce({ prompt, model, aspectRatio, imageUrl, strength, qualityParams, maskUrl }))
const results = (await Promise.all(tasks)).map(url => ({ url }))
```
Pair with a shared `AbortController` (abort cancels all) and a **per-image** timeout so one stalled job can't pin the whole batch. Surface partial success if some resolve and some reject.

### 3.3 [Med] Route image calls through the existing proxy
Instead of `baseUrl = 'https://api.muapi.ai'`, default to the same-origin proxy the
middleware already provides:

```ts
const MUAPI_BASE = process.env.NEXT_PUBLIC_MUAPI_PROXY_BASE || '/api/v1' // relative → proxied
```
This keeps the `x-api-key` in a server-mediated request, removes the CORS dependency,
and is consistent with `middleware.js:44-47`. (If a relative base is used, the
`upload_file` and `predictions` paths must also resolve under `/api/v1`.)

### 3.4 [Med] Stop swallowing Supabase write failures
Make `saveToSupabase` return a promise, `await` it in `handleStreamComplete`, and on
failure show a non-blocking toast ("Saved locally; community share failed — retry?") with a
retry. At minimum, log a structured error rather than `console.warn`.

### 3.5 [Med] Add backoff on transient 5xx
```ts
const backoff = Math.min(this.pollIntervalMs * 2 ** Math.min(attempt, 4), 30000)
await new Promise(r => setTimeout(r, backoff))
```
Skip immediately to failure only on 4xx (auth/validation), never on 5xx.

### 3.6 [Low] Guard `res.json()` and friendly-message it
```ts
let data: MuAPIImageStatusResponse
try { data = await res.json() } catch { throw new Error('Invalid response from MuAPI (expected JSON)') }
```

### 3.7 [Low] Remove dead `refine`/`previousImageUrl` branch
Either wire `handleRefine` to set `request.previousImageUrl` + `mode:'refine'` and use
`MuapiImageStream`, or delete the dead branch. Don't ship code that looks reachable but isn't.

### 3.8 [Low] Loosen `cleanKey` only if keys can be Unicode
Current behavior is correct for ASCII keys (the norm). Leave as-is unless MuAPI
documents non-ASCII keys; if so, switch to a `trim()` + control-char strip only.

---

## 4. Architecture notes (live-production failure modes)

1. **Direct browser→api.muapi.ai is the app-wide pattern** (the legacy `muapi.js`
   `MuapiClient` also targets `https://api.muapi.ai` directly), so the image client is
   *consistent*, not a regression. But at true production scale the proxy path (3.3) is
   the more secure, CORS-independent choice and should become the default for all studios.
2. **Key exposure is systemic.** The non-HttpOnly cookie + `localStorage` pattern means any
   XSS (even in an unrelated studio) can read the user's paid MuAPI key. The durable fix
   is server-side key storage (already half-done: `muapi-key` is persisted to the user's
   account) + a server proxy that attaches the key, eliminating client-side key handling.
3. **No job-id persistence.** A refresh or crash mid-poll loses the `request_id`; the
   user must regenerate. Persisting the `request_id` (like Video Studio does via
   `onRequestId`) would allow resume.
4. **Long client hold (6 min).** Acceptable for a single thumbnail, but combined with
   sequential `n` (3.2) it becomes a multi-minute block. Parallelism + shorter
   client timeout (fail fast, let the server keep working) is the right shape.

---

## 5. What is already solid (keep)

- Typed end-to-end; **zero `any`**, passes `tsc --noEmit` + `next lint` + `next build`.
- 22 **green, mocked unit tests** (payload/header/alias/result-shape/error/loop).
- Model-gated quality + mask handling **deliberately avoids 422s** (verified against the catalog).
- Clear, user-facing errors for invalid key / rate limit / timeout / cancel.
- `AbortController` + `x-api-key` auth + 10 MB / type validation on uploads.
- No key is ever logged; `data:`/`http(s)` URLs both accepted by the result parser.

---

## 6. Prioritized roadmap

| Priority | Item | Effort | Status |
|---|---|---|---|
| P0 | 3.1 unmount cleanup (abort + timer clear + state guard) | S | **Done** |
| P0 | 3.2 parallelize `n` variations + per-image timeout | M | **Done** (concurrent `Promise.all` + per-call AbortController; partial-success handled) |
| P1 | 3.3 route through `/api/v1` proxy | S | **Done** (base resolution fixed to `??` so `MUAPI_BASE_URL=''` → relative `/api/v1/*` proxy; previously unreachable) |
| P1 | 3.4 surface Supabase write failures | S | **Done** (`saveToSupabase` re-throws; `handleStreamComplete` uses `allSettled` + dismissible banner) |
| P1 | 3.5 backoff on 5xx | S | **Done** (exponential backoff capped 30s; fail-fast on 4xx) |
| P2 | 3.6 guard `res.json()` | XS | **Done** (friendly "Invalid response from MuAPI" error) |
| P2 | 3.7 remove dead refine branch | XS | **Done** (dead `mode==='refine'`/`previousImageUrl` branch removed) |
| P2 | architecture: server-side key + proxy for all studios | L | Open (cross-studio; out of scope for this layer) |

### Verification after remediation
- `npx tsc --noEmit -p tsconfig.json` → exit 0
- `npx vitest run src/shared/api/__tests__/muapiImage.test.ts` → **30 passed** (22 original + 8 new: parallel `n`, partial/all-fail, 5xx backoff, res.json guard, concurrent cancel, proxy base)
- `npx next lint` on changed files → 0 errors (only 2 pre-existing `jsx-a11y/alt-text` warnings on lucide `<Image>` icons)
- `npx next build` → exit 0

**Verdict:** The integration is now **hardened for live production** — both P0 failure modes
(unmount leak, sequential `n`) are resolved, 5xx resilience and Supabase-failure surfacing are
in place, and proxy support is real (not just documented). The remaining open item is the
app-wide server-side key + proxy architecture (item 9), which is a cross-studio effort and
outside this layer.
