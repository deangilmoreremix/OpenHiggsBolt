// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { GENERATION_TOOLS } from '../../packages/studio-mcp-core/src/server.js';
import { customTools } from '../../mcp/tools.js';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const manifest = JSON.parse(read('../../mcp/studios.json'));
const catalog = JSON.parse(read('../../mcp/catalog.json'));

// Studios in the app = tab ids in components/StandaloneShell.js
const shell = read('../../components/StandaloneShell.js');
const tabs = shell.slice(shell.indexOf('const TABS = ['), shell.indexOf('];', shell.indexOf('const TABS = [')));
const appStudios = [...tabs.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);

const toolNames = new Set([...GENERATION_TOOLS.map((t) => t.name), ...customTools.map((t) => t.name), 'list_studios', 'search_models', 'get_model', 'estimate_cost', 'get_result', 'upload_file', 'account_balance']);
const kindsInCatalog = new Set(catalog.map((e) => e.kind));

describe('every studio in the app is classified', () => {
  it('has a manifest entry (supported or unsupported-with-reason) for each studio', () => {
    const classified = new Set([...Object.keys(manifest.supported), ...Object.keys(manifest.unsupported)]);
    expect(appStudios.length).toBeGreaterThan(20);
    expect(appStudios.filter((s) => !classified.has(s)), 'new studios need a manifest entry in mcp/studios.json').toEqual([]);
    expect([...classified].filter((s) => !appStudios.includes(s)), 'manifest lists studios that no longer exist').toEqual([]);
  });

  it('never lists a studio as both supported and unsupported, and every unsupported has a reason', () => {
    for (const s of Object.keys(manifest.supported)) expect(manifest.unsupported[s]).toBeUndefined();
    for (const [s, why] of Object.entries(manifest.unsupported)) expect(why.length, s).toBeGreaterThan(10);
  });
});

describe('every supported studio is actually reachable', () => {
  for (const [studio, { tools, kinds }] of Object.entries(manifest.supported)) {
    it(studio, () => {
      for (const t of tools) expect(toolNames.has(t), `tool ${t}`).toBe(true);
      for (const k of kinds) {
        expect(kindsInCatalog.has(k), `catalog kind ${k}`).toBe(true);
        // a tool serving this kind must exist
        expect(GENERATION_TOOLS.some((g) => g.kinds.includes(k) && tools.includes(g.name)), `no listed tool serves kind ${k}`).toBe(true);
      }
    });
  }

  it('catalog has no models for studios outside the manifest', () => {
    const known = new Set(Object.keys(manifest.supported));
    for (const e of catalog) for (const s of e.studios) expect(known.has(s), `${e.key} tagged with unknown studio ${s}`).toBe(true);
  });
});

// ── features: every feature of every studio is mapped to real tools or explained ─────────────────────
describe('every feature is mapped or explained', () => {
  const bridge = JSON.parse(read('../../mcp/bridge-tools.json'));
  const bridgeNames = new Set(Object.values(bridge.studios).flatMap((s) => s.tools.map((t) => t.name)));
  const features = manifest.features || {};

  it('feature lists exist only for studios in the app (plus "shared")', () => {
    for (const s of Object.keys(features)) expect(s === 'shared' || appStudios.includes(s), `features for unknown studio ${s}`).toBe(true);
  });
  it('every supported studio has features, and every classified-unsupported studio does not pretend to', () => {
    for (const s of Object.keys(manifest.supported)) expect((features[s] || []).length, `${s} has no features listed`).toBeGreaterThan(0);
    for (const s of Object.keys(manifest.unsupported)) expect(features[s], s).toBeUndefined();
  });
  it('each feature names real tools, real tab tools, or a reason', () => {
    for (const [studio, list] of Object.entries(features)) for (const f of list) {
      expect(f.name?.length, `${studio} feature name`).toBeGreaterThan(3);
      if (f.notExposed) { expect(f.notExposed.length, `${studio}/${f.name}`).toBeGreaterThan(20); continue; }
      expect((f.tools?.length || 0) + (f.bridgeTools?.length || 0), `${studio}/${f.name} maps to nothing`).toBeGreaterThan(0);
      for (const t of f.tools || []) expect(toolNames.has(t), `${studio}/${f.name}: tool ${t}`).toBe(true);
      for (const t of f.bridgeTools || []) expect(bridgeNames.has(t), `${studio}/${f.name}: tab tool ${t}`).toBe(true);
    }
  });
  it('no registered tool or tab tool is left unmapped', () => {
    const mapped = new Set(Object.values(features).flatMap((l) => l.flatMap((f) => [...(f.tools || []), ...(f.bridgeTools || [])])));
    const ignore = new Set(['list_studios']);
    for (const n of [...customTools.map((t) => t.name), ...bridgeNames, ...GENERATION_TOOLS.map((t) => t.name)]) expect(mapped.has(n) || ignore.has(n), `tool ${n} is in no studio's features`).toBe(true);
  });
  it('a bridge-only studio names its tab tools and every tab tool belongs to one', () => {
    for (const [studio, entry] of Object.entries(manifest.supported)) if (entry.bridgeTools) expect(bridge.studios[entry.bridgeTools], `${studio} bridge group`).toBeTruthy();
  });
});
