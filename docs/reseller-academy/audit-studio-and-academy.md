# Reseller Studio + Reseller Academy audit (Stage 0)

Read from the code on branch `claude/confident-brahmagupta-blzrn3` before any change.

## Reseller Studio / Deployment Center — what exists

| Capability | Where | Status |
|---|---|---|
| 38-app marketplace (`APPS` array → `RESELLER_APPS`) | `packages/studio/src/components/AppsStudio.jsx` (route `/studio/apps`, Clerk-protected) | Exists — preserve |
| Buttons: Try Live Demo, Deployment Guide, Source Code, Deploy on Vercel | `AppsStudio.jsx` card actions | Exists — preserve; add **one** "Learn How to Launch This App" link |
| Repo/Vercel eligibility data | `src/data/resellerDestinations.json` (37 verified, `ai-resume-builder` unconfigured, 13 `vercelDeploy: template`) | Exists — data owned by owner; not changed |
| Deployment Center (`/reseller/deployment`, public) | `components/reseller/DeploymentCenter.jsx` | Exists; Supabase section **does not match app code** (see repo-verification finding 1) → documented, not rewritten |
| Packages / checkout / upgrade / download / webhook | `app/api/reseller/**`, `app/api/webhooks/stripe/route.ts`, `src/lib/reseller/**` | Exists — **do not touch** |
| Entitlements | `src/lib/resellerAccess.ts` (`canAccessTraining`, `canDownloadSource`, `getResellerApp`), `src/access/**` | Exists — **do not touch** |
| Download bundles | `src/data/resellerAppBundles.json` (76/76 `missing`) | Owner action |

## Reseller Academy — what exists

| Capability | Where | Status |
|---|---|---|
| Server gate `/academy/reseller` (signed-out → sign-in; `canAccessTraining`; access-pending on error) | `app/academy/reseller/page.tsx` | Exists — unchanged |
| Locked / access-pending / content-pending panels | `components/reseller/ResellerAcademyView.tsx` | Locked + pending kept **verbatim**; content-pending panel replaced by the new learning UI **inside the entitled branch only** |
| Generic Academy (15 tracks, 158 markdown files, learn/see/create steps) | `components/academy/AcademyCourse.tsx`, `src/content/academy/**` | Exists — kept and still rendered for entitled users |
| Reseller curriculum | `src/data/resellerTrainingCurriculum.json` (5 modules, all `missing`) | Replaced by the 12-module curriculum; this file kept as the gap manifest and updated |
| Progress tracking | none | **New** (educational only; Supabase table + localStorage) |
| Per-app workshops | none | **New** route `/academy/reseller/apps/[appId]`, one template + data for 38 apps |
| Screenshots / videos | none for reseller flows | None fabricated; written steps + official links only |

## Hard rules honoured
No entitlement, purchase, checkout, webhook, or access-record code changed; progress data is never read by an access check; the migration is written but **not applied**.
