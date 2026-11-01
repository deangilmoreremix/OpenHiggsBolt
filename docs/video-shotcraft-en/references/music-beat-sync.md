# music-beat-sync — BGM Rhythm Analysis and Beat-Sync Methodology

For videos with strong-rhythm BGM, **all transitions and key motions must land on the beat**. This document gives the complete, reproducible workflow from
"getting a track" to "finished-video cut point error ≤3 frames". Measured result: a
70s, 18-shot, 131.97 BPM strong-drum promo made with this method had all cut point
errors ≤2.2f in the post-render back-test (the perceptual threshold is about 3f).

## Contents

- When to enable
- Beat grid measurement
- Drum-hit classification and energy structure
- Grid acceptance and artifacts
- Laying out the timeline in beat numbers
- Post-render back-test
- Tool notes

## 0. When to enable

In stage 0, first check whether the user has already specified music.
- Already chosen → follow this document: analyze the rhythm first, then anchor every cut point/motion in the storyboard to beat numbers
- Not chosen → BGM selection is deferred to stage 6 (see pipeline.md); in that case the motion timeline is laid out by
  content rhythm, without forcing beat sync

**Iron law: music first.** Don't design the storyboard until the grid has passed acceptance; when durations don't match, change
the timing parameters, don't delete or alter the user's copy. Throughout the analysis record moments in floating-point seconds; **conversion to frames happens only
at the final step of going into Remotion** (rounding early makes errors snowball through the pipeline).

## 1. Beat grid measurement (don't trust beat_track's tempo scalar)

Run a one-off script with `uv run --with librosa --with scipy --python 3.11`:

```python
import numpy as np, librosa

y, sr = librosa.load("bgm.mp3", sr=None, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, tightness=400, units="time")

# Key step: do a least-squares equally-spaced grid fit on the beat sequence to find the real BPM and phase.
# The tempo scalar returned by beat_track can be off by 2%+ (measured 129.2 vs true value 131.97),
# but the beat time sequence it outputs is itself good — fit a straight line t_i = t0 + i*T to the whole sequence:
i = np.arange(len(beats))
A = np.vstack([i, np.ones_like(i)]).T
(T, t0), *_ = np.linalg.lstsq(A, beats, rcond=None)
bpm = 60.0 / T
residual = beats - (t0 + i * T)
print(f"BPM={bpm:.2f}  t0={t0:.4f}s  T={T:.5f}s  residual±{np.abs(residual).max()*1000:.0f}ms")
```

Acceptance criterion: residual ≤ ±15ms (within half a frame) means the track has machine drums and the grid is trustworthy;
a large residual means there are tempo-change sections, requiring segmented fitting.

**Half-time/double-time ambiguity must be checked**: beat detection often jumps between 2x/0.5x (70 BPM reported as
140). The criterion is not how it sounds but the drum-hit data in the next section — under the correct grid, kicks should
land mainly on whole beats; if half the kicks land on beats and half on half-beats, the grid is most likely twice as fast.
Score the three candidates 0.5x/1x/2x each by the §3 metrics, and pick the one with the highest coverage.

**For complex tracks, separate the drum stem first**: arrangements heavy in vocals/bass bury the drum attacks,
and both beat_track and onset will drift. The lightweight option `librosa.effects.hpss` takes the percussive
component; the heavy option Demucs separates the entire drum track (see §6); after that all drum-hit detection is done on the
drum stem, not on the full mix.

## 2. Drum-hit classification and energy structure (deciding what gets pinned to which beat)

### 2a. Three-way transient detection

Different drum pieces drive different types of motion; measure each frequency band separately (on the drum stem or the hpss
percussive component):

| Category | Frequency band | Motion it drives |
|------|------|-----------|
| kick | 40–160 Hz | Impact / slam / sudden shrink — the beat where the picture "gets hit" |
| snare | 150–500 Hz body + 1–3 kHz attack (both required) | Replace / flash cut / composition switch — the beat that "changes to something else" |
| hihat | 6–14 kHz | Micro-motion density — in sections with dense hihat micro-motion can be dense; in sparse sections it must be held back |

