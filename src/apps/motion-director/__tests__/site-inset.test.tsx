// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { siteInsetCard } from '../cards/site-inset';

describe('siteInsetCard definition', () => {
  it('has the expected id, name and category', () => {
    expect(siteInsetCard.id).toBe('site-inset');
    expect(siteInsetCard.name).toBe('Site inset');
    expect(siteInsetCard.category).toBe('effects');
    expect(siteInsetCard.durationInFrames).toBe(120);
  });

  it('declares schema fields for file, side, sizePct, label, accent', () => {
    const keys = siteInsetCard.schema.map((f) => f.key);
    expect(keys).toEqual(['file', 'side', 'sizePct', 'label', 'accent']);
    expect(siteInsetCard.schema.find((f) => f.key === 'side')?.type).toBe('select');
    expect(siteInsetCard.schema.find((f) => f.key === 'sizePct')?.type).toBe('number');
  });

  it('uses sensible defaults in the schema', () => {
    const file = siteInsetCard.schema.find((f) => f.key === 'file')!;
    expect(file.default).toBe('');
    const side = siteInsetCard.schema.find((f) => f.key === 'side')!;
    expect(side.default).toBe('right');
    const size = siteInsetCard.schema.find((f) => f.key === 'sizePct')!;
    expect(size.default).toBe(32);
    expect(size.min).toBe(10);
    expect(size.max).toBe(80);
  });
});

describe('site image source resolution', () => {
  it('keeps https:// URLs unchanged', () => {
    const src = (file: string) =>
      /^(?:blob:|data:|https?:\/\/)/i.test(file) ? file : `__static__/${file}`;
    expect(src('https://example.com/page.jpg')).toBe('https://example.com/page.jpg');
  });

  it('keeps data: URLs unchanged', () => {
    const src = (file: string) =>
      /^(?:blob:|data:|https?:\/\/)/i.test(file) ? file : `__static__/${file}`;
    expect(src('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123');
  });

  it('keeps blob: URLs unchanged', () => {
    const src = (file: string) =>
      /^(?:blob:|data:|https?:\/\/)/i.test(file) ? file : `__static__/${file}`;
    expect(src('blob:http://localhost/xyz')).toBe('blob:http://localhost/xyz');
  });

  it('prefixes local paths with the static path', () => {
    const src = (file: string) =>
      /^(?:blob:|data:|https?:\/\/)/i.test(file) ? file : `__static__/${file}`;
    expect(src('captures/page-1.jpg')).toBe('__static__/captures/page-1.jpg');
  });
});
