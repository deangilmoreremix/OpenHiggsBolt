# Apps Studio — Reseller Commerce & Training Plan

**Status date:** 2026-10-11
**Worktree:** `.kilo/worktrees/redesign-apps-studio-marketplace` (branch `redesign/apps-studio-marketplace`, HEAD `a4d6f30d2` + uncommitted marketplace work)
**Purpose.** This document replaces the earlier `apps-studio-commerce-training-plan.md` draft (written before the implementation existed). Everything below was read from the code in this worktree on the status date. Prices are the ones defined in `src/lib/reseller/packages.ts`; environment variable names are the ones the code reads. Nothing here is aspirational copy — gaps are listed as gaps.

## 1. What is implemented (verified in code)

### 1.1 Package definitions and prices — `src/lib/reseller/packages.ts`

| Package id | Name | Price (USD) | Grants entitlements | Price env var |
| --- | --- | --- | --- | --- |
| `diy` | DIY App Builder | **$197** (19700 cents) | `apps_studio_diy` | `RESELLER_STRIPE_PRICE_DIY` |
| `training` | Apps + Training | **$597** (59700 cents) | `apps_studio_diy` + `apps_studio_training` | `RESELLER_STRIPE_PRICE_TRAINING` |
| `upgrade` | Apps + Training Upgrade | **$400** (40000 cents) | `apps_studio_training` only | `RESELLER_STRIPE_PRICE_UPGRADE` |

- The Stripe secret key is read from `STRIPE_SECRET_KEY` (`RESELLER_STRIPE_SECRET_ENV_KEY`).
- The $400 upgrade is modeled as an `upgrade` rule on the `diy` package (`fromEntitlement: apps_studio_diy`, `toEntitlement: apps_studio_training`, `blockedByEntitlement: apps_studio_training`) and as its own purchasable price id; it grants training only — never a second copy of DIY.
- `getResellerMissingConfig()` / `isResellerStripeConfigured()` report exactly which of `STRIPE_SECRET_KEY` and the three price env vars are unset. No price IDs are hardcoded anywhere in the repo.
- Purchasable packages are strictly `diy` and `training` (`RESELLER_PURCHASABLE_PACKAGE_IDS`); `upgrade` is only reachable through the dedicated upgrade route.

### 1.2 Entitlement keys and grants — `src/lib/reseller/entitlements.ts`, `src/lib/resellerAccess.ts`

- Keys: `apps_studio_diy` (DIY) and `apps_studio_training` (training), stored in the existing `user_entitlements` table as a free-form JSON blob via the existing `grantEntitlement` helper (`src/access/resolveAccess.ts`) — no changes to the existing entitlement machinery.
- `applyResellerPurchase()` is additive: already-held entitlements are skipped (`alreadyGranted`), missing ones are granted, and the purchase is recorded in `reseller_purchases`. A unique index on `stripe_session_id` makes repeated webhook deliveries idempotent (Postgres `23505` → `duplicatePurchase: true`, no duplicate grant, no error).
- `evaluateUpgradeEligibility()` returns `ALREADY_TRAINING` when the caller already holds training, `UPGRADE_NOT_ELIGIBLE` when the caller does not hold DIY, else eligible — the anti-double-dip guard for the $400 path.
- `src/lib/resellerAccess.ts` adds the pure client of this contract: `canDownloadSource` (DIY **or** training), `canAccessTraining` (training only), `getTrainingEntitlementGap` (what the $400 upgrade would grant: only `apps_studio_training`), `resolveResellerEntitlements` (prefers `@/lib/reseller/entitlements`, falls back to the existing `user_entitlements` store when that module is unavailable), and the app allowlist (`isKnownResellerApp` / `getResellerApp`).

### 1.3 Checkout + upgrade routes — `app/api/reseller/**`

`app/api/reseller/checkout/route.ts` — `POST { package: "diy" | "training" }`:
- `400 UNKNOWN_PACKAGE` for anything other than `diy`/`training`.
- `503 RESELLER_STRIPE_NOT_CONFIGURED` with the exact `missing[]` env-var list when Stripe is not configured. The gallery UI uses this to disable the CTA and show a "checkout pending" note — the marketplace never fakes a checkout.
- Otherwise creates a Stripe Checkout session (`mode: 'payment'`, card only, promotion codes allowed) with `metadata.package_id`, `metadata.entitlement`, `metadata.source = 'apps_studio_reseller'`, and `clerk_user_id` when the buyer is signed in; success/cancel URLs point at `/studio/apps`. Returns `{ url, sessionId, package }`.
- Signed-out buyers are allowed through to Stripe (the existing product pattern); the webhook resolves the user by email afterwards.

