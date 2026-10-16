# Reseller Deployment Manifest — 38 Apps Studio Apps

**Generated:** 2026-10-12 · **Updated:** 2026-10-12 (live destination recompute; 23 destination repos created; license findings re-verified)
**Source of truth:** `packages/studio/src/components/AppsStudio.jsx` (38 apps, branch `redesign/apps-studio-marketplace`)
**Reference collection:** <https://github.com/Anil-matcha/awesome-generative-ai-apps> (all 38 app repos are listed there)
**GitHub destination owner:** `deangilmoreremix`
**Upstream author:** `SamurAIGPT`

## Verification summary

| Check | Result |
|---|---|
| `gh auth status` | Authenticated as `deangilmoreremix`, scopes `gist, read:org, repo, workflow` |
| Unauthenticated GitHub API reachability | `https://api.github.com` → 200; `users/deangilmoreremix` → 200 |
| Upstream repos verified (`api.github.com/repos/SamurAIGPT/<name>`) | 38/38 OK (37× HTTP 200; `AI-Youtube-Shorts-Generator` 301 → 200 on redirect) |
| Demo URLs verified (curl, HTTP status) | 37/37 → HTTP 200 |
| Apps with no demo URL | 1 (`ai-youtube-shorts-generator`) |
| Destination repos existing before this run — **recomputed live 2026-10-12** (`GET /repos/deangilmoreremix/<name>`) | **15 at destination names**: 14 matching the upstream app (8 forks of `SamurAIGPT/<name>` + 5 created-with-source in an earlier run + 1 Anil-matcha-lineage copy for the YouTube app) + **1 true name-collision mismatch** (`ai-resume-builder` → existing `deangilmoreremix/AI-Resume-Builder` is a fork of `rrs301/AI-Resume-Builder`) |
| Destination repos created 2026-10-12 (this run) | **23** (all public, verified `private=false`, contents = `README.md` + `NOTICE.md` only — **source withheld pending license confirmation**) |
| Destination repos still to create | **0** — all 38 app names now have a destination repo |
| Customer-owned Vercel deployments | 0 (none created — no deployment is claimed as live) |

**License note (important):** verified live on 2026-10-12 by reading the GitHub API `license` field and the raw
`LICENSE` file of every upstream repo — **3 of 38** carry a LICENSE file:
`ai-headshot-generator` (MIT, © 2026 SamurAIGPT), `ai-clipping-generator` (MIT, © 2026 SamurAIGPT),
`AI-Youtube-Shorts-Generator` (MIT, © Anil Chandra Naidu Matcha). The other **35 upstream repos have NO
LICENSE file**; the MIT license is claimed only at the collection level (`awesome-generative-ai-apps`
README: "MIT licensed"). Repos created in the earlier run (source pushed) include an MIT `LICENSE`
(Copyright (c) 2026 SamurAIGPT) plus a `NOTICE.md` attribution file. **The 23 repos created on 2026-10-12
deliberately contain NO source and NO LICENSE file** — only an attribution `README.md` + `NOTICE.md`
stating that source is pending license confirmation. Verify licensing per app before resale.

**Shared standard environment set (36 of 38 Next.js SaaS apps)** — exact values taken from each app's
`.env.example` (source: upstream repos):

```
DATABASE_URL, DIRECT_URL                 # PostgreSQL (customer Supabase project)
NEXTAUTH_URL, NEXTAUTH_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
WEBHOOK_URL
STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
<APP_API_KEY>                            # MuAPI or model key, name varies per app
NEXT_PUBLIC_THEME                        # optional, only where listed below
```

`ai-real-estate-stager` has **no `.env.example` upstream**; its variables below are taken from its README
"Required Environment Variables" table. `ai-youtube-shorts-generator` is not a web app (see row 5).

## App table (AppsStudio order)

