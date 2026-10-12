# Apps Link Audit — BEFORE-and-AFTER for all 38 marketplace apps

**Branch:** `redesign/apps-studio-marketplace` @ `487ce0c81` (PR #48) · **Generated:** 2026-10-12
**Scope:** every customer-facing link (GitHub source, live demo, download destination, Vercel import) rendered by the Apps Studio reseller collection.

## Sources inspected

| Source | What it holds |
|---|---|
| `packages/studio/src/components/AppsStudio.jsx` | `APPS` array (38 apps; `id`, `name`, `repo`, `hosted`, `thumbnail`) — lines 9–351. Exported as `RESELLER_APPS` (line 378). |
| `src/data/resellerAppBundles.json` | Download/bundle manifest: 38 apps with upstream `repo` URLs and Supabase object paths (lines 12–826). Source of truth for the download route allowlist. |
| `docs/reseller-deployment-manifest.md` | Deploy guide / manifest table (rows 53–90) mapping each app to its `deangilmoreremix` destination repo. |
| `components/reseller/DeploymentCenter.jsx` | Per-app cards on `/reseller/deployment` rendering source repo, live demo, Vercel import, and download route (lines 416–443). |
| `app/reseller/deployment/page.js` | Route shell rendering `DeploymentCenter`. |
| `app/api/reseller/download/route.ts` | `GET /api/reseller/download?app=<appId>` — allowlist gate, entitlement gate, 302 to signed Supabase URL. |
| `src/lib/resellerAccess.ts`, `src/lib/resellerStorage.ts` | Manifest consumers: appId allowlist, bundle object paths, signed-URL minting. |

## Verification method (live, 2026-10-12)

- Destination repos: `gh api repos/deangilmoreremix/<name>` for each of the 38 upstream repo names — **38/38 resolve** (HTTP 200 each; `private=false` for all). Fork parent and exact casing recorded from the API response. (GitHub resolves names case-insensitively; the casing in the *Destination repo* column is what the API returned.)
- Demo URLs: `curl -sL` — **37/37 → HTTP 200**. `ai-youtube-shorts-generator` has no demo URL.

## Master table (AppsStudio order)

Legend — **Demo status**: upstream `*.vercel.app` deployment, live 200. **Destination content**: `fork` = fork of the upstream repo · `source` = created with full upstream source (MIT LICENSE + NOTICE added) · `attrib-only` = created with README + NOTICE only, source withheld pending license confirmation.

| # | App name | App id (slug) | GitHub URL rendered today (customer-facing) | Live demo (current) | Vercel.app URL found? | Download destination (current) | Correct destination (`deangilmoreremix`) — live verification |
|---|---|---|---|---|---|---|---|
| 1 | AI Headshot Studio | `ai-headshot-studio` | `github.com/SamurAIGPT/ai-headshot-generator` (AppsStudio.jsx:15 · bundles.json:12 · manifest row 53) | https://ai-headshot-generator-xi.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-headshot-studio` → bucket `reseller-app-bundles`, `bundles/ai-headshot-studio/ai-headshot-studio-source.zip` (missing → 503) | `deangilmoreremix/ai-headshot-generator` — 200, public, **fork** of `SamurAIGPT/ai-headshot-generator` (pushed 2026-07-01, stale) |
| 2 | Nano Banana Studio | `nano-banana-studio` | `github.com/SamurAIGPT/nano-banana-generator` (AppsStudio.jsx:24 · bundles.json:34 · manifest row 54) | https://nano-banana-generator.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=nano-banana-studio` → `bundles/nano-banana-studio/…` (missing → 503) | `deangilmoreremix/nano-banana-generator` — 200, public, **fork** (pushed 2026-04-16, stale) |
| 3 | Seedance V2 Studio | `seedance-v2-studio` | `github.com/SamurAIGPT/seedance-2-generator` (AppsStudio.jsx:33 · bundles.json:56 · manifest row 55) | https://seedance-2-generator.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=seedance-v2-studio` → `bundles/seedance-v2-studio/…` (missing → 503) | `deangilmoreremix/seedance-2-generator` — 200, public, **fork** (pushed 2026-04-16, stale) |
| 4 | AI Clipping Studio | `ai-clipping-studio` | `github.com/SamurAIGPT/ai-clipping-generator` (AppsStudio.jsx:42 · bundles.json:78 · manifest row 56) | https://ai-clipping-generator.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-clipping-studio` → `bundles/ai-clipping-studio/…` (missing → 503) | `deangilmoreremix/ai-clipping-generator` — 200, public, **source** repo (full upstream source, MIT LICENSE + NOTICE) |
| 5 | AI YouTube Shorts Generator | `ai-youtube-shorts-generator` | `github.com/SamurAIGPT/AI-Youtube-Shorts-Generator` (AppsStudio.jsx:51 + thumbnail raw.githubusercontent URL :52 · bundles.json:100 · manifest row 57) | **None — no demo exists** | No | `/api/reseller/download?app=ai-youtube-shorts-generator` → `bundles/ai-youtube-shorts-generator/…` (missing → 503) | `deangilmoreremix/AI-Youtube-Shorts-Generator` — 200, public, **fork** of `Anil-matcha/AI-Youtube-Shorts-Generator` (pushed 2025-02-13, ~20 months stale; same lineage as the SamurAIGPT original) |
| 6 | EasyVeo Studio | `easyveo-studio` | `github.com/SamurAIGPT/veo4-video-generator` (AppsStudio.jsx:59 · bundles.json:122 · manifest row 58) | https://veo4-video-generator.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=easyveo-studio` → `bundles/easyveo-studio/…` (missing → 503) | `deangilmoreremix/veo4-video-generator` — 200, public, **source** repo (LICENSE + NOTICE added by us — upstream has no LICENSE) |
| 7 | Pet Product Studio | `pet-product-studio` | `github.com/SamurAIGPT/pet-product-studio` (AppsStudio.jsx:68 · bundles.json:144 · manifest row 59) | https://pet-product-studio.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=pet-product-studio` → `bundles/pet-product-studio/…` (missing → 503) | `deangilmoreremix/pet-product-studio` — 200, public, **source** repo (LICENSE + NOTICE added by us) |
| 8 | Resale Photo Enhancer | `resale-photo-enhancer` | `github.com/SamurAIGPT/resale-photo-enhancer` (AppsStudio.jsx:77 · bundles.json:166 · manifest row 60) | https://resale-photo-enhancer.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=resale-photo-enhancer` → `bundles/resale-photo-enhancer/…` (missing → 503) | `deangilmoreremix/resale-photo-enhancer` — 200, public, **source** repo (LICENSE + NOTICE added by us) |
| 9 | Blogger CMS | `blogger-cms` | `github.com/SamurAIGPT/blogger-cms` (AppsStudio.jsx:86 · bundles.json:188 · manifest row 61) | https://blogger-cms-psi.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=blogger-cms` → `bundles/blogger-cms/…` (missing → 503) | `deangilmoreremix/blogger-cms` — 200, public, **source** repo (LICENSE + NOTICE added by us) |
| 10 | Amazon Product Studio | `amazon-product-studio` | `github.com/SamurAIGPT/amazon-product-studio` (AppsStudio.jsx:95 · bundles.json:210 · manifest row 62) | https://amazon-product-studio.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=amazon-product-studio` → `bundles/amazon-product-studio/…` (missing → 503) | `deangilmoreremix/amazon-product-studio` — 200, public, **attrib-only** (source withheld pending license) |
| 11 | AI Business Card | `ai-business-card` | `github.com/SamurAIGPT/ai-business-card` (AppsStudio.jsx:104 · bundles.json:232 · manifest row 63) | https://ai-business-card-ten.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-business-card` → `bundles/ai-business-card/…` (missing → 503) | `deangilmoreremix/ai-business-card` — 200, public, **fork** (pushed 2026-07-20, slightly stale) |
| 12 | MailWise | `mailwise` | `github.com/SamurAIGPT/mail-wise` (AppsStudio.jsx:113 · bundles.json:254 · manifest row 64) | https://mail-wise-khaki.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=mailwise` → `bundles/mailwise/…` (missing → 503) | `deangilmoreremix/mail-wise` — 200, public, **attrib-only** |
| 13 | My Podcast | `my-podcast` | `github.com/SamurAIGPT/my-podcast` (AppsStudio.jsx:122 · bundles.json:276 · manifest row 65) | https://my-podcast.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=my-podcast` → `bundles/my-podcast/…` (missing → 503) | `deangilmoreremix/my-podcast` — 200, public, **attrib-only** |
| 14 | AI Knowledge Base | `ai-knowledge-base` | `github.com/SamurAIGPT/ai-knowledge-base` (AppsStudio.jsx:131 · bundles.json:298 · manifest row 66) | https://ai-knowledge-base-six.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-knowledge-base` → `bundles/ai-knowledge-base/…` (missing → 503) | `deangilmoreremix/ai-knowledge-base` — 200, public, **attrib-only** |
| 15 | AI Royal Portrait | `ai-royal-portrait` | `github.com/SamurAIGPT/ai-royal-portrait` (AppsStudio.jsx:140 · bundles.json:320 · manifest row 67) | https://ai-royal-portrait.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-royal-portrait` → `bundles/ai-royal-portrait/…` (missing → 503) | `deangilmoreremix/ai-royal-portrait` — 200, public, **attrib-only** |
| 16 | AI MEME | `ai-meme` | `github.com/SamurAIGPT/ai-meme-generator` (AppsStudio.jsx:149 · bundles.json:342 · manifest row 68) | https://ai-meme-generator.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-meme` → `bundles/ai-meme/…` (missing → 503) | `deangilmoreremix/ai-meme-generator` — 200, public, **attrib-only** |
| 17 | AI Real Estate Stager | `ai-real-estate-stager` | `github.com/SamurAIGPT/ai-real-estate-stager` (AppsStudio.jsx:158 · bundles.json:364 · manifest row 69) | https://ai-real-estate-stager.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-real-estate-stager` → `bundles/ai-real-estate-stager/…` (missing → 503) | `deangilmoreremix/ai-real-estate-stager` — 200, public, **fork** (pushed 2026-06-16, stale) |
| 18 | AI Logo | `ai-logo` | `github.com/SamurAIGPT/ai-logo-studio` (AppsStudio.jsx:167 · bundles.json:386 · manifest row 70) | https://ai-logo-studio.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-logo` → `bundles/ai-logo/…` (missing → 503) | `deangilmoreremix/ai-logo-studio` — 200, public, **fork** (pushed 2026-07-01, stale) |
| 19 | OldPhoto | `oldphoto` | `github.com/SamurAIGPT/old-photo-restore` (AppsStudio.jsx:176 · bundles.json:408 · manifest row 71) | https://old-photo-restore.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=oldphoto` → `bundles/oldphoto/…` (missing → 503) | `deangilmoreremix/old-photo-restore` — 200, public, **attrib-only** |
| 20 | AITryOn | `aitryon` | `github.com/SamurAIGPT/ai-tryon` (AppsStudio.jsx:185 · bundles.json:430 · manifest row 72) | https://ai-tryon-smoky.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=aitryon` → `bundles/aitryon/…` (missing → 503) | `deangilmoreremix/ai-tryon` — 200, public, **attrib-only** |
| 21 | AI Professional Makeup Generator | `ai-professional-makeup-generator` | `github.com/SamurAIGPT/ai-professional-makeup-generator` (AppsStudio.jsx:194 · bundles.json:452 · manifest row 73) | https://ai-professional-makeup-generator.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-professional-makeup-generator` → `bundles/ai-professional-makeup-generator/…` (missing → 503) | `deangilmoreremix/ai-professional-makeup-generator` — 200, public, **attrib-only** |
| 22 | AI Group Photo | `ai-group-photo` | `github.com/SamurAIGPT/ai-group-photo` (AppsStudio.jsx:203 · bundles.json:474 · manifest row 74) | https://ai-group-photo-mocha.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-group-photo` → `bundles/ai-group-photo/…` (missing → 503) | `deangilmoreremix/ai-group-photo` — 200, public, **attrib-only** |
| 23 | AI Tattoo Try-On | `ai-tattoo-try-on` | `github.com/SamurAIGPT/ai-tattoo-try-on` (AppsStudio.jsx:212 · bundles.json:496 · manifest row 75) | https://ai-tattoo-try-on.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-tattoo-try-on` → `bundles/ai-tattoo-try-on/…` (missing → 503) | `deangilmoreremix/ai-tattoo-try-on` — 200, public, **attrib-only** |
| 24 | AI Hair Style Simulator | `ai-hair-style-simulator` | `github.com/SamurAIGPT/ai-hair-style-simulator` (AppsStudio.jsx:221 · bundles.json:518 · manifest row 76) | https://ai-hair-style-simulator.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-hair-style-simulator` → `bundles/ai-hair-style-simulator/…` (missing → 503) | `deangilmoreremix/ai-hair-style-simulator` — 200, public, **attrib-only** |
| 25 | AI Kids-to-Adult Prediction | `ai-kids-to-adult-prediction` | `github.com/SamurAIGPT/ai-kid-to-adult-prediction` (AppsStudio.jsx:230 · bundles.json:540 · manifest row 77) | https://ai-kid-to-adult-prediction.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-kids-to-adult-prediction` → `bundles/ai-kids-to-adult-prediction/…` (missing → 503) | `deangilmoreremix/ai-kid-to-adult-prediction` — 200, public, **attrib-only** |
| 26 | AI Room Declutter | `ai-room-declutter` | `github.com/SamurAIGPT/ai-room-declutter` (AppsStudio.jsx:239 · bundles.json:562 · manifest row 78) | https://ai-room-declutter.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-room-declutter` → `bundles/ai-room-declutter/…` (missing → 503) | `deangilmoreremix/ai-room-declutter` — 200, public, **attrib-only** |
| 27 | AI Fitness Body Simulator | `ai-fitness-body-simulator` | `github.com/SamurAIGPT/ai-fitness-body-simulator` (AppsStudio.jsx:248 · bundles.json:584 · manifest row 79) | https://ai-fitness-body-simulator.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-fitness-body-simulator` → `bundles/ai-fitness-body-simulator/…` (missing → 503) | `deangilmoreremix/ai-fitness-body-simulator` — 200, public, **attrib-only** |
| 28 | AI Pet Portrait | `ai-pet-portrait` | `github.com/SamurAIGPT/ai-pet-portrait` (AppsStudio.jsx:257 · bundles.json:606 · manifest row 80) | https://ai-pet-portrait.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-pet-portrait` → `bundles/ai-pet-portrait/…` (missing → 503) | `deangilmoreremix/ai-pet-portrait` — 200, public, **attrib-only** |
| 29 | AI Kissing Video Generator | `ai-kissing-video-generator` | `github.com/SamurAIGPT/ai-kissing-video-generator` (AppsStudio.jsx:266 · bundles.json:628 · manifest row 81) | https://ai-kissing-video-generator-amber.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-kissing-video-generator` → `bundles/ai-kissing-video-generator/…` (missing → 503) | `deangilmoreremix/ai-kissing-video-generator` — 200, public, **fork** (pushed 2026-07-20, slightly stale) |
| 30 | AI Travel Studio | `ai-travel-studio` | `github.com/SamurAIGPT/ai-travel-studio` (AppsStudio.jsx:275 · bundles.json:650 · manifest row 82) | https://ai-travel-studio.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-travel-studio` → `bundles/ai-travel-studio/…` (missing → 503) | `deangilmoreremix/ai-travel-studio` — 200, public, **attrib-only** |
| 31 | Prompt Architect | `prompt-architect` | `github.com/SamurAIGPT/prompt-architect` (AppsStudio.jsx:284 · bundles.json:672 · manifest row 83) | https://prompt-architect-one-nu.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=prompt-architect` → `bundles/prompt-architect/…` (missing → 503) | `deangilmoreremix/prompt-architect` — 200, public, **attrib-only** |
| 32 | ClearMark AI | `clearmark-ai` | `github.com/SamurAIGPT/clearmark-ai` (AppsStudio.jsx:293 · bundles.json:694 · manifest row 84) | https://clearmark-ai.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=clearmark-ai` → `bundles/clearmark-ai/…` (missing → 503) | `deangilmoreremix/clearmark-ai` — 200, public, **attrib-only** |
| 33 | AI Wedding Photo | `ai-wedding-photo` | `github.com/SamurAIGPT/ai-wedding-photo` (AppsStudio.jsx:302 · bundles.json:716 · manifest row 85) | https://ai-wedding-photo.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-wedding-photo` → `bundles/ai-wedding-photo/…` (missing → 503) | `deangilmoreremix/ai-wedding-photo` — 200, public, **attrib-only** |
| 34 | Social Post | `social-post` | `github.com/SamurAIGPT/social-post` (AppsStudio.jsx:311 · bundles.json:738 · manifest row 86) | https://social-post-woad.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=social-post` → `bundles/social-post/…` (missing → 503) | `deangilmoreremix/social-post` — 200, public, **fork** (pushed 2026-06-10, stale) |
| 35 | MagicSelf AI | `magicself-ai` | `github.com/SamurAIGPT/magicself-ai` (AppsStudio.jsx:320 · bundles.json:760 · manifest row 87) | https://magicself-ai.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=magicself-ai` → `bundles/magicself-ai/…` (missing → 503) | `deangilmoreremix/magicself-ai` — 200, public, **attrib-only** |
| 36 | AI Resume Builder | `ai-resume-builder` | `github.com/SamurAIGPT/ai-resume-builder` (AppsStudio.jsx:329 · bundles.json:782 · manifest row 88) | https://ai-resume-builder.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-resume-builder` → `bundles/ai-resume-builder/…` (missing → 503) | ⚠ **COLLISION** — `deangilmoreremix/AI-Resume-Builder` returned by the API: 200, public, **fork of `rrs301/AI-Resume-Builder`** (unrelated Vite/React template, pushed 2025-10-29). Case mismatch **and** wrong project: GitHub names are case-insensitive, so `deangilmoreremix/ai-resume-builder` resolves to this collision repo and the correct copy cannot exist under that exact name |
| 37 | GEO Checker | `geo-checker` | `github.com/SamurAIGPT/geo-checker` (AppsStudio.jsx:338 · bundles.json:804 · manifest row 89) | https://geo-checker-silk.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=geo-checker` → `bundles/geo-checker/…` (missing → 503) | `deangilmoreremix/geo-checker` — 200, public, **attrib-only** |
| 38 | AI Character Studio | `ai-character-studio` | `github.com/SamurAIGPT/ai-character-studio` (AppsStudio.jsx:347 · bundles.json:826 · manifest row 90) | https://ai-character-studio-beta.vercel.app/ (200) | Yes — hosted demo | `/api/reseller/download?app=ai-character-studio` → `bundles/ai-character-studio/…` (missing → 503) | `deangilmoreremix/ai-character-studio` — 200, public, **attrib-only** |

Every `repo` URL in all three sources currently points at the **upstream** owner `SamurAIGPT` (38/38); **zero** currently point at `deangilmoreremix`. Every download manifest entry carries the upstream `repo` even though delivery is keyed by `appId` only — the manifest `repo` field is informational and shipped to buyers, so it must be corrected too.

## Per-app mismatch counts (correct repo / wrong repo / missing / collision)

Counting by **destination repo name** (case-insensitive) at `deangilmoreremix/<upstream-name>`:

| Verdict | Count | Apps |
|---|---|---|
| **Correct repo exists at expected name** | **37** | all except `ai-resume-builder`: 8 forks of `SamurAIGPT/*` (`ai-headshot-generator`, `nano-banana-generator`, `seedance-2-generator`, `ai-business-card`, `ai-real-estate-stager`, `ai-logo-studio`, `ai-kissing-video-generator`, `social-post`) + 5 full-source repos (`ai-clipping-generator`, `veo4-video-generator`, `pet-product-studio`, `resale-photo-enhancer`, `blogger-cms`) + 1 lineage copy (`AI-Youtube-Shorts-Generator`, fork of `Anil-matcha/*`) + 23 attribution-only repos |
| **Collision (name taken by unrelated repo)** | **1** | `ai-resume-builder` → API returns `deangilmoreremix/AI-Resume-Builder`, fork of `rrs301/AI-Resume-Builder` — wrong project, casing mismatch |
| **Missing destination repo** | **0** | none — all 38 names resolve |
| **Wrong owner in rendered links** | **38** | all 38 apps render `SamurAIGPT` URLs customer-facing today |

Of the 37 correct-named destinations, only **14 hold matching source** (8 forks + 5 full-source + 1 lineage copy); **23 hold attribution only** (source withheld pending license confirmation), so the "correct URL" for those is right but not yet resale-ready. Forks are stale (last pushes 2026-04-16 … 2026-07-20; `AI-Youtube-Shorts-Generator` from 2025-02-13).

## Marketplace slug ≠ repo name (explicit mismatches — do not assume equality)

| App id (slug) | Repo name | Kind |
|---|---|---|
| `ai-headshot-studio` | `ai-headshot-generator` | studio → generator |
| `ai-clipping-studio` | `ai-clipping-generator` | studio → generator |
| `easyveo-studio` | `veo4-video-generator` | different name entirely |
| `ai-meme` | `ai-meme-generator` | missing `-generator` |
| `ai-logo` | `ai-logo-studio` | missing `-studio` |
| `oldphoto` | `old-photo-restore` | different name |
| `aitryon` | `ai-tryon` | different name |
| `mailwise` | `mail-wise` | hyphenation |
| `ai-kids-to-adult-prediction` | `ai-kid-to-adult-prediction` | kids vs kid |
| `ai-youtube-shorts-generator` | `AI-Youtube-Shorts-Generator` | casing |
| `ai-resume-builder` | `AI-Resume-Builder` (destination) | casing **plus** collision — GitHub returns the cxased name for a different project |

All other 27 app ids equal their repo names exactly (all lowercase).

## Which customer-facing actions render upstream SamurAIGPT URLs

**AppsStudio gallery cards** (`packages/studio/src/components/AppsStudio.jsx`) — every action that needs a repo uses `app.repo`, so **all 38 apps** expose upstream in:

- "Source Code" button — `href={app.repo}` at AppsStudio.jsx:954–962
- GitHub attribution footer link — `href={app.repo}` at AppsStudio.jsx:982–992
- "Deploy on Vercel" button — built from `app.repo` via `vercelImportUrl()` at AppsStudio.jsx:966–976 (function at 372–375); currently emits `vercel.com/new/import?repository-url=https://github.com/SamurAIGPT/…` for every app (all 38 repos pass the `github.com/` guard)
- "Live Demo" button and the thumbnail overlay link — `app.hosted` at AppsStudio.jsx:935–945 and 839–847 → all point at upstream `*.vercel.app` deployments

**Reseller Deployment Center** (`components/reseller/DeploymentCenter.jsx`) — per-app reference section iterates `RESELLER_APPS` (lines 416–443):

- "Source repository ↗" — `href={app.repo}` at DeploymentCenter.jsx:436 → upstream for all 38
- "Live demo ↗" — `href={app.hosted}` at DeploymentCenter.jsx:437 → upstream vercel.app for 37 (no demo for app 5)
- "Deploy on Vercel ↗" — `app.repo` embedded at DeploymentCenter.jsx:438 → upstream import URL for all 38
- Download instructions — `GET /api/reseller/download?app=<app-id>` at DeploymentCenter.jsx:230 and the per-app `?app={app.id}` value at DeploymentCenter.jsx:433 — route + appId, **not owner-dependent**

**Download manifest** (`src/data/resellerAppBundles.json`) — holds the same 38 upstream `repo` URLs (lines 12–826) surfaced through `src/lib/resellerAccess.ts` (`APPS_BY_ID`, line 109–111; `getResellerApp`, line 124) — informational only; the route (`app/api/reseller/download/route.ts:42–56`) and signer (`src/lib/resellerStorage.ts:84–121`) key strictly on `appId`, never on the repo URL.

**Nothing customer-facing renders a `deangilmoreremix` URL today.** The only deangilmoreremix URLs in the repo are inside `docs/reseller-deployment-manifest.md` (documentation, not rendered UI).

## Every place a vercel.app URL appears (source file:line)

Customer-facing code and tests:

- `packages/studio/src/components/AppsStudio.jsx` — 37 `hosted:` entries: lines **16, 25, 34, 43, 60, 69, 78, 87, 96, 105, 114, 123, 132, 141, 150, 159, 168, 177, 186, 195, 204, 213, 222, 231, 240, 249, 258, 267, 276, 285, 294, 303, 312, 321, 330, 339, 348** (app 5 `ai-youtube-shorts-generator`, entries at lines 47–53, has no hosted field)
- `packages/studio/src/components/AppsStudio.test.jsx` — lines **162, 176, 177, 178, 180, 181** (asserts `ai-headshot-generator-xi`, `geo-checker-silk`, `ai-group-photo-mocha` present; old `ai-headshot-generator` / `geo-checker` bare domains absent)
- `docs/reseller-deployment-manifest.md` — 37 occurrences (table column "Demo URL … Vercel URL", rows 53–90)
- `docs/apps-studio-demo-link-test-report.md` — 45 occurrences (lines 31–33, 35, 47–90, 109, 112, 115)

Note: the built `.next/` chunk cache also embeds these URLs, but it is a build artifact and not a source.

No `*.vercel.app` URL appears in `src/`, `components/` (outside the studio package), `app/`, or any route file. The only Vercel URL constructed by product code is the import deep link (`vercel.com/new/import?repository-url=…`), built from `app.repo` at `packages/studio/src/components/AppsStudio.jsx:374` and `components/reseller/DeploymentCenter.jsx:438`.

## Files that CONSUME link data (for the wiring agent)

Edit these (and only these) to re-point the collection:

| File | Lines that consume link data |
|---|---|
| `packages/studio/src/components/AppsStudio.jsx` | APPS `repo` fields: 15, 24, 33, 42, 51, 59, 68, 77, 86, 95, 104, 113, 122, 131, 140, 149, 158, 167, 176, 185, 194, 203, 212, 221, 230, 239, 248, 257, 266, 275, 284, 293, 302, 311, 320, 329, 338, 347 · APPS `hosted` fields: 16, 25, 34, 43, 60, 69, 78, 87, 96, 105, 114, 123, 132, 141, 150, 159, 168, 177, 186, 195, 204, 213, 222, 231, 240, 249, 258, 267, 276, 285, 294, 303, 312, 321, 330, 339, 348 (thumbnail raw GitHub URL at line 52 also needs the owner swap) · render sites: 589, 839/941, 947, 954, 966/968, 983 |
| `src/data/resellerAppBundles.json` | `repo` fields: 12, 34, 56, 78, 100, 122, 144, 166, 188, 210, 232, 254, 276, 298, 320, 342, 364, 386, 408, 430, 452, 474, 496, 518, 540, 562, 584, 606, 628, 650, 672, 694, 716, 738, 760, 782, 804, 826 (download routing keys off `id`, lines 9 etc. — do not rename ids) |
| `components/reseller/DeploymentCenter.jsx` | 3 (imports `RESELLER_APPS`), 416–443 (renders source/demo/Vercel/download per app; repo consumed at 436, 438) |

Read-only consumers that pin current URLs in tests — these will fail unless updated in the same change:

- `packages/studio/src/components/AppsStudio.test.jsx` — line 4 (imports `RESELLER_APPS`), lines 162, 176–181 (demo URLs), line 188 (`github.com/SamurAIGPT/AI-Youtube-Shorts-Generator` link), line 783 (deployment guide anchors)
- `tests/reseller-access.vitest.test.ts` — lines 111–123 (parses the 38 ids out of AppsStudio.jsx), lines 133–146 (re-reads the bundle manifest), line 84 (fixture repo URL)
- `components/reseller/ResellerPages.test.jsx` — line 29 (`/api/reseller/download?app=ai-headshot-studio`), line ~43 (expects 38 per-app cards)
- `tests/reseller-download-route.vitest.test.ts` — download-route contract (appId-based; no repo URLs)
- `app/api/reseller/download/route.ts` + `src/lib/resellerAccess.ts` + `src/lib/resellerStorage.ts` — consume `appId`/object paths only; **no repo URL changes needed**

## AFTER state (what the corrected wiring looks like)

1. `repo` for all 38 apps → `https://github.com/deangilmoreremix/<name>` exactly as the API returned it above (preserve casing: `AI-Youtube-Shorts-Generator`, `AI-Resume-Builder`-adjacent naming).
2. `ai-resume-builder` needs an owner decision before any URL can be written: the correct copy cannot live at `deangilmoreremix/ai-resume-builder` (case-insensitive collision). Candidate: create `deangilmoreremix/ai-resume-builder-studio` or repurpose the collision repo after license confirmation. **Do not invent a URL.**
3. Demo links stay on upstream `*.vercel.app` (all verified 200) but must be labeled as upstream demos, since zero customer-owned deployments exist; no customer Vercel deployment URL may be fabricated. `ai-youtube-shorts-generator` keeps no demo link (CLI-only, no web deployment).
4. Download destination is already correct and owner-independent: `GET /api/reseller/download?app=<appId>` → 302 signed URL (120 s TTL) in private bucket `reseller-app-bundles`. It currently answers 503 BUNDLE_NOT_AVAILABLE for every app because all 76 artifacts are `status=missing` in `src/data/resellerAppBundles.json`; bundle zips must be produced from the corrected `deangilmoreremix` repos and uploaded before downloads work.
5. Doc updates in the same pass: `docs/reseller-deployment-manifest.md` (destination-recomputed rows) and `docs/apps-studio-demo-link-test-report.md` (demo table) if the wiring changes anything they record.
