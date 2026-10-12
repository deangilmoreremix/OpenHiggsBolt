# Vercel Deployment Verification — Apps Studio (38 Apps)

**Verified:** 2026-10-12 (all live checks re-run this session, nothing copied from earlier runs)
**Worktree:** `.kilo/worktrees/redesign-apps-studio-marketplace` · **Branch:** `redesign/apps-studio-marketplace` @ `487ce0c81`
**Source of truth:** `packages/studio/src/components/AppsStudio.jsx` (`APPS` array, 38 apps — read-only during this audit)
**GitHub identity used for live verification:** `deangilmoreremix` (`gh auth status` — keyring, scopes `gist, read:org, repo, workflow`)

**Rules honored in this document:**

- No `.vercel.app` address is invented; every `.vercel.app` string below already exists in this repo.
- No deployment is claimed live without verification; the only verified-live URLs are the 37 upstream demo URLs (HTTP 200).
- Deploy links reference only `deangilmoreremix` destination repos — never a previous developer's repo (`SamurAIGPT` is the upstream author, `Anil-matcha` the collection author, `rrs301` an unrelated name-collision owner).
- A Vercel deploy button/URL is **not** a downloadable ZIP; it starts Vercel's git-import flow.

Related audits: `docs/apps-studio-demo-link-test-report.md` (demo/repo link verification, 2026-10-11),
`docs/reseller-deployment-manifest.md` (destination-repo audit, re-verified live 2026-10-12).

> **Note on references named in the task:** `docs/apps-link-audit.md` and `src/data/resellerDestinations.json`
> do **not exist** in this worktree (checked with glob). Their role is filled by
> `docs/reseller-deployment-manifest.md` plus the live GitHub API re-verification recorded in §4.

---

## 1. Vercel access-check evidence — every check negative

| # | Check | Command (run in the redesign worktree) | Outcome |
|---|---|---|---|
| 1 | Vercel CLI installed | `which vercel` | **Not installed** — `vercel not found` (exit 1) |
| 2 | Vercel CLI authenticated | `vercel whoami` | **Fails** — `zsh:1: command not found: vercel` (exit 127) |
| 3 | Vercel environment variables | `env \| grep -i vercel` | **None present** — no output (exit 1; no `VERCEL_*` of any kind) |
| 4 | Vercel CLI config directory | `ls -la ~/.vercel` | **Absent** — `No such file or directory` (exit 1) |
| 5 | Vercel tokens in repo config | `grep -rIl -i "vercel_token\|vercel_access_token"` (excludes `node_modules`, `.git`) | **No matches** (exit 1). Presence/absence only checked; no secret values read or printed |
| 6 | Vercel tokens in env file | `grep -io "vercel[_a-z]*" .env.local` (symlink → root `.env.local`, 24 non-empty lines scanned) | **No matches** — names-only scan, no values printed |
| 7 | `vercel.json` project config | `ls vercel.json` | **Absent** — no such file in the worktree |
| 8 | `.vercel/` project link | `ls .vercel` | **Absent** — no `.vercel/project.json` link; the worktree is not linked to any Vercel project |
| 9 | Any Vercel-related file | glob `**/*vercel*` (whole worktree) | **No files found** |
| 10 | Unauthenticated Vercel REST API probe | `curl -s -o /dev/null -w "%{http_code}" https://api.vercel.com/v2/user` | **HTTP 403** — the API is reachable but requires a token; none exists in this environment |
| 11 | Vercel site reachability | `curl https://vercel.com/` | HTTP 200 — the website is reachable, which implies **no** account access |

**Conclusion (check 1–11):** there is **no Vercel account access** in this environment — no CLI, no token, no
config directory, no project link. This is the expected case documented in the shared context.

## 2. Vercel project/deployment listing — not possible, and none claimed

