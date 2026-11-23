# JianYing project export: final cut → editable JianYing draft

Export the Remotion timeline as a JianYing (the mainland-China edition of CapCut) project file, so the user can, in JianYing,
keep changing caption content/font size/color, change the speed of/reorder/color-grade each shot, and adjust or replace SFX and
BGM. The motion inside shots (frame-by-frame procedural rendering) is beyond JianYing's asset + keyframe model and can only be baked.

**When to trigger**: after the final cut is delivered in any mode, as item 3 of the three "delivery wrap-up" items, tell
the user once — the final cut can be exported as a JianYing project file (to change captions, speed and audio in JianYing).
Run the procedure in this document when the user asks for it; when the user explicitly names "export a JianYing project", run it directly without confirming again.

**Platform prerequisites**: JianYing Pro 11.2 for Mac has been tested and passes (`jianying-export/mac_draft.py`);
the Windows version is implemented following the upstream-supported path but has not been verified on a real machine (`windows_draft.py`) — on first use,
run a smoke test first (see §6). After JianYing opens a plaintext draft, it upgrades it and saves it encrypted — a **one-way conversion**;
if you want to change things, change the export script and reinstall (idempotent overwrite); do not try to read back a draft that JianYing has modified.

## 1. Layering principle: what is editable, what is baked

| Layer | Form in JianYing | Editability |
|---|---|---|
| In-shot motion (camera moves/particles/3D/per-element choreography) | Baked into the plate | Whole-segment speed change/color grading only |
| Shot boundaries | The plate is cut into segments by shot (same file, different source_timerange) | Speed change/reorder/trim |
| Screen-space captions/narration | JianYing native text track | Content/font size/color fully open |
| SFX / BGM | JianYing audio tracks (with volume) | Fully open |
| Standalone elements named by the user (logo/counter etc.) | Optional: picture-in-picture layer | Position/size/opacity |

Brand motion moments (custom-choreographed text such as title lock-ins, logo lockups etc.) are baked by default — splitting them into
JianYing text loses the tuned entrance animation; only split them when the user explicitly asks for them to be editable, and explain the cost.

## 2. Rendering the plate

Add a `plate` inputProp to the Remotion project and render a clean plate **with no captions, no SFX and no BGM**.
Caption components use a `getInputProps()` gate (no need to pass props down layer by layer):

```tsx
// top of the caption component
import { getInputProps } from 'remotion';
const { plate } = getInputProps() as { plate?: boolean };
if (plate) return null;
```

```tsx
// unified audio gating in Root
{bgm && !plate && <Audio src={staticFile('audio/bgm.mp3')} volume={0.72} />}
{!plate && SFX.map(...)}
```

```bash
npx remotion render src/index.ts <CompId> out/plate.mp4 \
  --props='{"bgm":false,"plate":true}'
```

After rendering, extract frames and compare them with the same frames of the original (ffmpeg -ss): confirm the captions have been stripped and everything else is visually identical frame by frame.

## 3. Extracting the timeline data

Extract three tables from the Remotion project's constant tables (SHOTS in `theme.ts` / CAPTIONS and the
SFX table in Main.tsx), **recomputing the beat grid exactly in Python** — do not copy the approximate
frame numbers from comments:

```python
FPS = 30
BEAT0, BEAT_T = 0.0538, 0.47609        # exactly the same as theme.ts
def beatF(n): return round((BEAT0 + n * BEAT_T) * FPS)
def f2us(f): return round(f * 1_000_000 / FPS)   # frames → microseconds
```

- **Shot table** `(name, from frame, to frame)`: copy the SHOTS definition (including the off-beat
  boundaries pinned to real transients).
