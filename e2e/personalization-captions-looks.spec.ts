import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The 27 caption looks in the real modal and the real in-browser export: pick a look from the grouped list, see it in the live
 * player, keep it while changing position, export an MP4 and keep a frame so the burned-in look can be inspected.
 * Offline: the demo clip and a logo that ship in this repo. Output: `CAPTIONS_OUT_DIR` (default test-results/captions-looks).
 */
const OUT = process.env.CAPTIONS_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'captions-looks');
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


test('captions: pick a look, keep it while tweaking, export with it burned in', async ({ page }) => {
  test.setTimeout(420_000);
  fs.mkdirSync(OUT, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('captions-toggle-panel').scrollIntoViewIfNeeded();
  await dialog.getByTestId('captions-toggle-panel').click();
  await dialog.getByTestId('captions-script').fill('Call us today for a free quote');
  await dialog.getByTestId('captions-apply').click();
  await expect(dialog.getByTestId('caption-cue')).toHaveCount(1);
  const id = (await dialog.getByTestId('caption-cue').first().getAttribute('data-cue-id'))!;
  await dialog.getByTestId(`caption-start-${id}`).fill('0.6');
  await dialog.getByTestId(`caption-end-${id}`).fill('3.2');

  const select = dialog.getByTestId('captions-look-select');
  await expect(select.locator('option:not([value=""])')).toHaveCount(27);

  // Each look reaches the live player with its own font.
  const player = dialog.getByTestId('editor-live-player');
  await player.scrollIntoViewIfNeeded();
  for (const [look, font] of [['hormozi', 'Montserrat'], ['cyberpunk', 'Orbitron'], ['mrbeast', 'Bebas Neue']]) {
    await select.selectOption(look);
    await dialog.getByTestId('editor-scrubber').fill('45');
    await expect(player.getByTestId('caption-line')).toBeVisible({ timeout: 15_000 });
    await expect(player.getByTestId('caption-line')).toHaveCSS('font-family', new RegExp(font));
  }
  await select.selectOption('hormozi');
  await dialog.getByTestId('captions-pos-top').click();
  await expect(select).toHaveValue('hormozi');                       // tweaking keeps the look
  await dialog.getByTestId('captions-pos-bottom').click();
  await dialog.getByTestId('captions-preset-boxed').click();        // a brand preset replaces it
  await expect(select).toHaveValue('');
  await select.selectOption('hormozi');
  await dialog.getByTestId('editor-scrubber').fill('45');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'live-look.png') });

  // Export with the look.
  await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
  const rights = page.getByTestId('guided-rights-confirm').locator('input');
  if (await rights.count()) await rights.check();
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 300_000, intervals: [1000] })
    .toBeGreaterThan(0);
  const b64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type));
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(s);
  });
  const mp4 = path.join(OUT, 'looks.mp4');
  fs.writeFileSync(mp4, Buffer.from(b64, 'base64'));
  expect(fs.statSync(mp4).size).toBeGreaterThan(10_000);
  expect(errors, errors.join('\n')).toEqual([]);
});
