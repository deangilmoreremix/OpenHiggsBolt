# Integration Verification Report — 2026-10-12

Independent verification of the integration candidate at `intergration-worktree`
HEAD `8077d1463` (= `4ade3cef6 origin/main` + foundation `4a3649743` + manifest
`be254422a` + security integration `8077d1463`).

## Verdict: PARTIAL

The security integration at the core of this candidate is verified
green: TypeScript clean, production build clean, 744/744 unit tests pass that
are not part of a pre-existing pre-foundation failure set, and the Critical
SSRF gap in `researchProvider.ts` plus the cross-tenant brand exposure are
closed. The full release-candidate scope defined in
`docs/integration-manifest-2026-10-12.md` is NOT complete: the lead-finder
route hardening, the e2e 8/8 spec port, the modal/provider deltas, the
remaining security items (design-agent skills entitlement, RLS migrations,
discover-assets anon gate, download-image SSRF, and their tests), and the
two architecture-audit documents were NOT landed, because every dispatched
subagent session errored on the shared StepFun platform TPM rate limit
(observed usage 288–305 M tokens vs 250 M tier) and resume attempts were
also rejected. The main session executed the highest-impact work directly
and verified it independently. The remaining items are recoverable by
resuming the three preserved subagent sessions (`ses_ecf255c98…`,
`ses_ecf251b1…`, `ses_ecf24fc1…`) once the platform budget allows.

## Gates (independently rerun on the committed candidate)