- **Caption table** `(Chinese, English, from frame, to frame)`: copy the actual arguments of each shot's caption component;
  **merge identical copy in adjacent shots into one segment** (the original video's continuation across shots).
- **SFX table** `(file, target beat, peak seconds, volume)`: copy Root's frame-pin table. JianYing plays audio
  at its placed position, so **do not carry over the Remotion-side output audio track offset compensation** (that compensates
  the encoding offset of Remotion's render output chain, see sound-design §4.6, and has nothing to do with JianYing playback):
  `start_f = beatF(beat) - round(peak_seconds * FPS)`.
  Copy explicit truncation durations for long samples (e.g. impacts that keep a reverb tail) as they are.

**Microsecond boundary iron rule**: the Timerange of adjacent segments must "round the start and end separately and then subtract"
(`Timerange(f2us(f0), f2us(f1) - f2us(f0))`). Rounding the start and the duration separately produces
1µs-level gaps/overlaps, and pyJianYingDraft immediately throws SegmentOverlap.

## 4. Building tracks (pyJianYingDraft 0.3.x)

Environment: `python3.11 -m venv .venv && pip install pyJianYingDraft`;
extracting the cover frame requires ffmpeg. Track-building skeleton (distilled from the accepted version of synapse-promo-v2):

```python
import pyJianYingDraft as draft

folder = draft.DraftFolder(STAGING)          # build into a staging directory first; installing into the library is a separate step
script = folder.create_draft(NAME, 1920, 1080, fps=FPS, allow_replace=True)
script.append_track(draft.TrackSpec(draft.TrackType.video, name="底片"))
script.append_track(draft.TrackSpec(draft.TrackType.audio, name="BGM"))
script.append_track(draft.TrackSpec(draft.TrackType.text, name="字幕EN"))
script.append_track(draft.TrackSpec(draft.TrackType.text, name="字幕ZH"))

# Cut the plate into segments: source = target, same range → each segment can be speed-changed/reordered individually in JianYing
plate = draft.VideoMaterial(PLATE)
for _name, f0, f1 in SHOTS:
    rng = draft.Timerange(f2us(f0), f2us(f1) - f2us(f0))
    script.add_segment(draft.VideoSegment(plate, rng, source_timerange=rng),
                       "底片")

# SFX: Remotion mixes overlapping audio automatically, but JianYing segments on the same track cannot overlap → greedy lane assignment
sfx_segs = []
for file, beat, peak_sec, volume in SFX:
    mat = draft.AudioMaterial(os.path.join(SFX_DIR, file))
    start_f = max(0, beatF(beat) - round(peak_sec * FPS))
    dur_us = min(f2us(截断帧数), mat.duration, f2us(TOTAL_F - start_f))
    sfx_segs.append((f2us(start_f), dur_us, mat, volume))
lanes, placed = [], []
for start, dur, mat, volume in sorted(sfx_segs):
    lane = next((i for i, end in enumerate(lanes) if end <= start), len(lanes))
    if lane == len(lanes): lanes.append(0)
    lanes[lane] = start + dur
    placed.append((lane, start, dur, mat, volume))
for i in range(len(lanes)):
    script.append_track(draft.TrackSpec(draft.TrackType.audio, name=f"SFX{i+1}"))
for lane, start, dur, mat, volume in placed:
    script.add_segment(draft.AudioSegment(mat, draft.Timerange(start, dur),
                                          volume=volume), f"SFX{lane+1}")

# BGM as one segment (copy the volume from Root)
bgm = draft.AudioMaterial(BGM)
script.add_segment(draft.AudioSegment(
    bgm, draft.Timerange(0, min(bgm.duration, f2us(TOTAL_F))), volume=0.72),
    "BGM")

# Split bilingual captions into two tracks: a text segment can only have one font size, so large Chinese and small English must be separated
for zh, en, f0, f1 in CAPTIONS:
    rng = draft.Timerange(f2us(f0), f2us(f1) - f2us(f0))
    script.add_segment(draft.TextSegment(zh, rng, **ZH_STYLE), "字幕ZH")
    script.add_segment(draft.TextSegment(en, rng, **EN_STYLE), "字幕EN")
script.save()
```

**Caption style conversion** (calibrated by testing on Mac 11.2):

- The unit of JianYing's `TextStyle(size=…)` ≈ **percentage of canvas height**: size 15 renders
  ≈150px @1080p. CSS pixel font size ÷ 10.8 ≈ JianYing size (64px → 6.0).
- `ClipSettings(transform_y=t)` is normalized to half the height, `screen_y = 540 × (1 − t)`:
  bottom caption area t ≈ −0.70 (y≈915) / −0.825 (y≈985).
- For a scrim background use `TextBackground(color="#FFFFFF", alpha=0.82, round_radius=0.35)`;
  colors are 0–1 float triples (#2C2C2C → (0.173,)*3).
- If no font is specified, JianYing's default is used; after export, remind the user they can switch fonts and fine-tune in JianYing — font size/
  position are approximations, and converge by tuning parameters and reinstalling after user feedback.

## 5. Installing into the JianYing draft library

```python
import mac_draft                      # Mac; on Windows use windows_draft
info = mac_draft.macify(draft_dir, DRAFT_NAME)   # adapts the three Mac pitfalls + packages media
bak = mac_draft.install(draft_dir, DRAFT_NAME, info)
```

The three pitfalls of the Mac version (mac_draft.py already handles all of them; read its docstring before changing the module):
the entry file name is `draft_info.json`; the meta's `draft_materials(type 0)` must register
all media (otherwise a "media missing" popup appears); the sandboxed app can only access `~/Movies`, so media must be packaged
into the draft's `Resources/` (otherwise "no access permission").

The Mac version's platform field needs the local machine's device fingerprint (device_id etc.); the module automatically copies it from old drafts in the draft library that are still
plaintext. **A brand-new machine often has no old plaintext drafts, in which case macify explicitly errors out
and aborts** (whether a draft without a fingerprint can be loaded by JianYing has not been tested) — following the error message, pass `donor_draft`,
or experimentally pass `allow_missing_fingerprint=True`, and feed the test results back into the module comments.

Windows version: `windows_draft.install(draft_dir, DRAFT_NAME)`, no registry;
if the list doesn't refresh, restart JianYing.

**Before installing, the user must fully quit JianYing** (Cmd+Q; osascript quit is ignored by JianYing;
do not force-kill it). The install script has built-in running detection. Uninstall: `mac_draft.uninstall(name)`.

## 6. Acceptance

1. Script self-check: read the installed `draft_info.json` and check the number of tracks/segments/duration; for the media registry,
   `os.path.exists` each entry and confirm all paths are inside the draft directory.
2. Three user-side checks: the whole video plays smoothly and SFX hit the beats; double-click a caption to change text/font size/color;
   change the speed of any one plate segment.
3. First use on a new machine/new JianYing version: first run `jianying-export/smoke_test.py`
   (minimal three-track draft injection), confirm it opens with no "content is corrupted" and no "media missing", then do the real video.
4. At delivery, explain: after JianYing saves, the draft is encrypted (one-way); if you want to change the caption scheme/shot splitting,
   go back to the export script, change the parameters and reinstall.
5. **Privacy**: the platform field of a Mac draft contains local device identifiers (device_id/
   hard_disk_id/mac_address). **Do not distribute the self-contained draft directory directly to others** —
   externally, deliver only the rendered final cut; if you really need to give someone an editable project, re-export it on their machine.
