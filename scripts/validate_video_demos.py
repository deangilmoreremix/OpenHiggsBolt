#!/usr/bin/env python3
"""
Build-time validation for video demo data.
Fails if any demo is missing a videoSrc or references a missing local file.
"""
import os
import re
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public"
DATA_DIR = PROJECT_ROOT / "src" / "data"

DEMO_FILES = [
    "seedance25Demos.ts",
    "seedance1Demos.ts",
    "promptFeedDemos.ts",
    "seedance2PromptDemos.ts",
    "minimaxH3Demos.ts",
]


def extract_video_srcs(filepath: Path) -> list[tuple[int, str]]:
    """Extract (line_number, videoSrc_value) from a TypeScript data file."""
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    results = []
    for i, line in enumerate(lines, start=1):
        # Match both 'videoSrc': "..."
        m = re.search(r'["\']?videoSrc["\']?\s*:\s*["]([^"]+)["]', line)
        if m:
            results.append((i, m.group(1)))
    return results


def check_local_file(video_src: str) -> bool:
    """Check if a local video file path exists."""
    if video_src.startswith("http://") or video_src.startswith("https://"):
        return True  # Remote URLs are assumed valid
    if video_src.startswith("data:"):
        return False  # Data URIs are placeholders, not real videos
    local_path = PUBLIC_DIR / video_src.lstrip("/")
    return local_path.exists()


def main() -> int:
    errors = []
    warnings = []

    for filename in DEMO_FILES:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            warnings.append(f"{filename}: file not found, skipping")
            continue

        video_srcs = extract_video_srcs(filepath)
        if not video_srcs:
            warnings.append(f"{filename}: no videoSrc entries found")
            continue

        for line_no, video_src in video_srcs:
            if not video_src:
                errors.append(f"{filename}:{line_no}: empty videoSrc")
            elif video_src.startswith("data:"):
                errors.append(f"{filename}:{line_no}: placeholder data URI instead of real video")
            elif not video_src.startswith("http"):
                if not check_local_file(video_src):
                    errors.append(f"{filename}:{line_no}: missing local video file: {video_src}")

    # Check seedance_prompts.json if it exists
    api_json = PROJECT_ROOT / "tmp" / "seedance_prompts.json"
    if api_json.exists():
        with open(api_json, "r", encoding="utf-8") as f:
            records = json.load(f)
        for i, record in enumerate(records):
            if not record.get("outputUrl"):
                errors.append(f"seedance_prompts.json:[{i}]: missing outputUrl")

    if warnings:
        for w in warnings:
            print(f"WARNING: {w}", file=sys.stderr)

    if errors:
        print(f"FAILED: {len(errors)} video validation error(s):", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print("OK: All demos have valid video sources")
    return 0


if __name__ == "__main__":
    sys.exit(main())
