# Voice Studio Integration — Upstream Parity Matrix

**Source of truth:** https://github.com/debpalash/VoiceStudio  
**Target:** SmartVideo GO `/studio/voice`  
**Direction:** Preserve upstream UX/flow; re-skin to SmartVisual GO design tokens; adapt backend to SmartVideo/Modal.

---

## Workspace Map

| Upstream Workspace | SmartVideo Target | Status | Notes |
|-------------------|-------------------|--------|-------|
| Launchpad / Overview | `/studio/voice` Overview tab | Pending parity | Recent files, saved voices, quick actions |
| Voice → From Audio | `/studio/voice` Voice tab | Pending parity | Zero-shot cloning from reference clip |
| Voice → By Design | `/studio/voice` Voice tab | Pending parity | Voice design controls |
| Voice → Convert | `/studio/voice` Voice tab | Pending parity | Speech-to-speech conversion |
| Dub | `/studio/voice` Dub tab | Pending parity | Upload/URL import, transcript, translate, export |
| Stories | `/studio/voice` Stories tab | Pending parity | Multi-voice scripts |
| Audiobook | `/studio/voice` Audiobook tab | Pending parity | EPUB/PDF import, chapters, .m4b export |
| Voices / Gallery | `/studio/voice` Voices tab | Pending parity | Voice cards, search, save profiles |
| Transcriptions | `/studio/voice` Transcriptions tab | Pending parity | ASR results, word-level timing |
| Projects | `/studio/voice` Projects tab | Pending parity | Project list, reopen, batch queue |
| Model Catalogue | Settings / backend | Backend only | Model install/select/routing |
| Dictation | Excluded | Desktop-only | System-wide shortcut, local widget |
| MCP Server | Excluded | Desktop-only | Local MCP transport |

---

## Feature Parity Matrix

| Upstream Component | Upstream Functionality | Target Component | Preserved? | Adapted? | Excluded Native Dependency | Backend Adaptation | Visual Adaptation | Status |
|-------------------|----------------------|-----------------|-----------|---------|---------------------------|-------------------|-------------------|--------|
| Launchpad | Recent files, saved voices, quick actions | Overview tab | Yes | Reskin | — | SmartVideo storage | SmartVideo cards | Not started |
| Voice → From Audio | Reference audio upload, waveform preview, generate | Voice tab / From Audio sub-tab | Yes | Reskin | Native file picker → web upload | Modal TTS backend | SmartVideo form styling | Not started |
| Voice → By Design | Age, accent, pitch, style, delivery controls | Voice tab / By Design sub-tab | Yes | Reskin | — | Modal TTS backend | SmartVideo form styling | Not started |
| Voice → Convert | Source/target voice selection, speech-to-speech | Voice tab / Convert sub-tab | Yes | Reskin | — | Modal TTS backend | SmartVideo form styling | Not started |
| Dub | Video upload/URL, language picker, transcript editor, timeline, waveform, speaker controls, translate, export | Dub tab | Yes | Reskin + web adaptation | Native filesystem reveal → web download | SmartVideo dub API → Modal | SmartVideo editor styling | Not started |
| Stories | Multi-voice script editor, voice assignment, generate | Stories tab | Yes | Reskin | — | SmartVideo stories API | SmartVideo editor styling | Not started |
| Audiobook | Script editor, EPUB/PDF import, chapters, .m4b export | Audiobook tab | Yes | Reskin | EPUB/PDF import → web file picker | SmartVideo audiobook API | SmartVideo editor styling | Not started |
| Voices / Gallery | Icon-based voice cards, search, select, save profile | Voices tab | Yes | Reskin | — | SmartVideo voices API | SmartVideo card styling | Not started |
| Transcriptions | ASR results, word-level timing, export | Transcriptions tab | Yes | Reskin | — | SmartVideo ASR API | SmartVideo results styling | Not started |
| Projects | Project cards, reopen, batch queue, progress | Projects tab | Yes | Reskin | — | SmartVideo projects API | SmartVideo card styling | Not started |
| Waveform editor | Zoom, pan, seek, segment selection | Waveform component | Yes | Keep web | — | Web-compatible | SmartVideo waveform styling | Not started |
| Timeline editor | Drag, zoom, segment editing | Timeline component | Yes | Keep web | — | Web-compatible | SmartVideo timeline styling | Not started |
| Transcript editor | Editable text, timing, status, voice controls | Transcript component | Yes | Keep web | — | Web-compatible | SmartVideo transcript styling | Not started |
| Segment editing | Grouped text/timing/status/voice rows | Segment component | Yes | Keep web | — | Web-compatible | SmartVideo segment styling | Not started |
| Multi-language controls | Language picker, flags, ISO codes | Language component | Yes | Keep web | — | Web-compatible | SmartVideo language styling | Not started |
| Subtitle controls | Subtitle settings, export | Subtitle component | Yes | Keep web if backend supports | — | Web-compatible | SmartVideo subtitle styling | Not started |
| Model Catalogue | Engine select, install, unload, flush | Settings / backend | Backend only | — | — | SmartVideo model registry | — | Not started |
| Dictation widget | System-wide shortcut, live transcription | Excluded | No | — | Tauri, native shortcuts, system-wide | — | — | Excluded |
| MCP server | Local MCP transport | Excluded | No | — | Local loopback only | — | — | Excluded |
| Desktop updater | Auto-update | Excluded | No | — | Native updater | — | — | Excluded |
| Local model installer | Download/install models locally | Excluded | No | — | Local filesystem, large downloads | — | — | Excluded |
| Local filesystem reveal | Open folder in Finder/Explorer | Excluded | No | — | Native filesystem API | — | — | Excluded |

