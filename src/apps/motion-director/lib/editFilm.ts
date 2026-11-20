import { MOTION_TEMPLATES, resolveMotionTemplate, type MotionTemplate } from '@/data/motionRecipeCatalog';
import type { ClipData, ProjectData } from '../types';
import { isBrandScene, type DirectorPlan, type DirectorScene } from './directorPlan';
import { findNamedRecipes } from './filmChat';
import { recipeContract } from './recipeContract';
import { suitableFor } from './recipeNeeds';
import type { ProductBrief } from './productBrief';

/**
 * Editing a finished film at the scene level (the storyboard is the source of truth): "keep the first scene, replace the second
 * shot with a different camera movement, make the ending more dramatic" changes the affected scenes of the plan, the film is
 * rebuilt from that plan (so timing, seams and sound cues are recalculated by the same code that built it), the shots the edit
 * did not touch keep their adapted source, and only the touched shots are checked again.
 */

export type FilmEdit =
  | { kind: 'replace'; scene: number; recipe: MotionTemplate | null; family: MotionTemplate['category'] | null }
  | { kind: 'dramatic-ending' }
  | { kind: 'keep'; scene: number };

const ORDINALS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, last: -1, final: -1, opening: 1, closing: -1 };
const sceneNo = (word: string, total: number): number | null => {
  const w = word.toLowerCase();
  if (/^\d+$/.test(w)) return Number(w);
  const o = ORDINALS[w];
  return o === undefined ? null : o < 0 ? total : o;
};

const FAMILY_WORDS: Array<[RegExp, MotionTemplate['category']]> = [
  [/\bcamera|movement|move|push|zoom|pan|orbit|dolly\b/i, 'camera'],
  [/\btransition|wipe|cut\b/i, 'transition'],
  [/\btype|text|title|typograph/i, 'typography'],
  [/\bimpact|burst|effect|glow\b/i, 'effects'],
  [/\boutro|ending|close|closing|finale\b/i, 'outro'],
];

/** Read the scene-level edits out of one message. Unrecognised parts are simply not edits (nothing is guessed). */
export function parseFilmEdits(text: string, plan: DirectorPlan): FilmEdit[] {
  const total = plan.scenes.length;
  const edits: FilmEdit[] = [];
  const named = findNamedRecipes(text);
  const sceneRef = '(\\d+|first|second|third|fourth|fifth|sixth|seventh|eighth|last|final|opening|closing)';
  for (const m of text.matchAll(new RegExp(`\\bkeep (?:the )?(?:${sceneRef}(?:st|nd|rd|th)? (?:scene|shot)|(?:scene|shot) (\\d+))`, 'gi'))) {
    const n = sceneNo(m[1] ?? m[2], total);
    if (n) edits.push({ kind: 'keep', scene: n });
  }
  for (const m of text.matchAll(new RegExp(`\\b(?:replace|swap|change|redo) (?:the )?(?:${sceneRef}(?:st|nd|rd|th)? (?:scene|shot)|(?:scene|shot) (\\d+))(?: (?:with|for|by|to) ([^,;]*))?`, 'gi'))) {
    const n = sceneNo(m[1] ?? m[2], total);
    if (!n) continue;
    const tail = m[3] ?? '';
    const recipe = findNamedRecipes(tail)[0] ?? (named.length === 1 ? named[0] : null);
    edits.push({ kind: 'replace', scene: n, recipe, family: recipe ? null : FAMILY_WORDS.find(([re]) => re.test(tail))?.[1] ?? null });
  }
  if (/\b(?:ending|finale|close|closing|last scene)\b[^.]*\b(?:dramatic|stronger|bigger|punchier|more impact)\b|\bmore dramatic (?:ending|finale)\b/i.test(text)) edits.push({ kind: 'dramatic-ending' });
  return edits;
}

export interface EditResult { plan: DirectorPlan; notes: string[]; /** 0-based scene indexes whose shot changed. */ touched: number[]; refused: string[] }

const personalised = (stem: string) => ['tested', 'not-applicable'].includes(recipeContract(stem).personalizable);

