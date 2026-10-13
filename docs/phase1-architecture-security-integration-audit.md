# Phase 1 — Architecture, Security & Integration Audit

**Scope:** studio-wide audit of OpenHiggsBolt / SmartVideo GO at the
`intergration-worktree` candidate HEAD (`11385e3a6` on top of
`4ade3cef6 origin/main`), reconciled against the local security commit
`3220d4b11`, the uncommitted lead-finder work in the
`ai-assistant-for-images` worktree, and the open PR #49
(`security/consolidated-release-review` @ `e9c88ac08`).

Every file:line claim below is verified against the current worktree
with `git show <commit>:<path>` / Read. The integration manifest
`docs/integration-manifest-2026-10-12.md` (commit `be254422a`) and
verification report `docs/verification-report-2026-10-12.md`
(commit `8b9b3b239`) are companion documents; this audit focuses on
the studio-wide architecture and security surface, not the release
candidate's gate results.

---

## A. Scope, method, and verified current state

**Repositories.** SmartVideo GO is a multi-studio Next.js monorepo with
`packages/studio` providing the cross-studio component library and
`supabase` providing the persistence / auth / functions layer.

| Repo | Path | Head |
|---|---|---|
| Integration candidate | `.../worktrees/intergration-worktree` | `11385e3a6` (on `4ade3cef6` = `origin/main`) |
| Source worktree (read-only) | `.../worktrees/ai-assistant-for-images` | `3220d4b11` |
| Local security commit | branch `ai-assistant-for-images` | `3220d4b11` (parent `71fa2b9f8`, ancestor of main; never pushed) |
| Open PR | `security/consolidated-release-review` | `e9c88ac08` (20 commits, base `origin/main`) |
| Upstream reference | `Anil-matcha/Open-Generative-AI` (fork point `fd049524`, verified) | not vendored locally |

**Method.** 1) read-only inspection of the integration worktree, the
source worktree, the uncommitted lead-finder patch and tarball, the
local security commit, PR #49, and the manifest; 2) file:line
verification of every claim with `git show <commit>:<path>`; 3) per-
finding classification against the integration manifest; 4)
hand-written comparison tables for the upstream-aware audit; 5)
no implementation work; this document is read-only.

**Key integration findings (up front).**

