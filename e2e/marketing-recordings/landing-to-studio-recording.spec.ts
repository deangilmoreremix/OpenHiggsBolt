import { test, expect } from './demo-test';
import { DEMO_BASE_URL } from './helpers/recording';
import {
  dismissKnownOnboarding,
  moveCursorAway,
  waitForDemoBeat,
} from './helpers/recording';

test.describe('Landing to studio marketing recording', () => {
  test('landing page to authenticated studio journey', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/`);
    await expect(page).toHaveURL(new RegExp('/$'));
    await waitForDemoBeat(page, 800);

    await dismissKnownOnboarding(page);

    const studioLink = page
      .getByRole('link', { name: /open studio/i })
      .first();
    await expect(studioLink).toBeVisible();
    await studioLink.click();

    await expect(page).toHaveURL(new RegExp('/studio'));
    await waitForDemoBeat(page, 700);
    await moveCursorAway(page);
    await waitForDemoBeat(page, 600);
  });
});
