# Apps Studio — Demo & Repository Link Test Report

**Status date:** 2026-10-11
**Worktree:** `.kilo/worktrees/redesign-apps-studio-marketplace` (branch `redesign/apps-studio-marketplace`, HEAD `a4d6f30d2` + uncommitted marketplace work)
**Source of truth parsed:** `packages/studio/src/components/AppsStudio.jsx` — the `APPS` array (also exported as `RESELLER_APPS`, consumed by the reseller deployment center at `components/reseller/DeploymentCenter.jsx`)

## Summary

| Metric | Result |
| --- | --- |
| Apps in `APPS` array | **38** |
| Upstream GitHub repo URLs returning HTTP 200 | **38 / 38** |
| Hosted demo URLs returning HTTP 200 **and** `text/html` | **37 / 37** |
| Demo URLs dead / broken | **0** |
| Apps with no hosted demo | **1** (`ai-youtube-shorts-generator` — by design, rationale below) |

Every upstream repo and every hosted demo was re-verified live with `curl -sL` on 2026-10-11 from this worktree. Nothing in this report is copied from an earlier test run.

## The app without a hosted demo

`ai-youtube-shorts-generator` (AI YouTube Shorts Generator) intentionally has **no** `hosted` field, and therefore renders **no Live Demo button** in the gallery (`app.hosted ?` gate in `AppsStudio.jsx`). Its thumbnail falls back to a raw GitHub asset, and the card still offers the Deployment Guide, Source Code, and Vercel import actions.

Rationale (as recorded in commit `e791e4b9e`): the app's GitHub homepage points at `vadoo.tv`, which is a third-party **competitor** page, not a demo of the open-source project. No verified demo deployment exists for this app, so the catalog does not invent one. Its upstream repository (`https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator`) does return HTTP 200 and remains available as source.

## Repairs made in `e791e4b9e` (re-verified this session)

Commit `e791e4b9e` ("fix(studio): repair and extend verified demo links") repaired three broken or missing hosted URLs. All three strings exist in the current `AppsStudio.jsx` and were re-tested live:

| App | Repaired URL | Lines in file | Live status (2026-10-11) | Page title |
| --- | --- | --- | --- | --- |
| `ai-headshot-studio` | `https://ai-headshot-generator-xi.vercel.app/` | `AppsStudio.jsx:16` | **200** · `text/html; charset=utf-8` · 0 redirects | AI Headshot Generator - Premium Portraits |
| `ai-group-photo` | `https://ai-group-photo-mocha.vercel.app/` | `AppsStudio.jsx:204` | **200** · `text/html; charset=utf-8` · 0 redirects | AI SaaS Template - Powered by MUAPI |
| `geo-checker` | `https://geo-checker-silk.vercel.app/` | `AppsStudio.jsx:339` | **200** · `text/html; charset=utf-8` · 0 redirects | GEO Checker - AI Search Visibility & SEO Auditor |

