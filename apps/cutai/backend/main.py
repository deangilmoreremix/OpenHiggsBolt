from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import get_settings
from models.database import init_db
from routers import projects, scripts, scenes, storyboard

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
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

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(scripts.router, prefix="/api/scripts", tags=["scripts"])
app.include_router(scenes.router, prefix="/api/scenes", tags=["scenes"])
app.include_router(storyboard.router, prefix="/api/storyboard", tags=["storyboard"])


@app.get("/health")
async def health():
    return {"status": "ok", "llm": "openai-responses-api", "image": "gpt-image-2"}
