import { test, expect } from '@playwright/test';
import { DEMO_BASE_URL } from './helpers/demo';

test.describe('SmartVideo GO — landing demo', () => {
  test('authenticated landing page loads without redirecting to sign-in', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/`);

    await expect(page).toHaveTitle(/SmartVideo GO|Studio/i);
    await expect(page.getByRole('link', { name: /open studio/i })).toBeVisible();
  });

  test('primary navigation is present on landing page', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/`);

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Studio' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Workflow' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'FAQ' })).toBeVisible();
  });

  test('open studio from authenticated landing header', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/`);

    const openStudio = page.getByRole('link', { name: /open studio/i });
    await expect(openStudio).toBeVisible();
    await openStudio.click();

    await page.waitForURL((url) => url.pathname.includes('/studio'), {
      timeout: 30_000,
    });
    await expect(page).toHaveURL(new RegExp('/studio'));
  });
});
