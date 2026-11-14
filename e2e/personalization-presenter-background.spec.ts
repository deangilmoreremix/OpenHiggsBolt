import { test, expect, type Page } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Presenter background removal, in the real modal with real footage and the real in-browser export.
 * Offline: uploads a video that ships in this repo (a person standing in a room), measures the masks with
 * the self-hosted MediaPipe files, checks the live preview, then renders a real MP4 and checks the exported
 * pixels match what the preview showed. No paid API is called.
 *
 * Needs `ffmpeg`/`ffprobe` on PATH to read pixels back out of the exported MP4.
 * Output (screenshots, mp4) goes to `test-results/presenter-background/` or `PRESENTER_OUT_DIR`.
 */
const OUT = process.env.PRESENTER_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'presenter-background');
const PERSON = path.join(process.cwd(), 'public/media/recast-example/source-performance.mp4');
const PERSON_WITH_AUDIO = path.join(process.cwd(), 'public/academy/05-ai-avatars-and-influencers/templates/examples/avatar-sponsor-clip.mp4');
const LOGO = path.join(process.cwd(), 'public/motion-studio/previews/IconFlipBloomLogo-a.jpg');
const dataUrl = (file: string) => `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}`;

async function seed(page: Page, video: string) {
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
  await dialog.getByRole('button', { name: /Step 2/i }).click();
  await dialog.getByRole('tab', { name: 'Upload' }).click();
  await page.setInputFiles('#guided-video-upload', video);
  await expect(dialog.getByText(/Uploaded videos stay in this browser/)).toBeVisible();
  await dialog.getByRole('button', { name: /Step 3/i }).click();
  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
}

/** [r, g, b] of one pixel of the cut-out canvas the live preview draws. */
async function canvasPixel(page: Page, fx: number, fy: number): Promise<number[]> {
  return page.evaluate(([x, y]) => {
    const c = document.querySelector('[data-testid="cutout-canvas"]') as HTMLCanvasElement | null;
    if (!c) return [-1, -1, -1];
    const d = c.getContext('2d')!.getImageData(Math.floor(c.width * x), Math.floor(c.height * y), 1, 1).data;
    return [d[0], d[1], d[2]];
  }, [fx, fy]);
}

/** [r, g, b] of one pixel of an exported MP4, via ffmpeg. */
function mp4Pixel(file: string, seconds: number, fx: number, fy: number, w: number, h: number): number[] {
  const out = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(seconds), '-i', file, '-frames:v', '1',
    '-vf', `crop=2:2:${Math.floor(w * fx / 2) * 2}:${Math.floor(h * fy / 2) * 2}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  return [out[0], out[1], out[2]];
}
const dist = (a: number[], b: number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

async function removeBackground(page: Page) {
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('cutout-toggle-panel').scrollIntoViewIfNeeded();
  await dialog.getByTestId('cutout-toggle-panel').click();
  await dialog.getByTestId('cutout-remove').click();
  await expect(dialog.getByTestId('cutout-bg-color')).toBeVisible({ timeout: 150_000 });
}

test.describe('Presenter background removal on real footage', () => {
  test('removes the background, shows it in the live editor, restores it, and the export matches', async ({ page }) => {
    test.setTimeout(420_000);
    fs.mkdirSync(OUT, { recursive: true });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await seed(page, PERSON);
    const dialog = page.getByRole('dialog');

    // Before: the normal video path, no cut-out canvas.
    await expect(dialog.getByTestId('cutout-canvas')).toHaveCount(0);

    await removeBackground(page);

    // A replacement background that is clearly not the room: pick a solid color.
    await dialog.getByTestId('cutout-bg-color').click();
    await expect(dialog.getByTestId('cutout-canvas').first()).toBeVisible({ timeout: 30_000 });
    // Top-left corner of the frame was the room's wall; now it must be the chosen color, and the middle is the presenter.
    await expect.poll(async () => (await canvasPixel(page, 0.04, 0.04)).join(','), { timeout: 30_000 }).not.toBe('-1,-1,-1');
    const corner = await canvasPixel(page, 0.04, 0.04);
    const farCorner = await canvasPixel(page, 0.96, 0.04);
    expect(dist(corner, farCorner), 'both corners are the same flat background color').toBeLessThan(6);
    await dialog.getByTestId('cutout-canvas').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, 'live-cutout-color.png') });

    // Presenter preset moves/scales the presenter; the corner stays background.
    await dialog.getByTestId('cutout-preset-corner').click();
    await page.waitForTimeout(1500);
    expect(dist(await canvasPixel(page, 0.04, 0.04), corner)).toBeLessThan(6);
    await page.screenshot({ path: path.join(OUT, 'live-cutout-pip.png') });
    await dialog.getByTestId('cutout-preset-full').click();
    await page.waitForTimeout(1000);

    // Restore the original video: the cut-out canvas goes away and the normal video path returns.
    await dialog.getByTestId('cutout-restore').click();
    await expect(dialog.getByTestId('cutout-canvas')).toHaveCount(0);
    // And it can be turned back on without measuring again (masks are cached).
    await dialog.getByTestId('cutout-remove').click();
    await expect(dialog.getByTestId('cutout-canvas').first()).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByTestId('cutout-bg-color')).toBeVisible();
    await expect.poll(async () => dist(await canvasPixel(page, 0.04, 0.04), corner), { timeout: 30_000 }).toBeLessThan(6);

    // Real export: approve, render, read pixels back from the MP4.
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
    const file = path.join(OUT, 'export.mp4');
    fs.writeFileSync(file, Buffer.from(b64, 'base64'));
    const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim().split(',').map(Number);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '1', '-i', file, '-frames:v', '1', path.join(OUT, 'export-frame.png')]);
    // The export shows the same flat background in the corners as the live preview did (less the brand dim overlay).
    const exported = mp4Pixel(file, 1, 0.04, 0.04, w, h);
    const dim = 0.18;
    const expected = corner.map((v) => v * (1 - dim));
    expect(dist(exported, expected), `export corner ${exported} vs preview ${expected}`).toBeLessThan(14);
    // It is NOT the original room (the wall color of the source's top-left corner).
    const original = execFileSync('ffmpeg', ['-v', 'error', '-ss', '1', '-i', PERSON, '-frames:v', '1', '-vf', 'crop=2:2:14:24', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
    expect(dist(exported, [original[0], original[1], original[2]])).toBeGreaterThan(25);
    expect(errors, 'no uncaught page errors').toEqual([]);
  });

  test('a clip with sound keeps its sound in the export while the background is removed', async ({ page }) => {
    test.setTimeout(420_000);
    fs.mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await seed(page, PERSON_WITH_AUDIO);
    const dialog = page.getByRole('dialog');
    await removeBackground(page);
    await dialog.getByTestId('cutout-bg-color').click();
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
    const file = path.join(OUT, 'export-audio.mp4');
    fs.writeFileSync(file, Buffer.from(b64, 'base64'));
    const streams = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', file]).toString();
    expect(streams).toContain('audio');
    // The exporter always writes an audio track, so check it actually carries the clip's sound (a silent one reads about -91 dB).
    const detect = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'volumedetect', '-vn', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
    const mean = Number(/mean_volume:\s*(-?[\d.]+) dB/.exec(detect)?.[1] ?? '-999');
    expect(mean, `exported audio mean volume ${mean} dB`).toBeGreaterThan(-45);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '1', '-i', file, '-frames:v', '1', path.join(OUT, 'export-audio-frame.png')]);
  });
});