| # | App ID / Name | Upstream repo · License | Destination repo | Demo URL (verified 2026-10-12) | Vercel URL | Required env vars | Database setup | Deployment status |
|---|---|---|---|---|---|---|---|---|
| 1 | `ai-headshot-studio` / AI Headshot Studio | `SamurAIGPT/ai-headshot-generator` · MIT (LICENSE file present) | `deangilmoreremix/ai-headshot-generator` — exists (fork, last push 2026-07-01; upstream 2026-08-02 — **stale**, LICENSE present) | <https://ai-headshot-generator-xi.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `HEADSHOT_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `npx prisma db push` | Demo-only |
| 2 | `nano-banana-studio` / Nano Banana Studio | `SamurAIGPT/nano-banana-generator` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/nano-banana-generator` — exists (fork, last push 2026-04-16; upstream 2026-10-06 — **stale**, no LICENSE) | <https://nano-banana-generator.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `NANO_BANANA_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Demo-only |
| 3 | `seedance-v2-studio` / Seedance V2 Studio | `SamurAIGPT/seedance-2-generator` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/seedance-2-generator` — exists (fork, last push 2026-04-16; upstream 2026-10-06 — **stale**, no LICENSE) | <https://seedance-2-generator.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `SEEDANCE_V2_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Demo-only |
| 4 | `ai-clipping-studio` / AI Clipping Studio | `SamurAIGPT/ai-clipping-generator` · MIT (LICENSE file present) | `deangilmoreremix/ai-clipping-generator` — **CREATED 2026-10-12** (public, MIT LICENSE + NOTICE.md, full upstream source pushed) | <https://ai-clipping-generator.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `AICLIPS_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only (not deployed) |
| 5 | `ai-youtube-shorts-generator` / AI YouTube Shorts Generator | `SamurAIGPT/AI-Youtube-Shorts-Generator` · MIT (LICENSE file present, © Anil Chandra Naidu Matcha) | `deangilmoreremix/AI-Youtube-Shorts-Generator` — exists (fork of Anil-matcha copy, last push 2025-02-13; upstream 2026-10-11 — **stale ~20 months**, LICENSE present) | **None — no hosted demo and no DB demo** | None (no customer deployment) | `MUAPI_API_KEY` (API mode) **or** local mode: `LLM_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `LOCAL_WHISPER_MODEL`, `LOCAL_WHISPER_DEVICE`, `LOCAL_OUTPUT_DIR` | **None** — Python 3.10+ CLI (ffmpeg, faster-whisper, yt-dlp); persistence is local file output only | Blocked (no demo; CLI self-host only) |
| 6 | `easyveo-studio` / EasyVeo Studio | `SamurAIGPT/veo4-video-generator` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/veo4-video-generator` — **CREATED 2026-10-12** (public, full upstream source pushed; MIT LICENSE + NOTICE.md **added by us — upstream SamurAIGPT repo has no LICENSE file**) | <https://veo4-video-generator.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `VEO31_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only (not deployed) |
| 7 | `pet-product-studio` / Pet Product Studio | `SamurAIGPT/pet-product-studio` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/pet-product-studio` — **CREATED 2026-10-12** (public, full upstream source pushed; MIT LICENSE + NOTICE.md **added by us — upstream SamurAIGPT repo has no LICENSE file**) | <https://pet-product-studio.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `MUAPIAPP_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only (not deployed) |
| 8 | `resale-photo-enhancer` / Resale Photo Enhancer | `SamurAIGPT/resale-photo-enhancer` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/resale-photo-enhancer` — **CREATED 2026-10-12** (public, full upstream source pushed; MIT LICENSE + NOTICE.md **added by us — upstream SamurAIGPT repo has no LICENSE file**) | <https://resale-photo-enhancer.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `MUAPIAPP_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only (not deployed) |
| 9 | `blogger-cms` / Blogger CMS | `SamurAIGPT/blogger-cms` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/blogger-cms` — **CREATED 2026-10-12** (public, full upstream source pushed; MIT LICENSE + NOTICE.md **added by us — upstream SamurAIGPT repo has no LICENSE file**) | <https://blogger-cms-psi.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `MUAPIAPP_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only (not deployed) |
| 10 | `amazon-product-studio` / Amazon Product Studio | `SamurAIGPT/amazon-product-studio` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/amazon-product-studio> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://amazon-product-studio.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 11 | `ai-business-card` / AI Business Card | `SamurAIGPT/ai-business-card` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/ai-business-card` — exists (fork, last push 2026-07-20; upstream 2026-07-27 — slightly stale, no LICENSE) | <https://ai-business-card-ten.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `MUAPIAPP_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Demo-only |
| 12 | `mailwise` / MailWise | `SamurAIGPT/mail-wise` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/mail-wise> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://mail-wise-khaki.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MU_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 13 | `my-podcast` / My Podcast | `SamurAIGPT/my-podcast` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/my-podcast> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://my-podcast.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 14 | `ai-knowledge-base` / AI Knowledge Base | `SamurAIGPT/ai-knowledge-base` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-knowledge-base> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-knowledge-base-six.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MU_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 15 | `ai-royal-portrait` / AI Royal Portrait | `SamurAIGPT/ai-royal-portrait` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-royal-portrait> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-royal-portrait.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MU_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 16 | `ai-meme` / AI MEME | `SamurAIGPT/ai-meme-generator` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-meme-generator> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-meme-generator.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 17 | `ai-real-estate-stager` / AI Real Estate Stager | `SamurAIGPT/ai-real-estate-stager` · MIT (collection claim; **no LICENSE and no `.env.example` upstream** — vars from README) | `deangilmoreremix/ai-real-estate-stager` — exists (fork, last push 2026-06-16; upstream 2026-07-27 — stale, no LICENSE) | <https://ai-real-estate-stager.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `WEBHOOK_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, Stripe ×3, MuAPI key (per README) | Supabase Postgres required; Prisma, `prisma db push` | Demo-only |
| 18 | `ai-logo` / AI Logo | `SamurAIGPT/ai-logo-studio` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/ai-logo-studio` — exists (fork, last push 2026-07-01; upstream 2026-07-27 — stale, no LICENSE) | <https://ai-logo-studio.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Demo-only |
| 19 | `oldphoto` / OldPhoto | `SamurAIGPT/old-photo-restore` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/old-photo-restore> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://old-photo-restore.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY`, `NEXT_PUBLIC_THEME` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 20 | `aitryon` / AITryOn | `SamurAIGPT/ai-tryon` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-tryon> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-tryon-smoky.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 21 | `ai-professional-makeup-generator` / AI Professional Makeup Generator | `SamurAIGPT/ai-professional-makeup-generator` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-professional-makeup-generator> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-professional-makeup-generator.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 22 | `ai-group-photo` / AI Group Photo | `SamurAIGPT/ai-group-photo` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-group-photo> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-group-photo-mocha.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 23 | `ai-tattoo-try-on` / AI Tattoo Try-On | `SamurAIGPT/ai-tattoo-try-on` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-tattoo-try-on> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-tattoo-try-on.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 24 | `ai-hair-style-simulator` / AI Hair Style Simulator | `SamurAIGPT/ai-hair-style-simulator` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-hair-style-simulator> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-hair-style-simulator.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 25 | `ai-kids-to-adult-prediction` / AI Kids-to-Adult Prediction | `SamurAIGPT/ai-kid-to-adult-prediction` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-kid-to-adult-prediction> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-kid-to-adult-prediction.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 26 | `ai-room-declutter` / AI Room Declutter | `SamurAIGPT/ai-room-declutter` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-room-declutter> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-room-declutter.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 27 | `ai-fitness-body-simulator` / AI Fitness Body Simulator | `SamurAIGPT/ai-fitness-body-simulator` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-fitness-body-simulator> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-fitness-body-simulator.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 28 | `ai-pet-portrait` / AI Pet Portrait | `SamurAIGPT/ai-pet-portrait` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-pet-portrait> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-pet-portrait.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 29 | `ai-kissing-video-generator` / AI Kissing Video Generator | `SamurAIGPT/ai-kissing-video-generator` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/ai-kissing-video-generator` — exists (fork, last push 2026-07-20; upstream 2026-07-27 — slightly stale, no LICENSE) | <https://ai-kissing-video-generator-amber.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `MU_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Demo-only |
| 30 | `ai-travel-studio` / AI Travel Studio | `SamurAIGPT/ai-travel-studio` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-travel-studio> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-travel-studio.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 31 | `prompt-architect` / Prompt Architect | `SamurAIGPT/prompt-architect` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/prompt-architect> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://prompt-architect-one-nu.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MU_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 32 | `clearmark-ai` / ClearMark AI | `SamurAIGPT/clearmark-ai` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/clearmark-ai> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://clearmark-ai.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 33 | `ai-wedding-photo` / AI Wedding Photo | `SamurAIGPT/ai-wedding-photo` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-wedding-photo> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-wedding-photo.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 34 | `social-post` / Social Post | `SamurAIGPT/social-post` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/social-post` — exists (fork, last push 2026-06-10; upstream 2026-07-27 — stale, no LICENSE) | <https://social-post-woad.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `MU_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Demo-only |
| 35 | `magicself-ai` / MagicSelf AI | `SamurAIGPT/magicself-ai` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/magicself-ai> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://magicself-ai.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 36 | `ai-resume-builder` / AI Resume Builder | `SamurAIGPT/ai-resume-builder` · MIT (collection claim; no LICENSE file upstream) | `deangilmoreremix/AI-Resume-Builder` — **MISMATCH**: name-collision fork of `rrs301/AI-Resume-Builder` (Vite/React template, pushed 2025-10-29), **not** the SamurAIGPT Next.js app; no LICENSE | <https://ai-resume-builder.vercel.app/> → 200 | vercel.app demo (same URL); no customer deployment | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required (for correct copy); Prisma, `prisma db push` | Demo-only — needs correct upstream copy |
| 37 | `geo-checker` / GEO Checker | `SamurAIGPT/geo-checker` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/geo-checker> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://geo-checker-silk.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |
| 38 | `ai-character-studio` / AI Character Studio | `SamurAIGPT/ai-character-studio` · MIT (collection claim; no LICENSE file upstream) | <https://github.com/deangilmoreremix/ai-character-studio> — **CREATED 2026-10-12** (public; README + NOTICE attribution only — **source withheld pending license confirmation**) | <https://ai-character-studio-beta.vercel.app/> → 200 | None (customer-side / not created) | Standard + `MUAPIAPP_API_KEY` | Supabase Postgres required; Prisma, `prisma db push` | Repo-only — source pending license confirmation |

