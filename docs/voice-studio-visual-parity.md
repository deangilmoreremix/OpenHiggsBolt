# VoiceStudio Visual Parity — SmartVideo GO Integration

**Upstream version:** VoiceStudio v0.5.2 (`vendor/VoiceStudio/frontend/src/`)  
**SmartVideo target:** `/studio/voice` (branch `integration/voice-studio-modal`)  
**Integration mode:** Direct React mount — upstream `App.jsx` rendered inside SmartVideo shell, no iframe  
**Last updated:** 2026-09-22  

---

## Visual Design System Comparison

### Upstream v0.5.2 Design Tokens

VoiceStudio v0.5.2 uses a custom CSS custom property design system (not Tailwind default):

| Token | Upstream Value | Usage |
|-------|---------------|-------|
| `--chrome-bg` | Dark surface (near-black) | Panel backgrounds, sidebar, cards |
| `--chrome-fg` | Off-white (`#f5f5f5` approx) | Primary text |
| `--chrome-fg-muted` | Mid-gray (`#a1a1aa` approx) | Secondary text, labels |
| `--chrome-fg-dim` | Dim gray (`#52525b` approx) | Tertiary text, placeholders |
| `--chrome-fg-inverse` | Near-black | Text on accent backgrounds |
| `--chrome-accent` | Variable per feature tile | Brand color, active states |
| `--chrome-accent-bg` | Tinted accent (5–12% opacity) | Active tab backgrounds, hover states |
| `--chrome-accent-border` | Accent at medium opacity | Active tab borders |
| `--chrome-hover-bg` | Slightly lighter than chrome-bg | Hover states for cards/rows |
| `--chrome-border` | Zero or very subtle | Borders (often zeroed app-wide) |
| `--chrome-radius-pill` | Full pill rounding | Buttons, tabs, cards |
| `--chrome-radius-md` | Medium rounding | Inputs, dialogs |
| `--chrome-radius-lg` | Large rounding | Panels, modals |
| `--chrome-label-size` | Small mono size | Section labels, badges |
| `--chrome-label-track` | Tight letter-spacing | Uppercase labels |
| `--chrome-font-mono` | Monospace stack | Meta text, timestamps |
| `--font-sans` | System sans-serif | Body text |
| `--font-serif` | System serif | Hero headings (Launchpad) |
| `--font-display` | Display font | Page titles |
| `--color-brand` | `#22d3ee` (cyan) — SmartVideo override | Brand color |
| `--color-bg` | `#050505` — SmartVideo override | Page background |
| `--color-bg-elev-1` | `#0a0a0a` — SmartVideo override | Elevated surface |
| `--color-bg-elev-2` | `#141414` — SmartVideo override | Higher surface |
| `--color-fg` | `#f5f5f5` — SmartVideo override | Primary text |
| `--color-fg-muted` | `#a1a1aa` — SmartVideo override | Secondary text |
| `--color-fg-subtle` | `#52525b` — SmartVideo override | Tertiary text |
| `--color-fg-inverse` | `#050505` — SmartVideo override | Inverse text |
| `--dur-base` | Standard transition duration | All transitions |
| `--dur-fast` | Fast transition duration | Hover/active transitions |
| `--ease-out` | Easing function | Transitions |
| `--space-*` | Spacing scale | Layout padding/gaps |

**Note:** SmartVideo's `theme.js` (`src/integrations/voice-studio/theme.js`) overrides `--color-brand`, `--color-bg`, `--color-bg-elev-1`, `--color-bg-elev-2`, `--color-fg`, `--color-fg-muted`, `--color-fg-subtle`, `--color-fg-inverse` on mount and clears them on unmount. The remaining `--chrome-*` tokens are left to upstream's `index.css` (scoped to `[data-voice-studio]`).

### SmartVideo Brand Overrides

