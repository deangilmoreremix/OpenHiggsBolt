import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Template coverage sweep — every registered design is applied (Replace) on the same real footage, exported through the
 * REAL browser renderer at 16:9, and the encoded file is checked:
 *   - the export is a real, non-trivial MP4 with the composition's dimensions;
 *   - three frames per design are kept (frames/<id>@<t>.png) so scripts/design-sweep-analyze.py can judge "drew something" against the median of all designs;
 *   - the frame is not blank.
 * One PNG per design is kept for contact sheets that are LOOKED AT separately; numbers never replace that look.
 *
 * Chunking: SWEEP_START (default 0) and SWEEP_COUNT (default 15) select a slice of the catalogue-ordered ids;
 * SWEEP_IDS (comma list) overrides. Results append to OUT/results.json.
 * Needs the local dev server with the auth bypass (docs/e2e-auth-bypass.md) and DEMO_BASE_URL if not :3111.
 */
const OUT = process.env.SWEEP_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'design-sweep');
const AI_REQUEST = /muapi|openai|\/api\/personalization\/(personalize|generate|recast|generate-prompt)|promptPersonaliz/i;
const TIMES = [1.0, 2.5, 4.0];
const START = Number(process.env.SWEEP_START ?? 0);
const COUNT = Number(process.env.SWEEP_COUNT ?? 15);
const ONLY = (process.env.SWEEP_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

type Result = {
  id: string; name: string; status: 'pass' | 'unsupported' | 'fail'; reason?: string;
  bytes?: number; width?: number; height?: number; duration?: number;
  blank?: boolean; frame?: string; ms?: number;
};

function rawFrame(file: string, seconds: number): Buffer {
  return execFileSync('ffmpeg', ['-v', 'error', '-ss', String(seconds), '-i', file, '-frames:v', '1', '-vf', 'scale=480:270:flags=bilinear', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64 * 1024 * 1024 });
}

function compare(a: Buffer, b: Buffer): { diff: number; changed: number; stdev: number } {
  const n = Math.min(a.length, b.length) / 3;
  let sum = 0, changed = 0, lumSum = 0, lumSq = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    const d = (Math.abs(a[o] - b[o]) + Math.abs(a[o + 1] - b[o + 1]) + Math.abs(a[o + 2] - b[o + 2])) / 3;
    sum += d;
    if (d > 24) changed++;
    const l = 0.299 * a[o] + 0.587 * a[o + 1] + 0.114 * a[o + 2];
    lumSum += l; lumSq += l * l;
  }
  const mean = lumSum / n;
  return { diff: sum / n, changed: changed / n, stdev: Math.sqrt(Math.max(0, lumSq / n - mean * mean)) };
}

function probe(file: string): { width: number; height: number; duration: number } {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', file]).toString();
  const j = JSON.parse(out);
  return { width: j.streams[0].width, height: j.streams[0].height, duration: Number(j.format.duration) };
}

async function seed(page: Page) {
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    (window as unknown as { __blobs: Blob[] }).__blobs = blobs;
    URL.createObjectURL = (obj: Blob | MediaSource) => { try { if (obj instanceof Blob) blobs.push(obj); } catch { /* ignore */ } return original(obj); };
  });
  await page.context().addCookies([{ name: '__e2e_auth_bypass', value: '1', url: process.env.DEMO_BASE_URL || 'http://localhost:3111' }]);
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', 'Sweep Studio');
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();
  const logo = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 200;
    const g = c.getContext('2d')!; g.fillStyle = '#ffffff'; g.font = 'bold 90px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('SWEEP', 300, 100);
    return c.toDataURL('image/png');
  });
  const pics = await page.evaluate(() => [['#a33b6b', '#ffd400'], ['#1f5fae', '#ffffff']].map(([bg, fg]) => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 600;
    const g = c.getContext('2d')!; g.fillStyle = bg; g.fillRect(0, 0, 900, 600); g.fillStyle = fg; g.beginPath(); g.arc(450, 300, 230, 0, Math.PI * 2); g.fill();
    return c.toDataURL('image/png');
  }));
  const logoCard = page.locator('article.asset-card').filter({ hasText: '2. LOGO' });
  await logoCard.getByPlaceholder('Paste logo URL and press Enter').fill(logo);
  await page.locator('button:has-text("Add Logo URL")').first().dispatchEvent('click');
  const prodCard = page.locator('article.asset-card').filter({ hasText: /3\. PRODUCTS/i }).first();
  for (const pic of pics) {
    const more = prodCard.getByRole('button', { name: /add more/i });
    if (await more.count()) await more.first().click();
    await prodCard.locator('input[placeholder*="Paste"]').first().fill(pic);
    await page.locator('button:has-text("Add Image/Video URL")').first().dispatchEvent('click');
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Simple Mode/i }).click();
  await dialog.getByRole('button', { name: /Step 2/i }).click();
  await dialog.getByRole('tab', { name: /AI Demos/i }).click();
  await dialog.getByPlaceholder('Search demos…').fill('luxury perfume');
  const card = dialog.locator('[data-testid*="luxury-perfume-commercial"]').first();
  await card.scrollIntoViewIfNeeded(); await card.click();
  await page.waitForTimeout(1500);
  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
  return dialog;
}

