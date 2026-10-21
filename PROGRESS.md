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

## PHASE 5 — Regression & release verification: DONE

- `npx tsc --noEmit` → clean.
- Unit: **408 pass / 427** across `src/server/__tests__` + `src/access/__tests__` (29 files). The **19 failures are pre-existing** Stripe entitlement-status vocabulary failures (`'revoked'` vs `'inactive'`) in `stripe-webhook-gates.test.ts` + `zz-stripe-webhook-entitlements.test.ts` — reproduced on a clean tree earlier via `git stash`; unrelated to this work, no file they touch was modified.
- Production build: `next build` → **BUILD_ID `oFKmjjgVRQVPba2v3QIRq`**, compiled successfully in 73 s.
- E2E against the **production build** (`next build` + `next start`, real OSM data, real business sites, no stubs) — run one file at a time because the machine is memory-starved:
  | Suite | Result |
  |---|---|
  | `find-business-landing.spec.ts` | **7 passed** |
  | `find-business-go-viral.spec.ts` | **4 passed** |
  | `find-business-assets-landing.spec.ts` | **6 passed** |
  | `find-business-assets-go-viral.spec.ts` | **5 passed** |
  Every acceptance search returned **30 businesses**; asset discovery returned **202 + jobId** with **20 real assets**, which were selected and imported.

## PHASE 6 — Candidate deploy: DONE (production NOT touched)

| | |
|---|---|
| **Candidate deploy id** | `6ad7e889a5a56adbc5609267` (context **`deploy-preview`**, `published_at: null` ⇒ DRAFT) |
| **Candidate URL** | `https://6ad7e889a5a56adbc5609267--marvelous-strudel-a6dc23.netlify.app` |
| **Candidate commit** | `f3fb85ecc5842e865bfcb365491aa3a723a93493` (merge of `fix/find-business-and-assets` into `release/find-business-candidate`) |
| **Production deploy (unchanged)** | `6ad785b174944c0d9a60489e` @ `0bfecda0f8` — the rollback target |
| **Branch** | `fix/find-business-and-assets` @ `e4d8dd913` (pushed) |

Command used (the same one `scripts/release.mjs --preview` runs; the script itself needs a `NETLIFY_AUTH_TOKEN` that is not present, and the CLI is already authenticated):
`netlify deploy --build --site 76f606a3-8546-440f-8469-33a0236a8a23` — **no `--prod`, no `--alias`**.
Never executed: `netlify deploy --prod`, `release.mjs --approve-production`, any push/reset of `main`, GitHub Actions.

**Candidate API evidence (interleaved with production, same request):**
- candidate → **200, count 30**, 4.45 s cold / 0.41 s warm / 0.43–1.06 s thereafter
- production → **504 @ 30.5 s**, then 200 @ 27.3 s cold, 0.45–0.67 s warm, **count 20** (pre-fix provider mix)

**Candidate browser verification: 22/22 passed, 0 failed, 0 flaky.**
`find-business-landing` 7/7 · `find-business-assets-landing` 6/6 · `find-business-go-viral` 4/4 · `find-business-assets-go-viral` 5/5.
All 17 business searches → **30 businesses**; every asset discovery → **202 + jobId, 20 assets**, selected and imported.

**Root cause of the production API 404 (found during this phase):** the deploy published at 13:56 on 20 Oct (`6ad7720c160ce82c7d6109e6`) was published **without `--build`** — `build_id: None`, and its `___netlify-server-handler` carries a passthrough route `^(?:\/(.*))\/?$`, so requests were passed to the static publish dir instead of being handled by Next.js. Pages rendered (200) while every `/api/*` route 404'd. `origin/main` has since fixed that (`5c50f25d5`, `7e8a436b3`); production is now API-capable but still 504s, because it runs `0bfecda0f8` which does **not** contain the budget fix.

**Environment finding:** Clerk's instance allows only `https://go.smartvid.app` as an origin, so a deploy-preview host is refused by the FAPI (`400 origin_invalid`) and a real visitor cannot sign in on a preview URL. `scripts/generate-clerk-auth-state-preview.mts` mints a genuine session on the allowed origin and re-scopes the cookies to the preview host, so the candidate was tested **authenticated** (`/api/access/resolve` → `hasSmartVideoGo: true`).

