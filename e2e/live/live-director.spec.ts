import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { test, expect, type Page } from '@playwright/test';
import { BASE_URL, installStudioSession } from '../helpers/motion-studio';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';

/**
 * LIVE verification of the director against the real OpenAI API (development only).
 *
 * Authorisation: the key is the developer's own and is never in the repo. Start the dev server AND this run from a shell that has
 *   export MS_LIVE_OPENAI_KEY=...            (read by the dev server for the e2e bypass user only, never in production)
 * Nothing prints, stores or reports the key; the results file records only the last 4 characters as `keyHint`.
 * Without a key every live test is BLOCKED — NO AUTHORIZED KEY and nothing is faked.
 * `MS_LIVE_DRYRUN=1` runs the same harness against a stub of the route to prove its wiring; its results are labelled `dryRun: true`
 * and are NEVER live evidence.
 *
 * Run:  MS_OFFLINE_CLERK=1 MS_LIVE_OPENAI_KEY=... npx playwright test -c playwright.ms.config.ts e2e/live/live-director.spec.ts
 * Output: docs/motion-director-pipeline-audit/round9/live-results.json
 */
const KEY = process.env.MS_LIVE_OPENAI_KEY ?? '';
const DRY = process.env.MS_LIVE_DRYRUN === '1';
const LIVE = Boolean(KEY) && !DRY;
const BLOCKED = 'BLOCKED — NO AUTHORIZED KEY';
const OUT = 'docs/motion-director-pipeline-audit/round9/live-results.json';
const keyHint = KEY ? `…${KEY.slice(-4)}` : null;

interface Result { operation: string; status: 'passed' | 'failed' | 'blocked'; live: boolean; dryRun: boolean; model: string | null; httpStatus: number | null; schemaValid: boolean | null; behaviour: string; error?: string; ms?: number; keyHint: string | null }
const results: Result[] = [];
const record = (r: Omit<Result, 'live' | 'dryRun' | 'keyHint'>) => { results.push({ ...r, live: LIVE, dryRun: DRY, keyHint }); };

function png(w: number, h: number, rgb: [number, number, number]): string {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const body = Buffer.concat([Buffer.from(t), d]); const s = Buffer.alloc(4); s.writeUInt32BE(crc(body)); return Buffer.concat([l, body, s]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]);
  const buf = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(Array.from({ length: h }, () => row)))), chunk('IEND', Buffer.alloc(0))]);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const IDS = new Set(MOTION_TEMPLATES.map((t) => t.id));
const PROMPT = 'Create a cinematic 30-second promotional video for my real estate business using these photographs. Make it feel premium, show the properties, and end with our logo and call to action.';

/** A DRY-RUN stub of the route (labelled; never live). */
async function stubRoute(page: Page) {
  await page.route('**/api/motion-studio/director', async (route) => {
    const b = JSON.parse(route.request().postData() || '{}');
    const ok = (json: unknown) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'x-director-model': 'dry-run-stub' }, body: JSON.stringify(json) });
    if (b.mode === 'brief') return ok({ brief: { rows: [{ item: 'Product', judgment: 'luxury real estate properties', evidence: 'prompt' }, { item: 'Audience', judgment: 'prospective buyers', evidence: 'prompt' }, { item: 'Call to action', judgment: 'end on the logo and a call to action', evidence: 'prompt' }], questions: [] } });
    if (b.mode === 'direction') return ok({ options: { directions: [{ name: 'Quiet luxury', claim: 'c', keywords: ['calm'], look: 'l', motion: 'm', why: 'w', tradeoff: 't' }], recommended: 0 } });
    if (b.mode === 'mapping') return ok({ mapping: [{ feature: 'The home', firstShot: [...IDS][0], altShot: '', expresses: 'x', pageState: '' }] });
    if (b.mode === 'review') return ok({ findings: [], summary: 'dry run' });
    if (b.mode === 'final-review') return ok({ items: ['P1', 'F1', 'V1', 'S1', 'B1', 'D1', 'Q1'].map((id) => ({ id, ok: true, seconds: [], text: 'dry run', stage: 'none' })), summary: 'dry run' });
    return ok({ plan: { title: 't', summary: 's', palette: { background: '#f4efe6', text: '#1b1712', accent: '#b5651d' }, scenes: [{ kind: 'title', recipeId: '', durationSec: 8, headline: 'a', caption: '', transition: 'cut' }, { kind: 'shot', recipeId: [...IDS][0], durationSec: 7, headline: 'b', caption: '', transition: 'cut' }, { kind: 'shot', recipeId: [...IDS][1], durationSec: 7, headline: 'b', caption: '', transition: 'cut' }, { kind: 'title', recipeId: '', durationSec: 8, headline: 'c', caption: '', transition: 'cut' }] } });
  });
}

