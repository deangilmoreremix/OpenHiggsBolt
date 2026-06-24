# CutAI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build CutAI, an AI Film Director & Storyboard Engine, as a fully functional sub-application inside the OpenHiggsBolt monorepo at `apps/cutai/`.

**Architecture:** FastAPI backend (`apps/cutai/backend/`) using OpenAI Responses API (gpt-4o) for LLM work and OpenAI Image API (gpt-image-2) for storyboard frames, with SQLAlchemy 2.x async SQLite storage. React 18 + Vite frontend (`apps/cutai/frontend/`) with Zustand state, dnd-kit drag-and-drop, React Flow timeline, Recharts mood graph, and Framer Motion animations.

**Tech Stack:** Python 3.9+ (environment constraint; spec requests 3.11+), FastAPI, Uvicorn, OpenAI, SQLAlchemy 2.x async + aiosqlite, Pydantic v2, fpdf2; React 18, Vite, Tailwind CSS, Zustand, @dnd-kit/core, @dnd-kit/sortable, reactflow, recharts, framer-motion, lucide-react, axios.

## Global Constraints

- Backend code stays in `apps/cutai/backend/`. Frontend code stays in `apps/cutai/frontend/`. No cross-directory imports.
- No GPU code: do not install or import torch, diffusers, CUDA, ollama, or local model libraries.
- AI stack is OpenAI-only: Responses API (`gpt-4o`) for LLM, Image API (`gpt-image-2`, `b64_json`) for frames.
- Database connection string: `sqlite+aiosqlite:///./cutai.db`
- No placeholder images; every storyboard frame must be a real image from the OpenAI Image API.
- Every feature must be implemented; no `// TODO` or stubs.
- Test before moving on; commit after every phase with format `CutAI Phase N: <description>`.

---

### Task 1: Phase 1 — Monorepo wiring and server scaffolding

**Files:**
- Create: `apps/cutai/backend/requirements.txt`
- Create: `apps/cutai/backend/.env.example`
- Create: `apps/cutai/backend/main.py` (minimal FastAPI skeleton)
- Create: `apps/cutai/backend/config.py`
- Create: `apps/cutai/frontend/package.json`
- Create: `apps/cutai/frontend/vite.config.js`
- Create: `apps/cutai/frontend/tailwind.config.js`
- Create: `apps/cutai/frontend/index.html`
- Modify: `package.json` (root)

**Interfaces:**
- Root `package.json` workspaces include `"apps/cutai/frontend"` and scripts `cutai:frontend`, `cutai:backend`, `cutai:dev`.
- Backend health endpoint `GET /health` returns `{"status":"ok","llm":"openai-responses-api","image":"gpt-image-2"}`.

- [ ] **Step 1: Register workspace and scripts in root `package.json`**

Add `"apps/cutai/frontend"` to `workspaces` and add these scripts:
```json
"cutai:frontend": "npm run dev -w @openhiggsbolt/cutai",
"cutai:backend": "cd apps/cutai/backend && source venv/bin/activate && uvicorn main:app --reload --port 8000",
"cutai:dev": "concurrently \"npm run cutai:backend\" \"npm run cutai:frontend\""
```

- [ ] **Step 2: Install `concurrently` in root devDependencies**

```bash
npm install -D concurrently
```

- [ ] **Step 3: Create backend `requirements.txt`**

```txt
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
openai>=1.60.0
sqlalchemy[asyncio]>=2.0.0
aiosqlite>=0.20.0
pydantic>=2.9.0
pydantic-settings>=2.6.0
fpdf2>=2.8.0
python-multipart>=0.0.12
```

- [ ] **Step 4: Create Python virtual environment and install deps**