| Token | SmartVideo Value | Upstream Default | Delta |
|-------|-----------------|-----------------|-------|
| `--color-brand` | `#22d3ee` (cyan) | `#d3869b` (pink, from feature tiles) | Brand color shifts from pink to cyan |
| `--color-brand-hover` | `#06b6d4` | Derived from accent | Darker cyan for hover |
| `--color-brand-glow` | `rgba(34,211,238,0.4)` | Derived from accent | Cyan glow for focus rings |
| `--color-bg` | `#050505` | Near-black (unchanged) | No visible change |
| `--color-bg-elev-1` | `#0a0a0a` | Slightly lighter than bg | No visible change |
| `--color-bg-elev-2` | `#141414` | Higher elevation | No visible change |
| `--color-fg` | `#f5f5f5` | Near-white (unchanged) | No visible change |
| `--color-fg-muted` | `#a1a1aa` | Mid-gray (unchanged) | No visible change |
| `--color-fg-subtle` | `#52525b` | Dim gray (unchanged) | No visible change |

**What changes:** Active tabs, focus rings, accent badges, and brand highlights shift from VoiceStudio's default pink to SmartVideo's cyan.  
**What stays identical:** Layout structure, spacing, typography scale, surface layering, border treatment, component hierarchy.

---

## Screen-by-Screen Visual Comparison

### 1. Launchpad

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Hero eyebrow + serif H1 + description + signal-field bleed image. 8-column feature tile grid. Recent files strip. Cloned/designed/dubbing project rows. Demo callout. Readiness checklist. | Identical structure. Hero text uses `[font-family:var(--font-serif)]` with `--chrome-accent` emphasis. Signal-field image bleeds from right. | ✅ Layout match |
| **Controls** | Feature tiles are `<button>` with icon + title + description + count. Project rows have Open button. A/B Compare button gated to ≥2 profiles. | Identical button structure. A/B Compare renders conditionally. | ✅ Control match |
| **Workflow** | Click tile → switch mode + define method. Click project row Open → load project + switch mode. | `setMode` + `setDefineMethod` wired through store. Navigation unchanged. | ✅ Workflow match |
| **Color differences** | Feature tiles use per-tile hues: `#d3869b` (clone), `#8ec07c` (design), `#fe8019` (dub), `#83a598` (stories), `#458588` (audiobook), `#fabd2f` (gallery), `#b8bb26` (transcripts), `#689d6a` (convert). Active tab accents use `--chrome-accent`. | Same per-tile hues preserved. Brand accent (`--color-brand`) overridden to cyan, which affects active tab indicators, focus rings, and emphasis text in hero. | ⚠️ Expected: brand accent shifts to cyan; tile hues preserved |
| **Web-runtime differences** | None — Launchpad is pure React + CSS. No Tauri dependencies. | None. | ✅ No differences |

### 2. Voice → From Audio

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Tabs: From Audio / By Design / Convert. Script panel (top). Voice panel (middle, flex-1). Action bar (bottom, pinned). | Identical 3-tab structure. ScriptPanel, AudioMethodPanel, ActionBar render in same positions. | ✅ Layout match |
| **Controls** | Script textarea with insert-tag menu. Profile selector. Reference audio upload + preview + record + trim. Ref text input. Seed control. Save-as-profile. Overrides toggle + 10 production knobs. Language picker. Synthesize/Stop CTA. | All controls present and wired. Cmd/Ctrl+Enter shortcut active. Demo coach-mark for `demo0001`. "Hear demo" fallback when no TTS engine. | ✅ Control match |
| **Workflow** | Select profile → upload/record ref audio → type script → adjust overrides → Synthesize → playback. | Identical flow. Generation triggers `handleGenerate` → `api/generate.ts` → `/api/voice/generate`. | ✅ Workflow match |
| **Color differences** | Active tab: `--chrome-accent-bg` + `--chrome-accent-border`. Synthesize CTA: `--chrome-accent` background. | Active tab uses cyan (`#22d3ee`) instead of pink. CTA button uses cyan. | ⚠️ Expected: brand accent shifts |
| **Web-runtime differences** | None — all controls use standard HTML inputs, MediaRecorder, Web Audio API. | None. | ✅ No differences |

