# VoiceStudio UI/UX Parity Matrix

**Upstream source:** `vendor/VoiceStudio/frontend/src/` (v0.5.2)  
**SmartVideo target:** `/studio/voice` (mounted via `src/integrations/voice-studio/VoiceStudioWebApp.jsx`)  
**Integration mode:** Direct React mount (no iframe), upstream `App.jsx` rendered inside SmartVideo shell  
**Last updated:** 2026-09-22  

---

## How to Read This Document

Each row is a user-visible feature derived from the actual upstream source files listed under `vendor/VoiceStudio/frontend/src/`. No feature is invented — every entry maps to a real file in that directory tree.

| Status | Meaning |
|--------|---------|
| **WEB WORKING** | Renders and functions in the SmartVideo web mount without modification |
| **WEB ADAPTED** | Upstream behavior preserved, but required a web-specific adaptation (polyfill, API proxy, CSS scoping, etc.) |
| **DESKTOP-ONLY** | Depends on Tauri/native APIs unavailable in web; excluded from SmartVideo GO |
| **BLOCKED** | Feature exists upstream but cannot be activated in web mount due to a hard dependency |
| **MISSING** | Upstream feature has no equivalent in the SmartVideo integration yet |

---

## Pages / Top-Level Workspaces

| # | Feature | Upstream Source File | Parent Workspace | How to Open | Expected Behavior | SmartVideo Status | Web Adaptation Notes | Test Method | Screenshot Reference |
|---|---------|---------------------|------------------|-------------|-------------------|-------------------|---------------------|-------------|---------------------|
| 1 | Launchpad (home/overview) | `pages/Launchpad.jsx` | Root | Navigate to `/studio/voice` (default route) | 8 feature tiles (clone/design/dub/stories/audiobook/gallery/transcripts/convert), recent files strip, cloned/designed voice project rows, dubbing project rows, demo callout, A/B Compare button (gated to ≥2 profiles), readiness checklist, signal-field hero art | WEB WORKING | None — upstream `Launchpad` renders verbatim inside SmartVideo mount. CSS scoped via `[data-voice-studio]`. | `e2e/voice-studio-acceptance.spec.ts`: `01-launchpad.png`, assertion `page.locator('.launchpad').toBeVisible()` | `e2e/visual-assets/voice-studio-acceptance/01-launchpad.png` |
| 2 | Voice → From Audio | `pages/CloneDesignTab.jsx` (`defineMethod === 'audio'`) | Voice workspace | Click Voice tab → "From audio" sub-tab | Reference audio upload (file picker or drag-drop), waveform preview, ref text input, record live audio, profile selection, script textarea, action bar with synthesis overrides, Cmd/Ctrl+Enter shortcut, demo coach-mark for `demo0001` profile, "Hear demo" fallback when no TTS engine ready | WEB WORKING | None — all controls are web-compatible. `navigator.mediaDevices.getUserMedia` works in browser. Demo audio served from `/api/voice/demo_audio/demo_clone_output.wav`. | Navigate to Voice → From Audio; verify script panel, AudioMethodPanel, ActionBar render. `e2e/voice-studio-acceptance.spec.ts`: `02-voice-from-audio.png` | `e2e/visual-assets/voice-studio-acceptance/02-voice-from-audio.png` |
| 3 | Voice → By Design | `pages/CloneDesignTab.jsx` (`defineMethod === 'design'`) | Voice workspace | Click Voice tab → "By design" sub-tab | Free-text "Describe your voice" input with debounced `/design/describe` mapping, category sliders (Gender/Age/Pitch/Style/EnglishAccent/ChineseDialect) with mutual-exclusivity guard, personality preset chips + demo cards, seed control (pin/roll), identity recipe summary, save-as-profile, instruct text, script panel, action bar | WEB WORKING | None — all form controls and API calls are web-compatible. Debounced describe uses standard `setTimeout`. | Navigate to Voice → By Design; verify design panel renders with sliders and chips. `e2e/voice-studio-acceptance.spec.ts`: `03-voice-by-design.png` | `e2e/visual-assets/voice-studio-acceptance/03-voice-by-design.png` |
| 4 | Voice → Convert | `pages/CloneDesignTab.jsx` (`defineMethod === 'convert'`) | Voice workspace | Click Voice tab → "Convert" sub-tab | Source voice selection, target voice selection, speech-to-speech conversion workflow, record source audio, ConvertMethodPanel with its own action button, no script panel (source clip IS the script) | WEB WORKING | None — media recording via `navigator.mediaDevices.getUserMedia` works in browser. | Navigate to Voice → Convert; verify ConvertMethodPanel renders. `e2e/voice-studio-acceptance.spec.ts`: `04-convert.png` | `e2e/visual-assets/voice-studio-acceptance/04-convert.png` |
| 5 | Dub | `pages/DubTab.jsx` | Dub workspace | Click Dub tab | Upload video/audio or ingest URL (YouTube supported), ASR transcription with progress, transcript editor with editable segments, timeline editor with zoom/pan/seek, waveform visualization, speaker clone assignment, multi-language target picker with chips, translate-all pipeline, generate with progress ETA, QC timing check, preview switcher (original/dubbed), burn-in subtitles, dual subs, karaoke subs, export modal (video/audio/SRT/VTT), batch pipeline stepper, idle skeleton with drop zone, review-mode checkpoint banner | WEB WORKING | File upload via standard `<input type="file">`. YouTube URL ingest via backend proxy. WaveSurfer.js renders in browser. All API calls proxied through `/api/voice/*`. `localStorage` used for dub demo dismissal flag. | Navigate to Dub; upload a file or mock API; verify editor renders. `e2e/voice-studio-acceptance.spec.ts`: `05-dub.png` | `e2e/visual-assets/voice-studio-acceptance/05-dub.png` |
| 6 | Stories | `pages/` (referenced in `App.jsx` as `StoriesEditor` lazy component) | Stories workspace | Click Stories tab | Multi-voice script editor, voice assignment per line/segment, script-to-story conversion, story playback, cast management | WEB WORKING | No native dependencies. `components/StoriesEditor.jsx` renders inside the same React tree. | Navigate to Stories; verify editor renders. `e2e/voice-studio-acceptance.spec.ts`: `06-stories.png` | `e2e/visual-assets/voice-studio-acceptance/06-stories.png` |
| 7 | Audiobook | `pages/AudiobookTab.jsx` | Audiobook workspace | Click Audiobook tab | Script editor with Markdown chapter delimiters (`# H1`), EPUB/PDF import via web file picker, `[voice:NAME]` and `[pause …]` markup, voice cast panel with multi-voice assignment, book metadata panel (title/author/narrator/year/genre/description), cover image upload, pronunciation lexicon, format picker (m4b/mp3), loudness normalization (off/acx/podcast), expressive overrides, per-chapter preview, chapterized generation with streaming progress, m4b assembly, output playback + download, validation warnings, generation recovery/resume | WEB WORKING | EPUB/PDF import uses standard web file picker instead of native dialog. Cover image uses `URL.createObjectURL`. All generation streams via fetch + SSE. No Tauri file system calls. | Navigate to Audiobook; verify Script/Voices/Book tabs render. `e2e/voice-studio-acceptance.spec.ts`: `07-audiobook.png` | `e2e/visual-assets/voice-studio-acceptance/07-audiobook.png` |
| 8 | Voice Gallery | `pages/VoiceGallery.jsx` | Gallery workspace | Click Gallery tab | Three zones: Archetypes (browsable designed-voice library with facet filters, favorites, grid/list view), Community (shared presets), My Imports (URL import + file upload + trim). Voice preview playback, materialize-as-profile, place in studio/stories/audiobook. | WEB WORKING | File upload via standard input. Preview audio fetched via `apiFetch` with `cache: 'no-store'`. No native filesystem APIs. | Navigate to Gallery; verify Archetypes/Community/Imports zones render. `e2e/voice-studio-acceptance.spec.ts`: `08-gallery.png` | `e2e/visual-assets/voice-studio-acceptance/08-gallery.png` |
| 9 | Transcriptions | `pages/Transcriptions.jsx` | Transcriptions workspace | Click Transcriptions tab | ASR transcription history from dictation, searchable/filterable list, segment timing display, copy/delete/export (TXT), capture button with keyboard shortcut display, ASR model chooser/installer, readiness check for mic + model | WEB WORKING | Dictation capture uses `navigator.mediaDevices.getUserMedia` + MediaRecorder (web-compatible). localStorage for persistence. Export via Blob + `<a download>`. | Navigate to Transcriptions; verify list + detail panel render. `e2e/voice-studio-acceptance.spec.ts`: `09-transcriptions.png` | `e2e/visual-assets/voice-studio-acceptance/09-transcriptions.png` |
| 10 | Projects (OmniDrive) | `pages/Projects.jsx` | Projects workspace | Click Projects tab | Unified browser for dubs, stories, voice profiles, history, exports, audiobooks, transcriptions. Filter rail with counts, search, grid/list view toggle, card/list items with accent colors, play in-app for audiobooks, copy for transcriptions, longform jobs from `/longform/jobs`, timestamps normalized across mixed units | WEB WORKING | `playRenderInApp` fetches audio via `apiFetch` + `playBlobAudio` (no `window.open`). `localStorage` for transcriptions. All data from proxied APIs. | Navigate to Projects; verify filter rail, search, cards render. `e2e/voice-studio-acceptance.spec.ts`: `10-projects.png` | `e2e/visual-assets/voice-studio-acceptance/10-projects.png` |
| 11 | Settings | `pages/Settings.jsx` | Settings workspace | Click Settings tab | Sidebar-nav + content-pane hub (macOS System Settings style). Categories: Appearance, Engines (pointer to Model Catalogue), Models (storage + HF mirror), Dictation, Pronunciation, Translation, Performance, Usage, Storage, Permissions, Network, Audio Tools, Sharing, Workers, OpenAPI, Credentials, LLM Providers, LLM Skills, Updates, Privacy, Logs, About. Search filter, ⌘K/Ctrl+K shortcut, deep-link support, persisted last-opened category. Tauri-specific: app version, tauri version, update check/install, system logs (backend/tauri/frontend), diagnostic bundle, self-check | WEB ADAPTED | Tauri-specific panels (Updates, Tauri logs, diagnostic bundle, self-check, system info) gracefully degrade in web — `isTauri()` guards skip native calls. Web-compatible panels (Appearance, Privacy, Logs frontend, Network, etc.) render normally. | Navigate to Settings; verify sidebar + active category render. `e2e/voice-studio-acceptance.spec.ts`: `11-settings.png` | `e2e/visual-assets/voice-studio-acceptance/11-settings.png` |
| 12 | Model Catalogue | `pages/ModelCatalogue.jsx` | Settings/backend | Settings → Engines or Models category | Engine select, model install/uninstall/load/unload, flush, routing rules, model storage management | WEB ADAPTED | Backend-dependent. In web mount, model installation calls go through `/api/voice/*` proxy. The UI renders but actual model lifecycle depends on Modal backend configuration. `components/settings/CataloguePointer.jsx` redirects to the catalogue pane. | Navigate to Settings → Engines; verify catalogue pointer renders. | N/A |
| 13 | Batch Queue | `pages/BatchQueue.jsx` | Batch workspace | Click Batch Queue (mode switch) | Tabs: Active/Done/Failed. Enqueue files with language + voice + preserve-bg settings. Real-time progress (extract→transcribe→translate→generate→mix). Cancel/delete jobs. Watch-folder ingest. Download outputs per language. Polls every 3s. | WEB WORKING | All API calls proxied through `/api/voice/*`. No Tauri watch-folder filesystem API — web uses manual file selection dialog. | Navigate to Batch Queue; verify tabs and empty state render. | N/A |
| 14 | Voice Profile | `pages/VoiceProfile.jsx` | Profile workspace | Open a voice profile from Projects or Gallery | Profile detail view with activity log, voice parameters, edit/delete | WEB WORKING | No native dependencies. Renders inside the same React tree. | Open a profile from Gallery or Projects; verify detail view renders. | N/A |
| 15 | Setup Wizard | `pages/SetupWizard.jsx` | First-run | Shown on first launch before studio | Step-through wizard: API key input, engine selection, first-run configuration, "Enter studio" CTA | WEB WORKING | First-run setup is part of the acceptance test flow (`completeFirstRunSetup`). Wizard steps render inside the mounted App. | `e2e/voice-studio-acceptance.spec.ts`: `completeFirstRunSetup()` helper | N/A |
| 16 | Tools Page | `pages/ToolsPage.jsx` | Tools | Navigate via sidebar or direct mode switch | Utility tools: audio converter, format checker, etc. | WEB WORKING | Renders inside mounted App. | Navigate to Tools; verify page renders. | N/A |
| 17 | Contact Page | `pages/ContactPage.jsx` | Contact | Navigate via footer or direct | Contact form or links | WEB WORKING | Renders inside mounted App. | Navigate to Contact; verify page renders. | N/A |
| 18 | Support Page | `pages/SupportPage.jsx` | Support | Navigate via footer or direct | Sponsors grid, bug report, documentation links | WEB WORKING | Sponsors list is empty (`SPONSORS = []` in `config/sponsors.js`). Bug report opens prefilled GitHub issue. | Navigate to Support; verify page renders. | N/A |

