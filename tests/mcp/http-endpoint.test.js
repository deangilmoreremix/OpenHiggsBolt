// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { connectOverHttp, createGovernor, createMemoryGovernorStore, humanOnlyViolations } from '../../packages/studio-mcp-core/src/index.js';
import { createHttpHandler } from '../../lib/mcpHttp.js';
import { createHandler as createGateway } from '../../lib/mcpGateway.js';
import { createMcpKey, resolveMcpKey } from '../../lib/mcpKeys.js';
import { brand, endpointFixes } from '../../mcp/brand.js';
import { customTools } from '../../mcp/tools.js';
import catalogEntries from '../../mcp/catalog.json' with { type: 'json' };

const MU = 'mu_saved_key_0123456789abcdef';
function memoryStore() {
  const rows = [];
  return {
    rows,
    insert: async (r) => { const row = { id: crypto.randomUUID(), created_at: 'now', revoked_at: null, ...r }; rows.push(row); return row; },
    byHash: async (h) => rows.find((r) => r.key_hash === h && !r.revoked_at) || null,
    countActive: async (u) => rows.filter((r) => r.clerk_user_id === u && !r.revoked_at).length,
    touch: async () => {},
  };
}

async function setup(opts = {}) {
  const store = memoryStore();
  const key = (await createMcpKey(store, { userId: 'owner_1', label: 't' })).key;
  const load = async () => ({ muapi: MU, openai: null });
  const resolve = (raw) => resolveMcpKey(store, load, raw);
  const governor = createGovernor({ store: createMemoryGovernorStore() });
  const gateway = createGateway({ resolve, studios: {}, env: {}, governor });
  const handle = createHttpHandler({ brand, customTools, catalogEntries, endpointFixes, gateway, resolveCaller: resolve, ...opts });
  const fetchImpl = async (url, init) => handle(new Request(url, init));
  const connect = (k) => connectOverHttp({ url: 'https://site.test/api/mcp', fetchImpl, headers: k ? { Authorization: `Bearer ${k}` } : {} });
  return { key, handle, connect, store };
}

describe('hosted MCP over streamable HTTP (SmartVideo GO)', () => {
  it('refuses no key, a malformed key and an unknown key (401, branded); GET is 405', async () => {
    const t = await setup();
    const post = (auth) => t.handle(new Request('https://site.test/api/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...(auth ? { authorization: auth } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) }));
    for (const auth of [undefined, 'Bearer nope', 'Bearer sv_live_' + 'x'.repeat(43)]) {
      const res = await post(auth);
      expect(res.status).toBe(401);
      const text = await res.text();
      expect(text).toMatch(/SmartVideo GO/);
      expect(text).not.toMatch(/mu-?api/i);
    }
    expect((await t.handle(new Request('https://site.test/api/mcp', { method: 'GET' }))).status).toBe(405);
  });

  it('lists the same tools as stdio, no upstream name, nothing human-only', async () => {
    const t = await setup();
    const mcp = await t.connect(t.key);
    const { tools } = await mcp.listTools();
    expect(tools.length).toBeGreaterThan(50);
    expect(tools.every((x) => x.name.startsWith('smartvideo_'))).toBe(true);
    expect(JSON.stringify(tools)).not.toMatch(/mu-?api/i);
    expect(humanOnlyViolations(tools.map((x) => x.name))).toEqual([]);
  });

  it('runs a read tool through the in-process gateway and still enforces confirm', async () => {
    const t = await setup();
    const mcp = await t.connect(t.key);
    const studios = await mcp.callTool({ name: 'smartvideo_list_studios', arguments: {} });
    expect(studios.isError).toBeFalsy();
    expect(studios.content[0].text).not.toMatch(/mu-?api/i);
    const del = await mcp.callTool({ name: 'smartvideo_video_pages_delete', arguments: { id: 'abcdefgh12' } });
    expect(JSON.stringify(del.content)).toMatch(/confirm/i);
  });

  it('stops a caller the limiter refuses (429 with Retry-After)', async () => {
    const t = await setup({ limiter: { check: async () => ({ ok: false, retryAfter: 7, message: 'Slow down.' }) } });
    const res = await t.handle(new Request('https://site.test/api/mcp', { method: 'POST', headers: { authorization: `Bearer ${t.key}`, 'content-type': 'application/json' }, body: '{}' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('7');
  });
});