```python
from scipy.signal import butter, sosfilt
def band_env(y, sr, lo, hi):
    sos = butter(4, [lo, hi], btype="band", fs=sr, output="sos")
    env = librosa.onset.onset_strength(y=sosfilt(sos, y), sr=sr)
    return env, librosa.times_like(env, sr=sr)

kick_env, times = band_env(y, sr, 40, 160)
# List the env energy at each whole-beat position and sort to find the strongest hits:
for n in range(int((times[-1]-t0)/T)):
    t = t0 + n*T
    e = kick_env[np.argmin(np.abs(times - t))]
    # Record (beat number n, energy e), take the top few as "big slam candidate beats"
```

Record the hits as a list of `{t seconds, s strength, k category}` and archive it; when designing the storyboard, draw from it by category.

**The hit table is a candidate pool, not a trigger.** Not every detected kick should get a picture
impact — in strong-drum tracks (tech-house type) there is a kick on almost every beat, and executing
"getting hit" on every beat is "the shots shake with the rhythm" (an actual user complaint, see aesthetic-rules R4).
The kick → impact mapping is only used to select §2b's strongest hits (2–3 in the whole video) from the candidate pool;
the other kicks serve only as **timing** references for cut points and element-level motion, not driving picture amplitude.

### 2b. RMS energy curve and structure table

Use `librosa.feature.rms` to pull the whole track's energy curve, and together with drum-hit density cut out section boundaries.
Produce two things for the design spec:

- **Music structure table**: from which beat the energy is full, at which beat the breakdown/silent sections are —
  the storyboard's energy curve should be laid out tightly against it (putting the brand breathing slot at the breakdown is a natural structure);
  shots in high-energy sections can run multiple layers of motion in parallel, low-energy sections are pared down to 1–2 layers
- **Strongest-hit beat number list**: the video's 2–3 biggest slams (opening/climax/close)
  must be pinned to these beats

**Easy mistake (actually stepped on)**: the biggest slam was pinned at b52.5 (between two beats) while the strongest
kick was on the whole beat b52, and the post-render back-test showed a deviation of +5.75f. In strong-drum tracks the accents are almost always on
whole beats; half-beat pins must be backed by env data, not by how it sounds.

## 3. Grid acceptance and artifacts (accept first, then storyboard)

Align each candidate grid (including 0.5x/1x/2x) with the nearest real drum-hit transients and compute four metrics:

| Metric | Meaning | Threshold |
|------|------|------|
| match | Proportion of grid beats hitting real transients | ≥98% |
| mean_abs_ms | Mean absolute alignment error | <10ms |
| drift | Slope of a linear regression of residuals against time (drift) | Cumulative over the whole track <5ms |
| First-beat validity | Whether beat 0 of the grid lands on a real musical attack | Required |

Pick the winning grid by score, and write **all candidates and the reasons for the winner** into the analysis artifacts for the record.
When unsure, synthesize a click track for each candidate grid and overlay it on the original track to listen, but the final decision is made
by the metrics, not by ear.

Analysis artifacts are archived with the project (they are the audit trail for every cut point):

```text
analysis/
  beat_data.json    # bpm, t0, T, beats[], hits[{t,s,k}], rms[], sections[]
  grid_drift.json   # match/error/drift of each candidate grid and the reason for the winner
  click_*.wav       # candidate click tracks (optional, for listening re-checks)
```

Moments in `beat_data.json` are always floating-point seconds, never pre-rounded; downstream depends only on
the field names `bpm / beats / hits / rms / sections`.

## 4. Write the timeline in beat numbers, not frame numbers

In the Remotion project, turn the grid into constants, and express all shot boundaries/motion keyframes with `beatF()`:

