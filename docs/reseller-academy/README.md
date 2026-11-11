# Reseller Academy — Guided Launch Course (summary)

**Nothing existing was removed.** The existing `/academy/reseller` page (locked / access-pending / content-pending panels, AcademyCourse tracks) and the Reseller Studio keep all content and behaviour. Additions only:

| Addition | Where |
|---|---|
| Separate guided course page (same dark/cyan design, same gate) | `/academy/reseller/launch` (`app/academy/reseller/launch/page.tsx`) |
| Per-app workshop for all 38 apps | `/academy/reseller/apps/[appId]` |
| 12-module / 35-lesson curriculum (LEARN → FOLLOW → COMPLETE → VERIFY) | `src/content/resellerAcademy/` |
| Facts read from real app source (names only) + extractor | `src/data/resellerAppFacts.json`, `scripts/build-reseller-app-facts.mjs` |
| Educational progress (localStorage + API), **migration NOT applied** | `src/lib/resellerAcademyProgress.ts`, `app/api/reseller/academy/progress/route.ts`, `supabase/migrations/20261111000000_reseller_academy_progress.sql` |
| One link on the existing Academy page (8 added lines) and one "Learn How to Launch This App" link + card anchor on each Studio card (all 4 original buttons unchanged) | `ResellerAcademyView.tsx`, `AppsStudio.jsx`, `messages/{en,zh}/appsStudio.json` |

## Entitlements — unchanged
`git diff 5513772 -- src/lib/resellerAccess.ts src/lib/reseller src/access app/api/reseller/{checkout,upgrade,download} app/api/webhooks` is empty. `resellerAppBundles.json`, `resellerDestinations.json` and `resellerTrainingCurriculum.json` are unchanged. New routes call the existing `auth()` / `resolveResellerEntitlements` / `canAccessTraining` and show the existing locked / access-pending panels. Progress code does not import any access module (tested); the API returns 403 and writes nothing for non-entitled users.

## Test results (Vitest, jsdom)
- New `tests/reseller-academy.vitest.test.tsx` (15) and `app/api/reseller/academy/progress.test.ts` (3): 12 modules, lessons 7.1–7.5, no secrets/fake media in content, progress sanitising/merge/resume, all 38 workshops render, CopyBlock secret redaction, end-to-end journey (select app → complete lesson → reload → Continue Learning resumes at 1.2), API 401/403/200.
- Existing suites re-run unmodified: AppsStudio (66), ResellerPages, reseller-access, download route, checkout/upgrade — **177 tests passed**.
- `tsc --noEmit`: no errors in new/changed files.
- Not run here: Playwright browser/mobile e2e and live link-checking of the external docs links (no Clerk session/entitled test user available in this environment). Mobile drawers are implemented but only jsdom-tested.

## Owner actions (see also repo-verification.md)
1. Apply the progress migration after review (until then progress is browser-only; the API returns 503 and the UI falls back silently).
2. Deployment Center Supabase text does not match app code (apps use `DATABASE_URL` + `prisma db push`).
3. 24 apps' destination repos hold no source (facts upstream-derived); `ai-resume-builder` has no correct repo; `ai-youtube-shorts-generator` is a Python CLI; `oldphoto` demo returns 402.
4. Vercel button enabled for 13 apps only; flip `vercelDeploy` after source is published.
5. 76 download artifacts still `missing`.
6. No walkthrough videos or screenshots exist; none were fabricated (written steps + official links). Verify external doc URLs periodically.
7. Refunds/disputes do not auto-remove credits (apps handle only `checkout.session.completed`).
