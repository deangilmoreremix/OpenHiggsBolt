// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { BRAND_SCENES, buildCatalogBrief, validatePlan, type DirectorPlan } from '../lib/directorPlan';
import { planToProject } from '../lib/buildFilm';
import { restrictToRecipes } from '../lib/filmChat';
import { CARDS } from '../cards/registry';
import { parseWords } from '../cards/inkpress/title-card';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';

const scene = (recipeId: string, kind: 'shot' | 'title' = 'shot', headline = 'Line') => ({ kind, recipeId, durationSec: 4, headline, caption: '', transition: 'cut' as const });
const palette = { background: '#101018', text: '#ffffff', accent: '#8b6bff' };
const capture = { screens: ['https://img/page.jpg'], crops: ['https://img/c1.jpg'], title: 'Acme', sections: [0, 900, 1800], pageH: 4000, sectionNames: ['Hero', 'Features', 'Pricing'], nav: ['Video', 'Audio', 'Brand'], address: 'acme.com' };

describe('brand scenes', () => {
  it('every brand scene has a registered card and a catalog line', () => {
    const brief = buildCatalogBrief();
    for (const [id, b] of Object.entries(BRAND_SCENES)) {
      expect(CARDS[b.cardId], id).toBeTruthy();
      expect(brief).toContain(`${id} |`);
    }
  });

  it('validatePlan keeps brand scenes', () => {
    const plan = validatePlan({ title: 't', palette, scenes: [scene('brand/url-scan'), scene('brand/hub'), scene('brand/logo-reveal')] }, { targetSec: 12 });
    expect(plan.scenes.map((s) => s.recipeId)).toEqual(['brand/url-scan', 'brand/hub', 'brand/logo-reveal']);
  });

  it('builds the brand cards from the capture', () => {
    const plan: DirectorPlan = { title: 't', summary: '', palette, scenes: [scene('brand/url-scan'), scene('brand/hub', 'shot', 'Every studio'), scene('brand/feature-zoom', 'shot', 'Zoom'), scene('', 'title', 'Start *now*')] };
    const project = planToProject(plan, { aspectRatio: '16:9', capture, brand: { name: 'Acme', logo: 'https://img/logo.png', repo: 'acme.com' } });
    const clips = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId.startsWith('brand-'));
    expect(clips.map((c) => c.cardId)).toEqual(['brand-url-scan', 'brand-hub', 'brand-feature-zoom', 'brand-logo-reveal']);
    const byId = Object.fromEntries(clips.map((c) => [c.cardId, c.props]));
    expect(byId['brand-hub']).toMatchObject({ file: 'https://img/page.jpg', labels: 'Video\nAudio\nBrand\nHero\nFeatures\nPricing' });
    expect(byId['brand-url-scan']).toMatchObject({ url: 'acme.com' });
    expect(byId['brand-logo-reveal']).toMatchObject({ logo: 'https://img/logo.png', name: 'Acme', cta: 'Start now', url: 'acme.com' });
  });

  it('keeps picked-recipes films free of other recipes but lets brand scenes frame them', () => {
    const picks = MOTION_TEMPLATES.slice(0, 2);
    const plan: DirectorPlan = { title: 't', summary: '', palette, scenes: [scene('brand/url-scan'), scene(picks[0].id), scene('brand/hub'), scene(picks[1].id), scene('brand/logo-reveal')] };
    const out = restrictToRecipes(plan, picks, 30);
    const ids = out.scenes.map((s) => s.recipeId);
    expect(ids[0]).toBe('brand/url-scan');
    expect(ids[ids.length - 1]).toBe('brand/logo-reveal');
    expect(ids).not.toContain('brand/hub');
    expect(ids).toEqual(expect.arrayContaining([picks[0].id, picks[1].id]));
  });

  it('marks emphasis even with punctuation outside the stars', () => {
    expect(parseWords('Meet *Acme-bakery*.')).toEqual([{ text: 'Meet', accent: false }, { text: 'Acme-bakery.', accent: true }]);
  });
});
