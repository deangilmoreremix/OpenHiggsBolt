#!/usr/bin/env python3
"""Verify /tmp/export-test.mp4: MP4 container magic + dimensions/duration/codec
via ffmpeg JSON output (robust stderr parsing avoided)."""
import json, os, re, subprocess, sys

OUT = "/tmp/export-test.mp4"
FF = os.environ.get("FFMPEG_PATH", "")
if not FF:
    # find bundled ffmpeg
    import imageio_ffmpeg
    FF = imageio_ffmpeg.get_ffmpeg_exe()

size = os.path.getsize(OUT)

# 1) MP4 container magic check (ftyp box at offset 4)
with open(OUT, "rb") as f:
    head = f.read(12)
ftyp_valid = head[4:8] == b"ftyp"

# 2) ffmpeg stream info (parse text stderr; robust to whether JSON or text emitted)
cmd = [FF, "-i", OUT, "-f", "null", "-"]
try:
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    txt = res.stdout + "\n" + res.stderr
except Exception as e:
    print("ffmpeg run failed:", e)
    sys.exit(2)

duration = 0.0
width = height = 0
codec = ""
frame_rate = ""
audio_codec = ""
for line in txt.splitlines():
    dm = re.search(r"Duration:\s*([\d:.]+)", line)
    if dm and duration == 0.0:
        s = dm.group(1).split(",")[0]
        h, m, sec = s.split(":")[:3]
        duration = float(h) * 3600 + float(m) * 60 + float(sec)
    if "Video:" in line and "x" in line and "wrapped" not in line:
        mm = re.search(r"Video:\s*([a-zA-Z0-9]+)", line)
        codec = mm.group(1).lower() if mm else codec
        dims = re.findall(r"(\d{3,})\s*x\s*(\d{2,})", line)
        if dims and width == 0 and height == 0:
            width, height = int(dims[0][0]), int(dims[0][1])
        dd = re.search(r"(\d+)x(\d+)", line)
        if dd:
            width, height = int(dd.group(1)), int(dd.group(2))
    am = re.search(r"Audio:\s*([a-zA-Z0-9]+)", line)
    if am and not audio_codec:
        audio_codec = am.group(1).lower()

meta = {
    "size_bytes": size,
    "container": "MP4" if ftyp_valid else "NOT-MP4",
    "ftyp_valid": ftyp_valid,
    "width": width,
    "height": height,
    "duration_seconds": round(duration, 2),
    "fps": frame_rate,
    "video_codec": codec,
    "audio_codec": audio_codec,
}

import pathlib
REPO = "/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/.kilo/worktrees/shotcraft-motion-library"
p = pathlib.Path(os.path.join(REPO, "docs", "motion-studio-evidence", "export-metadata.json"))
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text(json.dumps(meta, indent=2))

print(json.dumps(meta, indent=2))
ok = ftyp_valid and codec.lower() in ("h264", "avc1", "avc") and size > 0 and width > 0 and height > 0 and duration > 0
print("VERDICT:", "VALID REAL MP4" if ok else "INVALID")
sys.exit(0 if ok else 1)