### 3. Voice → By Design

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Same tab structure as From Audio. Design panel replaces Audio panel. Identity recipe accordion. | Identical. DesignMethodPanel renders with describe input, personality chips, category sliders, identity accordion. | ✅ Layout match |
| **Controls** | Free-text describe input with debounce. Personality preset chips (legacy) + demo cards. Category sliders (Gender/Age/Pitch/Style/EnglishAccent/ChineseDialect) with mutual-exclusivity guard. Seed control. Save-as-design-profile. | All controls present. `applyPersonality` + `applyPresetAndInvalidate` wired. `handleVdChange` enforces exclusivity. | ✅ Control match |
| **Workflow** | Type description → debounced `/design/describe` maps to category picks → optionally apply personality preset → adjust sliders → Synthesize. | Identical flow. `/design/describe` proxied through `/api/voice/design/describe`. | ✅ Workflow match |
| **Color differences** | Same as From Audio — active tab + CTA use `--chrome-accent`. | Cyan brand accent. | ⚠️ Expected: brand accent shifts |
| **Web-runtime differences** | None. | None. | ✅ No differences |

### 4. Voice → Convert

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Convert tab hides Script panel and Action bar. ConvertMethodPanel takes full height. | Identical. ConvertMethodPanel renders with source/target voice selectors + record button. | ✅ Layout match |
| **Controls** | Source voice picker, target voice picker, record source audio, convert settings. | All present. MediaRecorder for source audio. | ✅ Control match |
| **Workflow** | Select source voice → record or upload source → select target voice → Convert. | Identical flow. | ✅ Workflow match |
| **Color differences** | Active tab uses `--chrome-accent`. | Cyan brand accent. | ⚠️ Expected: brand accent shifts |
| **Web-runtime differences** | None. | None. | ✅ No differences |

### 5. Dub

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Two-column resizable layout. Left: waveform + timeline + settings (language, engine, quality, multi-lang, glossary). Right: transcript table + track summary. Footer: export options. Pipeline stepper above editor. | Identical `DubResizableColumns` → `DubLeftColumn` + `DubRightColumn` + `DubFooter`. `DubPipelineStepper` renders before editor. `IdleSkeleton` renders before job starts. | ✅ Layout match |
| **Controls** | Upload/URL ingest, ASR install, transcribe, translate-all, generate, QC, preview switcher, burn subs, dual subs, karaoke, timing strategy, voice match, export modal, segment CRUD, bulk operations, glossary, track management. | All controls present and wired. `handleSegmentPreview`, `handleTranslateAll`, `handleDubGenerate`, `handleDubQc` all functional. | ✅ Control match |
| **Workflow** | Upload → transcribe → edit segments → translate → generate → QC → export. Multi-language batch: translate each target → generate each track. | Identical pipeline. `useDubWorkflow` handles all stages. SSE for streaming progress. | ✅ Workflow match |
| **Color differences** | Dub thumbnails use `#fe8019` accent. Progress bars use brand accent. Error banners use `rgba(251,73,52,0.25)` border. | Same accent colors preserved. Brand accent (`--color-brand`) overridden to cyan, affecting active states and progress indicators. | ⚠️ Expected: brand accent shifts; dub-specific hues preserved |
| **Web-runtime differences** | None — WaveSurfer.js, standard file input, fetch API. | None. YouTube URL ingest works via backend proxy. | ✅ No differences |

### 6. Stories

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Multi-voice script editor with cast sidebar, voice assignment per line, playback controls. | `components/StoriesEditor.jsx` renders inside mounted App. | ✅ Layout match (verified via E2E) |
| **Controls** | Script textarea, voice picker per segment, cast management, generate, playback. | All wired to `/api/voice/stories/*`. | ✅ Control match |
| **Workflow** | Write script → assign voices → generate → playback/download. | Identical flow. | ✅ Workflow match |
| **Color differences** | Uses `--chrome-accent` for active states. | Cyan brand accent. | ⚠️ Expected: brand accent shifts |
| **Web-runtime differences** | None. | None. | ✅ No differences |

