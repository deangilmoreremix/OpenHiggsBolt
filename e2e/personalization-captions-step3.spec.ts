import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.env.CAPTIONS_STEP3_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'captions-step3');
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
  await expect(dialog.getByTestId('step3-captions')).toBeVisible();
}

/**
 * Step 3 has an optional Captions panel that opens the same Caption Studio as Step 4. Import an SRT (no speech model needed) and apply it
 * from Step 3: the Step 3 panel then shows the lines, and Step 4 shows the same captions in its own panel and in the live preview. Offline.
 */
test('Step 3 captions panel opens the Caption Studio and the captions carry on to Step 4', async ({ page }) => {
  test.setTimeout(240_000);
  fs.mkdirSync(OUT, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  const panel = dialog.getByTestId('step3-captions');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toContainText('Free · no credits');
  await page.screenshot({ path: path.join(OUT, '1-step3-panel.png') });
  await panel.getByTestId('captions-open-studio').click();

  const srt = path.join(OUT, 'quote.srt');
  fs.writeFileSync(srt, '1\n00:00:00,600 --> 00:00:03,200\nCall us today for a free quote\n');
  await expect(page.getByText('Import SRT / VTT')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
  await page.locator('[data-import]').setInputFiles(srt);
  await expect(page.getByText(/Imported 1 captions/)).toBeVisible({ timeout: 10_000 });
  await page.locator('[data-act="apply"]').click();

  await expect(panel.getByTestId('captions-summary')).toContainText('1 lines');
  await expect(panel.getByTestId('captions-open-studio')).toContainText('Edit in the Caption Studio');
  await page.screenshot({ path: path.join(OUT, '2-step3-after.png') });

  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
  await expect(dialog.getByTestId('captions-summary')).toContainText('1 lines');
  const player = dialog.getByTestId('editor-live-player');
  await player.scrollIntoViewIfNeeded();
  await dialog.getByTestId('editor-scrubber').fill('45');
  await expect(player.locator('[data-caption-source="studio"]')).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: path.join(OUT, '3-step4-live.png') });
  expect(errors, 'no uncaught page errors').toEqual([]);
});
