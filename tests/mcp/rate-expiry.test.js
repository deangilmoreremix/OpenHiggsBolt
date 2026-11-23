// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter, createMemoryRateStore, createSupabaseRateStore } from '../../packages/studio-mcp-core/src/index.js';
import { createMcpKey, resolveMcpKey, rotateMcpKey, expiryDays } from '../../lib/mcpKeys.js';
import { createHandler as gatewayHandler } from '../../lib/mcpGateway.js';
import { defaultRateLimiter } from '../../lib/mcpRateLimit.js';
import { mcpInstallSnippets } from '../../lib/mcpAccessClient.js';

const MU = 'mu_saved_key_0123456789abcdef';
const load = async () => ({ muapi: MU, openai: null });
function memoryStore() {
  const rows = [];
  return {
    rows,
    insert: async (r) => { const row = { id: crypto.randomUUID(), created_at: 'now', revoked_at: null, ...r }; rows.push(row); return row; },
    byHash: async (h) => rows.find((r) => r.key_hash === h && !r.revoked_at) || null,
    listForUser: async (u) => rows.filter((r) => r.clerk_user_id === u && !r.revoked_at),
    countActive: async (u) => rows.filter((r) => r.clerk_user_id === u && !r.revoked_at).length,
    revoke: async (u, id) => { const r = rows.find((x) => x.id === id && x.clerk_user_id === u && !x.revoked_at); if (r) r.revoked_at = 'now'; return !!r; },
    touch: async () => {},
  };
}

describe('rate limiter', () => {
  it('allows the limit, refuses the next call with a Retry-After, and starts fresh next minute', async () => {
    let t = Date.parse('2026-11-24T10:00:10Z');
    const l = createRateLimiter({ store: createMemoryRateStore(), perMinute: 3, now: () => t, brandName: 'SmartVideo GO' });
    for (let i = 0; i < 3; i++) expect((await l.check('k1')).ok).toBe(true);
    const over = await l.check('k1');
    expect(over).toMatchObject({ ok: false, retryAfter: 50 });
    expect(over.message).toMatch(/SmartVideo GO/);
    expect((await l.check('k2')).ok).toBe(true);
    t += 51_000;
    expect((await l.check('k1')).ok).toBe(true);
  });
  it('falls back when the shared store fails; the Supabase store calls the migration function', async () => {
    const l = createRateLimiter({ store: { hit: async () => { throw new Error('down'); } }, perMinute: 2 });
    expect([(await l.check('k')).ok, (await l.check('k')).ok, (await l.check('k')).ok]).toEqual([true, true, false]);
    const rpc = vi.fn(async () => ({ data: 7, error: null }));
    expect(await createSupabaseRateStore({ rpc }).hit('kid', 1_700_000_000_000)).toBe(7);
    expect(rpc.mock.calls[0][0]).toBe('mcp_rate_hit');
  });
  it('MCP_RATE_PER_MIN sets the default (120), and 0 turns it off', () => {
    expect(defaultRateLimiter({ env: {} }).perMinute).toBe(120);
    expect(defaultRateLimiter({ env: { MCP_RATE_PER_MIN: '30' } }).perMinute).toBe(30);
    expect(defaultRateLimiter({ env: { MCP_RATE_PER_MIN: '0' } })).toBeNull();
  });
});