async function call(page: Page, body: Record<string, unknown>) {
  const t0 = Date.now();
  const r = await page.evaluate(async (b) => {
    const res = await fetch('/api/motion-studio/director', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    const json = await res.json().catch(() => null);
    return { status: res.status, model: res.headers.get('x-director-model'), json };
  }, body);
  return { ...r, ms: Date.now() - t0 };
}

test.describe.configure({ mode: 'serial' });
test.describe('live director verification', () => {
  test.beforeEach(async ({ page }) => {
    if (!LIVE && !DRY) test.skip(true, BLOCKED);
    await installStudioSession(page);
    if (DRY) await stubRoute(page);
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  });
  test.afterAll(() => {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    const status = LIVE ? 'LIVE' : DRY ? 'DRY-RUN (not live evidence)' : BLOCKED;
    fs.writeFileSync(OUT, JSON.stringify({ status, generatedAt: new Date().toISOString(), note: LIVE ? 'Real OpenAI calls through the app\'s own route.' : DRY ? 'Stubbed route: proves the harness only.' : 'No key in this environment: nothing was run against OpenAI.', operations: results.length ? results : [{ operation: 'all', status: 'blocked', live: false, dryRun: false, model: null, httpStatus: null, schemaValid: null, behaviour: BLOCKED, keyHint: null }] }, null, 2));
  });

  const op = (name: string, fn: (page: Page) => Promise<{ httpStatus: number; model: string | null; schemaValid: boolean; behaviour: string; ms: number }>) =>
    test(name, async ({ page }) => {
      try {
        const r = await fn(page);
        record({ operation: name, status: 'passed', model: r.model, httpStatus: r.httpStatus, schemaValid: r.schemaValid, behaviour: r.behaviour, ms: r.ms });
      } catch (error) {
        record({ operation: name, status: 'failed', model: null, httpStatus: null, schemaValid: false, behaviour: 'the response did not cause the intended behaviour', error: String(error instanceof Error ? error.message : error).slice(0, 300) });
        throw error;
      }
    });

  op('1. product brief', async (page) => {
    const r = await call(page, { mode: 'brief', prompt: PROMPT, durationSec: 30, aspectRatio: '16:9' });
    expect(r.status, JSON.stringify(r.json).slice(0, 200)).toBe(200);
    const rows = r.json?.brief?.rows ?? [];
    expect(rows.length).toBeGreaterThan(2);
    expect(JSON.stringify(rows)).toMatch(/real estate|propert|home|listing/i);
    return { httpStatus: r.status, model: r.model, schemaValid: true, behaviour: `${rows.length} brief rows about a real-estate business`, ms: r.ms };
  });
  op('2. visual direction', async (page) => {
    const r = await call(page, { mode: 'direction', prompt: PROMPT, durationSec: 30, aspectRatio: '16:9' });
    expect(r.status).toBe(200);
    const o = r.json?.options;
    expect(o?.directions?.length).toBeGreaterThanOrEqual(1);
    expect(o.recommended).toBeGreaterThanOrEqual(0);
    expect(o.recommended).toBeLessThan(o.directions.length);
    for (const d of o.directions) for (const k of ['name', 'claim', 'look', 'motion']) expect(typeof d[k]).toBe('string');
    return { httpStatus: r.status, model: r.model, schemaValid: true, behaviour: `${o.directions.length} directions, recommended ${o.recommended}`, ms: r.ms };
  });
  op('3. feature-to-shot mapping', async (page) => {
    const r = await call(page, { mode: 'mapping', prompt: PROMPT, durationSec: 30, aspectRatio: '16:9', direction: 'Quiet luxury: controlled camera, long holds.' });
    expect(r.status).toBe(200);
    const rows = r.json?.mapping ?? [];
    expect(rows.length).toBeGreaterThan(0);
    for (const m of rows) expect(IDS.has(m.firstShot), `unknown recipe ${m.firstShot}`).toBe(true);
    return { httpStatus: r.status, model: r.model, schemaValid: true, behaviour: `${rows.length} features mapped to catalog recipes only`, ms: r.ms };
  });
  op('4. storyboard (plan)', async (page) => {
    const r = await call(page, { mode: 'plan', prompt: `${PROMPT}\n\nDirection: Quiet luxury.`, durationSec: 30, aspectRatio: '16:9' });
    expect(r.status).toBe(200);
    const sc = r.json?.plan?.scenes ?? [];
    expect(sc.length).toBeGreaterThanOrEqual(4);
    for (const s of sc) if (s.kind === 'shot') expect(IDS.has(s.recipeId), `unknown recipe ${s.recipeId}`).toBe(true);
    const total = sc.reduce((n: number, s: { durationSec: number }) => n + s.durationSec, 0);
    expect(Math.abs(total - 30)).toBeLessThan(10);
    return { httpStatus: r.status, model: r.model, schemaValid: true, behaviour: `${sc.length} scenes, ${Math.round(total)}s, all recipes in the catalog`, ms: r.ms };
  });
  op('5. model-assisted frame review', async (page) => {
    const r = await call(page, { mode: 'review', frames: [{ second: 1, image: png(64, 36, [236, 0, 140]) }, { second: 3, image: png(64, 36, [0, 175, 235]) }], spec: { brief: PROMPT, product: 'Seaside Homes', scenes: ['0:00 title', '0:03 shot'] } });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.json?.findings)).toBe(true);
    return { httpStatus: r.status, model: r.model, schemaValid: true, behaviour: `${r.json.findings.length} findings returned`, ms: r.ms };
  });
  op('6. independent final review', async (page) => {
    const r = await call(page, { mode: 'final-review', spec: { brief: PROMPT, product: 'Seaside Homes', scenes: [] }, shots: [], seams: [], frames: [{ second: 2, image: png(96, 54, [236, 0, 140]) }] });
    expect(r.status).toBe(200);
    const items = r.json?.items ?? [];
    for (const i of items) { expect(typeof i.id).toBe('string'); expect(typeof i.ok).toBe('boolean'); }
    return { httpStatus: r.status, model: r.model, schemaValid: true, behaviour: `${items.length} checklist answers (${[...new Set(items.map((i: { id: string }) => i.id[0]))].join('')})`, ms: r.ms };
  });
});