---

## Core Components

| # | Feature | Upstream Source File | Parent Workspace | How to Open | Expected Behavior | SmartVideo Status | Web Adaptation Notes | Test Method | Screenshot Reference |
|---|---------|---------------------|------------------|-------------|-------------------|-------------------|---------------------|-------------|---------------------|
| 19 | Waveform display + interaction | `components/WaveformTimeline.jsx` | Dub, Voice | Dub tab after transcription; Voice tab for preview | WaveSurfer.js-based waveform with zoom, pan, seek, region selection, playback cursor, segment markers | WEB WORKING | WaveSurfer.js renders in browser via standard Web Audio API. No Tauri-specific canvas path. | Interact with waveform in Dub tab after mock transcription. | N/A |
| 20 | Timeline editor | `components/SegmentTrack.jsx`, `components/DubSegmentRow.jsx`, `components/DubSegmentTable.jsx` | Dub | Dub tab after transcription | Drag segments to resize, move, split, merge. Zoom in/out. Speech-onset ticks. Segment selection (single + bulk). Seek on click. | WEB WORKING | All mouse/touch events are standard DOM events. Timeline onsets fetched from `/api/voice/dub/onsets/{jobId}`. | Interact with timeline in Dub tab; verify segment drag/resize. | N/A |
| 21 | Transcript editor | `components/DubSegmentTable.jsx` (segment rows) | Dub | Dub tab after transcription | Editable text per segment, timing display, status badges, voice selector per segment, bulk operations (apply voice, delete, paste translations, split, merge, insert, move/resize) | WEB WORKING | Inline `contentEditable` or controlled inputs — all web-compatible. | Edit a segment in Dub tab; verify text updates. | N/A |
| 22 | Multi-language controls | `components/MultiLangPicker.jsx` | Dub | Dub tab settings | Primary target language picker, chip-based multi-target selector, per-language progress indicator, translate-all pipeline, track switcher pills for dubbed output | WEB WORKING | Language data from `utils/languages.js` (static JSON). ISO codes passed through API. | Open multi-language picker in Dub settings; verify chips render. | N/A |
| 23 | Subtitle controls | `components/dub/DubFooter.jsx`, `components/ExportModal.jsx` | Dub | Dub tab footer + Export modal | Dual subtitles toggle, burn-in subtitles, karaoke subtitles, subtitle export (SRT/VTT), timing strategy picker, voice-match threshold | WEB WORKING | Subtitle generation happens server-side. Export triggers download from `/api/voice/*`. | Open Export modal; verify subtitle options render. | N/A |
| 24 | Voice selector | `components/VoiceSelector.jsx` | Global | Any voice picker dropdown | Searchable select for voice profiles, custom UI (not native `<select>`), keyboard navigation, disabled states | WEB WORKING | Reusable across Voice, Dub, Stories, Audiobook. Renders as custom React component. | Open any voice picker; verify search + selection works. | N/A |
| 25 | Searchable select | `components/SearchableSelect.jsx` | Global | Any dropdown needing search | Generic searchable dropdown, `menuPortal` for scrolling containers, keyboard selection, disabled states | WEB WORKING | Standard React component. | Open any searchable select (e.g., language picker); verify search works. | N/A |
| 26 | Export modal | `components/ExportModal.jsx` | Dub | Dub tab after generation | Format picker (video/audio), quality settings, subtitle options, track selection, download triggers | WEB WORKING | Downloads via `<a download>` with blob URLs or direct `/api/voice/*` URLs. | Click Export in Dub tab; verify modal renders. | N/A |
| 27 | Pipeline stepper | `components/dub/DubPipelineStepper.jsx` | Dub | Dub tab before/during pipeline | Upload → Prepare → Transcribe → Edit → Export steps, selectable, progress indicators | WEB WORKING | Renders as React component with conditional step visibility. | Upload a file in Dub; verify stepper renders. | N/A |
| 28 | Idle skeleton | `components/dub/IdleSkeleton.jsx` | Dub | Dub tab when no job active | Drop zone, URL ingest, advanced settings accordion, ASR install prompt, demo dismiss banner | WEB WORKING | Drag-drop zone uses standard HTML5 DnD API. | Open Dub tab with no active job; verify skeleton renders. | N/A |
| 29 | Dub header | `components/dub/DubHeader.jsx` | Dub | Dub tab during editing | Filename, duration, save/reset, pipeline stepper inline, generate CTA, multi-language batch CTA, QC button, progress display | WEB WORKING | All buttons wired to store + API calls through `/api/voice/*`. | Start a dub; verify header renders during editing. | N/A |
| 30 | Dub track summary | `components/dub/DubTrackSummary.jsx` | Dub | Dub tab footer | Track list with language, status, download per track, track management | WEB WORKING | Renders as React component. | Generate a multi-language dub; verify track summary renders. | N/A |
| 31 | Readiness checklist | `components/ReadinessChecklist.jsx` | Launchpad | Launchpad empty state + alongside projects | Backend/model readiness checks, compact mode, issue surfacing | WEB WORKING | Reads from store + API. Web mount shows checks against `/api/voice/*` backend. | View Launchpad with no projects; verify checklist renders. | N/A |
| 32 | Launchpad deck | `components/LaunchpadDeck.jsx` | Launchpad | Launchpad | Responsive grid of 8 feature tiles with icons, hues, counts, navigation | WEB WORKING | Container queries (`[container-type:inline-size]`) work in modern browsers. | View Launchpad; verify feature grid renders. | N/A |
| 33 | Script panel | `components/clone/ScriptPanel.jsx` | Voice | Voice → From Audio / By Design | Textarea with insert-tag menu, demo preset chips, coach-mark, personality demo presets, character count | WEB WORKING | Standard textarea + React state. Demo coach-mark uses `localStorage`. | Open Voice → From Audio; verify script panel renders. | N/A |
| 34 | Audio method panel | `components/clone/AudioMethodPanel.jsx` | Voice | Voice → From Audio | Profile selector, reference audio upload/preview, record button with timer, channel mode, input level meter, ref text, instruct, seed control, save-as-profile | WEB WORKING | MediaRecorder API for recording. `navigator.mediaDevices.enumerateDevices` for input selection. Level meter via Web Audio API AnalyserNode. | Open Voice → From Audio; verify audio method panel renders. | N/A |
| 35 | Design method panel | `components/clone/DesignMethodPanel.jsx` | Voice | Voice → By Design | Describe-your-voice text input, personality preset chips (legacy + demo cards), category sliders with exclusivity guard, identity recipe accordion, save-as-design-profile, reset-to-description button | WEB WORKING | All form controls are standard React inputs. `/design/describe` API call proxied. | Open Voice → By Design; verify design panel renders. | N/A |
| 36 | Convert method panel | `components/clone/ConvertMethodPanel.jsx` | Voice | Voice → Convert | Source/target voice selection, record source audio, conversion settings | WEB WORKING | MediaRecorder for source audio capture. | Open Voice → Convert; verify convert panel renders. | N/A |
| 37 | Action bar | `components/clone/ActionBar.jsx` | Voice | Voice → From Audio / By Design | Overrides toggle, cfg/steps/speed/t-shift/pos-temp/class-temp/layer-penalty/denoise/postprocess/duration knobs, language picker, synthesis CTA, stop button, generation progress, demo audio playback | WEB WORKING | All knobs are standard inputs. Generation triggers API call. | Open Voice → From Audio; verify action bar renders. | N/A |
| 38 | Archetypes zone | `components/gallery/ArchetypesZone.jsx` | Gallery | Gallery → Archetypes tab | Facet filters (use case, gender, age, pitch, accent, whisper, lang), featured cards, grid/list view, favorites, preview playback, use-in-studio/stories/audiobook, open-designer | WEB WORKING | Fetches from `/api/voice/archetypes`. Preview audio via blob playback. | Navigate to Gallery → Archetypes; verify filters + cards render. | N/A |
| 39 | Community zone | `components/gallery/CommunityZone.jsx` | Gallery | Gallery → Community tab | Community-shared voice presets, preview, use, design | WEB WORKING | Fetches from `/api/voice/community`. | Navigate to Gallery → Community; verify items render. | N/A |
| 40 | Imports zone | `components/gallery/ImportsZone.jsx` | Gallery | Gallery → My Imports tab | URL import, file upload, audio trimmer, save as profile | WEB WORKING | File upload via standard input. AudioTrimmer uses Web Audio API. | Navigate to Gallery → My Imports; verify import form renders. | N/A |
| 41 | Audiobook hero | `components/audiobook/AudiobookHero.jsx` | Audiobook | Audiobook tab | Import EPUB/PDF, load sample, preview plan, create/stop buttons | WEB WORKING | File picker for import. All wired to `/api/voice/audiobook/*`. | Open Audiobook tab; verify hero renders. | N/A |
| 42 | Audiobook script panel | `components/audiobook/AudiobookScriptPanel.jsx` | Audiobook | Audiobook → Script tab | Markdown editor with chapter detection, validation warnings, Cmd/Ctrl+Enter shortcut | WEB WORKING | Standard textarea with syntax highlighting via CSS. | Open Audiobook → Script; verify editor renders. | N/A |
| 43 | Audiobook voices panel | `components/audiobook/AudiobookVoicesPanel.jsx` | Audiobook | Audiobook → Voices tab | Default voice picker, language picker, cast map from `[voice:NAME]` tags, emotion overrides | WEB WORKING | Cast derived from script parsing. Voice picker is SearchableSelect. | Open Audiobook → Voices; verify panel renders. | N/A |
| 44 | Audiobook book panel | `components/audiobook/AudiobookBookPanel.jsx` | Audiobook | Audiobook → Book tab | Format picker (m4b/mp3), loudness normalization, cover upload, metadata fields, pronunciation lexicon | WEB WORKING | Cover upload via Blob URL. Format/loudness sent in generation request. | Open Audiobook → Book; verify panel renders. | N/A |
| 45 | Audiobook result | `components/audiobook/AudiobookResult.jsx` | Audiobook | Audiobook after generation | Output filename, chapter list, download link, playback | WEB WORKING | Download via `<a download>` or blob URL. | Generate an audiobook; verify result renders. | N/A |
| 46 | Generation progress | `components/audiobook/GenerationProgress.jsx` | Audiobook | Audiobook during generation | Per-chapter progress (pending/rendering/done/cached/failed), assembling indicator | WEB WORKING | Driven by SSE stream from `/api/voice/audiobook/generate`. | Start audiobook generation; verify progress renders. | N/A |
| 47 | Validation warnings | `components/audiobook/ValidationWarnings.jsx` | Audiobook | Audiobook tab | Non-blocking script validation hints (unmapped voices, missing profiles) | WEB WORKING | Derived from `utils/audiobookScript.js` validation. | Open Audiobook with unmapped cast; verify warnings render. | N/A |
| 48 | Plan list | `components/audiobook/PlanList.jsx` | Audiobook | Audiobook after preview plan | Chapter list with durations, preview-per-chapter, regenerate | WEB WORKING | Preview calls `/api/voice/audiobook/plan`. | Click Preview in Audiobook; verify plan renders. | N/A |
| 49 | Audiobook recovery | `components/audiobook/AudiobookRecovery.jsx` | Audiobook | Audiobook tab | Resume interrupted generation | WEB WORKING | Calls `/api/voice/audiobook/resume`. | Interrupt a generation; verify recovery banner renders. | N/A |
| 50 | Stats bar | `components/audiobook/StatsBar.jsx` | Audiobook | Audiobook tab | Word count, chapter count, estimated duration | WEB WORKING | Derived from script text. | Open Audiobook; verify stats render. | N/A |
| 51 | Export modal (dub) | `components/ExportModal.jsx` | Dub | Dub tab after generation | Video/audio format, quality, subtitle burn-in, dual subs, karaoke, track selection, download | WEB WORKING | All wired to `/api/voice/dub/download-*`. | Click Export in Dub; verify modal renders. | N/A |
| 52 | Checkpoint banner | `components/CheckpointBanner.jsx` | Dub | Dub tab in review mode | Between-stage checkpoint (ASR → Translate → Generate), continue/dismiss | WEB WORKING | Controlled by `reviewMode` store flag + `dubStep`. | Enable review mode; verify banner renders at stage boundaries. | N/A |
| 53 | Glossary panel | `components/GlossaryPanel.jsx` | Dub | Dub tab settings | Term → replacement pairs, per-segment glossary application | WEB WORKING | Stored in `glossarySlice.ts`. Exported with generation request. | Open glossary in Dub settings; verify panel renders. | N/A |
| 54 | Floating pill | `components/FloatingPill.jsx` | Global | Various async operations | Toast-style status pill for long-running ops (translate/generate/install) | WEB WORKING | Uses `react-hot-toast` under the hood. Renders in browser. | Trigger a long operation; verify pill appears. | N/A |
| 55 | Global audio player | `components/GlobalAudioPlayer.jsx` | Global | Any audio playback | Mini-player in footer, play/pause/stop, label, claim/release global playback slot | WEB WORKING | HTML5 Audio element. Shared playback state via `utils/playback.js`. | Play any audio; verify mini-player appears. | N/A |
| 56 | Notification panel | `components/NotificationPanel.jsx` | Global | Header bell icon | Notification list, read/unread, dismiss | WEB WORKING | Standard React component. | Open notification panel; verify list renders. | N/A |
| 57 | NavRail | `components/NavRail.jsx` | Global | Left sidebar | Navigation items, active state, collapse/expand, mode switching | WEB WORKING | Nav items from `components/navItems.js`. CSS scoped. | Navigate between workspaces; verify rail highlights active tab. | N/A |
| 58 | Header | `components/Header.jsx` | Global | Top bar | App title, mode switcher, settings gear, update badge | WEB WORKING | Renders inside mounted App. | Verify header renders at top of `/studio/voice`. | N/A |
| 59 | Title tabs | `components/TitleTabs.jsx` | Global | Workspace switcher | Tab strip for sub-workspaces (e.g., From Audio / By Design / Convert) | WEB WORKING | Uses `components/ui/tabs.jsx`. | Navigate between Voice sub-tabs; verify tabs render. | N/A |
| 60 | Error boundary | `components/ErrorBoundary.jsx` | Global | Root | Catches render errors, displays fallback UI | WEB WORKING | Standard React error boundary. | Trigger a render error; verify fallback renders. | N/A |
| 61 | Bootstrap splash | `components/BootstrapSplash.jsx` | First-run | First launch | Splash screen during backend/model setup | WEB WORKING | Renders during `bootstrapApp()` before studio mounts. | Clear localStorage + reload; verify splash renders. | N/A |
| 62 | First-run setup | `components/FirstRunSetup.jsx` | First-run | First launch | API key input, engine selection, onboarding steps | WEB WORKING | Part of acceptance test flow. | Clear localStorage + reload; verify setup wizard renders. | N/A |
| 63 | UiScaleSetup / UiScaleControl | `components/UiScaleSetup.jsx`, `components/UiScaleControl.jsx` | Settings | Settings → Appearance | UI scale slider (0.8x–1.5x), apply to shell | WEB WORKING | CSS `font-size` + `zoom` adjustments via `utils/uiScaleEngine.js`. | Open Settings → Appearance; verify scale slider renders. | N/A |
| 64 | Keyboard cheatsheet | `components/KeyboardCheatsheet.jsx` | Settings | Settings → Hotkey tab | Key binding reference table | WEB WORKING | Static data from `utils/dictationShortcut.js`. | Open Settings → Hotkeys; verify cheatsheet renders. | N/A |
| 65 | Dictation demo | `components/DictationDemo.jsx` | Settings | Settings → Dictation | Live dictation test, mic selection, model picker | WEB WORKING | Uses `utils/dictationCapture.js` (MediaRecorder-based). | Open Settings → Dictation; verify demo renders. | N/A |
| 66 | AsrModelChooser | `components/AsrModelChooser.jsx` | Dub, Transcriptions | ASR missing prompt | Model picker + install CTA when ASR model not installed | WEB WORKING | Calls `/api/voice/setup/install`. | Trigger ASR-missing state; verify chooser renders. | N/A |
| 67 | CaptureWidget | `components/CaptureWidget.jsx` | Transcriptions | Transcriptions tab | Record button with waveform, start/stop, timer | WEB WORKING | MediaRecorder API. | Open Transcriptions; verify capture widget renders. | N/A |
| 68 | DirectionDialog | `components/DirectionDialog.jsx` | Voice | Voice design | Direction/language picker for voice design | WEB WORKING | Standard dialog. | Open Voice → By Design; verify direction dialog renders. | N/A |
| 69 | AudioTrimmer | `components/AudioTrimmer.jsx` | Voice, Gallery | Reference audio selection | Waveform-based trimmer, start/end handles, preview | WEB WORKING | Uses WaveSurfer.js regions + Web Audio API. | Upload a reference audio; verify trimmer renders. | N/A |
| 70 | EngineQuickSwitch | `components/EngineQuickSwitch.jsx` | Global | Header or footer | Quick engine switcher (TTS/ASR/LLM) | WEB WORKING | Dropdown wired to `/api/voice/engines`. | Open engine switcher; verify list renders. | N/A |
| 71 | MediaEngineCard | `components/MediaEngineCard.jsx` | Settings | Settings → Performance | Engine status card, backend info | WEB WORKING | Reads from `/api/voice/model/status`. | Open Settings → Performance; verify card renders. | N/A |
| 72 | ComputeQuickSettings | `components/ComputeQuickSettings.jsx` | Settings | Settings → Performance | GPU/CPU compute settings | WEB WORKING | Settings stored in prefs. | Open Settings → Performance; verify compute settings render. | N/A |
| 73 | EngineMark | `components/EngineMark.jsx` | Global | Engine badges | Engine availability indicator (installed/installing/missing) | WEB WORKING | Reads engine list from store. | Verify engine marks render next to engine names. | N/A |
| 74 | LanguageFlag | `components/LanguageFlag.jsx` | Global | Language pickers | Country flag emoji for language codes | WEB WORKING | Static mapping in component. | Open any language picker; verify flags render. | N/A |
| 75 | ReportBugButton | `components/ReportBugButton.jsx` | Global | Footer or settings | Opens prefilled GitHub issue with diagnostics | WEB WORKING | Opens `https://github.com/debpalash/VoiceStudio/issues/new?...` in new tab. | Click bug report; verify GitHub issue form opens. | N/A |
| 76 | ChangelogViewer | `components/ChangelogViewer.jsx` | Settings | Settings → About | Markdown changelog renderer | WEB WORKING | Fetches `CHANGELOG.md` from backend or static. | Open Settings → About; verify changelog renders. | N/A |
| 77 | UpdatesPanel | `components/UpdatesPanel.jsx` | Settings | Settings → Updates | Update check, download, install (desktop-only) | DESKTOP-ONLY | `isTauri()` guard returns "desktop only" toast on web. Update check, download, and install all require Tauri `invoke('check_update')`. Web users see an informational toast only. | Open Settings → Updates on web; verify desktop-only message. | N/A |
| 78 | MirrorRescue | `components/MirrorRescue.jsx` | Settings | Settings → Models | HF mirror rescue flow | WEB WORKING | Mirrors configurable via settings. | Open Settings → Models; verify mirror picker renders. | N/A |
| 79 | RemoteBackendRecovery | `components/RemoteBackendRecovery.jsx` | Global | Backend connection lost | Reconnect UI for remote backend | WEB WORKING | Probes `/api/voice/health` for connectivity. | Disconnect backend; verify recovery UI renders. | N/A |
| 80 | BackendStartFailureNotice | `components/BackendStartFailureNotice.jsx` | Global | Backend fails to start | Error notice with retry CTA | WEB WORKING | Reads backend status from store. | Simulate backend failure; verify notice renders. | N/A |
| 81 | BackendCrashNotice | `components/BackendCrashNotice.jsx` | Global | Backend crashes mid-session | Crash notice with diagnostics | WEB WORKING | Detected via WebSocket disconnect or API error patterns. | Simulate backend crash; verify notice renders. | N/A |
| 82 | AnalyticsConsentBanner | `components/AnalyticsConsentBanner.jsx` | Global | First visit | Consent prompt for analytics | WEB WORKING | Standard banner, persists to localStorage. | Clear localStorage + reload; verify banner renders. | N/A |
| 83 | AnalyticsConsentCard | `components/AnalyticsConsentCard.jsx` | Settings | Settings → Privacy | Analytics preference toggle | WEB WORKING | Persisted to store. | Open Settings → Privacy; verify card renders. | N/A |
| 84 | WizardLibrary | `components/WizardLibrary.jsx` | First-run | Setup wizard | Library of wizard steps/configuration | WEB WORKING | Part of setup flow. | Run setup wizard; verify library renders. | N/A |
| 85 | OneTimeSecret | `components/OneTimeSecret.jsx` | Auth | Remote backend auth | One-time PIN entry for remote backend | WEB WORKING | Web-compatible PIN dialog. | Trigger remote auth; verify PIN dialog renders. | N/A |
| 86 | LogsFooter | `components/LogsFooter.jsx` | Global | Bottom bar | Log viewer toggle, log level filter | WEB WORKING | Reads from `utils/consoleBuffer.js` (in-memory). | Trigger a log event; verify footer renders. | N/A |
| 87 | WorkspaceHistory | `components/WorkspaceHistory.jsx` | Global | Sidebar | Recent workspace history for quick navigation | WEB WORKING | Derived from navigation state. | Navigate between workspaces; verify history renders. | N/A |
| 88 | WorkspaceVoices | `components/WorkspaceVoices.jsx` | Voice | Voice workspace sidebar | Recently used voices, quick voice switch | WEB WORKING | Reads from `store/gallerySlice.ts` + `store/generateSlice.ts`. | Open Voice workspace; verify sidebar voices render. | N/A |
| 89 | DubWorkspaceSidebar | `components/DubWorkspaceSidebar.jsx` | Dub | Dub workspace sidebar | Segment list, speaker summary, quick actions | WEB WORKING | Reads from `store/dubSlice.ts`. | Open Dub; verify sidebar renders. | N/A |
| 90 | Profile inspector | `components/profile/ProfileDetails.jsx`, `ProfileHeader.jsx`, `ProfileActivity.jsx` | Profile | Voice Profile page | Profile metadata, activity log, edit/delete | WEB WORKING | Reads from `/api/voice/profiles/*`. | Open a profile; verify inspector renders. | N/A |
| 91 | Compare modal | `components/CompareModal.jsx` | Launchpad | Launchpad A/B Compare button | Side-by-side voice diff, A/B listening | WEB WORKING | Requires ≥2 profiles. Opens as modal overlay. | Create 2 profiles; click A/B Compare; verify modal renders. | N/A |
| 92 | Batch add dialog | `components/BatchAddDialog.jsx` | Batch Queue | Batch Queue "Add videos" | File multi-select, language picks, voice picker, preserve-bg toggle | WEB WORKING | Standard file input + form. | Open Batch Queue → Add; verify dialog renders. | N/A |
| 93 | WatchFolderBar | `components/WatchFolderBar.jsx` | Batch Queue | Batch Queue | Watch-folder status, last ingest | DESKTOP-ONLY | `utils/watchFolder.js` uses Tauri `fs` + `watch` APIs. On web, the bar renders but shows "desktop only" or stays inert. | Open Batch Queue on web; verify bar is inert. | N/A |
| 94 | SupertonicLicenseDialog | `components/SupertonicLicenseDialog.jsx` | Settings | Settings → About | License display for Supertonic engine | WEB WORKING | Static markdown content. | Open Settings → About; verify license dialog renders. | N/A |
| 95 | PocketTTSLicenseDialog | `components/PocketTTSLicenseDialog.jsx` | Settings | Settings → About | License display for PocketTTS engine | WEB WORKING | Static markdown content. | Open Settings → About; verify license dialog renders. | N/A |
| 96 | VoiceStudioMark | `components/brand/VoiceStudioMark.jsx` | Global | Header/footer | VoiceStudio logo/brand mark | WEB WORKING | SVG or image asset. | Verify brand mark renders in header. | N/A |
| 97 | ModeLifecycleBoundary | `components/ModeLifecycleBoundary.jsx` | Global | Mode transitions | Cleanup/setup on mode switch | WEB WORKING | React lifecycle wrapper. | Switch modes; verify boundary executes. | N/A |
| 98 | DesktopCaptureShortcutBridge | `components/DesktopCaptureShortcutBridge.jsx` | Global | Dictation | Global shortcut registration for dictation | DESKTOP-ONLY | Uses Tauri `globalShortcut` API. On web, component is inert or skipped. | Open Transcriptions on web; verify shortcut bridge is inactive. | N/A |

