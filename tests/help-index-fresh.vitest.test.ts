import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';

describe('assistant knowledge is current', () => {
  it('src/data/helpIndex.json matches the studio guides, Academy lessons, reseller course and app facts', () => {
    const r = spawnSync('npx', ['tsx', 'scripts/build-help-index.ts', '--check'], { cwd: process.cwd(), encoding: 'utf8' });
    expect(r.stderr + r.stdout, 'run `npm run build:help-index` and commit the result').toContain('up to date');
    expect(r.status).toBe(0);
  }, 60000);
});
