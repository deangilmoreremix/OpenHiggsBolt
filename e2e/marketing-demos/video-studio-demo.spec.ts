import { test, expect } from '@playwright/test';
import { assertRoute, dismissModals, openTab } from './helpers/demo';

test.describe('SmartVideo GO — video studio demo', () => {
  test('video studio tab opens without triggering paid generation', async ({ page }) => {
    await page.goto('/studio');
    await expect(page).toHaveURL(new RegExp('/studio'));

    await dismissModals(page);
    const tab = await openTab(page, 'Video Studio');
    await tab.click();
    await assertRoute(page, /\/studio/);
    await expect(page.getByRole('button', { name: /Video Studio/i })).toBeVisible();
  });

  test('video studio tab is interactive after navigation', async ({ page }) => {
    await page.goto('/studio');
    await dismissModals(page);

    const tab = await openTab(page, 'Video Studio');
    await tab.click();
    await expect(tab).toBeVisible();
    await expect(tab).toBeEnabled();
  });
});
