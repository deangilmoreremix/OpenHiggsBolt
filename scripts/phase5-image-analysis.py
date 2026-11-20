#!/usr/bin/env python3
"""Measure the styled product image in exported MP4 frames (pixel evidence, not geometry tests).

The e2e fixture is a 3:2 magenta (#a33b6b) photo with a yellow (#ffd400) SUBJECT circle that
spans 95% of its height. For each exported MP4 this extracts the frame at t seconds and reports:
  corners_rounded  the four corners of the image's bounding box are NOT image pixels
  frame_aspect     bbox width/height (expect ~1.5: contain fit, not stretched)
  subject_aspect   yellow bbox w/h (expect ~1.0: not stretched)
  subject_height   yellow height / frame height (expect ~0.95: not cropped)
  shadow_delta     mean luma 1-6px below the bottom edge minus 25-35px below (negative = darker near the edge)
usage: phase5-image-analysis.py <dir-with-mp4> [t=1.5]
"""
import glob, json, os, subprocess, sys
from PIL import Image

d = sys.argv[1]; t = sys.argv[2] if len(sys.argv) > 2 else '1.5'
MAG = (163, 59, 107); YEL = (255, 212, 0)
near = lambda p, c, tol: all(abs(p[i] - c[i]) <= tol for i in range(3))
rows = []
for mp4 in sorted(glob.glob(os.path.join(d, '*.mp4'))):
    png = mp4[:-4] + '-frame.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', mp4, '-frames:v', '1', png], check=True)
    im = Image.open(png).convert('RGB'); W, H = im.size; px = im.load()
    mag = []; yel = []
    for y in range(H):
        for x in range(W):
            p = px[x, y]
            if near(p, MAG, 14): mag.append((x, y))
            elif near(p, YEL, 14): yel.append((x, y))
    name = os.path.basename(mp4)[:-4]
    if len(mag) < 400 or len(yel) < 200:
        rows.append({'file': name, 'error': 'image not found in frame', 'magenta_px': len(mag), 'yellow_px': len(yel)}); continue
    allp = mag + yel
    x0 = min(p[0] for p in allp); x1 = max(p[0] for p in allp); y0 = min(p[1] for p in allp); y1 = max(p[1] for p in allp)
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    inset = max(2, int(0.004 * min(W, H)))
    corners = [(x0 + inset, y0 + inset), (x1 - inset, y0 + inset), (x0 + inset, y1 - inset), (x1 - inset, y1 - inset)]
    is_img = lambda p: near(p, MAG, 30) or near(p, YEL, 30)
    rounded = sum(0 if is_img(px[c]) else 1 for c in corners)
    yx0 = min(p[0] for p in yel); yx1 = max(p[0] for p in yel); yy0 = min(p[1] for p in yel); yy1 = max(p[1] for p in yel)
    sw, sh = yx1 - yx0 + 1, yy1 - yy0 + 1
    def band(a, b):
        v = []
        xs = range(x0 + int(bw * 0.25), x1 - int(bw * 0.25), 3)
        for y in range(y1 + a, min(H, y1 + b)):
            for x in xs:
                r, g, b_ = px[x, y]; v.append(0.2126 * r + 0.7152 * g + 0.0722 * b_)
        return sum(v) / len(v) if v else None
    near_b, far_b = band(1, 7), band(25, 36)
    rows.append({
        'file': name, 'frame': [x0, y0, bw, bh], 'frame_aspect': round(bw / bh, 3),
        'corners_rounded': f'{rounded}/4', 'subject_aspect': round(sw / sh, 3),
        'subject_height_ratio': round(sh / bh, 3),
        'shadow_delta': None if near_b is None or far_b is None else round(near_b - far_b, 2),
    })
print(json.dumps(rows, indent=1))
json.dump(rows, open(os.path.join(d, 'image-analysis.json'), 'w'), indent=1)