describe('gateway applies the limit', () => {
  it('answers 429 + Retry-After past the limit, never throttles result polling, and never names the backend', async () => {
    const store = memoryStore();
    const { key } = await createMcpKey(store, { userId: 'u' });
    const limiter = createRateLimiter({ store: createMemoryRateStore(), perMinute: 2, brandName: 'SmartVideo GO' });
    const gw = gatewayHandler({ resolve: (raw) => resolveMcpKey(store, load, raw), studios: {}, env: {}, limiter });
    const call = (path) => gw({ httpMethod: 'GET', path, headers: { authorization: `Bearer ${key}` } });
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, text: async () => '{"balance":1,"status":"completed"}' }));
    expect((await call('/api/mcp-gateway/balance')).statusCode).toBe(200);
    expect((await call('/api/mcp-gateway/balance')).statusCode).toBe(200);
    const blocked = await call('/api/mcp-gateway/balance');
    expect(blocked.statusCode).toBe(429);
    expect(Number(blocked.headers['Retry-After'])).toBeGreaterThan(0);
    expect(blocked.body).not.toMatch(/mu-?api/i);
    expect((await call('/api/mcp-gateway/result/abc123')).statusCode).toBe(200);
    vi.unstubAllGlobals();
  });
});

describe('key expiry and rotation', () => {
  it('an expiring key works until its date, then stops like a revoked one', async () => {
    const store = memoryStore();
    const t0 = Date.parse('2026-11-24T00:00:00Z');
    const { key } = await createMcpKey(store, { userId: 'u', expiresInDays: 30, now: () => t0 });
    expect(store.rows[0].expires_at).toBe('2026-12-24T00:00:00.000Z');
    expect(await resolveMcpKey(store, load, key, { now: () => t0 + 29 * 86_400_000 })).toMatchObject({ userId: 'u' });
    expect(await resolveMcpKey(store, load, key, { now: () => t0 + 31 * 86_400_000 })).toBeNull();
  });
  it('keys without an expiry never expire', async () => {
    const store = memoryStore();
    const { key } = await createMcpKey(store, { userId: 'u' });
    expect('expires_at' in store.rows[0]).toBe(false);
    expect(await resolveMcpKey(store, load, key, { now: () => Date.now() + 10 * 365 * 86_400_000 })).not.toBeNull();
  });
  it('MCP_KEY_MAX_DAYS sets the default and caps what a user asks for', () => {
    const env = { MCP_KEY_MAX_DAYS: '90' };
    expect([expiryDays(undefined, env), expiryDays(365, env), expiryDays(7, env)]).toEqual([90, 90, 7]);
    expect(expiryDays(undefined, {})).toBeUndefined();
    expect(expiryDays(99999, {})).toBe(3650);
  });
  it('rotate makes the new key first, then revokes the old one', async () => {
    const store = memoryStore();
    const first = await createMcpKey(store, { userId: 'u', label: 'Claude' });
    const r = await rotateMcpKey(store, { userId: 'u', id: first.id });
    expect(r).toMatchObject({ label: 'Claude', replaced: first.id });
    expect(await resolveMcpKey(store, load, first.key)).toBeNull();
    expect(await resolveMcpKey(store, load, r.key)).toMatchObject({ userId: 'u' });
  });
  it('rotate works at the key limit, refuses someone else\'s key, and keeps the old key if the new one cannot be made', async () => {
    const store = memoryStore();
    let last;
    for (let i = 0; i < 10; i++) last = await createMcpKey(store, { userId: 'u' });
    expect((await createMcpKey(store, { userId: 'u' })).error).toBe('too_many_keys');
    expect((await rotateMcpKey(store, { userId: 'u', id: last.id })).key).toBeTruthy();
    expect(await rotateMcpKey(store, { userId: 'someone_else', id: last.id })).toMatchObject({ status: 404 });
    const failing = memoryStore();
    const made = await createMcpKey(failing, { userId: 'u' });
    const insert = failing.insert; failing.insert = async () => { throw new Error('db down'); };
    await expect(rotateMcpKey(failing, { userId: 'u', id: made.id })).rejects.toThrow();
    failing.insert = insert;
    expect(await resolveMcpKey(failing, load, made.key)).not.toBeNull();
  });
  it('the install snippets include the hosted command with the key', () => {
    const s = mcpInstallSnippets('sv_live_x');
    expect(s.http).toBe('claude mcp add --transport http smartvideo-go https://go.smartvid.app/api/mcp --header "Authorization: Bearer sv_live_x"');
  });
});
