// Static audit: every recipe step's endpoint must be a model the studios know.
// Usage: node scripts/audit-recipes.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'packages/studio/src');
const registry = JSON.parse(fs.readFileSync(path.join(srcDir, 'skills/registry.json'), 'utf8'));

// Steps that never call a model endpoint.
const NON_MODEL_STEP_TYPES = new Set(['script', 'approval', 'upload']);

async function collectKnownIds() {
  const ids = new Set();
  const addList = (list) => {
    for (const m of list) {
      if (m?.id) ids.add(m.id);
      if (m?.endpoint) ids.add(m.endpoint);
    }
  };
  const files = fs.readdirSync(srcDir).filter((f) => /Models\.js$/.test(f) || f === 'models.js');
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(srcDir, f)).href);
    for (const v of Object.values(mod)) {
      if (Array.isArray(v)) addList(v);
    }
  }
  return ids;
}

const known = await collectKnownIds();
// Non-model service endpoints the studios call directly (e.g. submitAndPoll("ai-clipping", ...)).
const muapiSrc = fs.readFileSync(path.join(srcDir, 'muapi.js'), 'utf8');
const serviceEndpoints = new Set([...muapiSrc.matchAll(/submitAndPoll\(\s*["']([^"']+)["']/g)].map((m) => m[1]));
const rows = [];
const hidden = registry.skills.filter((s) => s.hidden);
for (const skill of registry.skills.filter((s) => !s.hidden)) {
  (skill.steps || []).forEach((step, i) => {
    if (NON_MODEL_STEP_TYPES.has(step.type)) return;
    const endpoint = step.endpoint || step.model;
    rows.push({
      slug: skill.slug,
      studio: skill.studio,
      step: i,
      type: step.type,
      endpoint: endpoint || '(none)',
      ok: Boolean(endpoint) && (known.has(endpoint) || (step.type === 'clipping' && serviceEndpoints.has(endpoint))),
    });
  });
}

const bad = rows.filter((r) => !r.ok);
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ checked: rows.length, unresolved: bad }, null, 2));
} else {
  console.log(`Checked ${rows.length} recipe steps against ${known.size} known model ids/endpoints.`);
  for (const r of bad) console.log(`UNRESOLVED  ${r.slug} [${r.studio}] step ${r.step} (${r.type}): ${r.endpoint}`);
  console.log(`${bad.length} unresolved. ${hidden.length} recipes hidden from the browser:`);
  for (const h of hidden) console.log(`  hidden  ${h.slug}: ${h.hiddenReason || ''}`);
}
process.exit(bad.length ? 1 : 0);
