# AI Viral Studio — Gallery & Category Patterns

**Purpose:** extract the *reusable* parts of AI Viral Studio's category taxonomy and
gallery organisation so the Personalization modal's **Demos tab** can reuse them
with **eligible GO AI demo videos only**.

**Scope boundary:** the AI Viral Studio component was **not** moved, rewritten or
re-styled. Only its *taxonomy* was read and mirrored in a new shared module. No
premium AI Viral Studio video content, video URL, video array or premium template
record was imported.

| New artefact | Purpose |
| --- | --- |
| `src/shared/personalization/guided/demoCategories.ts` | Content-free taxonomy + matching helpers |
| `src/shared/personalization/guided/DemoGalleryControls.tsx` | Reusable tabs / search / filter primitives |
| `src/shared/personalization/guided/__tests__/demoCategories.test.ts` | Taxonomy + data-free guard |
| `src/lib/nicheClassifier.ts` | **Additive** `export` on two existing keyword tables only |

---

## 1. The taxonomy that actually exists

AI Viral Studio has **two** category systems, plus one that only the landing page
uses. All three are real; none was invented for this work.

### 1.1 Business niches (the primary taxonomy — 14 ids)

Source of truth for ids **and** user-facing labels:
`src/data/nicheContent.ts:12` (`NICHE_CONTENT`), mirrored by the demo assignment
list `src/data/nicheDemos.ts:19` (`NICHE_DEMO_SLUGS`) and the OSM label map
`src/server/businessDiscovery/nicheMappings.ts:16` (`NICHE_MAPPINGS`).

| id | Landing label (`nicheContent.ts`) | OSM label (`nicheMappings.ts`) | Keyword table |
| --- | --- | --- | --- |
| `ecommerce` | Ecommerce & Products | E-Commerce / Retail | ✔ |
| `restaurants-food` | Restaurants & Food | Restaurants / Food | ✔ |
| `real-estate` | Real Estate | Real Estate | ✔ |
| `beauty` | Beauty, Skincare & Fashion | Beauty / Salon | ✔ |
| `wellness-fitness` | Fitness, Wellness & Coaching | Wellness / Fitness | ✔ |
| `education` | Education & Training | Education | ✔ |
| `technology` | Technology, SaaS & Apps | Technology / SaaS | ✔ |
| `finance` | Finance & Professional Services | Finance | ✔ |
| `entertainment-media` | Entertainment, Media & Creators | Entertainment / Media | ✔ |
| `automotive` | Automotive | Automotive | ✔ |
| `travel-hospitality` | Travel, Hotels & Hospitality | Travel / Hospitality | ✔ |
| `sports-outdoors` | Sports & Outdoors | Sports / Outdoors | ✔ |
| `general-business` | Business & More | General Business | fallback only |
| `viral-trending` | Viral & Trending | *(not in OSM map)* | landing-only |

The keyword table itself lives in `src/lib/nicheClassifier.ts:25`
(`NICHE_KEYWORDS`, 12 entries) and the classifier falls back to
`general-business` when nothing matches (`src/lib/nicheClassifier.ts:253`).

### 1.2 Sub-categories (11 niche groups)

`src/lib/nicheClassifier.ts:117` (`SUB_NICHE_KEYWORDS`) — the real sub-niche
structure, e.g. `ecommerce` → `fashion`, `luxury`, `tech-products`,
`home-goods`; `real-estate` → `residential`, `commercial`, `staging`,
`rentals`.

> Sub-niche ids are **not** globally unique (`fashion` is also a style
> category; `gaming` is a sub-category of two niches). The new module
> therefore addresses them as `"<niche>/<sub>"`, e.g. `ecommerce/fashion`.

### 1.3 Style categories (the gallery's own filter — 7 ids)

`src/data/types.ts:10` (`DEMO_CATEGORIES`) — the canonical buckets every
`VideoDemo` carries in its `category` field:

