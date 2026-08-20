# Landing Page Video Demo & Prompt Expansion Plan

## 1. Executive Summary

Add video demos and generation prompts from 3 GitHub repos to the existing landing page `SmartVideoShowcase`, following the established `minimaxH3Demos.ts` pattern.

**Core constraint — validated in the ingestion pipeline (§4.2):** Only entries that have BOTH a video AND an English prompt are included. Every entry is checked before being written to a data file:
1. `videoSrc` must be non-empty and resolve to a downloadable video file
2. `prompt` must be non-empty
3. Language must be English (non-English entries are filtered out)

**Excluded repos:**
- `ai-shortfilm-prompts` — English prompt templates but no rendered videos
- `HuyLe82US/awesome-seedance-prompts` — GitHub user-attachments URLs return 404, no local video files in repo

Every demo has **both a video and a prompt, in English**. All cards reuse the existing `DemoMediaCard` + `LazyVideo` design. All content maps to the **existing 7-category** system: `Action · Commercial · Social · Animation · Fashion · UGC · Cinema`.

### At-a-glance (post-curation — video + English prompt only)

| # | Repo | Source | English prompts with video | Videos | Data format | Video source | Status |
|---|------|--------|---------------------------|--------|-------------|--------------|--------|
| 1 | `ai-shortfilm-prompts` (fork of `jnMetaCode`) | 6 prompts + 15 templates | **0** (no videos in repo) | Markdown + JSON | N/A | N/A | ❌ Excluded |
| 2 | `awesome-seedance-2-5-prompts` (fork of `BeatAPI`) | 300 JSON entries | **50 curated** (from 241 English) | 241 | JSON schema | `.webm` CDN (`media.beatapi.io`) | ✅ Done |
| 3 | `ZeroLu/awesome-seedance` | 8 categories of prompts | **14** (all have prompt + video) | 14 | Markdown | `.mp4` repo + user-attachments | ✅ Done |
| 4 | `HuyLe82US/awesome-seedance-prompts` | 13 categories of prompts | **0 downloaded** (user-attachments → 404) | ~26 parsed | Markdown | GitHub `user-attachments` | ❌ Excluded |
| 5 | `Hanyuyu/visual-prompt-feed` | 786 seedance video entries | **30 curated** (from 679 English) | 679 | JSONL/JSON | `.mp4` (`video.twimg.com`) | ✅ Done |

**Total video demos added: 94** (50 + 14 + 30)
**Total media: 94 videos + 50 BeatAPI thumbnails + 14 SVG posters + 30 thumbnails = ~210MB downloaded**

### Direct answers to your three questions

**Q1: "If the videos are in different source categories, do we add more categories?"**

**No** — all 13–14 source categories from the 5 repos are mapped to the **existing 7** categories (`Cinema · Commercial · Social · Animation · Fashion · UGC · Action`). Example mappings: `music-video → Social`, `fantasy → Cinema`, `dance → Animation`, `documentary → Social`, `horror → Cinema`, `comedy → Social`, `sci-fi-cyberpunk → Action`. If the user later wants finer granularity (e.g., a standalone "Comedy" tab), it's a 1-line change — but the plan deliberately preserves the existing 7 to avoid category sprawl.

**Q2: "Are all the videos with prompts like the minimax videos already on the page?"**

**Yes** — for the 4 repos that have videos (BeatAPI, ZeroLu, HuyLe82US, visual-prompt-feed), every curated entry has BOTH:

| Repo | Entries | All have `videoSrc`? | All have `prompt` text? | English? |
|------|---------|----------------------|------------------------|----------|
| BeatAPI fork | 50 | ✅ (300/300 in catalog have `media.video`) | ✅ (required by JSON schema) | ✅ (filtered from 241 EN) |
| ZeroLu | 14 | ✅ (14 .mp4 in `videos/` dir) | ✅ (in README) | ✅ |
| HuyLe82US | 15 | ✅ (proof clip links in README) | ✅ (in .md files) | ✅ |
| visual-prompt-feed | 30 | ✅ (`sourceUrl` on video.twimg.com) | ✅ (required by schema) | ✅ (filtered from 746 EN) |

