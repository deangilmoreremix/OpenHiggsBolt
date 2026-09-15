# Voice Studio Backend Adaptation Plan

**Objective:** Replace VoiceStudio's local FastAPI/Tauri/desktop backend with SmartVideo GO server-side API routes and Modal cloud inference.

---

## Architecture Transition

### Current Upstream Architecture
```
Tauri v2 desktop shell (Rust)
        │ IPC
React + Vite UI
        │ HTTP · SSE · WebSocket on localhost:3900
FastAPI backend
        ├── TTS / ASR engine registries
        ├── dubbing / audio / long-form pipelines
        ├── OpenAI-compatible API and MCP server
        └── SQLite + Alembic → omnivoice_data/
```

### Target SmartVideo GO Architecture
```
SmartVideo GO StandaloneShell
        │
        ├── /studio/voice → Voice Studio UI (Next.js)
        │
        └── /api/voice/*
                │
                ├── SmartVideo Next.js API routes
                │       │
                │       ├── Clerk authentication
                │       ├── Input validation
                │       ├── Rate limiting
                │       └── Modal credential injection
                │
                └── Modal cloud backend
                        │
                        ├── FastAPI / ASGI service
                        ├── TTS / ASR / Dub engines
                        ├── Job queue
                        └── Storage (Modal volumes / SmartVideo storage)
```

---

## API Boundary Mapping

| Upstream Endpoint | SmartVideo Endpoint | Purpose |
|-------------------|---------------------|---------|
| `POST /v1/audio/speech` | `POST /api/voice/generate` | TTS generation |
| `POST /v1/audio/transcriptions` | `POST /api/voice/transcribe` | ASR transcription |
| `GET /v1/audio/voices` | `GET /api/voice/voices` | List available voices |
| `GET /.well-known/voicestudio-speech` | `GET /api/voice/health` | Service discovery / health |
| `GET /health` (FastAPI) | `GET /api/voice/health` | Backend health check |
| WebSocket `/v1/audio/transcriptions/stream` | Phase 2+ | Live transcription streaming |
| `POST /api/v1/heygen-video-translate` | `POST /api/voice/dub` | Video dubbing |
| MCP `/mcp` | Phase 2+ | Agent tool integration |

---

## Service Abstraction

```typescript
// src/shared/voice/voiceService.ts
export interface VoiceService {
  health(): Promise<VoiceHealth>;
  generate(options: VoiceGenerateOptions): Promise<VoiceJob>;
  transcribe(options: VoiceTranscribeOptions): Promise<VoiceJob>;
  dub(options: VoiceDubOptions): Promise<VoiceJob>;
  getJob(id: string): Promise<VoiceJob>;
  cancelJob(id: string): Promise<void>;
  listVoices(): Promise<Voice[]>;
}
```

---

## Modal Service Design

### Phase 1: Health/Test
- FastAPI app with `/health` and `/test`
- Deployed on Modal with ASGI adapter
- Minimal dependencies: `fastapi`, `uvicorn`, `modal`

### Phase 2: TTS Inference
- Add TTS engine (e.g., Piper, CosyVoice, or other commercially permitted engine)
- Model weights cached on Modal volume
- GPU selection: T4/L4 for inference
- Job queue for async generations

### Phase 3+: Additional Engines
- ASR engine
- Voice cloning
- Dubbing pipeline
- Stories/Audiobook generation

---

## Data Flow

### TTS Generation
```
User → /studio/voice → enters text → selects voice → clicks Generate
  → SmartVideo /api/voice/generate
    → Clerk auth check
    → Input validation
    → VoiceService.generate()
      → Modal backend
        → TTS inference
        → Audio output
      → Job ID returned
    → Poll /api/voice/jobs/:id
      → Get audio URL
    → Display audio player
  → User can preview/download
```

### Dubbing
```
User → /studio/voice → Dub tab → uploads video → selects languages
  → SmartVideo /api/voice/dub
    → Clerk auth check
    → Upload video to SmartVideo storage
    → Modal backend
      → ASR transcription
      → Translation
      → TTS synthesis
      → Lip sync (Phase 3+)
      → Export video
    → Job ID returned
    → Poll /api/voice/jobs/:id
      → Get video URL
    → Display video player
  → User can preview/download
```

---

## Security

- All Modal credentials remain server-side
- Browser calls SmartVideo API only
- Clerk authentication on all `/api/voice/*` routes
- Input validation and rate limiting
- No `NEXT_PUBLIC_` Modal secrets
- AbortSignal timeout on all backend calls

---

## Storage Strategy

| Data Type | Storage Location | Retention |
|-----------|-----------------|-----------|
| Generated audio | Modal volumes / SmartVideo storage | Job lifetime + retention period |
| User voice profiles | SmartVideo/Supabase | Persistent until deleted |
| Projects | SmartVideo/Supabase | Persistent until deleted |
| Transcripts | SmartVideo/Supabase | Persistent until deleted |
| Model cache | Modal volumes | Persistent across containers |

---

## Cost Telemetry

- Record request timestamp
- Cold/warm container status
- Model load time
- Inference time
- Total server execution time
- Generated audio duration
- Input character count
- GPU type
- CPU/memory configuration

Use for internal benchmarking; do not expose all to customer.

---

## Implementation Phases

### Phase 1: Foundation (Current)
- ✅ `/studio/voice` route registered
- ✅ Voice service abstraction created
- ✅ `/api/voice/health` implemented
- ✅ Modal health service scaffolded
- ✅ Build passing
- ⏳ TTS generation (Phase 2)

### Phase 2: TTS Generation
- Select commercially permitted TTS engine
- Implement Modal TTS inference
- Add `/api/voice/generate` and `/api/voice/jobs/:id`
- Add Voice Studio TTS UI
- Audio playback and download
- Cost telemetry

### Phase 3: Voice Cloning
- Reference audio upload
- Voice clone/profile creation
- Saved voice library
- Cloned voice selection in TTS

### Phase 4: Dubbing
- Video upload/URL import
- Translation workflow
- Lip sync integration
- Export

### Phase 5: Advanced Features
- Stories
- Audiobook
- Batch queue
- Transcriptions
- Projects
