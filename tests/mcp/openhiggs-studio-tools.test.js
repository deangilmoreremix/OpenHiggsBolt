// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createCatalog, createGatewayClient, createBrandedServer, connectInMemory } from '../../packages/studio-mcp-core/src/index.js';
import { brand } from '../../mcp/brand.js';
import { customTools } from '../../mcp/tools.js';
import { buildMedia, handleText } from '../../lib/zackdFunction.js';
import { createJobs } from '../../src/apps/zackd/jobs.js';
import { starterBeatMap } from '../../src/apps/zackd/zackdPrompts.js';

async function setup(script) {
  const calls = [];
  const fetchImpl = async (u, init = {}) => {
    const path = u.replace('https://gw.test', '');
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ path, body });
    const out = script(path, body, calls.length);
    const status = out?.__status || 200;
    return { ok: status < 400, status, statusText: 'x', text: async () => JSON.stringify(out?.__status ? { error: { message: out.message } } : out) };
  };
  const client = createGatewayClient({ gatewayUrl: 'https://gw.test', apiKey: 'sv_live_x', brandName: brand.name, fetchImpl, pollIntervalMs: 1 });
  client.sleep = async () => {};
  const mcp = await connectInMemory(createBrandedServer({ brand: { ...brand, customTools }, catalog: createCatalog([]), client }));
  return { mcp, calls };
}
const run = async (mcp, name, args = {}) => {
  const r = await mcp.callTool({ name: `smartvideo_${name}`, arguments: args }).catch((e) => ({ isError: true, content: [{ text: JSON.stringify({ error: e.message }) }] }));
  let body; try { body = JSON.parse(r.content[0].text); } catch { body = { error: r.content[0].text }; }
  return { isError: !!r.isError, body };
};

describe('Zack D media: same models and payloads as the studio', () => {
  const API_KEY = 'k';
  const fakeApi = () => {
    const seen = [];
    const rec = (kind) => async (_k, p) => { seen.push({ kind, p }); return { url: 'https://cdn.example.com/o' }; };
    return { seen, api: { generateImage: rec('image'), generateI2V: rec('clip'), generateAudio: rec('audio'), generateCaptions: rec('captions') } };
  };

  it('image', async () => {
    const { seen, api } = fakeApi();
    await createJobs(api, API_KEY).image({ prompt: 'a cat', aspect: '9:16' });
    const mcp = buildMedia({ kind: 'image', prompt: 'a cat', aspect: '9:16' });
    expect(mcp.models).toContain(seen[0].p.model);
    expect(seen[0].p).toMatchObject(mcp.payload);
  });
  it('clip', async () => {
    const { seen, api } = fakeApi();
    await createJobs(api, API_KEY).clip({ imageUrl: 'https://cdn.example.com/a.png', prompt: 'zoom' });
    const mcp = buildMedia({ kind: 'clip', imageUrl: 'https://cdn.example.com/a.png', prompt: 'zoom' });
    expect(mcp.models).toContain(seen[0].p.model);
    expect(seen[0].p).toMatchObject(mcp.payload);
  });
  it('narration', async () => {
    const { seen, api } = fakeApi();
    await createJobs(api, API_KEY).narration({ text: 'Hello there', voice: 'Calm_Woman', speed: 1.2 });
    const mcp = buildMedia({ kind: 'tts', text: 'Hello there', voice: 'Calm_Woman', speed: 1.2 });
    expect(mcp.models).toContain(seen[0].p._modelId);
    expect(seen[0].p).toMatchObject(mcp.payload);
  });
  it('captions', async () => {
    const { seen, api } = fakeApi();
    await createJobs(api, API_KEY).captions({ videoUrl: 'https://cdn.example.com/a.mp4', language: 'English', theme: 'Hormozi_1' });
    expect(seen[0].p).toMatchObject(buildMedia({ kind: 'captions', videoUrl: 'https://cdn.example.com/a.mp4', language: 'English', theme: 'Hormozi_1' }).payload);
  });
  it('music: the studio sends prompt + duration to the same model', async () => {
    const { seen, api } = fakeApi();
    await createJobs(api, API_KEY).music({ prompt: 'tense underscore', duration: 20 });
    const mcp = buildMedia({ kind: 'music', prompt: 'tense underscore', duration: 20 });
    expect(mcp.models).toEqual([seen[0].p._modelId]);
    expect(seen[0].p).toMatchObject(mcp.payload);
  });
  it('rejects bad input like the studio does', () => {
    expect(buildMedia({ kind: 'image' }).error).toMatch(/prompt/);
    expect(buildMedia({ kind: 'clip', prompt: 'x', imageUrl: 'http://x.test/a.png' }).error).toMatch(/https/);
    expect(buildMedia({ kind: 'captions', videoUrl: 'ftp://x' }).error).toMatch(/https/);
    expect(buildMedia({ kind: 'nope' }).error).toMatch(/kind/);
  });
});