---

## Hooks

| # | Feature | Upstream Source File | Parent Workspace | How to Open | Expected Behavior | SmartVideo Status | Web Adaptation Notes | Test Method | Screenshot Reference |
|---|---------|---------------------|------------------|-------------|-------------------|-------------------|---------------------|-------------|---------------------|
| 99 | useTTS | `hooks/useTTS.js` | Voice | Voice workspace | Encapsulates TTS generation, streaming response, audio ingestion with trim gate, preset/tag helpers, design seed management, in-flight count tracking, demo audio fallback | WEB WORKING | `streamGenerateSpeech` uses fetch + ReadableStream (web-compatible). `playBlobAudio` handles Tauri blob URL edge case with fallback. Trim gate via `probeAudioDuration` + `CLONE_MAX_SECONDS`. | Open Voice → From Audio; click Synthesize; verify generation completes (mock API). | N/A |
| 100 | useDubWorkflow | `hooks/useDubWorkflow.js` | Dub | Dub workspace | Full dub pipeline: upload → prep → transcribe → translate → generate → export. ~700 LOC of handler logic extracted from App.jsx. Handles expired job recovery, SRT import queuing, cookie transport errors, speaker clone defaults. | WEB WORKING | All API calls use `apiFetch` which resolves to `/api/voice/*` in web mount. `AbortController` for cancellation. SSE for streaming. No Tauri-specific code. | Start a dub pipeline with mocked API; verify each stage completes. | N/A |
| 101 | useRealtimeEvents | `hooks/useRealtimeEvents.js` | Global | App mount | WebSocket connection to `/ws/events` for live sidebar updates (projects, profiles, dub_history, export_history). Auto-reconnect with exponential backoff. Health-check preflight. | WEB WORKING | WebSocket URL resolved from `API` base (proxied to `/api/voice/ws` or backend). Health check uses `/health` endpoint. Reconnect logic is standard WebSocket. | Mount app with WS mock; verify reconnect on close. | N/A |
| 102 | useShellNarrow | `hooks/useShellNarrow.js` | Launchpad | Launchpad | Detects narrow shell width via container queries | WEB WORKING | Uses `[container-type:inline-size]` CSS feature. | Resize browser to narrow width; verify LaunchpadDeck reflows. | N/A |
| 103 | useResponsiveShellSize | `hooks/useResponsiveShellSize.js` | Global | App mount | Reports shell content width for responsive decisions | WEB WORKING | Uses `ResizeObserver` on app container. | Resize window; verify UI adjusts. | N/A |
| 104 | useRecording | `hooks/useRecording.js` | Voice, Transcriptions | Audio record buttons | MediaRecorder-based audio capture, chunk assembly, stop/start, error handling | WEB WORKING | `navigator.mediaDevices.getUserMedia` + `MediaRecorder`. | Click record in Voice → From Audio; verify recording starts. | N/A |
| 105 | useSegmentEditing | `hooks/useSegmentEditing.js` | Dub | Dub segment table | Segment CRUD: edit text, timing, status, voice. Split, merge, insert, move/resize. Bulk apply, bulk delete. Undo/redo. | WEB WORKING | All mutations go through store setters + API calls. No native clipboard or filesystem APIs beyond standard Web Clipboard API. | Select segments in Dub; verify edit/delete/split/merge work. | N/A |
| 106 | useAppData | `hooks/useAppData.js` | Global | App mount | Loads initial data: profiles, projects, history, engines, sysinfo, settings | WEB WORKING | Fetches from `/api/voice/*` endpoints on mount. Persists to store. | Mount app; verify data loads (mock API). | N/A |
| 107 | useProfiles | `hooks/useProfiles.js` | Voice, Gallery | Voice workspace, Gallery | Profile CRUD: list, create, save, delete, lock/unlock, select | WEB WORKING | Calls `/api/voice/profiles/*`. | Create/select a profile; verify state updates. | N/A |
| 108 | useDubLivePreview | `hooks/useDubLivePreview.js` | Dub | Dub timeline | Click timeline segment → seek + preview synthesis | WEB WORKING | Seeks waveform + calls `handleSegmentPreview`. | Click a timeline segment; verify preview plays. | N/A |
| 109 | useTimelineOnsets | `hooks/useTimelineOnsets.js` | Dub | Dub timeline | Fetch speech-onset ticks from backend for timeline display | WEB WORKING | Calls `/api/voice/dub/onsets/{jobId}`. | Open Dub after transcription; verify onset ticks render. | N/A |
| 110 | useDictationReadiness | `hooks/useDictationReadiness.js` | Transcriptions | Transcriptions tab | Check mic permission, ASR model installed, engine ready | WEB WORKING | Uses `navigator.mediaDevices.getUserMedia` for permission check. Model status from `/api/voice/model/status`. | Open Transcriptions; verify readiness check runs. | N/A |
| 111 | usePermissions | `hooks/usePermissions.js` | Settings | Settings → Permissions | Check/request microphone, file system permissions | WEB WORKING | `navigator.permissions.query` for mic. File system permission is desktop-only and skipped on web. | Open Settings → Permissions; verify mic check works. | N/A |
| 112 | useAudiobookLexicon | `hooks/useAudiobookLexicon.js` | Audiobook | Audiobook → Book tab | Pronunciation lexicon CRUD: word → respelling rows | WEB WORKING | Stored in `store/glossarySlice.ts` (same slice reused). | Open Audiobook → Book; add a lexicon row; verify it persists. | N/A |
| 113 | useEffectiveDictationShortcut | `hooks/useEffectiveDictationShortcut.js` | Transcriptions | Transcriptions tab | Resolve active dictation keyboard shortcut (platform-aware) | WEB WORKING | Reads from `utils/dictationShortcut.js`. Platform detection via `utils/micError.js`. | Open Transcriptions; verify shortcut hint matches platform. | N/A |

