import type { ClipData, ProjectData } from '../types';

/**
 * Stage 6 evidence: which sounds the film carries, which animation event each one belongs to, and whether the events of
 * the timeline (every cut between shots) have a sound at them. Derived from the project itself, so editing a scene and
 * rebuilding recomputes it; it is what the sound stage's output and the reviewer's audio check read.
 * It does not judge how the sound FEELS: that is not machine-verifiable and is reported as such.
 */
export interface SoundRecord {
  cues: Array<{ file: string; label: string; frame: number; second: number; event: string }>;
  music: { name: string; file: string } | null;
  /** Cuts between shots, and how many have a sound within `tolerance` frames of the cut. */
  cuts: number;
  cutsWithSound: number;
  /** Cuts with no sound near them (seconds). */
  silentCuts: number[];
  /** Sources and their licence records: the bundled library (public/motion-studio/sfxlib/ATTRIBUTION.md); per-project sourcing is not used. */
  licence: { source: 'bundled library'; record: string; perProjectSourcing: false };
}

const isSfx = (c: ClipData) => c.cardId === 'audio-clip' && /sfxlib/.test(String(c.props?.file ?? ''));
const isMusic = (c: ClipData) => c.cardId === 'audio-clip' && /bgmlib|^blob:/.test(String(c.props?.file ?? ''));

/** A cut's sound starts up to this many frames BEFORE the cut (its peak lands on the cut), or a few frames after it. */
const nearCutF = (cut: number, start: number) => start <= cut + 8 && start >= cut - 45;

export function soundRecord(project: ProjectData): SoundRecord {
  const all = project.tracks.flatMap((t) => t.clips);
  const shots = all.filter((c) => c.cardId.startsWith('demo:') || c.cardId.startsWith('brand-') || c.cardId === 'inkpress-title-card' || c.cardId === 'video-clip').sort((a, b) => a.start - b.start);
  const boundaries = shots.slice(1).map((c) => c.start);
  const fps = project.fps || 30;
  const cues = all.filter(isSfx).map((c) => {
    // The sound's peak lands lag frames after its start; the event is the nearest cut, else the shot it plays in.
    const frame = c.start;
    const nearCut = boundaries.find((b) => nearCutF(b, frame));
    const inShot = shots.find((s) => frame >= s.start && frame < s.start + s.duration);
    return { file: String(c.props?.file ?? ''), label: String(c.label ?? ''), frame, second: Math.round((frame / fps) * 100) / 100, event: nearCut !== undefined ? `cut at ${(nearCut / fps).toFixed(1)}s` : inShot ? `action in ${inShot.label ?? inShot.cardId}` : 'unplaced' };
  });
  const silent = boundaries.filter((b) => !cues.some((q) => nearCutF(b, q.frame)));
  const m = all.find(isMusic);
  return {
    cues,
    music: m ? { name: String(m.label ?? 'music'), file: String(m.props?.file ?? '') } : null,
    cuts: boundaries.length,
    cutsWithSound: boundaries.length - silent.length,
    silentCuts: silent.map((b) => Math.round((b / fps) * 10) / 10),
    licence: { source: 'bundled library', record: 'public/motion-studio/sfxlib/ATTRIBUTION.md', perProjectSourcing: false },
  };
}
