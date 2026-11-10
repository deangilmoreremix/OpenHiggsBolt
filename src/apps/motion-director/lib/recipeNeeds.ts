import { MOTION_TEMPLATES, resolveMotionTemplate } from '@/data/motionRecipeCatalog';
import { isBrandScene } from './directorPlan';
import { LAYOUT_NEEDS, GEOMETRY_UNMAPPED } from './buildFilm';
import { drawsSampleScreen, isProductTextureShot } from './productShots';
import { recipeContract } from './recipeContract';
import recipeReads from './_generated/recipeReads.json';
import { DEMO_TEXTS } from '../demosrc/_generated/demoTexts';
import { SCREEN_BUSINESSES, type BusinessKind, type Material } from './productBrief';
import type { SceneRecord } from './productionRun';

/**
 * What a recipe actually requires of the person's material (upstream stage 4: the final capture is driven by the chosen
 * shots). Only the input a recipe really reads gates it: a shot that needs a live page is not blocked by a missing logo,
 * and a film of uploaded photographs is not blocked for having no website.
 */
export type Need = SceneRecord['needs'];

const READS = recipeReads as unknown as Record<string, { brand: boolean; textures: boolean; fixtures: boolean }>;

export function needsOf(stem: string): { need: Need; part?: string } {
  if (stem in GEOMETRY_UNMAPPED) return { need: 'document' };
  if (stem in LAYOUT_NEEDS) return { need: 'page', part: LAYOUT_NEEDS[stem] };
  if (isProductTextureShot(stem)) return { need: 'images' };
  const r = READS[stem] ?? { brand: false, textures: false, fixtures: false };
  const lines = DEMO_TEXTS[stem]?.length ?? 0;
  if (recipeContract(stem).personalizable === 'not-applicable') return { need: 'abstract' };
  if (r.brand && lines === 0) return { need: 'logo' };
  if (lines > 0 || r.brand) return { need: 'text' };
  return { need: 'none' };
}

/** Is the material in hand enough for this need? Returns why not. */
export function satisfies(need: Need, material: Material, part?: string): { ok: boolean; why?: string; refs: string[] } {
  switch (need) {
    case 'page':
      if (!material.pages) return { ok: false, why: 'it plays on the site\'s own page and no page was captured', refs: [] };
      if (part && !(material.parts ?? []).includes(part)) return { ok: false, why: `the captured page has no ${part.replace('.', ' ')} to land on`, refs: [] };
      return { ok: true, refs: [`${material.pages} page(s)`] };
    case 'images':
      return material.pages || material.images ? { ok: true, refs: [material.pages ? `${material.pages} page(s)` : '', material.images ? `${material.images} image(s)` : ''].filter(Boolean) } : { ok: false, why: 'it needs pictures (site pages or uploaded images)', refs: [] };
    case 'document':
      return material.documentBlocks >= 8 ? { ok: true, refs: [`${material.documentBlocks} text blocks`] } : { ok: false, why: 'it types out a document and the site gave too few text blocks to compose one', refs: [] };
    case 'text':
      return material.textLines > 0 ? { ok: true, refs: [`${material.textLines} text lines`] } : { ok: false, why: 'it needs words from the site or the brief', refs: [] };
    case 'logo':
    case 'abstract':
    case 'none':
      return { ok: true, refs: [] };
  }
}

/** A recipe may be chosen for a business: shots that draw a sample software screen do not suit a bakery or a villa. */
export function suitableFor(stem: string, kind: BusinessKind, material: Material): { ok: boolean; why?: string } {
  const t = MOTION_TEMPLATES.find((m) => m.componentName === stem);
  if (!t) return { ok: false, why: 'not in the recipe library' };
  if (drawsSampleScreen(t) && !SCREEN_BUSINESSES.has(kind) && !material.pages) return { ok: false, why: `it draws a sample app screen, which does not suit a ${kind.replace('-', ' ')} business` };
  const { need, part } = needsOf(stem);
  const s = satisfies(need, material, part);
  return s.ok ? { ok: true } : { ok: false, why: s.why };
}

/** The per-scene asset record of a storyboard (stage 4's input and stage 5's unit of work). */
export function sceneRecords(plan: { scenes: Array<{ kind: 'shot' | 'title'; recipeId: string }> }, material: Material): SceneRecord[] {
  return plan.scenes.map((sc, i): SceneRecord => {
    if (sc.kind === 'title') return { n: i + 1, recipeId: '', component: '', needs: 'text', assets: { state: 'satisfied', refs: ['title text'] }, personalization: 'parameterized', validation: { state: 'pending' } };
    if (isBrandScene(sc.recipeId)) return { n: i + 1, recipeId: sc.recipeId, component: '', needs: 'logo', assets: { state: 'satisfied', refs: [material.logo ? 'logo' : 'business name'] }, personalization: 'parameterized', validation: { state: 'pending' } };
    const t = resolveMotionTemplate(sc.recipeId);
    const stem = t?.componentName ?? '';
    const { need, part } = stem ? needsOf(stem) : { need: 'none' as Need, part: undefined };
    const sat = satisfies(need, material, part);
    return {
      n: i + 1,
      recipeId: sc.recipeId,
      component: stem,
      needs: need,
      assets: sat.ok ? { state: 'satisfied', refs: sat.refs } : { state: 'missing', refs: [], why: sat.why },
      personalization: need === 'abstract' || need === 'none' ? 'unmodified' : 'pending',
      validation: { state: 'pending' },
    };
  });
}