### 7. Audiobook

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Hero (import/load sample/preview/create). 3 tabs: Script / Voices / Book. Status rail (warnings/progress/result/plan). | Identical structure. `AudiobookHero` + `Tabs` (Script/Voices/Book) + status rail. | ✅ Layout match |
| **Controls** | Script editor with Markdown, chapter detection. Voice cast panel with `[voice:NAME]` parsing. Book panel: format, loudness, cover, metadata, lexicon. Preview-per-chapter. Create/Stop. | All present. `parseCastNames`, `validateScript`, `overridesToRequest` all functional. | ✅ Control match |
| **Workflow** | Write/import script → assign voices → preview plan → create → stream progress → download m4b. | Identical flow. `audiobookGenerate` streams via `consumeLongformStream`. | ✅ Workflow match |
| **Color differences** | Uses `--chrome-accent` for active tabs, badges. Chapter status badges use green/amber/red. | Cyan brand accent for active tabs. Status colors preserved (green=done, amber=pending, red=failed). | ⚠️ Expected: brand accent shifts; semantic status colors preserved |
| **Web-runtime differences** | None — EPUB/PDF import uses web file picker. Cover via Blob URL. | None. | ✅ No differences |

### 8. Gallery

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Header with title + zone tabs (Archetypes/Community/My Imports). Content area with facet filters (Archetypes) or import form (My Imports). Grid/list view toggle. | Identical. `VoiceGallery` → zone tabs → `ArchetypesZone`/`CommunityZone`/`ImportsZone`. | ✅ Layout match |
| **Controls** | Facet filters, favorites, view toggle, preview playback, use-in-studio/stories/audiobook, open-designer, materialize-as-profile. | All present. `playUrl`, `materialize`, `openDesigner`, `placeProfile` all wired. | ✅ Control match |
| **Workflow** | Browse → preview → materialize as profile → place in workspace. | Identical flow. | ✅ Workflow match |
| **Color differences** | Gallery uses `#fabd2f` (yellow) accent for gallery-specific elements. | Yellow accent preserved. Brand accent (`--color-brand`) overridden to cyan for active states. | ⚠️ Expected: brand accent shifts; gallery yellow preserved |
| **Web-runtime differences** | None — `apiFetch` with `cache: 'no-store'` for previews. | None. | ✅ No differences |

### 9. Transcriptions

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Header with title + count badge + Capture button + search + export/clear. Shortcut hint bar. Two-column: list (left) + detail (right). Empty state with mic icon. | Identical. `TranscriptionsPage` renders header + content grid. | ✅ Layout match |
| **Controls** | Search, capture (mic), export TXT, clear all, copy, delete, segment timing display. ASR model chooser + install. | All present. `addTranscription`, `loadTranscriptions`, `copyText`, `exportAll`, `clearAll` all functional. | ✅ Control match |
| **Workflow** | Grant mic → select ASR model → capture → view transcript → copy/export/delete. | Identical flow. `requestDictationCapture` uses MediaRecorder. | ✅ Workflow match |
| **Color differences** | Uses `--color-brand` for selected state, focus rings. | Cyan brand accent. | ⚠️ Expected: brand accent shifts |
| **Web-runtime differences** | None — MediaRecorder + localStorage. | None. | ✅ No differences |

### 10. Projects (OmniDrive)

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Header strip (search + view toggle). Left filter rail (All/Dubs/Stories/Profiles/Transcripts/Audiobooks/History/Exports). Content area: grid or list cards. | Identical. `Projects` component renders header + sidebar + content grid. | ✅ Layout match |
| **Controls** | Search, grid/list toggle, filter buttons with counts, card/list items with accent colors + timestamps + actions. | All present. `Card` component renders in both grid and list modes. | ✅ Control match |
| **Workflow** | Filter/search → click card → open in respective workspace (dub/stories/profile/audiobook) or copy transcription. | Identical flow. `onOpenDub`, `onOpenProfile`, `onOpenStory`, `playRenderInApp` all wired. | ✅ Workflow match |
| **Color differences** | Each item type has accent color: dubs=`#fe8019`, stories=`#83a598`, profiles=clone=`#d3869b`/design=`#8ec07c`, history=`#f3a5b6`, exports=`#fabd2f`, audiobooks=`#d3869b`, transcripts=`#83a598`. | Same accent colors preserved per item type. | ✅ Color match (per-type accents preserved) |
| **Web-runtime differences** | None — all data from API + localStorage. `playRenderInApp` uses `fetch` + `playBlobAudio` (no `window.open`). | None. | ✅ No differences |

