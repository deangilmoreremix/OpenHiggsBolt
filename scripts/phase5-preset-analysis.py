#!/usr/bin/env python3
"""Pixel evidence for the Image Overlay Styles presets in REAL exported MP4s.

Fixture pictures (e2e/personalization-phase5-image-presets.spec.ts): main = 3:2 magenta (#a33b6b)
with a yellow circle; collage extras = blue (#1f5fae)+white square, green (#1f8a70)+orange triangle,
purple (#6a3fb5)+yellow circle. For each preset directory <root>/<preset>/seedance1-cat-<ratio>.mp4
this extracts the settled frame (t=3.0 s) and, for animated presets, an in-animation frame (t=0.3 s)
and measures what the preset promises. usage: phase5-preset-analysis.py <root> [ratio ...]
"""
import glob, json, os, subprocess, sys
import numpy as np
from PIL import Image

root = sys.argv[1]; ratios = sys.argv[2:] or ['16x9', '9x16', '1x1', '4x5']
C = {'mag': (163, 59, 107), 'yel': (255, 212, 0), 'blue': (31, 95, 174), 'green': (31, 138, 112), 'purple': (106, 63, 181), 'white': (255, 255, 255)}

def frame(mp4, t):
    out = mp4[:-4] + f'-t{t}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', mp4, '-frames:v', '1', out], check=True)
    return np.asarray(Image.open(out).convert('RGB')).astype(int)

def mask(a, c, tol=16):
    return (np.abs(a - np.array(c)).max(axis=2) <= tol)

def bbox(m):
    ys, xs = np.where(m)
    if len(xs) < 300: return None
    return int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)

def corners_bg(a, bb, colors, inset=2):
    x, y, w, h = bb
    pts = [(x + inset, y + inset), (x + w - 1 - inset, y + inset), (x + inset, y + h - 1 - inset), (x + w - 1 - inset, y + h - 1 - inset)]
    return sum(0 if any(np.abs(a[py, px] - np.array(c)).max() <= 30 for c in colors) else 1 for px, py in pts)

rows = []
for d in sorted(glob.glob(os.path.join(root, '*/'))):
    preset = os.path.basename(d.rstrip('/'))
    for r in ratios:
        mp4 = glob.glob(os.path.join(d, f'*-{r}.mp4'))
        if not mp4: continue
        mp4 = mp4[0]; a = frame(mp4, 3.0); H, W, _ = a.shape
        row = {'preset': preset, 'ratio': r, 'file': os.path.basename(mp4), 'size': [W, H]}
        mag = mask(a, C['mag']); yel = mask(a, C['yel'])
        main = bbox(mag | yel)
        row['main_bbox'] = main
        if main:
            x, y, w, h = main
            row['main_aspect'] = round(w / h, 3)
            row['corners_not_image'] = f'{corners_bg(a, main, [C["mag"], C["yel"]])}/4'
        if preset == 'polaroid' and main:
            x, y, w, h = main
            white = mask(a, C['white'], 10)
            # white border thickness above / below the picture, measured on the centre column
            cx = x + w // 2
            col = white[:, cx]
            def run(start, step):
                n = 0; i = start
                while 0 <= i < H and col[i]: n += 1; i += step
                return n
            row['polaroid_white_top_px'] = run(y - 1, -1); row['polaroid_white_bottom_px'] = run(y + h, 1)
            # tilt: x of the picture's left edge near the top vs near the bottom
            def left_edge(yy):
                xs = np.where((mag | yel)[yy])[0]; return int(xs.min()) if len(xs) else None
            top_x, bot_x = left_edge(y + int(h * 0.1)), left_edge(y + int(h * 0.9))
            if top_x is not None and bot_x is not None: row['tilt_deg_est'] = round(float(np.degrees(np.arctan2(bot_x - top_x, 0.8 * h))), 2)
        if preset == 'circular-portrait' and main:
            row['circle_ok'] = abs(row['main_aspect'] - 1.0) < 0.05 and corners_bg(a, main, [C['mag'], C['yel']]) == 4
        if preset == 'multi-image-collage':
            tiles = {}
            for k in ('mag', 'blue', 'green', 'purple'):
                bb = bbox(mask(a, C[k]))
                if bb: tiles[k] = bb
            row['tiles_found'] = sorted(tiles)
            names = list(tiles)
            ov = 0
            for i in range(len(names)):
                for j in range(i + 1, len(names)):
                    A = tiles[names[i]]; B = tiles[names[j]]
                    w = min(A[0] + A[2], B[0] + B[2]) - max(A[0], B[0]); h = min(A[1] + A[3], B[1] + B[3]) - max(A[1], B[1])
                    if w > 4 and h > 4: ov += 1
            row['tile_overlaps'] = ov
        if preset.startswith('split-screen') and main:
            x, y, w, h = main
            row['split_panel_frac_w'] = round(w / W, 3); row['split_panel_frac_h'] = round(h / H, 3)
        if preset == 'soft-masked' and main:
            x, y, w, h = main
            yy = y + h // 2
            line = a[yy, x - 40:x + w + 40].astype(float)
            d = np.abs(line - np.array(C['mag'])).max(axis=1)
            inside = np.where(d < 20)[0]
            row['feather_px'] = int(len(np.where((d >= 20) & (d < 120))[0])) if len(inside) else None
            row['hard_corners_not_image'] = f'{corners_bg(a, main, [C["mag"], C["yel"]], inset=6)}/4'
        if preset in ('cinematic-reveal', 'split-screen', 'split-screen-perfume'):
            b = frame(mp4, 0.3)
            bm = bbox(mask(b, C['mag']) | mask(b, C['yel']))
            row['t0.3_bbox'] = bm
            if bm and main: row['reveal_fraction_t0.3'] = round(bm[2] / main[2], 3) if preset == 'cinematic-reveal' else round(bm[2] * bm[3] / (main[2] * main[3]), 3)
        rows.append(row)
print(json.dumps(rows, indent=1))
json.dump(rows, open(os.path.join(root, 'preset-analysis.json'), 'w'), indent=1)
