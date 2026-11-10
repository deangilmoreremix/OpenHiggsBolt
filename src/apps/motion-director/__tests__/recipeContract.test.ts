// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { classify, recipeContract, personalizableLabel, type SweepResult } from '../lib/recipeContract';

const result = (over: Partial<SweepResult> = {}): SweepResult => ({ renderable: true, supplied: 0, variance: 500, lines: 0, replaced: 0, neutral: 0, ...over });

describe('the recipe contract only calls a recipe personalizable when it was measured', () => {
  it('not measured is untested', () => {
    expect(classify('PageWaterfallWall', undefined)).toMatchObject({ renderable: null, personalizable: 'untested' });
  });

  it('a recipe that did not render is reported as such', () => {
    expect(classify('PageWaterfallWall', result({ renderable: false, error: 'boom' }))).toMatchObject({ renderable: false, personalizable: 'untested' });
  });

  it('a picture recipe whose supplied pictures filled a frame is tested', () => {
    expect(classify('PageWaterfallWall', result({ supplied: 0.25 }))).toMatchObject({ personalizable: 'tested' });
  });

  it('a picture recipe whose supplied pictures did not show is not tested-personalizable', () => {
    expect(classify('PageWaterfallWall', result({ supplied: 0.001 })).personalizable).toBe('sample-only');
  });

  it('a text recipe is tested when most lines were replaced, partly when few were, sample-only when none', () => {
    expect(classify('HitCounter', result({ lines: 14, replaced: 9 })).personalizable).toBe('tested');
    expect(classify('HitCounter', result({ lines: 14, replaced: 3 })).personalizable).toBe('partly');
    expect(classify('HitCounter', result({ lines: 14, replaced: 0 })).personalizable).toBe('sample-only');
  });

  it('records how much a film with no site words can replace', () => {
    expect(classify('HitCounter', result({ lines: 14, replaced: 9, neutral: 1 })).noSiteWords).toBeCloseTo(0.07, 2);
  });
});

describe('static facts of a recipe', () => {
  it('lists its assets, props, ratios and reference frames', () => {
    const c = recipeContract('PageWaterfallWall');
    expect(c.requiredAssets).toContain('pictures');
    expect(c.acceptedProps).toEqual(expect.arrayContaining(['accent', 'screens', 'crops']));
    expect(c.aspectRatios).toEqual({ native: ['16:9'], letterboxed: ['9:16', '1:1'] });
    expect(c.referenceFrames).toEqual(['/motion-studio/previews/PageWaterfallWall-a.jpg', '/motion-studio/previews/PageWaterfallWall-b.jpg', '/motion-studio/previews/PageWaterfallWall-c.jpg']);
  });

  it('a label never says personalizable for a recipe that was not measured', () => {
    expect(personalizableLabel('RecipeThatDoesNotExist')).not.toMatch(/^Personalizable/);
  });
});