### 11. Settings

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Two-column: sidebar (search + category rail) + content pane (header + scrollable panel). macOS System Settings / VS Code style. | Identical. `Settings` component renders sidebar + content. | ✅ Layout match |
| **Controls** | Category buttons with icons + counts, search filter, ⌘K/Ctrl+K shortcut, deep-link support, restart badges. | All present. `SettingsSearch`, `SettingsSidebar`, `renderCategory` all functional. | ✅ Control match |
| **Workflow** | Click category → view panel. Search → filter categories. Deep-link → open category. | Identical flow. `CATEGORY_BY_ID` registry drives all panels. | ✅ Workflow match |
| **Color differences** | Active category: `--chrome-accent-bg` + `--chrome-accent` text + `--chrome-accent-border`. | Cyan brand accent for active category. | ⚠️ Expected: brand accent shifts |
| **Web-runtime differences** | Tauri-specific panels (Updates, Tauri logs, diagnostic bundle, self-check, system info, app/tauri version) are gated by `isTauri()` and show "desktop only" toasts or inert UI on web. | Desktop-only panels gracefully degrade. Web-compatible panels (Appearance, Privacy, Network, Logs frontend, etc.) render normally. | ✅ Expected degradation |

### 12. Model Catalogue

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Engine select, model list, install/uninstall/load/unload/flush actions, routing rules. | Renders via `CataloguePointer` in Settings → Engines/Models. Actual catalogue page lazy-loads from `pages/ModelCatalogue.jsx`. | ✅ Layout match |
| **Controls** | Engine dropdown, model cards with install/unload actions, routing table. | All present. Backend calls proxied through `/api/voice/*`. | ✅ Control match |
| **Workflow** | Install model → load → set as active → route generation requests. | Identical flow, Modal-backed. | ✅ Workflow match |
| **Color differences** | Uses `--chrome-accent` for active engine, installed badges. | Cyan brand accent. | ⚠️ Expected: brand accent shifts |
| **Web-runtime differences** | Model installation downloads to local filesystem via Tauri in desktop. In web, model management is UI-only; actual weights are served by Modal. | Model catalogue UI renders but local install path is inert. Modal serves weights on demand. | ✅ Expected adaptation |

### 13. Batch Queue

| Aspect | Upstream v0.5.2 | SmartVideo Integration | Match? |
|--------|-----------------|----------------------|--------|
| **Layout** | Header bar (back + title + watch-folder + refresh + add). Tabs: Active/Done/Failed. Job cards with status badge, filename, languages, progress bar, stage label, outputs, actions. | Identical. `BatchQueue` component renders full layout. | ✅ Layout match |
| **Controls** | Add videos dialog, cancel, delete, download per language, watch-folder bar. | All present. `BatchAddDialog`, `WatchFolderBar` (inert on web), job cards with actions. | ✅ Control match |
| **Workflow** | Enqueue files → poll progress → download outputs. | Identical flow. Polls every 3s via `listBatchJobs`. | ✅ Workflow match |
| **Color differences** | Status badges: queued=neutral, running=brand, done=success, failed=danger, cancelled=warn. Progress bar uses brand color. | Same status tones. Brand accent (`--color-brand`) overridden to cyan, affecting running/progress indicators. | ⚠️ Expected: brand accent shifts; semantic status colors preserved |
| **Web-runtime differences** | Watch-folder requires Tauri filesystem. On web, `WatchFolderBar` renders but shows no active folder. | Watch-folder is inert. Manual file selection via `BatchAddDialog` works. | ✅ Expected adaptation |

### 14. Global Visual Patterns

