from __future__ import annotations

import asyncio
import base64
import logging
import os
from pathlib import Path
from openai import AsyncOpenAI, BadRequestError
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)
_semaphore = asyncio.Semaphore(2)
os.makedirs(settings.frames_dir, exist_ok=True)


async def generate_frame(
    image_prompt: str,
    scene_id: int,
    shot_number: int,
) -> str | None:
    filename = f"scene_{scene_id}_shot_{shot_number}.png"
    filepath = Path(settings.frames_dir) / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)

    try:
        result = await client.images.generate(
            model=settings.openai_image_model,
            prompt=image_prompt,
            size=settings.image_size,
            quality=settings.image_quality,
            n=1,
            response_format="b64_json",
        )
        b64 = result.data[0].b64_json
        image_bytes = base64.b64decode(b64)
        filepath.write_bytes(image_bytes)
        return filename
    except BadRequestError as e:
        if getattr(e, "code", None) == "moderation_blocked":
            logger.warning(
                "OpenAI moderation blocked frame for scene %s shot %s: %s",
                scene_id,
                shot_number,
                e,
            )
            return None
        raise
    except Exception as e:
        logger.error(
            "Failed to generate frame for scene %s shot %s: %s",
            scene_id,
            shot_number,
            e,
        )
        raise


async def _bounded_generate(image_prompt: str, scene_id: int, shot_number: int, results: dict):
    async with _semaphore:
        filename = await generate_frame(image_prompt, scene_id, shot_number)
        results[shot_number] = filename


async def generate_frames_for_scene(scene_id: int, shots: list) -> dict:
    """
    Batch-generate frames for all shots in a scene.
    Returns dict mapping shot_number -> filename | None.
    """
    results: dict[int, str | None] = {}
    tasks = [
        _bounded_generate(shot.image_prompt, scene_id, shot.shot_number, results)
        for shot in shots
    ]
    await asyncio.gather(*tasks, return_exceptions=True)
    return results
