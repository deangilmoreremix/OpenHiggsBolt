# Voice Studio Phase 1 Integration Report

**Branch:** `integration/voice-studio-modal`  
**Date:** 2026-09-15  
**Status:** COMPLETE  

---

## 1. Phase 1 Scope and Outcomes

Phase 1 establishes the SmartVideo GO Voice Studio foundation without deploying any TTS inference.

Completed:
- `/studio/voice` route registered in SmartVideo GO shell
- `/studio/audio` preserved unchanged
- Voice Studio frontend scaffold with SmartVideo GO styling
- `VoiceHealth` and future-facing provider interface in `src/shared/voice/voiceService.ts`
- Server-side `/api/voice/health` route that contacts the Modal health service
- Deployable Modal health/test service scaffold
- License and integration audit documented
- Build and tests passing

Explicitly not implemented in Phase 1:
- TTS generation
- Voice cloning
- Speech-to-speech
- Dubbing
- Stories / Audiobook
- Multi-speaker generation
- Lip Sync integration
- Credit deduction
- Multiple TTS engines

---

## 2. Modified Files

| File | Change |
|------|--------|
| `components/StandaloneShell.js` | Added `VoiceStudio` lazy load, `voice` tab, and `SLUG_TO_TAB` entry |
| `packages/studio/src/components/VoiceStudio.jsx` | Removed TypeScript annotations from `.jsx` file to fix build |
| `src/shared/voice/voiceService.ts` | Added `detail?: string` to `VoiceHealth` |
| `app/api/voice/health/route.ts` | Made health endpoint call `VOICE_MODAL_SERVICE_URL` server-side |
| `services/voice-modal/app.py` | Added Modal deployment entrypoint |
| `services/voice-modal/pyproject.toml` | Added Python project with `modal`, `fastapi`, `uvicorn` dependencies |
| `.env.local` | Replaced `NEXT_PUBLIC_VOICE_BACKEND_URL` with server-side `VOICE_MODAL_SERVICE_URL` |
| `docs/voice-studio-phase1.md` | This document |

---

## 3. Voice Studio Route Verification

`/studio/voice` is served through the existing SmartVideo GO catch-all route:

```
app/studio/[[...slug]]/page.js
  → StandaloneShell
    → VoiceStudio (lazy loaded from studio package)
```

Verified in `components/StandaloneShell.js`:
- `const VoiceStudio = loadStudio('VoiceStudio');`
- `TABS` includes `{ id: 'voice', label: 'Voice Studio' }`
- `SLUG_TO_TAB` includes `'voice': 'voice'`
- Render map includes `{activeTab === 'voice' && <VoiceStudio ... />}`

Navigation:
- Direct `/studio/voice` → resolves `slug[0] = 'voice'` → maps to `voice` tab
- Browser refresh → catch-all route re-renders with correct active tab
- Back/forward → handled by `usePathname` and `slug` state

---

## 4. Audio Studio Non-Regression

`/studio/audio` is preserved:

- `TABS` still includes `{ id: 'audio', label: 'Audio Studio' }`
- `SLUG_TO_TAB` still includes `audio: 'audio'`
- `AudioStudio` lazy load unchanged
- Render map still includes `{activeTab === 'audio' && <AudioStudio ... />}`

No modifications were made to `packages/studio/src/components/AudioStudio.jsx` or any audio model/provider code.

---

## 5. Modal Health Architecture

### 5.1 Browser → SmartVideo → Modal Flow

```
Browser
  → GET /api/voice/health
    → Next.js API route (Node.js/edge runtime)
      → fetch(process.env.VOICE_MODAL_SERVICE_URL + "/health")
        → Modal-hosted FastAPI service
          → returns HealthResponse
      → map to VoiceHealth
    → Response.json(health)
```

### 5.2 SmartVideo `/api/voice/health`

- Runtime: `edge`
- Reads `VOICE_MODAL_SERVICE_URL` from server-side environment
- If `VOICE_MODAL_SERVICE_URL` is unset:
  - Returns HTTP 500 with `status: 'error'` and detail explaining misconfiguration
- If set:
  - Calls `GET {VOICE_MODAL_SERVICE_URL}/health`
  - Maps response to `VoiceHealth`
  - Returns `status: 'ok'` on 2xx, `status: 'error'` otherwise
  - Preserves upstream error detail