export function applyFilmEdits(plan: DirectorPlan, edits: FilmEdit[], ctx: { brief: ProductBrief }): EditResult {
  let scenes: DirectorScene[] = plan.scenes.map((s) => ({ ...s }));
  const notes: string[] = [];
  const refused: string[] = [];
  const touched: number[] = [];
  const kept = new Set(edits.filter((e): e is Extract<FilmEdit, { kind: 'keep' }> => e.kind === 'keep').map((e) => e.scene - 1));
  for (const e of edits) {
    if (e.kind === 'keep') { notes.push(`Kept scene ${e.scene}.`); continue; }
    if (e.kind === 'replace') {
      const i = e.scene - 1;
      const old = scenes[i];
      if (!old) { refused.push(`There is no scene ${e.scene}.`); continue; }
      if (kept.has(i)) { refused.push(`Scene ${e.scene} was to be kept, so I did not replace it.`); continue; }
      if (old.kind !== 'shot' || isBrandScene(old.recipeId)) { refused.push(`Scene ${e.scene} is a title or brand scene, not a shot; edit its text in the Workbench.`); continue; }
      const used = new Set(scenes.map((s) => s.recipeId));
      const from = resolveMotionTemplate(old.recipeId);
      let pick: MotionTemplate | undefined | null = e.recipe;
      if (pick) {
        const fit = suitableFor(pick.componentName, ctx.brief.kind, ctx.brief.material);
        if (!fit.ok) { refused.push(`${pick.nameEn} cannot be used here: ${fit.why}.`); continue; }
      } else {
        const family = e.family ?? from?.category;
        pick = MOTION_TEMPLATES.filter((m, k, all) => all.findIndex((x) => x.componentName === m.componentName) === k)
          .filter((m) => m.category === family && !used.has(m.id) && suitableFor(m.componentName, ctx.brief.kind, ctx.brief.material).ok && personalised(m.componentName))
          .sort((a, b) => Math.abs(a.durationSec - old.durationSec) - Math.abs(b.durationSec - old.durationSec))[0];
        if (!pick) { refused.push(`No other suitable ${family ?? ''} shot is available for scene ${e.scene}.`); continue; }
      }
      scenes[i] = { ...old, recipeId: pick.id, durationSec: pick.durationSec || old.durationSec, action: undefined };
      touched.push(i);
      notes.push(`Scene ${e.scene}: ${from?.nameEn ?? old.recipeId} → ${pick.nameEn}.`);
    }
    if (e.kind === 'dramatic-ending') {
      const last = scenes.length - 1;
      if (last < 1) { refused.push('The film is too short to build an ending.'); continue; }
      scenes = scenes.map((s, i) => (i >= last - 1 && !kept.has(i) ? { ...s, transition: 'flash' as const } : s));
      scenes[last] = { ...scenes[last], durationSec: Math.min(scenes[last].durationSec + 1.5, 8), sfx: 'riser into impact on the last cut' };
      notes.push('Ending: flash cuts into the last two scenes, a riser and impact on the last cut, and a longer final hold.');
    }
  }
  return { plan: { ...plan, scenes }, notes, touched, refused };
}

/**
 * After a rebuild: shots the edit did not touch keep the adapted source they had (adapting them again would cost minutes and
 * could change a shot the person approved). Matched by recipe and order among the same recipe. Returns how many were kept.
 */
export function transplantAdaptation(before: ProjectData, after: ProjectData, touchedStems: ReadonlySet<string> = new Set()): { project: ProjectData; kept: number } {
  const oldClips = before.tracks.flatMap((t) => t.clips).filter((c) => c.cardId.startsWith('demo:')).sort((a, b) => a.start - b.start);
  const nth = new Map<string, ClipData[]>();
  for (const c of oldClips) nth.set(c.cardId, [...(nth.get(c.cardId) ?? []), c]);
  const seen = new Map<string, number>();
  let kept = 0;
  const tracks = after.tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) => {
      if (!c.cardId.startsWith('demo:') || touchedStems.has(c.cardId.slice(5))) return c;
      const k = seen.get(c.cardId) ?? 0;
      seen.set(c.cardId, k + 1);
      const old = nth.get(c.cardId)?.[k];
      if (!old?.props?.adaptedCode) return c;
      kept++;
      return { ...c, props: { ...c.props, adaptedCode: old.props.adaptedCode, adaptedStem: old.props.adaptedStem } };
    }),
  }));
  return { project: { ...after, tracks }, kept };
}
