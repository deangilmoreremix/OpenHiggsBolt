// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createGovernor, createMemoryGovernorStore, humanOnlyViolations, createCatalog, createGatewayClient, createBrandedServer, connectInMemory } from '../../packages/studio-mcp-core/src/index.js';
import { createHandler, classifyRequest } from '../../lib/mcpGateway.js';
import { brand } from '../../mcp/brand.js';
import { customTools } from '../../mcp/tools.js';

const KEY_ID = '11111111-1111-1111-1111-111111111111';
const principal = { id: KEY_ID, userId: 'owner_1', keys: { muapi: 'mu_test_key_0123456789abcdef', openai: null } };

describe('governor (same module as the SmartVid repo)', () => {
  it('confirm and caps behave', async () => {
    const g = createGovernor({ store: createMemoryGovernorStore(), caps: { destructive: 1, publish: 1 } });
    expect((await g.check({ keyId: KEY_ID, risk: 'destructive' })).code).toBe('confirm_required');
    expect((await g.check({ keyId: KEY_ID, risk: 'destructive', confirm: true })).ok).toBe(true);
    expect((await g.check({ keyId: KEY_ID, risk: 'destructive', confirm: true })).code).toBe('daily_cap');
  });
});

describe('gateway enforcement (SmartVideo GO)', () => {
  const setup = (studios = {}) => {
    const store = createMemoryGovernorStore();
    const governor = createGovernor({ store, caps: { destructive: 1, publish: 1 } });
    const h = createHandler({ resolve: async () => principal, authorize: async () => true, studios, env: {}, governor });
    const call = (path, body) => h({ httpMethod: 'POST', path: `/api/mcp-gateway${path}`, headers: { authorization: `Bearer sv_live_${'a'.repeat(43)}` }, body: JSON.stringify(body) });
    return { call, store };
  };

  it('classifies from the route, not from what the caller claims', () => {
    expect(classifyRequest('/raw', 'POST', { method: 'DELETE', path: '/workflow/delete-workflow-def/x' }).risk).toBe('destructive');
    expect(classifyRequest('/raw', 'POST', { method: 'GET' }).risk).toBe('read');
    expect(classifyRequest('/studio/go-ai-viral', 'POST', {}).risk).toBe('read');
    expect(classifyRequest('/studio/design-agent', 'POST', { route: 'chat', method: 'POST' }).risk).toBe('write');
    expect(classifyRequest('/studio/design-agent', 'POST', { route: 'sessions' }).risk).toBe('read');
    expect(classifyRequest('/studio/thumbnail', 'POST', {}).risk).toBe('write');
    expect(classifyRequest('/studio/unknown-new', 'POST', {}).risk).toBe('write');
  });

  it('refuses unconfirmed destructive calls, counts confirmed ones, caps, and audits without content', async () => {
    const run = vi.fn(async () => ({ statusCode: 200, body: '{}' }));
    const { call, store } = setup({ demo: run });
    // the raw route only passes allow-listed calls; a DELETE is classified destructive and stopped before the allow-list is even consulted
    const refused = await call('/raw', { method: 'DELETE', path: '/workflow/delete-workflow-def/x' });
    expect(refused.statusCode).toBe(409);
    const confirmed = await call('/raw', { method: 'DELETE', path: '/workflow/delete-workflow-def/x', confirm: true });
    expect(confirmed.statusCode).toBe(400); // confirmed, counted, then the allow-list still says no
    const capped = await call('/raw', { method: 'DELETE', path: '/workflow/delete-workflow-def/y', confirm: true });
    expect(capped.statusCode).toBe(429);
    await call('/studio/demo', { secret: 'prompt text' });
    expect(store.rows.map((r) => [r.risk, r.ok])).toEqual([['destructive', false], ['write', true]]);
    expect(JSON.stringify(store.rows)).not.toMatch(/prompt text|workflow\/delete/);
  });
});

describe('tools', () => {
  it('no registered tool is a human-only action, and read tools are labelled', async () => {
    const client = createGatewayClient({ gatewayUrl: 'https://gw.test', apiKey: 'sv_live_x', brandName: brand.name, fetchImpl: async () => ({ ok: true, status: 200, text: async () => '{}' }) });
    const mcp = await connectInMemory(createBrandedServer({ brand: { ...brand, customTools }, catalog: createCatalog([]), client }));
    const tools = (await mcp.listTools()).tools;
    expect(humanOnlyViolations(tools.map((t) => t.name.replace(/^smartvideo_/, '')))).toEqual([]);
    expect(tools.find((t) => t.name === 'smartvideo_skills_list').annotations.readOnlyHint).toBe(true);
    expect(tools.find((t) => t.name === 'smartvideo_agents_list').annotations.readOnlyHint).toBe(true);
  });
});