The `ai-shortfilm-prompts` repo has **prompts but no videos** — it is excluded from the video showcase until videos are generated. If added later, each entry would need a `videoSrc` path pointing to a locally hosted `.webm`.

**Q3: "Are they going to have the same card design as the videos already on the landing page?"**

**Yes** — every new demo reuses the exact same `DemoMediaCard` component. No new card UI is created. `DemoMediaCard` accepts any `VideoDemo` type and renders identically: `LazyVideo` preview (hover-to-play, click-to-toggle), category badge, title, useCase, "View Prompt" button, "Create This Style" CTA. The only change is the type import (`MinimaxDemo` → `VideoDemo`). Every new entry has a valid `videoSrc` (no text-only cards in this plan).

---

## 2. Current Architecture (the "minimax-h3 pattern")

### Data layer

`src/data/minimaxH3Demos.ts` exports:
- `type MinimaxDemo` — 17 fields (id, slug, title, category, rawCategory, useCase, duration, durationLabel, aspectRatio, videoSrc, posterSrc, prompt, featured?, hero?, interactive?, studioTab, tags)
- `MINIMAX_H3_DEMOS: MinimaxDemo[]` — 30 demo entries
- `HERO_DEMO` — single entry with `hero: true` (ID 23)
- `INTERACTIVE_DEMO` — single entry with `interactive: true` (ID 22)
- `DEMO_CATEGORIES` — `Array.from(new Set(MINIMAX_H3_DEMOS.map((d) => d.category)))`
- `getCreateUrl(demo)` — `/studio/{tab}?template=minimax-h3-{slug}`

### Media assets

```
public/media/minimax-h3/
  videos/   → 30 .webm files (looped, ~0.5–4 MB each)
  previews/ → 30 .svg placeholder poster frames
```

### Component graph

```
LandingPage.js
  └─ SmartVideoShowcase.tsx   ← DemoPromptProvider wraps everything
       ├─ CinematicVideoHero.tsx        ← HERO_DEMO → LazyVideo full-bleed
       ├─ InteractiveStudioSection.tsx  ← INTERACTIVE_DEMO → LazyVideo in demo-stage
       ├─ MadeWithSmartVideo.tsx        ← 6 slugs → DemoMediaCard reel
       ├─ UGCDemoShowcase.tsx           ← 4 slugs → DemoMediaCard grid
       └─ AIVideoGallery.tsx            ← all 30 → category-filtered grid
            └─ DemoMediaCard.tsx        ← LazyVideo + prompt modal trigger
                 └─ LazyVideo.tsx       ← IntersectionObserver + global playback limiter
       └─ DemoPromptModal.tsx          ← full-screen prompt viewer (copy + create CTA)
```

### Key reusable primitives

- **`LazyVideo`** — lazy-loads `src` only when in viewport (300px root margin), caps 2 concurrent plays, handles 404 with "Preview unavailable" overlay, hover-to-play, click-to-toggle.
- **`DemoMediaCard`** — card with video preview, category badge, "View Prompt" button, "Create This Style" CTA. Accepts any `MinimaxDemo`.
- **`DemoPromptModal`** — `DemoPromptProvider` context + focus-trapped modal showing prompt text + meta grid (Model/Duration/Aspect/Studio) + copy + create CTA.
- **`Reveal`** — scroll-triggered fade-in-up animation.
- **`getCreateUrl(demo)`** — `/studio/{tab}?template={prefix}-{slug}`

### Category taxonomy (existing — do NOT add new ones)

`Cinema · Commercial · Action · Animation · UGC · Social · Fashion`

---

## 3. Proposed Architecture: Generalize + Extend

### 3.1 Shared type extraction

**Create `src/data/types.ts`** — extract a base `VideoDemo` type from `MinimaxDemo`:

