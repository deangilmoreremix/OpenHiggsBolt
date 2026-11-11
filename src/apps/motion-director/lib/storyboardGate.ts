import { MOTION_TEMPLATES, resolveMotionTemplate, type MotionTemplate } from '@/data/motionRecipeCatalog';
import { isBrandScene, type DirectorPlan, type MappingRow } from './directorPlan';
import { filmRuleViolations } from './shotRules';
import { recipeContract } from './recipeContract';
import { needsOf, satisfies, suitableFor } from './recipeNeeds';
import type { ProductBrief } from './productBrief';
import type { ReleaseItem } from './releaseCheck';

/**
 * The storyboard gate (upstream stage 3: validate before anything is built). Run on the plan the director wrote:
 *  1. every recipe exists in the library (the director may not invent names);
 *  2. every recipe suits the business and the material in hand — an unsuitable one the person did not name is swapped
 *     for a suitable one of the same family, and what could not be swapped is reported, never passed off;
 *  3. no sample-only recipe stands in for a personalised one;
 *  4. the length and the person's own picks hold.
 * What the gate decides becomes the source of truth the build reads (the plan it returns).
 */
export interface GateResult {
  plan: DirectorPlan;
  items: ReleaseItem[];
  swaps: string[];
  /** Checks that failed and could not be repaired: the storyboard is not releasable while any is listed. */
  failed: string[];
}

const shotName = (id: string) => (resolveMotionTemplate(id)?.nameEn ?? id);

const personalised = (stem: string) => ['tested', 'not-applicable'].includes(recipeContract(stem).personalizable);

export function gateStoryboard(
  plan: DirectorPlan,
  ctx: { brief: ProductBrief; keep: ReadonlySet<string>; mapping?: readonly MappingRow[] | null; durationSec: number; ground?: 'dark' | 'light' | null },
): GateResult {
  const { brief, keep } = ctx;
  let scenes = plan.scenes.map((s) => ({ ...s }));
  const swaps: string[] = [];
  const failed: string[] = [];
  const items: ReleaseItem[] = [];
  const used = new Set(scenes.map((s) => s.recipeId));

  // 1. Recipes exist.
  const unknown = scenes.filter((s) => s.kind === 'shot' && s.recipeId && !isBrandScene(s.recipeId) && !resolveMotionTemplate(s.recipeId));
  if (unknown.length) failed.push(`unknown recipe${unknown.length === 1 ? '' : 's'}: ${unknown.map((s) => s.recipeId).join(', ')}`);

  // 2 + 3. Suitable for the business and the material; a personalised recipe, not a sample-only one.
  scenes = scenes.map((s, i) => {
    if (s.kind !== 'shot' || !s.recipeId || isBrandScene(s.recipeId) || keep.has(s.recipeId)) return s;
    const t = resolveMotionTemplate(s.recipeId);
    if (!t) return s;
    const fit = suitableFor(t.componentName, brief.kind, brief.material);
    const sampleOnly = !personalised(t.componentName) && recipeContract(t.componentName).personalizable === 'sample-only';
    if (fit.ok && !sampleOnly) return s;
    const why = fit.ok ? 'it draws its own sample content and cannot show the business' : fit.why;
    const unique = MOTION_TEMPLATES.filter((m, k, all) => all.findIndex((x) => x.componentName === m.componentName) === k);
    const ok = (m: MotionTemplate) => !used.has(m.id) && suitableFor(m.componentName, brief.kind, brief.material).ok && personalised(m.componentName)
      && !filmRuleViolations(scenes.map((x, k) => (k === i ? { ...x, recipeId: m.id } : x)), keep, ctx.ground).some((v) => v.index === i);
    const byLength = (a: MotionTemplate, b: MotionTemplate) => Math.abs(a.durationSec - s.durationSec) - Math.abs(b.durationSec - s.durationSec);
    // The same family first; else any family that is not a seam, so a film is not left with a shot the material cannot support.
    const alt = unique.filter((m) => m.category === t.category && ok(m)).sort(byLength)[0] ?? unique.filter((m) => m.category !== 'transition' && ok(m)).sort(byLength)[0];
    if (!alt) {
      failed.push(`scene ${i + 1} (${t.nameEn}): ${why}, and no suitable shot of its kind was found`);
      return s;
    }
    used.add(alt.id);
    swaps.push(`scene ${i + 1}: ${t.nameEn} → ${alt.nameEn} (${why})`);
    return { ...s, recipeId: alt.id };
  });

  // The person's own picks are never swapped, but they are checked and any limitation is said.
  for (const id of keep) {
    const t = resolveMotionTemplate(id);
    if (!t) continue;
    const { need, part } = needsOf(t.componentName);
    const s = satisfies(need, brief.material, part);
    if (!s.ok) failed.push(`${t.nameEn} (your pick): ${s.why}`);
  }

  const out: DirectorPlan = { ...plan, scenes };
  const shots = scenes.filter((s) => s.kind === 'shot' && s.recipeId);
  items.push({ code: 'R', ok: !unknown.length, text: unknown.length ? `Not in the library: ${unknown.map((s) => s.recipeId).join(', ')}.` : `All ${shots.length} shots exist in the recipe library.` });
  items.push({ code: 'P4', ok: !failed.some((f) => /scene \d+/.test(f)), text: swaps.length ? `Swapped for the business: ${swaps.join('; ')}.` : 'Every shot suits the business and the material in hand.' });
  const total = scenes.reduce((n, s) => n + s.durationSec, 0);
  const lenOk = Math.abs(total - ctx.durationSec) <= Math.max(3, ctx.durationSec * 0.2);
  items.push({ code: 'B1', ok: lenOk, text: lenOk ? `Length ${Math.round(total)}s for the ${ctx.durationSec}s asked.` : `Length ${Math.round(total)}s is far from the ${ctx.durationSec}s asked.` });
  if (!lenOk) failed.push(`length ${Math.round(total)}s vs ${ctx.durationSec}s asked`);
  if (ctx.mapping?.length) {
    const cover = ctx.mapping.filter((r) => scenes.some((s) => s.recipeId === r.firstShot || s.recipeId === r.altShot));
    items.push({ code: 'F1', ok: cover.length === ctx.mapping.length, text: `${cover.length} of ${ctx.mapping.length} mapped features are in the storyboard (${ctx.mapping.map((r) => shotName(r.firstShot)).slice(0, 4).join(', ')}).` });
  }
  return { plan: out, items, swaps, failed };
}