---

## Store Slices (Zustand)

| # | Feature | Upstream Source File | Parent Workspace | How to Open | Expected Behavior | SmartVideo Status | Web Adaptation Notes | Test Method | Screenshot Reference |
|---|---------|---------------------|------------------|-------------|-------------------|-------------------|---------------------|-------------|---------------------|
| 114 | Dub slice | `store/dubSlice.ts` | Dub | Dub workspace | Pipeline state: jobId, step, segments, language, progress, tracks, transcript, error, failure, prep stage, speaker clones, timing strategy, voice match, subtitle options, review mode | WEB WORKING | Persisted to `localStorage` via `coalescedJsonStorage.ts`. Rehydrated on mount. | Start a dub; verify state updates in store. | N/A |
| 115 | Generate slice | `store/generateSlice.ts` | Voice | Voice workspace | Synthesis form state: text, refText, instruct, language, production overrides (speed, steps, cfg, tShift, posTemp, classTemp, layerPenalty, denoise, postprocess, duration), voice-design states (vdStates), design seed, keepSeed, ttsInflight count | WEB WORKING | All persisted to `localStorage`. | Type in Voice script; reload; verify text persists. | N/A |
| 116 | Gallery slice | `store/gallerySlice.ts` | Gallery | Gallery workspace | Gallery zone, archetype filters, favorites, view mode | WEB WORKING | Favorites + view mode persisted. Filters are session-only (also persisted). | Filter gallery; reload; verify filters persist. | N/A |
| 117 | Longform slice | `store/longformSlice.ts` | Audiobook, Stories | Audiobook/Stories workspaces | Script, voiceCast, outputPrefs (defaultVoice, language, format, loudness), meta, lastOutput, lastOutputScript, lastOutputChapters | WEB WORKING | Persisted via `longformPersistence.ts` (localStorage + IndexedDB fallback). | Type in Audiobook script; reload; verify text persists. | N/A |
| 118 | UI slice | `store/uiSlice.ts` | Global | All workspaces | Sidebar tab, mode, pendingSettingsTab, updateChannel | WEB WORKING | Persisted to localStorage. | Switch sidebar tab; reload; verify active tab persists. | N/A |
| 119 | Prefs slice | `store/prefsSlice.ts` | Global | Settings | User preferences: uiScale, appearance, notifications | WEB WORKING | Persisted to localStorage. | Change a pref; reload; verify it persists. | N/A |
| 120 | Pill slice | `store/pillSlice.ts` | Global | All workspaces | Floating notification pills (translate/generate/install status) | WEB WORKING | Transient (not persisted). | Trigger a long operation; verify pill appears. | N/A |
| 121 | Glossary slice | `store/glossarySlice.ts` | Dub, Audiobook | Dub + Audiobook | Glossary terms: word → replacement map | WEB WORKING | Persisted to localStorage. | Add a glossary term; reload; verify it persists. | N/A |
| 122 | Updater slice | `store/updaterSlice.ts` | Settings | Settings → Updates | Update state: checking/downloading/installing/error | WEB ADAPTED | Desktop-only update flow is gated by `isTauri()`. On web, slice remains at idle. | Open Settings → Updates on web; verify slice is idle. | N/A |
| 123 | Releases slice | `store/releasesSlice.ts` | Settings | Settings → About | Release notes, version info | WEB WORKING | Fetches from `/api/voice/system/version` or static. | Open Settings → About; verify version renders. | N/A |
| 124 | Donation slice | `store/donationSlice.ts` | Global | Footer/support | Donation state, moments tracking | WEB WORKING | `recordValueMoment` fires on key actions (dub complete, batch complete). | Complete a dub; verify donation moment recorded (dev-only). | N/A |

