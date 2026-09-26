import { test, expect } from './demo-test';
import { DEMO_BASE_URL } from './helpers/recording';
import {
  assertNoForbiddenRequest,
  buildForbiddenGenerationPatterns,
  dismissKnownOnboarding,
  ensureStudioReady,
  moveCursorAway,
  smoothScrollTo,
  waitForDemoBeat,
} from './helpers/recording';

test.describe('SmartVideo GO marketing overview recording', () => {
  test.beforeEach(async ({ page }) => {
    await assertNoForbiddenRequest(page, buildForbiddenGenerationPatterns());
  });

  test('smartvideo go overview', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/`);
    await expect(page).toHaveURL(new RegExp('/$'));
    await waitForDemoBeat(page, 800);

    await dismissKnownOnboarding(page);

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Studio' })).toBeVisible();
    await waitForDemoBeat(page, 400);

    await smoothScrollTo(page, nav.getByRole('link', { name: 'Studio' }));
    await moveCursorAway(page);
    await waitForDemoBeat(page, 300);

    await ensureStudioReady(page);
    await waitForDemoBeat(page, 500);

    const studios = [
      'Image Studio',
      'Video Studio',
      'Audio Studio',
      'Marketing Studio',
    ];

    for (const studioName of studios) {
      const tab = page.getByRole('button', { name: studioName }).first();
      if (await tab.count() > 0) {
        await tab.click();
        await waitForDemoBeat(page, 700);
        await smoothScrollTo(page, tab);
        await moveCursorAway(page);
      }
    }

    await page.goto(`${DEMO_BASE_URL}/`);
    await waitForDemoBeat(page, 600);
  });
});