```ts
// src/data/types.ts:8
/** The 7 canonical landing-page categories. Source repos may use different
 *  labels (e.g. "music-video", "sci-fi-cyberpunk"); map them to these. */
export const DEMO_CATEGORIES = [
  'Action', 'Animation', 'Cinema', 'Commercial', 'Fashion', 'Social', 'UGC',
] as const;
```

### 1.4 Where the AI Viral Studio UI shows them

The studio's own sidebar is **server-driven** — it renders whatever
`meta.availableCategories` the API returns
(`src/apps/go-ai-viral/GoAiViralStudio.tsx:1446`), while the business-niche
counts are aggregated server-side
(`app/api/go-ai-viral/prompts/route.ts:135`).

### 1.5 Relationship to the existing Find-Local-Business niche list

`src/shared/personalization/businessNiches.ts:17` (`BUSINESS_NICHES`) is the
**Step 1 business-search** niche list. It is locked to the server's
`NICHE_MAPPINGS` by a sync test
(`src/shared/personalization/__tests__/businessNiches.test.ts:14`) because the
`/api/personalization/find-businesses` route rejects unknown niches.

The new demo taxonomy deliberately uses the **demo-facing** labels from the
AI Viral Studio landing pages, so the two lists share **13 ids** and differ in
exactly two places:

| id | In `BUSINESS_NICHES` (Step 1) | In `DEMO_CATEGORIES` (Demos tab) | Why |
| --- | --- | --- | --- |
| `viral-trending` | ✗ | ✔ | Landing/demo bucket only — no OSM mapping |
| `healthcare-medical` | ✔ | ✗ | Business discovery only — no landing content, no demo group |

`src/shared/personalization/guided/__tests__/demoCategories.test.ts` asserts
this alignment, so a typo in either list fails the build.

---

## 2. Category tab navigation

### 2.1 AI Viral Studio sidebar (active state + counts)

`src/apps/go-ai-viral/GoAiViralStudio.tsx:1433`

```tsx
{/* Categories */}
<div>
  <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
    Categories
  </p>
  <div className="flex flex-col gap-1 max-h-80 overflow-y-auto custom-scrollbar">
    <button
      onClick={() => { setSelectedCategory(''); setPage(1) }}
      className="text-left px-3 py-2 rounded-lg text-sm transition-all"
      style={optionStyle(selectedCategory === '')}
    >
      All categories
    </button>
    {availableCategories.map((cat) => {
      const count = categoryCounts[cat]?.total || 0
      return (
        <button
          key={cat}
          onClick={() => { setSelectedCategory(cat); setPage(1) }}
          className="flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-all"
          style={optionStyle(selectedCategory === cat)}
        >
          <span className="capitalize">{cat.replace(/-/g, ' ')}</span>
          <span
            className="text-xs px-1.5 py-0.25 rounded-full"
            style={{
              background: selectedCategory === cat
                ? 'rgba(34,211,238,0.2)'
                : 'rgba(255,255,255,0.05)',
              color: selectedCategory === cat ? 'var(--color-primary)' : semantic.textMuted,
            }}
          >
            {count}
          </span>
        </button>
      )
    })}
  </div>
</div>
```

**Reusable rules extracted**

1. Active state = a distinct pill colour (`buttons.activePill` vs
   `buttons.inactivePill`, `src/shared/styles/designTokens.ts:112`).
2. Every option shows its **item count** in a trailing pill; the active option's
   pill picks up the accent colour.
3. Selecting a category **resets pagination to page 1**.
4. A catch-all option ("All categories") always comes first and uses the
   *empty* filter value — never the literal string `"all"`.
5. Labels are de-slugged for display: `cat.replace(/-/g, ' ')` +
   `capitalize`.

### 2.2 AI Viral Studio landing gallery (pill row)

`components/landing/AIVideoGallery.tsx:63`