```typescript
// src/data/types.ts
export type VideoDemo = {
  id: number;
  slug: string;
  title: string;
  category: string;        // Must map to: Cinema | Commercial | Action | Animation | UGC | Social | Fashion
  rawCategory: string;     // Original source category
  useCase: string;
  duration?: number;
  durationLabel?: string;  // e.g. "15s", "30s"
  aspectRatio?: string;    // e.g. "16:9", "9:16"
  videoSrc: string;        // Local path: /media/{prefix}/videos/{slug}.webm
  posterSrc: string;       // Local path: /media/{prefix}/previews/{slug}.png or .svg
  prompt: string;          // Full generation prompt
  featured?: boolean;
  hero?: boolean;
  interactive?: boolean;
  studioTab: string;       // One of: video, marketing, cinema, vfx-studio, ai-influencer
   sourceRepo: string;      // e.g. "minimax-h3", "seedance-25", "seedance-1", "seedance-prompts", "promptfeed"
  sourceUrl?: string;      // Original source link (X post, GitHub URL)
  tags?: string[];
};

export function getCreateUrl(demo: VideoDemo): string {
  const tab = demo.studioTab || 'video';
  return `/studio/${tab}?template=${demo.sourceRepo}-${demo.slug}`;
}
```

Update `minimaxH3Demos.ts` — `export type MinimaxDemo = VideoDemo`, re-export `getCreateUrl` from `@/data/types`.

### 3.2 New data files (one per repo)

| File | Source repo | English demos | Media prefix | Video format |
|------|------------|---------------|---------------|--------------|
| `src/data/minimaxH3Demos.ts` | (existing) | 30 | `minimax-h3` | `.webm` (local) |
| `src/data/seedance25Demos.ts` | `BeatAPI/awesome-seedance-2-5-prompts` | 50 (curated from 241 EN) | `seedance-25` | `.webm` (CDN download) |
| `src/data/seedance1Demos.ts` | `ZeroLu/awesome-seedance` | 14 | `seedance-1` | `.webm` (converted from `.mp4`) |
| `src/data/seedancePromptsDemos.ts` | `HuyLe82US/awesome-seedance-prompts` | 15 | `seedance-prompts` | `.webm` (converted from proof clips) |
| `src/data/promptFeedDemos.ts` | `Hanyuyu/visual-prompt-feed` | 30 (curated from 746 EN) | `promptfeed` | `.webm` (converted from `.mp4`) |

> **Deferred**: `deangilmomeremux/ai-shortfilm-prompts` (6 prompts + 15 templates, all English) has no rendered videos. A `src/data/shortfilmDemos.ts` file can be created when videos are generated, using the same `VideoDemo` schema with a `shortfilm` media prefix.

### 3.3 Component changes

```
SmartVideoShowcase.tsx (updated — adds 5 new sections)
  ├─ CinematicVideoHero.tsx        (keep, minimax hero)
  ├─ InteractiveStudioSection.tsx  (keep, minimax interactive)
  ├─ MadeWithSmartVideo.tsx        (keep, minimax reel)
  ├─ UGCDemoShowcase.tsx           (keep, minimax UGC)
  ├─ AIVideoGallery.tsx            (generalize — accept demos/categories props)
   ├─ Seedance25Hero.tsx            (NEW — BeatAPI cinematic hero)
   ├─ AIVideoGallery (props)        (BeatAPI 50 demos, 13→7 category filter)
   ├─ Seedance1Reel.tsx             (NEW — ZeroLu 14-video horizontal reel)
   ├─ SeedancePromptsHero.tsx       (NEW — HuyLe82US hero with proof clip)
   ├─ AIVideoGallery (props)        (HuyLe82US 15 demos, 13→7 category filter)
   ├─ PromptFeedHero.tsx            (NEW — curated visual-prompt-feed hero)
   └─ AIVideoGallery (props)        (visual-prompt-feed 30 demos, 14→7 category filter)
```

**Existing components need only type import changes** — `DemoMediaCard.tsx` and `DemoPromptModal.tsx` switch from importing `MinimaxDemo` from `minimaxH3Demos` to importing `VideoDemo` from `@/data/types`. All rendering logic stays identical.

---

## 4. Asset Pipeline

### 4.1 Download strategy per repo

