# Demo Library Expansion Report

**Branch:** `feat/expand-demo-library-categories`
**Base commit:** `0bfecda0f` (merge of `origin/main` into `fix-the-video-previews`)
**Date:** 2026-10-20
**Scope:** the Personalization modal's Step 2 **Demos** tab (`src/shared/personalization/guided/StepChooseVideo.tsx`) and the data layer behind it.

---

## 1. Demo discovery counts

| Metric | Actual Count |
| --- | --- |
| Existing curated demos (before) | 12 |
| Additional eligible demos discovered | 111 |
| Total eligible unique demos | 123 |
| Successfully registered | 123 |
| Playback verified (real browser playback sample) | 28 of 28 PASS (0 fail) |
| Not playable / blocked | 0 |
| Premium AI Viral videos included | 0 |

**On-disk reality:** 137 video files exist under `public/media/` across **5** collections. All 137 were probed byte-by-byte; 123 carry a real container magic number (WebM `1a 45 df a3` / MP4 `ftyp`) and are eligible. The remaining **14** are the whole `seedance-prompts` collection: every one of them is a **9-byte "Not Found" body** (hex `4e6f7420466f756e64`) saved with an `.mp4` extension — upstream 404 responses captured by the ingest and committed that way in `df587766f`. They contain no `ftyp` box, no WebM magic and no decodable container, so they are excluded as **broken media, not premium content**. Nothing premium was included in this expansion.

| Collection | On disk | Verified | Registered |
| --- | --- | --- | --- |
| `minimax-h3` | 30 | 30 | 30 |
| `promptfeed` | 29 | 29 | 29 |
| `seedance-1` | 14 | 14 | 14 |
| `seedance-25` | 50 | 50 | 50 |
| `seedance-prompts` | 14 | 0 | 0 |
| **Total** | **137** | **123** | **123** |

Per-collection eligible totals: **minimax-h3 30, promptfeed 29, seedance-1 14, seedance-25 50**.

**Excluded collections (recorded in `EXCLUDED_DEMO_COLLECTIONS`, `src/data/demoLibraryRegistry.ts:137`):**

| Collection | Count on disk | Verified | Entitlement-gated? | Reason |
| --- | --- | --- | --- | --- |
| `seedance-prompts` | 14 | 0 | No | Broken-media exclusion: all 14 files are 9-byte "Not Found" error bodies; the source catalog `src/data/seedancePromptsDemos.ts` is empty and there is no per-video poster. Registering them would ship unplayable cards. |
| `academy` | 47 | 47 | No | Wrong-data-model exclusion: the 47 AI Creator Academy course assets under `public/academy/` are lesson-bound assets with no `sourceRepo`/`slug`/`studioTab`, so `getCreateUrl()` cannot route them to a studio. They are already reachable through the Academy UI (`src/data/academyAssets.ts`). |
| `ai-viral` | 0 (2419 catalog entries) | 0 | No | Remote-only-delivery exclusion: every one of the 2419 entries in `src/data/seedance2PromptDemos.ts` is a `cdn.seedance2prompt.com` URL. Nothing is served from `public/media/`, so none of it can be registered as a local demo. |

No local demo video collection in this codebase is behind a paid entitlement gate — the entitlement model (`src/access/entitlements.ts`) gates **generation**, not browsing.

---

## 2. Categories

The Demos tab renders **14 category tabs**. A category tab is rendered only when it holds at least one demo (`DEMO_VISIBLE_CATEGORIES`, `src/shared/personalization/guided/StepChooseVideo.tsx:96`).

| # | Category id | Label | Demos | Contributing collections |
| --- | --- | --- | --- | --- |
| 1 | `all` | All Demos | 123 | minimax-h3 30, promptfeed 29, seedance-1 14, seedance-25 50 |
| 2 | `technology` | Technology, SaaS & Apps | 74 | minimax-h3 3, promptfeed 12, seedance-1 9, seedance-25 50 |
| 3 | `entertainment-media` | Entertainment, Media & Creators | 64 | minimax-h3 15, promptfeed 10, seedance-1 13, seedance-25 26 |
| 4 | `sports-outdoors` | Sports & Outdoors | 24 | minimax-h3 5, promptfeed 5, seedance-1 2, seedance-25 12 |
| 5 | `viral-trending` | Viral & Trending | 20 | minimax-h3 5, promptfeed 9, seedance-1 1, seedance-25 5 |
| 6 | `general-business` | Business & More | 19 | minimax-h3 4, promptfeed 5, seedance-1 1, seedance-25 9 |
| 7 | `beauty` | Beauty, Skincare & Fashion | 10 | minimax-h3 4, promptfeed 5, seedance-1 1 |
| 8 | `restaurants-food` | Restaurants & Food | 7 | minimax-h3 3, promptfeed 3, seedance-25 1 |
| 9 | `education` | Education & Training | 6 | seedance-25 6 |
| 10 | `ecommerce` | Ecommerce & Products | 5 | minimax-h3 2, promptfeed 3 |
| 11 | `travel-hospitality` | Travel, Hotels & Hospitality | 5 | promptfeed 5 |
| 12 | `automotive` | Automotive | 4 | minimax-h3 1, promptfeed 1, seedance-1 1, seedance-25 1 |
| 13 | `wellness-fitness` | Fitness, Wellness & Coaching | 1 | promptfeed 1 |
| 14 | `finance` | Finance & Professional Services | 1 | promptfeed 1 |