```tsx
{/* Category filter */}
<div className="mt-10 flex flex-wrap justify-center gap-2">
  {categories.map((cat) => {
    const active = cat === category;
    return (
      <button
        key={cat}
        type="button"
        onClick={() => {
          setCategory(cat);
          setVisible(initialCount);
        }}
        aria-pressed={active}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
          active
            ? 'border-transparent bg-gradient-to-r from-cyan-400 to-purple-500 text-black'
            : 'border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]'
        }`}
      >
        {cat}
      </button>
    );
  })}
</div>
```

**Reusable rules extracted:** a wrapping row of pill buttons; `aria-pressed`
carries the active state; changing the category **resets the "show more"
window** to its initial size.

### 2.3 Keyboard behaviour

AI Viral Studio uses **native `<button>` elements** everywhere (sidebar and
landing gallery). Consequences that were preserved:

* Tab moves focus between options in DOM order — there is **no** roving
  tabindex and **no** arrow-key handling.
* <kbd>Enter</kbd> / <kbd>Space</kbd> activate the focused option natively.
* The studio sets `aria-pressed` on its pill row and `aria-selected` on its
  segmented mode switcher (`GoAiViralStudio.tsx:1320`).

The new `DemoCategoryTabs` primitive keeps native buttons and adds
`role="tab"` / `aria-selected` to match the Personalization modal's own tab
pattern (`StepChooseVideo.tsx:429`).

---

## 3. Gallery grid & card design

### 3.1 AI Viral Studio grid

`src/apps/go-ai-viral/GoAiViralStudio.tsx:1646`

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {records.map((record) => (
    <PromptCard
      key={record.id}
      record={record}
      isSelected={selectedRecord?.id === record.id}
      onSelect={setSelectedRecord}
    />
  ))}
</div>
```

* 1 → 2 → 3 → 4 columns, `gap-4`.
* A **grid/list view switch** exists (`GoAiViralStudio.tsx:1513`).

### 3.2 AI Viral Studio card

`src/apps/go-ai-viral/GoAiViralStudio.tsx:164`

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={() => onSelect(record)}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(record)
    }
  }}
  className={classNames(
    'group relative flex flex-col rounded-3xl border text-left transition-all duration-300 overflow-hidden',
    isSelected
      ? 'border-cyan-400/50 bg-cyan-400/[0.03]'
      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
  )}
>
  <div className="relative">
    {activeImageUrl ? (
      <div className="relative aspect-video overflow-hidden">
        <img
          src={activeImageUrl}
          alt={record.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => { /* fall back to the next candidate image */ }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    ) : ( /* icon placeholder */ )}
    <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90"
      style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
      {(record.categories || []).slice(0, 1).join(', ') || record.mediaType}
    </span>
    {/* …"View details" button, hover play affordance, engagement overlay… */}
  </div>
  <div className="flex flex-1 flex-col p-5">
    <h3 className="text-lg font-bold leading-snug text-white line-clamp-2">{record.title}</h3>
    <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-white/55">{record.prompt}</p>
  </div>
</div>
```

**Reusable rules extracted**

| Aspect | Rule |
| --- | --- |
| Thumb | `aspect-video` + `object-cover`; `loading="lazy"`; a **gradient scrim** fades in on hover |
| Category badge | Glass pill **top-left** (`rgba(255,255,255,.1)` + `backdropFilter: blur(8px)`), uppercase, letter-spaced |
| Hover | Card border lightens, background lifts, thumbnail scales `1.05`, a play affordance fades in |
| Selected | Cyan border + cyan-tinted background (`border-cyan-400/50 bg-cyan-400/[0.03]`) |
| Title / meta | Bold title, `line-clamp-2`; muted secondary line under it |
| Broken media | `onError` swaps to the next candidate image, then to an icon placeholder |

### 3.3 The Demos-tab card already in the modal

`src/shared/personalization/guided/StepChooseVideo.tsx:225` — the modal's
existing demo card, whose patterns the new primitives must stay consistent with:

```tsx
<div style={{ position: 'relative' }}>
  {active ? (
    <DemoCardPlayer key={`demo-player-${demo.id}-${demo.slug}`} demo={demo} />
  ) : (
    <img
      src={demo.posterSrc}
      alt=""
      loading="lazy"
      style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 8, display: 'block', background: '#000' }}
    />
  )}
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); pickDemo(demo) }}
    onMouseEnter={() => setHoveredDemoKey(`${demo.id}-${demo.slug}`)}
    onMouseLeave={() => setHoveredDemoKey(null)}
    aria-label={`Play ${demo.title}`}
    style={{
      position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', cursor: 'pointer',
      opacity: active || hoveredDemoKey === `${demo.id}-${demo.slug}` ? 1 : 0,
      transition: 'opacity .15s ease',
      ...(active
        ? { top: 6, left: 6, width: 28, height: 28, borderRadius: 999, background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.25)' }
        : { inset: 0, borderRadius: 8, background: 'rgba(0,0,0,.35)', border: 'none' }),
    }}
  >
    <Play size={active ? 13 : 26} color="#fff" />
  </button>
  {active && (
    <span style={{ ...badgeStyle('green'), position: 'absolute', top: 6, right: 6 }}>
      <Check size={10} /> Selected
    </span>
  )}
