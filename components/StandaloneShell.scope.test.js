import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const shellPath = path.resolve(process.cwd(), 'components/StandaloneShell.js');
const indexPath = path.resolve(process.cwd(), 'packages/studio/src/index.js');
const zhRoutePath = path.resolve(process.cwd(), 'app/zh/studio/[[...slug]]/page.js');
const designAgentPath = path.resolve(process.cwd(), 'src/apps/design-agent/DesignAgent.tsx');
const syncPath = path.resolve(process.cwd(), '.github/workflows/upstream-sync.yml');

describe('SmartVideo parity scope', () => {
  it('keeps excluded upstream studios out of the active shell', () => {
    const shell = fs.readFileSync(shellPath, 'utf8');
    const index = fs.readFileSync(indexPath, 'utf8');

    expect(shell).not.toContain("loadStudio('McpCliStudio')");
    expect(shell).not.toContain("id: 'mcp-cli'");
    expect(shell).not.toContain("activeTab === 'mcp-cli'");
    expect(shell).not.toContain("loadStudio('AppsStudio')");
    expect(shell).not.toContain("id: 'apps'");
    expect(shell).not.toContain("activeTab === 'apps'");
    expect(index).not.toContain('AppsStudio');
  });

  it('keeps tenant branding logic out of active SmartVideo surfaces', () => {
    const shell = fs.readFileSync(shellPath, 'utf8').toLowerCase();
    const designAgent = fs.readFileSync(designAgentPath, 'utf8').toLowerCase();

    expect(shell).not.toContain('whitelabel');
    expect(designAgent).not.toContain('whitelabel');
  });

  it('protects SmartVideo-owned files in future upstream syncs', () => {
    const sync = fs.readFileSync(syncPath, 'utf8');

    expect(sync).toContain('packages/studio/src/components/AppsStudio.jsx');
    expect(sync).toContain('packages/studio/src/components/McpCliStudio.jsx');
    expect(sync).toContain('components/StandaloneShell.js');
    expect(sync).toContain('src/apps/');
  });

  it('forwards Chinese locale through the studio shell', () => {
    const source = fs.readFileSync(zhRoutePath, 'utf8');
    expect(source).toContain('<LocaleTextBridge locale="zh" />');
    expect(source).toContain('<StandaloneShell templateData={templateData} locale="zh" />');
  });
});
