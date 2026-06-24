import json
import re
from openai import AsyncOpenAI, BadRequestError
from config import get_settings

settings = get_settings()
client = AsyncOpenAI(api_key=settings.openai_api_key)


def clean_json_response(raw: str) -> str:
    raw = raw.strip()

    # Strip ```json ... ``` or ``` ... ```
    if raw.startswith("```"):
        lines = raw.splitlines()
        if len(lines) > 1:
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\n".join(lines)

    # Extract first {...} or [...] block
    start = -1
    for i, ch in enumerate(raw):
        if ch in ("{", "["):
            start = i
            break
    if start == -1:
        return raw.strip()

    # Find matching closing bracket
    open_ch = raw[start]
    close_ch = "}" if open_ch == "{" else "]"
    depth = 0
    end = -1
    for i in range(start, len(raw)):
        if raw[i] == open_ch:
            depth += 1
        elif raw[i] == close_ch:
            depth -= 1
            if depth == 0:
                end = i
                break

    if end == -1:
        return raw.strip()

    candidate = raw[start : end + 1]

    # Fix trailing commas
    candidate = re.sub(r",(\s*[}\]\)])", r"\1", candidate)
    return candidate.strip()


async def call_llm(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 4096,
) -> str:
    for attempt in range(3):
        try:
            response = await client.responses.create(
                model=settings.openai_llm_model,
                input=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                max_output_tokens=max_tokens,
                temperature=settings.llm_temperature,
                text={"format": {"type": "json_object"}},
            )

            raw_text = ""
            for item in response.output:
                item_type = getattr(item, "type", None)
                if item_type == "message":
                    for part in getattr(item, "content", []):
                        if getattr(part, "type", None) in ("output_text", "text"):
                            raw_text += part.text

            cleaned = clean_json_response(raw_text)
            # Validate JSON parse
            json.loads(cleaned)
            return cleaned
        except BadRequestError as e:
            raise
        except Exception:
            if attempt == 2:
                raise RuntimeError("LLM call failed after 3 attempts")
            continue

    raise RuntimeError("LLM call failed after 3 attempts")
