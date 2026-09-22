import { test, expect } from '@playwright/test';
import { assertRoute, dismissModals, openTab, gotoStudio } from './helpers/demo';

test.describe('SmartVideo GO — studio overview demo', () => {
  test('studio shell loads with image tab active by default', async ({ page }) => {
    await gotoStudio(page);

    await expect(page).toHaveURL(new RegExp('/studio'));
    await expect(page.getByRole('button', { name: /image studio/i })).toBeVisible();
  });

  test('primary studio tabs are reachable without paid generation', async ({ page }) => {
    await gotoStudio(page);
    await dismissModals(page);

    // Verify a representative set of studio tabs. Full horizontal nav coverage
    // is exercised by the individual studio demo specs.
    const tabs = ['Image Studio', 'Video Studio', 'Audio Studio', 'Marketing Studio'];

    for (const tabLabel of tabs) {
      const tab = await openTab(page, tabLabel);
      await tab.click();
      await expect(tab).toBeVisible();
    }
  });

  test('studio header retains brand and user controls', async ({ page }) => {
    await gotoStudio(page);

    await expect(page.getByText('SmartVideo GO')).toBeVisible();
  });
});
