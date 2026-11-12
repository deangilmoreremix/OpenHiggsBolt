import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseLesson } from '@/lib/academySteps';

const ROOT = path.join(process.cwd(), 'src/content/academy');
const all: { track: string; f: string; file: string }[] = [];
for (const t of fs.readdirSync(ROOT).sort()) {
  const d = path.join(ROOT, t, 'lessons');
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.md')).sort()) all.push({ track: t, f, file: path.join(d, f) });
}
const isOverview = (f: string) => /^00-/.test(f);

describe('every Academy lesson is step-by-step and short', () => {
  it('covers all 16 tracks', () => expect(new Set(all.map((a) => a.track)).size).toBe(16));
  for (const { track, f, file } of all) {
    const md = fs.readFileSync(file, 'utf8');
    if (isOverview(f)) { it(`${track}/${f}: overview has no secrets`, () => expect(md).not.toMatch(/sk_(live|test)_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}/)); continue; }
    const l = parseLesson(md);
    it(`${track}/${f}: stepwise, under 20 minutes, checklist, no secrets`, () => {
      expect(l.steps.length).toBeGreaterThanOrEqual(5);
      expect(l.minutes ?? 0).toBeGreaterThan(0);
      expect(l.minutes ?? 99).toBeLessThan(20);
      expect(l.steps.some((s) => s.kind === 'checklist')).toBe(true);
      for (const s of l.steps) if (s.kind !== 'checklist') expect(s.markdown.trim().length).toBeGreaterThan(0);
      expect(md).not.toMatch(/sk_live_[A-Za-z0-9]{8,}|sk_test_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}/);
    });
    {
      it(`${track}/${f}: action steps say what you should see`, () => {
        const actions = l.steps.filter((s) => s.group);
        expect(actions.length).toBeGreaterThanOrEqual(3);
        const withSee = actions.filter((s) => /You should see/.test(s.markdown)).length;
        expect(withSee / actions.length).toBeGreaterThanOrEqual(0.8);
      });
    }
  }
});

import { getAllTracks } from '@/lib/academyLessons';
describe('lesson order', () => {
  it('puts "part 2" right after its part 1 in every track', () => {
    for (const t of getAllTracks()) {
      const slugs = t.lessons.map((l) => l.slug);
      for (const s of slugs.filter((x) => x.endsWith('-part-2'))) {
        const base = s.replace(/-part-2$/, '');
        expect(slugs.indexOf(base), `${t.slug}/${s}`).toBeGreaterThanOrEqual(0);
        expect(slugs.indexOf(s), `${t.slug}/${s}`).toBe(slugs.indexOf(base) + 1);
      }
    }
  });
});
