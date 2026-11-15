import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * A transparent logo with heavy empty padding is trimmed (a derived copy) before it is drawn, and the REAL export
 * shows the logo content large instead of small inside its padding. The MP4 is saved for frame measurement.
 */
const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3111';
const OUT = process.env.PHASE5_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'logo-trim');

test('a padded transparent logo is drawn trimmed in the real export', async ({ page }) => {
  test.setTimeout(400_000);
  fs.mkdirSync(OUT, { recursive: true });
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    URL.createObjectURL = (obj: Blob | MediaSource) => { try { if (obj instanceof Blob) blobs.push(obj); } catch { /* ignore */ } return original(obj); };
    (window as unknown as { __blobs: Blob[] }).__blobs = blobs;
  });
  await page.context().addCookies([{ name: '__e2e_auth_bypass', value: '1', url: BASE }]);
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', 'KK LAW');
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();
  // 1000x1000 transparent canvas; the wordmark (magenta so it is easy to find) fills only the middle ~30%.
  const logo = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1000; c.height = 1000
    const g = c.getContext('2d')!; g.clearRect(0, 0, 1000, 1000)
    g.fillStyle = '#ff00cc'; g.fillRect(350, 440, 300, 120)
    return c.toDataURL('image/png')
  });
  const logoCard = page.locator('article.asset-card').filter({ hasText: '2. LOGO' });
  await logoCard.getByPlaceholder('Paste logo URL and press Enter').fill(logo);
  await page.locator('button:has-text("Add Logo URL")').first().dispatchEvent('click');
  await page.waitForTimeout(2500); // the trimmed copy is made in the browser right after the logo is assigned
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
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 240_000, intervals: [500, 1000] }).toBeGreaterThan(0);
  const b64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type));
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
    let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(bin);
  });
  const file = path.join(OUT, `${process.env.LOGO_TRIM_LABEL ?? 'after'}.mp4`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  expect(fs.statSync(file).size).toBeGreaterThan(10_000);
});
