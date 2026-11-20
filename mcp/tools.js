// SmartVideo GO tools beyond the catalog generation tools: skills (recipes), workflows and agents.
// Skill steps are built with the app's own code (packages/studio/src/lib/promptRecipes.js buildParams), so a recipe
// run through the MCP asks for the same models, prompts and references as the Skills panel does.
import { readFileSync } from 'node:fs';
import { z, createCatalog, extractOutputs, sanitizeDeep } from '../packages/studio-mcp-core/src/index.js';
import { buildParams } from '../packages/studio/src/lib/promptRecipes.js';
import { endpointFixes } from './brand.js';

const registry = JSON.parse(readFileSync(new URL('../packages/studio/src/skills/registry.json', import.meta.url), 'utf8'));
const skillList = Array.isArray(registry.skills) ? registry.skills : Object.values(registry.skills || {});
// Recipes are published under brand-neutral slugs: the registry's "muapi-" prefix is dropped (names are unique without it).
const publicSlug = (slug) => String(slug).replace(/^muapi-/i, '');
const skills = Object.fromEntries(skillList.map((s) => [publicSlug(s.slug), s]));
const BRAND = 'SmartVideo GO';
const catalog = createCatalog(JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url), 'utf8')), { endpointFixes });

const SKIP_TYPES = new Set(['approval', 'script']); // the app pauses or only shows a note for these

/** Turn one step's app-level params into the catalog request the MCP sends. Exported for parity tests. */
export function stepRequest(step, params, { fallbackImages = [] } = {}) {
  const entry = catalog.entries.find((e) => e.id === step.endpoint) || catalog.entries.find((e) => e.endpoint === step.endpoint);
  if (!entry) throw new Error(`This recipe uses a model that is not available through MCP (${step.endpoint}).`);
  const declared = new Set([...Object.keys(entry.inputs || {}), entry.imageField, entry.videoField, 'prompt'].filter(Boolean));
  const inputs = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === 'model' || k === 'references' || k === 'images_list') continue;
    if (v === undefined || v === null || v === '' || !declared.has(k)) continue;
    inputs[k] = v;
  }
  let urls = params.images_list || [];
  // Some registry recipes list no reference for a step whose model needs an image (the Skills panel then sends none).
  // The MCP attaches the recipe's own image inputs instead, so those recipes can run.
  const needsImage = entry.inputs?.[entry.imageField || 'image_url']?.required;
  if (!urls.length && fallbackImages.length && needsImage) urls = fallbackImages;
  if (urls.length) {
    const f = entry.imageField || 'image_url';
    if (f === 'images_list' || entry.inputs?.[f]?.type === 'array') inputs[f] = urls;
    else inputs[f] = urls[0];
  }
  if (params.video_url && declared.has('video_url')) inputs.video_url = params.video_url;
  return { key: entry.key, ...catalog.buildRequest(entry.key, inputs) };
}

export async function runSkillSteps(skill, values, client, { timeoutMs = 900_000, onRequest } = {}) {
  const inputs = { ...Object.fromEntries((skill.inputs || []).filter((i) => i.default).map((i) => [i.name, i.default])), ...values };
  const missing = (skill.inputs || []).filter((i) => i.required && !inputs[i.name]).map((i) => i.name);
  if (missing.length) throw Object.assign(new Error(`Missing required inputs: ${missing.join(', ')}`), { code: 'BAD_INPUT' });
  const outputs = [];
  const log = [];
  for (let i = 0; i < skill.steps.length; i++) {
    const step = skill.steps[i];
    if (SKIP_TYPES.has(step.type)) { log.push({ step: i, type: step.type, status: 'skipped', note: step.note || '' }); continue; }
    if (step.type === 'upload') {
      const token = step.inputName ? `{{${step.inputName}}}` : step.references?.[0] || '';
      const url = token.replace(/\{\{(\w+)\}\}/, (_, n) => inputs[n] || '');
      outputs[i] = { url };
      log.push({ step: i, type: 'upload', status: 'done', url });
      continue;
    }
    const params = buildParams(step, inputs, outputs);
    const fallbackImages = (skill.inputs || []).filter((i) => i.type === 'image_url').map((i) => inputs[i.name]).filter(Boolean);
    const req = stepRequest(step, params, { fallbackImages });
    onRequest?.(i, req);
    const submitted = await client.submit(req.endpoint, req.payload);
    const id = submitted.request_id || submitted.id;
    const done = id ? await client.wait(id, { timeoutMs }) : { status: 'completed', outputs: extractOutputs(submitted) };
    if (done.status !== 'completed') { log.push({ step: i, type: step.type, status: done.status, request_id: id, error: done.error }); return { status: done.status, steps: log, request_id: id }; }
    const url = done.outputs?.[0] || '';
    outputs[i] = { url };
    log.push({ step: i, type: step.type, status: 'done', url });
  }
  const last = [...outputs].reverse().find((o) => o?.url);
  return { status: 'completed', url: last?.url, steps: log };
}