### 5.3 Modal Service (`services/voice-modal/app.py`)

- FastAPI application
- `GET /health` returns:
  ```json
  {
    "status": "ok",
    "service": "smartvideo-voice",
    "version": "0.1.0",
    "provider": "modal"
  }
  ```
- `POST /test` echo endpoint for connectivity verification
- Modal deployment entrypoint included:
  ```python
  import modal
  modal_app = modal.App("smartvideo-voice")
  
  @modal_app.function()
  @modal.asgi_app()
  def serve_web():
      return app
  ```
- Deploy command: `modal deploy services/voice-modal/app.py`

### 5.4 Modal Dependencies

`services/voice-modal/pyproject.toml`:
```
fastapi>=0.111.0
uvicorn[standard]>=0.30.0
modal>=0.64.0
```

No AI/ML dependencies included in Phase 1.

---

## 6. UX Direction Correction — Canonical Upstream Reference

### 6.1 Current Scaffold Status

The current `packages/studio/src/components/VoiceStudio.jsx` is a **scaffold only**. It is **not** the intended final Voice Studio user interface.

### 6.2 Canonical UX Source

The upstream VoiceStudio frontend is the **canonical product reference** for SmartVideo GO Voice Studio:
- Repository: https://github.com/debpalash/VoiceStudio
- License: AGPL-3.0
- Platform: Desktop + web-capable UI patterns

### 6.3 Integration Principle

The intended product is:
```
UPSTREAM VOICESTUDIO UX
+
SMARTVIDEO GO VISUAL DESIGN
+
SMARTVIDEO GO OUTER NAVIGATION
+
CLERK AUTHENTICATION
+
SMARTVIDEO BILLING/CREDITS
+
SMARTVIDEO STORAGE
+
MODAL CLOUD INFERENCE
```

NOT a newly invented Voice Studio.

### 6.4 What Must Be Preserved

- Launchpad structure
- Voice workspace: From Audio, By Design, Convert
- Dub workspace: upload/URL, transcript editor, timeline, waveform, speaker controls, translation, export
- Stories UX
- Audiobook UX
- Voice Gallery UX
- Transcriptions UX
- Projects UX
- Waveform/timeline interaction
- Segment editing
- Multi-language controls
- Subtitle controls
- Playback UX
- Responsive behavior
- Keyboard/accessibility behavior where web-compatible

### 6.5 Re-Skin, Do Not Redesign

Preserve upstream:
- layout
- workflow
- hierarchy
- interaction patterns
- control grouping
- editing experience
- navigation logic
- responsive behavior

Adapt to SmartVideo GO:
- colors
- typography
- logos
- product naming
- button styling
- borders
- card styling
- hover/focus styling
- SmartVideo design tokens

### 6.6 Desktop Exclusions

These upstream features depend on native/desktop APIs and are excluded:
- Tauri desktop shell
- Native updater
- Native file dialogs / filesystem reveal
- Local model installation
- Local process spawning
- System-wide dictation widget
- Local MCP server transport
- CUDA/MPS/ROCm GPU auto-detect on client
- Apple Silicon / Windows / Linux native packaging
- Docker local-only deployment

### 6.7 Web-Compatible Features

These map cleanly to web components:
- Waveform visualization and interaction
- Timeline editor
- Transcript editor with editable segments
- Segment editing
- Multi-language controls
- Subtitle controls
- Voice cards and gallery
- Project cards and batch queue
- Form-based generation workflows
- Audio playback and download

### 6.8 Backend Adaptation

Replace VoiceStudio frontend dependencies on:
- local FastAPI → SmartVideo `/api/voice/*`
- desktop/Tauri → SmartVideo GO shell
- local model management → Modal cloud inference
- local filesystem → SmartVideo/Supabase storage
- local process spawning → Modal workers

React components must NOT call Modal directly.

---

## 7. Security Verification

### 6.1 Client-side exposure

- `VOICE_MODAL_SERVICE_URL` is a server-side environment variable (no `NEXT_PUBLIC_` prefix)
- `.env.local` was updated to remove `NEXT_PUBLIC_VOICE_BACKEND_URL`
- Browser bundles do not contain Modal credentials or service URLs
- No Modal tokens, secrets, or GPU credentials found in frontend source