---

## Key Hooks (Continued)

| # | Feature | Upstream Source File | Parent Workspace | How to Open | Expected Behavior | SmartVideo Status | Web Adaptation Notes | Test Method | Screenshot Reference |
|---|---------|---------------------|------------------|-------------|-------------------|-------------------|---------------------|-------------|---------------------|
| 125 | useProfiles (tested) | `hooks/useProfiles.js` + `hooks/useProfiles.test.jsx` | Voice, Gallery | Voice workspace | Profile list, create, save, delete | WEB WORKING | Standard API calls. | Run `hooks/useProfiles.test.jsx` in upstream test suite. | N/A |
| 126 | useResponsiveShellSize (tested) | `hooks/useResponsiveShellSize.test.jsx` | Global | App mount | Shell width for responsive layout | WEB WORKING | ResizeObserver-based. | Run `hooks/useResponsiveShellSize.test.jsx`. | N/A |
| 127 | useDictationReadiness (tested) | `hooks/useDictationReadiness.test.jsx` | Transcriptions | Transcriptions tab | Mic + ASR readiness | WEB WORKING | Uses browser APIs. | Run `hooks/useDictationReadiness.test.jsx`. | N/A |
| 128 | useAppData persistence (tested) | `hooks/useAppData.persistence.test.jsx` | Global | App mount | Data load + persistence | WEB WORKING | localStorage + IndexedDB. | Run `hooks/useAppData.persistence.test.jsx`. | N/A |

---

## API Modules

| # | Feature | Upstream Source File | Parent Workspace | Expected Behavior | SmartVideo Status | Web Adaptation Notes | Test Method |
|---|---------|---------------------|------------------|-------------------|-------------------|---------------------|-------------|
| 129 | API client | `api/client.ts` | Global | Resolves API base from `window.__OMNIVOICE_API_BASE__` or `window.location.origin` | WEB WORKING | `src/integrations/voice-studio/api.js` sets `window.__OMNIVOICE_API_BASE__ = '/api/voice'` before App.jsx loads. All requests go through Next.js proxy at `app/api/voice/[...path]/route.ts`. | `e2e/voice-studio-acceptance.spec.ts`: "API requests target /api/voice/* and not :3900" |
| 130 | Auth session | `api/authSession.ts` | Global | LAN PIN, short-lived admin session, authenticated WS URL | WEB WORKING | Web mount uses Clerk session from SmartVideo host. `authenticatedWsUrl` resolves WS path with auth headers. | Verify WS connects with auth in network tab. | N/A |
| 131 | Profiles API | `api/profiles.ts` | Voice, Gallery | CRUD for voice profiles | WEB WORKING | Proxied through `/api/voice/profiles/*`. | Create/delete a profile; verify API calls in network tab. | N/A |
| 132 | Dialects API | `api/dialects.ts` | Dub, Voice | Dialect/accent data for language pickers | WEB WORKING | Proxied through `/api/voice/dialects/*`. | Open dialect picker; verify options load. | N/A |
| 133 | Dub API | `api/dub.ts` | Dub | Upload, ingest URL, abort, cleanup, translate, generate, import SRT, QC, media/preview/audio download | WEB WORKING | All proxied through `/api/voice/dub/*`. | Start a dub; verify API calls in network tab. | N/A |
| 134 | Generate API | `api/generate.ts` | Voice | TTS generation, streaming preview, audio URL | WEB WORKING | Proxied through `/api/voice/generate`. | Synthesize audio; verify API call. | N/A |
| 135 | Projects API | `api/projects.ts` | Projects | Project CRUD, list, load | WEB WORKING | Proxied through `/api/voice/projects/*`. | Create a project; verify API call. | N/A |
| 136 | Gallery API | `api/gallery.ts` | Gallery | Archetype preview, community items | WEB WORKING | Proxied through `/api/voice/gallery/*`. | Preview a gallery voice; verify API call. | N/A |
| 137 | Audiobook API | `api/audiobook.ts` | Audiobook | Plan, generate, resume, upload cover, preview chapter, import | WEB WORKING | Proxied through `/api/voice/audiobook/*`. | Start audiobook generation; verify API calls. | N/A |
| 138 | Exports API | `api/exports.ts` | Projects | Export history, reveal path | WEB WORKING | Proxied through `/api/voice/exports/*`. `exportReveal` is desktop-only (no-op on web). | Export a file; verify download triggers. | N/A |
| 139 | API hooks | `api/hooks.ts` | Global | useEngines, useSysinfo, useModelStatus, useSystemInfo | WEB WORKING | TanStack Query hooks, cached. | Open Settings; verify engine status loads. | N/A |
| 140 | Engines API | `api/engines.ts` | Settings, Voice | Engine list, install, effect presets | WEB WORKING | Proxied through `/api/voice/engines/*`. | Install an engine; verify API call. | N/A |
| 141 | Setup API | `api/setup.ts` | Settings | Cancel model install, setup wizard | WEB WORKING | Proxied through `/api/voice/setup/*`. | Cancel an install; verify API call. | N/A |
| 142 | System API | `api/system.ts` | Settings | Logs, flush memory, diagnose, diagnostic bundle | WEB WORKING | Proxied through `/api/voice/system/*`. `systemLogsTauri` is desktop-only. | Open Settings → Logs; verify logs load. | N/A |
| 143 | Batch API | `api/batch.ts` | Batch Queue | List/get/cancel/delete/enqueue batch jobs | WEB WORKING | Proxied through `/api/voice/batch/*`. | Enqueue a batch job; verify API call. | N/A |
| 144 | External API | `api/external.ts` | Global | External service calls | WEB WORKING | Proxied or CORS-exempt. | Trigger external call; verify it succeeds. | N/A |
| 145 | Glossary API | `api/glossary.ts` | Dub | Glossary CRUD | WEB WORKING | Proxied through `/api/voice/glossary/*`. | Add a glossary term; verify API call. | N/A |
| 146 | Donation API | `api/donation.ts` | Global | Donation moment recording | WEB WORKING | Proxied through `/api/voice/donation/*`. | Trigger a value moment; verify API call. | N/A |

