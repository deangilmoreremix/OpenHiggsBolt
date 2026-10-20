# Find Business / Find Business Assets — Progress Record

Repo: `deangilmoreremix/OpenHiggsBolt` · Production: `https://go.smartvid.app` · Branch: `fix/find-business-and-assets`
Worktree: `.kilo/worktrees/fix-the-lead-finder`

## DONE — do not re-assign

| # | Item | Evidence |
|---|---|---|
| 1 | Root cause: `POST /api/personalization/find-businesses` → **HTTP 504 @ ~31s** (Netlify ceiling). Overpass mirrors summed, Nominatim fallback answered too late. Logs: `OVERPASS_ALL_MIRRORS_FAILED` + late Nominatim. | commits `c0b759797` |
| 2 | Domain ownership: `go.smartvid.app`=OpenHiggsBolt (`76f606a3-…`); `smartvid.app`=**remix-new-editor** (`ec2fbb0c-…`) — never touched. `smartvid.app` 404s were our own harness pointing at the wrong app. | reverted in `ef1b2c725` |
| 3 | Fix implemented: raced Overpass mirrors; Overpass ∥ Nominatim search; per-stage abortable deadlines (`deadline.ts`); shared abortable Nominatim gate (`nominatimRateGate.ts`); geocode timeout 12s; `ROUTE_DEADLINE_MS=24000` (worst case 21.1s < 30s). | `c0b759797` |
| 4 | `healthcare-medical` niche added (dentists) — frontend + backend OSM mapping. | `fc00e94d1` |
| 5 | E2E suites target `go.smartvid.app`; no false-positive skips; 2 selector defects fixed (asset toggle `Select`/`Deselect`; Go-Viral first-login MuAPI `z-[200]` overlay). | `ef1b2c725` |
| 6 | Clerk storage state resolved per-origin (prod + dev instances). Real sessions; entitlements via repo's own `grantEntitlement()`; cross-user job → 404. No prod bypass cookie; no gate widened. | `2b5a2508a` |
| 7 | Local verification: **200/200** unit tests (14 suites); **21/21** local E2E; 30 real businesses × 4 acceptance searches (Miami/LA/NYC/Austin). | local runs |
| 8 | Phase 1 reconcile: new prod deploy `6ad7720c160ce82c7d6109e6` = CLI deploy (`commit_ref: None`) from parent working tree = `origin/main` 432023eb0. **Our 3 commits NOT in main.** `feature/personalization-editor-integration` NOT merged. Live probe: prod still 504s ⇒ fix **not deployed**. | probes |
| 9 | Merged latest `origin/main` into branch → `f8bedb30b`, **0 conflicts**; fix files verified intact. | `git merge-tree` clean |

## PHASE 2 — Business Finder: VERIFIED (no further code change needed)

All 10 requirements PROVEN against the committed fix (`c0b759797`):

| # | Requirement | Evidence |
|---|---|---|
| 1 | Overpass mirrors concurrent, bounded | `overpassProvider.ts:618-621` (mirrors race); resilience test "has every mirror in flight at the same time" ✓; "hanging mirror cannot dominate — fails within ~25s when every mirror hangs" (15.1s) ✓ |
| 2 | Nominatim fallback never waits for Overpass | `route.ts:509` `raceProviders([overpassOutcome, nominatimOutcome])`; `route.ts:197-239` first provider with REAL records wins ✓ |
| 3 | Geocode computed once, reused | `route.ts:464-465`; `geocodeResult.latitude/longitude` fed to both providers (`:476-497`) ✓ |
| 4 | All HTTP requests honour abort signals | `overpassProvider.ts:74-86` (multi-signal merge), `:598-599`; `nominatimProvider.ts` external signal; `nominatimRateGate.ts:72-86` abortable reservations ✓; "cancels the in-flight mirror request when the caller's budget is spent" ✓ |
| 5 | Timeouts cannot accumulate | `deadline.ts` `ROUTE_DEADLINE_MS=24000`; geocode 12s + max(overpass 9s, nominatim 7s) + ~0.1s = 21.1s < 24s < 30s ceiling — pinned by `zz-lead-finder-request-budget.test.ts` ✓ |
| 6 | Rate limiting respected | shared gate across geocoder + business-list search; "serializes requests so the ~1 req/s policy is honoured" + "respects the capped number of Nominatim calls per search" still pass ✓ |
| 7 | Good results not discarded when a sibling fails | `raceProviders` — a failing provider never stops the other and never discards a good sibling result (`:189-190`) ✓ |
| 8 | Partial results returned when valid | 502 path returns `partial.geocode` + `partial.providers` (`:592-600`); 504 path returns `partial.geocode` (`:524-532`) ✓ |
| 9 | Errors = actionable JSON, never a hang | every error path returns JSON + `code` + `correlationId` + `x-correlation-id` header — measured below ✓ |
| 10 | Real, validated businesses; no fabrication | "no fabrication" assertions intact ✓; all counts from live OSM ✓ |

