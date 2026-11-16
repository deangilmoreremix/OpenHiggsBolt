import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Keyframes in the real modal and the real in-browser export. Offline: uses the same-origin demo clip and a logo
 * that ship in this repo. Adds two keyframes to the logo (stay put, then drift 30% of the frame to the right),
 * checks the editor's timeline and the live box follow them, renders a real MP4 and checks the logo really is
 * further right late in the video than early on. Needs `ffmpeg` on PATH. No paid API is called.
 */
const OUT = process.env.KEYFRAME_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'keyframes');
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

/** Left edge (0..1) of the bright logo plate in the top part of a 480x270 gray frame of the MP4 at `seconds`; NaN if none is found. */
function logoLeftEdge(file: string, seconds: number): number {
  const w = 480, h = 270;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(seconds), '-i', file, '-frames:v', '1', '-vf', `scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-']);
  // The logo plate is a wide, nearly uniform light rectangle. Footage highlights are bright too, so look for a long
  // unbroken run of light pixels across the plate's rows (at least 20% of the width) and take where it starts.
  let best = NaN;
  for (let y = Math.round(h * 0.16); y <= Math.round(h * 0.26); y++) {
    let run = 0;
    for (let x = 0; x <= w; x++) {
      if (x < w && raw[y * w + x] > 205) { run++; continue; }
      if (run >= w * 0.2 && !(x - run >= best)) best = x - run;
      run = 0;
    }
  }
  return Number.isNaN(best) ? NaN : best / w;
}

test('keyframes move a layer in the timeline, the live editor and the exported video', async ({ page }) => {
  test.setTimeout(420_000);
  fs.mkdirSync(OUT, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('editor-live-player').scrollIntoViewIfNeeded();

  const logo = dialog.getByRole('button', { name: 'Move Logo' });
  await logo.click();
  await dialog.getByTestId('inspector-tab-timing').click();
  await expect(dialog.getByTestId('keyframe-panel')).toBeVisible();

  // Keyframe 1 at the start (no change), keyframe 2 at 3 s (before the end card), then drift 30% across.
  await dialog.getByTestId('editor-scrubber').fill('0');
  await dialog.getByTestId('keyframe-add').click();
  await dialog.getByTestId('editor-scrubber').fill('90');
  await dialog.getByTestId('keyframe-add').click();
  const late = dialog.locator('[data-testid="keyframe-row"][data-frame="90"]');
  await late.getByTestId('keyframe-dx').fill('30');
  await expect(dialog.getByTestId('timeline-keyframe')).toHaveCount(2);
  // The diamonds sit where their keyframes are on the timeline: inside the logo's own track, the second 90/149 of the way along it.
  const diamonds = dialog.getByTestId('timeline-keyframe');
  const d0 = (await diamonds.nth(0).boundingBox())!;
  const d1 = (await diamonds.nth(1).boundingBox())!;
  const track = (await dialog.locator('[data-testid="timeline-track"]:has([data-testid="timeline-keyframe"])').first().boundingBox())!;
  const cy = d0.y + d0.height / 2; // the diamond is turned 45 degrees, so judge it by its center
  expect(cy, 'diamond is inside the logo\'s own track').toBeGreaterThan(track.y);
  expect(cy, 'diamond is inside the logo\'s own track').toBeLessThan(track.y + track.height);
  expect(Math.abs(d1.y - d0.y), 'both diamonds are on the same row').toBeLessThan(2);
  const frac = (d1.x + d1.width / 2 - (d0.x + d0.width / 2)) / track.width;
  expect(frac, `second diamond ${frac} of the track to the right of the first (expect ${90 / 149})`).toBeGreaterThan(90 / 149 - 0.03);
  expect(frac).toBeLessThan(90 / 149 + 0.03);

  // The live box follows: further right at 3 s than at the start.
  const xAt = async (frame: string) => {
    await dialog.getByTestId('editor-scrubber').fill(frame);
    await page.waitForTimeout(600);
    return (await logo.boundingBox())!.x;
  };
  const x0 = await xAt('0');
  const x1 = await xAt('90');
  expect(x1 - x0, `box moved right (${x0} -> ${x1})`).toBeGreaterThan(40);
  await dialog.getByTestId('timeline').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUT, 'timeline-keyframes.png') });

  // Real export.
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
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '0.9', '-i', file, '-frames:v', '1', path.join(OUT, 'export-early.png')]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '3.1', '-i', file, '-frames:v', '1', path.join(OUT, 'export-late.png')]);
  const early = logoLeftEdge(file, 0.9);
  const lateEdge = logoLeftEdge(file, 3.1);
  expect(Number.isNaN(early) || Number.isNaN(lateEdge), `logo found in both frames (early ${early}, late ${lateEdge})`).toBe(false);
  expect(lateEdge - early, `logo left edge early ${early} late ${lateEdge}`).toBeGreaterThan(0.2);
  expect(errors, 'no uncaught page errors').toEqual([]);
});
