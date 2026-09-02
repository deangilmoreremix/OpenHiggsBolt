import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const shellPath = path.resolve(process.cwd(), 'components/StandaloneShell.js');
const zhRoutePath = path.resolve(process.cwd(), 'app/zh/studio/[[...slug]]/page.js');

describe('SmartVideo parity scope', () => {
  it('keeps MCP / CLI out of the active studio shell', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    expect(source).not.toContain("loadStudio('McpCliStudio')");
    expect(source).not.toContain("id: 'mcp-cli'");
    expect(source).not.toContain("activeTab === 'mcp-cli'");
  });

  it('forwards Chinese locale through the studio shell', () => {
    const source = fs.readFileSync(zhRoutePath, 'utf8');
    expect(source).toContain('<LocaleTextBridge locale="zh" />');
    expect(source).toContain('<StandaloneShell templateData={templateData} locale="zh" />');
  });
});