```bash
cd apps/cutai/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

- [ ] **Step 5: Create frontend `package.json`**

```json
{
  "name": "@openhiggsbolt/cutai",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 5173",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "zustand": "^5.0.0",
    "axios": "^1.7.9",
    "@dnd-kit/core": "^6.3.0",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "reactflow": "^11.11.0",
    "recharts": "^2.15.0",
    "framer-motion": "^11.18.0",
    "lucide-react": "^0.469.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.17",
    "vite": "^5.4.11"
  }
}
```

- [ ] **Step 6: Create `vite.config.js`, `tailwind.config.js`, `index.html`, minimal `main.jsx`, `App.jsx`**

`vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/generated': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
});
```

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cutai: {
          bg: '#0a0a0f',
          surface: '#12121a',
          border: '#1e1e2e',
          accent: '#f59e0b',
          violet: '#8b5cf6',
          text: '#f1f5f9',
          muted: '#64748b',
        },
      },
    },
  },
  plugins: [],
};
```

`index.html`:
```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CutAI — AI Film Director</title>
  </head>
  <body class="bg-cutai-bg text-cutai-text">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create minimal `main.py` with health endpoint and CORS stub**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import get_settings

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="CutAI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/generated", StaticFiles(directory="generated"), name="generated")

@app.get("/health")
async def health():
    return {"status": "ok", "llm": "openai-responses-api", "image": "gpt-image-2"}
```

- [ ] **Step 8: Create `config.py`**

```python
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str
    openai_llm_model: str = "gpt-4o"
    openai_image_model: str = "gpt-image-2"
    image_size: str = "1024x1024"
    image_quality: str = "medium"
    database_url: str = "sqlite+aiosqlite:///./cutai.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    llm_temperature: float = 0.7
    max_scenes: int = 8

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 9: Create `.env.example`**

```bash
OPENAI_API_KEY=sk-...
OPENAI_LLM_MODEL=gpt-4o
OPENAI_IMAGE_MODEL=gpt-image-2
IMAGE_SIZE=1024x1024
IMAGE_QUALITY=medium
DATABASE_URL=sqlite+aiosqlite:///./cutai.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LLM_TEMPERATURE=0.7
MAX_SCENES=8
```

- [ ] **Step 10: Install root deps and verify health endpoint**

```bash
cd /Users/shasheemoore/Downloads/oldhiggsfieldbolt/OpenHiggsBolt
npm install
```

Start backend:
```bash
cd apps/cutai/backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
```

Verify:
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","llm":"openai-responses-api","image":"gpt-image-2"}
```

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json apps/cutai
git commit -m "CutAI Phase 1: monorepo wiring + server scaffolding"
```

---

### Task 2: Phase 2 — Database models and Pydantic schemas

**Files:**
- Create: `apps/cutai/backend/models/__init__.py`
- Create: `apps/cutai/backend/models/database.py`
- Create: `apps/cutai/backend/models/db_models.py`
- Create: `apps/cutai/backend/models/schemas.py`
- Modify: `apps/cutai/backend/main.py`

**Interfaces:**
- `init_db()` creates tables `projects`, `scripts`, `scenes`, `shots`.
- Pydantic schemas define `Shot`, `MoodScore`, `SoundtrackVibe`, `Scene`, `Script`, `LLMShot`, `LLMScene`, `LLMScript`, `ProjectCreate/Update/Response`, `ScriptCreate/Response`, `SceneUpdate/Response`, `ShotResponse`, `GenerateFromPremiseRequest`, `GenerateFromScriptRequest`.

- [ ] **Step 1: Implement `models/database.py`**

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

engine = create_async_engine("sqlite+aiosqlite:///./cutai.db", echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 2: Implement `models/db_models.py`**

Tables:
- `projects`: id (PK), title, genre, created_at, updated_at
- `scripts`: id (PK), project_id (FK), title, genre, logline, total_duration_seconds, raw_text, created_at, updated_at
- `scenes`: id (PK), script_id (FK), scene_number, title, location, time_of_day, description, characters (JSON), mood_tension, mood_emotion, mood_energy, mood_darkness, mood_overall, soundtrack (JSON), frame_image_url, created_at, updated_at
- `shots`: id (PK), scene_id (FK), shot_number, shot_type, camera_angle, camera_movement, description, dialogue, duration_seconds, image_prompt, created_at, updated_at

- [ ] **Step 3: Implement `models/schemas.py`**

Define all Pydantic v2 models with `from_attributes = True` on response configs.

- [ ] **Step 4: Wire `init_db()` into FastAPI lifespan**

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
```

