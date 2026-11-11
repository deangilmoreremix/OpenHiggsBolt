import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import labels from '@/data/studioGuideLabels.json';
import kb from '@/data/studioKnowledgeBase.json';
import { STUDIO_GUIDE_IDS } from '@/data/academyStudioGuides';

/**
 * Drift guard for the studio how-to guides. `src/data/studioGuideLabels.json`
 * lists, per studio, the exact on-screen labels the guide quotes and the source
 * files they were verified in (2026-11-11). If a studio's UI text changes, the
 * label disappears from the source, this test fails, and the guide must be
 * re-checked (then update the label list).
 */
const root = process.cwd();
const entries = (labels as unknown as { studios: Record<string, { files: string[]; labels: string[] }> }).studios;

function sourceText(files: string[]): string {
  const parts: string[] = [];
  const messageDirs = ['packages/studio/src/messages/en', 'messages/en'];
  for (const f of files) {
    const p = path.join(root, f);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) parts.push(fs.readFileSync(p, 'utf8'));
    else if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      const walk = (d: string) => { for (const n of fs.readdirSync(d)) { const q = path.join(d, n); fs.statSync(q).isDirectory() ? walk(q) : /\.(jsx?|tsx?|json)$/.test(n) && parts.push(fs.readFileSync(q, 'utf8')); } };
      walk(p);
    }
  }
  // i18n strings used by the UI live in message files
  for (const d of messageDirs) {
    const dir = path.join(root, d);
    if (fs.existsSync(dir)) for (const n of fs.readdirSync(dir)) if (n.endsWith('.json')) parts.push(fs.readFileSync(path.join(dir, n), 'utf8'));
  }
  return parts.join('\n');
}
const norm = (t: string) => t.replace(/\\u2019|’/g, "'").replace(/&amp;/g, '&').replace(/&apos;|&#39;/g, "'");

describe('studio guide UI labels exist in the studio source', () => {
  it('has a label record for every studio guide', () => {
    for (const id of STUDIO_GUIDE_IDS) expect(entries[id], id).toBeTruthy();
  });
  for (const id of STUDIO_GUIDE_IDS) {
    it(`${id}: every quoted label is still in the code`, () => {
      const e = entries[id];
      if (!e) return;
      const src = norm(sourceText(e.files));
      const missing = e.labels.filter((l) => !src.includes(norm(l)));
      expect(missing, `labels no longer found for ${id}`).toEqual([]);
    });
  }
  it('every guide entry was verified after the stale 2026-09-21 generation', () => {
    const studios = (kb as unknown as { studios: { id: string; verification?: { verifiedAt?: string } }[] }).studios;
    for (const id of STUDIO_GUIDE_IDS) {
      const s = studios.find((x) => x.id === id);
      expect(s?.verification?.verifiedAt, id).toBeTruthy();
      expect(String(s?.verification?.verifiedAt).slice(0, 10) >= '2026-11-11', `${id} not re-verified`).toBe(true);
    }
  });
});
