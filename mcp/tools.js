// SmartVideo GO tools beyond the catalog generation tools: skills (recipes), workflows and agents.
// Skill steps are built with the app's own code (packages/studio/src/lib/promptRecipes.js buildParams), so a recipe
// run through the MCP asks for the same models, prompts and references as the Skills panel does.
import { readFileSync } from 'node:fs';
import { z, createCatalog, extractOutputs, sanitizeDeep } from '../packages/studio-mcp-core/src/index.js';
import { buildParams } from '../packages/studio/src/lib/promptRecipes.js';
import { endpointFixes } from './brand.js';
import { buildMedia } from '../lib/zackdFunction.js';

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
    risk: 'read',
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
    risk: 'read',
    description: 'List workflows: your own, published ones, or templates.',
    input: { which: z.enum(['mine', 'published', 'templates']).optional() },
    run: (a, client) => client.raw('GET', { mine: '/workflow/get-workflow-defs', published: '/workflow/get-published-workflows', templates: '/workflow/get-template-workflows' }[a.which || 'mine']),
  },
  {
    name: 'workflow_inputs',
    risk: 'read',
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
    risk: 'read',
    description: 'Check a workflow run started with workflow_run.',
    input: { run_id: ID },
    run: (a, client) => workflowWait(client, a.run_id, 0),
  },
  {
    name: 'agents_list',
    risk: 'read',
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

// ── Studios that run the app's own route handlers as the key owner (lib/mcpStudios.ts) ─────────────────
const studio = (client, name, call) => client.studio(name, call);
const SESSION = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
const JOB = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);

