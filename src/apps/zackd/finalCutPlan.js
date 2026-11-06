// Pure frame math + captions for the Zack D final cut (no Remotion imports, unit-tested).
export const FPS = 30;
export const WIDTH = 720;
export const HEIGHT = 1280;
export const TRANSITION_SEC = 0.35;
export const MUSIC_VOLUME = 0.126; // about -18 dB under narration
export const CLIP_VOLUME_UNDER_NARRATION = 0.25; // about -12 dB: the Veo sound sits under the voice

/** Level for the clips' own audio: full when it is the only sound, ducked when narration is present. */
export const clipVolumeFor = (hasNarration) => (hasNarration ? CLIP_VOLUME_UNDER_NARRATION : 1);

/** @param {{ src: string, duration: number, zoom?: boolean }[]} shots */
export function planFinalCut(shots, { fps = FPS, transitionSec = TRANSITION_SEC, keepClipAudio = true, hasNarration = false } = {}) {
  if (!Array.isArray(shots) || !shots.length) throw new Error('No clips to assemble.');
  const transitionFrames = shots.length > 1 ? Math.max(0, Math.round(transitionSec * fps)) : 0;
  const clips = shots.map((s, i) => {
    const frames = Math.round(s.duration * fps);
    if (frames <= transitionFrames) throw new Error(`Clip ${i + 1} is too short for the transition.`);
    return { src: s.src, frames, zoom: !!s.zoom };
  });
  const durationInFrames = clips.reduce((n, c) => n + c.frames, 0) - (clips.length - 1) * transitionFrames;
  return { clips, transitionFrames, durationInFrames, fps, width: WIDTH, height: HEIGHT, keepClipAudio: !!keepClipAudio, clipVolume: clipVolumeFor(hasNarration) };
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
