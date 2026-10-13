# Integration Manifest — 2026-10-12

Authoritative reconciliation of the three paused agents' overlapping work in the
`ai-assistant-for-images` worktree, against current on-disk Git state. The CURRENT
on-disk state is authoritative; historical HEAD SHAs from the paused agents' reports
are treated as claims to verify, not fact.

## 1. Authoritative state (verified 2026-10-12)

| Fact | Value |
|---|---|
| Integration worktree | `/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/.kilo/worktrees/intergration-worktree` |
| Integration branch | `intergration-worktree` @ `4ade3cef6` **= `origin/main`** (clean at start) |
| Foundation commit (this integration) | `4a3649743` — adds `src/lib/networkSafety.ts` + `resolveRateLimitKey` |
| Source worktree (read-only) | `.../worktrees/ai-assistant-for-images` @ branch `ai-assistant-for-images` = `3220d4b11` |
| Local security commit | `3220d4b11` "fix(security): close cross-tenant brand exposure, SSRF, and auth gaps" — parent `71fa2b9f8` (ancestor of main) — **LOCAL-ONLY, never pushed** (`origin/ai-assistant-for-images` = `71fa2b9f8`) |
| Commits on main since fork point | 58 (`71fa2b9f8..4ade3cef6`) |
| PR #49 | `security/consolidated-release-review` @ `e9c88ac08`, **OPEN**, base `origin/main` (`4ade3cef6`), 20 commits, 56 files |
| Uncommitted state preserved at | `/var/folders/2q/980_t4n950j58k8g6m2z4ps80000gn/T/kilo/leadfinder-backup/` (`tracked-modified.patch` 1654 lines, `untracked-files.tar.gz` 55 files, `count.txt` = 88 entries incl. `storage/`) |
| Original worktree | NOT deleted, NOT modified (read-only source of truth for uncommitted work) |

## 2. Classification

### ALREADY MERGED — present on `origin/main` (`4ade3cef6`); do nothing

| Item | Evidence |
|---|---|
| `/api/v1/*` GET entitlement gating | `app/api/v1/[...slug]/route.ts` lines 28–37, 70–76 gate every GET with `requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)`, `isDevBypass` preserved |
| Personalization source modules (`assetUploadService.ts`, `editedAssetPersistence.ts`, `supabaseProjectPersistence.ts`, `supabaseGeneratedVideos.ts`, `alphaVerification.ts`, `projectRestore.ts`, `businessNiches.ts` + its test) | Committed on main via `378e5d7b1` / `71fa2b9f8`; the "untracked copies" in the source worktree are **stale duplicates — do not port** |
| Drag-and-drop, Revert, asset summaries, image editing in the Personalization modal | Main's `PersonalizationModal.tsx` carries 12 `dragOverSection` references, `onRevert` / "Revert to original" (lines 379–536), `ImageEditorModal` integration, and the lead-finder UI fixes (`BUSINESS_NICHES`, `businessSearchMode`, `clearBusinessSearch`, "Choose Different Business", "Enter Business Manually") |
| Repo-wide `testTimeout: 30000` | `vitest.config.ts` (main) |

### SUPERSEDED — PR #49 (`e9c88ac08`) carries newer protections; do NOT port from `3220d4b11`