`real-estate` has **0** demos, so its tab is **correctly not rendered** (the taxonomy still defines it — it is the "Real Estate" landing category of the AI Viral Studio — it simply has no eligible demo behind it).

### Style filters (7)

These are the seven canonical AI Viral style buckets every `VideoDemo` carries in its `category` field, offered as the secondary "Style" filter.

| Style | Demos |
| --- | --- |
| `cinema` | 33 |
| `commercial` | 23 |
| `animation` | 22 |
| `social` | 19 |
| `action` | 14 |
| `ugc` | 7 |
| `fashion` | 5 |
| **Total** | **123** |

### Sub-category groups (11 reachable)

The sub-category control is only rendered inside a business niche whose demos actually carry sub-niches. The taxonomy source (`SUB_NICHE_KEYWORDS`, `src/lib/nicheClassifier.ts:117`) defines **12** groups; **11** are reachable in the Demos tab, because `real-estate` — the 12th — has 0 demos and therefore no tab to scope it to.

| Niche group | Options offered | Option detail |
| --- | --- | --- |
| `ecommerce` | 4 | fashion 17, luxury 12, tech-products 1, home-goods 1 |
| `restaurants-food` | 4 | recipes 2, casual 2, coffee 2, fine-dining 1 |
| `beauty` | 3 | skincare 5, fragrance 3, makeup 1 |
| `wellness-fitness` | 1 | gym 1 |
| `education` | 1 | skill-building 6 |
| `technology` | 3 | gadgets 3, ai 1, gaming 1 |
| `finance` | 1 | personal-finance 1 |
| `entertainment-media` | 4 | movies 21, music 12, viral 2, gaming 1 |
| `automotive` | 2 | motorcycles 1, racing 1 |
| `travel-hospitality` | 4 | travel-vlogs 11, destinations 3, hotels 1, adventures 1 |
| `sports-outdoors` | 2 | extreme 21, outdoor 1 |

### Aspect-ratio filter

Derived from the distinct ratios the registry actually carries (`StepChooseVideo.tsx:260`).

| Aspect ratio | Demos |
| --- | --- |
| `16:9` | 100 |
| `9:16` | 7 |
| `92:39` | 3 |
| `7:3` | 2 |
| 11 single-entry ratios | 11 |
| **Total** | **123** |

The 11 single-entry ratios: `40:17`, `959:540`, `3:4`, `12:5`, `853:360`, `1:1`, `71:40`, `4:3`, `107:61`, `180:191`, `60:67`.

### Provenance of the taxonomy

The taxonomy was **extracted from the real AI Viral Studio code**, not invented. Full audit with file:line excerpts: `docs/AI_VIRAL_GALLERY_PATTERNS.md`.

| Element | Source |
| --- | --- |
| Business-niche ids / labels / copy | `src/data/nicheContent.ts:12` |
| Niche keyword table (12 niches) | `src/lib/nicheClassifier.ts:25` |
| Sub-niche keyword table (12 groups) | `src/lib/nicheClassifier.ts:117` |
| Style categories (7 canonical buckets) | `src/data/types.ts:10` |
| Sidebar category nav + counts | `src/apps/go-ai-viral/GoAiViralStudio.tsx:1433` |

`src/shared/personalization/guided/demoCategories.ts` is content-free: ids, labels, descriptions, icon keys and sub-category structure only — no video, poster, template record or URL. The AI Viral Studio component itself was **not** modified or moved; the new module only *reads* the shared keyword tables that both surfaces now use. `src/lib/nicheClassifier.ts` received **additive exports only**, so the taxonomy reuses the exact existing matching rules rather than a re-implementation.

---

## 3. Root cause

**Why only 12 demos appeared.** `src/shared/personalization/guided/curatedDemos.ts` built `GUIDED_DEMO_VIDEOS` from a hardcoded `CURATED_SLUGS` allowlist of **exactly 12 slugs** (10 MiniMax H3 + 2 Seedance 2.5). The list was then filtered against only **two** data files — `MINIMAX_H3_DEMOS` and `SEEDANCE_25_DEMOS`. The consequence: the other **111 eligible videos**, and **2 of the 4** eligible collections (`promptfeed`, `seedance-1`), were **unreachable regardless of what shipped on disk**. The media was already there and already described by the per-source catalogs; the allowlist was the bug.

