import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseLesson } from '@/lib/academySteps';

const DIR = path.join(process.cwd(), 'src/content/academy/16-build-and-launch-apps-with-ai-assistants/lessons');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort();

describe('Build with AI lessons are step-by-step and short', () => {
  it('has the overview and 13 lessons', () => expect(files.length).toBe(14));
  for (const f of files) {
    const md = fs.readFileSync(path.join(DIR, f), 'utf8');
    const l = parseLesson(md);
    it(`${f}: stepwise, under 20 minutes, checklist, no secrets`, () => {
      expect(l.steps.length).toBeGreaterThanOrEqual(5);
      expect(l.minutes ?? 0).toBeGreaterThan(0);
      expect(l.minutes ?? 99).toBeLessThan(20);
      expect(l.steps.some((s) => s.kind === 'checklist')).toBe(true);
      for (const s of l.steps) if (s.kind !== 'checklist') expect(s.markdown.trim().length).toBeGreaterThan(0);
      expect(md).not.toMatch(/sk_live_[A-Za-z0-9]{8,}|sk_test_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}/);
    });
    if (f !== '00-overview.md') {
      it(`${f}: action steps say what you should see`, () => {
        const actions = l.steps.filter((s) => s.group);
        expect(actions.length).toBeGreaterThanOrEqual(5);
        const withSee = actions.filter((s) => /You should see/.test(s.markdown)).length;
        expect(withSee / actions.length).toBeGreaterThanOrEqual(0.8);
      });
    }
  }
});