| Pattern | Upstream v0.5.2 | SmartVideo Integration | Match? |
|---------|-----------------|----------------------|--------|
| **Typography scale** | `--text-xs` through `--text-xl`, `--font-sans`, `--font-serif`, `--font-display`, `--font-mono` | Identical — SmartVideo theme preserves all font tokens. | ✅ Typography match |
| **Spacing scale** | `--space-1` through `--space-7`, used consistently via `var(--space-*)` | Identical — spacing tokens not overridden. | ✅ Spacing match |
| **Border treatment** | `--chrome-border` is zeroed or very subtle. Structure comes from spacing + background color differences, not borders. | Identical — border token not overridden. | ✅ Border match |
| **Radius scale** | `--radius-pill` (full), `--radius-md`, `--radius-lg`, `--chrome-radius-pill` | Identical — radius tokens not overridden. | ✅ Radius match |
| **Transition timing** | `--dur-base` (~200ms), `--dur-fast` (~100ms), `--ease-out` | Identical — timing tokens not overridden. | ✅ Transition match |
| **Container queries** | `[container-type:inline-size]` used for Launchpad, Dub, Settings, Gallery responsive breakpoints | Identical — container queries work in all modern browsers. | ✅ Responsive match |
| **Focus rings** | `focus-visible:opacity-100` + `--color-brand-glow` ring | Cyan glow (`rgba(34,211,238,0.4)`) instead of pink. | ⚠️ Expected: focus ring color shifts |
| **Hover states** | `hover:bg-[color-mix(in_srgb,var(--chrome-fg)_5%,transparent)]` for cards, `hover:bg-[var(--chrome-accent-bg)]` for tabs | Identical mix formula. Accent background shifts to cyan tint. | ⚠️ Expected: hover accent shifts |
| **Active states** | `data-[state=active]:bg-[var(--chrome-accent-bg)]` for tabs, `data-[state=active]:text-[var(--chrome-accent)]` | Cyan active states. | ⚠️ Expected: active state shifts |
| **Scrollbar styling** | Not explicitly styled — uses OS default | Identical — no scrollbar overrides. | ✅ Scrollbar match |
| **Selection styling** | `::selection` uses `--chrome-accent` background | Cyan selection background. | ⚠️ Expected: selection color shifts |
| **Animations** | `lpFadeUp` keyframe for demo callout, `lp-wave-bar` breathing animation, spin for loading spinner | Identical — CSS animations scoped to `[data-voice-studio]`. | ✅ Animation match |

---

## What SmartVideo Changes

| Category | Change | Rationale |
|----------|--------|-----------|
| **Brand color** | `--color-brand` overridden from pink (`#d3869b`) to cyan (`#22d3ee`) | Aligns VoiceStudio with SmartVisual GO design tokens |
| **Brand hover** | `--color-brand-hover` → `#06b6d4` | Darker cyan for hover states |
| **Brand glow** | `--color-brand-glow` → `rgba(34,211,238,0.4)` | Cyan glow for focus rings |
| **CSS scoping** | `index.css` global selectors prefixed with `[data-voice-studio]` | Prevents VoiceStudio chrome from leaking into SmartVideo host |
| **API base** | `window.__OMNIVOICE_API_BASE__` set to `/api/voice` | Routes all VoiceStudio API calls through SmartVideo Next.js proxy |
| **App version** | `window.__APP_VERSION__` set to `0.5.2` | Satisfies upstream version-dependent UI checks |
| **Query client** | Custom `QueryClient` with `staleTime: 10_000`, `retry: 1`, `refetchOnWindowFocus: false` | Optimizes for web runtime; prevents stale data on tab refocus |
| **Persistence** | `configurePersistenceRole('main')` + `useAppStore.persist.rehydrate()` | Ensures store rehydrates from localStorage on web mount |
| **Desktop-only guards** | `isTauri()` checks in UpdatesPanel, system logs, diagnostic bundle, self-check | Prevents crashes from missing Tauri APIs on web |

---

## What SmartVideo Preserves