| Local security-commit item | Superseded by (PR #49) |
|---|---|
| Netlify function auth + `clerk_user_id` ownership on `netlify/functions/{assets,brand,brands,campaigns,photo-studio}.js` | `95047de68` — inlined Clerk JWKS verification, 503 `OWNERSHIP_NOT_CONFIGURED` fail-closed, `tests/netlify-asset-auth.vitest.test.ts` (51) |
| `netlify/functions/_shared/clerkAuth.js` | **Do not port** — PR #49 deliberately inlines verification so each bundle is self-contained; porting would create two auth mechanisms |
| `lib/rateLimit.ts` `resolveRateLimitKey` | Ported into the foundation from PR #49's version (byte-identical semantics to the local commit's) |
| `middleware.js` test-auth production gate | `a8dfa2cb5` |
| Cookie key storage removal (`src/lib/authConfig.ts`, `src/components/SettingsModal.js`) | `a8dfa2cb5` |
| MuAPI/vfx BYOK hardening (`src/lib/muapi.js`, `app/api/vfx/*`, `src/lib/keys.js`, `src/shared/api/vfx.ts`) | `b7f36211a` + `0a1693c52` |
| SSRF centralization for `src/server/discoverAssets.ts`, `src/lib/uploadProxyTarget.js`, `src/server/browserDiscovery.ts` | `d10a751b4` / `473289618` / `e9c88ac08` |
| `src/server/urlSecurity.ts` + `src/server/__tests__/urlSecurity.test.ts` | PR #49's `src/lib/networkSafety.ts` (broader: IPv6 ULA/link-local, IPv4-mapped IPv6, CGNAT, `0.0.0.0`, decimal/octal/hex forms, DNS pinning) — ported as the single validator in the foundation; a second validator must NOT be added |
| `src/server/__tests__/brandStudioNetlifyAuth.test.ts` | PR #49 `tests/netlify-asset-auth.vitest.test.ts` (51) |
| `tests/{rate-limit-keying,vfx-rate-limit-keying,middleware-personalization-test-auth,settings-modal-no-cookie}.vitest.test.ts` | PR #49 `tests/security-hardening.vitest.test.ts` (18, mutation-verified) |
| `tests/api-keys-integration.test.js` assertion rewrite | PR #49 `tests/api-keys.vitest.test.ts` + `tests/byok-enforcement.vitest.test.ts` (38). The local rewrite asserts the hardened (no-env-fallback) behavior, which does not exist on main yet — applying it now would fail |

### STILL MISSING — on neither `origin/main` nor PR #49 → integrate

From local security commit `3220d4b11`:

| # | Item | Main status | Fix |
|---|---|---|---|
| S1 | `app/api/brand/route.ts` — Clerk auth + owner-scoped handlers (H4) | zero auth markers; PR #49 file untouched | Port, reconciled against main |
| S2 | `src/shared/brandStore.ts` — owner-scoped in-memory store (dependency of S1) | unscoped | Port |
| S3 | `app/api/design-agent/skills/route.ts` — `SMARTVIDEO_GO` entitlement gate | absent | Port |
| S4 | `supabase/migrations/20261010130000_brand_tables_owner_rls.sql` | absent | Port |
| S5 | `supabase/migrations/20261010160000_fix_discovery_jobs_rls_clerk.sql` | absent | Port |
| S6 | `supabase/migrations/20261010160100_personalization_projects_owner_rls.sql` | absent | Port |
| S7 | `app/api/personalization/discover-assets/route.ts` — POST auth so anonymous callers cannot persist `clerkUserId: 'anon'` (main line 221) | gap present | Port + `src/server/__tests__/discoverAssetsAuth.test.ts` |
| S8 | `app/api/personalization/download-image/route.ts` + `src/server/downloadImage.ts` — SSRF pre-flight guard + per-hop redirect revalidation | **no guard at all** | Port, **adapted to `src/lib/networkSafety.ts`** (not `urlSecurity.ts`) + `src/server/__tests__/downloadImageRoute.test.ts` |
| S9 | `app/api/brands/route.ts` — replace weak duplicate `isPrivateIp`/`assertSafeUrl` with the shared validator | local weak check (misses `169.254/16`, `100.64/10`, `0.0.0.0`, IPv6, decimal/hex IPs) | Port + `tests/brands-ssrf-shared-helper.vitest.test.ts` (adapted to `networkSafety`) |
| S10 | Entitlement/auth test coverage for main's already-merged gating | absent | `src/server/__tests__/v1ProxyEntitlement.test.ts`, `src/server/__tests__/designAgentSkillsEntitlement.test.ts`, `tests/personalization-rls-migrations.vitest.test.ts` (adapted to main's implementations) |

From the UNCOMMITTED lead-finder work (absent on main):

