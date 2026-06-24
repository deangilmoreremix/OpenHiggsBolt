from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.database import get_db
from models.db_models import Scene as DBScene, Shot as DBShot
from models.schemas import SceneUpdate, SceneResponse, ShotResponse
from services.scene_analyzer import analyze_scene
from services.image_generator import generate_frames_for_scene
from models.schemas import Shot as ShotSchema

router = APIRouter()


@router.get("/{scene_id}", response_model=SceneResponse)
async def get_scene(scene_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBScene).where(DBScene.id == scene_id))
    scene = result.scalar_one_or_none()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    shots_result = await db.execute(
        select(DBShot).where(DBShot.scene_id == scene_id).order_by(DBShot.shot_number)
    )
    shots = shots_result.scalars().all()

    return SceneResponse(
        id=scene.id,
        script_id=scene.script_id,
        scene_number=scene.scene_number,
        title=scene.title,
        location=scene.location,
        time_of_day=scene.time_of_day,
        description=scene.description,
        characters=scene.characters or [],
        mood_tension=scene.mood_tension,
        mood_emotion=scene.mood_emotion,
        mood_energy=scene.mood_energy,
        mood_darkness=scene.mood_darkness,
        mood_overall=scene.mood_overall,
        soundtrack=scene.soundtrack or {},
        frame_image_url=scene.frame_image_url,
        created_at=scene.created_at,
        updated_at=scene.updated_at,
        shots=[
            ShotResponse(
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
            for s in shots
        ],
    )


@router.patch("/{scene_id}", response_model=SceneResponse)
async def update_scene(scene_id: int, update: SceneUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBScene).where(DBScene.id == scene_id))
    scene = result.scalar_one_or_none()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    if update.title is not None:
        scene.title = update.title
    if update.description is not None:
        scene.description = update.description
    if update.frame_image_url is not None:
        scene.frame_image_url = update.frame_image_url

    await db.commit()
    await db.refresh(scene)
    return await get_scene(scene_id, db)


@router.post("/{scene_id}/regenerate", response_model=SceneResponse)
async def regenerate_scene(scene_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBScene).where(DBScene.id == scene_id))
    scene = result.scalar_one_or_none()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    llm_scene = await analyze_scene(
        scene.title, scene.location, scene.description, scene.time_of_day
    )

    shots_result = await db.execute(
        select(DBShot).where(DBShot.scene_id == scene_id).order_by(DBShot.shot_number)
    )
    existing_shots = shots_result.scalars().all()

    scene.title = llm_scene.title
    scene.description = llm_scene.description
    scene.location = llm_scene.location
    scene.time_of_day = llm_scene.time_of_day
    scene.characters = llm_scene.characters
    scene.mood_tension = llm_scene.mood.tension
    scene.mood_emotion = llm_scene.mood.emotion
    scene.mood_energy = llm_scene.mood.energy
    scene.mood_darkness = llm_scene.mood.darkness
    scene.mood_overall = llm_scene.mood.overall_mood
    scene.soundtrack = llm_scene.soundtrack.model_dump()

    for i, shot_data in enumerate(llm_scene.shots):
        if i < len(existing_shots):
            shot = existing_shots[i]
            shot.shot_type = shot_data.shot_type
            shot.camera_angle = shot_data.camera_angle
            shot.camera_movement = shot_data.camera_movement
            shot.description = shot_data.description
            shot.dialogue = shot_data.dialogue
            shot.duration_seconds = shot_data.duration_seconds
            shot.image_prompt = shot_data.image_prompt
        else:
            new_shot = DBShot(
                scene_id=scene_id,
                shot_number=shot_data.shot_number,
                shot_type=shot_data.shot_type,
                camera_angle=shot_data.camera_angle,
                camera_movement=shot_data.camera_movement,
                description=shot_data.description,
                dialogue=shot_data.dialogue,
                duration_seconds=shot_data.duration_seconds,
                image_prompt=shot_data.image_prompt,
            )
            db.add(new_shot)

    for i in range(len(llm_scene.shots), len(existing_shots)):
        await db.delete(existing_shots[i])

    await db.commit()
    await db.refresh(scene)
    return await get_scene(scene_id, db)


@router.post("/{scene_id}/regenerate-frame", response_model=SceneResponse)
async def regenerate_frame(scene_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBScene).where(DBScene.id == scene_id))
    scene = result.scalar_one_or_none()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    shots_result = await db.execute(
        select(DBShot).where(DBShot.scene_id == scene_id).order_by(DBShot.shot_number)
    )
    shots = shots_result.scalars().all()

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
        for s in shots
    ]

    filenames = await generate_frames_for_scene(scene_id, shot_schemas)

    if shot_schemas:
        first_shot_number = shot_schemas[0].shot_number
        filename = filenames.get(first_shot_number)
        if filename:
            scene.frame_image_url = f"/generated/frames/{filename}"

    await db.commit()
    await db.refresh(scene)
    return await get_scene(scene_id, db)


@router.put("/reorder", status_code=204)
async def reorder_scenes(order: list[dict], db: AsyncSession = Depends(get_db)):
    for item in order:
        scene_id = item.get("scene_id")
        scene_number = item.get("scene_number")
        if scene_id is None or scene_number is None:
            continue
        result = await db.execute(select(DBScene).where(DBScene.id == scene_id))
        scene = result.scalar_one_or_none()
        if scene:
            scene.scene_number = scene_number
    await db.commit()
    return None