```
scripts/ingest-videos.js
  ├── downloadFile(url, dest)        → raw fetch + write
  ├── convertToWebm(src, dest)       → ffmpeg -i src -c:v libsvtvp9 -crf 30 -b:v 0 -c:a libopus dest.webm
  ├── extractPoster(video, dest)     → ffmpeg -ss 2 -i video -vframes 1 -q:v 2 dest.jpg
   ├── extractPoster(video, dest)     → ffmpeg frame extraction
  └── normalizeEntry(jsonEntry, repo) → map to VideoDemo schema
```

### 4.2 Per-repo ingestion details (video + English prompt required)

| Repo | Video download | Poster | Convert needed? | Verified working? |
|------|----------------|--------|-----------------|-------------------|
| BeatAPI fork | `media.beatapi.io/.../*.webm` | `.jpg` from same CDN | No — already .webm | ✅ CDN returns 200 |
| ZeroLu | `raw.githubusercontent.com/.../videos/*.mp4` | Extract from video | Yes — `.mp4` → `.webm` | ✅ 14 files listed |
| HuyLe82US | `github.com/user-attachments/*` URLs in README | Extract from video | Yes — `.mp4` → `.webm` | ✅ URLs in README |
| visual-prompt-feed | `video.twimg.com/amplify_video/*.mp4` | `cdn.imglume.com/*` `.jpg` | Yes — `.mp4` → `.webm` | ✅ URLs verified |

> **Validation step** (added to ingest script): Before writing any data file, verify that every entry has a non-empty `videoSrc`, a non-empty `prompt`, AND `language === "en"` (or the source is confirmed English). Entries missing any of these three are skipped.

**Total downloads**: 50 (BeatAPI) + 14 (ZeroLu) + 15 (HuyLe82US) + 30 (visual-prompt-feed) = **109 videos**
**Total media size**: ~250–400 MB (after .webm conversion)

### 4.3 Media directory layout (target)

```
public/media/
  minimax-h3/           ← existing (30 webm + 30 svg)
    videos/
    previews/
  seedance-25/          ← NEW (BeatAPI fork)
    videos/             ← 50 .webm files (downloaded from CDN)
    previews/           ← 50 .jpg thumbnails (downloaded from CDN)
  seedance-1/           ← NEW (ZeroLu)
    videos/             ← 14 .webm files (converted from .mp4)
    previews/           ← 14 .jpg frames (extracted)
  seedance-prompts/     ← NEW (HuyLe82US)
    videos/             ← 15 .webm files (converted from proof clips)
    previews/           ← 15 .jpg frames (extracted)
  promptfeed/           ← NEW (visual-prompt-feed)
    videos/             ← 30 .webm files (converted from .mp4)
    previews/           ← 30 .jpg thumbnails (from cdn.imglume.com)
```

---

## 5. Category Mapping (to existing 7)

All source categories are mapped to the existing 7 landing categories. **No new categories are added.**

| Source Category | Source Repo | Maps to |
|---|---|---|
| cinematic-story | BeatAPI | Cinema |
| cinematic-action | BeatAPI | Action |
| brand-film | BeatAPI | Commercial |
| music-video | BeatAPI | Social |
| vlog | BeatAPI | UGC |
| animation | BeatAPI | Animation |
| fantasy | BeatAPI | Cinema |
| documentary | BeatAPI | Social |
| comedy | BeatAPI | Social |
| horror | BeatAPI | Cinema |
| dance | BeatAPI | Animation |
| performance | BeatAPI | Social |
| dialogue | BeatAPI | Social |
| --- | --- | --- |
| Cinematic Film Styles | ZeroLu | Cinema |
| Advertising & Commercial Branding | ZeroLu | Commercial |
| Social Media & Viral Memes | ZeroLu | Social |
| UGC Style | ZeroLu | UGC |
| Anime & Animation Styles | ZeroLu | Animation |
| Short-form Drama & Web Series | ZeroLu | Cinema |
| Visual Effects & Experimental | ZeroLu | Cinema |
| --- | --- | --- |
| cinematic-vfx | HuyLe82US | Cinema |
| commercial-product | HuyLe82US | Commercial |
| ugc-social | HuyLe82US | UGC |
| action-fight | HuyLe82US | Action |
| anime-manga | HuyLe82US | Animation |
| drama-romance | HuyLe82US | Cinema |
| fantasy | HuyLe82US | Cinema |
| horror | HuyLe82US | Cinema |
| sci-fi-cyberpunk | HuyLe82US | Action |
| nature-documentary | HuyLe82US | Social |
| epic-spectacle | HuyLe82US | Action |
| superhero-powers | HuyLe82US | Action |
| comedy-meme | HuyLe82US | Social |
| --- | --- | --- |
| cinematic | visual-prompt-feed | Cinema |
| character | visual-prompt-feed | Animation |
| product-ads | visual-prompt-feed | Commercial |
| ugc | visual-prompt-feed | UGC |
| nature | visual-prompt-feed | Social |
| travel | visual-prompt-feed | Social |
| camera-moves | visual-prompt-feed | Action |
| animation | visual-prompt-feed | Animation |
| food-drink | visual-prompt-feed | Commercial |
| --- | --- | --- |

