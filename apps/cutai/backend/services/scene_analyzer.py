from typing import Optional
from models.schemas import LLMScene, LLMShot
from services.llm_client import call_llm
import json


SYSTEM_PROMPT = """You are a film director AI. Given a scene description, regenerate it preserving the exact JSON structure below.

{
  "scene_number": 1,
  "title": "string",
  "location": "INT. LOCATION - NIGHT",
  "time_of_day": "night",
  "description": "string",
  "characters": ["Name"],
  "shots": [{
    "shot_number": 1,
    "shot_type": "wide",
    "camera_angle": "low-angle",
    "camera_movement": "dolly-in",
    "description": "string",
    "dialogue": null,
    "duration_seconds": 5,
    "image_prompt": "Detailed natural-language cinematic description optimized for gpt-image-2."
  }],
  "mood": {
    "tension": 0.7, "emotion": 0.4, "energy": 0.8, "darkness": 0.6,
    "overall_mood": "thrilling"
  },
  "soundtrack": {
    "genre": "orchestral", "tempo": "fast",
    "instruments": ["strings", "brass"],
    "reference_track": "Similar to: Hans Zimmer — Inception",
    "energy_level": 0.8
  }
}
"""


async def analyze_scene(title: str, location: str, description: str, time_of_day: str) -> LLMScene:
    user_message = f"Regenerate this scene:\nTitle: {title}\nLocation: {location}\nDescription: {description}\nTime of day: {time_of_day}"
    raw = await call_llm(SYSTEM_PROMPT, user_message)
    return LLMScene.model_validate(json.loads(raw))


async def refresh_scene_shot(scene_description: str, image_prompt: str) -> str:
    system_prompt = (
        "Given a shot description, rewrite the image prompt into a rich cinematic natural-language description "
        "optimized for gpt-image-2. Return ONLY a JSON object: {\"image_prompt\": \"...\"}."
    )
    user_message = f"Scene: {scene_description}\nCurrent prompt: {image_prompt}\nImprove the prompt only."
    raw = await call_llm(system_prompt, user_message)
    data = json.loads(raw)
    return data.get("image_prompt", image_prompt)
