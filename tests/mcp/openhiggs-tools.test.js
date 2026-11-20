// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { Client } from '../../packages/studio-mcp-core/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { InMemoryTransport } from '../../packages/studio-mcp-core/node_modules/@modelcontextprotocol/sdk/dist/esm/inMemory.js';
import { createCatalog, createGatewayClient, createBrandedServer } from '../../packages/studio-mcp-core/src/index.js';
import { brand } from '../../mcp/brand.js';
import { customTools } from '../../mcp/tools.js';
import { listMcpKeys, createMcpKey, revokeMcpKey, mcpInstallSnippets } from '../../lib/mcpAccessClient.js';

async function setup(script) {
  const calls = [];
  const fetchImpl = async (u, init = {}) => {
    const path = u.replace('https://gw.test', '');
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ path, body });
    return { ok: true, status: 200, statusText: 'OK', text: async () => JSON.stringify(script(path, body, calls.length)) };
  };
  const client = createGatewayClient({ gatewayUrl: 'https://gw.test', apiKey: 'sv_live_x', brandName: brand.name, fetchImpl, pollIntervalMs: 1 });
  client.sleep = async () => {};
  const server = createBrandedServer({ brand: { ...brand, customTools }, catalog: createCatalog([]), client });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const mcp = new Client({ name: 't', version: '1' });
  await Promise.all([server.connect(a), mcp.connect(b)]);
  return { mcp, calls };
}
const out = (r) => JSON.parse(r.content[0].text);

describe('workflow and agent tools', () => {
  it('lists, runs and waits for a workflow through the allow-listed raw route', async () => {
    let polls = 0;
    const { mcp, calls } = await setup((p, body) => {
      if (body?.path === '/workflow/wf_1/api-execute') return { run_id: 'run_1' };
      if (body?.path === '/workflow/run/run_1/api-outputs') return ++polls < 2 ? { status: 'running' } : { status: 'completed', outputs: ['https://cdn.example.com/o.mp4'] };
      return { workflows: [] };
    });
    await mcp.callTool({ name: 'smartvideo_workflows_list', arguments: { which: 'templates' } });
    const r = out(await mcp.callTool({ name: 'smartvideo_workflow_run', arguments: { workflow_id: 'wf_1', inputs: { prompt: 'x' } } }));
    expect(calls[0]).toEqual({ path: '/raw', body: { method: 'GET', path: '/workflow/get-template-workflows' } });
    expect(calls[1].body).toEqual({ method: 'POST', path: '/workflow/wf_1/api-execute', body: { inputs: { prompt: 'x' } } });
    expect(r).toEqual({ status: 'completed', run_id: 'run_1', outputs: ['https://cdn.example.com/o.mp4'] });
    const bad = await mcp.callTool({ name: 'smartvideo_workflow_inputs', arguments: { workflow_id: '../admin' } });
    expect(bad.isError).toBe(true);
  });

  it('agent_chat sends the message and returns the completed turn', async () => {
    let n = 0;
    const { mcp, calls } = await setup((p, body) => (body?.path ? { request_id: 'req1' } : ++n < 2 ? { is_complete: false } : { is_complete: true, messages: [{ role: 'assistant', content: 'hi' }] }));
    const r = out(await mcp.callTool({ name: 'smartvideo_agent_chat', arguments: { slug: 'helper', message: 'hello' } }));
    expect(calls[0].body).toEqual({ method: 'POST', path: '/agents/by-slug/helper/chat', body: { message: 'hello', conversation_id: null, attachments: null, stream: false } });
    expect(r.is_complete).toBe(true);
  });
});

describe('skills tools', () => {
  it('lists brand-neutral recipes and runs one end to end, feeding step outputs forward', async () => {
    const { mcp, calls } = await setup((p) => (p === '/generate' ? { outputs: ['https://cdn.example.com/step.png'] } : {}));
    const list = out(await mcp.callTool({ name: 'smartvideo_skills_list', arguments: { query: 'logo' } }));
    expect(list.skills.length).toBeGreaterThan(0);
    expect(JSON.stringify(list)).not.toMatch(/mu-?api/i);
    const slug = '3d-logo-animation';
    expect(list.skills.map((s) => s.slug)).toContain(slug);
    const r = out(await mcp.callTool({ name: 'smartvideo_skill_run', arguments: { slug, inputs: { logo_image: 'https://cdn.example.com/logo.png' } } }));
    expect(r.status).toBe('completed');
    expect(calls.filter((c) => c.path === '/generate').map((c) => c.body.endpoint)).toEqual(['/nano-banana-2-edit', '/seedance-2-image-to-video-fast']);
    expect(calls[1].body.payload.image_url ?? calls[1].body.payload.images_list).toBeTruthy();
    const missing = await mcp.callTool({ name: 'smartvideo_skill_run', arguments: { slug, inputs: {} } });
    expect(missing.isError).toBe(true);
    expect(missing.content[0].text).toMatch(/Missing required inputs/);
    expect((await mcp.callTool({ name: 'smartvideo_skill_run', arguments: { slug: 'nope' } })).isError).toBe(true);
  });
});

describe('mcpAccessClient', () => {
  const reply = (status, body) => ({ status, ok: status < 400, json: async () => body });
  it('posts the action and surfaces server messages', async () => {
    const f = vi.fn(async () => reply(200, { ok: true, keys: [], key: 'sv_live_x', id: 'i' }));
    await listMcpKeys(f); await createMcpKey('Claude', f); await revokeMcpKey('abc', f);
    expect(f.mock.calls.map((c) => JSON.parse(c[1].body))).toEqual([{ action: 'list' }, { action: 'create', label: 'Claude' }, { action: 'revoke', id: 'abc' }]);
    await expect(createMcpKey('x', async () => reply(400, { ok: false, error: { message: 'Save your API key first' } }))).rejects.toThrow('Save your API key first');
    await expect(listMcpKeys(async () => reply(401, {}))).rejects.toThrow(/Sign in/);
  });
  it('snippets use the SmartVideo GO names only', () => {
    const s = mcpInstallSnippets('sv_live_abc');
    expect(JSON.parse(s.json).mcpServers['smartvideo-go'].env.SMARTVIDEO_GO_API_KEY).toBe('sv_live_abc');
    expect(s.claudeCode + s.json).not.toMatch(/mu-?api/i);
  });
});