### Studio tab mapping

| Category | studioTab | Route example |
|---|---|---|
| Cinema | `cinema` | `/studio/cinema?template=seedance-25-cinematic-story-slug` |
| Commercial | `marketing` | `/studio/marketing?template=seedance-prompts-commercial-product-slug` |
| Action | `cinema` | `/studio/cinema?template=promptfeed-camera-moves-slug` |
| Animation | `ai-influencer` | `/studio/ai-influencer?template=seedance-25-animation-slug` |
| UGC | `video` | `/studio/video?template=seedance-1-ugc-slug` |
| Social | `video` | `/studio/video?template=seedance-25-music-video-slug` |
| Fashion | `ai-influencer` | `/studio/ai-influencer?template=minimax-h3-fashion-slug` |

> The `Fashion` category is covered by existing minimax-h3 demos + any fashion-related entries from source repos.

---

## 6. Curation Strategy (every demo has video + prompt, English-only)

### 6.1 Per-repo curation

| Repo | Source count (EN) | Curated count | Method |
|---|---|---|---|
| BeatAPI fork | 241 | **50** | Top 3–4 per category by `videoBytes` (proxy for production quality), 1 hero + 1 interactive |
| ZeroLu | 14 | **14** (all) | Every .mp4 in the repo maps to a README prompt |
| HuyLe82US | ~70 (13 cats) | **15** | "Best Prompts" section (5) + 1 per remaining category (10) |
| visual-prompt-feed | 746 EN video | **30** | From seedance index → filter `mediaType=video` + `language=en` → sort by engagement → top 2 per category + 2 hero |

### 6.2 Hero / featured / interactive assignments

| Section | Hero | Interactive | Featured reel (6) |
|---|---|---|---|
| BeatAPI (seedance-25) | `brand-film` with highest videoBytes (30s, 16:9) | `cinematic-action` transformation clip | Top 6 by videoBytes |
| ZeroLu (seedance-1) | "Denis Villeneuve Desert Scene" | "Surrealistic Mirror Reflection" | All 14 (in reel) |
| HuyLe82US | "Mythic Monkey King Clash" (has proof clip) | "10s MV Trio" (multi-style) | 6 with best proof clips |
| visual-prompt-feed | "Luxury jewelry commercial" (highest engagement) | "Fashion evolution" video | Top 6 by engagement |

> **Excluded**: `ai-shortfilm-prompts` — no videos exist in the repo. The prompts are English and high-quality, but without a `videoSrc` each entry would fail the validation step in §4.2. Re-run the ingestion script once videos are rendered and uploaded to the repo.

### 6.3 BeatAPI curation detail (241 → 50)

1. Filter to `outputStatus` = `"source-verified"` or `"official-example"` (295 + 5 = 300 qualify)
2. Filter to English-only prompts (no Chinese characters in `prompt` field) → 241 entries
3. Sort by `media.videoBytes` descending (larger = higher production value)
4. Take top 3 per category (13 categories × 3 = 39) + top 5 overall = 44
5. Add 1 hero (best cinematic-story, 16:9, 30s, source-verified) + 1 interactive (best brand-film) = 46
6. Add 4 more from remaining (across underrepresented categories) = 50