---

## Backend Adaptation Plan

| Upstream Backend Feature | SmartVideo Replacement |
|--------------------------|------------------------|
| Local FastAPI on `localhost:3900` | SmartVideo Next.js API routes `/api/voice/*` |
| Tauri desktop shell | SmartVideo GO `StandaloneShell` |
| Local engine registry | SmartVideo `voiceService` provider abstraction |
| Local model storage | Modal cloud inference + SmartVideo/Supabase storage |
| Local SQLite (`omnivoice_data/`) | SmartVideo/Supabase persistence |
| OpenAI-compatible local API | SmartVideo `/api/voice/*` endpoints |
| MCP server on localhost | Not applicable for web-only Phase 1 |
| Remote workers | Modal cloud workers |
| Audio watermarking | Phase 2+ consideration |
| Analytics | SmartVideo existing telemetry |

---

## Desktop Exclusions

These upstream features depend on native/desktop APIs and are excluded from the web integration:

- Tauri v2 desktop shell (`frontend/src-tauri/`)
- Native updater
- Native file dialogs / filesystem reveal
- Local model installation and management
- Local process spawning
- System-wide dictation widget
- Local MCP server transport
- CUDA/MPS/ROCm GPU auto-detect on client
- Apple Silicon / Windows / Linux native packaging
- Docker local-only deployment

---

## Web-Compatible Features

These upstream features map cleanly to web components:

- Waveform visualization and interaction
- Timeline editor
- Transcript editor with editable segments
- Segment editing (text, timing, status, voice controls)
- Multi-language controls
- Subtitle controls
- Voice cards and gallery
- Project cards and batch queue
- Form-based generation workflows
- Audio playback and download
- History and generation metadata

---

## Licensing Notes

- VoiceStudio application: AGPL-3.0
- Upstream frontend code: AGPL-3.0
- SmartVideo GO: Proprietary
- Strategy: Clean-room implementation preserving UX concepts; do not copy VoiceStudio application code directly into proprietary SaaS without commercial license.

---

## Next Steps

1. Complete upstream UX exploration
2. Build parity matrix with exact file/component mappings
3. Implement re-skinned components in `packages/studio/src/components/VoiceStudio/`
4. Adapt backend to SmartVideo `/api/voice/*` + Modal
5. Test `/studio/voice` against real Modal health service
6. Validate non-regression of `/studio/audio` and other studios