## Destination repos created (2026-10-12)

### Group A — created in an earlier 2026-10-12 run, full upstream source pushed (5)

All five are public, contain the **full unmodified upstream source** (all branches and tags pushed) plus a
distribution-only commit adding MIT `LICENSE` (© 2026 SamurAIGPT) and `NOTICE.md` attribution. Re-verified
live 2026-10-12 via `GET /repos/deangilmoreremix/<name>/contents` — each root still contains the upstream
tree (`.env.example`, `prisma/`, `src/`, `package.json`, `README.md`) plus `LICENSE` and `NOTICE.md`:

1. <https://github.com/deangilmoreremix/ai-clipping-generator> — API 200, public; upstream is MIT-licensed
2. <https://github.com/deangilmoreremix/veo4-video-generator> — API 200, public
3. <https://github.com/deangilmoreremix/pet-product-studio> — API 200, public
4. <https://github.com/deangilmoreremix/resale-photo-enhancer> — API 200, public
5. <https://github.com/deangilmoreremix/blogger-cms> — API 200, public

### Group B — created 2026-10-12, source withheld pending license confirmation (23)

Created public with the upstream repo description; each contains **only** `README.md` + `NOTICE.md`
(attribution + "source pending license confirmation" status — no application source, no LICENSE file,
because none of these 23 upstream repos has a verifiable license). All verified live:
`gh api repos/deangilmoreremix/<name>` → HTTP 200, `private=false`, `visibility=public`, contents =
`NOTICE.md, README.md`.

