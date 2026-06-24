from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.database import get_db
from models.db_models import Script as DBScript
from models.schemas import ScriptCreate, ScriptResponse

router = APIRouter()


@router.post("/", response_model=ScriptResponse)
async def create_script(script: ScriptCreate, db: AsyncSession = Depends(get_db)):
    db_script = DBScript(
        project_id=script.project_id,
        title=script.title,
        genre=script.genre,
        logline=script.logline,
        total_duration_seconds=script.total_duration_seconds,
        raw_text=script.raw_text,
    )
    db.add(db_script)
    await db.commit()
    await db.refresh(db_script)
    return ScriptResponse(
        id=db_script.id,
        project_id=db_script.project_id,
        title=db_script.title,
        genre=db_script.genre,
        logline=db_script.logline,
        total_duration_seconds=db_script.total_duration_seconds,
        raw_text=db_script.raw_text,
        created_at=db_script.created_at,
        updated_at=db_script.updated_at,
        scenes=[],
    )


@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(script_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBScript).where(DBScript.id == script_id))
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return ScriptResponse(
        id=script.id,
        project_id=script.project_id,
        title=script.title,
        genre=script.genre,
        logline=script.logline,
        total_duration_seconds=script.total_duration_seconds,
        raw_text=script.raw_text,
        created_at=script.created_at,
        updated_at=script.updated_at,
        scenes=[],
    )
