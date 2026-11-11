import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import index from '@/data/helpIndex.json';
import { buildIndex, search, type HelpChunk } from '@/lib/helpSearch';
import { ACADEMY_STUDIO_GUIDES } from '@/data/academyStudioGuides';
import { STUDIO_INTENTS, TRACK_INTENTS, RESELLER_MODULE_INTENTS } from '@/data/helpIntents';
import { MODULES } from '@/content/resellerAcademy';
import { STUDIO_SUGGESTIONS } from '@/components/help/HelpAgent';
import { STUDIO_QUESTIONS, ACADEMY_QUESTIONS, RESELLER_QUESTIONS, type HelpQuestion } from './fixtures/helpQuestions';

const chunks = (index as unknown as { chunks: HelpChunk[] }).chunks;
const idx = buildIndex(chunks);
const ROOT = process.cwd();

const matches = (q: HelpQuestion, c: HelpChunk) =>
  !!((q.studio && c.studioId === q.studio) ||
    (q.track && c.kind === 'academy' && q.track.some((t) => c.url.includes(`track=${t}`))) ||
    (q.reseller && c.kind === 'reseller' && q.reseller.some((p) => c.id.startsWith(`reseller:${p}`))));

describe('natural-language questions find the right content (no product words needed)', () => {
  for (const [name, set] of [['studio', STUDIO_QUESTIONS], ['academy', ACADEMY_QUESTIONS], ['reseller', RESELLER_QUESTIONS]] as const) {
    it(`${name}: every question finds its answer in the top 6`, () => {
      const misses = set.filter((q) => !search(idx, q.q, { limit: 6 }).some((r) => matches(q, r.chunk))).map((q) => q.q);
      expect(misses, `missed: ${misses.join(' | ')}`).toEqual([]);
    });
    it(`${name}: the best answer is ranked first for at least 85% of questions`, () => {
      const top1 = set.filter((q) => { const r = search(idx, q.q, { limit: 6 })[0]; return r && matches(q, r.chunk); }).length;
      expect(top1 / set.length).toBeGreaterThanOrEqual(0.85);
    });
  }
});

describe('every studio, course and module is covered', () => {
  it('every studio has a "what you can ask" chunk with several plain-language phrases', () => {
    for (const g of ACADEMY_STUDIO_GUIDES) {
      expect(STUDIO_INTENTS[g.id]?.length ?? 0, g.id).toBeGreaterThanOrEqual(4);
      expect(chunks.some((c) => c.id === `studio:${g.id}:ask`), g.id).toBe(true);
    }
  });
  it('every Academy track has a "what this course helps you do" chunk', () => {
    const dirs = fs.readdirSync(path.join(ROOT, 'src/content/academy'));
    for (const d of dirs) {
      expect(TRACK_INTENTS[d]?.length ?? 0, d).toBeGreaterThanOrEqual(3);
      expect(chunks.some((c) => c.id === `academy:${d}:ask`), d).toBe(true);
    }
  });
  it('every reseller module has a "what you want to do" chunk', () => {
    for (const m of MODULES) {
      expect(RESELLER_MODULE_INTENTS[m.id]?.length ?? 0, `module ${m.id}`).toBeGreaterThanOrEqual(2);
      expect(chunks.some((c) => c.id === `reseller:${m.lessons[0].id}-ask`), `module ${m.id}`).toBe(true);
    }
  });
});

describe('every lesson can be found by asking for it in plain words', () => {
  it('every Academy lesson is found by "how do I <its title>"', () => {
    const base = path.join(ROOT, 'src/content/academy');
    const misses: string[] = [];
    let total = 0;
    for (const track of fs.readdirSync(base)) {
      const dir = path.join(base, track, 'lessons');
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md') && !/^00-/.test(x))) {
        total++;
        const h1 = fs.readFileSync(path.join(dir, f), 'utf8').match(/^#\s+(.+)$/m)?.[1] ?? f;
        const title = h1.replace(/^(Track|Lesson)\s+\d+\s*[:—-]\s*/i, '').replace(/[*_`]/g, '').trim();
        const slug = f.replace(/\.md$/, '');
        const hit = search(idx, `how do I ${title.toLowerCase()}`, { limit: 6 }).some((r) => r.chunk.kind === 'academy' && (r.chunk.url.includes(`track=${track}`) || (track.startsWith('16-') && r.chunk.url.includes('view=build-with-ai'))) && r.chunk.url.includes(`lesson=${slug}`));
        if (!hit) misses.push(`${track}/${slug}`);
      }
    }
    expect(total).toBeGreaterThan(70);
    expect(misses.length / total, `missed: ${misses.join(', ')}`).toBeLessThanOrEqual(0.05);
  });
  it('every reseller lesson is found by its title', () => {
    const misses: string[] = [];
    for (const m of MODULES) for (const l of m.lessons) {
      const hit = search(idx, `how do I ${l.title.toLowerCase()}`, { limit: 6 }).some((r) => r.chunk.kind === 'reseller' && r.chunk.id.startsWith(`reseller:${l.id}`));
      if (!hit) misses.push(l.id);
    }
    expect(misses, `missed: ${misses.join(', ')}`).toEqual([]);
  });
  it("every studio's suggested questions find that studio", () => {
    for (const g of ACADEMY_STUDIO_GUIDES) for (const q of STUDIO_SUGGESTIONS[g.id] ?? []) {
      const hit = search(idx, q, { limit: 6, studioId: g.id }).some((r) => r.chunk.studioId === g.id || r.chunk.kind === 'academy' || r.chunk.kind === 'reseller');
      expect(hit, `${g.id}: ${q}`).toBe(true);
    }
  });
});
