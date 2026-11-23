// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHandler, RAW_ALLOWLIST } from '../../lib/mcpGateway.js';
import { createMcpKey, resolveMcpKey, hashKey, isMcpKey, newRawKey } from '../../lib/mcpKeys.js';

const handler = createHandler({ env: { MCP_ALLOW_BYOK: '1' } });

const KEY = 'mu_test_key_0123456789abcdef';
const ev = (method, path, body, headers = { authorization: `Bearer ${KEY}` }) => ({ httpMethod: method, path, headers, body: body ? JSON.stringify(body) : undefined });
const reply = (status, body) => ({ ok: status < 400, status, statusText: 'x', text: async () => JSON.stringify(body) });

afterEach(() => vi.unstubAllGlobals());

describe('mcp-gateway', () => {
  it('requires a bearer key', async () => {
    const r = await handler(ev('GET', '/api/mcp-gateway/balance', null, {}));
    expect(r.statusCode).toBe(401);
  });

  it('forwards generate with the caller key and rejects unsafe endpoints', async () => {
    const f = vi.fn(async () => reply(200, { request_id: 'r1' }));
    vi.stubGlobal('fetch', f);
    const ok = await handler(ev('POST', '/api/mcp-gateway/generate', { endpoint: '/nano-banana', payload: { prompt: 'x' } }));
    expect(JSON.parse(ok.body)).toEqual({ request_id: 'r1' });
    expect(f.mock.calls[0][0]).toBe('https://api.muapi.ai/api/v1/nano-banana');
    expect(f.mock.calls[0][1].headers['x-api-key']).toBe(KEY);
    for (const endpoint of ['../account', 'https://evil.test/x', '//evil', 'a b']) {
      const r = await handler(ev('POST', '/api/mcp-gateway/generate', { endpoint }));
      expect(r.statusCode).toBe(400);
    }
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('result: falls back to POST on 405 and brands upstream errors', async () => {
    const f = vi.fn()
      .mockResolvedValueOnce(reply(405, {}))
      .mockResolvedValueOnce(reply(200, { status: 'completed', outputs: ['https://x/y.png'] }));
    vi.stubGlobal('fetch', f);
    const r = await handler(ev('GET', '/.netlify/functions/mcp-gateway/result/abc-123'));
    expect(JSON.parse(r.body).status).toBe('completed');
    expect(f.mock.calls[1][1].method).toBe('POST');

    vi.stubGlobal('fetch', vi.fn(async () => reply(500, { detail: 'muapi.ai is down' })));
    const e = await handler(ev('POST', '/api/mcp-gateway/generate', { endpoint: 'x', payload: {} }));
    expect(e.statusCode).toBe(502);
    expect(e.body).not.toMatch(/mu-?api/i);
    expect(e.body).toContain('SmartVideo GO');
  });

  it('upload refuses non-https and private source URLs', async () => {
    vi.stubGlobal('fetch', vi.fn());
    for (const source_url of ['http://a.com/x.png', 'https://localhost/x', 'https://169.254.169.254/latest', 'https://user:pw@a.com/x']) {
      const r = await handler(ev('POST', '/api/mcp-gateway/upload', { source_url }));
      expect(r.statusCode).toBe(400);
    }
  });
});


function memoryStore() {
  const rows = [];
  return {
    rows,
    insert: async (r) => { const row = { id: crypto.randomUUID(), created_at: 'now', revoked_at: null, ...r }; rows.push(row); return row; },
    byHash: async (h) => rows.find((r) => r.key_hash === h && !r.revoked_at) || null,
    countActive: async (u) => rows.filter((r) => r.clerk_user_id === u && !r.revoked_at).length,
    touch: async (id) => { rows.find((r) => r.id === id).last_used_at = 'now'; },
  };
}

describe('mcp keys (SmartVideo GO)', () => {
  it('stores only a hash; resolves to the owner and their saved key; fails closed', async () => {
    const store = memoryStore();
    const made = await createMcpKey(store, { userId: 'user_1', label: 'Claude' });
    expect(isMcpKey(made.key)).toBe(true);
    expect(JSON.stringify(store.rows)).not.toContain(made.key);
    expect(store.rows[0].key_hash).toBe(hashKey(made.key));
    const loaded = [];
    const load = async (u) => { loaded.push(u); return { muapi: 'mu_saved_key_0123456789abcdef', openai: null }; };
    expect(await resolveMcpKey(store, load, made.key)).toMatchObject({ userId: 'user_1', keys: { muapi: 'mu_saved_key_0123456789abcdef' } });
    expect(await resolveMcpKey(store, load, newRawKey())).toBeNull();
    expect(await resolveMcpKey(store, async () => null, made.key)).toBeNull(); // user removed their saved key
    store.rows[0].revoked_at = 'now';
    expect(await resolveMcpKey(store, load, made.key)).toBeNull();
  });

  it('caps active keys per user', async () => {
    const store = memoryStore();
    for (let i = 0; i < 10; i++) await createMcpKey(store, { userId: 'u' });
    expect((await createMcpKey(store, { userId: 'u' })).error).toBe('too_many_keys');
  });
});

describe('mcp-gateway with MCP keys', () => {
  const MU = 'mu_saved_key_0123456789abcdef';
  const call = (h, path, body, token = 'sv_live_' + 'a'.repeat(43), method = 'POST') => h({ httpMethod: method, path, headers: { authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  const principal = { id: 'k1', userId: 'user_9', keys: { muapi: MU, openai: null } };

  it('uses the owner key upstream, never the token, and refuses a plan without access', async () => {
    const f = vi.fn(async () => reply(200, { request_id: 'r1' }));
    vi.stubGlobal('fetch', f);
    const h = createHandler({ resolve: async (t) => (t.endsWith('a'.repeat(43)) ? principal : null), authorize: async () => true, env: {} });
    expect((await call(h, '/api/mcp-gateway/generate', { endpoint: 'nano-banana', payload: {} })).statusCode).toBe(200);
    expect(f.mock.calls[0][1].headers['x-api-key']).toBe(MU);
    expect((await call(h, '/api/mcp-gateway/balance', null, 'sv_live_' + 'b'.repeat(43), 'GET')).statusCode).toBe(401);
    expect((await call(h, '/api/mcp-gateway/balance', null, MU, 'GET')).statusCode).toBe(401); // BYOK off by default
    const denied = createHandler({ resolve: async () => principal, authorize: async () => false, env: {} });
    const r = await call(denied, '/api/mcp-gateway/balance', null, undefined, 'GET');
    expect(r.statusCode).toBe(403);
    expect(r.body).not.toMatch(/mu-?api/i);
    const broken = createHandler({ resolve: async () => { throw new Error('db down'); }, env: {} });
    expect((await call(broken, '/api/mcp-gateway/balance', null, undefined, 'GET')).statusCode).toBe(503);
  });

  it('raw passthrough only reaches the workflow/agent calls the app makes', async () => {
    const f = vi.fn(async () => reply(200, { ok: 1 }));
    vi.stubGlobal('fetch', f);
    const h = createHandler({ resolve: async () => principal, env: {} });
    const raw = (method, path, body) => call(h, '/api/mcp-gateway/raw', { method, path, body });
    for (const [m, p] of [['GET', '/workflow/get-workflow-defs'], ['POST', '/workflow/abc_1/api-execute'], ['GET', '/workflow/run/r-1/api-outputs'], ['GET', '/agents/by-slug/my-agent'], ['POST', '/agents/by-slug/my-agent/chat']]) {
      expect((await raw(m, p, {})).statusCode, `${m} ${p}`).toBe(200);
    }
    expect(f.mock.calls[0][0]).toBe('https://api.muapi.ai/workflow/get-workflow-defs');
    f.mockClear();
    // a DELETE is destructive: refused for want of confirm before the allow-list is consulted (and still refused with it, see governor.test.js)
    expect((await raw('DELETE', '/workflow/delete-workflow-def/x', {})).statusCode).toBe(409);
    for (const [m, p] of [['POST', '/workflow/publish'], ['POST', '/agents/x'], ['GET', '/account/balance'], ['GET', '/workflow/../admin'], ['GET', '/workflow/a b/api-inputs'], ['GET', 'https://evil.test/x'], ['POST', '/workflow/x/api-inputs']]) {
      expect((await raw(m, p, {})).statusCode, `${m} ${p}`).toBe(400);
    }
    expect(f).not.toHaveBeenCalled();
    // DELETE is allowed only for the two deletes the app itself makes (a workflow definition, a generation's media); both are destructive and need confirm.
    expect(RAW_ALLOWLIST.filter(([m]) => m === 'DELETE').length).toBe(2);
    expect(RAW_ALLOWLIST.every(([m]) => ['GET', 'POST', 'DELETE'].includes(m))).toBe(true);
  });

  it('studio routes run as the key owner and scrub provider names', async () => {
    const seen = [];
    const studios = { demo: async (body, who) => { seen.push(who); return { statusCode: 200, body: JSON.stringify({ note: 'MuAPI is busy' }) }; } };
    const h = createHandler({ resolve: async () => principal, studios, env: {} });
    const r = await call(h, '/api/mcp-gateway/studio/demo', {});
    expect(r.body).toContain('SmartVideo GO is busy');
    expect(seen[0].userId).toBe('user_9');
    expect((await call(h, '/api/mcp-gateway/studio/constructor', {})).statusCode).toBe(404);
  });
});
