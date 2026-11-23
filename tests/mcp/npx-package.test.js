// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectStdio, createGovernor, createMemoryGovernorStore } from '../../packages/studio-mcp-core/src/index.js';
import { createHandler as createGateway } from '../../lib/mcpGateway.js';
import { createMcpKey, resolveMcpKey } from '../../lib/mcpKeys.js';

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../packages/smartvideo-go-mcp');
const bin = path.join(pkgDir, 'dist/index.js');
const MU = 'mu_saved_key_0123456789abcdef';

beforeAll(() => { execFileSync(process.execPath, [path.join(pkgDir, 'scripts/build.mjs')], { stdio: 'pipe' }); }, 120_000);

describe('smartvideo-go-mcp package', () => {
  it('packs only the bundle and the README, with no secrets and no upstream name', () => {
    const out = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: pkgDir, encoding: 'utf8' }));
    const files = out[0].files.map((f) => f.path).sort();
    expect(files).toEqual(['README.md', 'dist/index.js', 'package.json']);
    expect(files.join(' ')).not.toMatch(/\.env|secret|key|mu-?api/i);
    const manifest = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
    expect(manifest.bin['smartvideo-go-mcp']).toBe('dist/index.js');
    expect(manifest.name).toBe('smartvideo-go-mcp');
  });

  it('the shipped text carries no upstream name, no secret-looking values, and no server-only code paths', () => {
    const bundle = readFileSync(bin, 'utf8');
    const readme = readFileSync(path.join(pkgDir, 'README.md'), 'utf8');
    for (const text of [bundle, readme]) {
      expect(text).not.toMatch(/mu-?api/i);
      expect(text).not.toMatch(/sk-[A-Za-z0-9]{20,}|sv_live_[A-Za-z0-9_-]{30,}|SUPABASE_SERVICE_ROLE|MCP_KEY_SECRET|MUAPI_KEY_SECRET/);
    }
    expect(bundle.startsWith('#!/usr/bin/env node')).toBe(true);
    expect(readme).toMatch(/--transport http/);
    expect(readme).toMatch(/npx -y smartvideo-go-mcp/);
  });

  describe('runs over stdio', () => {
    let server; let url; let key;
    beforeAll(async () => {
      const rows = [];
      const store = {
        insert: async (r) => { const row = { id: crypto.randomUUID(), created_at: 'now', revoked_at: null, ...r }; rows.push(row); return row; },
        byHash: async (h) => rows.find((r) => r.key_hash === h && !r.revoked_at) || null,
        countActive: async () => 0, touch: async () => {},
      };
      key = (await createMcpKey(store, { userId: 'owner_1' })).key;
      const gateway = createGateway({ resolve: (raw) => resolveMcpKey(store, async () => ({ muapi: MU, openai: null }), raw), studios: {}, env: {}, governor: createGovernor({ store: createMemoryGovernorStore() }), limiter: null });
      server = http.createServer(async (req, res) => {
        let body = ''; for await (const c of req) body += c;
        const u = new URL(req.url, 'http://x');
        const out = await gateway({ httpMethod: req.method, path: u.pathname + u.search, queryStringParameters: Object.fromEntries(u.searchParams), headers: req.headers, body: body || undefined });
        res.writeHead(out.statusCode, out.headers); res.end(out.body);
      });
      await new Promise((r) => server.listen(0, '127.0.0.1', r));
      url = `http://127.0.0.1:${server.address().port}/api/mcp-gateway`;
    });
    afterAll(() => server?.close());

    it('lists the tools and answers a call through the gateway', async () => {
      expect(existsSync(bin)).toBe(true);
      const mcp = await connectStdio({ command: process.execPath, args: [bin], env: { SMARTVIDEO_GO_API_KEY: key, SMARTVIDEO_GO_API_URL: url } });
      try {
        const { tools } = await mcp.listTools();
        expect(tools.length).toBeGreaterThan(50);
        expect(tools.every((t) => t.name.startsWith('smartvideo_'))).toBe(true);
        expect(JSON.stringify(tools)).not.toMatch(/mu-?api/i);
        const r = await mcp.callTool({ name: 'smartvideo_list_studios', arguments: {} });
        expect(r.isError).toBeFalsy();
        const del = await mcp.callTool({ name: 'smartvideo_video_pages_delete', arguments: { id: 'abcdefgh12' } });
        expect(JSON.stringify(del.content)).toMatch(/confirm/i);
      } finally { await mcp.close(); }
    }, 60_000);
  });
});