### 6.2 Server-side call boundary

- The browser calls `/api/voice/health` (SmartVideo route)
- SmartVideo server calls Modal using server-side env
- Modal credentials, if any, remain in server-side environment only

### 6.3 Input validation

- `/api/voice/health` accepts only `GET`
- No request body or query parameters processed
- `AbortSignal.timeout(10_000)` prevents hung requests

---

## 7. Voice Service Abstraction Status

`src/shared/voice/voiceService.ts` defines the future-facing contract:

```typescript
export interface VoiceService {
  health(): Promise<VoiceHealth>;
  generate(options: VoiceGenerateOptions): Promise<VoiceJob>;
  clone(options: VoiceCloneOptions): Promise<VoiceJob>;
  convert(options: VoiceConvertOptions): Promise<VoiceJob>;
  transcribe(options: VoiceTranscribeOptions): Promise<VoiceJob>;
  dub(options: VoiceDubOptions): Promise<VoiceJob>;
  getJob(id: string): Promise<VoiceJob>;
  cancelJob(id: string): Promise<void>;
}
```

`createVoiceService()` factory returns a stub where unsupported methods throw:
```typescript
generate: async () => { throw new Error('Voice provider not implemented'); }
```

The frontend `VoiceStudio.jsx` does **not** call any of these methods. It only:
- Renders tabs and placeholders
- Calls `/api/voice/health` for backend status

This satisfies the Phase 1 requirement that unsupported methods are not called by the current UI.

---

## 8. VoiceStudio Feature Audit Matrix

| Feature | Phase 1 Status | Notes |
|---------|---------------|-------|
| Launchpad / Overview | Pending upstream parity | Replicate upstream LaunchpadDeck with SmartVideo styling |
| Voice / From Audio | Pending upstream parity | Replicate upstream AudioMethodPanel with SmartVideo styling |
| Voice / By Design | Pending upstream parity | Replicate upstream DesignMethodPanel with SmartVideo styling |
| Voice / Convert | Pending upstream parity | Replicate upstream ConvertMethodPanel with SmartVideo styling |
| Dub | Pending upstream parity | Replicate upstream DubTab, DubLeftColumn, DubRightColumn, DubSegmentRow with SmartVideo styling |
| Stories | Pending upstream parity | Replicate upstream Stories UX with SmartVideo styling |
| Audiobook | Pending upstream parity | Replicate upstream AudiobookTab, AudiobookScriptPanel, CastPanel with SmartVideo styling |
| Voice Gallery | Pending upstream parity | Replicate upstream VoiceGallery, ArchetypeCard with SmartVideo styling |
| Transcriptions | Pending upstream parity | Replicate upstream Transcriptions history with SmartVideo styling |
| Projects | Pending upstream parity | Replicate upstream Projects/OmniDrive with SmartVideo styling |
| Model Catalogue | BACKEND ONLY | Backend model registry; UI deferred |
| Settings | KEEP | Uses SmartVideo GO shell settings |
| Waveform / Timeline | ADAPT FOR WEB | Preserve upstream waveform/timeline/transcript/segment editors for web |
| Global player | ADAPT | Existing Audio Studio player is separate |
| Voice profiles | Pending upstream parity | Replicate upstream profile UX with SmartVideo styling |
| History | BACKEND ONLY | History schema reserved for Phase 2 |
| Responsive behavior | KEEP | Uses SmartVideo GO responsive shell |

---

## 9. Desktop Exclusions

SmartVideo GO is web-only. The following upstream VoiceStudio features depend on native/desktop APIs and are explicitly excluded from this integration:

- Electron
- Tauri
- Native updater
- Native file dialogs
- Desktop bootstrap
- Local process spawning
- Native window management
- Local user GPU selection
- Customer-side model installation
- System-wide dictation widget
- Local MCP server transport
- Native filesystem reveal
- CUDA/MPS/ROCm GPU auto-detect on client
- Apple Silicon / Windows / Linux native packaging
- Docker local-only deployment

Web-adaptive VoiceStudio UI patterns retained for future implementation:
- Waveform visualization
- Transcript segment editor
- Timeline interaction
- Waveform/timeline editing
- Segment editing
- Multi-language controls
- Subtitle controls

All Voice Studio UI runs in the browser via Next.js. Inference runs server-side on Modal.

