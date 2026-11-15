import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * "Export all 4 shapes" in a REAL browser with the real web renderer: four MP4s come out, each with the
 * dimensions of its own shape, and the run makes no AI / prompt-personalization / MuAPI request.
 */
const OUT = process.env.PHASE5_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'shape-export');
const AI_REQUEST = /muapi|openai|\/api\/personalization\/(personalize|generate|recast)|promptPersonaliz|generate-prompt/i;
const EXPECTED: Array<[string, number, number]> = [['16x9', 1920, 1080], ['9x16', 1080, 1920], ['1x1', 1080, 1080], ['4x5', 1080, 1350]];

test('Export all 4 shapes renders four correctly-shaped videos with no AI request', async ({ page }) => {
  test.setTimeout(900_000);
  fs.mkdirSync(OUT, { recursive: true });
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    URL.createObjectURL = (obj: Blob | MediaSource) => { try { if (obj instanceof Blob) blobs.push(obj); } catch { /* ignore */ } return original(obj); };
    (window as unknown as { __blobs: Blob[] }).__blobs = blobs;
  });
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', 'Joes Pizza');
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();
  await page.getByRole('button', { name: /Simple Mode/i }).click();

  await dialog.getByRole('button', { name: /Step 2/i }).click();
  await dialog.getByRole('tab', { name: /AI Demos/i }).click();
  await dialog.getByPlaceholder('Search demos…').fill('luxury perfume');
  const card = dialog.locator('[data-testid*="luxury-perfume-commercial"]').first();
  await card.scrollIntoViewIfNeeded(); await card.click();
  await page.waitForTimeout(1500);
  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
  await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
  const rights = page.getByTestId('guided-rights-confirm').locator('input');
  if (await rights.count()) await rights.check();

  await dialog.getByTestId('pz-export-all-shapes').click({ timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 800_000, intervals: [1000, 2000] }).toBeGreaterThanOrEqual(4);
  for (const [slug] of EXPECTED) await expect(dialog.getByTestId(`pz-shape-${slug}`)).toHaveAttribute('data-status', 'done');

  const files = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).slice(-4);
    const out: string[] = [];
    for (const blob of blobs) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
      out.push(btoa(bin));
    }
    return out;
  });
  const dims: string[] = [];
  files.forEach((b64, i) => {
    const file = path.join(OUT, `shape-${i}.mp4`);
    fs.writeFileSync(file, Buffer.from(b64, 'base64'));
    const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim();
    dims.push(probe);
  });
  fs.writeFileSync(path.join(OUT, 'dims.txt'), dims.join('\n'));
  expect(dims.sort()).toEqual(EXPECTED.map(([, w, h]) => `${w},${h}`).sort());
  expect(requests.filter((u) => AI_REQUEST.test(u))).toEqual([]);
});