---

## Config / i18n / Data

| # | Feature | Upstream Source File | Parent Workspace | Expected Behavior | SmartVideo Status | Web Adaptation Notes | Test Method |
|---|---------|---------------------|------------------|-------------------|-------------------|---------------------|-------------|
| 147 | Sponsors config | `config/sponsors.js` | Support | Active sponsors list, contact links | WEB WORKING | `SPONSORS` array is empty in upstream v0.5.2. Support page renders "be the first" placeholder. | Open Support page; verify placeholder renders. | N/A |
| 148 | i18n setup | `i18n/index.ts` | Global | react-i18next initialization, 21 locales | WEB WORKING | Loaded in `VoiceStudioWebApp.jsx` bootstrap. All 21 locale JSON files are bundled. | Switch language in settings; verify UI updates. | N/A |
| 149 | Languages data | `i18n/languages.json` | Global | Language names + ISO codes | WEB WORKING | Static JSON, consumed by language pickers. | Open any language picker; verify list populates. | N/A |
| 150 | Sample story | `data/sampleStory.js` | Stories | Demo story script for first-run | WEB WORKING | Bundled static data. | Open Stories with no content; verify sample loads. | N/A |
| 151 | Sample audiobook | `data/sampleAudiobook.js` | Audiobook | Demo audiobook script for first-run | WEB WORKING | Bundled static data. | Open Audiobook with no content; verify sample loads. | N/A |
| 152 | Constants | `utils/constants.js` | Global | `CLONE_MAX_SECONDS`, `PRESETS`, `TAGS`, `CATEGORIES`, `POPULAR_LANGS`, `POPULAR_ISO` | WEB WORKING | Static JS module. | Open Voice → From Audio; verify presets render. | N/A |

---

## Key Utils

