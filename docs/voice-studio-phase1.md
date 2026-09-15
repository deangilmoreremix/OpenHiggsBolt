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

## 6. Security Verification

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
| Launchpad / Overview | KEEP | Rendered as Overview tab with feature cards |
| Voice / From Audio | ADAPT | Placeholder only; reserved for Phase 2+ |
| Voice / By Design | ADAPT | Placeholder only; reserved for Phase 2+ |
| Voice / Convert | ADAPT | Placeholder only; reserved for Phase 2+ |
| Dub | ADAPT | Placeholder only; existing GO Lip Sync is separate |
| Stories | ADAPT | Placeholder only |
| Audiobook | ADAPT | Placeholder only |
| Voice Gallery | ADAPT | Placeholder only |
| Transcriptions | ADAPT | Placeholder only |
| Projects / Batch Queue | ADAPT | Placeholder only |
| Model Catalogue | BACKEND ONLY | Model selection UI deferred to Phase 2 |
| Settings | KEEP | Uses SmartVideo GO shell settings |
| Waveform / Timeline | DESKTOP EXCLUDE | Not applicable to web-only Phase 1 |
| Global player | ADAPT | Existing Audio Studio player is separate |
| Voice profiles | ADAPT | Placeholder only |
| History | BACKEND ONLY | History schema reserved for Phase 2 |
| Responsive behavior | KEEP | Uses SmartVideo GO responsive shell |

---

## 9. Desktop Exclusions

SmartVideo GO is web-only. The following are explicitly excluded from this integration:

- Electron
- Tauri
- Native updater
- Native file dialogs
- Desktop bootstrap
- Local process spawning
- Native window management
- Local user GPU selection
- Customer-side model installation
- Waveform/timeline desktop-specific UI

All Voice Studio UI runs in the browser via Next.js. Inference runs server-side on Modal.

---

## 10. Existing GO Dubbing Audit

### 10.1 Current GO Dubbing Implementation

**No production dubbing implementation exists in SmartVideo GO.**

The repository contains:
- `LipSyncStudio` — existing GO feature that performs lip sync (image/video + audio → video with synchronized mouth movements). This is **not** dubbing.
- `RecastStudio` — existing GO feature for body swap / face replacement. Not dubbing.
- `VoiceStudio.jsx` placeholder tabs — "Dub" is listed as a future tab with no implementation

### 10.2 Dubbing Audit Matrix

| Feature | Current GO Location | VoiceStudio Equivalent | Keep Existing? | Future Enhancement | Phase |
|---------|-------------------|----------------------|---------------|-------------------|-------|
| Lip Sync | `packages/studio/src/components/LipSyncStudio.jsx` | N/A | YES | Add voice-driven lip sync | Phase 3+ |
| Body Swap | `packages/studio/src/components/RecastStudio.jsx` | N/A | YES | N/A | Existing |
| Audio Generation | `packages/studio/src/components/AudioStudio.jsx` | Voice / TTS | YES | Add TTS voice selection | Phase 2 |
| Dubbing | None | Dub tab placeholder | N/A | Full dubbing pipeline | Future phase |
| Translation | None | N/A | N/A | ASR + translate + TTS | Future phase |

### 10.3 Conclusion

SmartVideo GO does not currently have a dubbing feature. The VoiceStudio "Dub" tab is a placeholder. Any dubbing implementation would be new work in a future phase and must not be conflated with the existing Lip Sync or Audio Studio features.

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

| Engine | Code License | Weights License | Commercial SaaS | Status |
|--------|-------------|----------------|----------------|--------|
| Coqui TTS | MPL-2.0 | Varies by model | Check per model | REVIEW |
| Piper | MIT | MIT / Apache | YES | APPROVED |
| Bark | MIT | Non-commercial | NO | RESTRICTED |
| VITS | MIT | Varies | Check per model | REVIEW |
| StyleTTS 2 | MIT | Non-commercial | NO | RESTRICTED |
| OpenVoice | MIT | Non-commercial | NO | RESTRICTED |

**Note:** This matrix is preliminary. Phase 2 must verify BOTH code license AND model-weight license before deploying any model.

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

---

## 16. Known Limitations

1. `/api/voice/health` returns 500 if `VOICE_MODAL_SERVICE_URL` is not set
2. Modal service is not deployed; deployment requires Modal account and credentials
3. `VoiceStudio.jsx` backend status shows "Checking voice backend" → "ready"/"error" based on health endpoint
4. VoiceStudio tabs for Voice, Dub, Stories, Audiobook, etc. are placeholders
5. No actual TTS generation yet (Phase 2)
6. No voice cloning (Phase 3)
7. No dubbing (future phase)
8. No history persistence (Phase 2+)

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
