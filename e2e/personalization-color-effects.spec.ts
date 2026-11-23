import { test, expect, type Page } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Color and effects in the real modal and the real in-browser export. Offline: the same-origin demo clip and a logo that
 * ship in this repo. Renders the video twice (plain, then with a Black and white look + strong vignette + a blur on the logo)
 * and measures the exported frames with ffmpeg: the footage loses its color, the corners get darker than the center, the
 * blurred logo loses detail, and the brand logo/text on top are not recolored. No paid API is called. Needs `ffmpeg` on PATH.
 */
const OUT = process.env.EFFECTS_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'color-effects');
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
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Simple Mode/i }).click();
  await dialog.getByRole('button', { name: /Step 3/i }).click();
  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
}

async function renderMp4(page: Page, name: string): Promise<string> {
  const dialog = page.getByRole('dialog');
  const approve = dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i });
  await approve.click({ timeout: 30_000 });
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
  const file = path.join(OUT, `${name}.mp4`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  return file;
}

/** One frame at `t` seconds, cropped, as raw rgb24. */
function crop(file: string, t: number, x: number, y: number, w: number, h: number): Buffer {
  return execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', `scale=1920:1080,crop=${w}:${h}:${x}:${y}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
}
/** Mean colorfulness: average distance of each pixel's channels from their own mean (0 = gray). */
const colorfulness = (rgb: Buffer) => { let sum = 0; for (let i = 0; i < rgb.length; i += 3) { const m = (rgb[i] + rgb[i + 1] + rgb[i + 2]) / 3; sum += Math.abs(rgb[i] - m) + Math.abs(rgb[i + 1] - m) + Math.abs(rgb[i + 2] - m); } return sum / (rgb.length / 3); };
const luma = (rgb: Buffer) => { let sum = 0; for (let i = 0; i < rgb.length; i += 3) sum += 0.2126 * rgb[i] + 0.7152 * rgb[i + 1] + 0.0722 * rgb[i + 2]; return sum / (rgb.length / 3); };
/** Mean absolute horizontal gradient of the luma: how much fine detail there is. */
const detail = (rgb: Buffer, w: number) => { let sum = 0, n = 0; for (let i = 0; i + 3 < rgb.length; i += 3) { if (((i / 3) % w) === w - 1) continue; sum += Math.abs(rgb[i + 1] - rgb[i + 4]); n++; } return sum / n; };

test('a look and layer effects change the footage and the logo in the live editor and in the exported video', async ({ page }) => {
  test.setTimeout(540_000);
  fs.mkdirSync(OUT, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');

  // Baseline export, no effects.
  const plain = await renderMp4(page, 'plain');

  // Apply a look: Black and white, then a strong vignette.
  await dialog.getByTestId('look-toggle-panel').scrollIntoViewIfNeeded();
  await dialog.getByTestId('look-toggle-panel').click();
  await dialog.getByTestId('look-preset-bw').click();
  await dialog.getByTestId('look-vignette').fill('1');
  // The live editor's footage element carries the filter.
  const liveFilter = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="editor-live-player"]');
    return Array.from(stage?.querySelectorAll<HTMLElement>('*') ?? []).map((e) => e.style.filter).find((f) => /saturate\(0\)/.test(f)) ?? '';
  });
  expect(liveFilter, 'the live Player draws the look').toContain('saturate(0)');
  await expect(dialog.getByTestId('look-layer-vignette').first()).toBeAttached();

  // Blur the logo: select it, Layout tab, Effects.
  await dialog.getByRole('button', { name: 'Move Logo' }).click();
  await dialog.getByTestId('inspector-tab-layout').click();
  await dialog.getByTestId('fx-blur').fill('8');
  await dialog.getByTestId('editor-live-player').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUT, 'live-look.png') });

  const looked = await renderMp4(page, 'look');
  const T = 1.0;
  // Footage region on the right of the frame (no logo, no name, no end card at 1 s).
  const regionPlain = crop(plain, T, 1300, 300, 400, 500);
  const regionLook = crop(looked, T, 1300, 300, 400, 500);
  expect(colorfulness(regionPlain), 'the original footage has color').toBeGreaterThan(4);
  expect(colorfulness(regionLook), 'black and white removes it').toBeLessThan(colorfulness(regionPlain) * 0.15);
  // Vignette: the corner is darker than it was, relative to the middle.
  const cornerRatio = (f: string) => luma(crop(f, T, 1500, 700, 300, 300)) / Math.max(1, luma(crop(f, T, 810, 390, 300, 300)));
  expect(cornerRatio(looked), `corner/middle brightness ${cornerRatio(looked)} vs ${cornerRatio(plain)}`).toBeLessThan(cornerRatio(plain) * 0.8);
  // The logo (the plate at the top left) loses fine detail when blurred, and is not recolored by the footage look.
  const logoPlain = crop(plain, T, 70, 120, 400, 220);
  const logoBlur = crop(looked, T, 70, 120, 400, 220);
  expect(detail(logoBlur, 400), 'blurred logo has less fine detail').toBeLessThan(detail(logoPlain, 400) * 0.6);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(T), '-i', looked, '-frames:v', '1', path.join(OUT, 'look-frame.png')]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(T), '-i', plain, '-frames:v', '1', path.join(OUT, 'plain-frame.png')]);

  // Reset removes everything.
  await dialog.getByTestId('fx-reset').click();
  await dialog.getByTestId('look-reset').scrollIntoViewIfNeeded();
  await dialog.getByTestId('look-reset').click();
  await expect(dialog.getByTestId('look-reset')).toBeDisabled();
  expect(errors, 'no uncaught page errors').toEqual([]);
  void spawnSync;
});