`amazon-product-studio`, `mail-wise`, `my-podcast`, `ai-knowledge-base`, `ai-royal-portrait`,
`ai-meme-generator`, `old-photo-restore`, `ai-tryon`, `ai-professional-makeup-generator`, `ai-group-photo`,
`ai-tattoo-try-on`, `ai-hair-style-simulator`, `ai-kid-to-adult-prediction`, `ai-room-declutter`,
`ai-fitness-body-simulator`, `ai-pet-portrait`, `ai-travel-studio`, `prompt-architect`, `clearmark-ai`,
`ai-wedding-photo`, `magicself-ai`, `geo-checker`, `ai-character-studio`

URLs (all `https://github.com/deangilmoreremix/<name>`):

- [amazon-product-studio](https://github.com/deangilmoreremix/amazon-product-studio)
- [mail-wise](https://github.com/deangilmoreremix/mail-wise)
- [my-podcast](https://github.com/deangilmoreremix/my-podcast)
- [ai-knowledge-base](https://github.com/deangilmoreremix/ai-knowledge-base)
- [ai-royal-portrait](https://github.com/deangilmoreremix/ai-royal-portrait)
- [ai-meme-generator](https://github.com/deangilmoreremix/ai-meme-generator)
- [old-photo-restore](https://github.com/deangilmoreremix/old-photo-restore)
- [ai-tryon](https://github.com/deangilmoreremix/ai-tryon)
- [ai-professional-makeup-generator](https://github.com/deangilmoreremix/ai-professional-makeup-generator)
- [ai-group-photo](https://github.com/deangilmoreremix/ai-group-photo)
- [ai-tattoo-try-on](https://github.com/deangilmoreremix/ai-tattoo-try-on)
- [ai-hair-style-simulator](https://github.com/deangilmoreremix/ai-hair-style-simulator)
- [ai-kid-to-adult-prediction](https://github.com/deangilmoreremix/ai-kid-to-adult-prediction)
- [ai-room-declutter](https://github.com/deangilmoreremix/ai-room-declutter)
- [ai-fitness-body-simulator](https://github.com/deangilmoreremix/ai-fitness-body-simulator)
- [ai-pet-portrait](https://github.com/deangilmoreremix/ai-pet-portrait)
- [ai-travel-studio](https://github.com/deangilmoreremix/ai-travel-studio)
- [prompt-architect](https://github.com/deangilmoreremix/prompt-architect)
- [clearmark-ai](https://github.com/deangilmoreremix/clearmark-ai)
- [ai-wedding-photo](https://github.com/deangilmoreremix/ai-wedding-photo)
- [magicself-ai](https://github.com/deangilmoreremix/magicself-ai)
- [geo-checker](https://github.com/deangilmoreremix/geo-checker)
- [ai-character-studio](https://github.com/deangilmoreremix/ai-character-studio)

**Procedure to add source once licensing is confirmed** (mirrors Group A, per repo):

```bash
git clone https://github.com/SamurAIGPT/<name>.git && cd <name>
# once a license grant is confirmed, add LICENSE (per the confirmed terms) + NOTICE.md attribution
git add LICENSE NOTICE.md && git commit -m "Add LICENSE and attribution notice for reseller distribution"
git remote add dest https://github.com/deangilmoreremix/<name>.git
git push dest --all && git push dest --tags
gh api repos/deangilmoreremix/<name>   # expect HTTP 200, private=false
```

## Destination status recomputed live (2026-10-12)

Method: `gh api` / direct `GET /repos/deangilmoreremix/<name>` for each of the 38 upstream repo names from
`AppsStudio.jsx` (GitHub repo names are case-insensitive), plus `GET /repos/SamurAIGPT/<name>` for license
and lineage, plus `GET /repos/deangilmoreremix/repos?per_page=100` paginated (359 repos) for cross-checking.

| Status | Before this run | After this run |
|---|---|---|
| EXISTS-PUBLIC (destination repo exists publicly at the app's name) | 14 | 37 |
| EXISTS-PRIVATE | 0 | 0 |
| MISMATCH (name occupied by an unrelated repo) | 1 (`ai-resume-builder`) | 1 (`ai-resume-builder` — unchanged, see flags) |
| MISSING | 23 | 0 |

Of the 37 public destination repos after this run, **14 contain matching app source** (8 forks + 5 Group-A
repos + the Anil-matcha-lineage YouTube copy); the **23 created 2026-10-12 contain attribution only**
(`README.md` + `NOTICE.md`) because their upstream repos have no verifiable license.

The 14 pre-existing matching repos: 8 forks of `SamurAIGPT/<name>` (`ai-headshot-generator`,
`nano-banana-generator`, `seedance-2-generator`, `ai-business-card`, `ai-real-estate-stager`,
`ai-logo-studio`, `ai-kissing-video-generator`, `social-post`), the 5 Group-A repos above, and
`AI-Youtube-Shorts-Generator` (public fork of the `Anil-matcha` copy — the same project lineage as the
SamurAIGPT original, which is itself the upstream of record; MIT LICENSE verified).

Demo URLs re-verified live 2026-10-12 with `curl`: **37/37 → HTTP 200** (URLs unchanged from
`AppsStudio.jsx`; `ai-youtube-shorts-generator` has no demo).

## Customer deployment standardization notes

- **One customer-owned Supabase project per customer** — never the VideoRemix production database and
  never shared with another customer.
- **One isolated Postgres schema per app** inside that project (e.g. schema `app_ai_headshot_studio`),
  so each app's Prisma schema and data are isolated and a customer can be offboarded by dropping one
  schema.
- **Reviewed migrations only** — apply schema changes through reviewed pull requests; the upstream apps
  use `npx prisma db push` (no migration history upstream), so the reviewed artifact is the Prisma schema
  diff captured as a migration in the customer project.
- **Never point any app at the VideoRemix production database or its credentials** — customer connection
  strings (`DATABASE_URL`, `DIRECT_URL`) come only from the customer's own Supabase project.
- **`ai-youtube-shorts-generator` persistence/compat situation:** a Python 3.10+ CLI (ffmpeg,
  faster-whisper, yt-dlp) with **local file output only** (`LOCAL_OUTPUT_DIR`) — no database, no hosted
  demo, no web deployment path. For resale it needs a self-hosted runtime (or a container) with local
  or customer-provided object storage; it does **not** fit the Next.js + Prisma + Supabase standard and
  cannot be verified against a live demo until a customer environment exists.

## Flags requiring decisions

- **`ai-resume-builder` (row 36):** the existing `deangilmoreremix/AI-Resume-Builder` repo is a fork of
  `rrs301/AI-Resume-Builder` (a Vite template), not `SamurAIGPT/ai-resume-builder`. Do not deploy it as the
  Studio app. GitHub repo names are case-insensitive, so `deangilmoreremix/ai-resume-builder` resolves to
  the collision repo and cannot be created under that exact name. Options: create the correct copy under a
  distinct name (e.g. `ai-resume-builder-studio`) with source pending license confirmation, or replace the
  fork's content once licensing is confirmed. Not done unilaterally — needs an owner decision.
- **Stale forks:** `AI-Youtube-Shorts-Generator` (~20 months behind upstream, last dest push 2025-02-13),
  `nano-banana-generator` and `seedance-2-generator` (~6 months behind). Refresh before resale deployment.
- **Missing LICENSE files in 7 existing forks** (`nano-banana-generator`, `seedance-2-generator`,
  `ai-business-card`, `ai-real-estate-stager`, `ai-logo-studio`, `ai-kissing-video-generator`, `social-post`):
  add a LICENSE + NOTICE commit before resale (MIT per the reference collection).
- **Upstream license verification:** 35/38 upstream repos carry no LICENSE file (re-verified live
  2026-10-12); MIT is claimed by the reference collection only. The 23 Group-B repos are public but
  source-free until this is confirmed per repo. Confirm before selling.
- **No Vercel deployments were created** (no customer credentials/permission); every "Vercel" URL in this
  manifest is the original upstream demo, marked customer-side / not created.

## Apps with no working demo AND no destination repo

- `ai-youtube-shorts-generator` has no demo but **does** have a destination repo (stale fork, MIT-verified).
- No app has both "no demo" and "no destination repo" — every app without a demo has a destination
  repo; all 37 apps with demos have verified working demos (HTTP 200).

## Database setup summary

- 37/38 apps: Next.js + Prisma + PostgreSQL, initialized with `npx prisma db push` (no Prisma Migrate
  history upstream — DB status is schema-push, not migration-based). Supabase Postgres is the recommended
  provider (most upstream READMEs list Supabase/Neon).
- 1/38 apps (`ai-youtube-shorts-generator`): no database at all (Python CLI, local file persistence).

Customer database onboarding is standardized in `docs/reseller-supabase-deployment-guide.md`:
one customer-owned Supabase project per customer, one isolated Postgres schema per app, reviewed changes only.