customTools.push(
  // Visual prompt libraries (GO AI Viral): public data, read only.
  {
    name: 'viral_prompts_search',
    risk: 'read',
    description: 'Search the visual prompt feed (ready-made image and video prompts with example media) by keyword, category, model or business niche.',
    input: { search: z.string().optional(), media_type: z.enum(['image', 'video', 'all']).optional(), category: z.string().optional(), model: z.string().optional(), niche: z.string().optional(), sort: z.enum(['newest', 'oldest']).optional(), page: z.number().int().min(1).optional(), page_size: z.number().int().min(1).max(100).optional() },
    run: (a, client) => studio(client, 'go-ai-viral', { route: 'prompts', query: { search: a.search, mediaType: a.media_type, category: a.category, model: a.model, niche: a.niche, sort: a.sort, page: a.page, pageSize: a.page_size } }),
  },
  {
    name: 'viral_seedance_search',
    risk: 'read',
    description: 'Search the Seedance prompt collection by keyword or language.',
    input: { search: z.string().optional(), language: z.string().optional(), has_video: z.boolean().optional(), page: z.number().int().min(1).optional(), page_size: z.number().int().min(1).max(100).optional() },
    run: (a, client) => studio(client, 'go-ai-viral', { route: 'seedance', query: { search: a.search, language: a.language, hasVideo: a.has_video, page: a.page, pageSize: a.page_size } }),
  },

  // Thumbnails (needs your OpenAI key saved in Settings).
  {
    name: 'thumbnail_generate',
    description: 'Generate social thumbnails from a prompt (optionally with reference images, a headline and subheadline). Uses your saved OpenAI key. Returns image URLs or data URLs.',
    input: { prompt: z.string().min(1).max(4000), headline: z.string().max(120).optional(), subheadline: z.string().max(200).optional(), aspect_ratio: z.string().optional().describe('e.g. 16:9, 9:16, 1:1'), n: z.number().int().min(1).max(4).optional(), quality: z.enum(['low', 'medium', 'high']).optional(), reference_urls: z.array(z.string().url()).max(4).optional(), model: z.string().optional() },
    run: (a, client) => studio(client, 'thumbnail', { body: { action: 'generate', prompt: a.prompt, headline: a.headline, subheadline: a.subheadline, aspect_ratio: a.aspect_ratio, n: a.n, quality: a.quality, reference_urls: a.reference_urls, model: a.model } }),
  },
  {
    name: 'thumbnail_refine',
    description: 'Edit an existing thumbnail with a prompt (optionally masked by a PNG data URL). Uses your saved OpenAI key.',
    input: { image_url: z.string().url(), prompt: z.string().min(1).max(4000), mask_url: z.string().startsWith('data:image/png').optional(), aspect_ratio: z.string().optional(), quality: z.enum(['low', 'medium', 'high']).optional(), model: z.string().optional() },
    run: (a, client) => studio(client, 'thumbnail', { body: { action: 'refine', image_url: a.image_url, prompt: a.prompt, mask_url: a.mask_url, aspect_ratio: a.aspect_ratio, quality: a.quality, model: a.model } }),
  },

  // Design Agent: a chat-driven creative agent with sessions, jobs and assets. Ownership is enforced by the app's own routes.
  {
    name: 'design_agent_session',
    description: 'Create a Design Agent session and get its id. Use the id with design_agent_chat.',
    input: { title: z.string().max(200).optional() },
    run: (a, client) => studio(client, 'design-agent', { route: 'sessions', method: 'POST', body: a.title ? { title: a.title } : {} }),
  },
  {
    name: 'design_agent_sessions',
    risk: 'read',
    description: 'List your Design Agent sessions.',
    input: {},
    run: (a, client) => studio(client, 'design-agent', { route: 'sessions' }),
  },
  {
    name: 'design_agent_chat',
    description: 'Send a message to a Design Agent session. Returns a job_id: follow it with design_agent_job.',
    input: { session_id: SESSION, message: z.string().min(1).max(8000), extra: z.record(z.any()).optional().describe('Other fields the Design Agent accepts (e.g. mode, references)') },
    run: (a, client) => studio(client, 'design-agent', { route: 'chat', method: 'POST', body: { ...(a.extra || {}), sessionId: a.session_id, message: a.message } }),
  },
  {
    name: 'design_agent_job',
    description: 'Get a Design Agent job\'s events (progress, messages), or with only session_id the session\'s jobs. wait=true polls until the job reports it is done or waiting for approval.',
    input: { job_id: JOB.optional(), session_id: SESSION.optional(), since: z.string().optional(), limit: z.number().int().min(1).max(200).optional(), wait: z.boolean().optional() },
    run: async (a, client) => {
      if (!a.job_id && !a.session_id) throw Object.assign(new Error('Provide job_id or session_id.'), { code: 'BAD_INPUT' });
      const get = () => studio(client, 'design-agent', { route: 'jobs', query: { jobId: a.job_id, sessionId: a.job_id ? undefined : a.session_id, since: a.since, limit: a.limit } });
      let r = await get();
      if (!a.wait || !a.job_id) return r;
      const deadline = Date.now() + 240_000;
      const finished = (x) => /(complete|completed|done|failed|error|awaiting|approval|cancel)/i.test(JSON.stringify(x?.status ?? x?.state ?? (Array.isArray(x?.events) ? x.events.at(-1)?.type : '') ?? ''));
      while (!finished(r) && Date.now() < deadline) { await client.sleep(3000); r = await get(); }
      return r;
    },
  },
  {
    name: 'design_agent_assets',
    risk: 'read',
    description: 'List the assets (images, designs) a Design Agent session has produced.',
    input: { session_id: SESSION },
    run: (a, client) => studio(client, 'design-agent', { route: 'assets', query: { sessionId: a.session_id } }),
  },
  {
    name: 'design_agent_decide',
    description: 'Approve or reject a Design Agent job that is waiting for your decision.',
    input: { job_id: JOB, decision: z.enum(['approve', 'reject']) },
    run: (a, client) => studio(client, 'design-agent', { route: a.decision === 'approve' ? 'approve' : 'reject', method: 'POST', body: { jobId: a.job_id } }),
  },
  {
    name: 'design_agent_run_skill',
    description: 'Run one of the Design Agent\'s expert skills in a session by name, with its inputs.',
    input: { session_id: SESSION, skill_name: z.string().min(1).max(120), inputs: z.record(z.any()).optional(), model: z.string().optional() },
    run: (a, client) => studio(client, 'design-agent', { route: 'run-skill', method: 'POST', body: { sessionId: a.session_id, skill_name: a.skill_name, inputs: a.inputs, model: a.model } }),
  },

  // Brand Studio. Brands live in the app's in-memory store (per server instance), so a saved brand can be missing on a later call.
  {
    name: 'brand_analyze',
    risk: 'read',
    description: 'Analyse a website\'s brand (name, voice, colours, audience) from its URL.',
    input: { url: z.string().url() },
    run: (a, client) => studio(client, 'brand', { route: 'analyze', method: 'POST', body: { url: a.url } }),
  },
  {
    name: 'brands_list',
    risk: 'read',
    description: 'List your saved brands (the app keeps these in memory per server instance, so a brand can disappear between calls).',
    input: { page: z.number().int().min(1).optional(), page_size: z.number().int().min(1).max(100).optional() },
    run: (a, client) => studio(client, 'brand', { route: 'brands', query: { page: a.page, pageSize: a.page_size } }),
  },
  {
    name: 'brand_save',
    description: 'Save a brand from its website URL (reads its name and tagline).',
    input: { url: z.string().url() },
    run: (a, client) => studio(client, 'brand', { route: 'brands', method: 'POST', body: { url: a.url } }),
  },
  {
    name: 'campaign_generate',
    description: 'Generate a campaign (concepts and copy) for one of your saved brands. The brand must belong to you.',
    input: { brand_id: z.string().min(1).max(100), goal: z.string().min(1).max(500), direction: z.string().max(1000).optional() },
    run: (a, client) => studio(client, 'campaigns', { route: 'generate', body: { brand_id: a.brand_id, goal: a.goal, direction: a.direction } }),
  },
  {
    name: 'campaigns_list',
    risk: 'read',
    description: 'List campaigns for your brands (only brands you own), optionally for one brand.',
    input: { brand_id: z.string().max(100).optional() },
    run: (a, client) => studio(client, 'campaigns', { route: 'list', query: { brand_id: a.brand_id } }),
  },
);