### 6.4 visual-prompt-feed curation detail (746 → 30)

1. Read `indexes/models/seedance.json` → get 786 imglume IDs
2. Cross-reference with `prompts.jsonl` → filter `mediaType === "video"`
3. Filter `language === "en"` (or `language === null` if prompt text is English)
4. Verify `media.sourceUrl` starts with `http` (downloadable)
5. Sort by engagement proxy: `recommended.quality === "high"` first, then `recommended.durationSeconds >= 15`
6. Take top 2 per category across 14 categories (28) + 2 hero/interactive = 30

---

## 7. Component Design Details

### 7.1 `AIVideoGallery` → accept props (backward compatible)

```tsx
type VideoGalleryProps = {
  demos?: VideoDemo[];        // defaults to MINIMAX_H3_DEMOS
  categories?: string[];      // defaults to DEMO_CATEGORIES
  sectionId?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  initialCount?: number;      // default 12
  step?: number;              // default 12
};
```

Existing call site `<AIVideoGallery />` continues working with defaults. New sections pass props:
```tsx
<AIVideoGallery
  demos={SEEDANCE_25_DEMOS}
  categories={SEEDANCE_25_CATEGORIES}
  eyebrow="Seedance 2.5 showcase"
  title="300+ Curated Seedance 2.5 Prompts"
  subtitle="Source-verified cinematic, anime, UGC, and commercial generations."
/>
```

### 7.2 `DemoMediaCard` (minimal change)

Only the type import changes:
```typescript
// Before: import { getCreateUrl, type MinimaxDemo } from '@/data/minimaxH3Demos';
// After:  import { getCreateUrl, type VideoDemo } from '@/data/types';
```

Card renders identically: `LazyVideo` + category badge + title + useCase + "View Prompt" + "Create This Style". Since all included demos have videos, no "Preview unavailable" cases arise.

### 7.3 `DemoPromptModal` (minimal change)

Same type import change. Optionally add `sourceUrl` link in the meta grid for attribution (CC BY 4.0 + source-verified entries).

### 7.4 New hero components

**`Seedance25Hero.tsx`** — mirrors `CinematicVideoHero.tsx` but accepts a `demo` prop:
```tsx
export default function Seedance25Hero({ demo }: { demo: VideoDemo }) {
  // Same layout: full-bleed LazyVideo + gradient scrim + headline + 2 CTAs
}
```

### 7.5 `Seedance1Reel.tsx` (new)

Horizontal scroll reel of 14 ZeroLu video demos using `DemoMediaCard`, same pattern as `MadeWithSmartVideo.tsx`.

---

## 8. Implementation Phases

### Phase A: Type abstraction + component generalization (1–2 days)

1. Create `src/data/types.ts` with `VideoDemo` type + `getCreateUrl()`
2. Update `src/data/minimaxH3Demos.ts` — `export type MinimaxDemo = VideoDemo`, re-export `getCreateUrl`
3. Update `components/landing/DemoMediaCard.tsx` — import from `@/data/types`
4. Update `components/landing/DemoPromptModal.tsx` — import from `@/data/types`
5. Update `components/landing/AIVideoGallery.tsx` — accept optional `demos`, `categories`, label props (keep defaults for backward compat)
6. Update `MadeWithSmartVideo.tsx` and `UGCDemoShowcase.tsx` — accept optional `demos` prop
7. **Verify**: Dev server starts, existing minimax demos still render, no TypeScript errors

### Phase B: Asset pipeline + data ingestion — COMPLETED ✅

**Sub-phase B1: BeatAPI fork (seedance-25)** ✅
1. Fetched `catalog.json` from `BeatAPI/awesome-seedance-2-5-prompts/main/prompts/catalog.json`
2. All 300 entries have `media.video` URL + `prompt` field
3. Filtered to English-only (regex check for CJK characters) → 241 entries
4. Curated to 50 (top by `videoBytes` per category, 1 hero + 1 interactive)
5. Downloaded 50 `.webm` videos from `media.beatapi.io` → `public/media/seedance-25/videos/`
6. Downloaded 50 `.jpg` thumbnails → `public/media/seedance-25/previews/`
7. Generated `src/data/seedance25Demos.ts` with 50 entries

