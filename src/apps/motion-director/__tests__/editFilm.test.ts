// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { applyFilmEdits, parseFilmEdits, transplantAdaptation } from '../lib/editFilm';
import { buildProductBrief } from '../lib/productBrief';
import { planToProject } from '../lib/buildFilm';
import type { DirectorPlan } from '../lib/directorPlan';

const id = (c: string) => MOTION_TEMPLATES.find((t) => t.componentName === c)!.id;
const plan: DirectorPlan = { title: 't', summary: '', palette: { background: '#fff', text: '#000', accent: '#f50' }, scenes: [
  { kind: 'title', recipeId: '', durationSec: 3, headline: 'Open', caption: '', transition: 'cut' },
  { kind: 'shot', recipeId: id('SpotlightHeroCard'), durationSec: 6, headline: 'a', caption: 'b', transition: 'cut' },
  { kind: 'shot', recipeId: id('MultiplaneReal'), durationSec: 5, headline: 'a', caption: 'b', transition: 'cut' },
  { kind: 'title', recipeId: '', durationSec: 3, headline: 'End', caption: '', transition: 'cut' },
] };
const brief = buildProductBrief({ prompt: 'software dashboard platform', productName: 'Acme', durationSec: 17, aspectRatio: '16:9', hasSite: true, material: { pages: 1, cards: 8, images: 0, videos: 0, logo: true, textLines: 6, documentBlocks: 8, music: false, parts: ['projects.cards'] } });

describe('parsing scene-level edits', () => {
  it('reads keep / replace / dramatic ending from one message', () => {
    const e = parseFilmEdits('Keep the first scene, replace the second shot with a different camera movement, and make the ending more dramatic.', plan);
    expect(e).toEqual([{ kind: 'keep', scene: 1 }, { kind: 'replace', scene: 2, recipe: null, family: 'camera' }, { kind: 'dramatic-ending' }]);
  });
  it('a named recipe is the replacement; unrecognised text is no edit', () => {
    const e = parseFilmEdits('replace scene 3 with deck-deal-flyin', plan);
    expect(e[0]).toMatchObject({ kind: 'replace', scene: 3 });
    expect((e[0] as { recipe: { componentName: string } }).recipe.componentName).toBe('DeckDealFlyin');
    expect(parseFilmEdits('make it nicer', plan)).toEqual([]);
  });
});

describe('applying edits to the storyboard', () => {
  it('replaces only the named shot, with a different suitable one of the same family, and keeps the rest', () => {
    const r = applyFilmEdits(plan, parseFilmEdits('replace the second shot with a different camera movement', plan), { brief });
    expect(r.touched).toEqual([1]);
    expect(r.plan.scenes[1].recipeId).not.toBe(id('SpotlightHeroCard'));
    expect(MOTION_TEMPLATES.find((m) => m.id === r.plan.scenes[1].recipeId)?.category).toBe('camera');
    expect(r.plan.scenes[0]).toEqual(plan.scenes[0]);
    expect(r.plan.scenes[2]).toEqual(plan.scenes[2]);
  });
  it('refuses to replace a scene that was to be kept, and a title scene', () => {
    const r = applyFilmEdits(plan, parseFilmEdits('keep the second scene and replace the second shot with another', plan), { brief });
    expect(r.refused.join(' ')).toMatch(/to be kept/);
    const t = applyFilmEdits(plan, [{ kind: 'replace', scene: 1, recipe: null, family: null }], { brief });
    expect(t.refused.join(' ')).toMatch(/title or brand/);
  });
  it('a more dramatic ending changes the last cuts, adds a riser/impact cue and a longer hold', () => {
    const r = applyFilmEdits(plan, [{ kind: 'dramatic-ending' }], { brief });
    expect(r.plan.scenes.slice(-2).every((s) => s.transition === 'flash')).toBe(true);
    expect(r.plan.scenes[3].durationSec).toBe(4.5);
    expect(r.plan.scenes[3].sfx).toMatch(/riser/);
  });
  it('a recipe that does not suit the business is refused with the reason', () => {
    const shop = { ...brief, kind: 'restaurant' as const, material: { ...brief.material, pages: 0 } };
    const ui = MOTION_TEMPLATES.find((m) => m.category === 'ui-entrance' && m.componentName !== 'SpotlightHeroCard')!;
    const r = applyFilmEdits(plan, [{ kind: 'replace', scene: 2, recipe: ui, family: null }], { brief: shop });
    expect(r.refused.length).toBe(1);
  });
});

describe('rebuilding after an edit keeps the untouched shots\' adapted source', () => {
  it('transplants adaptedCode for unchanged scenes only', () => {
    const before = planToProject(plan, { aspectRatio: '16:9' });
    const tagged = { ...before, tracks: before.tracks.map((t) => ({ ...t, clips: t.clips.map((c) => (c.cardId.startsWith('demo:') ? { ...c, props: { ...c.props, adaptedCode: `// ${c.cardId}`, adaptedStem: c.cardId.slice(5) } } : c)) })) };
    const edited = applyFilmEdits(plan, [{ kind: 'replace', scene: 2, recipe: null, family: 'camera' }], { brief });
    const after = planToProject(edited.plan, { aspectRatio: '16:9' });
    const stems = new Set(edited.touched.map((i) => MOTION_TEMPLATES.find((m) => m.id === edited.plan.scenes[i].recipeId)!.componentName));
    const { project, kept } = transplantAdaptation(tagged, after, stems);
    expect(kept).toBe(1);
    const clips = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId.startsWith('demo:'));
    expect(clips.filter((c) => c.props?.adaptedCode).map((c) => c.cardId)).toEqual([`demo:MultiplaneReal`]);
  });
});