`app/api/reseller/upgrade/route.ts` — `POST`:
- `401 UNAUTHENTICATED` when signed out.
- `409 ALREADY_TRAINING` / `402 UPGRADE_NOT_ELIGIBLE` from `evaluateUpgradeEligibility` (idempotency + eligibility gate before any Stripe call).
- `503 RESELLER_STRIPE_NOT_CONFIGURED` with `missing[]` when the upgrade price id or secret key is unset.
- Session metadata carries `upgrade_from: 'apps_studio_diy'` so the webhook branch records the correct package.

### 1.4 Webhook (additive branch) — `app/api/webhooks/stripe/route.ts` (modified, uncommitted)

- `resolveSessionPriceId()` reads the price id directly from `session.line_items` and falls back to retrieving the session with `expand: ['line_items']`.
- `getResellerPackageIdForPriceId()` maps the price id to a reseller package via the configured env price ids.
- If a reseller price matched: `applyResellerPurchase()` grants entitlements + records the purchase, then the webhook **returns** — existing `STRIPE_PRODUCT_MAP` handling below is untouched for non-reseller prices. Failures return 500 so Stripe retries.

### 1.5 Download route + signed-URL storage — `app/api/reseller/download/route.ts`, `src/lib/resellerStorage.ts`, `src/lib/resellerAccess.ts`

`GET /api/reseller/download?app=<appId>` contract:

| Status | Code | Meaning |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | no Clerk session |
| 400 | `MISSING_APP_ID` | no `app` query parameter |
| 404 | `UNKNOWN_APP` | appId not in the 38-app manifest allowlist (allowlist gate runs **before** entitlement evaluation; traversal payloads can never match) |
| 403 | `NOT_ENTITLED` | caller holds neither `apps_studio_diy` nor `apps_studio_training` |
| 503 | `STORAGE_NOT_CONFIGURED` / `BUNDLE_NOT_AVAILABLE` / `SIGN_FAILED` | storage credentials missing / artifact still unpublished / signing failed |
| 302 | — | redirect to a short-lived **signed URL** in the private bucket, with `Cache-Control: no-store` and `X-Robots-Tag: noindex` |

- Signed URL TTL: **120 seconds** (`signedUrlTtlSeconds` in `src/data/resellerAppBundles.json`), minted per request with the service-role client.
- The storage object path **always comes from the manifest entry** for the allowlisted app; the caller-supplied `appId` is never interpolated into a path, so directory traversal is impossible.
- Identifiers are never accepted from the client: entitlements are resolved for the authenticated Clerk `userId` only, and the route exposes no POST handler.

### 1.6 Academy gating — `app/academy/reseller/page.tsx`, `components/reseller/ResellerAcademyView.tsx`

- `app/academy/reseller/page.tsx` is the server-side gate: signed-out visitors are redirected to `/sign-in?redirect_url=/academy/reseller`; signed-in users are checked with `canAccessTraining` (`apps_studio_training` only) and served all existing Academy tracks via `getAllTracks()`.
- Entitled users see the existing Academy course UI plus an honest "content pending" panel listing the 5 required-but-unproduced reseller modules from `src/data/resellerTrainingCurriculum.json`; unentitled users see a locked panel naming the missing entitlement and the $400 upgrade option.
- Existing Academy content (`src/content/academy/**`, tracks `02-ai-filmmaking` … `11-ai-print-on-demand-and-merch`) is real and reused; only the reseller-specific modules are pending.

### 1.7 Marketplace UI — `packages/studio/src/components/AppsStudio.jsx` (modified, uncommitted)

- Package cards for DIY ($197) and Apps + Training ($597, featured) plus the $400 upgrade CTA, wired to the real endpoints above. `503` renders a disabled state with the missing-config list; `409` renders `ALREADY_TRAINING` / `UPGRADE_NOT_ELIGIBLE` in plain language; every other failure renders a retryable inline error.
- Each app card links to its deployment guide (`/reseller/deployment#app-<id>`, `deploymentGuideUrl`), its repo, its live demo when one exists, and a Vercel import URL built from the real repo URL (`vercelImportUrl`).

### 1.8 Customer deployment guide — `components/reseller/DeploymentCenter.jsx`, `app/reseller/deployment/page.js`