- [ ] **Step 5: Verify tables created**

```bash
cd apps/cutai/backend
source venv/bin/activate
python3 - <<'PY'
import asyncio
from models.database import init_db, engine
asyncio.run(init_db())
PY
sqlite3 cutai.db ".tables"
# Expected: projects  scenes  scripts  shots
```

- [ ] **Step 6: Commit**

```bash
git add apps/cutai/backend/models apps/cutai/backend/main.py
git commit -m "CutAI Phase 2: database models and Pydantic schemas"
```

---

### Task 3: Phase 3 — LLM client and script generation

**Files:**
- Create: `apps/cutai/backend/services/__init__.py`
- Create: `apps/cutai/backend/services/llm_client.py`
- Create: `apps/cutai/backend/services/script_parser.py`

**Interfaces:**
- `generate_script_from_premise(genre, premise, num_scenes) -> LLMScript`
- `parse_script_from_text(raw_script) -> LLMScript`
- LLM client wraps OpenAI Responses API with JSON cleaning and retries.

- [ ] **Step 1: Implement `services/llm_client.py`**

Wrap OpenAI Responses API. Extract text from `response.output`. `clean_json_response()` strips markdown fences, extracts first `{...}` or `[...]`, fixes trailing commas. Retry up to 3 times on JSON parse failure.

- [ ] **Step 2: Implement `services/script_parser.py`**

System prompt instructs LLM to return ONLY valid JSON with the required `LLMScript` shape. Image prompts must be rich cinematic descriptions.

- [ ] **Step 3: Test generation**

```bash
cd apps/cutai/backend
source venv/bin/activate
python3 - <<'PY'
import asyncio
from services.script_parser import generate_script_from_premise
result = asyncio.run(generate_script_from_premise("noir thriller", "A detective finds a body in a jazz club", 3))
print(result.title, result.genre, len(result.scenes))
for s in result.scenes:
    print(s.scene_number, s.title, len(s.shots), s.mood.overall_mood)
PY
```

- [ ] **Step 4: Commit**

```bash
git add apps/cutai/backend/services
git commit -m "CutAI Phase 3: LLM client + script generation"
```

---

### Task 4: Phase 4 — Image generator

**Files:**
- Create: `apps/cutai/backend/services/image_generator.py`
- Create: `apps/cutai/backend/generated/frames/.gitkeep`

**Interfaces:**
- `generate_frame(image_prompt) -> str | None` saves PNG to `generated/frames/scene_{scene_id}_shot_{shot_number}.png` and returns filename.
- `generate_frames_for_scene(scene_id, shots)` uses asyncio semaphore (max 2 concurrent) to batch-generate frames.

- [ ] **Step 1: Implement `services/image_generator.py`**

Use `client.images.generate(model="gpt-image-2", prompt=..., size="1024x1024", quality="medium", n=1, response_format="b64_json")`. Decode `b64_json`, save to `generated/frames/`. Handle `openai.BadRequestError` with `code == "moderation_blocked"` by logging and returning `None`.

- [ ] **Step 2: Test frame generation**

```bash
cd apps/cutai/backend
source venv/bin/activate
python3 - <<'PY'
import asyncio
from services.image_generator import generate_frame
filename = asyncio.run(generate_frame("Cinematic wide shot, dimly lit jazz bar, warm amber lighting, 1940s noir atmosphere, film grain, low camera angle"))
print(filename)
PY
ls generated/frames/
curl http://localhost:8000/generated/frames/<filename> --output /tmp/test.png
file /tmp/test.png
```

- [ ] **Step 3: Commit**

```bash
git add apps/cutai/backend/services/image_generator.py apps/cutai/backend/generated
git commit -m "CutAI Phase 4: gpt-image-2 frame generation"
```

---

### Task 5: Phase 5 — All API routes

