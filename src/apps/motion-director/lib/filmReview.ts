/**
 * The final review of a built film (upstream references/final-review.md), the part a program can
 * check: each item has the checklist's code, passes or fails, and names the second it is about.
 * The rest of the checklist (does the film say what the brief asked, is the picture sharp) needs
 * eyes; this report never says "all fine" for those.
 */
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import type { ProjectData } from '../types';
import { filmRuleViolations, rulesOf } from './shotRules';
import { reviewAgainstSpec } from './designSpec';

export interface ReviewItem {
  code: string;
  ok: boolean;
  text: string;
}

const sec = (frame: number, fps: number) => `${(frame / fps).toFixed(1)}s`;

export function reviewFilm(project: ProjectData): ReviewItem[] {
  const fps = project.fps;
  const clips = project.tracks.filter((t) => !t.hidden).flatMap((t) => t.clips);
  const shots = clips
    .filter((c) => c.cardId.startsWith('demo:'))
    .sort((a, b) => a.start - b.start)
    .map((c) => ({ c, template: MOTION_TEMPLATES.find((t) => t.componentName === c.cardId.slice(5)) }))
    .filter((x) => x.template);
  const items: ReviewItem[] = [];

  // F2: nothing plays twice; the shot cards' caps, exclusions and look family hold.
  const found = filmRuleViolations(shots.map((x) => ({ kind: 'shot' as const, recipeId: x.template!.id })));
  const repeats = found.filter((f) => /twice/.test(f.reason));
  items.push({ code: 'F2', ok: repeats.length === 0, text: repeats.length ? `The same recipe plays again at ${repeats.map((r) => sec(shots[r.index].c.start, fps)).join(', ')}.` : 'No recipe plays twice.' });
  const rest = found.filter((f) => !/twice/.test(f.reason));
  items.push({ code: 'S1', ok: rest.length === 0, text: rest.length ? rest.map((r) => `${sec(shots[r.index].c.start, fps)} ${shots[r.index].template!.nameEn}: ${r.reason}.`).join(' ') : 'The shot cards\' caps, exclusions and look family hold.' });

  // S3: a recipe is played at its tuned length (a slightly shorter scene may speed it up 25 %).
  const cut = shots.filter((x) => x.c.duration * x.c.speed < x.template!.durationInFrames * 0.78 && !rulesOf(x.template!.componentName)?.technique);
  items.push({ code: 'S3', ok: cut.length === 0, text: cut.length ? `Cut short before they finish: ${cut.map((x) => `${x.template!.nameEn} at ${sec(x.c.start, fps)}`).join(', ')}.` : 'Every recipe plays its whole motion.' });

  // B3: the closing scene holds for at least a second.
  const visual = clips.filter((c) => !c.cardId.startsWith('audio') && c.cardId !== 'inkpress-caption' && c.cardId !== 'site-inset' && !c.cardId.startsWith('inkpress-flash-cut') && !c.cardId.startsWith('inkpress-seam-') && !c.cardId.startsWith('bg-')).sort((a, b) => a.start - b.start);
  const last = visual[visual.length - 1];
  items.push({ code: 'B3', ok: !last || last.duration >= fps, text: last && last.duration < fps ? `The last scene (from ${sec(last.start, fps)}) holds only ${sec(last.duration, fps)}; the name needs at least 1 s.` : 'The film ends on a hold of at least 1 s.' });

  // R4: at most three flash cuts / whole-frame hits.
  const flashes = clips.filter((c) => c.cardId === 'inkpress-flash-cut' || c.cardId === 'inkpress-seam-glitch').length;
  items.push({ code: 'R4', ok: flashes <= 3, text: flashes > 3 ? `${flashes} flash cuts (at most 3).` : `${flashes} flash cut${flashes === 1 ? '' : 's'} (at most 3).` });

  // Q11: captions are readable on a phone (at least 5 % of the frame height).
  const small = clips.filter((c) => c.cardId === 'inkpress-caption' && Number(c.props.fontSize ?? 22) < project.height * 0.05);
  items.push({ code: 'Q11', ok: small.length === 0, text: small.length ? `${small.length} caption${small.length === 1 ? ' is' : 's are'} too small to read on a phone (from ${sec(small[0].start, fps)}).` : 'Captions are readable on a phone.' });

  // A7: no synthetic interface sounds.
  const synthetic = clips.filter((c) => c.cardId === 'audio-clip' && /sfxlib\/ui\/ui-/.test(String(c.props.file)));
  items.push({ code: 'A7', ok: synthetic.length === 0, text: synthetic.length ? `${synthetic.length} interface-alert sounds (they sound like a game).` : 'Sound effects are real objects and film vocabulary.' });

  // A8: with music, deliver it with and without.
  if (clips.some((c) => c.cardId === 'audio-clip' && !/sfxlib/.test(String(c.props.file)))) items.push({ code: 'A8', ok: true, text: 'Render both the version with music and the one without.' });
  return [...items, ...reviewAgainstSpec(project)];
}

/** The lines for the chat: what failed (with the second), and how many passed. */
export function reviewSummary(items: readonly ReviewItem[]): string[] {
  const failed = items.filter((i) => !i.ok);
  return [`Review against the shot cards' checklist: ${items.length - failed.length} passed${failed.length ? `, ${failed.length} to fix` : ''}.`, ...failed.map((i) => `- ${i.code} ✗ ${i.text}`)];
}
