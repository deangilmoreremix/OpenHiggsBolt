from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from models.database import get_db
from models.db_models import Project as DBProject, Script as DBScript
from models.schemas import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()


@router.post("/", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, db: AsyncSession = Depends(get_db)):
    db_project = DBProject(title=project.title, genre=project.genre)
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return ProjectResponse(
        id=db_project.id,
        title=db_project.title,
        genre=db_project.genre,
        created_at=db_project.created_at,
        updated_at=db_project.updated_at,
    )


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(select(func.count(DBProject.id)))
    total = count_result.scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(
        select(DBProject).order_by(DBProject.updated_at.desc()).offset(offset).limit(page_size)
    )
    projects = result.scalars().all()

    return [
        ProjectResponse(
            id=p.id,
            title=p.title,
            genre=p.genre,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBProject).where(DBProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse(
        id=project.id,
        title=project.title,
        genre=project.genre,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.delete("/{project_id}")
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DBProject).where(DBProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
    return {"ok": True}
