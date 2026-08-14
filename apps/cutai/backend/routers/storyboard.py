from __future__ import annotations

import json
import io
import logging
from datetime import datetime
from typing import AsyncGenerator, NotRequired, Required, TypedDict
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fpdf import FPDF
from models.database import get_db
from models.db_models import Project, Script, Scene as DBScene, Shot as DBShot
from models.schemas import (
    GenerateFromPremiseRequest,
    GenerateFromScriptRequest,
    SceneResponse,
)
from services.llm_client import call_llm
from services.script_parser import generate_script_from_premise, parse_script_from_text
from services.image_generator import generate_frames_for_scene
from models.schemas import Shot as ShotSchema

logger = logging.getLogger(__name__)
router = APIRouter()


class _ProgressEvent(TypedDict):
    stage: str
    message: str
    current: NotRequired[int]
    total: NotRequired[int]


class _DoneEvent(TypedDict):
    script_id: int
    message: str


class _ErrorEvent(TypedDict):
    message: str


def _sse_event(event_type: str, data: _ProgressEvent | _DoneEvent | _ErrorEvent) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data, default=str)}\n\n"


async def _run_pipeline_premise(
    project_id: int | None,
    genre: str,
    premise: str,
    num_scenes: int,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    try:
        yield _sse_event("progress", {"stage": "llm", "message": "Writing screenplay..."})

        llm_script = await generate_script_from_premise(genre, premise, num_scenes)

        from models.schemas import LLMScript
        assert isinstance(llm_script, LLMScript)

        # Create project if project_id not provided
        if project_id is None:
            project = Project(title=llm_script.title, genre=llm_script.genre)
            db.add(project)
            await db.commit()
            await db.refresh(project)
            project_id = project.id
        else:
            project = (await db.execute(select(Project).where(Project.id == project_id))).scalar_one_or_none()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")

        script = Script(
            project_id=project_id,
            title=llm_script.title,
            genre=llm_script.genre,
            logline=llm_script.logline,
            total_duration_seconds=llm_script.total_duration_seconds,
        )
        db.add(script)
        await db.commit()
        await db.refresh(script)

        scenes_data = []
        for idx, llm_scene in enumerate(llm_script.scenes, start=1):
            title = llm_scene.title
            if title is None:
                title = f"Scene {idx}"

            scene = DBScene(
                script_id=script.id,
                scene_number=idx,
                title=title,
                location=llm_scene.location,
                time_of_day=llm_scene.time_of_day,
                description=llm_scene.description,
                characters=llm_scene.characters,
                mood_tension=llm_scene.mood.tension,
                mood_emotion=llm_scene.mood.emotion,
                mood_energy=llm_scene.mood.energy,
                mood_darkness=llm_scene.mood.darkness,
                mood_overall=llm_scene.mood.overall_mood,
                soundtrack=llm_scene.soundtrack.model_dump(),
            )
            db.add(scene)
            await db.commit()
            await db.refresh(scene)

            shots = []
            for shot_data in llm_scene.shots:
                shot = DBShot(
                    scene_id=scene.id,
                    shot_number=shot_data.shot_number,
                    shot_type=shot_data.shot_type,
                    camera_angle=shot_data.camera_angle,
                    camera_movement=shot_data.camera_movement,
                    description=shot_data.description,
                    dialogue=shot_data.dialogue,
                    duration_seconds=shot_data.duration_seconds,
                    image_prompt=shot_data.image_prompt,
                )
                db.add(shot)
                shots.append(shot)
            await db.commit()

            scenes_data.append({
                "scene_id": scene.id,
                "shots": [
                    {
                        "shot_number": s.shot_number,
                        "image_prompt": s.image_prompt,
                    }
                    for s in shots
                ],
            })

            yield _sse_event(
                "progress",
                {
                    "stage": "scene",
                    "message": f"Processing scene {idx}/{len(llm_script.scenes)}",
                    "current": idx,
                    "total": len(llm_script.scenes),
                },
            )

        # Generate frames
        for idx, scene_data in enumerate(scenes_data, start=1):
            scene_id = scene_data["scene_id"]
            shots_q = (
                await db.execute(
                    select(DBShot).where(DBShot.scene_id == scene_id).order_by(DBShot.shot_number)
                )
            ).scalars().all()
            shot_schemas = [
                ShotSchema(
                    id=s.id,
                    scene_id=s.scene_id,
                    shot_number=s.shot_number,
                    shot_type=s.shot_type,
                    camera_angle=s.camera_angle,
                    camera_movement=s.camera_movement,
                    description=s.description,
                    dialogue=s.dialogue,
                    duration_seconds=s.duration_seconds,
                    image_prompt=s.image_prompt,
                    created_at=s.created_at,
                    updated_at=s.updated_at,
                )
                for s in shots_q
            ]

            filenames = await generate_frames_for_scene(scene_id, shot_schemas)

            if shot_schemas:
                first_sn = shot_schemas[0].shot_number
                filename = filenames.get(first_sn)
                if filename:
                    (await db.execute(select(DBScene).where(DBScene.id == scene_id))).scalar_one_or_none().frame_image_url = f"/generated/frames/{filename}"

            await db.commit()
            yield _sse_event(
                "progress",
                {
                    "stage": "frame",
                    "message": f"Generating frame {idx}/{len(scenes_data)}...",
                    "current": idx,
                    "total": len(scenes_data),
                },
            )

        await db.refresh(script)
        yield _sse_event("done", {"script_id": script.id, "message": "Storyboard complete!"})

    except Exception as e:
        logger.exception("Premise pipeline failed")
        yield _sse_event("error", {"message": str(e)})


async def _run_pipeline_script(
    project_id: int,
    raw_script: str,
    num_scenes: int,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    try:
        yield _sse_event("progress", {"stage": "llm", "message": "Parsing screenplay..."})
        llm_script = await parse_script_from_text(raw_script)

        project = (await db.execute(select(Project).where(Project.id == project_id))).scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        script = Script(
            project_id=project_id,
            title=llm_script.title,
            genre=llm_script.genre,
            logline=llm_script.logline,
            total_duration_seconds=llm_script.total_duration_seconds,
            raw_text=raw_script,
        )
        db.add(script)
        await db.commit()
        await db.refresh(script)

        scenes_data = []
        for idx, llm_scene in enumerate(llm_script.scenes, start=1):
            title_val = llm_scene.title
            if title_val is None:
                title_val = f"Scene {idx}"

            scene = DBScene(
                script_id=script.id,
                scene_number=idx,
                title=title_val,
                location=llm_scene.location,
                time_of_day=llm_scene.time_of_day,
                description=llm_scene.description,
                characters=llm_scene.characters,
                mood_tension=llm_scene.mood.tension,
                mood_emotion=llm_scene.mood.emotion,
                mood_energy=llm_scene.mood.energy,
                mood_darkness=llm_scene.mood.darkness,
                mood_overall=llm_scene.mood.overall_mood,
                soundtrack=llm_scene.soundtrack.model_dump(),
            )
            db.add(scene)
            await db.commit()
            await db.refresh(scene)

            shots = []
            for shot_data in llm_scene.shots:
                shot = DBShot(
                    scene_id=scene.id,
                    shot_number=shot_data.shot_number,
                    shot_type=shot_data.shot_type,
                    camera_angle=shot_data.camera_angle,
                    camera_movement=shot_data.camera_movement,
                    description=shot_data.description,
                    dialogue=shot_data.dialogue,
                    duration_seconds=shot_data.duration_seconds,
                    image_prompt=shot_data.image_prompt,
                )
                db.add(shot)
                shots.append(shot)
            await db.commit()

            scenes_data.append({
                "scene_id": scene.id,
                "shots": [
                    {
                        "shot_number": s.shot_number,
                        "image_prompt": s.image_prompt,
                    }
                    for s in shots
                ],
            })

            yield _sse_event(
                "progress",
                {
                    "stage": "scene",
                    "message": f"Processing scene {idx}/{len(llm_script.scenes)}",
                    "current": idx,
                    "total": len(llm_script.scenes),
                },
            )

        for idx, scene_data in enumerate(scenes_data, start=1):
            scene_id = scene_data["scene_id"]
            shots_q = (await db.execute(select(DBShot).where(DBShot.scene_id == scene_id).order_by(DBShot.shot_number))).scalars().all()

            shot_schemas = [
                ShotSchema(
                    id=s.id,
                    scene_id=s.scene_id,
                    shot_number=s.shot_number,
                    shot_type=s.shot_type,
                    camera_angle=s.camera_angle,
                    camera_movement=s.camera_movement,
                    description=s.description,
                    dialogue=s.dialogue,
                    duration_seconds=s.duration_seconds,
                    image_prompt=s.image_prompt,
                    created_at=s.created_at,
                    updated_at=s.updated_at,
                )
                for s in shots_q
            ]

            filenames = await generate_frames_for_scene(scene_id, shot_schemas)

            if shot_schemas:
                first_sn = shot_schemas[0].shot_number
                filename = filenames.get(first_sn)
                if filename:
                    (await db.execute(select(DBScene).where(DBScene.id == scene_id))).scalar_one_or_none().frame_image_url = f"/generated/frames/{filename}"

            await db.commit()
            yield _sse_event(
                "progress",
                {
                    "stage": "frame",
                    "message": f"Generating frame {idx}/{len(scenes_data)}...",
                    "current": idx,
                    "total": len(scenes_data),
                },
            )

        await db.refresh(script)
        yield _sse_event("done", {"script_id": script.id, "message": "Storyboard complete!"})

    except Exception as e:
        logger.exception("Script pipeline failed")
        yield _sse_event("error", {"message": str(e)})


@router.post("/generate/premise")
async def generate_from_premise(req: GenerateFromPremiseRequest, db: AsyncSession = Depends(get_db)):
    return StreamingResponse(
        _run_pipeline_premise(req.project_id, req.genre, req.premise, req.num_scenes, db),
        media_type="text/event-stream",
    )


@router.post("/generate/script")
async def generate_from_script(req: GenerateFromScriptRequest, db: AsyncSession = Depends(get_db)):
    return StreamingResponse(
        _run_pipeline_script(req.project_id, req.raw_script, req.num_scenes or 4, db),
        media_type="text/event-stream",
    )


@router.get("/{script_id}")
async def get_storyboard(script_id: int, db: AsyncSession = Depends(get_db)):
    script_q = await db.execute(select(Script).where(Script.id == script_id))
    script = script_q.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    scenes_q = await db.execute(
        select(DBScene).where(DBScene.script_id == script_id).order_by(DBScene.scene_number)
    )
    scenes = scenes_q.scalars().all()

    payload = {
        "id": script.id,
        "project_id": script.project_id,
        "title": script.title,
        "genre": script.genre,
        "logline": script.logline,
        "total_duration_seconds": script.total_duration_seconds,
        "created_at": script.created_at,
        "updated_at": script.updated_at,
        "scenes": [],
    }
    for scene in scenes:
        shot_list = (
            await db.execute(
                select(DBShot).where(DBShot.scene_id == scene.id).order_by(DBShot.shot_number)
            )
        ).scalars().all()

        shot_payloads = []
        for s in shot_list:
            filename = None
            if scene.frame_image_url and s.shot_number == shot_list[0].shot_number:
                filename = scene.frame_image_url.replace("/generated/frames/", "")
            shot_payloads.append({
                "id": s.id,
                "scene_id": s.scene_id,
                "shot_number": s.shot_number,
                "shot_type": s.shot_type,
                "camera_angle": s.camera_angle,
                "camera_movement": s.camera_movement,
                "description": s.description,
                "dialogue": s.dialogue,
                "duration_seconds": s.duration_seconds,
                "image_prompt": s.image_prompt,
                "frame_filename": filename,
            })

        payload["scenes"].append({
            "id": scene.id,
            "script_id": scene.script_id,
            "scene_number": scene.scene_number,
            "title": scene.title,
            "location": scene.location,
            "time_of_day": scene.time_of_day,
            "description": scene.description,
            "characters": scene.characters,
            "mood_tension": scene.mood_tension,
            "mood_emotion": scene.mood_emotion,
            "mood_energy": scene.mood_energy,
            "mood_darkness": scene.mood_darkness,
            "mood_overall": scene.mood_overall,
            "soundtrack": scene.soundtrack,
            "frame_image_url": scene.frame_image_url,
            "created_at": scene.created_at,
            "updated_at": scene.updated_at,
            "shots": shot_payloads,
        })

    return payload


@router.get("/{script_id}/export/json")
async def export_json(script_id: int, db: AsyncSession = Depends(get_db)):
    data = await get_storyboard(script_id, db)
    return JSONResponse(content=data, media_type="application/json")


class _PdfDoc(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"CutAI — {datetime.now().strftime('%Y-%m-%d %H:%M')}", align="C")


@router.get("/{script_id}/export/pdf")
async def export_pdf(script_id: int, db: AsyncSession = Depends(get_db)):
    data = await get_storyboard(script_id, db)
    pdf = _PdfDoc()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Cover page
    cover_title = data.get("title", "Untitled")
    cover_genre = data.get("genre", "")
    cover_logline = data.get("logline", "")

    pdf.add_page()
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(10, 10, 15)
    pdf.ln(40)
    pdf.multi_cell(0, 14, cover_title, align="C")
    pdf.set_font("Helvetica", "I", 12)
    pdf.set_text_color(245, 158, 11)
    pdf.multi_cell(0, 8, cover_genre, align="C")
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(0, 8, cover_logline, align="C")

    # Scenes
    for scene in data.get("scenes", []):
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(245, 158, 11)
        pdf.cell(0, 10, f"Scene {scene['scene_number']}: {scene['title']}")
        pdf.ln(7)

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 6, f"{scene['location']} — {scene['time_of_day']}")
        pdf.ln(7)

        if scene.get("frame_image_url"):
            image_path = f"apps/cutai/backend/generated/frames/{scene.get('frame_image_url','').split('/')[-1]}"
            try:
                pdf.image(image_path, x=10, y=None, w=180)
                pdf.ln(5)
            except Exception:
                pass

        pdf.set_text_color(200, 200, 200)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, "Mood")
        pdf.ln()
        pdf.set_font("Helvetica", "", 10)
        for key, value in scene["soundtrack"].items():
            pdf.cell(0, 6, f"{key}: {value}")
            pdf.ln()

        pdf.ln(3)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, "Shots")
        pdf.ln()
        pdf.set_font("Courier", "", 9)
        for shot in scene.get("shots", []):
            pdf.multi_cell(0, 5.5, f"Shot {shot['shot_number']} ({shot['shot_type']} | {shot['camera_angle']} | {shot['camera_movement']}): {shot['description']}")
            if shot.get("dialogue"):
                pdf.set_text_color(139, 92, 246)
                pdf.multi_cell(0, 5.5, f"  DIALOGUE: {shot['dialogue']}")
                pdf.set_text_color(200, 200, 200)
            pdf.ln(1)

    buffer = io.BytesIO()
    pdf.output(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=storyboard_{script_id}.pdf"},
    )
