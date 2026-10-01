import { test, expect } from './demo-test';
import { DEMO_BASE_URL } from './helpers/recording';
import {
  dismissKnownOnboarding,
  ensureStudioReady,
  moveCursorAway,
  smoothScrollTo,
  waitForDemoBeat,
} from './helpers/recording';

test.describe('SmartVideo GO marketing overview recording', () => {
  test('smartvideo go overview', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/`);
    await expect(page).toHaveURL(new RegExp('/$'));
    await waitForDemoBeat(page, 800);

    await dismissKnownOnboarding(page);

    const studioLink = page
      .getByRole('link', { name: /open studio/i })
      .first();
    await expect(studioLink).toBeVisible();
    await smoothScrollTo(page, studioLink);
    await studioLink.click();

    await ensureStudioReady(page);
    await moveCursorAway(page);
    await waitForDemoBeat(page, 500);

    const studios = [
      { label: 'Image Studio', route: '/studio/image' },
      { label: 'Video Studio', route: '/studio/video' },
      { label: 'Audio Studio', route: '/studio/audio' },
      { label: 'Marketing Studio', route: '/studio/marketing' },
    ];

    for (const studio of studios) {
      const tab = page.getByRole('button', { name: studio.label }).first();
      await expect(tab).toBeVisible();
      await tab.click();
      await page.waitForURL(
        (url) => url.pathname === studio.route,
        { timeout: 30_000 }
      );
      await waitForDemoBeat(page, 700);
      await smoothScrollTo(page, tab);
      await moveCursorAway(page);
    }

    await page.goto(`${DEMO_BASE_URL}/`);
    await waitForDemoBeat(page, 600);
  });
});
