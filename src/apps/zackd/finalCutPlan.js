// Pure frame math + captions for the Zack D final cut (no Remotion imports, unit-tested).
export const FPS = 30;
export const WIDTH = 720;
export const HEIGHT = 1280;
export const TRANSITION_SEC = 0.35;
export const MUSIC_VOLUME = 0.126; // about -18 dB under narration
export const CLIP_VOLUME_UNDER_NARRATION = 0.25; // about -12 dB: the Veo sound sits under the voice

/** Level for the clips' own audio: full when it is the only sound, ducked when narration is present. */
export const clipVolumeFor = (hasNarration) => (hasNarration ? CLIP_VOLUME_UNDER_NARRATION : 1);

/**
 * Frame plan for the cut, following upstream assemble.py: every clip is used at its REAL length (`duration`) and its
 * own audio is kept at full level; transitions overlap clips by min(transition, clip, timeline) like upstream's xfade.
 * Our extensions: `trimToPlanned` cuts each clip to `planned`, `mixVoice` adds narration/music (clip sound ducked).
 * @param {{ src: string, duration: number, planned?: number, zoom?: boolean }[]} shots
 */
export function planFinalCut(shots, { fps = FPS, transitionSec = TRANSITION_SEC, keepClipAudio = true, mixVoice = false, hasNarration = false, trimToPlanned = false } = {}) {
  if (!Array.isArray(shots) || !shots.length) throw new Error('No clips to assemble.');
  const seconds = shots.map((s, i) => {
    const real = Number(s.duration);
    if (!(real > 0)) throw new Error(`Clip ${i + 1} has no usable duration.`);
    return trimToPlanned && s.planned > 0 ? Math.min(real, s.planned) : real;
  });
  const clips = shots.map((s, i) => ({ src: s.src, frames: Math.max(1, Math.round(seconds[i] * fps)), zoom: !!s.zoom }));
  const transitions = [];
  let timeline = seconds[0];
  for (let i = 1; i < clips.length; i += 1) {
    const d = Math.min(transitionSec, seconds[i], timeline); // upstream's rule
    // Remotion needs a transition shorter than both neighbouring sequences.
    const frames = Math.max(0, Math.min(Math.round(d * fps), clips[i - 1].frames - 1, clips[i].frames - 1));
    transitions.push(frames);
    timeline += seconds[i] - d;
  }
  const durationInFrames = clips.reduce((n, c) => n + c.frames, 0) - transitions.reduce((n, t) => n + t, 0);
  return {
    clips, transitions, durationInFrames, fps, width: WIDTH, height: HEIGHT,
    keepClipAudio: !!keepClipAudio, mixVoice: !!mixVoice, clipVolume: mixVoice ? clipVolumeFor(hasNarration) : 1,
  };
}

/** SRT captions, 6 words per cue, spread across each beat's on-screen window (no overlapping cues). */
export function buildSrt(beats, transitionSec = TRANSITION_SEC) {
  const ts = (sec) => {
    const ms = Math.max(0, Math.round(sec * 1000));
    const p = (v, l = 2) => String(v).padStart(l, '0');
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  let shotIndex = 0; let cursor = 0; let prevEnd = 0; let idx = 0;
  const out = [];
  (beats || []).forEach((b) => {
    const start = Math.max(cursor - shotIndex * transitionSec, prevEnd);
    let end = start;
    b.shots.forEach((s) => { end = cursor - shotIndex * transitionSec + s.duration_sec; cursor += s.duration_sec; shotIndex += 1; });
    end = Math.max(end, start + 0.1); prevEnd = end;
    const words = String(b.narration || '').split(/\s+/).filter(Boolean);
    const chunks = [];
    for (let i = 0; i < words.length; i += 6) chunks.push(words.slice(i, i + 6).join(' '));
    chunks.forEach((c, i) => {
      idx += 1;
      out.push(`${idx}\n${ts(start + ((end - start) * i) / chunks.length)} --> ${ts(start + ((end - start) * (i + 1)) / chunks.length)}\n${c}\n`);
    });
  });
  return out.join('\n');
}