</div>
```

Key rules: **only the selected card mounts a `<video>`** (exactly one clip is
ever fetched); the poster is the thumbnail for every other card; the play
overlay is hidden until hover; the "Selected" badge is `badgeStyle('green')`.

### 3.4 Landing demo card

`components/landing/DemoMediaCard.tsx:42` — same shape, but the badge is the
demo's **category** and the whole card is a link to `/demo/{slug}`:

```tsx
<Reveal
  as="article"
  delay={Math.min(index, 8) * 60}
  className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition duration-300 hover:border-white/20 hover:bg-white/[0.04]"
  onClick={openDetail}
>
  <div className="relative">
    <LazyVideo src={demo.videoSrc} poster={demo.posterSrc} label={`${demo.title} — video preview`} hoverPlay toggleOnClick className={`${aspectClassName} w-full`} objectFit={objectFit} />
    <span className="glass-panel absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
      {badge ?? demo.category}
    </span>
  </div>
  <div className="flex flex-1 flex-col p-5">
    <h3 className="text-lg font-bold leading-snug text-white">{demo.title}</h3>
    <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-white/55">{demo.useCase}</p>
    {/* …actions… */}
  </div>
</Reveal>
```

Note the stagger: `delay={Math.min(index, 8) * 60}` — the reveal animation
stops staggering after the 8th card.

---

## 4. Search input

### 4.1 AI Viral Studio

`src/apps/go-ai-viral/GoAiViralStudio.tsx:1351`

```tsx
{/* Search */}
<div>
  <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
    Search
  </p>
  <div className="relative">
    <Search
      size={14}
      className="absolute left-3 top-2.5"
      style={{ color: semantic.textMuted }}
    />
    <input
      type="text"
      value={studioMode === 'video-prompts' ? videoSearchInput : searchInput}
      onChange={(e) => { /* … */ }}
      placeholder={studioMode === 'video-prompts' ? 'Search video prompts...' : 'Search prompts, tags...'}
      aria-label="Search prompts"
      className="w-full rounded-xl bg-white/5 border border-white/10 px-9 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors"
    />
  </div>
</div>
```

### 4.2 Debounce

`src/apps/go-ai-viral/GoAiViralStudio.tsx:1060` — the raw input is kept in a
separate state and only pushed into the query state after **500 ms**:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (studioMode === 'video-prompts') {
      // videoSearchInput is used directly by fetchVideoFeed
    } else {
      setSearch(searchInput)
    }
  }, 500)
  return () => clearTimeout(timer)
}, [searchInput, videoSearchInput, studioMode])
```

### 4.3 Matching rules (server)

