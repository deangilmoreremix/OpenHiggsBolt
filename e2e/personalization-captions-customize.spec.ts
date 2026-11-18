import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The captions customizer in the real modal and the real in-browser export: pick one of Capite's embedded fonts, give the captions a magenta
 * background, drag them up with the grip on the live preview, export an MP4 and measure it with ffmpeg: the magenta box is on screen while the line
 * plays and sits where it was dragged to, and the font is loaded from the embedded copy. Offline; needs `ffmpeg` on PATH.
 */
const OUT = process.env.CAPTIONS_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'captions-customize');
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

/** Magenta (255, 0, 255) pixels in a frame: how many, and their vertical centre as a fraction of the height. */
function magenta(file: string, t: number): { count: number; centerY: number } {
  const w = 480, h = 270;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', `scale=${w}:${h}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  let count = 0, ySum = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    if (raw[i] > 200 && raw[i + 1] < 90 && raw[i + 2] > 200) { count++; ySum += y; }
  }
  return { count, centerY: count ? ySum / count / h : 0 };
}

test('captions customizer: an embedded font, a background, dragged up, in the live preview and the export', async ({ page }) => {
  test.setTimeout(420_000);
  fs.mkdirSync(OUT, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('captions-toggle-panel').scrollIntoViewIfNeeded();
  await dialog.getByTestId('captions-toggle-panel').click();
  await dialog.getByTestId('captions-script').fill('1\n00:00:00,600 --> 00:00:03,200\nCall us today for a free quote');
  await dialog.getByTestId('captions-apply').click();
  await expect(dialog.getByTestId('caption-cue')).toHaveCount(1);
  await dialog.getByTestId('captions-preset-boxed').click();

  // The font: one of Capite's 16, embedded: the live line uses it and the browser has loaded it.
  await dialog.getByTestId('captions-font').selectOption('Bangers');
  await dialog.getByTestId('captions-size').fill('0.08');
  const player = dialog.getByTestId('editor-live-player');
  await player.scrollIntoViewIfNeeded();
  await dialog.getByTestId('editor-scrubber').fill('45');
  const line = player.getByTestId('caption-line');
  await expect(line).toBeVisible({ timeout: 15_000 });
  await expect(line).toHaveCSS('font-family', /Capite Bangers/);
  await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Capite Bangers"')), { timeout: 15_000 }).toBe(true);
  expect(await page.evaluate(() => Array.from(document.querySelectorAll('style[data-capite-font]')).every((s) => !/url\((?!data:)/.test(s.textContent ?? '')))).toBe(true);

  // The background: magenta, so it cannot be mistaken for the footage.
  await dialog.getByRole('button', { name: 'Caption background color' }).click();
  const hexInput = page.getByRole('textbox', { name: /hex/i }).first();
  await hexInput.fill('#ff00ff');
  await hexInput.press('Enter');
  await page.keyboard.press('Escape');

  // Drag the captions up with the grip on the preview: about a quarter of the frame.
  const grip = dialog.getByTestId('caption-drag-handle');
  await expect(grip).toBeVisible();
  const box = (await grip.boundingBox())!;
  const stage = (await dialog.getByRole('group', { name: 'Video overlay stage' }).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - stage.height * 0.25, { steps: 8 });
  await page.mouse.up();
  const moved = Number(await grip.getAttribute('aria-valuenow'));
  expect(moved).toBeGreaterThan(18);
  expect(moved).toBeLessThan(32);
  await page.screenshot({ path: path.join(OUT, 'live-customized.png') });

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
  const file = path.join(OUT, 'customized.mp4');
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  for (const t of [1.5, 2.5]) execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', path.join(OUT, `frame-${t}.png`)]);

  const none = magenta(file, 0.3).count;
  const during = magenta(file, 2.5);
  expect(none, 'no background before the line starts').toBeLessThan(30);
  expect(during.count, 'the background is on screen while the line plays').toBeGreaterThan(300);
  // Bottom place is about 0.88 of the height; dragged up by about 0.25 it is near 0.63, clearly above the bottom edge.
  expect(during.centerY, `the background sits where it was dragged (centre ${during.centerY.toFixed(2)})`).toBeGreaterThan(0.45);
  expect(during.centerY).toBeLessThan(0.75);
  expect(errors, 'no uncaught page errors').toEqual([]);
});
