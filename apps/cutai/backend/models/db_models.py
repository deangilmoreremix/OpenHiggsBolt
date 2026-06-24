from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from models.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    genre = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    scripts = relationship("Script", back_populates="project", cascade="all, delete-orphan")


class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    genre = Column(String, nullable=False)
    logline = Column(String, nullable=False)
    total_duration_seconds = Column(Integer, nullable=False)
    raw_text = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="scripts")
    scenes = relationship("Scene", back_populates="script", cascade="all, delete-orphan")


class Scene(Base):
    __tablename__ = "scenes"

    id = Column(Integer, primary_key=True, index=True)
    script_id = Column(Integer, ForeignKey("scripts.id", ondelete="CASCADE"), nullable=False)
    scene_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    location = Column(String, nullable=False)
    time_of_day = Column(String, default="day")
    description = Column(Text, nullable=False)
    characters = Column(JSON, default=list)
    mood_tension = Column(Float, default=0.0)
    mood_emotion = Column(Float, default=0.0)
    mood_energy = Column(Float, default=0.0)
    mood_darkness = Column(Float, default=0.0)
    mood_overall = Column(String, default="neutral")
    soundtrack = Column(JSON, default=dict)
    frame_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    script = relationship("Script", back_populates="scenes")
    shots = relationship(
        "Shot",
        back_populates="scene",
        cascade="all, delete-orphan",
        order_by="Shot.shot_number",
    )


class Shot(Base):
    __tablename__ = "shots"

    id = Column(Integer, primary_key=True, index=True)
    scene_id = Column(Integer, ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    shot_number = Column(Integer, nullable=False)
    shot_type = Column(String, nullable=False)
    camera_angle = Column(String, nullable=False)
    camera_movement = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    dialogue = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=False)
    image_prompt = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    scene = relationship("Scene", back_populates="shots")