```ts
export const FPS = 30;
export const SOURCE_BEAT0 = 0.2244;  // source music analysis t0, seconds, consistent with beat_data.json
export const BEAT_INT = 0.45465;     // T, seconds
export const OUTPUT_AUDIO_OFFSET_SEC = 0; // fill in the measured value when the post-render back-test confirms an output audio track offset (§5b)
export const beatT = (n: number) =>
  SOURCE_BEAT0 + OUTPUT_AUDIO_OFFSET_SEC + n * BEAT_INT;           // beat → seconds
export const beatF = (n: number) => Math.round(beatT(n) * FPS);    // beat → frames

export const SHOTS = {
  s0_open:  { from: 0,        to: beatF(8) },
  s1_slam:  { from: beatF(8), to: beatF(16) },
  // …every shot boundary is beatF(whole beat); motion inside a shot uses local beats:
};
export const localBeat = (shot: {from: number}, n: number) => beatF(n) - shot.from;
```

Benefits: when changing the track/section, change two constants and the whole video is re-laid out; the SFX frame-pin table is also written with `beatF(n)`,
sharing the same source of truth as the picture, never misaligned. Source analysis values and render offsets are accounted for separately:
`SOURCE_BEAT0` is the audited true value and is never changed; the output offset only goes into `OUTPUT_AUDIO_OFFSET_SEC`.

**Anchor binding rules** (which use the grid, which use real transients):

- Dense regular cut points (a cut every beat/every two beats) → use the winning grid's `beatF(n)`
- Sparse accents, isolated freeze-frames → **pin to real transients**, not grid-interpolated points (tiny grid drift at sparse
  points gets magnified by a single accent into a perceptible deviation)
- Ending freeze-frame → the last real transient + RMS silence confirmation (to avoid pinning on the tail of the afterglow)
- Video assets/SFX are aligned by their **internal peak**, not by the file head:
  `asset start = target beat time − (peak time − trim offset)`; the peak is located with the audio energy
  envelope or FFmpeg frame differencing

Design conventions:
- Shot durations are in units of beats (4/8 beats per shot); accelerating sections can use half-beat/quarter-beat steps
  (e.g. the converging approach of CUT_BEATS = [48, 49.5, 50.5, 51, 51.25])
- Stepping-type shots with one action per beat (checklist item by item, mosaic cell by cell) map directly to beat numbers
- When the BGM drums are already dense, be restrained with SFX: only pin actions unique to the picture, give big slams to only 2–3 places,
  and yield the rest to the BGM drums
- **Whole-frame impacts have a hard cap** (whole-frame scale pumps / screen shake / flash frames / negative frames and all other
  momentary impacts acting on the whole frame or camera layer): ≤3 in the whole video, corresponding one-to-one with the §2b strongest-hit
  list, with ≥16 beats between any two adjacent ones; beat-pump-type consecutive hits ≤4 beats per instance
  and ≤1 instance in the whole video, followed by a full hold (the values noted on each card are the floor).
  The counting unit is **one use of a technique** (one application of a card = one slot); cards with
  multiple internal flash frames (consecutive flashes / multi-cut strings) are not counted again frame by frame; their internal
  structure is governed by each card's own parameter table and count limits
- **Beat-synced motion lands on the hero element layer by default** (cards/titles/numbers); the whole frame and camera layer
  don't take part in per-beat motion by default; "one action per beat" means content stepping (checklist item by item / mosaic
  cell by cell), not picture amplitude pulses
- Structural motion (morphing/camera moves/poses) uses continuous frame functions; impact events (appear/replace/
  flash/sudden shrink) switch on and off at the chosen frame. Multiple layers of motion hitting the same frame form an accent; if staggering,
  stagger by only 1–2 frames and it must be design intent, never an accidental misalignment from rounding

## 5. Post-render back-test (closed loop, mandatory)

### 5a. Report the two kinds of error separately; don't conflate them