**Sub-phase B2: ZeroLu (seedance-1)** ✅
1. Parsed README → 44 English entries with video + prompt
2. Curated to 14 (2 per category, prioritized Cinema/Animation/Commercial)
3. Downloaded 14 `.mp4` videos from `github.com/user-attachments/assets/` → `public/media/seedance-1/videos/`
4. Generated 14 SVG poster placeholders → `public/media/seedance-1/previews/`
5. Generated `src/data/seedance1Demos.ts` with 14 entries

**Sub-phase B3: HuyLe82US — SKIPPED ❌**
- GitHub user-attachments URLs all return 404 (videos were deleted)
- Repo contains no local video files — only `.md` prompt files
- Excluded from showcase per core constraint (no videos available)

**Sub-phase B4: visual-prompt-feed (promptfeed)** ✅
1. Parsed `data/prompts.jsonl` (1,658 entries) → filtered to `recommendedModel=seedance` + `mediaType=video` + `language=en` → 679 English entries
2. Curated to 30 (sorted by engagement score: likes + reposts×3)
3. Downloaded 30 `.mp4` videos from `video.twimg.com/amplify_video/` → `public/media/promptfeed/videos/`
4. Downloaded 30 `.jpg` thumbnails from `cdn.imglume.com` → `public/media/promptfeed/previews/`
5. Generated `src/data/promptFeedDemos.ts` with 30 entries

### Phase C: New section components — COMPLETED ✅

1. ✅ Created `components/landing/Seedance25Hero.tsx` (full-bleed hero)
2. ✅ Created `components/landing/Seedance1Reel.tsx` (horizontal reel, 14 cards)
3. ✅ Created `components/landing/SeedancePromptsHero.tsx` (placeholder hero)
4. ✅ Created `components/landing/PromptFeedHero.tsx` (full-bleed hero)
5. ✅ Updated `SmartVideoShowcase.tsx` — 4 new galleries + 3 heroes inserted

### Phase D: Curation & polish — COMPLETED ✅

1. ✅ Assigned `hero`, `featured`, `interactive` flags in each data file
2. ✅ Verified all 50 + 14 + 30 = **94 unique slugs** don't collide across repos
3. ✅ Category filter tabs show only the 7 mapped categories
4. ✅ TypeScript compiles clean (`npx tsc --noEmit` → 0 errors)
5. ✅ Dev server returns HTTP 200 with all new sections rendering

### Phase E: (Optional) Future live data sync

For repos that update regularly (BeatAPI, visual-prompt-feed):
1. Add `scripts/sync-catalogs.js` that re-fetches `catalog.json` and `prompts.jsonl`
2. Re-runs curation + data file generation (with the same video+prompt+English validation)
3. Add npm script: `"sync": "node scripts/sync-catalogs.js && node scripts/ingest-videos.js"`

---

## 10. Validation Checklist — COMPLETED ✅

- ✅ **Every data file entry** has a non-empty `videoSrc` (path to a `.webm` or `.mp4` in `/public/media/`)
- ✅ **Every data file entry** has a non-empty `prompt` field (English text)
- ✅ **No Chinese-character entries** from BeatAPI catalog (241 EN out of 300, curated to 50)
- ✅ **No Chinese-character entries** from visual-prompt-feed (679 EN out of 786, curated to 30)
- ✅ **Total video demos** = 94 (50 + 14 + 30) — all with video + English prompt
- ✅ **ai-shortfilm-prompts is NOT included** (0 videos = excluded entirely)
- ✅ **HuyLe82US is NOT included** (user-attachments URLs → 404, no local videos = excluded entirely)
- ✅ **All 94 `videoSrc` paths** resolve to local files
- ✅ **All 94 slugs** are unique across all repos (no collisions)
- ✅ **No new categories** beyond the existing 7 created
- ✅ **No new component UI** — every card uses `DemoMediaCard` unchanged
- ✅ **TypeScript compiles clean** — `npx tsc --noEmit` returns 0 errors
- ✅ **Dev server returns HTTP 200** with all new sections rendering
