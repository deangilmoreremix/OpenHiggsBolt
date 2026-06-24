from typing import List
from services.llm_client import call_llm
from models.schemas import LLMScript


SCRIPT_SYSTEM_PROMPT = """You are an expert screenwriter and film director.
Return ONLY valid JSON (no markdown fences, no extra text) matching this schema:

{
  "title": "string",
  "genre": "string",
  "logline": "string — one sentence summary",
  "total_duration_seconds": 120,
  "scenes": [{
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
      "image_prompt": "Detailed natural-language cinematic description optimized for gpt-image-2. Example: Cinematic wide shot, dimly lit jazz bar, warm amber lighting, 1940s noir atmosphere, film grain, low camera angle."
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
  }]
}

Rules:
- Output ONLY the JSON object.
- image_prompt must be rich enough to generate a high-quality storyboard frame without enrichment. Describe lighting, composition, atmosphere, and camera perspective.
- time_of_day options: day, night, dawn, dusk, overcast, night-interior, day-interior.
- shot_type options: wide, medium, close-up, extreme-close-up, over-shoulder, two-shot, establishing, tracking.
- camera_angle options: low-angle, high-angle, eye-level, dutch-angle, birds-eye, worms-eye.
- camera_movement options: static, dolly-in, dolly-out, pan-left, pan-right, tracking, handheld, crane.
"""


async def generate_script_from_premise(genre: str, premise: str, num_scenes: int) -> LLMScript:
    user_message = (
        f"Genre: {genre}\nPremise: {premise}\nNumber of scenes: {num_scenes}\n"
        "Generate a complete script with the exact JSON schema described."
    )
    raw = await call_llm(SCRIPT_SYSTEM_PROMPT, user_message)
    return LLMScript.model_validate(json.loads(raw))


async def parse_script_from_text(raw_script: str) -> LLMScript:
    user_message = (
        "Parse the following raw screenplay text into the exact JSON schema described. "
        "Extract title, genre, logline, total_duration_seconds, scenes, shots, moods, and soundtrack. "
        "If a field is missing, invent sensible defaults. "
        "Do NOT include any text outside the JSON object.\n\n---\n\n"
        f"{raw_script}\n\n---"
    )
    raw = await call_llm(SCRIPT_SYSTEM_PROMPT, user_message)
    return LLMScript.model_validate(json.loads(raw))
