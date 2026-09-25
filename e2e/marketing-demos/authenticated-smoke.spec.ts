import { test, expect } from './demo-test';

test.describe('SmartVideo GO marketing demos', () => {
  test('landing page shows authenticated user menu', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('button', { name: /open user menu/i })
    ).toBeVisible();
  });

  test('studio is reachable without manual sign-in', async ({ page }) => {
    await page.goto('/studio');

    await expect(page).toHaveURL(/\/studio/);
  });

  test('account page is reachable from stored session', async ({ page }) => {
    await page.goto('/account');

    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByRole('heading', { name: /manage your account/i })).toBeVisible();
  });
});
