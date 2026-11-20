import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Capite caption styles (copied from github.com/muneebkhan08/Capite, MIT) in the real modal and the real in-browser export. Offline: the demo clip and a logo that ship in this repo. Pastes a
 * script, times it, picks a bold highlight color, exports an MP4 and measures it with ffmpeg: the caption text is only on screen
 * while its line plays, and the highlight color appears on the active word then moves along the line. No paid API is called.
 * Needs `ffmpeg` on PATH.
 */
const OUT = process.env.CAPTIONS_CAPITE_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'captions-capite');
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


/** Pixels close to cyan (0,255,255) in the lower third, by horizontal thirds. */
function cyanByThird(file: string, t: number): number[] {
  const w = 480, h = 270;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', `scale=${w}:${h}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  const bands = [0, 0, 0];
  for (let y = Math.floor(h * 0.6); y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    if (raw[i] < 90 && raw[i + 1] > 190 && raw[i + 2] > 190) bands[Math.min(2, Math.floor((x / w) * 3))]++;
  }
  return bands;
}

test('a Capite style with a word animation shows in the live editor and the export, and the captions download as SRT and VTT', async ({ page }) => {
  test.setTimeout(420_000);
  fs.mkdirSync(OUT, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('captions-toggle-panel').scrollIntoViewIfNeeded();
  await dialog.getByTestId('captions-toggle-panel').click();
  await dialog.getByTestId('captions-script').fill('aaaa bbbb cccc dddd eeee ffff gggg');
  await dialog.getByTestId('captions-apply').click();
  const first = dialog.getByTestId('caption-cue').first();
  const id = (await first.getAttribute('data-cue-id'))!;
  await dialog.getByTestId(`caption-start-${id}`).fill('0.6');
  await dialog.getByTestId(`caption-end-${id}`).fill('3.2');

  // All 27 Capite styles are offered, grouped.
  await expect(dialog.locator('[data-testid^="captions-preset-capite-"]')).toHaveCount(27);
  await dialog.getByTestId('captions-preset-capite-hormozi').click();   // white text, cyan highlight, black outline
  await dialog.getByTestId('captions-anim-box').click();                // the spoken word sits on a cyan block

  // Downloads: SRT and VTT with the line's times.
  const srt = await Promise.all([page.waitForEvent('download'), dialog.getByTestId('captions-download-srt').click()]);
  const srtText = fs.readFileSync((await srt[0].path())!, 'utf8');
  expect(srtText).toContain('00:00:00,600 --> 00:00:03,200');
  expect(srtText).toContain('aaaa');
  const vtt = await Promise.all([page.waitForEvent('download'), dialog.getByTestId('captions-download-vtt').click()]);
  expect(fs.readFileSync((await vtt[0].path())!, 'utf8')).toMatch(/^WEBVTT/);

  // Live: words are drawn, one of them inside a cyan block.
  await dialog.getByTestId('editor-live-player').scrollIntoViewIfNeeded();
  await dialog.getByTestId('editor-scrubber').fill('45');
  const live = dialog.getByTestId('editor-live-player');
  await expect(live.getByTestId('caption-word').first()).toBeVisible({ timeout: 15_000 });
  expect(await live.getByTestId('caption-word').count(), 'only a five-word window is shown').toBeLessThanOrEqual(5);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'live-capite.png') });

  // Export.
  await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
  const rights = page.getByTestId('guided-rights-confirm').locator('input');
  if (await rights.count()) await rights.check();
  const blobCount = () => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length);
  const n0 = await blobCount();
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
  await expect.poll(blobCount, { timeout: 300_000, intervals: [1000] }).toBeGreaterThan(n0);
  const b64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type));
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(s);
  });
  const file = path.join(OUT, 'capite.mp4');
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  for (const t of [0.8, 1.9, 2.9]) execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', path.join(OUT, `capite-${t}.png`)]);
  const none = cyanByThird(file, 0.3).reduce((a, b) => a + b, 0);
  const early = cyanByThird(file, 0.8);
  const late = cyanByThird(file, 2.9);
  expect(none, 'no cyan before the line starts').toBeLessThan(20);
  expect(early.reduce((a, b) => a + b, 0), 'the spoken word sits on a cyan block while the line plays').toBeGreaterThan(150);
  const centerOf = (b: number[]) => (b[1] + 2 * b[2]) / Math.max(1, b[0] + b[1] + b[2]);
  expect(centerOf(late), `the block moves along the line (early ${early}, late ${late})`).toBeGreaterThan(centerOf(early));
  expect(errors, 'no uncaught page errors').toEqual([]);
});