**How the limit was eliminated.**

1. `src/data/demoLibraryRegistry.ts` (new) is now the single, complete index of every local demo video. Every entry is **magic-byte-verified** (file exists, non-empty, real WebM/MP4 container signature) and described by a source catalog, and each carries a stable, source-qualified id `<collection>:<slug>`. Excluded collections and their reasons travel with the registry in `EXCLUDED_DEMO_COLLECTIONS`.
2. `src/shared/personalization/guided/curatedDemos.ts` now **derives** from the registry — `GUIDED_DEMO_VIDEOS = DEMO_LIBRARY_REGISTRY.map(toVideoDemo)` — and the 12-slug allowlist is **removed**. The `VideoDemo` shape is preserved for every existing importer, and `sourceRepo` + `slug` are kept so `getCreateUrl()` still produces the same working template ids.
3. The **Demos tab** now renders the registry itself with category tabs, search, and source / style / aspect / sub-category filters plus **"Show more"** pagination (12 → 22 → 32 → … → 123, `DEMO_GALLERY_INITIAL = 12`, `DEMO_GALLERY_STEP = 10`).

Pagination is windowing, not filtering: the union of all pages was measured at **123 / 123**, so **no demo is hidden**. The visible counter always reports how many of the matching demos are on screen.

---

## 4. Playback verification

Verification was done with **real browser playback**, not HTTP status codes. **28 of 28** sampled demos **PASSED**; **0** failed, so there are no failure reasons to report.

Each sampled demo had to satisfy all of the following at once:

| Check | Requirement |
| --- | --- |
| `src` | the element's real source is the registered media path (not a poster, not a blob) |
| `readyState` | 3–4 (HAVE_FUTURE_DATA / HAVE_ENOUGH_DATA) |
| `videoWidth` / `videoHeight` | > 0 — observed **1280×720, 1280×544, 1698×720, 1080×1200, 1278×720** |
| `currentTime` | advanced during playback |
| `video.error` | `null` |
| paused | `false` |

The sample covered **≥ 1 demo per collection** and **≥ 2 per visible category**, across **all 4 collections**.

**Step 4 (preview render) was verified for 4 demos — one per collection.** Remotion renders to a `<canvas>`, not a `<video>` element, so playback there was proven by **canvas pixel advancement** (the frame buffer changes over time) plus a **206 (partial content)** response for the underlying clip.

---

## 5. Selection verification

Selection is tracked by a **stable source-qualified id** (`<collection>:<slug>`), **never by array index** — array position changes as filters and pagination change the visible set.

**Evidence 1 — the selection is stable across every kind of change.**
Selecting `minimax-h3:gourmet-burger-ugc-taste-test` kept the **same id** *and* the same `previewVideo.url` across: switching to a category that contains it, switching to a category that does not (the card unmounts and no player is rendered), switching back, a **"Show more"** click, a **matching search**, and a **hiding search + "Clear filters"**.

**Evidence 2 — changing the selection moves the id and the src together.**
Deliberately selecting `seedance-1:van-gogh-post-impressionism-style-animation` then moved **both** the selected id and the `src`, with **exactly one** `aria-pressed` card and **exactly one** player in the DOM.

**Result: 3/3 verified**, with the localStorage preview mirror kept in place throughout.

---

## 6. Regression verification

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | exit 0 |
| `npx next build` | exit 0 — BUILD_ID `f4NvwjzVElEuy0OIQ9jYP` |
| Vitest (personalization + data suites) | **121 passed across 7 files** |
| `e2e/personalization-demo-library.spec.ts` (new) | **4/4 passed across 3 consecutive runs** |
| `e2e/personalization-demo-video-playback.spec.ts` + `e2e/personalization-motion-template-video.spec.ts` | **5/5 passed** |

The 7 Vitest files are `src/data/__tests__/demoLibraryRegistry.test.ts`, `src/data/__tests__/nicheDemos.test.ts`, `src/shared/personalization/guided/__tests__/curatedDemos.test.ts`, `src/shared/personalization/guided/__tests__/demoCategories.test.ts`, `src/shared/personalization/guided/__tests__/DemoGalleryControls.test.tsx`, `src/shared/personalization/guided/__tests__/stepChooseVideoDemos.test.tsx` and `src/shared/personalization/guided/__tests__/overlayGeometry.test.ts`.

### The real test-harness regression that was found and fixed

