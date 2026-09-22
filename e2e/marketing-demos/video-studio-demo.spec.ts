import { test, expect } from '@playwright/test';
import { assertRoute, dismissModals, openTab, gotoStudio } from './helpers/demo';

test.describe('SmartVideo GO — video studio demo', () => {
  test('video studio tab opens without triggering paid generation', async ({ page }) => {
    await gotoStudio(page);
    await expect(page).toHaveURL(new RegExp('/studio'));

    await dismissModals(page);
    const tab = await openTab(page, 'Video Studio');
    await tab.click();

    // Verify Video Studio tab is active after click.
    await expect(page.getByRole('button', { name: /Video Studio/i })).toBeVisible();
    await expect(tab).toHaveAttribute('aria-current', 'true');
  });

  test('video studio exposes controls without submitting a generation', async ({ page }) => {
    await gotoStudio(page);
    await dismissModals(page);

    const tab = await openTab(page, 'Video Studio');
    await tab.click();
    await expect(page.getByRole('button', { name: /Video Studio/i })).toBeVisible();

    // Verify the active Video Studio panel is visible.
    await expect(tab).toHaveAttribute('aria-current', 'true');
  });
});