**Files:**
- Create: `apps/cutai/backend/routers/__init__.py`
- Create: `apps/cutai/backend/routers/projects.py`
- Create: `apps/cutai/backend/routers/scripts.py`
- Create: `apps/cutai/backend/routers/scenes.py`
- Create: `apps/cutai/backend/routers/storyboard.py`
- Modify: `apps/cutai/backend/main.py`

**Interfaces:**
- `POST /api/projects`, `GET /api/projects`, `GET /api/projects/{id}`, `DELETE /api/projects/{id}`
- `POST /api/scripts`, `GET /api/scripts/{id}`
- `GET /api/scenes/{scene_id}`, `PATCH /api/scenes/{scene_id}`, `POST /api/scenes/{scene_id}/regenerate`, `POST /api/scenes/{scene_id}/regenerate-frame`, `PUT /api/scenes/reorder`
- `POST /api/storyboard/generate/premise` (SSE), `POST /api/storyboard/generate/script` (SSE), `GET /api/storyboard/{script_id}`, `GET /api/storyboard/{script_id}/export/json`, `GET /api/storyboard/{script_id}/export/pdf`

- [ ] **Step 1: Implement `routers/projects.py`**

- [ ] **Step 2: Implement `routers/scripts.py`**

- [ ] **Step 3: Implement `routers/scenes.py`**

- [ ] **Step 4: Implement `routers/storyboard.py`**

SSE event format: `event: {type}\ndata: {json}\n\n`. Emit `progress`, `done`, `error` events. Generation pipeline: parse/generate script → create DB records → for each scene generate frames → emit progress events → emit done with `script_id`.

- [ ] **Step 5: Wire routers in `main.py`**

```python
from routers import projects, scripts, scenes, storyboard
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(scripts.router, prefix="/api/scripts", tags=["scripts"])
app.include_router(scenes.router, prefix="/api/scenes", tags=["scenes"])
app.include_router(storyboard.router, prefix="/api/storyboard", tags=["storyboard"])
```

- [ ] **Step 6: Manually test endpoints**

Test project creation, storyboard generation (SSE), get storyboard, JSON export, PDF export, scene regenerate, scene reorder.

- [ ] **Step 7: Commit**

```bash
git add apps/cutai/backend/routers apps/cutai/backend/main.py
git commit -m "CutAI Phase 5: all API routes"
```

---

### Task 6: Phase 6 — Frontend core (layout + routing + stores)

**Files:**
- Create: `apps/cutai/frontend/src/main.jsx`
- Create: `apps/cutai/frontend/src/App.jsx`
- Create: `apps/cutai/frontend/src/services/api.js`
- Create: `apps/cutai/frontend/src/stores/useProjectStore.js`
- Create: `apps/cutai/frontend/src/stores/useStoryboardStore.js`
- Create: `apps/cutai/frontend/src/stores/useUIStore.js`
- Create: `apps/cutai/frontend/src/components/layout/Header.jsx`
- Create: `apps/cutai/frontend/src/components/layout/Sidebar.jsx`
- Create: `apps/cutai/frontend/src/components/layout/MainCanvas.jsx`
- Create: `apps/cutai/frontend/src/index.css`

**Interfaces:**
- React Router routes `/` and `/project/:id`.
- Zustand stores expose actions documented in the spec.
- `api.js` exports all named API functions.

- [ ] **Step 1: Set up React Router and base App**

- [ ] **Step 2: Implement three Zustand stores**

- [ ] **Step 3: Implement `services/api.js`**

Axios wrapper plus SSE helpers using `EventSource`/`fetch` + `ReadableStream`.

- [ ] **Step 4: Implement layout components with dark film-editor styling**

- [ ] **Step 5: Verify app renders without console errors**

- [ ] **Step 6: Commit**

```bash
git add apps/cutai/frontend/src
git commit -m "CutAI Phase 6: frontend layout + routing + Zustand stores"
```

---

### Task 7: Phase 7 — Home page & project management

