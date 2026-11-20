import { describe, it, expect } from 'vitest';
import { getDemosForNiche, NICHE_IDS } from '../nicheDemos';
import { SOURCE_NICHE_IDS, resolveDemosForNiche } from '../nicheDemoSource';

describe('nicheDemos', () => {
  it('returns demos for real-estate and excludes miscategorized content', () => {
    const demos = getDemosForNiche('real-estate');
    console.log('Real estate demos:', demos.map(d => d.slug));
    expect(demos.length).toBeGreaterThan(0);
    expect(demos.map(d => d.slug)).not.toContain('greenhouse-tea-isekai-anime');
    expect(demos.map(d => d.slug)).not.toContain('flooded-village-survival-thriller');
    expect(demos.map(d => d.slug)).not.toContain('secret-agent-vfx-story');
  });

  it('returns demos for beauty', () => {
    const demos = getDemosForNiche('beauty');
    expect(demos.length).toBeGreaterThan(0);
  });

  const niches = [
    'ecommerce', 'restaurants-food', 'real-estate', 'beauty',
    'wellness-fitness', 'education', 'technology', 'finance',
    'entertainment-media', 'automotive', 'travel-hospitality',
    'sports-outdoors', 'general-business', 'viral-trending',
  ];

  it.each(niches)('%s has demos', (niche) => {
    const demos = getDemosForNiche(niche);
    expect(demos.length).toBeGreaterThan(0);
  });

  it('matches the source mapping (run `npm run generate:niche-demos` if this fails)', () => {
    expect(NICHE_IDS).toEqual(SOURCE_NICHE_IDS);
    for (const id of SOURCE_NICHE_IDS) {
      expect(getDemosForNiche(id)).toEqual(resolveDemosForNiche(id));
    }
  });
});