- **Audio ground-truth error**: the distance between the designed cut point's seconds value and the real transient's seconds value; it validates the
  analysis pipeline; thresholds: mean <5ms, all within ±33ms, 90% within ±15ms
- **Visual quantization error**: the rounding error introduced by converting seconds values to the nearest renderable frame; it validates whether
  the frame rate is sufficient; the error at the `beatF()` rounding step is exactly this; record it per anchor

The upper bound of nearest-frame rounding error is determined by FPS: 30fps is ±16.7ms, 60fps is
±8.3ms, 120fps is ±4.2ms. **For 30fps deliveries don't claim visual precision of <5ms**;
when the quantization error report exceeds tolerance, raise the frame rate rather than changing the audio analysis.

### 5b. Extract the audio track from the rendered video for the back-test

```bash
ffmpeg -i out/promo.mp4 -vn -acodec pcm_s16le /tmp/render-audio.wav
```

Rerun step 1's grid fit on the rendered audio track (measure the BGM from the video, not from the source file —
that way audio encoding/alignment offsets are validated too), then compare one by one:
**designed cut point frame number vs the frame number of the nearest measured beat**, and output an error table.

| Verdict | Error |
|------|------|
| Pass | ≤3f (perceptual threshold) |
| Ideal | ≤1.5f |
| Must fix | Any cut point >3f |

Pins exceeding the error threshold go back to step 4 to change the beat number or frame offset, re-render and re-measure, until the whole table passes.

**For systematic same-direction offset, first check the output audio track offset; don't hand-edit point by point.** If the error table shows a same-direction,
equal-magnitude offset (all cut points consistently +N frames), the root cause is almost always the audio track
offset in the render output chain (AAC encoder priming and other encoding/muxing steps, typically ≈1.28f at 48kHz;
for the mechanism and measurement method see sound-design §4.6), not a wrong beat analysis. Diagnosis: do
normalized cross-correlation between the BGM original file and the rendered audio track to measure the offset. Fix: **set the output offset
as a separate constant; don't write it back into the source analysis value** — t0 in `beat_data.json` is the source music's
analyzed true value and audit baseline; mixing in a render offset will cause double
compensation when changing codec/re-analyzing. Account for them separately in code:

```ts
export const SOURCE_BEAT0 = 0.2244;        // source music analysis t0, consistent with beat_data.json, never mixed with render offset
export const OUTPUT_AUDIO_OFFSET_SEC = 0.0427; // output audio track offset, measured per render pipeline (sound-design §4.6)
export const beatT = (n: number) => SOURCE_BEAT0 + OUTPUT_AUDIO_OFFSET_SEC + n * BEAT_INT;
```

All cut points in the video return to place at once via `beatT`; **don't hand-edit beat numbers per anchor**; compensation on the SFX side
uses the same constant from sound-design §4.6. The perceptual harm of this kind of misalignment is not just "imprecise":
when impact frames are off by 2–3 frames you can't hear that they follow the drum, and reasonable beat-synced motion gets read as unprovoked shake.

## 6. Tool notes

- librosa is not in the system python: `uv run --with librosa --with scipy --python 3.11 script.py`
- For tracks with only vocals/complex arrangements beat_track drifts: first use `librosa.effects.hpss`
  to separate the percussive component and then measure; if still not clean, bring in Demucs to separate the drum track —
  `uvx --from demucs demucs --two-stems=drums -n htdemucs bgm.mp3 -o analysis/`,
  after which §1/§2 all run on `drums.wav`
- When BPM is unstable (cross-validation with multiple methods): madmom's RNN+DBN and Essentia's
  RhythmExtractor2013 can serve as second and third votes besides librosa; when the three don't agree,
  go back to §3 and vote by transient coverage; don't guess
- Tempo-changing tracks (DJ transitions, accelerando): first use librosa's local tempogram
  (about 5s window) to confirm the tempo-change points, then fit segment by segment by energy section, each segment with its own t0/T
