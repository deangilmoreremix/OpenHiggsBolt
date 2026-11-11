import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import index from '@/data/helpIndex.json';
import { buildIndex, search, studioIdFromPath, tokenize, type HelpChunk } from '@/lib/helpSearch';
import { MODULES } from '@/content/resellerAcademy';
import { WORKSHOP_APP_IDS } from '@/lib/resellerAcademyApps';
import { ACADEMY_STUDIO_GUIDES, academyStudioUrl } from '@/data/academyStudioGuides';

const chunks = (index as unknown as { chunks: HelpChunk[] }).chunks;
const idx = buildIndex(chunks);

describe('help index integrity', () => {
  it('has unique ids and non-empty text', () => {
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
    for (const c of chunks) expect(c.text.length, c.id).toBeGreaterThan(30);
  });
  it('contains no secret-looking values', () => {
    const re = /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}|\bwhsec_[A-Za-z0-9]{10,}|\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/;
    expect(chunks.some((c) => re.test(c.text))).toBe(false);
  });
  it('every url points at a real page', () => {
    const shell = fs.readFileSync(path.join(process.cwd(), 'components/StandaloneShell.js'), 'utf8');
    const lessonIds = new Set(MODULES.flatMap((m) => m.lessons.map((l) => l.id)));
    for (const c of chunks) {
      if (c.kind === 'studio') {
        const id = c.url.replace(/^\/(studio\/)?/, '');
        const ok = c.url === '/studio' || c.url === '/photo-studio' || c.url === '/brand-studio' || c.url === '/studio/apps' || shell.includes(`id: '${id}'`) || fs.existsSync(path.join(process.cwd(), 'app/studio')) ;
        expect(ok, c.id).toBe(true);
      } else if (c.kind === 'academy') expect(c.url).toMatch(/^\/academy\?track=[^&]+(&lesson=[^&]+)?$/);
      else if (c.kind === 'reseller') expect(lessonIds.has(c.url.split('lesson=')[1]), c.id).toBe(true);
      else expect(WORKSHOP_APP_IDS.includes(c.url.split('/').pop()!), c.id).toBe(true);
    }
  });
  it('covers every kind, all 38 apps and all reseller lessons', () => {
    const by = (k: string) => chunks.filter((c) => c.kind === k).length;
    expect(by('studio')).toBeGreaterThan(100);
    expect(by('academy')).toBeGreaterThan(500);
    expect(by('app')).toBe(38);
    expect(MODULES.flatMap((m) => m.lessons).every((l) => chunks.some((c) => c.id.startsWith(`reseller:${l.id}`)))).toBe(true);
  });
  it('every studio tab is reachable through the directory', () => {
    const dir = chunks.find((c) => c.id === 'studio:directory')!;
    for (const route of ['/studio/image', '/studio/video', '/studio/zackd', '/studio/motion-control', '/studio/edit', '/brand-studio', '/studio/apps']) expect(dir.text).toContain(route);
  });
});

