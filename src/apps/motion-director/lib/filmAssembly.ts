import { motionCardId, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import { BRAND_SCENES, isBrandScene, type DirectorPlan } from './directorPlan';
import { isMusicTrack, projectEndFrame, type ClipData, type ProjectData } from '../types';

/**
 * Does the built film match the storyboard that was approved? Returns the problems (empty when it does):
 * the same shots in the same order, one scene per storyboard scene, shots back to back, a seam where the storyboard
 * asked for a transition, and every sound inside the film.
 */
export function checkAssembly(project: ProjectData, plan: DirectorPlan, opts: { videos?: number } = {}): { issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  const clips = project.tracks.flatMap((t) => t.clips);
  const isShot = (c: ClipData) => c.cardId.startsWith('demo:') || c.cardId === 'inkpress-title-card' || c.cardId === 'video-clip' || Object.values(BRAND_SCENES).some((b) => b.cardId === c.cardId);
  const shotTrack = project.tracks.find((t) => t.clips.some((c) => c.cardId.startsWith('demo:') || c.cardId === 'inkpress-title-card'));
  const shots = (shotTrack?.clips ?? []).filter(isShot).sort((a, b) => a.start - b.start);

  // One scene per storyboard scene (attached videos add their own).
  const expected = plan.scenes.length + (opts.videos ?? 0);
  if (shots.length < expected) issues.push(`${expected - shots.length} of the ${expected} storyboard scenes are missing from the film.`);
  else if (shots.length > expected) warnings.push(`The film has ${shots.length - expected} more scene${shots.length - expected === 1 ? '' : 's'} than the storyboard.`);

  // The recipes, in the order the storyboard gave them.
  const planned = plan.scenes
    .filter((s) => s.kind === 'shot' && s.recipeId && !isBrandScene(s.recipeId))
    .map((s) => {
      const t = resolveMotionTemplate(s.recipeId);
      return t ? motionCardId(t) : s.recipeId;
    });
  const built = shots.filter((c) => c.cardId.startsWith('demo:')).map((c) => c.cardId);
  if (JSON.stringify(planned) !== JSON.stringify(built)) {
    const lost = planned.filter((p) => !built.includes(p));
    issues.push(lost.length ? `Recipe${lost.length === 1 ? '' : 's'} in the storyboard but not in the film: ${lost.map((l) => l.replace(/^demo:/, '')).join(', ')}.` : 'The film plays its recipes in a different order than the storyboard.');
  }

  // Shots back to back.
  for (let i = 1; i < shots.length; i++) {
    const gap = shots[i].start - (shots[i - 1].start + shots[i - 1].duration);
    if (Math.abs(gap) > 1) issues.push(`Scenes ${i} and ${i + 1} ${gap > 0 ? `have a ${gap}-frame gap` : `overlap by ${-gap} frames`}.`);
  }

  // A seam where the storyboard asked for a transition (skipped next to an attached video, which the build leaves as a cut).
  const seams = clips.filter((c) => c.cardId === 'connected-seam');
  plan.scenes.slice(0, -1).forEach((scene, i) => {
    if (!scene.transition || scene.transition === 'cut') return;
    const boundary = shots[i + 1]?.start;
    if (boundary === undefined) return;
    const next = shots[i + 1];
    const prev = shots[i];
    if (prev?.cardId === 'video-clip' || next?.cardId === 'video-clip') return;
    if (!seams.some((s) => Math.abs(s.start + s.duration / 2 - boundary) <= 3)) warnings.push(`The ${scene.transition} transition after scene ${i + 1} has no seam in the film.`);
  });

  // Sound inside the film.
  // The film ends where its last scene ends (a sound clip that runs longer must not move the end).
  const end = shots.length ? Math.max(...shots.map((c) => c.start + c.duration)) : projectEndFrame(project);
  const audio = clips.filter((c) => c.cardId === 'audio-clip');
  const late = audio.filter((c) => c.start + c.duration > end + 1);
  if (late.length) issues.push(`${late.length} sound clip${late.length === 1 ? '' : 's'} run past the end of the film.`);
  const music = project.tracks.filter(isMusicTrack).flatMap((t) => t.clips);
  if (music.length && !music.some((c) => c.start <= 1 && c.start + c.duration >= end - 2)) warnings.push('The music does not cover the whole film.');
  return { issues, warnings };
}