**Files:**
- Create: `apps/cutai/frontend/src/pages/HomePage.jsx`
- Create: `apps/cutai/frontend/src/components/shared/Modal.jsx`
- Create: `apps/cutai/frontend/src/components/shared/Badge.jsx`
- Create: `apps/cutai/frontend/src/components/shared/LoadingSpinner.jsx`

**Interfaces:**
- Home page lists projects, supports create/delete, navigates to `/project/:id`.

- [ ] **Step 1: Implement project gallery grid with project cards**

- [ ] **Step 2: Implement New Project modal**

- [ ] **Step 3: Implement delete with confirmation**

- [ ] **Step 4: Verify create, list, delete flows**

- [ ] **Step 5: Commit**

```bash
git add apps/cutai/frontend/src/pages apps/cutai/frontend/src/components/shared
git commit -m "CutAI Phase 7: home page + project management"
```

---

### Task 8: Phase 8 — Script input & generation UI

**Files:**
- Create: `apps/cutai/frontend/src/components/script/ScriptGenerator.jsx`
- Create: `apps/cutai/frontend/src/components/script/ScriptEditor.jsx`

**Interfaces:**
- Form generates from premise via SSE and wires progress to `useStoryboardStore`.
- Editor parses raw screenplay text via SSE.

- [ ] **Step 1: Implement `ScriptGenerator.jsx` with SSE progress bar**

- [ ] **Step 2: Implement `ScriptEditor.jsx`**

- [ ] **Step 3: Wire SSE events to store and populate storyboard on `done`**

- [ ] **Step 4: Verify end-to-end generation from premise**

- [ ] **Step 5: Commit**

```bash
git add apps/cutai/frontend/src/components/script
git commit -m "CutAI Phase 8: script generator + SSE progress"
```

---

### Task 9: Phase 9 — Storyboard canvas (drag & drop)

**Files:**
- Create: `apps/cutai/frontend/src/components/storyboard/StoryboardCanvas.jsx`
- Create: `apps/cutai/frontend/src/components/storyboard/SceneCard.jsx`

**Interfaces:**
- `StoryboardCanvas` uses dnd-kit, renders `SceneCard` grid, persists reorder via API.
- `SceneCard` shows required fields and hover animations.

- [ ] **Step 1: Implement dnd-kit sortable canvas**

- [ ] **Step 2: Implement `SceneCard` with all required fields and motion**

- [ ] **Step 3: Verify drag-and-drop and persistence**

- [ ] **Step 4: Commit**

```bash
git add apps/cutai/frontend/src/components/storyboard
git commit -m "CutAI Phase 9: drag-and-drop storyboard canvas"
```

---

### Task 10: Phase 10 — Shot panel & frame preview

**Files:**
- Create: `apps/cutai/frontend/src/components/storyboard/ShotPanel.jsx`
- Create: `apps/cutai/frontend/src/components/storyboard/FramePreview.jsx`
- Create: `apps/cutai/frontend/src/components/analysis/CameraAngleTag.jsx`

**Interfaces:**
- `ShotPanel` slides in from right, shows shots and regenerate buttons.
- `FramePreview` handles 404s gracefully.

- [ ] **Step 1: Implement `ShotPanel.jsx` with Framer Motion**

- [ ] **Step 2: Implement `FramePreview.jsx` with loading/placeholder states**

- [ ] **Step 3: Implement `CameraAngleTag.jsx`**

- [ ] **Step 4: Wire regenerate buttons to API**

- [ ] **Step 5: Verify panel opens with shots and frame**

- [ ] **Step 6: Commit**

```bash
git add apps/cutai/frontend/src/components/storyboard apps/cutai/frontend/src/components/analysis/CameraAngleTag.jsx
git commit -m "CutAI Phase 10: shot panel + frame preview"
```

---

### Task 11: Phase 11 — Visual timeline (React Flow)

**Files:**
- Create: `apps/cutai/frontend/src/components/timeline/VisualTimeline.jsx`
- Create: `apps/cutai/frontend/src/components/timeline/TimelineNode.jsx`