| # | Item | Main status |
|---|---|---|
| L1 | `src/server/businessDiscovery/researchProvider.ts` — **CRITICAL SSRF fix**: URL validated before fetch, `maxRedirects: 0` + manual per-hop revalidation, unspecified-address handling. Main has `maxRedirects: 5` and only the weak `sanitizeUrl` (`isPrivateIp` misses `169.254.169.254`, IPv6 ULA/link-local, IPv4-mapped IPv6, `0.0.0.0`, non-dotted decimal IPs). Uncommitted version imports `assertSafeUrl` from `../urlSecurity` → **must be adapted to `networkSafety.ts`** |
| L2 | `app/api/personalization/find-businesses/route.ts` — rate limiting (`resolveRateLimitKey` + `clientIpOf` preferring `x-real-ip` then LAST `x-forwarded-for` hop), NaN/bounds guards, 200-char location cap, 502 generic mapping with `correlationId`, anon ceiling |
| L3 | `app/api/personalization/research-business/route.ts` — same hardening |
| L4 | `src/server/businessDiscovery/businessCache.ts` — cache-key whitespace normalization + bounded size |
| L5 | `e2e/personalization-remaining-flows.spec.ts` — niche fix (`'Roofing'` → `'real-estate'`) + BUSINESS FINDER test rewrite (+126/−17). **This is the 8/8 browser E2E spec** |
| L6 | Missing test files: `src/server/businessDiscovery/__tests__/{businessCache,researchProviderSsrf}.test.ts`, `src/server/__tests__/{findBusinessesRoute,researchBusinessRoute,discoveryCertifiedBaseline}.test.ts`, `tests/{personalization-project,discover-assets-status-auth,proxy-openai-enhance,proxy-openai-image}.vitest.test.ts` |
| L7 | `app/api/personalization/project/route.ts` (absent on main) |
| L8 | `e2e/provider-routing.spec.ts` (2 tests, absent on main) |
| L9 | Evaluate & integrate only genuinely-missing deltas from uncommitted `PersonalizationModal.tsx` / `DemoPersonalizeProvider.tsx` — main already contains the lead-finder UI fixes and is a feature superset; **preserve** main's 12 `dragOverSection` refs, `onRevert`, asset summaries and image editing |
| L10 | Evaluate uncommitted modifications to `app/api/personalization/discover-assets/status/route.ts`, `src/server/__tests__/personalizationDiscovery.test.ts`, `src/server/businessDiscovery/__tests__/businessDiscovery.test.ts` |

### PRESERVE-ONLY — backed up, intentionally not integrated

`storage/` runtime scratch; `visual-assets/` marketing captures; e2e certification specs + `playwright.*cert*.config.ts` dev artifacts; `e2e/_debug-openai.spec.ts`, `e2e/_inspect-selectors.ts`, `e2e/simple-smoke.spec.ts` scratch; `docs/personalization-auth-audit-report.md` + `docs/provider-certification-report.md` (source material for the audit deliverables, §5).

## 3. Dependency graph (integration order)

```
4a3649743 (DONE)  src/lib/networkSafety.ts        ← single SSRF validator
        │         lib/rateLimit.ts resolveRateLimitKey ← single rate-limit key helper
        │
        ├── SEC-INT ── S1+S2 (brand route auth → brandStore scoping)
        │             S4+S5+S6 → S10 migrations test
        │             S7 → its auth test
        │             S8 → networkSafety + downloadImage test
        │             S9 → networkSafety + brands SSRF test
        │             S3 → designAgentSkills test
        │
        └── UI-INT ── L1 → networkSafety + researchProviderSsrf test
                      L2/L3 → resolveRateLimitKey + find/research route tests
                      L4 → businessCache test
                      L5/L8 → UI + routes must land first (E2E is last)
                      L6/L7 → route + Project route
                      L9/L10 → modal/provider deltas (preserve drag/drop, Revert, summaries, image editing)
        │
        └── DOC-A ── independent (docs only; consumes this manifest)
        │
        └── VERIFY ── after SEC-INT + UI-INT commit: full unit suite, tsc, build, 8/8 E2E
```

