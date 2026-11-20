import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Captions in the real modal and the real in-browser export. Offline: the demo clip and a logo that ship in this repo. Pastes a
 * script, times it, picks a bold highlight color, exports an MP4 and measures it with ffmpeg: the caption text is only on screen
 * while its line plays, and the highlight color appears on the active word then moves along the line. No paid API is called.
 * Needs `ffmpeg` on PATH.
 */
const OUT = process.env.CAPTIONS_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'captions');
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

/** Count of pixels close to pure magenta (255, 0, 255) in the lower third of the frame at `t` seconds, by horizontal bands. */
function magentaByThird(file: string, t: number): number[] {
  const w = 480, h = 270;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', `scale=${w}:${h}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  const bands = [0, 0, 0];
  for (let y = Math.floor(h * 0.66); y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3;
    if (raw[i] > 200 && raw[i + 1] < 90 && raw[i + 2] > 200) bands[Math.min(2, Math.floor((x / w) * 3))]++;
  }
  return bands;
}

test('captions show only while their line plays, with the highlight moving along the line, in the live editor and the export', async ({ page }) => {
  test.setTimeout(420_000);
  fs.mkdirSync(OUT, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('captions-toggle-panel').scrollIntoViewIfNeeded();
  await dialog.getByTestId('captions-toggle-panel').click();

  // One line from 0.6 s to 3.2 s (the end card takes over after that), highlighted in magenta so it cannot be confused with the footage.
  await dialog.getByTestId('captions-script').fill('aaaa bbbb cccc');
  await dialog.getByTestId('captions-apply').click();
  await expect(dialog.getByTestId('caption-cue')).toHaveCount(1);
  const cue = dialog.getByTestId('caption-cue').first();
  const id = (await cue.getAttribute('data-cue-id'))!;
  await dialog.getByTestId(`caption-start-${id}`).fill('0.6');
  await dialog.getByTestId(`caption-end-${id}`).fill('3.2');
  await dialog.getByTestId('captions-preset-karaoke').click();
  await dialog.getByTestId('captions-box').click();   // a box, so the words read on any footage
  await dialog.getByTestId('captions-size').fill('0.08');
  // Highlight color: type a hex into the color popover's field.
  await dialog.getByRole('button', { name: 'Caption highlight color' }).click();
  const hexInput = page.getByRole('textbox', { name: /hex/i }).first();
  await hexInput.fill('#ff00ff');
  await hexInput.press('Enter');
  await page.keyboard.press('Escape');

  // Live: the words are in the Player at 2 s, none at 0.3 s.
  await dialog.getByTestId('editor-live-player').scrollIntoViewIfNeeded();
  await dialog.getByTestId('editor-scrubber').fill('45');
  await expect(dialog.getByTestId('editor-live-player').getByTestId('caption-word').first()).toBeVisible({ timeout: 15_000 });
  await dialog.getByTestId('editor-scrubber').fill('9');
  await expect(dialog.getByTestId('editor-live-player').getByTestId('caption-word')).toHaveCount(0);
  await dialog.getByTestId('editor-scrubber').fill('60');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'live-captions.png') });

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
  const file = path.join(OUT, 'captions.mp4');
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  for (const t of [0.8, 1.9, 2.9]) execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', path.join(OUT, `frame-${t}.png`)]);

  const none = magentaByThird(file, 0.3).reduce((a, b) => a + b, 0);
  const after = magentaByThird(file, 3.3).reduce((a, b) => a + b, 0);
  const early = magentaByThird(file, 0.8);
  const late = magentaByThird(file, 2.9);
  expect(none, 'no highlight before the line starts').toBeLessThan(20);
  expect(after, 'no highlight after the line ends').toBeLessThan(20);
  expect(early.reduce((a, b) => a + b, 0), 'highlight on screen while the line plays').toBeGreaterThan(60);
  // The highlighted word moves from the left of the line to its right.
  const centerOf = (b: number[]) => (b[0] * 0 + b[1] * 1 + b[2] * 2) / Math.max(1, b[0] + b[1] + b[2]);
  expect(centerOf(late), `highlight moves right (early ${early}, late ${late})`).toBeGreaterThan(centerOf(early) + 0.5);
  expect(errors, 'no uncaught page errors').toEqual([]);
});