**Interfaces:**
- Nodes derived from Zustand scenes (one-way). Node click selects scene. Mood-colored backgrounds.

- [ ] **Step 1: Implement `VisualTimeline.jsx` deriving nodes from store**

- [ ] **Step 2: Implement `TimelineNode.jsx`**

- [ ] **Step 3: Verify timeline renders, clickable, no infinite re-renders**

- [ ] **Step 4: Commit**

```bash
git add apps/cutai/frontend/src/components/timeline
git commit -m "CutAI Phase 11: React Flow visual timeline"
```

---

### Task 12: Phase 12 — Mood graph & analysis panel

**Files:**
- Create: `apps/cutai/frontend/src/components/analysis/MoodGraph.jsx`
- Create: `apps/cutai/frontend/src/components/analysis/SoundtrackPanel.jsx`

**Interfaces:**
- `MoodGraph` renders four Recharts lines.
- `SoundtrackPanel` shows genre/tempo/instruments/reference track.

- [ ] **Step 1: Implement `MoodGraph.jsx`**

- [ ] **Step 2: Implement `SoundtrackPanel.jsx`**

- [ ] **Step 3: Verify graph and panel with real data**

- [ ] **Step 4: Commit**

```bash
git add apps/cutai/frontend/src/components/analysis
git commit -m "CutAI Phase 12: mood graph + analysis panel"
```

---

### Task 13: Phase 13 — Inline editing & regeneration

**Files:**
- Modify: `apps/cutai/frontend/src/components/storyboard/SceneCard.jsx`
- Modify: `apps/cutai/frontend/src/components/storyboard/ShotPanel.jsx`
- Modify: `apps/cutai/frontend/src/stores/useStoryboardStore.js`

**Interfaces:**
- Inline title edit on `SceneCard`. Regenerate scene/frame update store.

- [ ] **Step 1: Add inline title editing to `SceneCard`**

- [ ] **Step 2: Wire regenerate scene/frame buttons**

- [ ] **Step 3: Verify edits and regenerations persist and display**

- [ ] **Step 4: Commit**

```bash
git add apps/cutai/frontend/src
git commit -m "CutAI Phase 13: inline editing + regeneration"
```

---

### Task 14: Phase 14 — Export & final polish

**Files:**
- Modify: `apps/cutai/frontend/src/components/layout/Header.jsx`
- Modify: `apps/cutai/frontend/src/components/storyboard/FramePreview.jsx`
- Modify: `apps/cutai/frontend/src/components/storyboard/StoryboardCanvas.jsx`

**Interfaces:**
- Header export dropdown triggers JSON/PDF downloads.
- FramePreview has loading skeleton. StoryboardCanvas has error boundary.

- [ ] **Step 1: Add export dropdown to Header**

- [ ] **Step 2: Add FramePreview shimmer skeleton**

- [ ] **Step 3: Add error boundary around StoryboardCanvas**

- [ ] **Step 4: Test full flow from project creation to PDF export**

- [ ] **Step 5: Final responsive and polish pass**

- [ ] **Step 6: Commit**

```bash
git add apps/cutai/frontend/src
git commit -m "CutAI Phase 14: export + final polish"
```

---

## Verification Checklist

- [ ] `GET http://localhost:8000/health` returns `{"status":"ok"}`
- [ ] Can create a new project from the home page
- [ ] Can generate a storyboard from a genre + premise
- [ ] SSE progress events display correctly in the frontend during generation
- [ ] Scene cards render with real frame images
- [ ] Drag-and-drop reordering persists after page reload
- [ ] Shot panel opens with all shot details and camera tags
- [ ] React Flow timeline renders and clicking a node selects that scene
- [ ] Mood graph renders 4 colored lines with real data
- [ ] Soundtrack panel shows genre, tempo, instruments, reference track
- [ ] Regenerate buttons work
- [ ] JSON and PDF exports download valid files
- [ ] No console errors/warnings
- [ ] No Python tracebacks during normal operation
- [ ] App is responsive on mobile viewport
