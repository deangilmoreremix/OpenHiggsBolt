import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The Caption Studio is the one captions UI: open it from the panel, import an SRT (no model needed), pick an embedded font and a magenta background,
 * apply. The live preview then draws the Studio captions in that font (embedded: no font request), the grip drags them and they are kept clear of the
 * business name, and the exported MP4 shows the box where it was put. Offline; needs `ffmpeg` on PATH.
 */
const OUT = process.env.CAPTIONS_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'captions-studio');
const LOGO = path.join(process.cwd(), 'public/motion-studio/previews/IconFlipBloomLogo-a.jpg');
const dataUrl = (file: string) => `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}`;

async function seed(page: Page) {
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    (window as unknown as { __blobs: Blob[] }).__blobs = blobs;
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      try { if (obj instanceof Blob) blobs.push(obj); } catch { /* ignore */ }
      return original(obj);
    };
  });
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', 'Rascop And Associates LLC');
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();
  const logoCard = page.locator('article.asset-card').filter({ hasText: '2. LOGO' });
  await logoCard.getByPlaceholder('Paste logo URL and press Enter').fill(dataUrl(LOGO));
  await page.locator('button:has-text("Add Logo URL")').first().dispatchEvent('click');
  await expect(page.locator('article.asset-card').filter({ hasText: '2. LOGO' }).locator('img').first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /Simple Mode/i }).click();
  await dialog.getByRole('button', { name: /Step 3/i }).click();
  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
}

/** Magenta-ish pixels in a frame (the box is 50 % see-through, so it blends darker over the footage): how many, and their vertical centre as a fraction of the height. */
function magenta(file: string, t: number): { count: number; centerY: number } {
  const w = 480, h = 270;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', `scale=${w}:${h}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  let count = 0, ySum = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    if (raw[i] > 140 && raw[i + 1] < 80 && raw[i + 2] > 140 && raw[i] - raw[i + 1] > 90) { count++; ySum += y; }
  }
  return { count, centerY: count ? ySum / count / h : 0 };
}

test('Caption Studio captions: embedded font, kept clear of the business name, in the live preview and the export', async ({ page }) => {
  test.setTimeout(420_000);
  fs.mkdirSync(OUT, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('captions-open-studio').scrollIntoViewIfNeeded();
  await dialog.getByTestId('captions-open-studio').click();

  // In the Studio: import subtitles (no speech model needed), pick the font and a magenta background, apply.
  const srt = path.join(OUT, 'quote.srt');
  fs.writeFileSync(srt, '1\n00:00:00,600 --> 00:00:03,200\nCall us today for a free quote\n');
  await expect(page.getByText('Import SRT / VTT')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  await page.locator('[data-import]').setInputFiles(srt);
  await expect(page.getByText(/Imported 1 captions/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole('tab', { name: /Style/ }).click();
  await page.locator('select[data-style="fontFamily"]').selectOption('Bangers');
  await page.locator('input[data-style="background"]').check();
  await page.locator('input[data-style="backgroundColor"]').evaluate((el: HTMLInputElement) => { el.value = '#ff00ff'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('[data-act="apply"]').click();

  // The panel shows what was made, and the live preview draws it natively in the embedded font.
  await expect(dialog.getByTestId('captions-summary')).toContainText('drawn as designed in the Caption Studio');
  const player = dialog.getByTestId('editor-live-player');
  await player.scrollIntoViewIfNeeded();
  await dialog.getByTestId('editor-scrubber').fill('45');
  const layer = player.locator('[data-caption-source="studio"]');
  await expect(layer).toBeVisible({ timeout: 15_000 });
  await expect(layer.locator('span').first()).toHaveCSS('font-family', /Capite Bangers/);
  await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Capite Bangers"')), { timeout: 15_000 }).toBe(true);
  expect(await page.evaluate(() => Array.from(document.querySelectorAll('style[data-caption-font]')).every((s) => !/url\((?!data:)/.test(s.textContent ?? '')))).toBe(true);

  // The grip: drag the captions up into the business name (about 0.64 of the frame height): let go and they stop short of it.
  const grip = dialog.getByTestId('caption-drag-handle');
  await expect(grip).toBeVisible();
  const stage = (await dialog.getByRole('group', { name: 'Video overlay stage' }).boundingBox())!;
  const box = (await grip.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, stage.y + stage.height * 0.64, { steps: 10 });
  await page.mouse.up();
  await expect(dialog.getByTestId('captions-overlap')).toHaveCount(0);
  await page.screenshot({ path: path.join(OUT, 'live-kept-clear.png') });

  // Export.
  await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
  const rights = page.getByTestId('guided-rights-confirm').locator('input');
  if (await rights.count()) await rights.check();
  const before = await page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length);
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 300_000, intervals: [1000] })
    .toBeGreaterThan(before);
  const b64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type));
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(s);
  });
  const file = path.join(OUT, 'studio.mp4');
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  for (const t of [1.5, 2.5]) execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', path.join(OUT, `frame-${t}.png`)]);

  const none = magenta(file, 0.3).count;
  const during = magenta(file, 2.5);
  expect(none, 'no background before the line starts').toBeLessThan(30);
  expect(during.count, 'the background is on screen while the line plays').toBeGreaterThan(150);
  // Kept clear of the business name (about 0.57 to 0.71 of the frame height), and inside the frame.
  expect(during.centerY < 0.57 || during.centerY > 0.71, `centre ${during.centerY.toFixed(2)} is outside the name's band`).toBe(true);
  expect(errors, 'no uncaught page errors').toEqual([]);
});
