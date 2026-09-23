import { test, expect } from '@playwright/test';
import { assertRoute, dismissModals, openTab, gotoStudio } from './helpers/demo';

test.describe('SmartVideo GO — video studio demo', () => {
  test('video studio tab opens without triggering paid generation', async ({ page }) => {
    await gotoStudio(page);
    await expect(page).toHaveURL(new RegExp('/studio'));

    await dismissModals(page);
    const tab = await openTab(page, 'Video Studio');
    await dismissModals(page);
    await tab.click();
    await assertRoute(page, /\/studio\/video/);
    await expect(page.getByRole('button', { name: /Video Studio/i })).toBeVisible();
    await expect(page.getByText(/Video Studio/)).toBeVisible();
  });

  test('video studio exposes controls without submitting a generation', async ({ page }) => {
    await gotoStudio(page);
    await dismissModals(page);

    const tab = await openTab(page, 'Video Studio');
    await dismissModals(page);
    await tab.click();
    await assertRoute(page, /\/studio\/video/);
    await expect(tab).toBeVisible();
    await expect(tab).toBeEnabled();
    await expect(page.getByText(/Video Studio/)).toBeVisible();
  });
});