Conflict rule: `networkSafety.ts` and `lib/rateLimit.ts` are already committed and are
**frozen** for this integration. No second SSRF validator or rate-limit key helper may
be introduced. When PR #49 merges, consolidate anything that still diverges.

## 4. Ownership partition (strictly disjoint file sets)

- **SEC-INT** owns: `app/api/brand/route.ts`, `src/shared/brandStore.ts`,
  `app/api/design-agent/skills/route.ts`, `supabase/migrations/2026101013*.sql`,
  `app/api/personalization/discover-assets/route.ts`,
  `app/api/personalization/download-image/route.ts`, `src/server/downloadImage.ts`,
  `app/api/brands/route.ts`, `src/server/__tests__/{discoverAssetsAuth,downloadImageRoute,v1ProxyEntitlement,designAgentSkillsEntitlement}.test.ts`,
  `tests/{personalization-rls-migrations,brands-ssrf-shared-helper}.vitest.test.ts`
- **UI-INT** owns: `src/server/businessDiscovery/*`, `app/api/personalization/{find-businesses,research-business,project}/route.ts`,
  `app/api/personalization/discover-assets/status/route.ts`, `src/shared/personalization/*` (modal/provider deltas only),
  `e2e/personalization-remaining-flows.spec.ts`, `e2e/provider-routing.spec.ts`,
  `src/server/__tests__/{findBusinessesRoute,researchBusinessRoute,discoveryCertifiedBaseline,personalizationDiscovery}.test.ts`,
  `src/server/businessDiscovery/__tests__/*`, `tests/{personalization-project,discover-assets-status-auth,proxy-openai-enhance,proxy-openai-image}.vitest.test.ts`
- **DOC-A** owns: `docs/phase1-architecture-security-integration-audit.md`,
  `docs/upstream-aware-architecture-audit.md`
- **Frozen** (foundation, do not edit): `src/lib/networkSafety.ts`, `lib/rateLimit.ts`
- **Forbidden to everyone**: `netlify/functions/*`, `middleware.js`, `src/lib/authConfig.ts`,
  `src/components/SettingsModal.js`, `src/lib/muapi.js`, `app/api/vfx/*`,
  `src/server/browserDiscovery.ts`, `src/server/discoverAssets.ts`, `src/lib/uploadProxyTarget.js`,
  `tests/{api-keys,authConfig,settings-modal,vfx-route}*.vitest.test.ts`, the
  `ai-assistant-for-images` worktree itself, `main`, production, and any deploy/merge to main.

## 5. Outstanding architecture-audit deliverables

1. `docs/phase1-architecture-security-integration-audit.md` — sections A–F (studio-wide
   security/integration audit; evidence: 4 parallel audit agents' findings —
   12+ studios, 3 provider implementations, Clerk + MuAPI key auth, inconsistent error
   handling, 3 MuAPI clients, dead shared components).
2. `docs/upstream-aware-architecture-audit.md` — fork-point comparison against
   `Anil-matcha/Open-Generative-AI` (fork point `fd049524`; upstream ~106 commits ahead
   vs ~765 local; upstream has zero `src/shared/*`, no Clerk/Supabase/OpenAI).
   6-column table (ISSUE | UPSTREAM STATUS | OPENHIGGSBOLT STATUS | ORIGIN |
   RECOMMENDED ACTION | SYNC CONFLICT RISK) + sections A–D. Upstream comparison clone
   must be re-created (the previous one at `/var/folders/…/kilo/upstream-oga` is gone).

## 6. Verification gates (VERIFY agent, from the clean committed candidate)

1. `npx vitest run` — full unit suite green (baseline at foundation: see VERIFY report)
2. `npx tsc --noEmit` — 0 errors (baseline: 0)
3. `npm run build` — production build passes
4. `npx playwright test e2e/personalization-remaining-flows.spec.ts` — **8/8** browser E2E
5. Feature preservation proof: 12 `dragOverSection`, `onRevert`, asset summaries, image editing intact in `PersonalizationModal.tsx`
6. No merge to `main`, no deploy, original worktree untouched