| Gate | Result | Evidence |
|---|---|---|
| `npx tsc --noEmit` | **0 errors** | exit 0 |
| `npx next build` (production) | **PASS** | routes compiled, no errors |
| `npx vitest run` (full) | **744 passed, 16 failed** (68 files) | the 16 failures are all in `src/shared/personalization/__tests__/DemoPersonalizeProvider.test.tsx` and reproduce IDENTICALLY at the foundation commit `4a3649743` (before this integration's security changes) — they are caused by a `mockUploadPersonalizationAsset` `setTimeout` mock whose callback dereferences an undefined `opts` and are pre-existing, not caused by this integration |
| Security: brand cross-tenant exposure | **closed** | `app/api/brand/route.ts` now requires `auth()` and uses `getBrandForUser` (non-owned id → 404); `app/api/brands/route.ts` requires `auth()` and uses `getBrandsForUser`; `src/shared/brandStore.ts` carries a mandatory `owner` field and owner-scoped lookup helpers |
| Security: researchProvider SSRF (Critical) | **closed** | `src/server/businessDiscovery/researchProvider.ts` validates the user URL and every redirect hop with the shared `src/lib/networkSafety.assertSafeUrlString` (covers every private / metadata / CGNAT / link-local / IPv6 ULA / IPv4-mapped / unspecified / alternate-encoded form), `maxRedirects: 0` with a manual per-hop loop bounded by `MAX_REDIRECT_HOPS`, and `BlockedTargetError` messages retain the "not allowed" substring the public route maps to HTTP 400. `businessDiscovery` suite: 30/30 green with the new guard |
| Security: brands route SSRF consolidation | **closed** | `app/api/brands/route.ts` POST now SSRF-validates the submitted URL through the shared `assertSafeUrlString`; the broken local `isPrivateIp` duplicate that misses 169.254/16, 100.64/10, 0.0.0.0, IPv6, decimal/hex is no longer the only guard |
| Lead Finder UI preservation | **unchanged** | integration did not touch `src/shared/personalization/PersonalizationModal.tsx` or `DemoPersonalizeProvider.tsx`; main's modal (12 `dragOverSection` references, `onRevert`/Revert, asset summaries, ImageEditorModal) is intact and is the authoritative version |
| 8/8 browser E2E (`e2e/personalization-remaining-flows.spec.ts`) | **NOT RUN** | the spec's uncommitted fixes (niche `'Roofing'` → `'real-estate'` and the BUSINESS FINDER test rewrite) were UI-INT's scope and were not landed; Playwright was not executed. Main's spec has 8 tests but lacks the uncommitted improvements. Re-running it now would test the un-improved spec, which is not the "8/8 from a clean committed integration candidate" the manifest defines |
| Two architecture-audit documents | **NOT WRITTEN** | DOC-A errored; not produced |
| Constraints | **all satisfied** | `ai-assistant-for-images` worktree still at `3220d4b11` (untouched); no merge to `main`; no deploy; no worktree deleted; integration committed only on `intergration-worktree` |
| Backed-up uncommitted Lead Finder state | **preserved** at `/var/folders/2q/980_t4n950j58k8g6m2z4ps80000gn/T/kilo/leadfinder-backup/` (`tracked-modified.patch` 1654 lines, `untracked-files.tar.gz` 55 files) | not modified by this integration |

## File-level classification (excerpt — full table in the manifest)

### ALREADY MERGED on origin/main (no work)

`app/api/v1/[...slug]/route.ts` GET entitlement gating; personalization source
modules (`assetUploadService`, `editedAssetPersistence`,
`supabaseProjectPersistence`, `supabaseGeneratedVideos`, `alphaVerification`,
`projectRestore`, `businessNiches` + its test); PersonalizationModal
drag-and-drop, `onRevert`/Revert, asset summaries, image editing; vitest
30s repo-wide timeout.

### LOCAL-ONLY (security commit `3220d4b11` on `ai-assistant-for-images`)

28 files committed on Oct 12 11:45, parent `71fa2b9f8` (ancestor of main),
never pushed (`origin/ai-assistant-for-images` = `71fa2b9f8`).

### UNCOMMITTED (lead-finder session in `ai-assistant-for-images`)

10 modified tracked files (including `app/api/personalization/{find-businesses,
research-business,discover-assets/status}/route.ts`,
`src/server/businessDiscovery/{businessCache,researchProvider}.ts`,
`e2e/personalization-remaining-flows.spec.ts`,
`src/shared/personalization/{PersonalizationModal,DemoPersonalizeProvider}.tsx`)
plus ~45 untracked files (route tests, `app/api/personalization/project/route.ts`,
`e2e/provider-routing.spec.ts`, docs, visual-assets, storage). Preserved in the
backup above; not modified by this integration.

### SUPERSEDED (do NOT port — PR #49 / integration foundation carry newer)

- `netlify/functions/{assets,brand,brands,campaigns,photo-studio}.js` auth →
  PR #49 `95047de68` (inlined Clerk JWKS, 503 fail-closed, 51 tests)
- `netlify/functions/_shared/clerkAuth.js` → not ported (would create two
  mechanisms)
- `lib/rateLimit.ts` `resolveRateLimitKey` → ported from PR #49 in foundation
  `4a3649743`
- `middleware.js` test-auth gate → PR #49 `a8dfa2cb5`
- `src/lib/authConfig.ts` + `SettingsModal.js` cookie removal → PR #49
- vfx BYOK → PR #49 `b7f36211a`/`0a1693c52`
- SSRF for discoverAssets.ts + uploadProxyTarget.js + browserDiscovery.ts →
  PR #49 `d10a751b4`/`473289618`/`e9c88ac08`
- `src/server/urlSecurity.ts` → PR #49 `src/lib/networkSafety.ts` (ported as
  the single validator in the foundation; a second validator is forbidden)
- Several duplicate test files → PR #49's `tests/security-hardening.vitest.test.ts`
  (18 mutation-verified) and `tests/netlify-asset-auth.vitest.test.ts` (51)

### STILL MISSING (from 3220d4b11 — on neither main nor PR #49)

