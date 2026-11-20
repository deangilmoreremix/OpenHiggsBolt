import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The captions transcript editor in the real modal: time pasted words, nudge a line's times by 0.1 s, find and replace, change the casing,
 * jump the live preview to a line (and see that line marked as playing), and pick a preview speed. Offline; no paid API.
 */
const LOGO = path.join(process.cwd(), 'public/motion-studio/previews/IconFlipBloomLogo-a.jpg');
const dataUrl = (file: string) => `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}`;

async function seed(page: Page) {
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

test('captions editor: nudge, find and replace, casing, jump to a line and preview speed', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('captions-toggle-panel').scrollIntoViewIfNeeded();
  await dialog.getByTestId('captions-toggle-panel').click();

  await dialog.getByTestId('captions-script').fill('1\n00:00:00,500 --> 00:00:01,500\nHello big world\n\n2\n00:00:02,000 --> 00:00:03,000\nSecond hello line');
  await dialog.getByTestId('captions-apply').click();
  const cues = dialog.getByTestId('caption-cue');
  await expect(cues).toHaveCount(2);
  const first = (await cues.nth(0).getAttribute('data-cue-id'))!;
  const second = (await cues.nth(1).getAttribute('data-cue-id'))!;

  // Nudge: a tenth of a second at a time.
  await dialog.getByTestId(`caption-nudge-${second}-start-plus`).click();
  await expect(dialog.getByTestId(`caption-start-${second}`)).toHaveValue('2.1');
  await dialog.getByTestId(`caption-nudge-${first}-end-minus`).click();
  await expect(dialog.getByTestId(`caption-end-${first}`)).toHaveValue('1.4');

  // Find and replace (whole word, any case), then the casing.
  await dialog.getByTestId('captions-find').fill('hello');
  await dialog.getByTestId('captions-replace').fill('hi');
  await dialog.getByTestId('captions-replace-all').click();
  await expect(dialog.getByTestId('captions-edit-notice')).toHaveText(/2 replacements/);
  await expect(cues.nth(0).getByTestId('caption-cue-text')).toHaveValue('hi big world');
  await expect(cues.nth(1).getByTestId('caption-cue-text')).toHaveValue('Second hi line');
  await dialog.getByTestId('captions-case-upper').click();
  await expect(cues.nth(1).getByTestId('caption-cue-text')).toHaveValue('SECOND HI LINE');

  // Jump to the second line: the live preview moves there and the line is marked as playing.
  await dialog.getByTestId('editor-live-player').scrollIntoViewIfNeeded();
  await cues.nth(1).getByTestId('caption-cue-seek').click();
  await expect(dialog.getByTestId('editor-timecode')).toHaveText(/^2\.1 \//);
  await expect(cues.nth(1)).toHaveAttribute('data-active', 'true');
  await expect(cues.nth(0)).toHaveAttribute('data-active', 'false');

  // Preview speed.
  await dialog.getByTestId('editor-speed-1.5').click();
  await expect(dialog.getByTestId('editor-speed-1.5')).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog.getByTestId('editor-speed-1')).toHaveAttribute('aria-pressed', 'false');
  expect(errors, 'no uncaught page errors').toEqual([]);
});
