import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const routePath = '../../app/api/go-ai-viral/seedance/route.ts';

describe('seedance route (unit)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  function req(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return new Request(`http://localhost/api/go-ai-viral/seedance?${qs}`);
  }

  const mockRecords = [
    {
      slug: 'test-video',
      prompt: 'a cinematic video of mountains',
      fullPrompt: 'a cinematic video of mountains with dramatic lighting',
      sourceLanguage: 'en',
      detailHref: '/detail/1',
      outputUrl: 'https://example.com/outputs/video1.mp4',
    },
    {
      slug: 'test-image',
      prompt: 'a still image of a cat',
      fullPrompt: 'a still image of a cat sitting on a wall',
      sourceLanguage: 'es',
      detailHref: null,
      outputUrl: null,
    },
  ];

  it('GET returns 200 with enriched records', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => JSON.stringify(mockRecords)),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(2);
    expect(json.meta.stats.total).toBe(2);
    expect(json.meta.stats.withVideo).toBe(1);
    expect(json.meta.stats.withPrompt).toBe(2);
  });

  it('enrichRecord adds categories and normalized detailHref', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => JSON.stringify(mockRecords)),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10' }));
    const json = await res.json();
    const video = json.data.find((r: any) => r.slug === 'test-video');
    expect(Array.isArray(video.categories)).toBe(true);
    expect(video.categories.length).toBeGreaterThan(0);
    expect(video.detailHref).toBe('https://go.smartvid.app/detail/1');
  });

  it('enrichRecord does NOT add fabricated author/publishedAt/engagement', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => JSON.stringify(mockRecords)),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10' }));
    const json = await res.json();
    const video = json.data.find((r: any) => r.slug === 'test-video');
    expect(video.author).toBeUndefined();
    expect(video.publishedAt).toBeUndefined();
    expect(video.engagement).toBeUndefined();
  });

  it('hasVideo=true filters to records with outputUrl', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => JSON.stringify(mockRecords)),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10', hasVideo: 'true' }));
    const json = await res.json();
    expect(json.data.length).toBe(1);
    expect(json.data[0].outputUrl).toBeTruthy();
  });

  it('hasPrompt=true filters to records with prompt text', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => JSON.stringify(mockRecords)),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10', hasPrompt: 'true' }));
    const json = await res.json();
    expect(json.data.length).toBe(2);
  });

  it('language filter works', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => JSON.stringify(mockRecords)),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10', language: 'es' }));
    const json = await res.json();
    expect(json.data.length).toBe(1);
    expect(json.data[0].slug).toBe('test-image');
  });

  it('search filter matches prompt and slug', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => JSON.stringify(mockRecords)),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10', search: 'mountains' }));
    const json = await res.json();
    expect(json.data.length).toBe(1);
    expect(json.data[0].slug).toBe('test-video');
  });

  it('pagination returns correct slice', async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      slug: `item-${i}`,
      prompt: `prompt ${i}`,
      fullPrompt: `full prompt ${i}`,
      sourceLanguage: 'en',
      outputUrl: i < 10 ? `https://example.com/v${i}.mp4` : null,
    }));

    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => JSON.stringify(many)),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '2', pageSize: '10' }));
    const json = await res.json();
    expect(json.data.length).toBe(10);
    expect(json.data[0].slug).toBe('item-10');
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.total).toBe(25);
    expect(json.pagination.totalPages).toBe(3);
  });

  it('returns 502 when data file is missing', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn(async () => { throw new Error('ENOENT'); }),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10' }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe('SEEDANCE_FETCH_ERROR');
  });
});