describe('Zack D text steps', () => {
  const ok = (text) => async () => ({ ok: true, status: 200, json: async () => ({ output_text: text }) });
  it('need the owner\'s OpenAI key and say so', async () => {
    const r = await handleText({ action: 'trends' }, {});
    expect(r.statusCode).toBe(401);
    expect(JSON.parse(r.body).error.message).toMatch(/OpenAI key/);
    expect((await handleText({ action: 'x' }, { openai: 'sk-x' })).statusCode).toBe(400);
  });
  it('returns normalised topics and beat maps', async () => {
    const t = await handleText({ action: 'trends', query: 'space' }, { openai: 'sk-x' }, { fetchImpl: ok(JSON.stringify({ topics: [{ topic: 'Black holes', hook: 'h', category: 'Space' }] })) });
    expect(JSON.parse(t.body).topics[0].topic).toBe('Black holes');
    const s = await handleText({ action: 'script', topic: 'Why the sky is blue' }, { openai: 'sk-x' }, { fetchImpl: ok(JSON.stringify(starterBeatMap('Why the sky is blue'))) });
    expect(JSON.parse(s.body).map.beats.length).toBeGreaterThan(0);
  });
  it('maps key problems and bad answers without leaking the key', async () => {
    const r401 = await handleText({ action: 'trends' }, { openai: 'sk-secret-123' }, { fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({}) }) });
    expect(r401.statusCode).toBe(401);
    expect(r401.body).not.toContain('sk-secret-123');
    const bad = await handleText({ action: 'script', topic: 't' }, { openai: 'sk-x' }, { fetchImpl: ok('not json at all') });
    expect(bad.statusCode).toBe(502);
  });
});

describe('Zack D tool behaviour', () => {
  it('falls back to the second model only when the first rejects the job outright', async () => {
    const { mcp, calls } = await setup((p, b) => (p === '/generate' ? (b.endpoint === '/nano-banana-2' ? { __status: 422, message: 'bad model' } : { request_id: 'req1' }) : { status: 'completed', outputs: ['https://cdn.example.com/x.png'] }));
    const r = await run(mcp, 'zackd_submit', { kind: 'image', prompt: 'a cat' });
    expect(r.body).toMatchObject({ status: 'completed', model: 'flux-dev-image' });
    expect(calls.filter((c) => c.path === '/generate').map((c) => c.body.endpoint)).toEqual(['/nano-banana-2', '/flux-dev-image']);
  });
  it('does NOT submit a second job when the first one\'s outcome is unknown', async () => {
    const calls = [];
    const fetchImpl = async (u, init) => { calls.push(u); throw new TypeError('socket hang up'); };
    const client = createGatewayClient({ gatewayUrl: 'https://gw.test', apiKey: 'sv_live_x', brandName: brand.name, fetchImpl, pollIntervalMs: 1 });
    const mcp = await connectInMemory(createBrandedServer({ brand: { ...brand, customTools }, catalog: createCatalog([]), client }));
    const r = await run(mcp, 'zackd_submit', { kind: 'image', prompt: 'a cat' });
    expect(r.isError).toBe(true);
    expect(JSON.stringify(r.body)).toMatch(/may still have started/);
    expect(calls).toHaveLength(1);
  });
  it('a bad key stops immediately', async () => {
    const { mcp, calls } = await setup(() => ({ __status: 401, message: 'no' }));
    expect((await run(mcp, 'zackd_submit', { kind: 'image', prompt: 'x' })).isError).toBe(true);
    expect(calls).toHaveLength(1);
  });
  it('text tools call the zackd studio with the app\'s action names', async () => {
    const { mcp, calls } = await setup(() => ({ ok: true, topics: [] }));
    await run(mcp, 'zackd_trends', { query: 'space' });
    await run(mcp, 'zackd_script', { topic: 'black holes', max_beats: 4 });
    expect(calls[0]).toEqual({ path: '/studio/zackd', body: { action: 'trends', query: 'space' } });
    expect(calls[1].body).toEqual({ action: 'script', topic: 'black holes', maxBeats: 4 });
  });
});

