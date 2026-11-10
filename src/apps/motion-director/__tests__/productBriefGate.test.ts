// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { buildProductBrief, classifyBusiness, decisionTable, type Material } from '../lib/productBrief';
import { needsOf, satisfies, sceneRecords, suitableFor } from '../lib/recipeNeeds';
import { gateStoryboard } from '../lib/storyboardGate';
import type { DirectorPlan } from '../lib/directorPlan';

const none: Material = { pages: 0, cards: 0, images: 0, videos: 0, logo: false, textLines: 0, documentBlocks: 0, music: false };
const id = (c: string) => MOTION_TEMPLATES.find((t) => t.componentName === c)!.id;
const brief = (prompt: string, material: Partial<Material> = {}, name = 'Acme') => buildProductBrief({ prompt, productName: name, durationSec: 30, aspectRatio: '16:9', material: { ...none, ...material }, hasSite: Boolean(material.pages) });

describe('stage 0: the brief reflects the business, not a software dashboard', () => {
  it('classifies restaurants, real estate, fitness and software from the prompt', () => {
    expect(classifyBusiness('A 30-second film for my bistro: our signature dishes and the tasting menu').kind).toBe('restaurant');
    expect(classifyBusiness('Make a luxury real estate video with these five photos of the beachfront villa').kind).toBe('real-estate');
    expect(classifyBusiness('Promo for our CrossFit gym: workouts and personal training').kind).toBe('fitness');
    expect(classifyBusiness('Launch video for our SaaS analytics dashboard with API integrations').kind).toBe('software');
    expect(classifyBusiness('hello').kind).toBe('unknown');
  });
  it('a real-estate brief has property restrictions and an image-based decision row; a software one does not', () => {
    const re = brief('Make a 25-second luxury real estate video with these five photos', { images: 5 }, 'Seaside Homes');
    expect(re.kind).toBe('real-estate');
    expect(re.restrictions.join(' ')).toMatch(/invented room counts/);
    const rows = decisionTable(re);
    expect(rows.some((r) => /5 supplied images/.test(r.requirement) && /visual subjects/.test(r.decision))).toBe(true);
    expect(rows.some((r) => /No software-dashboard recipes/.test(r.decision))).toBe(true);
    const sw = decisionTable(brief('Launch video for our SaaS dashboard', { pages: 3, cards: 8 }));
    expect(sw.some((r) => /No software-dashboard recipes/.test(r.decision))).toBe(false);
  });
  it('asks only for what cannot be inferred', () => {
    expect(brief('make a film', {}, '').missing.join(' ')).toMatch(/name of the business/);
    expect(brief('make a film for Acme', { images: 3 }).missing).toEqual([]);
  });
});

describe('recipe needs gate only on what a recipe reads', () => {
  it('maps recipes to the kind of material they read', () => {
    expect(needsOf('DeckDealFlyin').need).toBe('page');
    expect(needsOf('DocumentTypewriterReveal').need).toBe('document');
    expect(needsOf('MultiplaneReal').need).toBe('page');
    expect(needsOf('RadialWave').need).toBe('abstract');
  });
  it('uploaded photos satisfy an image shot with no website, but not a page-geometry shot', () => {
    const photos = { ...none, images: 5 };
    expect(satisfies('images', photos).ok).toBe(true);
    expect(satisfies('page', photos, 'projects.cards').ok).toBe(false);
    expect(satisfies('page', { ...none, pages: 1, cards: 8, parts: ['projects.cards'] }, 'projects.cards').ok).toBe(true);
    expect(satisfies('page', { ...none, pages: 1, cards: 2, parts: [] }, 'projects.cards').why).toMatch(/projects cards/);
    expect(satisfies('document', { ...none, documentBlocks: 3 }).ok).toBe(false);
    expect(satisfies('logo', none).ok).toBe(true);
  });
  it('does not suit a dashboard-row recipe to a restaurant without a captured site', () => {
    const t = MOTION_TEMPLATES.find((m) => m.category === 'ui-entrance' && !['SpotlightHeroCard'].includes(m.componentName))!;
    const ok = suitableFor(t.componentName, 'restaurant', none);
    expect(ok.ok).toBe(false);
  });
});

describe('the storyboard gate', () => {
  const plan = (recipes: string[]): DirectorPlan => ({ title: 't', summary: '', palette: { background: '#fff', text: '#000', accent: '#f50' }, scenes: [{ kind: 'title', recipeId: '', durationSec: 3, headline: 'Open', caption: '', transition: 'cut' }, ...recipes.map((r) => ({ kind: 'shot' as const, recipeId: id(r), durationSec: 5, headline: 'a', caption: 'b', transition: 'cut' as const })), { kind: 'title', recipeId: '', durationSec: 3, headline: 'End', caption: '', transition: 'cut' }] });
  it('keeps the person\'s own picks and reports a pick the material cannot support, instead of swapping it', () => {
    const b = brief('Use Deck Deal Fly-In to show my software', { images: 2 });
    const keep = new Set([id('DeckDealFlyin')]);
    const g = gateStoryboard(plan(['DeckDealFlyin']), { brief: b, keep, durationSec: 11 });
    expect(g.plan.scenes.some((s) => s.recipeId === id('DeckDealFlyin'))).toBe(true);
    expect(g.failed.join(' ')).toMatch(/deck.deal.flyin.*your pick/i);
  });
  it('rejects an unknown recipe id and an unsuitable length', () => {
    const b = brief('film for Acme', { pages: 1, cards: 8, parts: ['projects.cards'] });
    const bad = { ...plan(['SpotlightHeroCard']), scenes: [...plan(['SpotlightHeroCard']).scenes, { kind: 'shot' as const, recipeId: 'camera/not-a-real/Recipe', durationSec: 5, headline: '', caption: '', transition: 'cut' as const }] };
    const g = gateStoryboard(bad, { brief: b, keep: new Set(), durationSec: 90 });
    expect(g.failed.join(' ')).toMatch(/unknown recipe/);
    expect(g.items.find((i) => i.code === 'B1')?.ok).toBe(false);
  });
  it('builds a per-scene record from the storyboard: what each scene needs and whether it has it', () => {
    const recs = sceneRecords(plan(['DeckDealFlyin', 'SpotlightHeroCard']), { ...none, images: 3 });
    expect(recs.map((r) => r.component)).toEqual(['', 'DeckDealFlyin', 'SpotlightHeroCard', '']);
    expect(recs[1].assets.state).toBe('missing');
    expect(recs[1].needs).toBe('page');
    expect(recs[0].assets.state).toBe('satisfied');
  });
});