---

## 12. Existing GO Dubbing Audit

### 12.1 Discovery: `heygen-video-translate` Model Catalog Entry

The repository contains a `heygen-video-translate` model entry in the MuAPI model catalog:

- **File:** `packages/studio/src/models.js` line ~19736
- **ID:** `heygen-video-translate`
- **Name:** HeyGen Video Translate
- **Endpoint:** `heygen-video-translate`
- **Family:** `tools`
- **Provider:** `muapi`
- **Description:** "Convert any video into 175+ languages with synchronized voice translation, AI-voice cloning, and accurate lip sync."

Tool capabilities are defined in `packages/studio/src/videoToolCapabilities.js`:
- `operation: "translate"`
- `summary:` "Source language is automatic and cannot be configured in this integration. Choose a target language. Voice translation and lip sync are automatic; separate audio and subtitle settings are not available."
- Inputs: `language` (target language enum with 175+ options)

### 12.2 Current GO Dubbing Implementation Status

**No dedicated dubbing UI exists in this branch.**

The `heygen-video-translate` model is:
1. Registered in the model catalog (`models.js`)
2. Has tool capabilities defined (`videoToolCapabilities.js`)
3. Is callable through the generic `generateVideo()` path in `muapi.js` via `buildVideoToolPayload()` and `serializeVideoToolOptions()`
4. Has **no dedicated studio component, tab, or route** in the current branch

The `VoiceStudio.jsx` "Dub" tab is a placeholder only. There is no `DubbingStudio` component.

### 12.3 Possible Explanation for Product Owner's Observation

The product owner may be seeing dubbing in GO production because:

| Scenario | Likelihood | Notes |
|----------|-----------|-------|
| Production deployment runs a different SHA/branch | HIGH | Production may include commits not present on `integration/voice-studio-modal` |
| Feature dynamically loaded from model configuration | MEDIUM | The model is in the catalog and could be exposed through a generic selector |
| Feature on another branch | MEDIUM | Other branches may contain dubbing UI work |
| Embedded within Video Studio as a tool option | LOW | No Video Studio component references `heygen-video-translate` in this branch |
| Supplied by MuAPI model metadata | MEDIUM | MuAPI may surface this model dynamically |

### 12.4 Dubbing Audit Matrix

| Capability              | Current GO Branch | VoiceStudio | Future Action |
| ----------------------- | ----------------- | ----------- | ------------- |
| Upload video            | N/A               | N/A         | Needed for dubbing UI |
| Source language         | Auto (per tool capability) | N/A | Expose in UI if backend supports it |
| Target language         | Yes (175+ languages in catalog) | N/A | Wire to `heygen-video-translate` inputs |
| Translation             | Backend-only (MuAPI) | N/A | Expose through dubbing UI |
| Voice preservation      | Backend-only | N/A | Backend handles automatically |
| Speaker detection       | Backend-only | N/A | Backend handles automatically |
| Voice assignment        | Backend-only | N/A | Backend handles automatically |
| Transcript editing      | No | N/A | Future enhancement |
| Timeline/waveform       | No | N/A | Future enhancement |
| Segment preview         | No | N/A | Future enhancement |
| Segment regeneration    | No | N/A | Future enhancement |
| Multi-language          | Yes (175+ languages) | N/A | Wire to UI |
| Background preservation | Backend-only | N/A | Backend handles automatically |
| Subtitles               | No (per tool capability: "separate audio and subtitle settings are not available") | N/A | Future enhancement if backend adds support |
| Export                  | N/A               | N/A         | Needed for dubbing UI |

### 12.5 Conclusion

SmartVideo GO has a **backend-only** dubbing capability via the `heygen-video-translate` MuAPI model. The model catalog and API client support calling it, but there is **no user-facing dubbing interface** in the current branch. Any production dubbing UI would require additional commits not present on this branch.

---

## 11. Licensing Matrix

### 11.1 VoiceStudio Application Code

| Component | License | Commercial SaaS Implication |
|-----------|---------|---------------------------|
| VoiceStudio frontend/backend | AGPL (assumed from upstream Open-Generative-AI) | **REQUIRES REVIEW** |

