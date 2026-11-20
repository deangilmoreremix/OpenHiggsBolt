// @vitest-environment node
/**
 * Every recipe in the Skills registry, run two ways with the same inputs: the app's own runSkill (packages/studio/src/lib/promptRecipes.js)
 * against a mocked backend, and the MCP's skill runner against a fake gateway. Same models, same prompts, same references.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runSkill } from '../../packages/studio/src/lib/promptRecipes.js';
import { runSkillSteps, customTools } from '../../mcp/tools.js';

vi.mock('../../packages/studio/src/lib/assetStore.js', () => ({ saveResultUrl: vi.fn(), saveUploadedFile: vi.fn() }));

const registry = JSON.parse(readFileSync(path.resolve(process.cwd(), 'packages/studio/src/skills/registry.json'), 'utf8'));
const skills = Array.isArray(registry.skills) ? registry.skills : Object.values(registry.skills);
const IMG = 'https://cdn.example.com/in.png';
const OUT = 'https://cdn.example.com/out.png';

const sampleInputs = (skill) => Object.fromEntries((skill.inputs || []).map((i) => [i.name, i.type === 'image_url' || i.type === 'video_url' || /url|image|video/.test(i.type) ? (/video/.test(i.type) ? 'https://cdn.example.com/in.mp4' : IMG) : i.default || 'sample text']));

// Recipes the MCP refuses, with the reason. These are data problems in the registry that the Skills panel would also send upstream as-is
// (a model name that does not exist, a value the model rejects, a step with no source). The test fails if one starts or stops working.
const NOT_VIA_MCP = {
  'muapi-ai-clipping': /video_url" is required/,           // the recipe declares no video input
  'muapi-brochures': /aspect_ratio" must be one of/,        // the step's aspect ratio is not one the model accepts
  'muapi-photo-pack-generator': /images_list" is required/, // image-edit step and the recipe declares no image input
  'muapi-social-media-video': /not available through MCP/,  // step "model" is a file name (brand-identity.md)
  'muapi-ugc-ads-workflow': /is not an input of gpt-image-2/, // sends reference images to a text-to-image model
  'muapi-ugc-video-factory': /not available through MCP/,   // step "model" is an input name (person)
  'muapi-workflow': /not available through MCP/,            // step "model" is the placeholder "muapi"
  'flux-3-dev-flagship': /not available through MCP/,       // flux-3-dev is not a catalog model
  'minimax-h3-i2v': /resolution" must be one of/,           // step resolution is not one the model accepts
};

async function appRun(skill, inputs) {
  const seen = [];
  globalThis.fetch = vi.fn(async (url, init = {}) => {
    seen.push({ endpoint: String(url).split('/api/v1/')[1], body: init.body ? JSON.parse(init.body) : null });
    return { ok: true, status: 200, statusText: 'OK', text: async () => '{}', json: async () => ({ outputs: [OUT] }) };
  });
  await runSkill('k_test_0123456789abcdef', skill, inputs, () => {}, {});
  return seen;
}

async function mcpRun(skill, inputs) {
  const seen = [];
  const client = {
    submit: async (endpoint, payload) => { seen.push({ endpoint: endpoint.replace(/^\//, ''), body: payload }); return { outputs: [OUT] }; },
    wait: async () => ({ status: 'completed', outputs: [OUT] }),
  };
  await runSkillSteps(skill, inputs, client);
  return seen;
}

describe('skills registry', () => {
  it('has the recipes the MCP lists', async () => {
    const list = await customTools.find((t) => t.name === 'skills_list').run({});
    expect(list.skills.length).toBe(skills.length);
    expect(new Set(list.skills.map((x) => x.slug)).size).toBe(skills.length);
    expect(JSON.stringify(list)).not.toMatch(/mu-?api/i);
  });

  it.each(skills.map((s) => [s.slug, s]))('%s sends the same requests as the Skills panel', async (slug, skill) => {
    const inputs = sampleInputs(skill);
    if (NOT_VIA_MCP[slug]) {
      await expect(mcpRun(skill, inputs)).rejects.toThrow(NOT_VIA_MCP[slug]);
      return;
    }
    const [app, mcp] = [await appRun(skill, inputs), await mcpRun(skill, inputs)];
    const real = skill.steps.filter((t) => !['approval', 'script', 'upload'].includes(t.type));
    // A reference-less image-edit step makes the Skills panel call the text-to-image path, which uses the model id as the route;
    // the MCP uses the catalog's route for that model. Everywhere else the routes must match.
    const sameRoute = (r, i) => (real[i].references || []).length || real[i].type !== 'image' ? r.endpoint === app[i].endpoint : true;
    expect(mcp.length).toBe(app.length);
    mcp.forEach((r, i) => expect(sameRoute(r, i), `step ${i}: MCP ${r.endpoint} vs app ${app[i].endpoint}`).toBe(true));
    // Steps that list no reference: the MCP attaches the recipe's image inputs (see stepRequest); the Skills panel sends none.
    const IMAGE_KEYS = new Set(['images_list', 'image_url']);
    mcp.forEach((r, i) => {
      const step = skill.steps.filter((t) => !['approval', 'script', 'upload'].includes(t.type))[i];
      const noRefs = !(step.references || []).length;
      for (const [k, v] of Object.entries(r.body)) {
        if (noRefs && IMAGE_KEYS.has(k)) continue;
        expect(app[i].body[k], `step ${i} ${r.endpoint}.${k}`).toEqual(v);
      }
    });
  });
});
