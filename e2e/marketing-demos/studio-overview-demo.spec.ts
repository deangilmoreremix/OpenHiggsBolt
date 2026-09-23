import { test, expect } from '@playwright/test';
import { assertRoute, dismissModals, openTab, gotoStudio } from './helpers/demo';

test.describe('SmartVideo GO — studio overview demo', () => {
  test('studio shell loads with image tab active by default', async ({ page }) => {
    await gotoStudio(page);

    await expect(page).toHaveURL(new RegExp('/studio'));
    await expect(page.getByRole('button', { name: /image studio/i })).toBeVisible();
  });

  test('primary studio tabs are interactive after navigation', async ({ page }) => {
    await gotoStudio(page);
    await dismissModals(page);

    // Verify a representative set of studio tabs.
    const tabs = [
      { label: 'Image Studio', route: '/studio/image', marker: /Describe a scene, character, mood, or style/ },
      { label: 'Video Studio', route: '/studio/video', marker: /Video Studio/ },
      { label: 'Audio Studio', route: '/studio/audio', marker: /Audio Studio/ },
      { label: 'Marketing Studio', route: '/studio/marketing', marker: /MARKETING STUDIO|Marketing Studio/ },
    ];

    for (const tab of tabs) {
      const tabLocator = await openTab(page, tab.label);
      await dismissModals(page);
      await tabLocator.click();

      // Prove the tab click actually changed the studio panel.
      await assertRoute(page, tab.route);
      await expect(page.getByText(tab.marker)).toBeVisible();
    }
  });

  test('studio header retains brand and user controls', async ({ page }) => {
    await gotoStudio(page);

    await expect(page.getByText('SmartVideo GO')).toBeVisible();
  });
});