**AGPL Implications:**
- AGPL requires that any network use of the software must make the entire application's source code available to users
- Directly copying VoiceStudio application code into SmartVideo GO could trigger AGPL obligations for the entire GO application
- **Recommended action:** Do not copy VoiceStudio application code. Instead, implement clean-room equivalents inspired by product concepts.

### 11.2 SmartVideo GO Implementation

| Component | License | Commercial SaaS Implication |
|-----------|---------|---------------------------|
| SmartVideo GO application | Proprietary | No copyleft obligations |
| Open-Generative-AI upstream | MIT | Compatible with proprietary SaaS |

### 11.3 Candidate TTS Engines (Phase 2)

**Important:** The table below classifies inference engine code/licenses separately from model/voice asset licenses. An APPROVED engine code license does NOT automatically approve the model weights or voice assets for commercial SaaS.

| Engine | Code License | Weights/Voice License | Commercial SaaS Code | Commercial SaaS Weights | Status |
|--------|-------------|----------------------|---------------------|------------------------|--------|
| Piper | MIT | Varies by voice pack | YES | Check per voice | REVIEW |
| Coqui TTS | MPL-2.0 | Varies by model | YES | Check per model | REVIEW |
| VITS | MIT | Varies by model | YES | Check per model | REVIEW |
| Bark | MIT | Non-commercial | YES | NO | RESTRICTED |
| StyleTTS 2 | MIT | Non-commercial | YES | NO | RESTRICTED |
| OpenVoice | MIT | Non-commercial | YES | NO | RESTRICTED |

**Phase 2 requirement:** Before deploying any TTS model, verify BOTH:
1. The inference engine code license permits commercial SaaS
2. The EXACT selected model weights AND voice/audio asset licenses permit commercial SaaS use

No model should be labeled APPROVED solely because its inference engine code is permissively licensed.

### 11.4 Candidate ASR Engines (Future)

| Engine | Code License | Weights License | Commercial SaaS | Status |
|--------|-------------|----------------|----------------|--------|
| Whisper | MIT | MIT | YES | APPROVED |
| DeepSpeech | MPL-2.0 | MPL-2.0 | YES | APPROVED |
| Wav2Vec2 | MIT | MIT | YES | APPROVED |

### 11.5 What May Be Safely Considered in Phase 2

- Models with MIT or Apache 2.0 code licenses AND MIT/Apache weights
- Separately licensed libraries where the license permits commercial SaaS
- Clean-room implementations of VoiceStudio concepts

### 11.6 What Remains RESTRICTED or UNCLEAR

- AGPL-covered VoiceStudio application code in proprietary SaaS
- Models with non-commercial weight licenses (Bark, StyleTTS 2, OpenVoice)
- Models where weight license is missing or unclear
- Any component requiring source disclosure of the entire SmartVideo GO application

---

## 12. UI/UX Audit

### 12.1 VoiceStudio Web Features

| Feature | SmartVideo GO Status |
|---------|---------------------|
| Launchpad overview | Implemented as Overview tab with feature cards |
| Internal tab navigation | Implemented with sidebar tabs |
| Backend status indicator | Implemented via `/api/voice/health` polling |
| Responsive layout | Uses SmartVideo GO shell responsive classes |
| Dark theme | Matches SmartVideo GO design tokens |

### 12.2 Design Token Mapping

VoiceStudio uses SmartVideo GO design system:
- `text-white/50`, `text-white/70` — secondary text opacity
- `border-white/10`, `border-white/20` — subtle borders
- `bg-card-bg`, `bg-white/5` — panel backgrounds
- `rounded-xl`, `rounded-lg` — border radii
- `px-4 py-2`, `p-6` — spacing scale
- No VoiceStudio-specific colors or typography introduced

### 12.3 Placeholder States

All non-active tabs render:
```jsx
<div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-white/50">
  Coming soon
</div>
```

This correctly signals unavailable functionality without fake controls.

---

## 13. Build and Test Results

### 13.1 Build

```
npm run build
✓ Compiled successfully
✓ Build passed
```

### 13.2 Typecheck

```
npm run typecheck
✓ No type errors
```

### 13.3 Unit Tests

```
npm run test:unit
✓ 23 test files passed
✓ 203 tests passed
```

### 13.4 Route Verification

| Route | Status |
|-------|--------|
| `/studio/voice` | Registered via StandaloneShell catch-all |
| `/studio/audio` | Preserved in StandaloneShell |
| `/studio/video` | Preserved |
| `/studio/image` | Preserved |
| `/api/voice/health` | Implemented |

