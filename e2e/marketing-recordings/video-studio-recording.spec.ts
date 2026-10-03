import { test, expect } from './demo-test';
import { DEMO_BASE_URL } from './helpers/recording';
import {
  ensureStudioReady,
  moveCursorAway,
  smoothScrollTo,
  waitForDemoBeat,
} from './helpers/recording';

test.describe('Video studio marketing recording', () => {
  test('video studio interface walkthrough', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/studio/video`);
    await ensureStudioReady(page);
    await expect(page).toHaveURL(
      (url) => url.pathname === '/studio/video'
    );
    await waitForDemoBeat(page, 700);

    const tab = page.getByRole('button', { name: /Video Studio/i }).first();
    await expect(tab).toBeVisible();
    await smoothScrollTo(page, tab);
    await moveCursorAway(page);
    await waitForDemoBeat(page, 400);

    await expect(page.getByText(/Video Studio/)).toBeVisible();
    await waitForDemoBeat(page, 500);
  });
});