Without a token, `GET https://api.vercel.com/v2/user` answers **403**, so `/v9/projects`,
`/v6/deployments`, and `/v5/now/deployments` cannot be enumerated for any account (ours or a customer's).
Accordingly:

- **0 of 38 apps** have a Vercel project or deployment created, linked, or verifiable from this environment.
- No dashboard/project URL is recorded for any app, because none exists to record.
- **No customer-owned Vercel deployment exists** for any app (consistent with
  `docs/reseller-deployment-manifest.md`: "Customer-owned Vercel deployments | 0").

---

## 3. Existing `.vercel.app` occurrences in the repo — all upstream live demos

Every `.vercel.app` string in this repository (excluding `node_modules`) is an **existing live demo operated by
the upstream author**, not a deployment this project owns or a customer destination. All 37 demo URLs were
re-verified live on 2026-10-12 with `curl -sL`: **37/37 → HTTP 200, `text/html; charset=utf-8`**.

| File | Lines | What the occurrences are |
|---|---|---|
| `packages/studio/src/components/AppsStudio.jsx` | 16, 25, 34, 43, 60, 69, 78, 87, 96, 105, 114, 123, 132, 141, 150, 159, 168, 177, 186, 195, 204, 213, 222, 231, 240, 249, 258, 267, 276, 285, 294, 303, 312, 321, 330, 339, 348 | The 37 `hosted:` demo URLs (one per app with a demo; `ai-youtube-shorts-generator` has none, by design) |
| `packages/studio/src/components/AppsStudio.test.jsx` | 162, 176, 177, 178, 180, 181 | Test assertions pinning the three repaired demos and asserting the two dead URLs (`ai-headshot-generator.vercel.app`, `geo-checker.vercel.app`) are gone |
| `docs/apps-studio-demo-link-test-report.md` | 31, 32, 33, 35, 47–84, 88, 109, 112, 115 | Verification tables and reproduction commands for the demo URLs |
| `docs/reseller-deployment-manifest.md` | 21, 53–90, 218 | "Vercel URL" column (all marked "vercel.app demo … no customer deployment" / "None (customer-side / not created)") |

**Classification:** these 37 URLs are **LIVE DEMOS** (upstream-owned deployments). They must not be
repurposed as deploy destinations, as links to Vercel dashboards/projects, or as evidence that a customer
deployment exists. A demo URL proves the upstream authors deployed once; it proves nothing about a project
we or a customer control.

---

## 4. Per-app "Deploy to Vercel" status (all 38 apps)

### Status counts

| Status | Count | Meaning |
|---|---|---|
| `deployable-public-template` | **13** | Correct public `deangilmoreremix` repo verified live (exists, public, full Next.js source) — a Vercel git-template URL can honestly be formed; customer connects their own Vercel account at click time |
| `unavailable-no-repo` | **25** | No usable source repo to deploy from: 23 repos exist but contain attribution only (no source), 1 name is occupied by the wrong project, 1 is a Python CLI rather than a web app |
| Vercel project/deployment verified | **0** | No Vercel access (§1–2); this applies uniformly to all 38 apps |

### The deploy-button template URL format (only form the honest kind)

Vercel's official project-import flow for a **public** GitHub repository, percent-encoding the repository URL:

```
https://vercel.com/new/import?repository-url=<percent-encoded repository URL>
```

Worked example — `ai-clipping-studio` → `https://github.com/deangilmoreremix/ai-clipping-generator`:

```
https://vercel.com/new/import?repository-url=https%3A%2F%2Fgithub.com%2Fdeangilmoreremix%2Fai-clipping-generator
```

Behavior, stated honestly: clicking it opens Vercel's import screen; the **customer must connect their own
Vercel account** (GitHub sign-in) at click time; the repository is cloned into a new project in **their**
account; environment variables (`DATABASE_URL`, `NEXTAUTH_*`, Stripe, the app's MuAPI/model key — see
`docs/reseller-deployment-manifest.md` §"Shared standard environment set") and a customer-owned Supabase
Postgres database must be supplied during import or the build fails. It is **not** a ZIP download and
**not** a deployment we perform on the customer's behalf.

The same URL format is already used by the current code, but built from the **upstream** repo:
`vercelImportUrl()` at `packages/studio/src/components/AppsStudio.jsx:372-375` and the per-card
"Deploy on Vercel" link at `components/reseller/DeploymentCenter.jsx:438` both pass `app.repo`, which is
the `SamurAIGPT` upstream URL. That is a read-only observation — no source was changed in this audit. The
destination-repo URLs in the table below are the correct `deangilmoreremix` replacements.

### Verification method for the repo column

Live `gh api repos/deangilmoreremix/<name>` (existence, `private=false`, `pushed_at`) and
`gh api repos/deangilmoreremix/<name>/contents` (source present or not) for all 38 destination repo names,
run 2026-10-12. Results: 37 of 38 destination repos exist publicly; the 38th (`ai-resume-builder`) exists
under a name occupied by an unrelated project. 13 repos contain full application source (`package.json`,
`src/`, `prisma/` …); 23 contain only `README.md` + `NOTICE.md`.

### Per-app table (AppsStudio order; demo URLs unchanged)

| # | App id / Name | Demo URL (unchanged) | Destination repo — verified live 2026-10-12 | Deploy-to-Vercel status | Reason / caveats |
|---|---|---|---|---|---|
| 1 | `ai-headshot-studio` / AI Headshot Studio | `https://ai-headshot-generator-xi.vercel.app/` | `deangilmoreremix/ai-headshot-generator` — exists, public, fork; source verified (`.env.example`, `src/`, `prisma/`, `LICENSE`); pushed 2026-07-01 | `deployable-public-template` | Full source + MIT LICENSE present; stale vs upstream (2026-08-02) — refresh before resale. Env: standard + `HEADSHOT_API_KEY` |
| 2 | `nano-banana-studio` / Nano Banana Studio | `https://nano-banana-generator.vercel.app/` | `deangilmoreremix/nano-banana-generator` — exists, public, fork; source verified; pushed 2026-04-16 | `deployable-public-template` | Full source; **no LICENSE file** (MIT claimed at collection level only); stale (upstream 2026-10-06). Env: standard + `NANO_BANANA_API_KEY` |
| 3 | `seedance-v2-studio` / Seedance V2 Studio | `https://seedance-2-generator.vercel.app/` | `deangilmoreremix/seedance-2-generator` — exists, public, fork; source verified; pushed 2026-04-16 | `deployable-public-template` | Full source; **no LICENSE file**; stale (upstream 2026-10-06). Env: standard + `SEEDANCE_V2_API_KEY` |
| 4 | `ai-clipping-studio` / AI Clipping Studio | `https://ai-clipping-generator.vercel.app/` | `deangilmoreremix/ai-clipping-generator` — exists, public; source verified incl. `LICENSE`, `NOTICE.md`; pushed 2026-10-12 | `deployable-public-template` | Full upstream source pushed 2026-10-12; upstream is MIT-licensed. Env: standard + `AICLIPS_API_KEY` |
| 5 | `ai-youtube-shorts-generator` / AI YouTube Shorts Generator | **None — no hosted demo (by design)** | `deangilmoreremix/AI-Youtube-Shorts-Generator` — exists, public, fork; contents = `main.py`, `requirements.txt`, `Components/`, `LICENSE` | `unavailable-no-repo` | Not a Vercel-deployable target: Python 3.10+ CLI (ffmpeg / faster-whisper / yt-dlp) with local file output only — no web app, no database, no hosted demo path. Needs a self-hosted runtime, not a Vercel import |
| 6 | `easyveo-studio` / EasyVeo Studio | `https://veo4-video-generator.vercel.app/` | `deangilmoreremix/veo4-video-generator` — exists, public; source verified incl. `LICENSE`, `NOTICE.md`; pushed 2026-10-12 | `deployable-public-template` | Full upstream source; MIT LICENSE + NOTICE **added by us** (upstream has no LICENSE file). Env: standard + `VEO31_API_KEY` |
| 7 | `pet-product-studio` / Pet Product Studio | `https://pet-product-studio.vercel.app/` | `deangilmoreremix/pet-product-studio` — exists, public; source verified incl. `LICENSE`, `NOTICE.md`; pushed 2026-10-12 | `deployable-public-template` | Full upstream source; MIT LICENSE + NOTICE **added by us**. Env: standard + `MUAPIAPP_API_KEY` |
| 8 | `resale-photo-enhancer` / Resale Photo Enhancer | `https://resale-photo-enhancer.vercel.app/` | `deangilmoreremix/resale-photo-enhancer` — exists, public; source verified incl. `LICENSE`, `NOTICE.md`; pushed 2026-10-12 | `deployable-public-template` | Full upstream source; MIT LICENSE + NOTICE **added by us**. Env: standard + `MUAPIAPP_API_KEY` |
| 9 | `blogger-cms` / Blogger CMS | `https://blogger-cms-psi.vercel.app/` | `deangilmoreremix/blogger-cms` — exists, public; source verified incl. `LICENSE`, `NOTICE.md`; pushed 2026-10-12 | `deployable-public-template` | Full upstream source; MIT LICENSE + NOTICE **added by us**. Env: standard + `MUAPIAPP_API_KEY` |
| 10 | `amazon-product-studio` / Amazon Product Studio | `https://amazon-product-studio.vercel.app/` | `deangilmoreremix/amazon-product-studio` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — **source withheld pending license confirmation** (upstream has no LICENSE file); nothing to deploy today |
| 11 | `ai-business-card` / AI Business Card | `https://ai-business-card-ten.vercel.app/` | `deangilmoreremix/ai-business-card` — exists, public, fork; source verified; pushed 2026-07-20 | `deployable-public-template` | Full source; **no LICENSE file**; slightly stale (upstream 2026-07-27). Env: standard + `MUAPIAPP_API_KEY` |
| 12 | `mailwise` / MailWise | `https://mail-wise-khaki.vercel.app/` | `deangilmoreremix/mail-wise` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 13 | `my-podcast` / My Podcast | `https://my-podcast.vercel.app/` | `deangilmoreremix/my-podcast` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 14 | `ai-knowledge-base` / AI Knowledge Base | `https://ai-knowledge-base-six.vercel.app/` | `deangilmoreremix/ai-knowledge-base` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 15 | `ai-royal-portrait` / AI Royal Portrait | `https://ai-royal-portrait.vercel.app/` | `deangilmoreremix/ai-royal-portrait` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 16 | `ai-meme` / AI MEME | `https://ai-meme-generator.vercel.app/` | `deangilmoreremix/ai-meme-generator` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 17 | `ai-real-estate-stager` / AI Real Estate Stager | `https://ai-real-estate-stager.vercel.app/` | `deangilmoreremix/ai-real-estate-stager` — exists, public, fork; source verified; pushed 2026-06-16 | `deployable-public-template` | Full source; **no LICENSE file and no `.env.example` upstream** (variables documented in its README); stale (upstream 2026-07-27) |
| 18 | `ai-logo` / AI Logo | `https://ai-logo-studio.vercel.app/` | `deangilmoreremix/ai-logo-studio` — exists, public, fork; source verified; pushed 2026-07-01 | `deployable-public-template` | Full source; **no LICENSE file**; stale (upstream 2026-07-27). Env: standard + `MUAPIAPP_API_KEY` |
| 19 | `oldphoto` / OldPhoto | `https://old-photo-restore.vercel.app/` | `deangilmoreremix/old-photo-restore` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 20 | `aitryon` / AITryOn | `https://ai-tryon-smoky.vercel.app/` | `deangilmoreremix/ai-tryon` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 21 | `ai-professional-makeup-generator` / AI Professional Makeup Generator | `https://ai-professional-makeup-generator.vercel.app/` | `deangilmoreremix/ai-professional-makeup-generator` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 22 | `ai-group-photo` / AI Group Photo | `https://ai-group-photo-mocha.vercel.app/` | `deangilmoreremix/ai-group-photo` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 23 | `ai-tattoo-try-on` / AI Tattoo Try-On | `https://ai-tattoo-try-on.vercel.app/` | `deangilmoreremix/ai-tattoo-try-on` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 24 | `ai-hair-style-simulator` / AI Hair Style Simulator | `https://ai-hair-style-simulator.vercel.app/` | `deangilmoreremix/ai-hair-style-simulator` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 25 | `ai-kids-to-adult-prediction` / AI Kids-to-Adult Prediction | `https://ai-kid-to-adult-prediction.vercel.app/` | `deangilmoreremix/ai-kid-to-adult-prediction` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 26 | `ai-room-declutter` / AI Room Declutter | `https://ai-room-declutter.vercel.app/` | `deangilmoreremix/ai-room-declutter` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 27 | `ai-fitness-body-simulator` / AI Fitness Body Simulator | `https://ai-fitness-body-simulator.vercel.app/` | `deangilmoreremix/ai-fitness-body-simulator` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 28 | `ai-pet-portrait` / AI Pet Portrait | `https://ai-pet-portrait.vercel.app/` | `deangilmoreremix/ai-pet-portrait` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 29 | `ai-kissing-video-generator` / AI Kissing Video Generator | `https://ai-kissing-video-generator-amber.vercel.app/` | `deangilmoreremix/ai-kissing-video-generator` — exists, public, fork; source verified; pushed 2026-07-20 | `deployable-public-template` | Full source; **no LICENSE file**; slightly stale (upstream 2026-07-27). Env: standard + `MU_API_KEY` |
| 30 | `ai-travel-studio` / AI Travel Studio | `https://ai-travel-studio.vercel.app/` | `deangilmoreremix/ai-travel-studio` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 31 | `prompt-architect` / Prompt Architect | `https://prompt-architect-one-nu.vercel.app/` | `deangilmoreremix/prompt-architect` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 32 | `clearmark-ai` / ClearMark AI | `https://clearmark-ai.vercel.app/` | `deangilmoreremix/clearmark-ai` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 33 | `ai-wedding-photo` / AI Wedding Photo | `https://ai-wedding-photo.vercel.app/` | `deangilmoreremix/ai-wedding-photo` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 34 | `social-post` / Social Post | `https://social-post-woad.vercel.app/` | `deangilmoreremix/social-post` — exists, public, fork; source verified; pushed 2026-06-10 | `deployable-public-template` | Full source; **no LICENSE file**; stale (upstream 2026-07-27). Env: standard + `MU_API_KEY` |
| 35 | `magicself-ai` / MagicSelf AI | `https://magicself-ai.vercel.app/` | `deangilmoreremix/magicself-ai` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 36 | `ai-resume-builder` / AI Resume Builder | `https://ai-resume-builder.vercel.app/` | `deangilmoreremix/AI-Resume-Builder` — exists, public, but **wrong project**: verified live as a fork of `rrs301/AI-Resume-Builder` (Vite/React template: `index.html`, `vite.config.js`), **not** `SamurAIGPT/ai-resume-builder`; pushed 2025-10-29 | `unavailable-no-repo` | Name collision — GitHub names are case-insensitive, so `deangilmoreremix/ai-resume-builder` resolves to the unrelated Vite template. A correct copy must be created under a distinct name (owner decision, per the manifest flags) before any deploy link can honestly exist |
| 37 | `geo-checker` / GEO Checker | `https://geo-checker-silk.vercel.app/` | `deangilmoreremix/geo-checker` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |
| 38 | `ai-character-studio` / AI Character Studio | `https://ai-character-studio-beta.vercel.app/` | `deangilmoreremix/ai-character-studio` — exists, public; contents = `README.md`, `NOTICE.md` only; pushed 2026-10-12 | `unavailable-no-repo` | Attribution-only repo — source withheld pending license confirmation |

**Row 36 correction of record:** `deangilmoreremix/AI-Resume-Builder` must never be offered as the
"Deploy to Vercel" destination for `ai-resume-builder` — live API verification on 2026-10-12 confirms
`fork=true`, `parent=rrs301/AI-Resume-Builder`. The demo URL in the row stays the unchanged upstream demo.

---

## 5. What a customer "Deploy to Vercel" flow can honestly do today — and what it cannot

### Can (honest, verifiable today)

1. **Public git-template deploy for 13 of 38 apps.** For the 13 `deployable-public-template` apps, the
   honest action is Vercel's official import flow
   (`https://vercel.com/new/import?repository-url=<encoded public repo>`) pointing at the verified public
   `deangilmoreremix` repository. The customer connects **their own Vercel account** at click time, imports
   the repo as a new project, supplies the environment variables and their own Supabase Postgres database,
   and deploys. Each app becomes its own project in the customer's account.
2. **Live demo links.** All 37 hosted demo URLs remain valid live demos (HTTP 200, re-verified 2026-10-12)
   and can honestly be offered as "see the app running" — clearly labeled as the upstream demo, not as the
   customer's deployment.
3. **Source download is a separate, existing flow.** Source delivery goes through the authorized download
   route documented at `components/reseller/DeploymentCenter.jsx:433`
   (`/api/reseller/download?app=<id>`), not through the deploy button.

### Cannot (would be fabrication)

1. **No dashboard/project links.** No Vercel project exists under any account accessible here for any of
   the 38 apps (no token/CLI/config; API answers 403). A link such as `vercel.com/<org>/<project>` or a
   `*.vercel.app` project domain would be invented and must not be rendered.
2. **No claim that any app is "live on Vercel" for a customer.** Zero customer deployments exist; the 37
   `.vercel.app` URLs are upstream demos and are not customer destinations.
3. **No deploy button for 25 apps.** 23 destination repos contain only `README.md` + `NOTICE.md`
   (nothing to build), `ai-resume-builder`'s destination name is an unrelated project, and
   `ai-youtube-shorts-generator` is a Python CLI with no web entry point. A button for any of these would
   deploy nothing, the wrong app, or fail.
4. **Deploy ≠ download.** A Vercel deploy button/URL is not a downloadable ZIP; it requires a connected
   Vercel account and produces a deployment in that account.
5. **No upstream-repo deploy links.** Deploy URLs must use the `deangilmoreremix` destination repos —
   never a previous developer's repository (`SamurAIGPT`, `Anil-matcha`, `rrs301`).

---

## 6. Flags requiring decisions

1. **`docs/apps-studio-commerce-training-plan.md:110` overclaims Vercel ownership.** It states: "Each of
   the 37 demo apps has its own Vercel project/deployment; customers deploy from their own accounts via
   the import flow." The second half is correct; the first half is unverifiable from this environment
   (no Vercel access — §1–2) and, where true, the projects belong to the upstream author, not to this
   product or its customers. Recommend rewording to "each demo is an upstream-owned deployment; customers
   deploy their own copy from their own Vercel account."
2. **Current import links point at upstream repos.** `vercelImportUrl()` (`AppsStudio.jsx:372-375`) and
   the Deployment Center card link (`DeploymentCenter.jsx:438`) build the import URL from `app.repo` — the
   `SamurAIGPT` upstream URL. Functionally it still starts Vercel's import flow, but the distribution
   copy should be the `deangilmoreremix` repo (and should only render for the 13 apps in §4). No source
   was changed in this audit.
3. **License gating blocks 23 apps' deploy links.** Their repos are attribution-only by design until
   upstream licensing is confirmed (details and per-repo procedure in
   `docs/reseller-deployment-manifest.md` §"Flags requiring decisions"). Offering a deploy button for them
   before that would be a broken promise, not a deploy.
4. **Stale forks (8 of the 13 deployable apps).** `nano-banana-generator` and `seedance-2-generator`
   (~6 months behind upstream) and `AI-Youtube-Shorts-Generator` (~20 months) should be refreshed before
   resale deployment; 7 of the 8 also lack LICENSE files (manifest flags).

## 7. Reproduce every check in this document

```bash
# Vercel access (all expected to fail/absent in this environment)
which vercel; vercel whoami; env | grep -i vercel; ls ~/.vercel
grep -rIl -i "vercel_token\|vercel_access_token" .    # excludes nothing here except via rg defaults; add --glob '!node_modules'
grep -io "vercel[_a-z]*" .env.local                   # names only; do not print values
ls vercel.json .vercel 2>&1
curl -s -o /dev/null -w "%{http_code}\n" https://api.vercel.com/v2/user   # 403 without a token

# Destination repos, live (38 names); expect 37 OK + the AI-Resume-Builder collision
gh api repos/deangilmoreremix/<name> --jq '[.full_name,(.private|tostring),.pushed_at]|join(" ")'
gh api repos/deangilmoreremix/<name>/contents --jq 'map(.name)|join(" ")'
gh api repos/deangilmoreremix/AI-Resume-Builder --jq '{fork, parent: .parent.full_name}'

# Demo URLs, live (37)
node -e "const s=require('fs').readFileSync('packages/studio/src/components/AppsStudio.jsx','utf8');const a=eval(s.slice(s.indexOf('const APPS = [')+13,s.indexOf('\n];',s.indexOf('const APPS = ['))+2));console.log(a.flatMap(x=>[x.hosted].filter(Boolean)).join('\n'))" > /tmp/demo-urls.txt
xargs -P 5 -n 1 sh -c 'curl -sL --max-time 25 -A "Mozilla/5.0" -o /dev/null -w "%{http_code} %{content_type}\n" "$0"' < /tmp/demo-urls.txt
# Expected on 2026-10-12: 37x "200 text/html; charset=utf-8"
```

**Bottom line:** there is no Vercel access and therefore no Vercel project, deployment, or dashboard link
to report for any of the 38 apps. The only honest "Deploy to Vercel" experience today is Vercel's own
git-template import, offered solely for the 13 apps whose verified public `deangilmoreremix` repository
contains deployable source, with the customer connecting their own Vercel account at click time.
