# CutAI Design Specification

**Date:** 2026-06-24  
**Project:** CutAI — AI Film Director & Storyboard Engine  
**Location:** `apps/cutai/` inside OpenHiggsBolt monorepo

## Overview

CutAI is an AI-powered film director and storyboard engine. Users create projects, enter a genre and premise (or paste a screenplay), and receive a complete storyboard: scenes, shots, mood analysis, soundtrack suggestions, and AI-generated storyboard frames.

## Architecture

- **Backend:** FastAPI (Python) with async SQLAlchemy + aiosqlite. OpenAI Responses API (`gpt-4o`) drives script/shot/scene analysis; OpenAI Image API (`gpt-image-2`) generates storyboard frames.
- **Frontend:** React 18 + Vite. State managed with Zustand. UI uses Tailwind CSS with a dark film-editor aesthetic. Interactivity via dnd-kit, React Flow, Recharts, and Framer Motion.
- **Storage:** SQLite (`sqlite+aiosqlite:///./cutai.db`) stores projects, scripts, scenes, and shots. Generated frames are saved as PNGs in `generated/frames/` and served as static files.

## Backend Modules

| File | Responsibility |
|------|----------------|
| `config.py` | Pydantic-settings with `.env` loading and CORS list helper |
| `models/database.py` | Async engine, session maker, `init_db()` |
| `models/db_models.py` | ORM models: Project, Script, Scene, Shot |
| `models/schemas.py` | Pydantic v2 request/response/intermediate schemas |
| `services/llm_client.py` | OpenAI Responses API wrapper + JSON cleaner |
| `services/script_parser.py` | Generate/parse scripts into `LLMScript` |
| `services/image_generator.py` | gpt-image-2 frame generation with concurrency |
| `routers/projects.py` | Project CRUD |
| `routers/scripts.py` | Script CRUD |
| `routers/scenes.py` | Scene CRUD, regenerate, reorder |
| `routers/storyboard.py` | Generation pipeline (SSE), export JSON/PDF |
| `main.py` | FastAPI app, CORS, static mount, health endpoint |

## Frontend Modules

| File | Responsibility |
|------|----------------|
| `App.jsx` | Router: `/` and `/project/:id` |
| `services/api.js` | Axios wrapper + SSE helpers |
| `stores/useProjectStore.js` | Project list + current project |
| `stores/useStoryboardStore.js` | Script, scenes, selection, generation progress |
| `stores/useUIStore.js` | Tabs, modals, panel state |
| `components/layout/*` | Header, Sidebar, MainCanvas |
| `components/script/*` | ScriptGenerator, ScriptEditor |
| `components/storyboard/*` | StoryboardCanvas, SceneCard, ShotPanel, FramePreview |
| `components/timeline/*` | VisualTimeline, TimelineNode (React Flow) |
| `components/analysis/*` | MoodGraph, SoundtrackPanel, CameraAngleTag |
| `components/shared/*` | LoadingSpinner, Badge, Modal |

## Design System

- Background: `#0a0a0f`
- Surface: `#12121a`
- Border: `#1e1e2e`
- Primary accent: `#f59e0b` (amber gold)
- Secondary accent: `#8b5cf6` (violet)
- Text primary: `#f1f5f9`
- Text secondary: `#64748b`
- Mood colors: tension `#ef4444`, emotion `#3b82f6`, energy `#f59e0b`, darkness `#8b5cf6`

## Constraints

- No GPU code (no torch, diffusers, CUDA, ollama, groq, replicate).
- OpenAI-only AI stack.
- Backend/frontend separation enforced; no cross-directory imports.
- Every feature implemented; no stubs or TODOs.
- Real images only; no placeholders.

## References

- Target monorepo: `https://github.com/deangilmoreremix/OpenHiggsBolt`
- Reference implementation (study only): `https://github.com/Swapnil-bo/CutAI`
- OpenAI Responses API docs and Image API docs per user prompt.
