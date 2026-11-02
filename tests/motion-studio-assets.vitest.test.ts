import { describe, expect, it } from 'vitest';
import { pickMotionAssets } from '../src/server/motionAssets';
import { assetFileName, buildCaptureResponse } from '../src/server/motionCapture';
import type { DiscoveredAsset } from '../src/server/discoverAssets';
import type { PageCapture } from '../src/server/browserDiscovery';

const a = (id: string, category: DiscoveredAsset['category'], q = 80, extra: Partial<DiscoveredAsset> = {}): DiscoveredAsset => ({ id, sourceUrl: `https://x.test/${id}.jpg`, previewUrl: '', category, qualityScore: q, selected: true, recommended: true, rejected: false, ...extra });

describe('the asset finder for films', () => {
  it('puts people first, drops logos and junk, caps one kind, and never repeats a picture', () => {
    const found = [
      a('l', 'logo'), a('i', 'irrelevant'), a('s', 'storefront', 90),
      ...Array.from({ length: 7 }, (_, n) => a(`p${n}`, 'person', 70 + n)),
      a('pr', 'product', 60), a('dup', 'product', 59, { sourceUrl: 'https://x.test/pr.jpg' }), a('rej', 'team', 99, { rejected: true }),
    ];
    const picked = pickMotionAssets(found);
    expect(picked[0].category).toBe('person');
    expect(picked.filter((x) => x.category === 'person')).toHaveLength(7); // no per-kind limit
    expect(picked.some((x) => ['logo', 'irrelevant'].includes(x.category) || x.id === 'rej' || x.id === 'dup')).toBe(false);
    expect(picked.map((x) => x.category)).toEqual([...Array(7).fill('person'), 'product', 'storefront']);
    expect(pickMotionAssets(found, 3)).toHaveLength(3); // a caller may still ask for a limit
  });

  it('names stored files by type and puts the pictures with their labels in the response', () => {
    expect(assetFileName(0, 'image/png')).toBe('asset-1.png');
    expect(assetFileName(2, 'image/jpeg')).toBe('asset-3.jpg');
    const capture = { url: 'https://x.test/', title: 't', page: Buffer.from('p'), pageHeight: 1000, crops: [], images: [], routes: [], logo: null, cutouts: { nav: null, search: null, button: null }, emptyPlate: null, content: null, brand: {}, layout: { pageH: 1000, sections: [], cards: [] } } as unknown as PageCapture;
    const urls = new Map([['page.jpg', 'u/page.jpg'], ['asset-1.jpg', 'u/asset-1.jpg']]);
    const res = buildCaptureResponse(capture, urls, false, [{ name: 'asset-1.jpg', category: 'person', alt: 'Andrew Garnett' }, { name: 'asset-2.jpg', category: 'team', alt: '' }]);
    expect(res.assets).toEqual([{ url: 'u/asset-1.jpg', category: 'person', alt: 'Andrew Garnett' }]);
  });
});

describe('the crawl\'s logo', () => {
  it('prefers the image the site links home with, then the most confident logo, and ignores rejected ones', async () => {
    const { pickLogoAsset } = await import('../src/server/motionAssets');
    const logo = (id: string, o: Partial<DiscoveredAsset>) => a(id, 'logo', 50, o);
    expect(pickLogoAsset([a('x', 'person')])).toBeNull();
    expect(pickLogoAsset([logo('l1', { confidence: 90 }), logo('l2', { isSiteLogo: true, confidence: 40 })])?.id).toBe('l2');
    expect(pickLogoAsset([logo('l1', { confidence: 60 }), logo('l3', { confidence: 80 }), logo('r', { confidence: 99, rejected: true })])?.id).toBe('l3');
  });
});
