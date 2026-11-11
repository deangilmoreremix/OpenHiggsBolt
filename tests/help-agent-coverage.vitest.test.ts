import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ACADEMY_STUDIO_GUIDES } from '@/data/academyStudioGuides';

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

describe('Ask SmartVideo is mounted for every studio', () => {
  const shell = read('components/StandaloneShell.js');
  const tabIds = [...shell.slice(shell.indexOf('const TABS'), shell.indexOf('function SignOutButton')).matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
  it('the studio shell mounts it once, with the active studio, outside any per-studio branch', () => {
    expect(shell.match(/<HelpAgent\b/g)?.length).toBe(1);
    expect(shell).toMatch(/<HelpAgent studioId=\{activeTab\}/);
  });
  it('every studio tab in the shell is covered by that mount and has guide content', () => {
    expect(tabIds.length).toBeGreaterThanOrEqual(24);
    for (const id of tabIds) expect(ACADEMY_STUDIO_GUIDES.map((g) => g.id), id).toContain(id);
  });
  it('Brand Studio and Photo Studio (outside the shell) mount it in their own layout', () => {
    const layout = read('app/(brand-studio)/layout.tsx');
    expect(layout).toMatch(/<HelpAgent studioId=\{isPhotoStudio \? 'photo-studio' : 'brand-studio'\}/);
  });
  it('the Academy pages mount it', () => {
    for (const f of ['app/academy/page.tsx', 'app/academy/reseller/launch/page.tsx', 'app/academy/reseller/apps/[appId]/page.tsx']) expect(read(f), f).toMatch(/<HelpAgent/);
  });
});
