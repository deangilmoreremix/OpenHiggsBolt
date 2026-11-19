import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (p: string) => fs.readFileSync(p, 'utf-8');

describe('Studio tab', () => {
  const shell = read('components/StandaloneShell.js');

  it('is a studio tab with its own URL slug', () => {
    expect(shell).toMatch(/\{ id: 'muapi-studio', label: 'Studio' \}/);
    expect(shell).toMatch(/'muapi-studio': 'muapi-studio'/);
  });

  it('mounts lazily (no SSR) with the signed-in user key and the app key modal', () => {
    expect(shell).toContain("dynamic(() => import('../src/apps/muapi-studio/MuapiStudioPanel'), { ssr: false })");
    expect(shell).toMatch(/activeTab === 'muapi-studio' && <MuapiStudioPanel apiKey=\{apiKey\} onRequestApiKey=\{\(\) => setShowApiKeyPopup\(true\)\} \/>/);
  });

  it('uses the cyan theme, tabs layout and the same-origin /api/v1 proxy', () => {
    const panel = read('src/apps/muapi-studio/MuapiStudioPanel.jsx');
    expect(panel).toContain('apiBase=""');
    expect(panel).toContain('theme="cyan"');
    expect(panel).toContain('layout="tabs"');
    expect(panel).toContain("apiKey={apiKey || ''}");
  });

  it('switches off what the /api/v1 proxy cannot do (library and deleting generated files)', () => {
    const panel = read('src/apps/muapi-studio/MuapiStudioPanel.jsx');
    expect(panel).toContain('{ library: false, deleteMedia: false }');
  });

  it('leaves dependency manifests and the frozen lockfile alone (relative import of the vendored build)', () => {
    const panel = read('src/apps/muapi-studio/MuapiStudioPanel.jsx');
    expect(panel).toContain("from '../../../packages/muapi-studio/index.js'");
    expect(fs.existsSync('packages/muapi-studio/index.js')).toBe(true);
    expect(fs.existsSync('packages/muapi-studio/style.css')).toBe(true);
    expect(read('pnpm-workspace.yaml')).not.toContain('muapi-studio');
    expect(read('package.json')).not.toContain('"muapi-studio"');
  });
});