`app/api/go-ai-viral/prompts/route.ts:222` — title, prompt and tags,
case-insensitive:

```ts
if (search) {
  const term = search.toLowerCase()
  filtered = filtered.filter(
    (r) =>
      (r.title || '').toLowerCase().includes(term) ||
      (r.prompt || '').toLowerCase().includes(term) ||
      (r.tags || []).some((t: string) => t.toLowerCase().includes(term))
  )
}
```

The new module's `matchesDemoQuery()` mirrors this for `VideoDemo`
(`title`, `useCase`, `prompt`, `tags`).

### 4.4 Modal-consistent variant already in the codebase

`src/shared/personalization/guided/TemplateBrowser.tsx:235` — a labelled
search field with the icon inset by `paddingLeft: 32`; the new
`DemoSearchInput` copies this exact treatment using the modal's own
`inputStyle` token.

---

## 5. Filter controls

AI Viral Studio's filters are **sidebar sections of stacked pill buttons**, not
`<select>` elements. Four dimensions exist:

| Dimension | Source | Reset behaviour |
| --- | --- | --- |
| Availability (video only / video + prompt / all) | `GoAiViralStudio.tsx:1379` | `setVideoPage(1)` |
| Sort (newest / oldest) | `GoAiViralStudio.tsx:1410` | `setPage(1)` |
| Model (all models + per-model counts) | `GoAiViralStudio.tsx:1473` | `setPage(1)` |
| Language (all languages + per-language) | `GoAiViralStudio.tsx:1540` | `setVideoPage(1)` |

`src/apps/go-ai-viral/GoAiViralStudio.tsx:1410`

```tsx
{/* Sort */}
<div>
  <p className="text-xs font-medium mb-2" style={{ color: semantic.textLabel }}>
    Sort By
  </p>
  <div className="flex flex-col gap-1">
    <button
      onClick={() => setSort('newest')}
      className="text-left px-3 py-2 rounded-lg text-sm transition-all"
      style={optionStyle(sort === 'newest')}
    >
      Newest first
    </button>
    <button
      onClick={() => setSort('oldest')}
      className="text-left px-3 py-2 rounded-lg text-sm transition-all"
      style={optionStyle(sort === 'oldest')}
    >
      Oldest first
    </button>
  </div>
</div>
```

**Reusable rules extracted:** a titled section, stacked full-width options, the
active option styled with the accent pill, and **every filter change resets
the result set to the first page**.

Because the Personalization modal is narrow, the new
`DemoFilterSelect` primitive renders the same *dimensions* as a compact
`<select>` built from the modal's `inputStyle` + `labelStyle` tokens, so the
control still fits a modal column.

---

## 6. How counts are computed

### 6.1 Studio sidebar (server-aggregated)

`app/api/go-ai-viral/prompts/route.ts:135` — one pass over the classified
records, counting every niche a record belongs to:

```ts
// Aggregate niche counts for sidebar/filter UI
const nicheCounts = new Map<string, number>()
for (const result of nicheMap.values()) {
  for (const niche of result.businessNiches) {
    nicheCounts.set(niche, (nicheCounts.get(niche) || 0) + 1)
  }
}

const availableNiches = Array.from(nicheCounts.entries())
  .map(([id, count]) => ({ id, label: humanizeNiche(id), count }))
  .sort((a, b) => b.count - a.count)
```

Sub-niche counts are aggregated the same way, grouped by primary niche
(`route.ts:151`).

### 6.2 Client read

`src/apps/go-ai-viral/GoAiViralStudio.tsx:1275`

```tsx
// ── Sidebar category data ────────────────────────────────────────────────────
const categoryCounts = useMemo(() => {
  if (!stats?.categories) return {}
  return stats.categories
}, [stats?.categories])

const modelCounts = useMemo(() => {
  if (!stats?.recommendedModels) return {}
  return stats.recommendedModels
}, [stats?.recommendedModels])
```

### 6.3 The rule that matters

