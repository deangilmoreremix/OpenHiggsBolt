import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test.describe('Clerk auth integration', () => {
  test('public landing page is reachable', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SmartVideo GO|Studio/i);
  });

  test('protected route redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/studio');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('custom sign-in page renders the email/password form', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  // Full authenticated flow. Requires a real test user in the dev instance.
  // Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD in .env.local (or CI secrets) to enable.
  test('signs in with test user and reaches the studio', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;
    test.skip(!email || !password, 'No E2E test credentials configured');

    await setupClerkTestingToken({ page });
    await page.goto('/sign-in');
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/studio/);
    await expect(page.getByTestId('clerk-user-button')).toBeVisible();
  });
});