**Phase 4 search measurements (real OSM, 5 reps × 4 categories = 20 searches):**
- Restaurants — Miami: `[30,30,30,30,30]` cold 5112ms, warm 1–9ms
- Dentists — Los Angeles: `[30,30,30,30,30]` cold 4641ms, warm 1–3ms
- Real estate — New York: `[30,30,30,30,30]` cold 5505ms, warm 3–6ms
- Automotive — Austin: `[30,30,30,30,30]` cold 4622ms, warm 1–3ms
- **20/20 returned businesses; 0 exceeded 25s.** Provider: `NOMINATIM_SEARCH` (Overpass degraded) then `OPENSTREETMAP` cache.

**Error / empty / invalid (all JSON, no hang):**
empty body 400 `MISSING_NICHE` · missing niche 400 · missing location 400 · blank location 400 ·
unsupported niche 400 `UNSUPPORTED_NICHE` · garbage location 400 `GEOCODE_FAILED` (463ms) ·
"Antarctica, ZZ" 200/30 — geocodes to the real Brazilian neighbourhood *Antarctica*, Campo Grande MS; all 30 are genuine in-radius businesses (not a scope defect).

**Live production still 504** at ~31s (pre-fix code; warm instance 200 in 0.4s from cache) ⇒ fix committed, **not deployed**.

## PHASE 3 — Asset discovery pipeline: VERIFIED (no code change needed)

Strategy chain is exactly as specified — `fastDiscovery.ts:112` static FIRST (always) → `:135-146` sitemap (only if static insufficient) → `:151-206` Crawlee/Cheerio seeded with sitemap pages (only if static insufficient) → `:209` `needsBrowser` only when useful assets are still lacking → browser fallback. `shouldCrawlMore` (`:87-90`) also keeps crawling when no **logo** was found, because a logo almost never sits on the home page.

**Real-site scraping (live network, no stubs):**

| Site | ms | provider | assets | useful | needsBrowser | categories |
|---|---|---|---|---|---|---|
| tacoselporky.com (small restaurant) | 4843 | STATIC_FALLBACK | 3 | 3 | true | logo 2, brand 1 |
| starbucks.com (chain) | 1154 | STATIC_FALLBACK | 6 | 6 | false | logo 1, product 1, team 1, brand 3 |
| example.com (no assets) | 1398 | STATIC_FALLBACK | 0 | 0 | true | — (empty handled, no crash) |
| smithsfish.com (local business) | 1998 | STATIC_FALLBACK | 10 | 10 | false | brand 9, logo 1 |
| wholefoodsmarket.com (large) | 5105 | STATIC_FALLBACK | 32 | 32 | false | brand 25, product 6, logo 1 |
| realtor.com (JS-heavy) | 3902 | STATIC_FALLBACK | 0 | 0 | true | — (static finds nothing → browser path) |

Every discovered `sourceUrl` re-fetched: **HTTP 200** with valid `image/jpeg` / `image/png` / `image/svg+xml` / `image/webp`. Logos, product shots, team/owner photos and brand imagery are all captured; nothing fabricated.

**SSRF / URL validation (10/10 blocked, valid URLs unaffected):**
`127.0.0.1` · `localhost` · `169.254.169.254` (cloud metadata) · `10.0.0.5` · `192.168.1.1` · `[::1]` · `0.0.0.0` → *"Private network addresses are not allowed"*; `file://` · `javascript:` · `ftp://` → *"Only http/https protocols are allowed"*. `https://tacoselporky.com/` still returns assets.

**Async contract:** POST `/api/personalization/discover-assets` → **202 + jobId**; `GET …/status?jobId=…` → **200** with the job state; long scrapes run out of band and the initial response is never blocked (verified in the local E2E run: 202 → poll → 200 → import).
**Isolation:** another user's `jobId` → **404** (no leak) — verified in the production Clerk run.

## IN PROGRESS

- **Phase 5** — regression / release verification.
- **Phase 6** — candidate deploy (NOT published; production stays locked).

## OUTSTANDING

- **Phase 4** — Real provider testing: ≥5 repeated searches per category; cold/warm; provider errors; empty results; invalid URLs; slow websites; repeat searches; multiple real-site scrapes.
- **Phase 5** — Regression/release verification: tsc, unit, integration, production build, Landing E2E, GO Viral E2E, Clerk entitlement regression, asset polling/import; separate pre-existing failures with evidence.
- **Phase 6** — Candidate deploy via Netlify pipeline, **NOT published** (production stays locked); test its unique deploy URL; report candidate deploy ID + SHA + rollback deploy ID.

## HARD RESTRICTIONS
- Netlify production publishing **LOCKED** — no `--prod`, no publish, no unlock.
- No deploy/auto-publish. No GitHub Actions. No force-push/reset of main.
- Do not merge until verified against latest `origin/main`.
- Do not touch remix-new-editor / `smartvid.app`; preview / Motion Studio / editor.
