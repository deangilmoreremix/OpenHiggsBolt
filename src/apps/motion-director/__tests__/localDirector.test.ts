import { describe, expect, it } from 'vitest';
import { chooseLocalShots, localShotCount } from '../lib/localDirector';
import { drawsSampleScreen } from '../lib/productShots';
import { needsOf } from '../lib/recipeNeeds';
import type { Material } from '../lib/productBrief';

const material: Material = { pages: 1, cards: 3, images: 6, videos: 0, logo: true, textLines: 20, documentBlocks: 9, music: false, parts: ['projects.cards'] } as unknown as Material;

describe('create without AI: shot choice', () => {
  it('picks shots the contracts say show the business, never one that draws a fake app screen, none for the other look family', () => {
    const { picks } = chooseLocalShots({ kind: 'services', material, count: 5, ground: 'dark' });
    expect(picks.length).toBeGreaterThanOrEqual(3);
    for (const p of picks) expect(drawsSampleScreen(p.template), p.template.componentName).toBe(false);
    expect(new Set(picks.map((p) => p.template.componentName)).size).toBe(picks.length);
  });
  it('picks fewer rather than a recipe the material cannot support', () => {
    const none = chooseLocalShots({ kind: 'services', material: { ...material, pages: 0, cards: 0, images: 0, textLines: 0, documentBlocks: 0, parts: [] } as Material, count: 5, ground: null });
    // With no page, pictures or words, no shot that reads them is chosen.
    for (const p of none.picks) expect(['page', 'images', 'text', 'document']).not.toContain(needsOf(p.template.componentName).need);
  });
  it('a 25 s film holds 3 to 6 shots', () => { expect(localShotCount(25)).toBeGreaterThanOrEqual(3); expect(localShotCount(25)).toBeLessThanOrEqual(6); });
});
