import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const routePath = '../../app/api/go-ai-viral/prompts/route.ts';

describe('prompts route (unit)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  function req(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return new Request(`http://localhost/api/go-ai-viral/prompts?${qs}`);
  }

  it('GET returns 200 with data', async () => {
    const jsonl = JSON.stringify({ id: '1', title: 'Test', prompt: 'hello', mediaType: 'image', categories: ['nature'], recommendedModel: 'gptimage', media: [], source: { publishedAt: '2024-01-01T00:00:00Z' }, provenance: { importedAt: '2024-01-01T00:00:00Z' } }) + '\n';
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      text: async () => jsonl,
      json: async () => ({ total: 1 }),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns 502 when JSONL fetch fails', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500 }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10' }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe('FEED_FETCH_ERROR');
  });

  it('skips malformed JSONL lines', async () => {
    const good = JSON.stringify({ id: '1', title: 'Good', prompt: 'hello', mediaType: 'image', categories: [], recommendedModel: 'gptimage', media: [], source: { publishedAt: '2024-01-01T00:00:00Z' }, provenance: { importedAt: '2024-01-01T00:00:00Z' } });
    const bad = 'not-json\n';
    const jsonl = bad + good + '\n';

    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      text: async () => jsonl,
      json: async () => ({ total: 1 }),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].title).toBe('Good');
  });

  it('mediaType filter works', async () => {
    const records = [
      { id: '1', title: 'Img', prompt: 'p', mediaType: 'image', categories: [], recommendedModel: 'gptimage', media: [], source: { publishedAt: '2024-01-01T00:00:00Z' }, provenance: { importedAt: '2024-01-01T00:00:00Z' } },
      { id: '2', title: 'Vid', prompt: 'p', mediaType: 'video', categories: [], recommendedModel: 'seedance', media: [], source: { publishedAt: '2024-01-01T00:00:00Z' }, provenance: { importedAt: '2024-01-01T00:00:00Z' } },
    ];
    const jsonl = records.map((r) => JSON.stringify(r)).join('\n') + '\n';

    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      text: async () => jsonl,
      json: async () => ({ total: 2 }),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10', mediaType: 'video' }));
    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].mediaType).toBe('video');
  });

  it('search filter matches prompt and title', async () => {
    const records = [
      { id: '1', title: 'Sunset', prompt: 'a beautiful sunset', mediaType: 'image', categories: [], recommendedModel: 'gptimage', media: [], source: { publishedAt: '2024-01-01T00:00:00Z' }, provenance: { importedAt: '2024-01-01T00:00:00Z' } },
      { id: '2', title: 'Forest', prompt: 'dark forest path', mediaType: 'image', categories: [], recommendedModel: 'gptimage', media: [], source: { publishedAt: '2024-01-01T00:00:00Z' }, provenance: { importedAt: '2024-01-01T00:00:00Z' } },
    ];
    const jsonl = records.map((r) => JSON.stringify(r)).join('\n') + '\n';

    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      text: async () => jsonl,
      json: async () => ({ total: 2 }),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10', search: 'sunset' }));
    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].title).toBe('Sunset');
  });

  it('sort newest first by default', async () => {
    const records = [
      { id: '1', title: 'Old', prompt: 'p', mediaType: 'image', categories: [], recommendedModel: 'gptimage', provenance: { importedAt: '2024-01-01T00:00:00Z' }, media: [], source: { publishedAt: '2024-01-01T00:00:00Z' } },
      { id: '2', title: 'New', prompt: 'p', mediaType: 'image', categories: [], recommendedModel: 'gptimage', provenance: { importedAt: '2024-06-01T00:00:00Z' }, media: [], source: { publishedAt: '2024-06-01T00:00:00Z' } },
    ];
    const jsonl = records.map((r) => JSON.stringify(r)).join('\n') + '\n';

    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      text: async () => jsonl,
      json: async () => ({ total: 2 }),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '1', pageSize: '10', sort: 'newest' }));
    const body = await res.json();
    expect(body.data[0].title).toBe('New');
  });

  it('pagination clamps page to totalPages', async () => {
    const records = [
      { id: '1', title: 'A', prompt: 'p', mediaType: 'image', categories: [], recommendedModel: 'gptimage', provenance: { importedAt: '2024-01-01T00:00:00Z' }, media: [], source: { publishedAt: '2024-01-01T00:00:00Z' } },
    ];
    const jsonl = records.map((r) => JSON.stringify(r)).join('\n') + '\n';

    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      text: async () => jsonl,
      json: async () => ({ total: 1 }),
    }));

    const mod = await import(routePath);
    const res = await mod.GET(req({ page: '999', pageSize: '10' }));
    const body = await res.json();
    expect(body.pagination.page).toBe(1);
    expect(body.data.length).toBe(1);
  });
});