const ID = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
const sleep = (client, ms) => client.sleep(ms);

export const customTools = [
  {
    name: 'skills_list',
    description: 'List ready-made recipes (skills): multi-step image and video workflows such as logo animation or product ads, with the inputs each one needs.',
    input: { query: z.string().optional().describe('Filter by name, description or trigger words'), studio: z.string().optional() },
    run: async (a) => {
      const q = String(a.query || '').toLowerCase();
      return sanitizeDeep({ skills: skillList.filter((s) => (!a.studio || s.studio === a.studio) && (!q || `${s.name} ${s.description} ${(s.triggers || []).join(' ')}`.toLowerCase().includes(q)))
        .map((s) => ({ slug: publicSlug(s.slug), name: publicSlug(s.name), description: s.description, studio: s.studio, steps: s.steps.length, inputs: (s.inputs || []).map((i) => ({ name: i.name, type: i.type, required: !!i.required, default: i.default || undefined })) })) }, BRAND);
    },
  },
  {
    name: 'skill_run',
    description: 'Run a recipe from skills_list end to end (each step feeds the next). Image inputs must be public https URLs. Can take several minutes.',
    input: { slug: z.string().min(1).max(120), inputs: z.record(z.any()).optional() },
    run: async (a, client) => {
      const skill = skills[publicSlug(a.slug)];
      if (!skill) throw Object.assign(new Error(`Unknown recipe "${a.slug}". Use skills_list.`), { code: 'BAD_INPUT' });
      return runSkillSteps(skill, a.inputs || {}, client);
    },
  },
  {
    name: 'workflows_list',
    description: 'List workflows: your own, published ones, or templates.',
    input: { which: z.enum(['mine', 'published', 'templates']).optional() },
    run: (a, client) => client.raw('GET', { mine: '/workflow/get-workflow-defs', published: '/workflow/get-published-workflows', templates: '/workflow/get-template-workflows' }[a.which || 'mine']),
  },
  {
    name: 'workflow_inputs',
    description: 'Get the inputs a workflow expects before you run it.',
    input: { workflow_id: ID },
    run: (a, client) => client.raw('GET', `/workflow/${a.workflow_id}/api-inputs`),
  },
  {
    name: 'workflow_run',
    description: 'Run a workflow with the given inputs and wait for its outputs (set wait=false to get a run_id for workflow_status).',
    input: { workflow_id: ID, inputs: z.record(z.any()).optional(), wait: z.boolean().optional() },
    run: async (a, client) => {
      const sub = await client.raw('POST', `/workflow/${a.workflow_id}/api-execute`, { inputs: a.inputs || {} });
      const runId = sub.run_id || sub.id;
      if (!runId) return sub;
      return a.wait === false ? { status: 'processing', run_id: runId } : workflowWait(client, runId, 900_000);
    },
  },
  {
    name: 'workflow_status',
    description: 'Check a workflow run started with workflow_run.',
    input: { run_id: ID },
    run: (a, client) => workflowWait(client, a.run_id, 0),
  },
  {
    name: 'agents_list',
    description: 'List agents: your own, featured, or templates.',
    input: { which: z.enum(['mine', 'featured', 'templates']).optional() },
    run: (a, client) => client.raw('GET', { mine: '/agents/user/agents', featured: '/agents/featured/agents', templates: '/agents/templates/agents' }[a.which || 'mine']),
  },
  {
    name: 'agent_chat',
    description: 'Send a message to an agent by its slug and return its reply. Pass conversation_id to continue a conversation.',
    input: { slug: ID, message: z.string().min(1).max(8000), conversation_id: z.string().optional() },
    run: async (a, client) => {
      const sent = await client.raw('POST', `/agents/by-slug/${a.slug}/chat`, { message: a.message, conversation_id: a.conversation_id || null, attachments: null, stream: false });
      if (sent.is_complete || !(sent.request_id || sent.id)) return sent;
      const id = sent.request_id || sent.id;
      const deadline = Date.now() + 300_000;
      for (;;) {
        await sleep(client, 2000);
        const r = await client.result(id);
        if (r.is_complete) return r;
        if (Date.now() >= deadline) return { status: 'processing', request_id: id };
      }
    },
  },
];

async function workflowWait(client, runId, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const d = await client.raw('GET', `/workflow/run/${runId}/api-outputs`);
    const st = String(d.status || '').toLowerCase();
    if (['completed', 'succeeded', 'success'].includes(st)) return { status: 'completed', run_id: runId, outputs: d.outputs ?? d };
    if (['failed', 'error'].includes(st)) return { status: 'failed', run_id: runId, error: d.error };
    if (Date.now() >= deadline) return { status: 'processing', run_id: runId };
    await sleep(client, 2000);
  }
}
