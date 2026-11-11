import type { ClipData, ProjectData } from '../types';
import type { DirectorPlan } from './directorPlan';
import { OUTPUT_AUDIO_OFFSET_F, type SoundIntent } from './buildFilm';
import { SFX_PEAKS } from '../demosrc/_generated/sfxPeaks';

/**
 * Stage 6 evidence, by INTENT. The method does not put a sound on every cut: a plain cut may stay silent or let the music
 * carry it, a title card may breathe, and a person may ask for no sound at all. What it requires is that a PLANNED cinematic
 * action (a hit, a styled seam, the finale's riser) has its sound, and that every sound is heard on the frame of the action it
 * belongs to. So each cue carries its intent (lib/buildFilm `SoundIntent`) and this module checks:
 *   missing      a planned action (a styled/flash/glitch seam in the plan) with no cue on it
 *   mistimed     a cue whose peak, once the output's audio delay is counted, is more than 3 frames from its action's frame
 *   unexpected   any sound in a film the person asked to be silent
 * and reports, without failing: optional accents that were sounded, plain cuts carried by music only, silent transitions,
 * and title cards left to breathe. It does not judge how the sound FEELS (not machine-verifiable).
 */
export type TransitionSound = 'sfx' | 'music-only' | 'silent' | 'omitted-by-design';

export interface SoundRecord {
  cues: Array<{ file: string; label: string; frame: number; second: number; intent: SoundIntent | null; peakFrame: number; offBy: number | null }>;
  music: { name: string; file: string } | null;
  /** Transitions between scenes, each with what carries it. */
  transitions: Array<{ boundary: number; second: number; kind: string; required: boolean; sound: TransitionSound; cue?: string }>;
  /** Planned actions (required transitions) and which of them have their sound on the right frame. */
  planned: number;
  satisfied: number;
  /** Seconds of planned actions with no sound. */
  missing: number[];
  /** Cues heard off their action's frame, by frames. */
  mistimed: Array<{ file: string; second: number; offBy: number }>;
  optionalSounded: number;
  musicOnly: number;
  silentTransitions: number;
  omittedByDesign: number;
  silentFilm: boolean;
  /** Sound present in a film that was to be silent. */
  unexpected: number;
  /** How many things are wrong: the sound stage fails on this alone. */
  problems: number;
  licence: { source: 'bundled library'; record: string; perProjectSourcing: false };
}

/** A transition kind that is itself a planned action (it has a hit or a styled move) and so needs its sound. */
export const ACTION_TRANSITIONS: ReadonlySet<string> = new Set(['flash', 'glitch', 'whip', 'wipe', 'barn', 'line', 'ink', 'push', 'window', 'portal', 'iris', 'dip', 'leak']);

const isAudio = (c: ClipData) => c.cardId === 'audio-clip';
const isSfx = (c: ClipData) => isAudio(c) && /sfxlib/.test(String(c.props?.file ?? ''));
const isMusic = (c: ClipData) => isAudio(c) && /bgmlib|^blob:/.test(String(c.props?.file ?? ''));
const lagF = (file: string, fps: number) => {
  const name = file.replace(/^.*sfxlib\//, '').replace(/\.mp3$/, '');
  return ((SFX_PEAKS[name]?.peakMs ?? 0) / 1000) * fps;
};
const TOLERANCE_F = 3;

export function soundRecord(project: ProjectData, opts: { plan?: DirectorPlan; silent?: boolean } = {}): SoundRecord {
  const fps = project.fps || 30;
  const all = project.tracks.flatMap((t) => t.clips);
  const shots = all.filter((c) => c.cardId.startsWith('demo:') || c.cardId.startsWith('brand-') || c.cardId === 'inkpress-title-card').sort((a, b) => a.start - b.start);
  const music = all.find(isMusic);
  const cues = all.filter(isSfx).map((c) => {
    const file = String(c.props?.file ?? '');
    const intent = (c.props?.intent as SoundIntent | undefined) ?? null;
    const trim = Number((c as { inOffset?: number }).inOffset ?? 0);
    const peakFrame = c.start - trim + lagF(file, fps) + OUTPUT_AUDIO_OFFSET_F;
    return { file, label: String(c.label ?? ''), frame: c.start, second: Math.round((c.start / fps) * 100) / 100, intent, peakFrame: Math.round(peakFrame * 10) / 10, offBy: intent ? Math.round((peakFrame - intent.frame) * 10) / 10 : null };
  });
  const mistimed = cues.filter((q) => q.offBy !== null && Math.abs(q.offBy) > TOLERANCE_F).map((q) => ({ file: q.file, second: q.second, offBy: q.offBy as number }));
  const silentFilm = Boolean(opts.silent);

  // The plan's transitions at the boundaries between shot scenes: which are planned actions, and what carries each.
  const scenes = opts.plan?.scenes ?? [];
  const transitions: SoundRecord['transitions'] = [];
  const boundaries = shots.slice(1).map((c) => c.start);
  boundaries.forEach((b, i) => {
    // A scene declares how it hands over to the next (`transition`), so the boundary after scene i is scenes[i].transition; without a plan every boundary is a plain cut.
    const kind = scenes.length === shots.length ? String(scenes[i]?.transition ?? 'cut') : 'cut';
    const required = ACTION_TRANSITIONS.has(kind);
    const near = cues.find((q) => q.intent?.anchor === 'cut' && Math.abs(q.intent.frame - b) <= 2);
    const inTitle = scenes.length === shots.length && scenes[i + 1]?.kind === 'title';
    const sound: TransitionSound = near ? 'sfx' : required ? 'silent' : inTitle ? 'omitted-by-design' : music ? 'music-only' : 'silent';
    transitions.push({ boundary: b, second: Math.round((b / fps) * 10) / 10, kind, required, sound, ...(near ? { cue: near.file } : {}) });
  });
  const requiredTs = transitions.filter((t) => t.required);
  const missing = silentFilm ? [] : requiredTs.filter((t) => t.sound !== 'sfx').map((t) => t.second);
  const unexpected = silentFilm ? cues.length + (music ? 1 : 0) : 0;
  const optionalSounded = transitions.filter((t) => !t.required && t.sound === 'sfx').length;
  const problems = missing.length + mistimed.length + unexpected;
  return {
    cues,
    music: music ? { name: String(music.label ?? 'music'), file: String(music.props?.file ?? '') } : null,
    transitions,
    planned: silentFilm ? 0 : requiredTs.length,
    satisfied: silentFilm ? 0 : requiredTs.length - missing.length,
    missing,
    mistimed,
    optionalSounded,
    musicOnly: transitions.filter((t) => t.sound === 'music-only').length,
    silentTransitions: transitions.filter((t) => t.sound === 'silent' && !t.required).length,
    omittedByDesign: transitions.filter((t) => t.sound === 'omitted-by-design').length,
    silentFilm,
    unexpected,
    problems,
    licence: { source: 'bundled library', record: 'public/motion-studio/sfxlib/ATTRIBUTION.md', perProjectSourcing: false },
  };
}
