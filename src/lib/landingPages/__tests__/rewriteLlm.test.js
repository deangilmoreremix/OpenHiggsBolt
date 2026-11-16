import { describe, it, expect, vi } from 'vitest';
import { buildRequest, rewriteWithOpenAi, RewriteError, SCHEMA } from '../server/rewriteLlm.js';

const ok = (obj) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(obj) } }] }), { status: 200 });
const KEY = 'sk-test0123456789';

describe('landing page AI rewrite (server, customer key)', () => {
  it('sends only ids, roles and texts with a strict JSON schema', async () => {
    const fetchImpl = vi.fn(async () => ok({ items: [{ id: 'a', text: 'Hello' }, { id: 'zzz', text: 'injected' }] }));
    const out = await rewriteWithOpenAi(KEY, { items: [{ id: 'a', role: 'headline', text: 'Hi', url: 'https://secret' }], instruction: 'friendlier' }, { fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(init.body);
    expect(body.response_format.json_schema).toMatchObject({ strict: true, name: 'landing_rewrite' });
    expect(JSON.stringify(body)).not.toContain('https://secret');
    expect(out).toEqual([{ id: 'a', text: 'Hello' }]); // unknown ids dropped
  });
  it('validates input', () => {
    expect(buildRequest({ items: [] }).error).toBeTruthy();
    expect(buildRequest({ items: [{ id: 'a', text: 'x'.repeat(800) }] }).error).toBeTruthy();
    expect(buildRequest({ items: Array.from({ length: 81 }, (_, i) => ({ id: `${i}`, text: 'a' })) }).error).toBeTruthy();
    expect(buildRequest({ items: [{ id: 'a', text: ' ' }] }).error).toBeTruthy();
    expect(SCHEMA.additionalProperties).toBe(false);
  });
  it('maps provider errors to codes', async () => {
    const run = (status, body = {}) => rewriteWithOpenAi(KEY, { items: [{ id: 'a', text: 'Hi' }] }, { fetchImpl: async () => new Response(JSON.stringify(body), { status }) }).catch((e) => e);
    expect(await run(401)).toMatchObject({ code: 'OPENAI_KEY_INVALID', status: 409 });
    expect(await run(429, { error: { code: 'insufficient_quota' } })).toMatchObject({ code: 'OPENAI_QUOTA' });
    expect(await run(429)).toMatchObject({ code: 'OPENAI_RATE' });
    expect(await run(500)).toMatchObject({ code: 'OPENAI_ERROR' });
    expect(await rewriteWithOpenAi(KEY, { items: [{ id: 'a', text: 'Hi' }] }, { fetchImpl: async () => ok({ nope: 1 }) }).catch((e) => e)).toBeInstanceOf(RewriteError);
  });
});
