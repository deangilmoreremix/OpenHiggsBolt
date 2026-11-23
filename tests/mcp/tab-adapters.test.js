// @vitest-environment jsdom
/**
 * The tab adapters through the whole MCP path: MCP server -> gateway -> bridge queue -> tab controller -> adapter -> the studio's own state.
 * Storyboard runs against the real StoryboardProvider; Motion Director against the real store and Motion Agent code.
 */
import { describe, it, expect, vi } from 'vitest';
import React, { useRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import { StoryboardProvider, useStoryboard } from '../../src/apps/storyboard/StoryboardContext';
import { storyboardTools } from '../../lib/mcpAdapters/storyboard.js';
import { motionDirectorTools } from '../../lib/mcpAdapters/motionDirector.js';
import { appShellTools } from '../../lib/mcpAdapters/appShell.js';
import { layersTools } from '../../packages/studio/src/lib/layersMcpTools.js';
import { useStore } from '../../src/apps/motion-director/store';
import { interpretAgentCommand } from '../../src/apps/motion-director/lib/agentCommands';
import { applyAgentOps } from '../../src/apps/motion-director/lib/agentApply';
import { world } from './helpers/bridgeWorld.js';

vi.hoisted(() => { process.env.MCP_KEY_SECRET = 'm'.repeat(40); });

async function connect(tools, confirm = async () => 'once') {
  const w = await world();
  const mcp = await w.mcpFor(w.key);
  const { tab } = w.mkTab('owner_1', { tools, confirm });
  await tab.enable();
  const call = (tool, args, extra = {}) => w.withPolling(tab, () => w.call(mcp, 'studio_call', { session: tab.sessionId(), tool, args, wait_seconds: 5, ...extra }));
  return { w, mcp, tab, call };
}

describe('every adapter tool is well formed', () => {
  const sets = {
    storyboard: storyboardTools(() => ({})),
    motion: motionDirectorTools({ store: useStore, interpret: interpretAgentCommand, apply: applyAgentOps }),
    layers: layersTools(() => ({})),
    app: appShellTools({ tabs: [], getActive: () => '', navigate: () => {} }),
  };
  it('names are lowercase snake_case, unique across studios, with a description, a risk and an object schema', () => {
    const all = Object.values(sets).flat();
    expect(new Set(all.map((t) => t.name)).size).toBe(all.length);
    for (const t of all) {
      expect(t.name).toMatch(/^[a-z][a-z0-9_]{1,63}$/);
      expect(t.description.length).toBeGreaterThan(10);
      expect(['read', 'write', 'destructive', 'publish']).toContain(t.risk);
      expect(t.schema.type).toBe('object');
    }
  });
  it('anything that deletes is marked destructive', () => {
    for (const t of Object.values(sets).flat()) if (/_(remove|delete)_(shot|character|project|clip)$/.test(t.name)) expect(t.risk, t.name).toBe('destructive');
  });
});

describe('storyboard (real provider)', () => {
  it('edits the open project through the studio\'s own actions; removing needs confirm', async () => {
    const ref = { current: null };
    function Probe() { ref.current = useStoryboard(); return null; }
    localStorage.clear();
    render(React.createElement(StoryboardProvider, null, React.createElement(Probe)));
    const { call } = await connect(storyboardTools(() => ref.current));

    expect((await call('storyboard_set_brief', { brief: 'A fox learns to fly' })).body.status).toBe('done');
    expect(ref.current.brief).toBe('A fox learns to fly');

    const added = await call('storyboard_add_shot', { scene: 'Fox on a cliff', duration: 4 });
    expect(added.body.status).toBe('done');
    const id = added.body.result.id;
    expect(ref.current.shots.map((s) => s.id)).toContain(id);

    await call('storyboard_update_shot', { id, scene: 'Fox leaps' });
    expect(ref.current.shots.find((s) => s.id === id).scene).toBe('Fox leaps');

    expect((await call('storyboard_set_aspect_ratio', { aspect_ratio: '9:16' })).body.status).toBe('done');
    expect(ref.current.aspectRatio).toBe('9:16');
    expect((await call('storyboard_set_model', { model: 'not-a-model' })).body.status).toBe('error');

    // a destructive tab tool is refused by the gateway until the caller says confirm: true
    const refused = await call('storyboard_remove_shot', { id });
    expect(refused.isError || refused.body.status === 'confirmation_required' || /confirm/i.test(JSON.stringify(refused.body))).toBe(true);
    expect(ref.current.shots.some((s) => s.id === id)).toBe(true);
    const removed = await call('storyboard_remove_shot', { id }, { confirm: true });
    expect(removed.body.status).toBe('done');
    expect(ref.current.shots.some((s) => s.id === id)).toBe(false);

    const state = await call('storyboard_get_state', {});
    expect(state.body.result.brief).toBe('A fox learns to fly');
    cleanup();
  });
});

describe('motion director (real store and agent)', () => {
  it('reads the project, runs a plain-English command, and the project really changes', async () => {
    const tools = motionDirectorTools({ store: useStore, interpret: interpretAgentCommand, apply: applyAgentOps });
    const { call } = await connect(tools);
    const before = (await call('motion_director_get_project', {})).body.result;
    expect(before.tracks.length).toBeGreaterThan(0);
    const out = (await call('motion_director_command', { text: 'change the background to red' })).body;
    expect(out.status).toBe('done');
    expect(out.result.applied).toBeGreaterThan(0);
    expect(useStore.getState().project.background).toBe('#ef4444');
    expect((await call('motion_director_undo', {})).body.status).toBe('done');
    expect(useStore.getState().project.background).not.toBe('#ef4444');
    expect((await call('motion_director_update_clip', { clip_id: 'nope', start: 1 })).body.status).toBe('error');
  });
});

describe('layers and app shell', () => {
  it('layers: validates input, refuses while busy, and calls the studio handlers', async () => {
    const state = { currentImageUrl: 'https://x/a.png', prompt: '', resolution: '1K', layerCount: 8, outputFormat: 'png', isProcessing: false, decomposedLayers: ['https://x/l0.png', 'https://x/l1.png'], visibleLayers: { 0: true, 1: true } };
    const actions = { setCurrentImageUrl: vi.fn((u) => { state.currentImageUrl = u; }), setPrompt: vi.fn(), setResolution: vi.fn(), setOutputFormat: vi.fn(), setLayerCount: vi.fn(), decompose: vi.fn(async () => {}), upscale: vi.fn(async () => {}), removeBackground: vi.fn(async () => {}), setLayerVisible: vi.fn((i, v) => { state.visibleLayers[i] = v; }) };
    const { call } = await connect(layersTools(() => ({ state, actions })));
    expect((await call('layers_set_image', { image_url: 'http://insecure/x.png' })).body.status).toBe('error');
    expect((await call('layers_set_image', { image_url: 'https://x/b.png' })).body.status).toBe('done');
    expect((await call('layers_decompose', { prompt: 'split it' })).body.status).toBe('done');
    expect(actions.decompose).toHaveBeenCalledWith('split it');
    expect((await call('layers_set_layer_visibility', { index: 1, visible: false })).body.result.layers[1].visible).toBe(false);
    expect((await call('layers_set_layer_visibility', { index: 9, visible: false })).body.status).toBe('error');
    state.isProcessing = true;
    expect((await call('layers_upscale', {})).body.status).toBe('error');
    expect(actions.upscale).not.toHaveBeenCalled();
  });

  it('app: reports the open studio and only navigates to a studio that exists', async () => {
    let active = 'image';
    const tabs = [{ id: 'image', label: 'Image' }, { id: 'storyboard', label: 'Storyboard' }];
    const { call } = await connect(appShellTools({ tabs, getActive: () => active, navigate: (id) => { active = id; } }));
    expect((await call('app_state', {})).body.result).toMatchObject({ active: 'image' });
    expect((await call('app_navigate', { studio: 'nope' })).body.status).toBe('error');
    expect((await call('app_navigate', { studio: 'storyboard' })).body.result.active).toBe('storyboard');
  });

  it('declining in the tab changes nothing', async () => {
    let active = 'image';
    const { call } = await connect(appShellTools({ tabs: [{ id: 'image', label: 'I' }, { id: 'zackd', label: 'Z' }], getActive: () => active, navigate: (id) => { active = id; } }), async () => 'no');
    expect((await call('app_navigate', { studio: 'zackd' })).body.status).toBe('declined');
    expect(active).toBe('image');
  });
});