// ── Zack D (curiosity-loop explainer shorts) ───────────────────────────────────────────────────────────
// Media steps use the studio's own models and payloads (lib/zackdFunction.js buildMedia, from src/apps/zackd/zackdPrompts.js).
// If a model's endpoint rejects the job outright the fallback model is tried once; if the outcome is unknown (timeout, dropped
// connection) it is NOT retried, because the first job may have started and been billed.
customTools.push(
  {
    name: 'zackd_trends',
    description: 'Zack D: suggest trending topics for a curiosity-loop short (uses your saved OpenAI key).',
    input: { query: z.string().max(200).optional().describe('Niche or keyword') },
    run: (a, client) => client.studio('zackd', { action: 'trends', query: a.query }),
  },
  {
    name: 'zackd_script',
    description: 'Zack D: turn a topic into a beat map (a script with the visual and narration of each beat). Uses your saved OpenAI key.',
    input: { topic: z.string().min(1).max(200), max_beats: z.number().int().min(2).max(8).optional() },
    run: (a, client) => client.studio('zackd', { action: 'script', topic: a.topic, maxBeats: a.max_beats }),
  },
  {
    name: 'zackd_submit',
    description: 'Zack D: make one media asset. kind=image (prompt), clip (image_url + prompt), tts (text), music (prompt), captions (video_url). Waits for the result unless wait=false.',
    input: {
      kind: z.enum(['image', 'clip', 'tts', 'music', 'captions']),
      prompt: z.string().optional(), text: z.string().optional(), voice: z.string().optional(), speed: z.number().optional(),
      image_url: z.string().url().optional(), video_url: z.string().url().optional(),
      aspect: z.enum(['9:16', '16:9', '1:1']).optional(), duration: z.number().optional(), language: z.string().optional(), theme: z.string().optional(),
      wait: z.boolean().optional().describe('Wait for the result (default true)'),
    },
    run: async (a, client) => {
      const req = buildMedia({ kind: a.kind, prompt: a.prompt, text: a.text, voice: a.voice, speed: a.speed, imageUrl: a.image_url, videoUrl: a.video_url, aspect: a.aspect, duration: a.duration, language: a.language, theme: a.theme });
      if (req.error) throw Object.assign(new Error(req.error), { code: 'BAD_INPUT' });
      let last;
      for (const model of req.models) {
        try {
          const sub = await client.submit(`/${model}`, req.payload);
          const id = sub.request_id || sub.id;
          if (!id) return { status: 'completed', model, outputs: extractOutputs(sub) };
          return a.wait === false ? { status: 'processing', request_id: id, model } : { model, ...(await client.wait(id, { timeoutMs: 600_000 })) };
        } catch (err) {
          if (err?.status === 401 || err?.status === 403 || err?.code === 'NO_KEY') throw err;
          if (!err?.status) throw Object.assign(new Error('The media service did not answer. The job may still have started: check your balance before trying again.'), { code: 'UNKNOWN_OUTCOME' });
          last = err;
        }
      }
      throw last || new Error('The media service rejected the job.');
    },
  },
);