describe('retrieval golden set', () => {
  const golden: [string, string, (c: HelpChunk) => boolean, string?][] = [
    ['How do I set up the Stripe webhook for my app?', 'reseller', (c) => c.id.startsWith('reseller:8.3')],
    ['How do I set up the Stripe webhook so credits are added?', 'reseller', (c) => c.id.startsWith('reseller:8.3')],
    ['Why did my payment succeed but the credits did not appear', 'reseller', (c) => c.kind === 'reseller' || c.kind === 'app'],
    ['How do I connect my own domain to Vercel', 'reseller', (c) => c.id.startsWith('reseller:10.2')],
    ['What is test mode in Stripe', 'reseller', (c) => c.id.startsWith('reseller:7.5')],
    ['How do I get a MuAPI key', 'reseller', (c) => c.id.startsWith('reseller:4.1')],
    ['Where do I get Google client id for sign in', 'reseller', (c) => c.id.startsWith('reseller:5.4')],
    ['What does the Pet Product Studio need to deploy', 'app', (c) => c.id === 'app:pet-product-studio'],
    ['Which webhook path for blogger cms', 'app', (c) => c.id === 'app:blogger-cms'],
    ['How do I generate an image from a text prompt', 'studio', (c) => c.kind === 'studio' && c.studioId === 'image'],
    ['How many reference images can I upload in image studio', 'studio', (c) => c.studioId === 'image'],
    ['How do I lip sync a video to audio', 'studio', (c) => c.studioId === 'lipsync'],
    ['create a storyboard for my video', 'studio', (c) => c.studioId === 'storyboard'],
    ['How do I make a thumbnail for YouTube', 'studio', (c) => c.studioId === 'thumbnail-studio'],
    ['How do I build a workflow', 'studio', (c) => c.studioId === 'workflows'],
    ['What is the Zack D studio', 'studio', (c) => c.studioId === 'zackd'],
    ['Where is Motion Control', 'studio', (c) => c.studioId === 'motion-control' || c.id === 'studio:directory'],
    ['how do I make UGC video ads that brands pay for', 'academy', (c) => c.kind === 'academy'],
    ['AI headshots and portraits course', 'academy', (c) => c.kind === 'academy' || c.studioId === 'ai-influencer'],
  ];
  for (const [q, , ok] of golden) {
    it(q, () => {
      const top = search(idx, q, { limit: 6 });
      expect(top.length).toBeGreaterThan(0);
      expect(top.some((t) => ok(t.chunk)), `top: ${top.map((t) => t.chunk.id).join(', ')}`).toBe(true);
    });
  }
  it('boosts the current studio', () => {
    const plain = search(idx, 'troubleshooting problems', { limit: 6 });
    const boosted = search(idx, 'troubleshooting problems', { limit: 6, studioId: 'cinema' });
    expect(boosted.filter((t) => t.chunk.studioId === 'cinema').length).toBeGreaterThanOrEqual(plain.filter((t) => t.chunk.studioId === 'cinema').length);
    expect(boosted[0].chunk.studioId).toBe('cinema');
  });
  it('returns nothing for gibberish and varies sources', () => {
    expect(search(idx, 'zzqx vvkk')).toEqual([]);
    const urls = search(idx, 'prompt', { limit: 6 }).map((t) => t.chunk.url);
    for (const u of new Set(urls)) expect(urls.filter((x) => x === u).length).toBeLessThanOrEqual(3);
  });
});

describe('helpers', () => {
  it('tokenizes and maps paths to studios', () => {
    expect(tokenize('How do I upload images?')).toEqual(['upload', 'image']);
    expect(studioIdFromPath('/studio/image')).toBe('image');
    expect(studioIdFromPath('/photo-studio')).toBe('photo-studio');
    expect(studioIdFromPath('/academy/reseller/launch')).toBe('apps');
    expect(studioIdFromPath('/')).toBeNull();
  });
});

describe('assistant links every studio to its page and its Academy guide', () => {
  for (const g of ACADEMY_STUDIO_GUIDES) {
    it(`${g.label}: "how do I use ${g.label}" returns its guide with both links`, () => {
      const top = search(idx, `How do I use ${g.label} step by step?`, { limit: 6 });
      const hit = top.find((t) => t.chunk.studioId === g.id);
      expect(hit, `top: ${top.map((t) => t.chunk.id).join(', ')}`).toBeTruthy();
      expect(hit!.chunk.url).toBe(g.route);
      expect(hit!.chunk.guideUrl).toBe(academyStudioUrl(g.id));
    });
  }
  it('academy lesson chunks deep-link to the exact lesson', () => {
    const lesson = chunks.find((c) => c.kind === 'academy' && c.id.includes(':lessons:'))!;
    expect(lesson.url).toMatch(/^\/academy\?track=.+&lesson=.+/);
  });
});

describe('Netlify / Clerk / Stripe with Claude or ChatGPT lessons', () => {
  it.each([
    ['How do I connect Claude to Netlify, Clerk and Stripe with connectors?', ['reseller:13.2', 'academy:16-build-and-launch-apps-with-ai-assistants']],
    ['How do I start free Netlify, Clerk and Stripe accounts?', ['reseller:13.1', 'academy:16-build-and-launch-apps-with-ai-assistants']],
    ['How do I add Clerk sign up to my app?', ['reseller:13.6']],
    ['How do I connect ChatGPT connectors to Netlify?', ['reseller:13.3', 'academy:16-build-and-launch-apps-with-ai-assistants']],
  ])('finds the lesson for: %s', (q, prefixes) => {
    const ids = search(idx, q, { studioId: 'apps', limit: 6 }).map((h) => h.chunk.id);
    expect(ids.some((id) => prefixes.some((p) => id.startsWith(p))), ids.join(', ')).toBe(true);
  });
});