describe('studio tools send the routes the app exposes', () => {
  const T = async () => { const m = await setup(() => ({ ok: true })); return m; };
  it('design agent', async () => {
    const { mcp, calls } = await T();
    await run(mcp, 'design_agent_session', { title: 'Logo' });
    await run(mcp, 'design_agent_chat', { session_id: 'sess_1', message: 'make a logo' });
    await run(mcp, 'design_agent_assets', { session_id: 'sess_1' });
    await run(mcp, 'design_agent_decide', { job_id: 'job_1', decision: 'reject' });
    await run(mcp, 'design_agent_run_skill', { session_id: 'sess_1', skill_name: 'logo', inputs: { premise: 'x' } });
    expect(calls.map((c) => c.body)).toEqual([
      { route: 'sessions', method: 'POST', body: { title: 'Logo' } },
      { route: 'chat', method: 'POST', body: { sessionId: 'sess_1', message: 'make a logo' } },
      { route: 'assets', query: { sessionId: 'sess_1' } },
      { route: 'reject', method: 'POST', body: { jobId: 'job_1' } },
      { route: 'run-skill', method: 'POST', body: { sessionId: 'sess_1', skill_name: 'logo', inputs: { premise: 'x' } } },
    ]);
    expect((await run(mcp, 'design_agent_job', {})).isError).toBe(true);
    expect((await run(mcp, 'design_agent_chat', { session_id: '../x', message: 'hi' })).isError).toBe(true);
  });
  it('viral, thumbnails and brand', async () => {
    const { mcp, calls } = await T();
    await run(mcp, 'viral_prompts_search', { search: 'fox', media_type: 'video', page_size: 5 });
    await run(mcp, 'thumbnail_generate', { prompt: 'a red ball', aspect_ratio: '16:9', n: 2 });
    await run(mcp, 'thumbnail_refine', { image_url: 'https://cdn.example.com/t.png', prompt: 'bluer' });
    await run(mcp, 'brand_analyze', { url: 'https://acme.example.com' });
    await run(mcp, 'campaign_generate', { brand_id: 'br_1', goal: 'sell' });
    await run(mcp, 'campaigns_list', {});
    expect(calls[0]).toEqual({ path: '/studio/go-ai-viral', body: { route: 'prompts', query: { search: 'fox', mediaType: 'video', pageSize: 5 } } });
    expect(calls[1].path).toBe('/studio/thumbnail');
    expect(calls[1].body.body).toMatchObject({ action: 'generate', prompt: 'a red ball', aspect_ratio: '16:9', n: 2 });
    expect(calls[2].body.body).toMatchObject({ action: 'refine', image_url: 'https://cdn.example.com/t.png' });
    expect(calls[3]).toEqual({ path: '/studio/brand', body: { route: 'analyze', method: 'POST', body: { url: 'https://acme.example.com' } } });
    expect(calls[4]).toEqual({ path: '/studio/campaigns', body: { route: 'generate', body: { brand_id: 'br_1', goal: 'sell' } } });
    expect(calls[5].body).toEqual({ route: 'list', query: {} });
  });
});