- Per-app instructions: create the customer's own Supabase project, create one isolated Postgres schema per app (e.g. `ai_headshot_studio`), apply that app's reviewed migrations in order inside its schema, set `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` client-side and `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` server-side, deploy to the customer's own Vercel account.
- Explicit rule, quoted from the page: **"Never the production database. Do not point a reseller app at the SmartVideo GO / VideoRemix production Supabase project, and never reuse its service-role key. That database holds live customer data."** See architecture notes below.

### 1.9 Migrations (uncommitted, untracked — review before production)

| File | Contents |
| --- | --- |
| `supabase/migrations/20261012000000_create_reseller_commerce.sql` | `public.reseller_purchases` table (email, package_id, entitlement_keys jsonb, stripe_session_id, stripe_customer_id, amount_total, currency, status); unique indexes on `stripe_session_id` and `(clerk_user_id, package_id)` (the idempotency keys); email/clerk_user_id indexes; RLS enabled with policy "Users can view own reseller purchases" keyed on `current_setting('app.clerk_user_id', true)` |
| `supabase/migrations/20261012000000_reseller_app_bundles_bucket.sql` | Inserts the **private** bucket `reseller-app-bundles` (`public = false`); adds policy "deny public read reseller bundles" on `storage.objects` denying `anon`/`authenticated` selects for that bucket (defense in depth if the dashboard flips `public`); the service role bypasses it and is the only path that can mint signed URLs |

### 1.10 Honest gap manifests (no fabricated content)

- `src/data/resellerAppBundles.json`: the 38-app download allowlist, bucket `reseller-app-bundles`, `bucketVisibility: private`, TTL 120 s. **All 76 artifacts (38 × source-zip + setup-docs) are `status: "missing"` with `sha256: null`** — no checksums invented. Downloads correctly return `503 BUNDLE_NOT_AVAILABLE` until the zips and setup docs are produced and uploaded.
- `src/data/resellerTrainingCurriculum.json`: the 5 required training modules, all `status: "missing"`, each with its `requiredArtifacts` list. No lesson markdown, videos, or links exist yet, and none were invented; the Academy page renders this as a "content pending" panel.

### 1.11 Tests (uncommitted, untracked — owned by another agent; not edited by this doc)

- `tests/reseller-access.vitest.test.ts` — entitlement isolation (user A/B), allowlist + traversal rejection, inactive-status handling, training gap/upgrade math, manifest integrity (38 apps, no invented checksums), signed-URL behavior (private bucket, short TTL, unconfigured/missing/sign-failed paths), resolver fallback.
- `tests/reseller-download-route.vitest.test.ts` — full route contract: 401/400/404/403/302/503 matrix, cross-user spoofing rejection, no POST handler.
- `app/api/reseller/checkout.test.ts`, `app/api/reseller/upgrade.test.ts` — 503 unconfigured contract, 400 unknown package, session creation with configured price ids, 401/409 upgrade guards.
- `src/lib/reseller/entitlements.test.ts`, `src/lib/reseller/packages.test.ts` — package/price/env plumbing.
- `vitest.config.ts` (modified) adds `app/api/reseller/**/*.test.{js,jsx,ts,tsx}` to the include list so the route tests run.

## 2. Still missing / external blockers

These are the exact items the code reports as unconfigured or unfinished. Values are deliberately not invented here.

1. **Stripe products + price IDs + env vars.** Create three one-time Payment products/prices in Stripe ($197 DIY, $597 Apps + Training, $400 upgrade) and set: `STRIPE_SECRET_KEY`, `RESELLER_STRIPE_PRICE_DIY`, `RESELLER_STRIPE_PRICE_TRAINING`, `RESELLER_STRIPE_PRICE_UPGRADE`. Until then checkout and upgrade return `503 RESELLER_STRIPE_NOT_CONFIGURED` (with the missing list) and the UI disables the CTAs. Also set `NEXT_PUBLIC_APP_URL` so success/cancel URLs point at production (the routes fall back to the request `Origin`, then `http://localhost:3000`).
2. **Private storage bucket + Supabase configuration.** Apply `supabase/migrations/20261012000000_reseller_app_bundles_bucket.sql` to create the private `reseller-app-bundles` bucket, and set `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` on the server (optional bucket override: `RESELLER_BUNDLES_BUCKET`). Until then downloads return `503 STORAGE_NOT_CONFIGURED`.
3. **Bundle artifacts.** Produce and upload each app's `source-zip` + setup docs to the bucket, then flip the manifest entries in `src/data/resellerAppBundles.json` from `status: "missing"` to `"available"` and record real `sha256` values (currently 76/76 missing → `503 BUNDLE_NOT_AVAILABLE`).
4. **Training curriculum content.** Produce the 5 modules listed in `src/data/resellerTrainingCurriculum.json` (lesson markdown under `src/content/academy/<track>/lessons/`, walkthrough videos hosted outside the repo, per-app setup docs), then flip their status to `"available"`. Until then `/academy/reseller` shows the "content pending" panel — by design, not a bug.
5. **Vercel projects.** Each of the 37 demo apps has its own Vercel project/deployment; customers deploy from their own accounts via the import flow. No deployment automation is owned by this repo.
6. **DB migrations need review/approval before production.** Both migration files in §1.9 are new, uncommitted, and must be reviewed and applied to the production Supabase project (the webhook depends on `reseller_purchases`; downloads depend on the bucket + RLS policies). Applying migrations to the production database is an external, human-approval step.

