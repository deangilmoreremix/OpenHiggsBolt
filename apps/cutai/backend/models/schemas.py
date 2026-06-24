from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class MoodScore(BaseModel):
    tension: float
    emotion: float
    energy: float
    darkness: float
    overall_mood: str


class SoundtrackVibe(BaseModel):
    genre: str
    tempo: str
    instruments: List[str]
    reference_track: str
    energy_level: float


class LLMShot(BaseModel):
    shot_number: int
    shot_type: str
    camera_angle: str
    camera_movement: str
    description: str
    dialogue: Optional[str] = None
    duration_seconds: int
    image_prompt: str


class LLMScene(BaseModel):
    scene_number: int
    title: str
    location: str
    time_of_day: str
    description: str
    characters: List[str]
    shots: List[LLMShot]
    mood: MoodScore
    soundtrack: SoundtrackVibe


class LLMScript(BaseModel):
    title: str
    genre: str
    logline: str
    total_duration_seconds: int
    scenes: List[LLMScene]


class Shot(BaseModel):
    id: int
    scene_id: int
    shot_number: int
    shot_type: str
    camera_angle: str
    camera_movement: str
    description: str
    dialogue: Optional[str] = None
    duration_seconds: int
    image_prompt: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Scene(BaseModel):
    id: int
    script_id: int
    scene_number: int
    title: str
    location: str
    time_of_day: str
    description: str
    characters: List[str]
    mood_tension: float
    mood_emotion: float
    mood_energy: float
    mood_darkness: float
    mood_overall: str
    soundtrack: Dict[str, Any]
    frame_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Script(BaseModel):
    id: int
    project_id: int
    title: str
    genre: str
    logline: str
    total_duration_seconds: int
    raw_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    title: str
    genre: str


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    genre: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScriptCreate(BaseModel):
    project_id: int
    title: str
    genre: str
    logline: str
    total_duration_seconds: int
    raw_text: Optional[str] = None


class ScriptResponse(Script):
    scenes: List["Scene"] = []

    class Config:
        from_attributes = True


class SceneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    frame_image_url: Optional[str] = None


class SceneResponse(Scene):
    shots: List[Shot] = []

    class Config:
        from_attributes = True


class ShotResponse(Shot):
    pass


class GenerateFromPremiseRequest(BaseModel):
    genre: str
    premise: str
    num_scenes: int = Field(default=4, ge=1, le=8)
    project_id: Optional[int] = None


class GenerateFromScriptRequest(BaseModel):
    genre: str
    raw_script: str
    num_scenes: Optional[int] = Field(default=4, ge=1, le=8)
    project_id: int
