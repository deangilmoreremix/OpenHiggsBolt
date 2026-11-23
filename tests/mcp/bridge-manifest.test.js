// @vitest-environment jsdom
/**
 * mcp/bridge-tools.json lists every tab tool the app can offer (studio, name, description, risk, parameters) plus what is deliberately not exposed.
 * It is built from the adapters themselves; this test fails when an adapter changes without the manifest being rebuilt:
 *   UPDATE_BRIDGE_MANIFEST=1 npx vitest run tests/mcp/bridge-manifest.test.js
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { storyboardTools } from '../../lib/mcpAdapters/storyboard.js';
import { motionDirectorTools } from '../../lib/mcpAdapters/motionDirector.js';
import { appShellTools } from '../../lib/mcpAdapters/appShell.js';
import { layersTools } from '../../packages/studio/src/lib/layersMcpTools.js';
import { useStore } from '../../src/apps/motion-director/store';
import { interpretAgentCommand } from '../../src/apps/motion-director/lib/agentCommands';
import { applyAgentOps } from '../../src/apps/motion-director/lib/agentApply';
import { humanOnlyViolations } from '../../packages/studio-mcp-core/src/index.js';

const FILE = resolve(process.cwd(), 'mcp/bridge-tools.json');

export const NOT_EXPOSED = {
  layers: 'Freehand drawing, lasso/region/shape/brush tools, drag and zoom, text and colour-grade sliders and the canvas undo/redo work on pointer events over a canvas and have no programmatic surface.',
  'motion-director': 'Dragging on the timeline, player scrubbing beyond the playhead, and rendering/export to a file (needs the browser renderer and a download).',
  storyboard: 'Shot image/video generation (covered by the generation tools), and the PDF/GIF downloads (need the browser file dialog).',
  edit: 'The Edit playground form (tool, model and upload slots) is not driven from a tab: the same tools run server-side through edit_tool_run, no tab needed.',
  app: 'Opening modals, settings and saving API keys: only a person may do those.',
};

const build = () => {
  const groups = {
    storyboard: storyboardTools(() => ({})),
    'motion-director': motionDirectorTools({ store: useStore, interpret: interpretAgentCommand, apply: applyAgentOps }),
    layers: layersTools(() => ({})),
    app: appShellTools({ tabs: [], getActive: () => '', navigate: () => {} }),
  };
  return {
    generatedBy: 'tests/mcp/bridge-manifest.test.js',
    studios: Object.fromEntries(Object.entries(groups).map(([studio, tools]) => [studio, {
      tools: tools.map((t) => ({ name: t.name, description: t.description, risk: t.risk, parameters: Object.keys(t.schema.properties || {}), required: t.schema.required || [] })),
      notExposed: NOT_EXPOSED[studio] || null,
    }])),
    notExposed: { edit: NOT_EXPOSED.edit },
  };
};

describe('bridge-tools manifest', () => {
  it('matches the adapters', () => {
    const fresh = build();
    if (process.env.UPDATE_BRIDGE_MANIFEST === '1') writeFileSync(FILE, `${JSON.stringify(fresh, null, 2)}\n`);
    expect(JSON.parse(readFileSync(FILE, 'utf8'))).toEqual(fresh);
  });
  it('lists no tool a person must do themselves, and every studio explains what it leaves out', () => {
    const m = build();
    expect(humanOnlyViolations(Object.values(m.studios).flatMap((s) => s.tools.map((t) => t.name)))).toEqual([]);
    for (const [studio, s] of Object.entries(m.studios)) expect(s.notExposed, studio).toBeTruthy();
  });
});