## Remaining regressions (NOT caused by this branch)
- 19 failures in `src/access/__tests__/stripe-webhook-gates.test.ts` + `src/server/__tests__/zz-stripe-webhook-entitlements.test.ts` — entitlement-status vocabulary (`'revoked'` vs `'inactive'`). Reproduced on the base commit.
- 6 failures in `src/access/__tests__/preview-mode.test.tsx` — same class, pre-existing.
- 13 failures in `tests/go-ai-viral/seedance.test.ts`, `tests/go-ai-viral/list-row-thumbnail.test.tsx`, `tests/netlify/functions-entitlement.test.ts` — untouched areas (data file, jsdom env, function guard index).
- 10 files under `tests/` are `node:test` suites that Vitest cannot load ("No test suite found") — a harness mismatch, pre-existing.
None of these areas appear in `git diff origin/main..HEAD` (40 files, all business/asset discovery + E2E).

**Blocker found:** the Netlify build command runs `npm run build:packages` → `npm run build -w workflow-builder`, and `packages/Vibe-Workflow` is a **git submodule** that is NOT initialised in the worktree (`No workspaces found: --workspace=workflow-builder`). The **parent repo** has all submodules + workspace links, so the candidate must be built there.

**Safety facts established:**
- Netlify site `76f606a3-8546-440f-8469-33a0236a8a23` has **`repo: None`** → **not GitHub-linked → a git push or a local merge publishes nothing**. Only an explicit `netlify deploy --prod` publishes.
- `scripts/release.mjs` is the established pipeline: `--preview` ⇒ `netlify deploy --build --site <id>` (no `--prod` ⇒ DRAFT), `--approve-production` ⇒ the only path that publishes.
- Production deploy to remain untouched: **`6ad7720c160ce82c7d6109e6`** (the rollback target).

## WORKFLOW (multi-agent, remaining work)

| Agent | Role | Scope | Handoff |
|---|---|---|---|
| **A — Release Engineer** | Build + publish a **draft** candidate | parent repo, candidate branch, `netlify deploy --build --site …` (**never `--prod`**) | `/tmp/candidate.json` {deployId, url, sha} + `/tmp/agent-release.md` |
| **C — Regression Auditor** | Independent re-verification | tsc, unit, build, pre-existing-vs-new failure separation | `/tmp/agent-regression.md` |
| **B — Verification Engineer** | Playwright the candidate | 4 suites against the candidate URL + a candidate-origin Clerk state | `/tmp/agent-verify.md` |
| **D — Coordinator (me)** | Integration + final report | matrix, root causes, readiness | final response |

A → B (candidate URL is B's input). C runs parallel to A. D consumes all three.

### Environment constraint (the real bottleneck)
The shared machine is **memory-starved**: swap 9.6 GB used of 11 GB, free RAM ~19 MB. Under load the dev server took 50–80 s to compile a route and the production server was OOM-killed mid-suite. **Run one Playwright file at a time, never all four together, and never run a build concurrently with a suite.** This also explains the earlier "Turbopack compilation hangs": it was swap thrash, not a code fault.

## OUTSTANDING

- **Phase 4** — Real provider testing: ≥5 repeated searches per category; cold/warm; provider errors; empty results; invalid URLs; slow websites; repeat searches; multiple real-site scrapes.
- **Phase 5** — Regression/release verification: tsc, unit, integration, production build, Landing E2E, GO Viral E2E, Clerk entitlement regression, asset polling/import; separate pre-existing failures with evidence.
- **Phase 6** — Candidate deploy via Netlify pipeline, **NOT published** (production stays locked); test its unique deploy URL; report candidate deploy ID + SHA + rollback deploy ID.

## HARD RESTRICTIONS
- Netlify production publishing **LOCKED** — no `--prod`, no publish, no unlock.
- No deploy/auto-publish. No GitHub Actions. No force-push/reset of main.
- Do not merge until verified against latest `origin/main`.
- Do not touch remix-new-editor / `smartvid.app`; preview / Motion Studio / editor.
