import { describe, it, expect } from 'vitest';
import { getDemosForNiche } from '../nicheDemos';

describe('nicheDemos audit', () => {
  const niches = [
    'ecommerce', 'restaurants-food', 'real-estate', 'beauty',
    'wellness-fitness', 'education', 'technology', 'finance',
    'entertainment-media', 'automotive', 'travel-hospitality',
    'sports-outdoors', 'general-business', 'viral-trending',
  ];

  it.each(niches)('%s has demos', (niche) => {
    const demos = getDemosForNiche(niche);
    console.log(`${niche}: ${demos.length} demos`);
    if (demos.length > 0) {
      console.log('  First:', demos[0].slug, '-', demos[0].title);
    }
    expect(demos.length).toBeGreaterThan(0);
  });
});
