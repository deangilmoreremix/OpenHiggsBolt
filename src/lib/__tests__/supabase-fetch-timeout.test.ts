import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId: null }) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));

import { fetchWithTimeout } from '../supabaseServer';

// Regression: a stalled database call must fail fast (so the route answers
// with JSON) instead of running into Netlify's 30s HTML 504 page.
describe('fetchWithTimeout', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('aborts a request that never answers', async () => {
    globalThis.fetch = ((_input: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal!.reason));
      })) as typeof fetch;

    const started = Date.now();
    await expect(fetchWithTimeout(50)('https://db.example/rest/v1/app_users')).rejects.toBeTruthy();
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('passes through a normal response', async () => {
    globalThis.fetch = (async () => new Response('{"ok":true}')) as typeof fetch;
    const res = await fetchWithTimeout(1000)('https://db.example/rest/v1/app_users');
    expect(await res.json()).toEqual({ ok: true });
  });
});
