// Live check of every recipe endpoint against the API. NOT for CI.
//
//   node scripts/live-recipe-check.mjs                 free existence check only
//   node scripts/live-recipe-check.mjs --generate-images --yes --max-spend 1.5
//
// Existence check: POST {} to /api/v1/<endpoint>. A real model rejects the empty
// body (422, nothing is charged); an unknown model answers 404.
// --generate-images additionally renders ONE real image per image endpoint and
// stops when the balance has dropped by --max-spend (USD).
//
// API key: pass --key, or set MUAPI_API_KEY. In the cloud sandbox a proxy injects
// the credential, so any placeholder works (Node fetch is routed through HTTPS_PROXY).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'packages/studio/src');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

if (process.env.HTTPS_PROXY) {
  const { ProxyAgent, setGlobalDispatcher } = await import('undici');
  const ca = process.env.NODE_EXTRA_CA_CERTS || '/root/.ccr/ca-bundle.crt';
  setGlobalDispatcher(
    new ProxyAgent({
      uri: process.env.HTTPS_PROXY,
      requestTls: fs.existsSync(ca) ? { ca: fs.readFileSync(ca) } : undefined,
    }),
  );
}

// Existence checks and balance use this base; override with MUAPI_API_URL (the
// generation helpers imported from muapi.js use their own base URL).
const API = process.env.MUAPI_API_URL || 'https://api.muapi.ai';
const KEY = opt('--key', process.env.MUAPI_API_KEY || 'proxy-injected');
const MAX_SPEND = Number(opt('--max-spend', '1.5'));
const generate = flag('--generate-images');
const only = opt('--only', '') ? opt('--only', '').split(',') : null;
if (generate && !flag('--yes')) {
  console.error('--generate-images spends credits; add --yes to confirm.');
  process.exit(2);
}

const registry = JSON.parse(fs.readFileSync(path.join(srcDir, 'skills/registry.json'), 'utf8'));
const models = await import(pathToFileURL(path.join(srcDir, 'models.js')).href);
const muapi = await import(pathToFileURL(path.join(srcDir, 'muapi.js')).href);
const { buildParams } = await import(pathToFileURL(path.join(srcDir, 'lib/promptRecipes.js')).href);

// model id -> the endpoint muapi.js actually calls (modelInfo.endpoint || id)
const endpointOf = new Map();
for (const v of Object.values(models)) {
  if (!Array.isArray(v)) continue;
  for (const m of v) if (m?.id) endpointOf.set(m.id, m.endpoint || m.id);
}

const balance = async () =>
  (await (await fetch(`${API}/api/v1/account/balance`, { headers: { 'x-api-key': KEY } })).json()).balance;

// One row per distinct (step type, endpoint), remembering the recipes that use it.
const targets = new Map();
for (const skill of registry.skills.filter((s) => !s.hidden)) {
  skill.steps.forEach((step) => {
    if (['script', 'approval', 'upload'].includes(step.type)) return;
    const id = step.endpoint || step.model;
    const key = `${step.type}|${id}`;
    if (!targets.has(key)) {
      targets.set(key, {
        id,
        type: step.type,
        endpoint: step.type === 'clipping' ? id : endpointOf.get(id) || id,
        skill,
        step,
        recipes: [],
      });
    }
    targets.get(key).recipes.push(skill.slug);
  });
}

const rows = [];
for (const t of targets.values()) {
  const res = await fetch(`${API}/api/v1/${t.endpoint}`, {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'Content-Type': 'application/json' },
    body: '{}',
  });
  t.exists = res.status !== 404;
  t.existsStatus = res.status;
  rows.push(t);
}

const start = await balance();
console.log(`Balance: $${start}`);
let sample = opt('--sample', null);
if (generate) {
  for (const t of rows.filter((r) => r.exists && r.type === 'image' && (!only || only.includes(r.id)))) {
    const spent = start - (await balance());
    if (spent >= MAX_SPEND) {
      t.generated = 'skipped (spend cap reached)';
      continue;
    }
    try {
      const needsRef =
        (t.step.references || []).length > 0 ||
        Boolean(models.getI2IModelById?.(t.id)) ||
        (t.skill.inputs || []).some((i) => i.type === 'image_url');
      if (needsRef && !sample && !only) {
        t.generated = 'skipped (needs a reference image; none generated yet)';
        continue;
      }
      const inputs = Object.fromEntries(
        (t.skill.inputs || []).map((i) => [i.name, i.type === 'image_url' ? sample : 'a red apple on a table']),
      );
      const params = buildParams({ ...t.step, resolution: undefined, references: [] }, inputs, []);
      params.aspect_ratio = '1:1';
      if (needsRef) params.images_list = [sample];
      const out = await (needsRef ? muapi.generateI2I(KEY, params) : muapi.generateImage(KEY, params));
      t.generated = out?.url || out?.outputs?.[0] || 'no url returned';
      if (!sample && /^https?:/.test(t.generated)) sample = t.generated;
    } catch (e) {
      t.generated = `FAILED: ${String(e.message || e).slice(0, 140)}`;
    }
  }
}
const end = await balance();

const pad = (s, n) => String(s).padEnd(n);
console.log(`\n${pad('type', 9)}${pad('endpoint', 46)}${pad('exists', 9)}recipes / generation`);
for (const t of rows) {
  const name = t.endpoint === t.id ? t.id : `${t.id} -> ${t.endpoint}`;
  const line = `${pad(t.type, 9)}${pad(name, 46)}${pad(t.exists ? `yes(${t.existsStatus})` : 'NO(404)', 9)}${t.recipes.join(', ')}`;
  console.log(line + (t.generated ? `\n${' '.repeat(64)}> ${t.generated}` : ''));
}
const missing = rows.filter((r) => !r.exists);
const failed = rows.filter((r) => String(r.generated || '').startsWith('FAILED'));
console.log(
  `\n${rows.length} endpoints: ${rows.length - missing.length} exist, ${missing.length} missing, ${failed.length} generation failures. Spent $${(start - end).toFixed(3)} (balance $${end}).`,
);
process.exit(missing.length || failed.length ? 1 : 0);