The existing curated-demo spec looked up demo cards by a **fixed index** in the grid. The windowed grid only mounts **12** cards at a time, so cards past #12 were **absent from the DOM** until "Show more" was clicked — the spec failed on a card that existed but was not mounted.

A `revealDemoCard()` helper was added at the **three** lookup sites in `e2e/personalization-demo-video-playback.spec.ts` (lines 192, 462 and 525): it pages with "Show more" until the target card is mounted, then returns. This was a **TEST-ONLY change — no product code was touched** — and after it, all **12** curated demos pass again.

### Known pre-existing flake (not caused by this work, not fixed by this work)

`src/shared/personalization/DemoPersonalizeProvider.tsx` — `restoreProject` (line 1595) calls `applyLocalPreviewState` (line 1557) on the Supabase-miss fall-through (line 1613) and on the network-failure path (line 1606), which happens when the Supabase project fetch **401s**. That call **unconditionally re-applies the localStorage preview mirror**, including `previewVideo` (line 1566) and `guidedStep` (line 1575). Because the restore resolves asynchronously, it can land late enough to **overwrite a selection made after the modal opened**.

Observed **once** in a parallel 2-worker run. It **could not be reproduced** afterwards: **5/5** in isolation, **5/5** in the final full run, **3/3** in targeted replications. It is pre-existing behaviour, outside the scope of this expansion, and is left unchanged on purpose.

### Out-of-scope note

A wider ad-hoc Vitest run that additionally included the pre-existing `src/shared/personalization/guided/__tests__/TemplateBrowser.test.tsx` surfaced 2 failures there, both **30 s test timeouts** in a slow Motion Studio-catalog spec (individual tests in that file take 10–46 s). That file was not modified by this work and does not import the demo library or `nicheClassifier`; it is not part of the 7-file suite above.

---

## 7. Git status

**Branch:** `feat/expand-demo-library-categories` — **based on `0bfecda0f`**.

| File | Change | Description |
| --- | --- | --- |
| `src/data/demoLibraryRegistry.ts` | new (607 lines) | Registry, media facts, exclusions |
| `src/data/__tests__/demoLibraryRegistry.test.ts` | new (29 tests) | File existence, magic bytes, id uniqueness, disk reconciliation |
| `src/shared/personalization/guided/demoCategories.ts` | new (481 lines) | Taxonomy + matching helpers |
| `src/shared/personalization/guided/DemoGalleryControls.tsx` | new (227 lines) | Tabs / search / filter primitives |
| `src/shared/personalization/guided/__tests__/demoCategories.test.ts` | new (26 tests) | Taxonomy and matcher unit tests |
| `src/shared/personalization/guided/__tests__/DemoGalleryControls.test.tsx` | new (8 tests) | Gallery control primitives |
| `src/shared/personalization/guided/__tests__/stepChooseVideoDemos.test.tsx` | new (15 tests) | Demos tab behaviour |
| `src/shared/personalization/guided/StepChooseVideo.tsx` | modified | Demos tab: category tabs, search, filters, pagination, empty state; the selected card still renders a real `<video>`; selection by source-qualified id |
| `src/shared/personalization/guided/curatedDemos.ts` | modified | Derives from the registry; the 12-slug allowlist is removed |
| `src/lib/nicheClassifier.ts` | modified | Additive exports only, so the taxonomy reuses the exact existing matching rules |
| `e2e/personalization-demo-library.spec.ts` | new | 4 browser tests over the expanded library |
| `e2e/personalization-demo-video-playback.spec.ts` | modified | Test-only `revealDemoCard()` pagination fix |
| `docs/AI_VIRAL_GALLERY_PATTERNS.md` | new (759 lines) | Extracted AI Viral gallery / category patterns with file:line excerpts |

The merge with `origin/main` was **clean — no conflicts**.

**Deliberately NOT modified:** Steps 1–3, the wizard layout, the Remotion Player, the pill designs, overlay editing, asset upload and AI image editing.

---

## 8. Production status

| Item | Status |
| --- | --- |
| Netlify production unlocked | **No** |
| Netlify production deployed | **No** |
| Netlify production published | **No** |
| GitHub Actions used | **No** |
| Working branch merged into `main` | **No** |
| Force-push performed | **No** |

The production site was left **exactly as it was**. All verification ran **locally**, against a dev server on **port 3113**.

---

## Remaining work

1. **Wiring the remaining studios' entry points** — the registry is complete and the Demos tab consumes it, but the other studios' entry points that should surface the expanded library are not yet wired to it.
2. **The known pre-existing localStorage-mirror flake** — `DemoPersonalizeProvider.tsx` `restoreProject` → `applyLocalPreviewState` can re-apply the localStorage preview mirror over a selection made after the modal opened when the Supabase project fetch 401s. It is pre-existing, was not reproduced after the single observation, and is unchanged by this work.