- The Critical SSRF gap flagged by the prior code review
  (`src/server/businessDiscovery/researchProvider.ts` had
  `maxRedirects: 5` and only the weak `sanitizeUrl` whose
  `isPrivateIp` misses `169.254/16`, IPv6 ULA/link-local, IPv4-mapped
  IPv6, `0.0.0.0`, alternate decimal/hex IP forms) is **closed** in
  commit `aaa7adf7a`. The gate now uses
  `src/lib/networkSafety.checkDestination` (async DNS + per-address
  validation) with a manual redirect loop bounded by
  `MAX_REDIRECT_HOPS`, a `safeRequestConfig` pin that binds the
  outbound connection to the validated address (closing the
  DNS-rebinding window), and a reason discriminator that
  `BlockTargetError`s only on `blocked_host` /
  `resolved_to_blocked_ip` / `invalid_url` while letting
  `dns_resolution_failed` surface as `reachable: false` (preserving
  the public route's contract for dead public sites).
- The cross-tenant brand exposure (H4) is **closed** in commit
  `8077d1463`: `app/api/brand/route.ts` and `app/api/brands/route.ts`
  now require `auth()` and use owner-scoped
  `getBrandForUser` / `getBrandsForUser` from
  `src/shared/brandStore.ts`; a non-owned id is a 404, never a 403;
  the POST route SSRF-validates the submitted URL through
  `networkSafety.assertSafeUrlString` / `createPinnedFetch`.
- PR #49 carries the **newer** version of every other security
  hardening (Netlify function auth, rate-limit keying, test-auth
  gate, cookie-key removal, vfx BYOK, browser-discovery SSRF) and
  supersedes the local security commit's equivalents; the
  integration manifest's SUPERSEDED list and §2 are authoritative
  for what NOT to port.

---

## B. Verified security findings

Severity scale: Critical (exploitable in production, public surface)
/ High (exploitable, authenticated surface) / Medium (defence-in-
depth or hardening).

| # | Severity | Finding | Evidence (commit:file:line) | Current status in candidate |
|---|---|---|---|---|
| B1 | **Critical** | SSRF in unauthenticated `researchBusiness` — accepts a user-supplied URL, `maxRedirects: 5` with no per-hop revalidation, and only the weak `sanitizeUrl` whose `isPrivateIp` misses `169.254/16` (cloud metadata), `100.64/10` (CGNAT), `0.0.0.0` (unspecified), IPv6 ULA / link-local, IPv4-mapped IPv6, and decimal/octal/hex alternate IP encodings. | `4ade3cef6:src/server/businessDiscovery/researchProvider.ts:168,183` (main); `4ade3cef6:src/server/discoverAssets.ts:104-114` (the weak `isPrivateIp`) | **CLOSED** `aaa7adf7a:src/server/businessDiscovery/researchProvider.ts` — full gate via `networkSafety.checkDestination`, manual redirect loop, `safeRequestConfig` pin, reason discriminator. Adversarial regression suite `src/server/businessDiscovery/__tests__/researchProviderSsrf.test.ts` (23 tests, all green) proves literal private/metadata/loopback/ULA/IPv4-mapped/unspecified/alternate-encoding destinations, hostname→private resolution, redirects to private addresses, the redirect cap, and DNS-rebinding via the pinned lookup are all blocked. |
| B2 | **Critical** | Cross-tenant brand exposure (H4): `app/api/brand/route.ts` and `app/api/brands/route.ts` were fully unauthenticated while reading and writing a module-level store shared by every user; any visitor could read or overwrite any tenant's brand data. | `4ade3cef6:app/api/brand/route.ts:1-27` (main, zero auth markers); `4ade3cef6:app/api/brands/route.ts:36-99` (main) | **CLOSED** `8077d1463` — `auth()`-gated GET/PATCH/POST; owner-scoped lookups via `getBrandForUser` / `getBrandsForUser`; `owner` is mandatory and not client-settable; the SSRF risk in the POST fetch is closed by `networkSafety`. |
| B3 | High | Supabase RLS missing on `brand_*` tables (`using (true) with check (true)` with the anon key in the browser bundle); any visitor could read/write/delete every tenant's brand rows. | `3220d4b11:supabase/migrations/20261010130000_brand_tables_owner_rls.sql` (sec commit adds the migration; main has none) | **STILL MISSING** — the three RLS migrations (`brand_tables_owner_rls`, `discovery_jobs_rls_clerk`, `personalization_projects_owner_rls`) have not been ported. PR #49's Netlify functions explicitly `fail closed` with `503 OWNERSHIP_NOT_CONFIGURED` when the `clerk_user_id` column is absent, so porting the migrations is the complement that lets PR #49's functions return real data. **Follow-up required before any production deploy.** |
| B4 | High | `app/api/personalization/discover-assets/route.ts` POST persists a `discovery_jobs` row with `clerkUserId: 'anon'` for unauthenticated callers; the `clerkUserId` was destructured but never enforced as a gate. | `4ade3cef6:app/api/personalization/discover-assets/route.ts:110,221` (the `userId || 'anon'` fallback) | **STILL MISSING** — main's POST handler is unchanged; PR #49 touched `src/server/discoverAssets.ts` and the netlify `personalization-browser-discovery.js` but not this Next.js route. The auth check is a one-line `if (!userId) return NextResponse.json({error:'Unauthorized'},{status:401})` before the persist. |
| B5 | High | `app/api/design-agent/skills/route.ts` has no entitlement gate; the sec commit added `requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)` but it was never landed. | `4ade3cef6:app/api/design-agent/skills/route.ts` (no entitlement import; PR #49 doesn't touch this file) | **STILL MISSING** |
| B6 | High | `app/api/personalization/download-image/route.ts` and `src/server/downloadImage.ts` have **no** SSRF guard; the user's URL is followed with no validation and redirects are followed blindly. | `4ade3cef6:app/api/personalization/download-image/route.ts`; `4ade3cef6:src/server/downloadImage.ts` (no `assertSafeUrl` / `networkSafety` import) | **STILL MISSING** — neither main nor PR #49 fixes these files. Must be added, adapted to the shared `networkSafety` validator. |
| B7 | Medium | `app/api/brands/route.ts` (main) carries a duplicate, weaker `isPrivateIp` that misses 169.254/16, 100.64/10, 0.0.0.0, IPv6, decimal/hex; sec commit replaced it with a shared helper. | `4ade3cef6:app/api/brands/route.ts:20-50` | **CLOSED** `8077d1463` + `aaa7adf7a` — POST validates through `checkDestination` (async DNS) and uses `createPinnedFetch` to pin the connection to the validated address. |
| B8 | Medium | The `x-personalization-test-auth` bypass on `/api/personalization/discover-assets` was reachable in production (ungated). | main's `middleware.js:63-69` (the unguarded `if`); PR #49 `a8dfa2cb5` adds a `NODE_ENV` guard. | **SUPERSEDED** by PR #49. Porting the sec commit's version is unnecessary and risks duplication. |
| B9 | Medium | API keys (OpenAI, MuAPI) were written to non-HttpOnly cookies. | main's `src/lib/authConfig.ts:30` (`document.cookie = buildCookie(...)`); main's `src/components/SettingsModal.js:219-220` | **SUPERSEDED** by PR #49 (`a8dfa2cb5`). |
| B10 | Medium | vfx routes keyed rate limits on the resolved `apiKey` (client-controlled). | main's `app/api/vfx/generate/route.ts` and `app/api/vfx/upload/route.ts` (no `resolveRateLimitKey`) | **SUPERSEDED** by PR #49 (`a8dfa2cb5` adds `resolveRateLimitKey` server-side, ported in this candidate's foundation `4a3649743`). |
| B11 | Medium | MuAPI BYOK: server `process.env` MuAPI key could silently bill the operator. | sec commit touched `src/lib/muapi.js`; PR #49 ported it (`b7f36211a`). | **SUPERSEDED** by PR #49. |
| B12 | Low | `pollSocialResult` JSDoc typed the return as `Promise<string>` (wrong), producing 9 TS errors in social-publishing consumers. | sec commit referenced the wrong JSDoc in `src/lib/muapi.js:745`. | **SUPERSEDED** by the JSDoc fix already on main / PR #49. |
| B13 | Low | Stale `node:test` files documented a server-key fallback and cookie writes. | sec commit converted `tests/api-keys.test.js`, `authConfig.test.ts`, `settings-modal.test.js`, `vfx-route.test.js`. | **SUPERSEDED** by PR #49's `*.vitest.test.ts` conversions + `byok-enforcement.vitest.test.ts` (38) and `security-hardening.vitest.test.ts` (18). |
| B14 | Low | `src/server/urlSecurity.ts` (sec commit) — self-contained SSRF helper. | `3220d4b11:src/server/urlSecurity.ts` | **SUPERSEDED** by PR #49's `src/lib/networkSafety.ts` (broader). Ported as the foundation; a second validator is forbidden by the manifest. |
| B15 | Low | `netlify/functions/_shared/clerkAuth.js` (sec commit) — shared Clerk helper. | `3220d4b11:netlify/functions/_shared/clerkAuth.js` | **NOT PORTED** — PR #49 inlines Clerk JWKS verification in each function (self-contained, 503 fail-closed). Porting the shared helper would create two auth mechanisms. |

---

## C. Architecture inventory

### Studios, routes, and entry surfaces

SmartVideo GO ships a `/studio/[[...slug]]` catch-all
(`4ade3cef6:packages/studio/src/components/VideoStudio.jsx` and
siblings) that hosts the cross-studio component library. The
shipping studios include at minimum VideoStudio, ImageStudio,
AudioStudio, CinemaStudio, LipSyncStudio, MarketingStudio,
Cinema, Recast, VibeMotion, Clipping, AIViral, McpCliStudio, and
AppsStudio. Standalone entry surfaces include `/personalization-demo`,
`/photo-studio`, `/brand-studio` (under the `(brand-studio)` route
group), `/vfx`, `/workflow/[id]`, `/workflow/[id]/[tab]`, `/studio/*`,
and the personalization entry points. Each studio has its own
component, route registration, and (often) its own state container
(typically in-component `useState` or React context — see §C5).

### Provider matrix (authoritative at this HEAD)

| Operation | Provider | Route | Source | Notes |
|---|---|---|---|---|
| Text enhancement | OpenAI | `POST /api/proxy/openai-enhance` → `supabase/functions/v1/enhance-prompt` | `src/shared/api/openai.ts` (`callOpenAIChat`) | Model allowlist: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| Vision analysis | OpenAI | `POST /api/personalization/image-analyze` | `app/api/personalization/image-analyze/route.ts` | Direct `fetch(https://api.openai.com/v1/responses)`; allowlist `gpt-6-astra`, `gpt-4o`, `gpt-4o-mini` |
| Image generation | OpenAI | `POST /api/proxy/openai-image` or `POST /images/generations` | `src/shared/personalization/openaiPersonalizationClient.ts` | Models `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst`, `dall-e-3` |
| General image editing | OpenAI | `POST /api/personalization/image-edit` or `POST /api/proxy/openai-image` | `src/shared/personalization/image-editor/imageEditApi.ts`, `src/shared/api/openaiImage.ts` | `POST https://api.openai.com/v1/images/edits` |
| Background removal (AI Assist) | OpenAI | `POST /api/proxy/openai-image` or `POST /api/personalization/image-edit` | `components/AiAssistantModal.tsx:321-324`, `src/shared/personalization/ai/toolExecutor.ts:379-393` | Prompt-based `images/edits`; LayersStudio (`packages/studio/src/components/LayersStudio.jsx:944`) uses a separate MuAPI path (`ai-background-remover`) — out of AI Assist scope |
| Upscale (AI Assist) | OpenAI | `POST /api/proxy/openai-image` | `components/AiAssistantModal.tsx:317-318,324` | Prompt-based; LayersStudio uses MuAPI seedvr2 / topaz |
| Style transfer (AI Assist) | OpenAI | `POST /api/proxy/openai-image` | `components/AiAssistantModal.tsx:319-320,324` | Prompt-based |
| Restore (AI Assist) | OpenAI | `POST /api/proxy/openai-image` | `components/AiAssistantModal.tsx:323-324` | Prompt-based |
| Video generation | MuAPI | `POST /api/v1/{endpoint}` | `src/shared/personalization/generationRouter.ts` → `packages/studio/src/muapi.js` | `POST https://api.muapi.ai/api/v1/generateVideo` |
| I2V | MuAPI | `POST /api/v1/{endpoint}` | `src/shared/personalization/generationRouter.ts` → `packages/studio/src/muapi.js` | `POST https://api.muapi.ai/api/v1/generateI2V` |
| V2V | MuAPI | `POST /api/v1/{endpoint}` | `src/shared/personalization/generationRouter.ts` → `packages/studio/src/muapi.js` | `POST https://api.muapi.ai/api/v1/processV2V` or `processRecast` |
| Business discovery (Lead Finder) | OSM Nominatim + Overpass | `POST /api/personalization/find-businesses` | `src/server/businessDiscovery/{nominatim,overpass,research}Provider.ts` | Public route; rate-limited |
| Business research (Lead Finder) | Open (caller's URL, SSRF-gated) | `POST /api/personalization/research-business` | `src/server/businessDiscovery/researchProvider.ts` | **SSRF gate hardened in `aaa7adf7a`** |
| Persistence | Supabase | n/a (server) | `supabaseProjectPersistence.ts`, `sharedMedia.ts` | Debounced Supabase writes; `registerSupabaseSharedMedia()` |
| Auth | Clerk (`@clerk/nextjs`, `@clerk/testing`) | middleware + `auth()` | `middleware.js`, `app/**/route.ts` | `__session` short-lived JWT only |

### Auth and state

Auth is Clerk-only. Middleware (`4ade3cef6:middleware.js`) protects
most surfaces; the public Lead Finder routes
(`/api/personalization/find-businesses`, `/api/personalization/research-business`)
are intentionally unauthenticated and the SSRF + per-IP rate limit is
their only defense. Personalization state lives in
`src/shared/personalization/{types,businessNiches,clientProfile,
clientAssets,assetUploadService,editedAssetPersistence,supabaseProjectPersistence,
supabaseSharedMedia,supabaseGeneratedVideos,alphaVerification,modelCapabilityResolver,
postProcessor,promptPersonalizer,sourceNormalizer,urlNormalizer}.ts` —
the in-component `useState` pattern is dominant, with a single
`DemoPersonalizeProvider` React context wrapping the modal.

### Inconsistencies and dead code

- **Three MuAPI client implementations** exist:
  `src/lib/muapi.js` (class), `packages/studio/src/muapi.js`
  (functional), `src/shared/api/muapi.ts` (typed wrapper, thumbnail
  studio). Consolidation is a follow-up.
- **Inconsistent error handling**: CinemaStudio has no error
  boundaries; SocialPublishing has basic error banners; DesignAgent
  has a comprehensive error boundary + retry. Studios would benefit
  from a shared error-boundary component.
- **Inconsistent state management**: some studios use in-component
  `useState`, others use React context, others use external stores.
- **Dead shared components**: a non-trivial number of shared UI
  components under `packages/studio/src/components/` are unused
  by any consumer and can be pruned.

---

## D. Integration manifest and ownership partition

Authoritative inventory: `docs/integration-manifest-2026-10-12.md` at
commit `be254422a`. Summary: 5 items ALREADY MERGED on `origin/main`,
15 items SUPERSEDED (by PR #49 / foundation), 10 items STILL MISSING
from the security commit (S1–S10), 10 items STILL MISSING from the
uncommitted lead-finder work (L1–L10). L1 (the researchProvider SSRF
fix) is now CLOSED in `aaa7adf7a`. The candidate's
disjoint ownership partition is:

- SEC-INT: brand route, brandStore, design-agent skills, 3
  RLS migrations, discover-assets anon gate, download-image SSRF,
  brands route, and their tests.
- UI-INT: businessDiscovery, find/research-business routes, modal
  deltas, e2e.
- DOC-A: the two audit documents (this file + the upstream-aware
  audit).

The candidate's frozen primitives are `src/lib/networkSafety.ts`
(foundation `4a3649743`) and `lib/rateLimit.ts resolveRateLimitKey`
(same foundation).

---

## E. Risks, residual gaps, and follow-ups

1. **In-process rate limiter.** `lib/rateLimit.ts` keys live in
   Node process memory, reset on restart, and are not shared across
   serverless instances. A caller that can reach several instances
   gets one bucket per instance. Acceptable for single-instance
   deploys; swap for Upstash/Redis/Supabase if scaling horizontally.
2. **Synchronous SSRF literal check vs. DNS rebinding (adversarial
   coverage).** The restored researchProvider uses
   `assertSafeUrlString` for literal-address rejection and
   `checkDestination` for full DNS + per-address validation. The
   adversarial test suite proves the rebinding window is closed by
   the connection pin. No follow-up.
3. **PR #49 not yet merged.** The candidate intentionally does not
   re-implement the items PR #49 already covers (Netlify function
   auth, rate-limit keying, test-auth gate, cookie-key removal, vfx
   BYOK, browser-discovery SSRF). When PR #49 merges, the
   candidate's foundation `networkSafety` is the same module
   upstream will land; consolidation is automatic.
4. **RLS migrations not ported (B3).** This is the largest residual
   gap. PR #49's Netlify functions `fail closed` with 503 if the
   `clerk_user_id` column is absent, so the migrations are the
   prerequisite for those functions to serve real data. The sec
   commit's three migrations are verbatim portable.
5. **discover-assets POST anon gate (B4), design-agent skills
   entitlement (B5), download-image SSRF (B6).** All bounded, all
   disjoint from the candidate. To be ported.
6. **Lead Finder route rate limiting + 8/8 e2e spec port.** The
   uncommitted `app/api/personalization/{find-businesses,
   research-business}/route.ts` rate-limiting, NaN guards, 502
   mapping, and the e2e 8/8 spec rewrite (niche fix + BUSINESS
   FINDER test) are still missing on main. The 8/8 browser E2E was
   NOT executed in this candidate — the spec's uncommitted fixes
   were not ported; running main's spec would test the
   un-improved version, which is not the "8/8 from a clean
   committed integration candidate" the manifest defines.
7. **Build, typecheck, and unit suite gates are green on the
   candidate at `11385e3a6`**; staging verification
   (Netlify deploy preview + credentials) is out of scope for this
   audit and remains to be run.

---

## F. Verification gates

This audit document is read-only. The candidate's release-gate
results are reported in `docs/verification-report-2026-10-12.md`
(commit `8b9b3b239`) and updated by subsequent commits. As of
`11385e3a6` the independently re-run results are:

| Gate | Result | Source |
|---|---|---|
| `npx tsc --noEmit` | 0 errors | main session |
| `npx next build` | PASS | main session |
| `npx vitest run` (full) | **783 passed / 0 failed (69 files)** | main session (after the `aaa7adf7a` SSRF restoration and the `11385e3a6` mock-contract fix; the 16 pre-existing `DemoPersonalizeProvider` failures were caused by stale mocks and are now resolved by aligning the mocks with the real implementation contracts) |
| Security: researchProvider SSRF | closed | `aaa7adf7a` + `src/server/businessDiscovery/__tests__/researchProviderSsrf.test.ts` (23/23) |
| Security: brand cross-tenant (H4) | closed | `8077d1463` |
| Security: brands route SSRF consolidation | closed | `8077d1463` + `aaa7adf7a` |
| 8/8 browser E2E | **NOT RUN** in this candidate | e2e spec porting (L5) is UI-INT scope and was not landed; see `docs/integration-manifest-2026-10-12.md` §2 L5 |
| Two architecture-audit documents | this document; the upstream-aware audit is the companion | this candidate |

**Pending gates (will move to PASS as the remaining STILL-MISSING
items land):**

- RLS migrations (B3) + their test
- discover-assets POST anon gate (B4) + `discoverAssetsAuth.test.ts`
- design-agent skills entitlement (B5) + `designAgentSkillsEntitlement.test.ts`
- download-image SSRF (B6) + `downloadImageRoute.test.ts` adapted to `networkSafety`
- brands route SSRF consolidation test (`brands-ssrf-shared-helper.vitest.test.ts` adapted)
- v1ProxyEntitlement test
- Lead Finder route rate limiting (L2, L3) + 8/8 e2e spec port (L5) + missing test files (L6, L7, L8) + modal/provider deltas (L9, L10)