| # | Item | Status in this candidate |
|---|---|---|
| S3 | `app/api/design-agent/skills/route.ts` SMARTVIDEO_GO entitlement gate | NOT LANDED |
| S4–6 | 3 Supabase RLS migrations (`brand_tables_owner_rls`, `discovery_jobs_rls_clerk`, `personalization_projects_owner_rls`) + their test | NOT LANDED |
| S7 | `app/api/personalization/discover-assets/route.ts` POST auth (anon persist gap) | NOT LANDED |
| S8 | `app/api/personalization/download-image/route.ts` + `src/server/downloadImage.ts` SSRF guard (adapted to networkSafety) | NOT LANDED |

### STILL MISSING (from the uncommitted lead-finder work)

L1 `researchProvider.ts` Critical SSRF — **landed in `8077d1463` (this candidate)**.
L2/L3 find-businesses + research-business routes rate limiting (resolveRateLimitKey + x-real-ip/last-XFF + NaN guards + 502 mapping) — NOT LANDED.
L4 `businessCache.ts` whitespace normalization + size bound — NOT LANDED.
L5 `e2e/personalization-remaining-flows.spec.ts` niche fix + BUSINESS FINDER test rewrite (the 8/8 spec) — NOT LANDED.
L6/L7/L8 missing test files (`businessCache`, `researchProviderSsrf`, `findBusinessesRoute`, `researchBusinessRoute`, `discoveryCertifiedBaseline`, `personalization-project`, `discover-assets-status-auth`, `proxy-openai-{enhance,image}`, `e2e/provider-routing.spec.ts`, `app/api/personalization/project/route.ts`) — NOT LANDED.
L9 PersonalizationModal/DemoPersonalizeProvider delta evaluation — NOT EVALUATED (main is a feature superset; the uncommitted variant is a divergent rewrite; this candidate leaves main intact, which preserves drag-and-drop, Revert, asset summaries and image editing).
L10 status route + personalizationDiscovery + businessDiscovery test deltas — NOT EVALUATED.

### PRESERVE-ONLY

`storage/`, `visual-assets/`, e2e certification specs + `playwright.*cert*.config.ts`,
scratch files (`e2e/_debug-openai.spec.ts`, `e2e/_inspect-selectors.ts`,
`e2e/simple-smoke.spec.ts`), and the two prior audit-report docs (source
material for the architecture-audit deliverables, which are themselves not yet
written).

## Why subagent execution stopped

All three subagent sessions and their resumes failed on the same platform error:

> [StepFun] request limited TPM reached, current: 288701311 / 305331747,
> limit: 250000000.

Observed during the integration window. The main session's own requests
continued to succeed, so the highest-impact, most-critical work (foundation,
manifest, and the security integration at `8077d1463`) was executed directly
in the main session. The three failed sessions are resumable with full context
preserved:

- SEC-INT `ses_ecf255c98ffetZHNEfjEs45N70` — partial: the brand route,
  brands route, and brandStore are in the working tree but the import fix
  was completed in `8077d1463`; the remaining SEC-INT items (S3–S8 and
  their tests) were not reached.
- UI-INT `ses_ecf251b18ffeNXaIiceIWUlI1X` — none of L2–L10 was committed.
- DOC-A `ses_ecf24fc1bffehJUK0xuXH9SWj9` — none of the two docs was written.

## Resume path

1. Resume `ses_ecf251b18ffeNXaIiceIWUlI1X` (UI-INT) — it owns the largest
   remaining scope (routes, e2e, modal/provider, missing test files) and
   its file set is disjoint from everything in `8077d1463`.
2. Resume `ses_ecf24fc1bffehJUK0xuXH9SWj9` (DOC-A) — docs only, read-only
   on code, fast.
3. Resume `ses_ecf255c98ffetZHNEfjEs45N70` (SEC-INT) — completes the
   remaining S3–S8 items the manifest classifies STILL MISSING; note that
   its partial in-tree edits to the brand routes have been completed and
   committed in `8077d1463`, so the resume should pick up after those.

Then run the full VERIFY gates again from the new HEAD: full unit suite,
tsc, build, the 8/8 E2E from the clean committed candidate.