**Counts are not a partition.** A record that belongs to two niches is counted
in both, so the sum of the category counts exceeds the total. The same rule is
reproduced in `countDemosByCategory()` in the new module.

The Motion Studio browser in the same modal shows the pattern locally
(`TemplateBrowser.tsx:279`): each tab renders `category.count` in a
`badgeStyle(active ? 'cyan' : 'muted')` pill.

---

## 7. Lazy loading & pagination

AI Viral Studio has **two different strategies**, one per surface.

### 7.1 Studio feed — infinite scroll with a sentinel

`src/apps/go-ai-viral/GoAiViralStudio.tsx:1217`

```tsx
// Setup infinite scroll observer
useEffect(() => {
  if (!sentinelRef.current && !videoSentinelRef.current) return

  const createObserver = (sentinel: HTMLDivElement | null, enabled: boolean) => {
    if (!sentinel || !enabled) return null
    return new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isVideoLoadingMore) {
          loadMore()
        }
      },
      { rootMargin: '400px' }
    )
  }

  const feedObserver = createObserver(sentinelRef.current, studioMode === 'feed')
  const videoObserver = createObserver(videoSentinelRef.current, studioMode === 'video-prompts')

  if (feedObserver && sentinelRef.current) {
    feedObserver.observe(sentinelRef.current)
    infiniteObserverRef.current = feedObserver
  }
  // …cleanup disconnects both observers…
}, [studioMode, loadMore, isLoadingMore, isVideoLoadingMore])
```

The sentinel itself and the "Loading more…" spinner
(`GoAiViralStudio.tsx:1727`):

```tsx
{/* Infinite scroll sentinel */}
{studioMode === 'feed' && hasMore && (
  <div ref={sentinelRef} className="h-8 w-full" aria-hidden="true" />
)}
{studioMode === 'video-prompts' && videoHasMore && (
  <div ref={videoSentinelRef} className="h-8 w-full" aria-hidden="true" />
)}

{(studioMode === 'feed' ? isLoadingMore : isVideoLoadingMore) && (
  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    <span>Loading more...</span>
  </div>
)}
```

Pages are **appended with de-duplication** (`GoAiViralStudio.tsx:1103`):

```tsx
if (isInitial) {
  setRecords(json.data)
} else {
  setRecords((prev) => {
    const seen = new Set(prev.map((r) => r.id))
    const deduped = json.data.filter((r) => !seen.has(r.id))
    return [...prev, ...deduped]
  })
}
setHasMore(pageNum < (json.pagination?.totalPages || 1))
```

Image laziness is handled separately: every thumbnail is `loading="lazy"`
(`GoAiViralStudio.tsx:190`), and the landing gallery uses a `LazyVideo`
component that only loads the clip on hover
(`components/landing/DemoMediaCard.tsx:50`).

### 7.2 Landing gallery — explicit "Show More"

`components/landing/AIVideoGallery.tsx:7` and `:95`

```tsx
const INITIAL_COUNT = 12;
const STEP = 12;

// …

{/* Show more */}
{visible < filtered.length && (
  <div className="mt-10 flex justify-center">
    <button
      type="button"
      onClick={() => setVisible((v) => v + STEP)}
      className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
    >
      Show More ({filtered.length - visible} more)
    </button>
  </div>
)}
```

`components/landing/NicheSection.tsx:7` uses the same pattern with
`INITIAL_COUNT = 10` / `STEP = 10` and a "N more" badge.

**Reusable rules extracted**

* A fixed **initial window** + a fixed **step**.
* The "Show More" button shows the **exact remaining count**.
* Changing the category **resets the window** to `INITIAL_COUNT`.
* The "end of list" state is explicit ("— End of feed —",
  `GoAiViralStudio.tsx:1744`).

---

## 8. What the new module exports

`src/shared/personalization/guided/demoCategories.ts`

