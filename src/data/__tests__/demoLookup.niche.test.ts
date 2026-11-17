import { describe, it, expect } from 'vitest';
import { findDemoBySlug, resolveDemoById, resolveDemoBySlug } from '../demoLookup';
import { NICHE_DEMOS } from '../nicheDemos.generated';

const nicheDemos = Object.values(NICHE_DEMOS).flat();

describe('demoLookup: industry section demos', () => {
  it('includes demos the core catalogs do not have (the case that showed "Demo not found")', () => {
    expect(findDemoBySlug('luxury-mansion-sunset-retreat-ad')).toBeUndefined();
    expect(nicheDemos.some((d) => d.slug === 'luxury-mansion-sunset-retreat-ad')).toBe(true);
  });

  it('resolves every industry demo by slug (its /demo page) and by template id (its studio link)', async () => {
    for (const demo of nicheDemos) {
      expect((await resolveDemoBySlug(demo.slug))?.slug).toBe(demo.slug);
      expect((await resolveDemoById(`${demo.sourceRepo}|${demo.slug}`))?.slug).toBe(demo.slug);
    }
  });

  it('still reports unknown demos as missing', async () => {
    expect(await resolveDemoBySlug('no-such-demo')).toBeUndefined();
    expect(await resolveDemoById('seedance2prompt|placeholder')).toBeUndefined();
  });
});