## 3. Architecture notes (security model)

- **Server-side entitlement checks only.** Every protected route resolves entitlements from the Clerk session server-side (`auth()` in the download route; `getResellerUserState`/`resolveResellerEntitlements` server-side in the upgrade route and webhook). No entitlement decision is ever taken from client-supplied data; the download route exposes no POST handler and ignores any user identifier in the request.
- **Allowlist before authorization.** Unknown app ids (including traversal payloads such as `../../x`) are rejected with 404 before any entitlement lookup, and storage object paths are only ever read from the manifest entry — the client-supplied id is never interpolated into a path.
- **Short-lived signed URLs, private bucket only.** Bundles are served exclusively by 302 redirects to 120-second signed URLs minted with the service role against a bucket created `public = false`, with an explicit deny-select policy for `anon`/`authenticated` on `storage.objects` as defense in depth. There are no public paths and no predictable URLs. Responses set `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
- **Upgrade idempotency.** `evaluateUpgradeEligibility` blocks `ALREADY_TRAINING` (409) and not-eligible callers (402) before any Stripe call; `applyResellerPurchase` is additive (already-granted entitlements are skipped); and the `reseller_purchases` unique index on `stripe_session_id` makes repeated webhook deliveries no-ops (`23505` → `duplicatePurchase`). The webhook's reseller branch returns immediately, leaving non-reseller price handling untouched.
- **Customer deployments use their own Supabase project — never the VideoRemix production DB.** The Deployment Center instructs customers to create their own Supabase project with one isolated Postgres schema per activated app, apply only that app's reviewed migrations inside its schema, and keep the service-role key server-side. It states explicitly: do not point a reseller app at the SmartVideo GO / VideoRemix production Supabase project and never reuse its service-role key — that database holds live customer data. The reseller platform's own `user_entitlements` / `reseller_purchases` tables live only in the VideoRemix production database and are never exposed to customer apps; bundles flow out through the private bucket, not through customer-facing database access.

## 4. How to verify this document

Read-only checks, run from the redesign worktree:

```bash
# Package prices, entitlement keys, and env var names:
grep -n "priceCents\|RESELLER_ENTITLEMENTS\|RESELLER_PRICE_ENV_KEYS\|STRIPE_SECRET" src/lib/reseller/packages.ts

# Route contracts (status codes and error names):
grep -n "RESELLER_STRIPE_NOT_CONFIGURED\|UNKNOWN_APP\|NOT_ENTITLED\|ALREADY_TRAINING\|UPGRADE_NOT_ELIGIBLE\|signedUrl" \
  app/api/reseller/*/route.ts src/lib/resellerStorage.ts src/lib/reseller/entitlements.ts

# Webhook additive branch:
git diff app/api/webhooks/stripe/route.ts | grep -n "reseller\|Reseller"

# Academy gate:
cat app/academy/reseller/page.tsx

# Migrations (the two new files):
ls supabase/migrations/ | grep 20261012000000
cat supabase/migrations/20261012000000_create_reseller_commerce.sql
cat supabase/migrations/20261012000000_reseller_app_bundles_bucket.sql

# Honest gap state (all artifacts and training modules still 'missing'):
node -e "const m=require('./src/data/resellerAppBundles.json');console.log(m.apps.length,'apps;',m.apps.flatMap(a=>a.artifacts).filter(x=>x.status==='missing').length,'of',m.apps.length*2,'artifacts missing; bucket',m.bucket,'private ttl',m.signedUrlTtlSeconds)"
node -e "const c=require('./src/data/resellerTrainingCurriculum.json');console.log(c.modules.map(m=>m.id+':'+m.status).join(', '))"

# The never-production-DB rule in the customer guide:
grep -n "Never the production database" components/reseller/DeploymentCenter.jsx
```
