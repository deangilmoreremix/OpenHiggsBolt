// @vitest-environment node
/**
 * Parity: for the same inputs, the MCP builds the same backend request the real studio client does.
 * Runs the app's own client (packages/studio/src/muapi.js) against a mocked fetch and compares with the MCP catalog's buildRequest.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as app from '../../packages/studio/src/muapi.js';
import { createCatalog } from '../../packages/studio-mcp-core/src/catalog.js';
import { endpointFixes } from '../../mcp/brand.js';

vi.mock('../../packages/studio/src/lib/assetStore.js', () => ({ saveResultUrl: vi.fn(), saveUploadedFile: vi.fn() }));

const entries = JSON.parse(readFileSync(path.resolve(process.cwd(), 'mcp/catalog.json'), 'utf8'));
const catalog = createCatalog(entries, { endpointFixes });
const KEY = 'test-key-0123456789';
const IMG = 'https://cdn.example.com/in.png';
const VID = 'https://cdn.example.com/in.mp4';
const AUD = 'https://cdn.example.com/in.mp3';

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn(() => Promise.resolve({ ok: true, status: 200, statusText: 'OK', text: async () => '{}', json: () => Promise.resolve({ outputs: ['https://cdn.example.com/out.png'] }) }));
  global.fetch = fetchMock;
});
const sent = () => {
  const [url, init] = fetchMock.mock.calls[0];
  return { endpoint: String(url).split('/api/v1/')[1], params: JSON.parse(init.body) };
};
const first = (kind) => entries.find((e) => e.kind === kind && !endpointFixes[e.id] && !/watermark/.test(e.id));
const mediaFor = (e) => {
  const out = {};
  for (const [n, d] of Object.entries(e.inputs || {})) {
    if (!d.required) continue;
    if (n === 'prompt') continue;
    const one = /video/i.test(n) ? VID : /audio/i.test(n) ? AUD : /image|frame|url|mask|swap|reference/i.test(n) ? IMG : (d.enum?.[0] ?? d.default ?? (/int|number/.test(d.type) ? 1 : 'x'));
    out[n] = d.type === 'array' || /_list$|_files$/.test(n) ? [one] : one;
  }
  return out;
};

const CALLS = {
  t2i: (m, i) => app.generateImage(KEY, { model: m, ...i }),
  i2i: (m, i) => app.generateI2I(KEY, { model: m, ...i }),
  t2v: (m, i) => app.generateVideo(KEY, { model: m, ...i }),
  i2v: (m, i) => app.generateI2V(KEY, { model: m, ...i }),
  v2v: (m, i) => app.processV2V(KEY, { model: m, ...i }),
  lipsync: (m, i) => app.processLipSync(KEY, { model: m, ...i }),
  audio: (m, i) => app.generateAudio(KEY, { model: m, ...i }),
};

// Model-specific fields the app's own client does not forward (its UI never sets them) while the MCP follows the model's schema.
// An entry here is a documented gap in the app, not in the MCP. The test fails if the app starts (or stops) sending them.
const APP_GAPS = {
  "ai-product-shot": [
    "scene_description"
  ],
  "volcengine-video-to-video-lip-sync": [
    "mode"
  ]
};

describe('catalog-driven studios send what the MCP would send (every model)', () => {
  for (const [kind, call] of Object.entries(CALLS)) {
    const models = entries.filter((e) => e.kind === kind && !/watermark/.test(e.id) && !e.fixedRoute);
    test.each(models.map((e) => [e.key, e]))(`${kind}: %s`, async (_key, e) => {
      const inputs = { prompt: 'a red fox', ...mediaFor(e) };
      const mcp = catalog.buildRequest(e.key, inputs);
      const appInputs = { ...inputs };
      const f = e.imageField;
      if (f && inputs[f] !== undefined) appInputs.image_url = [].concat(inputs[f])[0];
      await call(e.id, appInputs);
      const got = sent();
      const fixed = endpointFixes[e.id];
      // Where the live catalog corrects a route the app's generic path still sends, the MCP's route wins (see known divergences).
      if (!fixed) expect(got.endpoint).toBe(mcp.endpoint.replace(/^\//, ''));
      const differing = Object.entries(mcp.payload).filter(([k, v]) => JSON.stringify(got.params[k]) !== JSON.stringify(v)).map(([k]) => k).sort();
      if (process.env.PARITY_PRINT && differing.length) process.stderr.write(`PARITY ${e.id} ${JSON.stringify(differing)}\n`);
      expect(differing, `fields the app client does not send as the MCP does for ${e.id}`).toEqual([...(APP_GAPS[e.key] || [])].sort());
    });
  }
});

describe('fixed-route studios', () => {
  test('vibe motion: generate and edit', async () => {
    await app.runMotionGraphics(KEY, { prompt: 'logo reveal' });
    expect(sent().endpoint).toBe(catalog.buildRequest('motion-graphics', { prompt: 'logo reveal' }).endpoint.slice(1));
    fetchMock.mockClear();
    const inputs = { request_id: 'r1', edit_prompt: 'bluer' };
    await app.runMotionGraphicsEdit(KEY, inputs);
    const got = sent();
    const mcp = catalog.buildRequest('motion-graphics-edit', inputs);
    expect(got.endpoint).toBe(mcp.endpoint.slice(1));
    expect(got.params).toMatchObject(mcp.payload);
  });
  test('ai clipping', async () => {
    const inputs = { video_url: VID, num_highlights: 5 };
    const mcp = catalog.buildRequest('ai-clipping', inputs);
    await app.runClipping(KEY, inputs);
    const got = sent();
    expect(got.endpoint).toBe(mcp.endpoint.slice(1));
    expect(got.params).toMatchObject(mcp.payload);
  });
  test('marketing ad (720p and 1080p endpoints)', async () => {
    const inputs = { prompt: 'sneaker ad', images_list: [IMG] };
    await app.generateMarketingStudioAd(KEY, { ...inputs });
    expect(sent().endpoint).toBe(catalog.buildRequest('marketing-ad', inputs).endpoint.slice(1));
    fetchMock.mockClear();
    await app.generateMarketingStudioAd(KEY, { ...inputs, resolution: '1080p' });
    expect(sent().endpoint).toBe(catalog.buildRequest('marketing-ad-1080p', inputs).endpoint.slice(1));
  });
  test('layers', async () => {
    const inputs = { image_url: IMG };
    const mcp = catalog.buildRequest('layers-decompose', inputs);
    await app.decomposeLayers(KEY, inputs);
    const got = sent();
    expect(got.endpoint).toBe(mcp.endpoint.slice(1));
    expect(got.params).toMatchObject(mcp.payload);
  });
  test('motion control', async () => {
    const e = entries.find((x) => x.kind === 'motion');
    const inputs = { video_url: VID, images_list: [IMG] };
    const mcp = catalog.buildRequest(e.key, inputs);
    await app.processMotionControl(KEY, { model: e.id, ...inputs });
    const got = sent();
    expect(got.endpoint).toBe(mcp.endpoint.slice(1));
    expect(got.params).toMatchObject({ video_url: VID, images_list: [IMG] });
  });
  test('recast', async () => {
    const e = entries.find((x) => x.kind === 'recast');
    const inputs = { video_url: VID, image_url: IMG };
    const mcp = catalog.buildRequest(e.key, inputs);
    await app.processRecast(KEY, { model: e.id, ...inputs });
    const got = sent();
    expect(got.endpoint).toBe(mcp.endpoint.slice(1));
    expect(got.params).toMatchObject(mcp.payload);
  });
  test('upscale helpers route like the catalog (incl. the ai-image-upscaler fix)', async () => {
    await app.upscaleImage(KEY, { model: 'ai-image-upscaler', image_url: IMG });
    expect(sent().endpoint).toBe(catalog.buildRequest('ai-image-upscaler', { image_url: IMG }).endpoint.slice(1));
    fetchMock.mockClear();
    await app.removeBackground(KEY, { image_url: IMG });
    expect(sent().endpoint).toBe(catalog.buildRequest('ai-background-remover', { image_url: IMG }).endpoint.slice(1));
  });
  test('captions', async () => {
    const inputs = { video_url: VID };
    const mcp = catalog.buildRequest('ai-captions', inputs);
    await app.generateCaptions(KEY, inputs);
    expect(sent().endpoint).toBe(mcp.endpoint.slice(1));
  });
});