/** Opens the full library and reads every design card (id + name), in catalogue order. */
async function listDesigns(page: Page, dialog: ReturnType<Page['getByRole']>) {
  await dialog.getByTestId('design-how-replace').click();
  const browse = dialog.getByTestId('design-browse-all');
  if ((await browse.getAttribute('aria-expanded')) !== 'true') await browse.click();
  const more = dialog.getByTestId('personalization-template-show-more');
  for (let i = 0; i < 40 && (await more.count()); i++) { await more.first().click(); await page.waitForTimeout(150); }
  return page.evaluate(() => Array.from(document.querySelectorAll('[data-testid="personalization-template-card"][data-template-kind="design"]'))
    .map((el) => ({ id: el.getAttribute('data-template-id') || '', name: (el.getAttribute('aria-label') || '').replace(/^Select |\s*template$/g, '') })));
}

async function exportCurrent(page: Page, label: string): Promise<string> {
  const dialog = page.getByRole('dialog');
  const approve = dialog.getByRole('button', { name: /Approve this personalization/i });
  if (await approve.count()) await approve.first().click({ timeout: 30_000 });
  const rights = page.getByTestId('guided-rights-confirm').locator('input');
  if (await rights.count()) await rights.check();
  const count = () => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length);
  const before = await count();
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
  await expect.poll(count, { timeout: 240_000, intervals: [500, 1000] }).toBeGreaterThan(before);
  const b64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type));
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
    let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(bin);
  });
  const file = path.join(OUT, 'mp4', `${label}.mp4`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  return file;
}

test('design sweep chunk: every design exports through the real renderer and draws something', async ({ page }) => {
  test.setTimeout(3 * 60 * 60_000);
  fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  const dialog = await seed(page);
  const all = await listDesigns(page, dialog);
  expect(all.length, 'the library lists the registered designs').toBeGreaterThan(100);
  const chosen = ONLY.length ? all.filter((d) => ONLY.includes(d.id)) : all.slice(START, START + COUNT);
  const resultsFile = path.join(OUT, 'results.json');
  const results: Result[] = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf8')) : [];

  for (const design of chosen) {
    const t0 = Date.now();
    const res: Result = { id: design.id, name: design.name, status: 'fail' };
    try {
      await dialog.getByTestId('design-how-replace').click();
      const card = dialog.locator(`[data-testid="personalization-template-card"][data-template-id="${design.id}"]`).first();
      await card.scrollIntoViewIfNeeded();
      if ((await card.getAttribute('aria-disabled')) === 'true') {
        res.status = 'unsupported'; res.reason = (await card.getAttribute('title')) || 'disabled at 16:9';
      } else {
        await card.click();
        await page.waitForTimeout(1200);
        const file = await exportCurrent(page, design.id);
        res.bytes = fs.statSync(file).size;
        Object.assign(res, probe(file));
        // Keep one small PNG per sampled time. "Did it draw something" is judged AFTER the sweep by scripts/design-sweep-analyze.py,
        // against the per-pixel median of all designs' frames (frame-aligned, same codec path, ~clean footage).
        const stdevs: number[] = [];
        for (const t of TIMES) {
          const tt = Math.min(t, (res.duration ?? 5) - 0.2);
          stdevs.push(compare(rawFrame(file, tt), rawFrame(file, tt)).stdev);
          execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(tt), '-i', file, '-frames:v', '1', '-vf', 'scale=480:270', path.join(OUT, 'frames', `${design.id}@${t}.png`)]);
        }
        res.blank = stdevs.every((v) => v < 3);
        const png = path.join(OUT, 'frames', `${design.id}.png`);
        execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '2.5', '-i', file, '-frames:v', '1', '-vf', 'scale=640:-2', png]);
        res.frame = png;
        const problems: string[] = [];
        if ((res.bytes ?? 0) < 10_000) problems.push('file too small');
        if (res.width !== 1920 || res.height !== 1080) problems.push(`dimensions ${res.width}x${res.height}`);
        if (res.blank) problems.push('blank frames');
        res.status = problems.length ? 'fail' : 'pass';
        if (problems.length) res.reason = problems.join('; ');
      }
    } catch (error) {
      res.status = 'fail'; res.reason = `error: ${String((error as Error).message).split('\n')[0].slice(0, 200)}`;
    }
    res.ms = Date.now() - t0;
    const at = results.findIndex((r) => r.id === res.id);
    if (at >= 0) results[at] = res; else results.push(res);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`SWEEP ${res.status.toUpperCase()} ${design.id} ${res.reason ?? ''} ${res.ms}ms`);
  }
  expect(requests.filter((u) => AI_REQUEST.test(u)), 'the sweep makes zero AI requests').toEqual([]);
});