---

## 14. Security Verification

| Check | Status |
|-------|--------|
| No Modal secrets in `.env.local` | ✅ PASS |
| No `NEXT_PUBLIC_MODAL_*` variables | ✅ PASS |
| Server-side `VOICE_MODAL_SERVICE_URL` only | ✅ PASS |
| Browser calls SmartVideo, not Modal directly | ✅ PASS |
| No client-side Modal SDK imports | ✅ PASS |
| Health endpoint uses `AbortSignal.timeout` | ✅ PASS |

---

## 15. Modal Deployment Readiness

### 15.1 Deploy Command

```bash
modal deploy services/voice-modal/app.py
```

### 15.2 Required Environment Variables (Modal)

| Variable | Purpose |
|----------|---------|
| `VOICE_MODAL_SERVICE_URL` | Not needed on Modal; used by SmartVideo to reach Modal |

### 15.3 SmartVideo Environment Variables (Netlify/Render)

| Variable | Purpose |
|----------|---------|
| `VOICE_MODAL_SERVICE_URL` | URL of deployed Modal voice service |

### 15.4 Cold Start Behavior

- Modal containers scale to zero by default
- First request after idle will incur cold start
- Health endpoint includes 10-second timeout
- Warm requests are fast

### 15.5 Local Health Failure Test Results

Tested against local Next.js dev server with mock Modal backend:

| Scenario | Env Config | HTTP Status | Response `status` | `detail` |
|----------|-----------|-------------|-------------------|----------|
| Missing URL | `VOICE_MODAL_SERVICE_URL` unset | 500 | `error` | `VOICE_MODAL_SERVICE_URL is not configured` |
| Reachable service | `http://127.0.0.1:29999` | 200 | `ok` | *(none)* |
| Unreachable URL | `http://127.0.0.1:29998` | 502 | `error` | `fetch failed` |
| Timeout (10s) | `http://127.0.0.1:29997` (accepts but never responds) | 502 | `error` | `The operation was aborted due to timeout` |

**Conclusion:** SmartVideo returns safe structured errors in all failure modes without exposing internal credentials.

### 15.6 Production Deployment Note

Modal CLI was installed but not authenticated during this acceptance pass. To complete production deployment:

1. Run `modal token set` with valid Modal credentials
2. Run `modal deploy services/voice-modal/app.py`
3. Record the resulting Modal service URL
4. Set `VOICE_MODAL_SERVICE_URL` in SmartVideo production environment

---

## 16. Known Limitations

1. `/api/voice/health` returns 500 if `VOICE_MODAL_SERVICE_URL` is not set
2. Modal service deployment requires Modal account credentials (not completed in this pass)
3. `VoiceStudio.jsx` backend status shows "Checking voice backend" → "ready"/"error" based on health endpoint
4. VoiceStudio tabs for Voice, Dub, Stories, Audiobook, etc. are placeholders
5. No actual TTS generation yet (Phase 2)
6. No voice cloning (Phase 3)
7. Dubbing exists only as backend model catalog entry (`heygen-video-translate`), no UI
8. No history persistence (Phase 2+)

---

## 17. Screenshots

Screenshots captured during acceptance pass:

1. `/studio/voice` desktop — `visual-assets/studio-routes/voice/desktop-voice-studio.png`
2. `/studio/voice` mobile — `visual-assets/studio-routes/voice/mobile-voice-studio.png`
3. `/studio/audio` desktop — `visual-assets/studio-routes/audio/desktop-audio-studio.png`
4. `/studio/video` desktop — `visual-assets/studio-routes/video/desktop-video-studio.png`

---

## 17. Next Steps (Phase 2)

1. Select and license-verify ONE TTS model
2. Implement Modal TTS inference in `services/voice-modal/`
3. Add `/api/voice/generate` and `/api/voice/jobs/:id`
4. Implement `VoiceService` Modal provider
5. Add Voice Studio TTS UI (Script, Voice, Language, Model, Generate)
6. Audio playback and download
7. Cost telemetry and benchmarking
8. Concurrency testing

---

## 18. Commit

This remediation is committed as:

```
fix(voice-studio): complete phase 1 web and Modal foundation
```