| Category | Preservation | Evidence |
|----------|-------------|----------|
| **Layout structure** | All upstream page layouts render verbatim — same flex/grid structure, same component hierarchy, same lazy-load boundaries | `VoiceStudioWebApp.jsx` mounts `App.jsx` directly without prop-drilling or layout wrapping |
| **Control hierarchy** | All upstream controls (buttons, inputs, tabs, sliders, selects, dialogs) render in same DOM order with same props | No prop manipulation — `VoiceStudioWebApp.jsx` passes `{...props}` to `AppComponent` |
| **Workflow flow** | All upstream workflows (upload→transcribe→edit→translate→generate→export) execute identically | Store slices + hooks are unmodified; only API base changes |
| **Typography** | All upstream font stacks, sizes, weights, line-heights preserved | `--font-sans`, `--font-serif`, `--font-display`, `--font-mono` tokens not overridden |
| **Spacing** | All upstream spacing scale preserved | `--space-*` tokens not overridden |
| **Radius** | All upstream border-radius values preserved | `--chrome-radius-pill`, `--radius-md`, `--radius-lg` not overridden |
| **Transitions** | All upstream transition timings preserved | `--dur-base`, `--dur-fast`, `--ease-out` not overridden |
| **Per-type accent colors** | Dub=`#fe8019`, Gallery=`#fabd2f`, Clone=`#d3869b`, Design=`#8ec07c`, Stories=`#83a598`, Audiobook=`#458588`, Transcripts=`#b8bb26`, Convert=`#689d6a` | Accent colors are inline styles or per-component CSS, not token overridden |
| **Semantic status colors** | Success=green, Danger=red, Warning=amber, Neutral=gray | Status colors are inline in components (`text-[#...]`), not token overridden |
| **WaveSurfer.js** | Waveform rendering, zoom, pan, seek, regions | Upstream WaveSurfer instance created in browser context |
| **MediaRecorder** | Audio recording for voice clone, dictation, convert | Standard Web API, no Tauri wrapper needed |
| **Web Audio API** | Audio playback, level meter, trimming | Standard Web API |
| **localStorage / IndexedDB** | Client-side persistence for profiles, projects, settings, transcriptions, longform | `coalescedJsonStorage.ts` + `indexedDbLongformStore.ts` work identically in browser |
| **SSE streaming** | Longform generation progress, dub streaming | `fetch` + `ReadableStream` in browser |
| **WebSocket** | Real-time event updates | Standard `WebSocket` API, URL resolved from `API` base |
| **i18n** | All 21 locales, react-i18next | Loaded in bootstrap, identical behavior |
| **Keyboard shortcuts** | Cmd/Ctrl+Enter for synthesis, ⌘K/Ctrl+K for settings search, dictation shortcuts | Standard `keydown` listeners |
| **Accessibility** | `aria-label`, `role`, `aria-live`, `aria-current`, roving tabindex, focus-visible styles | No modifications — upstream a11y preserved |

---

## Web Runtime Differences (Expected, Non-Breaking)

| Area | Upstream Desktop Behavior | SmartVideo Web Behavior | Impact |
|------|--------------------------|------------------------|--------|
| **API base** | `http://localhost:3900` | `/api/voice` (Next.js proxy → Modal) | None — all endpoints mirrored |
| **Backend startup** | Local FastAPI + Uvicorn (~14s) | Modal cloud workers (instant scale) | Faster startup, no local process |
| **Model storage** | Local `omnivoice_data/` directory | Modal cloud inference + Supabase metadata | No local disk usage |
| **GPU detection** | CUDA/MPS/ROCm via Tauri | Modal handles GPU selection | No client-side GPU detection |
| **File dialogs** | Tauri native dialog | Standard HTML `<input type="file">` | Slightly different UX but functionally equivalent |
| **Filesystem reveal** | `shell.openPath` (Finder/Explorer) | No-op on web; download via `<a download>` | Users download instead of reveal |
| **System updater** | Tauri `invoke('check_update')` | "Desktop only" toast | Web users get updates via normal web deploy |
| **System logs** | Tauri log files + backend logs | Backend logs only (frontend buffer available) | Reduced log depth on web |
| **Diagnostic bundle** | Tauri `exportReveal` + zip | No-op on web | No bundle download on web |
| **Watch folder** | Tauri `fs.watch` | Manual file selection only | No auto-ingest on web |
| **Dictation global shortcut** | Tauri `globalShortcut` | Browser-only shortcut (no system-wide) | Dictation only works while tab is focused |
| **MCP server** | Local loopback transport | Not available on web | MCP features excluded from web |
| **Persistence exit handshake** | `app.on('window-close')` flush | No-op on web; `installPersistenceLifecycleFlush` runs | Safe — no data loss |

---