| Export | Purpose |
| --- | --- |
| `ALL_DEMOS_CATEGORY_ID` | `'all'` — the catch-all id |
| `DEMO_CATEGORIES` | Ordered `readonly DemoCategory[]` — `all` + the 14 real business niches |
| `DEMO_STYLE_CATEGORIES` | The 7 real style categories (`action` … `ugc`) |
| `DEMO_SUBCATEGORIES` | The real sub-niche structure, keyed by niche |
| `getDemoCategoryIds(demo)` | Business niches a demo belongs to (multi-match, `general-business` fallback) |
| `getDemoSubcategoryIds(demo, nicheId?)` | Sub-category ids of a niche |
| `getQualifiedSubcategoryId(niche, sub)` | `"<niche>/<sub>"` |
| `isStyleCategoryId(id)` | True for the seven style ids |
| `isCategoryActiveForDemo(categoryId, demo)` | The matcher (all / style / niche / qualified sub-category) |
| `countDemosByCategory(demos)` | Per-category counts, non-partitioned |
| `filterDemosByCategory(demos, categoryId)` | Filter helper |
| `matchesDemoQuery(demo, query)` | Search helper (title / use case / prompt / tags) |
| `getDemoCategory(id)` | Lookup by id |
| `humanizeTaxonomyId(id)` | Same slug → label rule as the API route |

`src/shared/personalization/guided/DemoGalleryControls.tsx`

| Export | Props |
| --- | --- |
| `DemoCategoryTabs` | `{ categories, counts, activeId, onChange, ariaLabel? }` |
| `DemoSearchInput` | `{ value, onChange, placeholder?, ariaLabel? }` |
| `DemoFilterSelect` | `{ label, value, options, onChange }` |

All three are content-free: every list, count and option arrives through props.
They are styled with the Personalization modal's own tokens
(`src/shared/personalization/guided/tokens.ts` — `C`, `chipStyle`, `badgeStyle`,
`inputStyle`, `labelStyle`), whose values were **not** changed.

---

## 9. Wiring it into the Demos tab (deliberately not done in this change)

Steps 1–3 of the Personalization Modal wizard are frozen for this task, so
`StepChooseVideo.tsx` was **not** modified. When the Demos tab is allowed to
change, the intended shape is:

```tsx
// inside StepChooseVideo.tsx — "demos" tab
const [category, setCategory] = useState(ALL_DEMOS_CATEGORY_ID)
const [query, setQuery] = useState('')

const counts = useMemo(() => countDemosByCategory(GUIDED_DEMO_VIDEOS), [])
const visible = useMemo(
  () =>
    filterDemosByCategory(GUIDED_DEMO_VIDEOS, category)
      .filter((demo) => matchesDemoQuery(demo, query)),
  [category, query],
)

<DemoCategoryTabs
  categories={DEMO_CATEGORIES}
  counts={counts}
  activeId={category}
  onChange={setCategory}
/>
<DemoSearchInput value={query} onChange={setQuery} placeholder="Search demos…" />
<DemoFilterSelect
  label="Style"
  value={style}
  options={[{ value: 'all', label: 'All styles' }, ...DEMO_STYLE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]}
  onChange={setStyle}
/>
```

`GUIDED_DEMO_VIDEOS` already contains only **eligible** GO AI demo videos —
`src/shared/personalization/guided/curatedDemos.ts:35` drops any entry without a
`videoSrc`/`posterSrc` or with a `blob:` source — so the Demos tab stays
GO-AI-only by construction.

---

## 10. Deliberately not copied

* Premium AI Viral Studio **video URLs**, **video arrays** and **premium
  template records** — out of scope, not present in any new file.
* The studio's **server feed** (`/api/go-ai-viral/prompts`) — the modal is
  browser-only; the new module classifies the demos that are already bundled
  in the app.
* Any change to the Personalization Modal wizard layout, Steps 1–3, the Remotion
  player, pill designs or the overlay/asset editor.
* The AI Viral Studio component itself — untouched.