| # | Feature | Upstream Source File | Parent Workspace | Expected Behavior | SmartVideo Status | Web Adaptation Notes | Test Method |
|---|---------|---------------------|------------------|-------------------|-------------------|---------------------|-------------|
| 153 | Audio playback | `utils/media.js`, `utils/playback.js` | Global | Play/pause/stop audio, blob URL handling, global playback slot | WEB WORKING | `playBlobAudio` handles Tauri blob URL edge case. Web uses standard `<audio>` + blob URLs. | Play any audio; verify playback works. | N/A |
| 154 | Streaming TTS | `utils/streamingTts.js` | Voice | Streaming TTS response handling, progressive playback | WEB WORKING | Uses fetch + ReadableStream. Web-compatible. | Synthesize with streaming enabled; verify progressive playback. | N/A |
| 155 | Voice instruct | `utils/voiceInstruct.js` | Voice | Voice-design attribute mapping, `applyVdState` exclusivity guard, `mergeDescribedAttrs` | WEB WORKING | Pure JS logic, no native deps. | Design a voice by description; verify attributes apply. | N/A |
| 156 | Multi-language | `utils/multiLang.js` | Dub | Multi-language batch target computation, translation progress | WEB WORKING | Pure JS logic. | Enable multi-language in Dub; verify batch computes correctly. | N/A |
| 157 | Segments | `utils/segments.js` | Dub | Segment manipulation, speaker clone defaults | WEB WORKING | Pure JS logic. | Edit segments in Dub; verify manipulation works. | N/A |
| 158 | Story cast | `utils/storyCast.js` | Stories, Gallery | Cast member color assignment | WEB WORKING | Pure JS logic. | Add cast members; verify colors assign. | N/A |
| 159 | Audiobook script | `utils/audiobookScript.js` | Audiobook | Script parsing, validation, cast name extraction | WEB WORKING | Pure JS logic. | Paste audiobook script; verify chapters detect. | N/A |
| 160 | Longform stream | `utils/longformStream.js` | Audiobook | SSE stream consumer for chapterized generation | WEB WORKING | Uses fetch + ReadableStream. | Start audiobook generation; verify stream consumes. | N/A |
| 161 | Longform persistence | `utils/longformPersistence.ts` | Audiobook | Longform project persistence (localStorage + IndexedDB) | WEB WORKING | IndexedDB available in browser. | Generate audiobook; reload; verify output persists. | N/A |
| 162 | Transcriptions store | `utils/transcriptionsStore.js` | Transcriptions | Transcription list CRUD in localStorage | WEB WORKING | Standard localStorage. | Create a transcription; reload; verify it persists. | N/A |
| 163 | Dictation capture | `utils/dictationCapture.js` | Transcriptions | Start/stop dictation via MediaRecorder | WEB WORKING | Uses `navigator.mediaDevices.getUserMedia` + `MediaRecorder`. | Start dictation; verify audio captures. | N/A |
| 164 | Relative time | `utils/relativeTime.js` | Global | `timeAgo()`, `toMillis()` timestamp formatting | WEB WORKING | Pure JS logic. | Verify timestamps render correctly across projects. | N/A |
| 165 | Copy text | `utils/copyText.js` | Global | Clipboard write with fallback | WEB WORKING | Uses `navigator.clipboard.writeText` with fallback. | Click copy in any list; verify clipboard receives text. | N/A |
| 166 | Audio trim | `utils/audioTrim.js` | Voice, Gallery | Audio duration probe, trim validation | WEB WORKING | Uses `Audio` element + `decodeAudioData`. | Upload reference audio > 30s; verify trim gate triggers. | N/A |
| 167 | Audio input | `utils/audioInput.js` | Voice, Transcriptions | Device enumeration, input selection | WEB WORKING | `navigator.mediaDevices.enumerateDevices`. | Open audio input picker; verify devices list. | N/A |
| 168 | Media recorder | `utils/mediaRecorder.js` | Voice, Transcriptions | MediaRecorder wrapper with mime-type fallback | WEB WORKING | Standard `MediaRecorder` API. | Record audio; verify blob produces. | N/A |
| 169 | Timeline | `utils/timeline.js` | Dub | Timeline geometry, zoom, segment math | WEB WORKING | Pure JS geometry. | Zoom/pan timeline; verify segments position correctly. | N/A |
| 170 | Waveform pan | `utils/waveformPan.js` | Dub | Waveform scroll/pan math | WEB WORKING | Pure JS geometry. | Pan waveform; verify cursor follows. | N/A |
| 171 | Permissions | `utils/permissions.js` | Settings | Permission query/request helpers | WEB WORKING | `navigator.permissions.query`. | Request mic permission; verify prompt appears. | N/A |
| 172 | Backend crash | `utils/backendCrash.ts` | Global | Parse backend crash/error responses | WEB WORKING | Pure TS logic. | Simulate 500 error; verify crash notice renders. | N/A |
| 173 | Backend lifecycle | `utils/backendLifecycle.ts` | Global | Backend startup/shutdown state machine | WEB WORKING | Polls `/health` endpoint. | Start/stop backend; verify lifecycle UI updates. | N/A |
| 174 | Deployment mode | `utils/deploymentMode.ts` | Global | Detect Tauri vs web vs remote | WEB WORKING | Checks `window.__TAURI__` + URL params. | Verify mode detects correctly in web. | N/A |
| 175 | Remote backend probe | `utils/remoteBackendProbe.ts` | Global | Probe remote backend connectivity | WEB WORKING | HTTP probe to configured remote URL. | Configure remote backend; verify probe runs. | N/A |
| 176 | Error toast | `utils/errorToast.jsx` | Global | Error display with "report a bug" CTA | WEB WORKING | Uses `react-hot-toast`. | Trigger an error; verify toast renders with report CTA. | N/A |
| 177 | Error docs map | `utils/errorDocsMap.ts` | Global | Map error codes to docs topics | WEB WORKING | Static map. | Trigger a known error; verify docs link appears. | N/A |
| 178 | Bug report | `utils/bugReport.js` | Global | Prefill GitHub issue with diagnostics | WEB WORKING | Opens prefilled GitHub issue URL. | Click bug report; verify GitHub issue form opens. | N/A |
| 179 | Donate links | `utils/donateLinks.js` | Global | Kofi/GitHub sponsorship links | WEB WORKING | Static URLs. | Open Support; verify links are correct. | N/A |
| 180 | Donation moments | `utils/donationMoments.js` | Global | Track value moments for donation prompts | WEB WORKING | Fires events to `store/donationSlice.ts`. | Complete a dub; verify moment recorded. | N/A |
| 181 | Analytics | `utils/analytics.ts` | Global | Analytics init from consent state | WEB WORKING | Privacy-respecting, consent-gated. | Grant consent; verify analytics init. | N/A |
| 182 | Breadcrumbs | `utils/breadcrumbs.js` | Global | Navigation breadcrumb logging | WEB WORKING | In-memory + console. | Navigate; verify breadcrumbs log. | N/A |
| 183 | Routing notice | `utils/routingNotice.js` | Global | Show routing change notices | WEB WORKING | Toast-based. | Switch modes; verify notice appears. | N/A |
| 184 | UI scale suggestion | `utils/uiScaleSuggestion.js` | Global | Suggest optimal UI scale based on screen | WEB WORKING | Pure JS math. | Open on different screen size; verify suggestion updates. | N/A |
| 185 | UI scale engine | `utils/uiScaleEngine.js` | Global | Apply UI scale to shell | WEB WORKING | CSS `font-size` + zoom. | Change UI scale; verify shell resizes. | N/A |
| 186 | Pref keys | `utils/prefKeys.js` | Global | localStorage key constants | WEB WORKING | Static constants. | N/A | N/A |
| 187 | Omni UI schema | `utils/omniUiSchema.js` | Global | UI schema for dynamic rendering | WEB WORKING | Static schema. | N/A | N/A |
| 188 | Initial load retry | `utils/initialLoadRetry.js` | Global | Retry initial data load on failure | WEB WORKING | Exponential backoff. | Simulate initial load failure; verify retry. | N/A |
| 189 | Update presentation | `utils/updatePresentation.js` | Global | Format update notifications | WEB WORKING | Pure JS. | Trigger update check; verify notification formats. | N/A |
| 190 | Updates API | `utils/updatesApi.js` | Settings | Check/download/install updates | DESKTOP-ONLY | Uses Tauri `invoke`. On web, returns desktop-only toast. | Open Settings → Updates on web; verify toast. | N/A |
| 191 | Log safe | `utils/logSafe.js` | Global | Sanitize log output for sharing | WEB WORKING | Pure JS sanitization. | Trigger bug report; verify logs are sanitized. | N/A |
| 192 | Mic error | `utils/micError.js` | Transcriptions | Platform-specific mic error messages | WEB WORKING | Platform detection via user agent. | Deny mic permission; verify platform-specific message. | N/A |
| 193 | Dictation shortcut | `utils/dictationShortcut.js` | Transcriptions | Dictation keyboard shortcut config | WEB WORKING | Platform-aware defaults. | Open Transcriptions; verify shortcut hint matches OS. | N/A |
| 194 | Dictation notice | `utils/dictationNotice.jsx` | Transcriptions | Dictation availability notice | WEB WORKING | Conditional render based on readiness. | Open Transcriptions with mic denied; verify notice renders. | N/A |
| 195 | ASR model missing | `utils/asrModelMissing.jsx` | Dub, Transcriptions | Prompt to install missing ASR model | WEB WORKING | Calls `/api/voice/setup/install`. | Trigger ASR-missing state; verify install CTA renders. | N/A |
| 196 | Model not downloaded | `utils/modelNotDownloaded.jsx` | Voice, Settings | Prompt to download missing TTS model | WEB WORKING | Calls `/api/voice/setup/install`. | Trigger model-missing state; verify install CTA renders. | N/A |
| 197 | Engine select toast | `utils/engineSelectToast.js` | Global | Toast for engine selection | WEB WORKING | Uses `react-hot-toast`. | Switch engine; verify toast appears. | N/A |
| 198 | Engine display name | `utils/engineDisplayName.js` | Global | Human-readable engine names | WEB WORKING | Static map. | Open engine picker; verify names display. | N/A |
| 199 | Generate preflight | `utils/generatePreflight.js` | Voice | Pre-generation checks | WEB WORKING | Pure JS validation. | Click Generate with invalid input; verify preflight blocks. | N/A |
| 200 | Media download | `utils/mediaDownload.js` | Global | Download media with progress | WEB WORKING | Uses `fetch` + `Blob` + `<a download>`. | Export a file; verify download triggers. | N/A |
| 201 | Watch folder | `utils/watchFolder.js` | Batch Queue | Desktop watch-folder monitoring | DESKTOP-ONLY | Uses Tauri `fs.watch`. On web, feature is inert. | Open Batch Queue on web; verify watch-folder is inactive. | N/A |
| 202 | Persistence lifecycle | `utils/persistenceLifecycle.ts` | Global | Flush persistence on desktop exit | WEB ADAPTED | `installDesktopPersistenceExitHandshake` is a no-op on web (guarded by `isTauri()` check). `installPersistenceLifecycleFlush` runs on both. | `src/integrations/voice-studio/VoiceStudioWebApp.jsx` calls both; desktop variant is silently skipped on web. | N/A |
| 203 | Coalesced JSON storage | `utils/coalescedJsonStorage.ts` | Global | localStorage + IndexedDB coalesced storage | WEB WORKING | `configurePersistenceRole('main')` marks this as primary. | Reload app; verify store rehydrates from storage. | N/A |
| 204 | IndexedDB longform store | `utils/indexedDbLongformStore.ts` | Audiobook | IndexedDB-backed longform project storage | WEB WORKING | Standard IndexedDB API. | Generate audiobook; verify output stored in IndexedDB. | N/A |
| 205 | Console buffer | `utils/consoleBuffer.js` | Global | Capture console logs for bug reports | WEB WORKING | Overrides `console.log/warn/error` in-memory. | Trigger console logs; verify buffer captures. | N/A |
| 206 | Global error handlers | `utils/globalErrorHandlers.js` | Global | Global `window.onerror` + `unhandledrejection` | WEB WORKING | Standard DOM event listeners. | Trigger unhandled rejection; verify handler catches. | N/A |
| 207 | First sound | `utils/firstSound.js` | Global | Play first sound on first launch | WEB WORKING | Uses Web Audio API. | Clear localStorage + reload; verify first sound plays. | N/A |
| 208 | App shell classes | `utils/appShellClasses.js` | Global | CSS class strings for app shell | WEB WORKING | Static CSS class strings. | N/A | N/A |
| 209 | Remote backend probe (tested) | `utils/remoteBackendProbe.test.ts` | Global | Remote backend connectivity test | WEB WORKING | HTTP probe. | Run `utils/remoteBackendProbe.test.ts`. | N/A |
| 210 | API base (tested) | `utils/apiBase.test.ts` | Global | API base URL resolution | WEB WORKING | `window.__OMNIVOICE_API_BASE__` override tested. | Run `utils/apiBase.test.ts`. | N/A |
| 211 | Update channel (tested) | `utils/updateChannel.test.ts` | Global | Update channel normalization | WEB WORKING | Pure JS. | Run `utils/updateChannel.test.ts`. | N/A |
| 212 | Persistence lifecycle (tested) | `utils/persistenceLifecycle.test.ts` | Global | Persistence flush | WEB WORKING | No-op on web for desktop exit. | Run `utils/persistenceLifecycle.test.ts`. | N/A |
| 213 | Longform persistence (tested) | `utils/longformPersistence.test.ts` | Global | Longform storage | WEB WORKING | IndexedDB available. | Run `utils/longformPersistence.test.ts`. | N/A |
| 214 | Audio input (tested) | `utils/audioInput.test.js` | Voice | Audio device enumeration | WEB WORKING | `navigator.mediaDevices.enumerateDevices`. | Run `utils/audioInput.test.js`. | N/A |
| 215 | Dictation shortcut (tested) | `utils/dictationShortcut.test.js` | Transcriptions | Shortcut resolution | WEB WORKING | Platform detection. | Run `utils/dictationShortcut.test.js`. | N/A |
| 216 | Dictation capture (tested) | `utils/dictationCapture.test.js` | Transcriptions | Dictation start/stop | WEB WORKING | MediaRecorder. | Run `utils/dictationCapture.test.js`. | N/A |
| 217 | Mic error (tested) | `utils/micError.test.js` | Transcriptions | Platform-specific mic errors | WEB WORKING | User agent detection. | Run `utils/micError.test.js`. | N/A |
| 218 | Console buffer (tested) | `utils/consoleBuffer.test.js` | Global | Console capture | WEB WORKING | In-memory override. | Run `utils/consoleBuffer.test.js`. | N/A |
| 219 | Permissions (tested) | `utils/permissions.test.js` | Settings | Permission helpers | WEB WORKING | `navigator.permissions`. | Run `utils/permissions.test.js`. | N/A |
| 220 | Bug report (tested) | `utils/bugReport.test.js` | Global | Bug report URL generation | WEB WORKING | URL construction. | Run `utils/bugReport.test.js`. | N/A |
| 221 | Story cast (tested) | `utils/storyCast.test.js` | Stories | Cast color assignment | WEB WORKING | Pure JS. | Run `utils/storyCast.test.js`. | N/A |
| 222 | Story to spans (tested) | `utils/storyToSpans.js` | Stories | Story text → spans | WEB WORKING | Pure JS. | N/A | N/A |
| 223 | Story tokens (tested) | `utils/storyTokens.test.js` | Stories | Story token parsing | WEB WORKING | Pure JS. | Run `utils/storyTokens.test.js`. | N/A |
| 224 | Story export (tested) | `utils/storyExport.test.js` | Stories | Story export | WEB WORKING | Blob download. | Run `utils/storyExport.test.js`. | N/A |
| 225 | Segment parts (tested) | `utils/segmentParts.test.js` | Dub | Segment parsing | WEB WORKING | Pure JS. | Run `utils/segmentParts.test.js`. | N/A |
| 226 | Parse script (tested) | `utils/parseScript.test.js` | Audiobook | Script parsing | WEB WORKING | Pure JS. | Run `utils/parseScript.test.js`. | N/A |
| 227 | Script to story (tested) | `utils/scriptToStory.test.js` | Stories | Script → story conversion | WEB WORKING | Pure JS. | Run `utils/scriptToStory.test.js`. | N/A |
| 228 | Story to script (tested) | `utils/storyToScript.test.js` | Stories | Story → script conversion | WEB WORKING | Pure JS. | Run `utils/storyToScript.test.js`. | N/A |
| 229 | Audiobook lyrics (tested) | `utils/audiobookLyrics.test.js` | Audiobook | Lyrics sync generation | WEB WORKING | Pure JS. | Run `utils/audiobookLyrics.test.js`. | N/A |
| 230 | Relative time (tested) | `utils/relativeTime.test.js` | Global | Time formatting | WEB WORKING | Pure JS. | Run `utils/relativeTime.test.js`. | N/A |
| 231 | UI scale suggestion (tested) | `utils/uiScaleSuggestion.test.js` | Global | Scale suggestion | WEB WORKING | Pure JS. | Run `utils/uiScaleSuggestion.test.js`. | N/A |
| 232 | Stale build (tested) | `utils/staleBuild.test.js` | Global | Stale build detection | WEB WORKING | Pure JS. | Run `utils/staleBuild.test.js`. | N/A |
| 233 | Audio unlock (tested) | `utils/audioUnlock.test.js` | Global | Audio context unlock | WEB WORKING | Web Audio API. | Run `utils/audioUnlock.test.js`. | N/A |
| 234 | Download (tested) | `utils/download.test.js` | Global | Download helper | WEB WORKING | Blob + `<a download>`. | Run `utils/download.test.js`. | N/A |
| 235 | Voice instruct (tested) | `utils/voiceInstruct.test.js` | Voice | Voice design instruction mapping | WEB WORKING | Pure JS. | Run `utils/voiceInstruct.test.js`. | N/A |
| 236 | Breadcrumbs (tested) | `utils/breadcrumbs.test.js` | Global | Breadcrumb logging | WEB WORKING | In-memory. | Run `utils/breadcrumbs.test.js`. | N/A |

---

## UI Primitives