History of those repairs, per the commit message: `ai-headshot-generator.vercel.app` returned 404 (deployment not found) and was replaced by the `-xi` deployment; `geo-checker.vercel.app` returned 500/404 and was replaced by `geo-checker-silk.vercel.app` (the URL documented as the live demo in that app's own README); `ai-group-photo-mocha.vercel.app` was added because the app had been missing its demo link entirely.

## Correction notice: the earlier report was wrong

An earlier version of this document (produced in the sibling `add-apps-that-you-can-buy` worktree) claimed **5 demos alive / 33 dead**. That result was **incorrect**: it was produced from a stale copy of the apps data rather than the current `APPS` array, so most URLs it "tested" did not match the live catalog. The live figure, re-verified from this worktree on 2026-10-11, is **37/37 hosted demos alive and 38/38 repositories alive** (the 38th repo, `ai-youtube-shorts-generator`'s, is alive; it simply has no demo by design). Any claim of dead demo links in Apps Studio should be treated as stale until re-run against the current file. The stale files are no longer present on disk in either worktree; this report supersedes them.

## Per-app verification results

Method (same as used for the repair table above): `curl -sL` with a browser user-agent, 25 s per-request timeout, redirects followed, recording the final HTTP status, the `content-type`, the effective URL after redirects, and the HTML `<title>` when present. All tests run 2026-10-11, maximum 5 concurrent requests, 400 ms stagger.

| App id | Name | Repo URL | Repo status | Hosted demo URL | Final status · content-type (redirects) | Page title |
| --- | --- | --- | --- | --- | --- | --- |
| `ai-headshot-studio` | AI Headshot Studio | https://github.com/SamurAIGPT/ai-headshot-generator | 200 | https://ai-headshot-generator-xi.vercel.app/ | 200 text/html (redirects: 0) | AI Headshot Generator - Premium Portraits |
| `nano-banana-studio` | Nano Banana Studio | https://github.com/SamurAIGPT/nano-banana-generator | 200 | https://nano-banana-generator.vercel.app/ | 200 text/html (redirects: 0) | client-rendered; no static <title> |
| `seedance-v2-studio` | Seedance V2 Studio | https://github.com/SamurAIGPT/seedance-2-generator | 200 | https://seedance-2-generator.vercel.app/ | 200 text/html (redirects: 0) | Seedance v2.0 - Premium AI Generator |
| `ai-clipping-studio` | AI Clipping Studio | https://github.com/SamurAIGPT/ai-clipping-generator | 200 | https://ai-clipping-generator.vercel.app/ | 200 text/html (redirects: 0) | AICLIP Studio - AI YouTube Downloader & Highlight Clipper |
| `ai-youtube-shorts-generator` | AI YouTube Shorts Generator | https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator | 200 | — | n/a — none by design | — |
| `easyveo-studio` | EasyVeo Studio | https://github.com/SamurAIGPT/veo4-video-generator | 200 | https://veo4-video-generator.vercel.app/ | 200 text/html (redirects: 0) | Veo 3.1 - Premium AI Generator |
| `pet-product-studio` | Pet Product Studio | https://github.com/SamurAIGPT/pet-product-studio | 200 | https://pet-product-studio.vercel.app/ | 200 text/html (redirects: 0) | Pet Product Studio - generate photorealistic pet and product ad scenes |
| `resale-photo-enhancer` | Resale Photo Enhancer | https://github.com/SamurAIGPT/resale-photo-enhancer | 200 | https://resale-photo-enhancer.vercel.app/ | 200 text/html (redirects: 0) | Resale Photo Enhancer - background swap and enhance product photos |
| `blogger-cms` | Blogger CMS | https://github.com/SamurAIGPT/blogger-cms | 200 | https://blogger-cms-psi.vercel.app/ | 200 text/html (redirects: 0) | Blogger CMS - Manage and Publish Blogs Easily |
| `amazon-product-studio` | Amazon Product Studio | https://github.com/SamurAIGPT/amazon-product-studio | 200 | https://amazon-product-studio.vercel.app/ | 200 text/html (redirects: 0) | Amazon Product Studio - generate photorealistic product ad listings |
| `ai-business-card` | AI Business Card | https://github.com/SamurAIGPT/ai-business-card | 200 | https://ai-business-card-ten.vercel.app/ | 200 text/html (redirects: 0) | CardAI Creator - Premium AI Digital Business Cards |
| `mailwise` | MailWise | https://github.com/SamurAIGPT/mail-wise | 200 | https://mail-wise-khaki.vercel.app/ | 200 text/html (redirects: 0) | Mail-Wise — Elite AI Email Composer & Cold Outreach Assistant |
| `my-podcast` | My Podcast | https://github.com/SamurAIGPT/my-podcast | 200 | https://my-podcast.vercel.app/ | 200 text/html (redirects: 0) | Home \| My Podcast |
| `ai-knowledge-base` | AI Knowledge Base | https://github.com/SamurAIGPT/ai-knowledge-base | 200 | https://ai-knowledge-base-six.vercel.app/ | 200 text/html (redirects: 0) | KnowBase AI - Custom Knowledge Agent Workspace |
| `ai-royal-portrait` | AI Royal Portrait | https://github.com/SamurAIGPT/ai-royal-portrait | 200 | https://ai-royal-portrait.vercel.app/ | 200 text/html (redirects: 0) | AI Royal Portrait — Transform Your Photo into Royalty |
| `ai-meme` | AI MEME | https://github.com/SamurAIGPT/ai-meme-generator | 200 | https://ai-meme-generator.vercel.app/ | 200 text/html (redirects: 0) | client-rendered; no static <title> |
| `ai-real-estate-stager` | AI Real Estate Stager | https://github.com/SamurAIGPT/ai-real-estate-stager | 200 | https://ai-real-estate-stager.vercel.app/ | 200 text/html (redirects: 0) | EstateStager AI - Virtual Home Staging SaaS |
| `ai-logo` | AI Logo | https://github.com/SamurAIGPT/ai-logo-studio | 200 | https://ai-logo-studio.vercel.app/ | 200 text/html (redirects: 0) | Gemini Nano Banana - AI Logo Studio |
| `oldphoto` | OldPhoto | https://github.com/SamurAIGPT/old-photo-restore | 200 | https://old-photo-restore.vercel.app/ | 200 text/html (redirects: 0) | Old Photo Restore Online — AI Restore Old Photos to 4K/8K |
| `aitryon` | AITryOn | https://github.com/SamurAIGPT/ai-tryon | 200 | https://ai-tryon-smoky.vercel.app/ | 200 text/html (redirects: 0) | TryOn AI - Virtual Outfit Try-On Studio |
| `ai-professional-makeup-generator` | AI Professional Makeup Generator | https://github.com/SamurAIGPT/ai-professional-makeup-generator | 200 | https://ai-professional-makeup-generator.vercel.app/ | 200 text/html (redirects: 0) | AI Professional Makeup Generator - Virtual Makeup Simulator |
| `ai-group-photo` | AI Group Photo | https://github.com/SamurAIGPT/ai-group-photo | 200 | https://ai-group-photo-mocha.vercel.app/ | 200 text/html (redirects: 0) | AI SaaS Template - Powered by MUAPI |
| `ai-tattoo-try-on` | AI Tattoo Try-On | https://github.com/SamurAIGPT/ai-tattoo-try-on | 200 | https://ai-tattoo-try-on.vercel.app/ | 200 text/html (redirects: 0) | AI Tattoo Try-On - Virtual Tattoo Simulator |
| `ai-hair-style-simulator` | AI Hair Style Simulator | https://github.com/SamurAIGPT/ai-hair-style-simulator | 200 | https://ai-hair-style-simulator.vercel.app/ | 200 text/html (redirects: 0) | AI Hairstyle Simulator - Virtual Hair Makeover |
| `ai-kids-to-adult-prediction` | AI Kids-to-Adult Prediction | https://github.com/SamurAIGPT/ai-kid-to-adult-prediction | 200 | https://ai-kid-to-adult-prediction.vercel.app/ | 200 text/html (redirects: 0) | AI Kid to Adult Prediction — See Future Appearance Instantly |
| `ai-room-declutter` | AI Room Declutter | https://github.com/SamurAIGPT/ai-room-declutter | 200 | https://ai-room-declutter.vercel.app/ | 200 text/html (redirects: 0) | FutureRoom AI — Photorealistic AI Room Declutter & Cleaning |
| `ai-fitness-body-simulator` | AI Fitness Body Simulator | https://github.com/SamurAIGPT/ai-fitness-body-simulator | 200 | https://ai-fitness-body-simulator.vercel.app/ | 200 text/html (redirects: 0) | AI SaaS Template - Powered by MUAPI |
| `ai-pet-portrait` | AI Pet Portrait | https://github.com/SamurAIGPT/ai-pet-portrait | 200 | https://ai-pet-portrait.vercel.app/ | 200 text/html (redirects: 0) | AI Pet Portrait – Turn your pet into art |
| `ai-kissing-video-generator` | AI Kissing Video Generator | https://github.com/SamurAIGPT/ai-kissing-video-generator | 200 | https://ai-kissing-video-generator-amber.vercel.app/ | 200 text/html (redirects: 0) | AI Kissing Video Generator - Create Romantic Videos with Veo 3.1, Wan 2.7 & Gemini |
| `ai-travel-studio` | AI Travel Studio | https://github.com/SamurAIGPT/ai-travel-studio | 200 | https://ai-travel-studio.vercel.app/ | 200 text/html (redirects: 0) | FutureTravel AI Studio — Photorealistic Scenic Background Swaps |
| `prompt-architect` | Prompt Architect | https://github.com/SamurAIGPT/prompt-architect | 200 | https://prompt-architect-one-nu.vercel.app/ | 200 text/html (redirects: 0) | AI Prompt Architect |
| `clearmark-ai` | ClearMark AI | https://github.com/SamurAIGPT/clearmark-ai | 200 | https://clearmark-ai.vercel.app/ | 200 text/html (redirects: 0) | ClearMark AI — Remove Watermarks Instantly with AI |
| `ai-wedding-photo` | AI Wedding Photo | https://github.com/SamurAIGPT/ai-wedding-photo | 200 | https://ai-wedding-photo.vercel.app/ | 200 text/html (redirects: 0) | AI Wedding Photo Generator |
| `social-post` | Social Post | https://github.com/SamurAIGPT/social-post | 200 | https://social-post-woad.vercel.app/ | 200 text/html (redirects: 0) | AI Social Post — Premium Social Media Post Generator |
| `magicself-ai` | MagicSelf AI | https://github.com/SamurAIGPT/magicself-ai | 200 | https://magicself-ai.vercel.app/ | 200 text/html (redirects: 0) | MagicSelf AI — Transform Your Selfies Into Masterpieces |
| `ai-resume-builder` | AI Resume Builder | https://github.com/SamurAIGPT/ai-resume-builder | 200 | https://ai-resume-builder.vercel.app/ | 200 text/html (redirects: 0) | Search for a job and get AI generated resume and cover letters. |
| `geo-checker` | GEO Checker | https://github.com/SamurAIGPT/geo-checker | 200 | https://geo-checker-silk.vercel.app/ | 200 text/html (redirects: 0) | GEO Checker - AI Search Visibility & SEO Auditor |
| `ai-character-studio` | AI Character Studio | https://github.com/SamurAIGPT/ai-character-studio | 200 | https://ai-character-studio-beta.vercel.app/ | 200 text/html (redirects: 0) | AI SaaS Template - Powered by MUAPI |

## Notes on individual results

- **Client-rendered demos (2).** `nano-banana-generator.vercel.app` and `ai-meme-generator.vercel.app` serve a full `text/html` application shell (Next.js) but emit no static `<title>` element in the initial HTML, so no title is recorded. Both returned HTTP 200 and were manually inspected: they are live application shells, not error pages. Their OpenGraph metadata confirms real content (e.g. `og:title` on `ai-meme-generator`).
- **Redirects.** No hosted demo issued an HTTP redirect (redirect count 0 for all 37); each URL resolves directly to a 200 HTML page.
- **All URLs are `https://`.** No mixed-content or plain-HTTP links exist in the catalog.
- **Page titles are recorded verbatim** from each demo's HTML `<title>` (HTML entities unescaped for readability: `&amp;` → `&`). Titles that read "AI SaaS Template - Powered by MUAPI" are the shared MUAPI template's default title on otherwise live, distinct deployments.

## How to verify this report

All commands below were run from the redesign worktree on 2026-10-11. They are read-only.

```bash
# 1. Extract the APPS array from the component and count apps/demos (Node; the
#    array literal is sliced out of the file — no network, no source changes):
node -e "const s=require('fs').readFileSync('packages/studio/src/components/AppsStudio.jsx','utf8');const a=eval(s.slice(s.indexOf('const APPS = [')+13,s.indexOf('\n];',s.indexOf('const APPS = ['))+2));console.log('apps='+a.length,'hosted='+a.filter(x=>x.hosted).length,'demo-less='+a.filter(x=>!x.hosted).map(x=>x.id).join(','))"
# Expected: apps=38 hosted=37 demo-less=ai-youtube-shorts-generator

# 2. Verify every repo and demo URL, 5 concurrent max, short delay:
node -e "const s=require('fs').readFileSync('packages/studio/src/components/AppsStudio.jsx','utf8');const a=eval(s.slice(s.indexOf('const APPS = [')+13,s.indexOf('\n];',s.indexOf('const APPS = ['))+2));console.log(a.flatMap(x=>[x.repo,x.hosted].filter(Boolean)).join('\n'))" > /tmp/app-urls.txt
xargs -P 5 -n 1 sh -c 'curl -sL --max-time 25 -A "Mozilla/5.0" -o /dev/null -w "%{http_code} %{content_type} %{num_redirects} %{url_effective}\n" "$0"' < /tmp/app-urls.txt
# (add `sleep 0.4` between submissions if you want a gentler stagger)

# Expected: 38x "200 text/html ... 0" for github.com/<SamurAIGPT>/<repo> links
#           37x "200 text/html ... 0" for *.vercel.app demos

# 3. Spot-check a page title:
curl -sL https://geo-checker-silk.vercel.app/ | grep -o '<title>[^<]*</title>'

# 4. Confirm the three repaired strings are present in the catalog:
grep -n "ai-headshot-generator-xi.vercel.app\|geo-checker-silk.vercel.app\|ai-group-photo-mocha.vercel.app" \
  packages/studio/src/components/AppsStudio.jsx

# 5. Confirm the repair commit and its message:
git show --stat e791e4b9e && git log -1 --format=%B e791e4b9e

# 6. Re-confirm the app count and the demo-less app:
grep -c "id: \"" packages/studio/src/components/AppsStudio.jsx   # 38
grep -c "hosted: " packages/studio/src/components/AppsStudio.jsx # 37
```

## Related localization note

The `en` and `zh` message bundles (`packages/studio/src/messages/{en,zh}/appsStudio.json`) have identical key structures (verified programmatically). At the committed baseline (`a4d6f30d2`) each bundle has **59** leaf keys; the uncommitted marketplace redesign on disk adds 11 keys (`hero.deploymentCenterCta`, `packages.*` purchase/upgrade states, `card.deploymentGuide`, `card.sourceCode`, `card.vercelDeploy`), bringing each locale to **70** leaf keys. No URLs, prices, or content in either bundle were altered by this verification.
