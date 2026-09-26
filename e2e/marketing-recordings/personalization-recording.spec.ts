import { test, expect } from './demo-test';
import { DEMO_BASE_URL } from './helpers/recording';
import {
  assertNoForbiddenRequest,
  buildForbiddenGenerationPatterns,
  dismissKnownOnboarding,
  moveCursorAway,
  waitForDemoBeat,
} from './helpers/recording';

test.describe('Personalization marketing recording', () => {
  test.beforeEach(async ({ page }) => {
    await assertNoForbiddenRequest(page, buildForbiddenGenerationPatterns());
  });

  test('personalization demo stays in deterministic test mode', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/personalization-demo?test=true`);
    await expect(page).toHaveURL(new RegExp('/personalization-demo'));

    await waitForDemoBeat(page, 600);
    await expect(page.getByText(/Test mode active/)).toBeVisible();

    const dialog = page.getByRole('dialog', { name: /personalize this demo/i });
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await waitForDemoBeat(page, 500);

    await expect(dialog.getByText(/Viral Roofing Demo/i)).toBeVisible();
    await waitForDemoBeat(page, 300);

    await dismissKnownOnboarding(page);
    await moveCursorAway(page);
    await waitForDemoBeat(page, 400);
  });
});
