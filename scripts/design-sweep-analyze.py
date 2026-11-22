#!/usr/bin/env python3
"""Judge the design sweep (e2e/personalization-design-sweep.spec.ts) and build per-category contact sheets.

Input : <out>/results.json and <out>/frames/<id>@<t>.png (480x270 frames at t = 1.0, 2.5, 4.0 s).
Method: for each sampled time the per-pixel MEDIAN over all designs is a near-clean copy of the footage (every design draws in
        a different place, and the frames share one export path, so they are frame-aligned with the same codec noise). A design
        "drew something" when, on a 96x54 area-averaged copy, enough of its blocks differ from that median. Full-frame designs
        (they cover the footage) are expected to differ everywhere and are flagged separately, never as a failure.
Output: <out>/analysis.json and contact sheets <out>/sheets/<category>-<n>.png (id label under each 16:9 tile, t = 2.5 s).
Usage : python3 scripts/design-sweep-analyze.py [out_dir] [categories.json]
        categories.json maps design id -> category (optional; written by the ledger step).
Numbers are a screen, not a verdict: the contact sheets must still be looked at.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else 'test-results/design-sweep'
CATS = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else {}
TIMES = ['1.0', '2.5', '4.0']
SMALL = (96, 54)
BLOCK_DIFF = 14        # mean abs channel difference that counts a block as changed
DREW_MIN = 0.004       # fraction of blocks changed at some time => "drew something"
COVER_MIN = 0.55       # fraction changed at some time => covers the footage (full-frame style)

results = json.load(open(os.path.join(OUT, 'results.json')))
frames_dir = os.path.join(OUT, 'frames')
ids = [r['id'] for r in results if r['status'] == 'pass']


def load(i, t, size=None):
    im = Image.open(os.path.join(frames_dir, f'{i}@{t}.png')).convert('RGB')
    if size:
        im = im.resize(size, Image.BOX)
    return np.asarray(im, dtype=np.float32)


small = {t: np.stack([load(i, t, SMALL) for i in ids]) for t in TIMES}
median = {t: np.median(small[t], axis=0) for t in TIMES}

analysis = {}
for k, i in enumerate(ids):
    fractions = []
    for t in TIMES:
        d = np.abs(small[t][k] - median[t]).mean(axis=2)
        fractions.append(float((d > BLOCK_DIFF).mean()))
    worst = max(fractions)
    analysis[i] = {
        'changedFractions': [round(f, 4) for f in fractions],
        'drew': worst >= DREW_MIN,
        'coversFootage': worst >= COVER_MIN,
    }

by_status = {'pass': 0, 'unsupported': 0, 'fail': 0}
for r in results:
    by_status[r['status']] = by_status.get(r['status'], 0) + 1
summary = {
    'designs': len(results), **by_status,
    'drewNothing': sorted(i for i, a in analysis.items() if not a['drew']),
    'coverFootage': sorted(i for i, a in analysis.items() if a['coversFootage']),
    'failed': [{'id': r['id'], 'reason': r.get('reason')} for r in results if r['status'] == 'fail'],
    'unsupported': [{'id': r['id'], 'reason': r.get('reason')} for r in results if r['status'] == 'unsupported'],
}
json.dump({'summary': summary, 'designs': analysis}, open(os.path.join(OUT, 'analysis.json'), 'w'), indent=2)

# Contact sheets: 4 columns x 4 rows of 16:9 tiles, grouped by category (or one run of sheets when no category map is given).
sheets = os.path.join(OUT, 'sheets')
os.makedirs(sheets, exist_ok=True)
groups = {}
for r in results:
    groups.setdefault(CATS.get(r['id'], 'all'), []).append(r)
TW, TH, COLS, ROWS = 320, 180, 4, 4
for cat, rows in groups.items():
    rows = [r for r in rows if r['status'] == 'pass']
    for page in range(0, len(rows), COLS * ROWS):
        chunk = rows[page:page + COLS * ROWS]
        sheet = Image.new('RGB', (COLS * TW, ROWS * (TH + 16)), (20, 20, 24))
        draw = ImageDraw.Draw(sheet)
        for n, r in enumerate(chunk):
            x, y = (n % COLS) * TW, (n // COLS) * (TH + 16)
            sheet.paste(Image.open(os.path.join(frames_dir, f"{r['id']}@2.5.png")).convert('RGB').resize((TW, TH)), (x, y))
            a = analysis[r['id']]
            tag = ' [drew nothing?]' if not a['drew'] else (' [full]' if a['coversFootage'] else '')
            draw.text((x + 3, y + TH + 2), (r['id'] + tag)[:50], fill=(235, 235, 235))
        sheet.save(os.path.join(sheets, f"{cat}-{page // (COLS * ROWS) + 1}.png"))

print(json.dumps(summary, indent=2))