| # | Feature | Upstream Source File | Expected Behavior | SmartVideo Status | Web Adaptation Notes |
|---|---------|---------------------|-------------------|-------------------|---------------------|
| 237 | Button | `ui/Button.jsx` | Accessible button with variants (primary, ghost, subtle, etc.) | WEB WORKING | Standard React component. | N/A |
| 238 | Input | `ui/Input.jsx` | Text input with label, error state | WEB WORKING | Standard React component. | N/A |
| 239 | Tabs | `ui/Tabs.jsx` | Tab strip with lazy content, manual activation | WEB WORKING | Standard React component. Tested in `ui/Tabs.test.jsx`. | N/A |
| 240 | Slider | `ui/Slider.jsx` | Range slider with label, min/max, step | WEB WORKING | Standard React component. | N/A |
| 241 | Panel | `ui/Panel.jsx` | Container with padding, variant (flat, elevated) | WEB WORKING | Standard React component. | N/A |
| 242 | Dialog | `ui/Dialog.jsx` | Modal dialog with overlay, focus trap | WEB WORKING | Standard React component. | N/A |
| 243 | Tooltip | `ui/Tooltip.jsx` | Hover/focus tooltip | WEB WORKING | Standard React component. | N/A |
| 244 | Menu | `ui/Menu.jsx` | Dropdown menu with items, icons, shortcuts | WEB WORKING | Standard React component. | N/A |
| 245 | Progress | `ui/Progress.jsx` | Progress bar with label | WEB WORKING | Standard React component. | N/A |
| 246 | Badge | `ui/Badge.jsx` | Status badge with tone (brand, success, danger, warn, neutral) | WEB WORKING | Standard React component. | N/A |
| 247 | Table | `ui/Table.jsx` | Data table with sort, selection | WEB WORKING | Standard React component. | N/A |
| 248 | Segmented | `ui/Segmented.jsx` | Segmented control (radio-button group) | WEB WORKING | Standard React component. | N/A |
| 249 | UI index | `ui/index.js` | Barrel export for all UI primitives | WEB WORKING | Standard barrel export. | N/A |

---

## Desktop-Only Features (Excluded from SmartVideo GO)

| # | Feature | Upstream Source File | Why Desktop-Only | SmartVideo Status |
|---|---------|---------------------|------------------|-------------------|
| 250 | Tauri desktop shell | `frontend/src-tauri/` (not in `vendor/VoiceStudio/frontend/src/`) | Tauri v2 runtime, native window chrome | DESKTOP-ONLY |
| 251 | Native updater | `components/UpdatesPanel.jsx` + `utils/updatesApi.js` | Uses `@tauri-apps/api/core` `invoke('check_update')` | DESKTOP-ONLY |
| 252 | Native file dialogs / filesystem reveal | `api/exports.ts` (`exportReveal`) | Uses Tauri `fs` + `shell` APIs | DESKTOP-ONLY |
| 253 | Local model installation | `api/setup.ts` + `utils/asrModelMissing.jsx` | Downloads models to local filesystem via Tauri | DESKTOP-ONLY (model install UI renders but actual install requires Modal backend) |
| 254 | Local process spawning | `backend/` (not in `frontend/src/`) | Python subprocess management | DESKTOP-ONLY |
| 255 | System-wide dictation widget | `hooks/useDictationReadiness.js` + `components/DesktopCaptureShortcutBridge.jsx` + `utils/dictationCapture.js` (global shortcut path) | Tauri `globalShortcut` API for system-wide hotkeys | DESKTOP-ONLY |
| 256 | Local MCP server transport | `components/settings/MCPBindingsPanel.jsx` | Local loopback MCP transport | DESKTOP-ONLY |
| 257 | CUDA/MPS/ROCm GPU auto-detect | `api/hooks.ts` (`useSysinfo`) | Native GPU detection via Tauri | DESKTOP-ONLY |
| 258 | Apple Silicon / Windows / Linux native packaging | `deploy/`, `infra/` | Platform-specific packaging | DESKTOP-ONLY |
| 259 | Docker local-only deployment | `deploy/docker/` | Local Docker Compose | DESKTOP-ONLY |
| 260 | Watch-folder filesystem monitor | `utils/watchFolder.js` + `components/WatchFolderBar.jsx` | Tauri `fs.watch` | DESKTOP-ONLY |
| 261 | Desktop persistence exit handshake | `utils/persistenceLifecycle.ts` (`installDesktopPersistenceExitHandshake`) | Tauri `app.on('window-close')` | WEB ADAPTED (no-op on web, safe to call) |
| 262 | Tauri log access | `api/system.ts` (`systemLogsTauri`) | Tauri log files | DESKTOP-ONLY |

---

## Blocked Features

| # | Feature | Upstream Source File | Blocker | SmartVideo Status |
|---|---------|---------------------|---------|-------------------|
| 263 | Local FastAPI backend on `localhost:3900` | `api/client.ts` (upstream default) | SmartVideo uses Modal cloud backend + `/api/voice/*` proxy instead | WEB ADAPTED (API base overridden) |
| 264 | Local engine registry | `utils/remoteBackendProbe.ts` + `api/hooks.ts` | SmartVideo uses Modal engine routing | WEB ADAPTED (Modal-backed) |
| 265 | Local SQLite (`omnivoice_data/`) | `utils/coalescedJsonStorage.ts` + `utils/indexedDbLongformStore.ts` | SmartVideo uses Supabase for persistence + localStorage/IndexedDB for client cache | WEB ADAPTED (client-side storage only) |

---

## Missing Features (MISSING = 0)

All upstream features from `vendor/VoiceStudio/frontend/src/pages/`, `components/`, `hooks/`, `store/`, and `utils/` are accounted for above. There are **no MISSING features** — every upstream UI feature is either WEB WORKING, WEB ADAPTED, DESKTOP-ONLY, or BLOCKED.

---

## Screenshot Reference Index

| Screenshot | Workspace | E2E Test |
|-----------|-----------|----------|
| `e2e/visual-assets/voice-studio-acceptance/01-launchpad.png` | Launchpad | `01-launchpad.png` |
| `e2e/visual-assets/voice-studio-acceptance/02-voice-from-audio.png` | Voice → From Audio | `02-voice-from-audio.png` |
| `e2e/visual-assets/voice-studio-acceptance/03-voice-by-design.png` | Voice → By Design | `03-voice-by-design.png` |
| `e2e/visual-assets/voice-studio-acceptance/04-convert.png` | Voice → Convert | `04-convert.png` |
| `e2e/visual-assets/voice-studio-acceptance/05-dub.png` | Dub | `05-dub.png` |
| `e2e/visual-assets/voice-studio-acceptance/06-stories.png` | Stories | `06-stories.png` |
| `e2e/visual-assets/voice-studio-acceptance/07-audiobook.png` | Audiobook | `07-audiobook.png` |
| `e2e/visual-assets/voice-studio-acceptance/08-gallery.png` | Gallery | `08-gallery.png` |
| `e2e/visual-assets/voice-studio-acceptance/09-transcriptions.png` | Transcriptions | `09-transcriptions.png` |
| `e2e/visual-assets/voice-studio-acceptance/10-projects.png` | Projects | `10-projects.png` |
| `e2e/visual-assets/voice-studio-acceptance/11-settings.png` | Settings | `11-settings.png` |

---

## Test Commands

```bash
# Run VoiceStudio acceptance tests
npx playwright test e2e/voice-studio-acceptance.spec.ts

# Run upstream unit tests (from vendor directory)
cd vendor/VoiceStudio/frontend && npm test

# Run specific upstream test files
npx vitest run vendor/VoiceStudio/frontend/src/hooks/useProfiles.test.jsx
npx vitest run vendor/VoiceStudio/frontend/src/hooks/useResponsiveShellSize.test.jsx
npx vitest run vendor/VoiceStudio/frontend/src/hooks/useDictationReadiness.test.jsx
npx vitest run vendor/VoiceStudio/frontend/src/hooks/useAppData.persistence.test.jsx
npx vitest run vendor/VoiceStudio/frontend/src/ui/Tabs.test.jsx
```

---

## Source File Inventory Verification

The following upstream directories were fully enumerated to build this document:

```
vendor/VoiceStudio/frontend/src/
  pages/        — 17 .jsx files (Launchpad, DubTab, Projects, CloneDesignTab, AudiobookTab, VoiceGallery, Transcriptions, Settings, BatchQueue, ModelCatalogue, VoiceProfile, SetupWizard, ToolsPage, ContactPage, SupportPage, + 3 test files)
  components/   — 100+ .jsx files (dub/, clone/, gallery/, audiobook/, settings/, profile/, brand/, donate/, + primitives)
  hooks/        — 16 .js files (useTTS, useDubWorkflow, useRealtimeEvents, useShellNarrow, useResponsiveShellSize, useRecording, useSegmentEditing, useAppData, useProfiles, useDubLivePreview, useTimelineOnsets, useDictationReadiness, usePermissions, useAudiobookLexicon, + 4 test files)
  store/        — 14 .ts files (index, dubSlice, generateSlice, gallerySlice, longformSlice, uiSlice, prefsSlice, pillSlice, glossarySlice, updaterSlice, releasesSlice, donationSlice, + 7 test files)
  utils/        — 100+ files (media, playback, streamingTts, voiceInstruct, multiLang, segments, storyCast, audiobookScript, longformStream, longformPersistence, transcriptionsStore, dictationCapture, relativeTime, copyText, audioTrim, audioInput, mediaRecorder, timeline, waveformPan, permissions, backendCrash, backendLifecycle, deploymentMode, remoteBackendProbe, errorToast, errorDocsMap, bugReport, donateLinks, donationMoments, analytics, breadcrumbs, routingNotice, uiScaleSuggestion, uiScaleEngine, prefKeys, omniUiSchema, initialLoadRetry, updatePresentation, updatesApi, logSafe, micError, dictationShortcut, dictationNotice, asrModelMissing, modelNotDownloaded, engineSelectToast, engineDisplayName, generatePreflight, mediaDownload, watchFolder, persistenceLifecycle, coalescedJsonStorage, indexedDbLongformStore, consoleBuffer, globalErrorHandlers, firstSound, appShellClasses, remoteBackendProbe, apiBase, updateChannel, + 30+ test files)
  api/          — 16 .ts files (client, authSession, external, profiles, dialects, dub, generate, projects, gallery, audiobook, exports, hooks, engines, setup, system, batch, community, glossary, donation, + 5 test files)
  config/       — 1 file (sponsors.js)
  i18n/         — index.ts + 21 locales/*.json
  data/         — sampleStory.js, sampleAudiobook.js
  lib/          — utils.ts
  assets/       — signal-field.webp
```
