import { describe, it, expect } from 'vitest';
import { getCreateUrl, type VideoDemo } from '../src/data/types';
import { findDemoById, parseTemplateId } from '../src/data/demoLookup';
import { MINIMAX_H3_DEMOS } from '../src/data/minimaxH3Demos';
import { SEEDANCE_25_DEMOS } from '../src/data/seedance25Demos';

const MINIMAX_DEMO = MINIMAX_H3_DEMOS[0] as VideoDemo;
const SEEDANCE_DEMO = SEEDANCE_25_DEMOS[0] as VideoDemo;

describe('getCreateUrl', () => {
  it('builds /studio/{tab}?template={sourceRepo}|{slug}', () => {
    const url = getCreateUrl(MINIMAX_DEMO);
    expect(url).toBe(
      '/studio/vfx-studio?template=' + encodeURIComponent(`${MINIMAX_DEMO.sourceRepo}|${MINIMAX_DEMO.slug}`)
    );
  });

  it('defaults tab to video when studioTab is missing', () => {
    const url = getCreateUrl({ ...MINIMAX_DEMO, studioTab: '' as any });
    expect(url).toBe('/studio/video?template=' + encodeURIComponent(`${MINIMAX_DEMO.sourceRepo}|${MINIMAX_DEMO.slug}`));
  });

  it('encodes special characters in templateId', () => {
    const url = getCreateUrl({ ...MINIMAX_DEMO, slug: 'hello world' });
    expect(url).toBe('/studio/vfx-studio?template=minimax-h3%7Chello%20world');
  });

  it('throws when sourceRepo is missing', () => {
    expect(() => getCreateUrl({ ...MINIMAX_DEMO, sourceRepo: '' as any })).toThrow();
  });
});

describe('parseTemplateId', () => {
  it('splits on pipe for hyphenated sourceRepo', () => {
    const result = parseTemplateId('minimax-h3|luxury-perfume-commercial');
    expect(result).toEqual({ sourceRepo: 'minimax-h3', slug: 'luxury-perfume-commercial' });
  });

  it('splits simple sourceRepo|slug', () => {
    const result = parseTemplateId('seedance-25|cinematic-story');
    expect(result).toEqual({ sourceRepo: 'seedance-25', slug: 'cinematic-story' });
  });

  it('returns undefined for missing pipe', () => {
    expect(parseTemplateId('noslug')).toBeUndefined();
  });

  it('returns undefined for empty parts', () => {
    expect(parseTemplateId('|slug')).toBeUndefined();
    expect(parseTemplateId('source|')).toBeUndefined();
  });
});

describe('findDemoById round-trip', () => {
  it('finds demo by sourceRepo|slug key using real demo', () => {
    const key = `${SEEDANCE_DEMO.sourceRepo}|${SEEDANCE_DEMO.slug}`;
    const found = findDemoById(key);
    expect(found).toBeDefined();
    expect(found?.id).toBe(SEEDANCE_DEMO.id);
  });

  it('returns undefined for unknown templateId', () => {
    expect(findDemoById('unknown|slug')).toBeUndefined();
  });
});

describe('template ID consistency', () => {
  it('getCreateUrl output is findable via findDemoById', () => {
    const url = getCreateUrl(SEEDANCE_DEMO);
    const match = url.match(/template=([^&]+)/);
    expect(match).toBeTruthy();
    const templateId = decodeURIComponent(match![1]);
    const found = findDemoById(templateId);
    expect(found).toBeDefined();
    expect(found?.id).toBe(SEEDANCE_DEMO.id);
  });
});
