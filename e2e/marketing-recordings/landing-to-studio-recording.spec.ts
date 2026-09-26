import { test, expect } from './demo-test';
import { DEMO_BASE_URL } from './helpers/recording';
import {
  assertNoForbiddenRequest,
  buildForbiddenGenerationPatterns,
  dismissKnownOnboarding,
  moveCursorAway,
  waitForDemoBeat,
} from './helpers/recording';

test.describe('Landing to studio marketing recording', () => {
  test.beforeEach(async ({ page }) => {
    await assertNoForbiddenRequest(page, buildForbiddenGenerationPatterns());
  });

  test('landing page to authenticated studio journey', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/`);
    await expect(page).toHaveURL(new RegExp('/$'));
    await waitForDemoBeat(page, 800);

    await dismissKnownOnboarding(page);

    const studioLink = page.getByRole('link', { name: /open studio/i }).first();
    if (await studioLink.count() > 0) {
      await studioLink.click();
      await waitForDemoBeat(page, 700);
    } else {
      await page.goto(`${DEMO_BASE_URL}/studio`);
      await waitForDemoBeat(page, 700);
    }

    await expect(page).toHaveURL(new RegExp('/studio'));
    await moveCursorAway(page);
    await waitForDemoBeat(page, 600);
  });
});