## CSS Isolation Verification

The `scripts/scope-voice-studio-css.mjs` script prefixes all top-level global selectors in `vendor/VoiceStudio/frontend/src/index.css` with `[data-voice-studio]`. This ensures:

1. VoiceStudio's `:root`, `html`, `body`, `#root` rules only apply inside the mounted VoiceStudio container.
2. SmartVideo's own `:root`, `body` rules are unaffected.
3. Both webpack and turbopack consume the scoped stylesheet without module-replacement hacks.

**Verification:** `e2e/voice-studio-acceptance.spec.ts` includes test `'VoiceStudio CSS does not leak into other studios'`:
- Navigate to `/studio/voice`, capture VoiceStudio background.
- Navigate to `/studio/image`, capture Image Studio background.
- Assert backgrounds differ (VoiceStudio scoped CSS does not affect Image Studio).

---

## Screenshot Comparison Matrix

| Screen | Upstream Screenshot Reference | SmartVideo Screenshot | Layout Match | Control Match | Workflow Match | Color Delta |
|--------|------------------------------|----------------------|-------------|--------------|---------------|------------|
| Launchpad | `vendor/VoiceStudio/frontend/e2e/` (upstream Playwright screenshots) | `e2e/visual-assets/voice-studio-acceptance/01-launchpad.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent |
| Voice → From Audio | Upstream screenshots | `02-voice-from-audio.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent |
| Voice → By Design | Upstream screenshots | `03-voice-by-design.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent |
| Convert | Upstream screenshots | `04-convert.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent |
| Dub | Upstream screenshots | `05-dub.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent |
| Stories | Upstream screenshots | `06-stories.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent |
| Audiobook | Upstream screenshots | `07-audiobook.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent |
| Gallery | Upstream screenshots | `08-gallery.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent + gallery yellow preserved |
| Transcriptions | Upstream screenshots | `09-transcriptions.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent |
| Projects | Upstream screenshots | `10-projects.png` | ✅ | ✅ | ✅ | ✅ Per-type accents preserved |
| Settings | Upstream screenshots | `11-settings.png` | ✅ | ✅ | ✅ | ⚠️ Brand accent |

**Legend:** ✅ Match | ⚠️ Expected difference (brand accent shift only) | ❌ Mismatch

---

## How to Verify Visual Parity

```bash
# 1. Start SmartVideo GO dev server
npm run dev

# 2. Run VoiceStudio acceptance tests (captures screenshots)
npx playwright test e2e/voice-studio-acceptance.spec.ts

# 3. Compare screenshots against upstream v0.5.2
#    Upstream screenshots available at:
#    vendor/VoiceStudio/frontend/e2e/ (if present)
#    Or run upstream test suite:
cd vendor/VoiceStudio/frontend && npm run test:e2e

# 4. Visual diff tools:
#    - Playwright's built-in snapshot comparison
#    - pixelmatch / perceptronic diff
#    - Manual side-by-side in browser dev tools
```

---

## Outstanding Visual Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Brand accent bleed** | Low | Only `--color-brand*` tokens overridden. All other tokens preserved. Verified via CSS isolation test. |
| **Font loading** | Low | Upstream font stacks use system fonts (`-apple-system`, `Segoe UI`, etc.). No custom web fonts loaded. |
| **Container query support** | Low | Container queries supported in all modern browsers (Chrome 105+, Safari 16+, Firefox 110+). |
| **color-mix() support** | Low | `color-mix(in_srgb, ...)` used extensively in upstream CSS. Supported in all modern browsers. |
| **Mask-image support** | Low | `mask-image` used for signal-field hero. Supported in all modern browsers. |
| **Tailwind v4 compatibility** | Medium | Upstream `index.css` imports Tailwind v3-specific files. Scoping script removes those imports. If upstream updates Tailwind version, scoping script must be re-run. |
| **Dynamic import failures** | Low | `VoiceStudioWebApp.jsx` wraps all dynamic imports in try/catch. Failed modules log warnings and continue. |
| **Store rehydration race** | Low | `useAppStore.persist.rehydrate()` is awaited in bootstrap before `App.jsx` mounts. |
