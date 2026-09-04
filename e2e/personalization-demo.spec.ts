import { test, expect } from '@playwright/test';

test.describe('Personalization Demo', () => {
  test('shows missing API key state when no MuAPI key is configured', async ({ page }) => {
    await page.goto('/personalization-demo');

    await expect(page.getByText(/MuAPI Key Required/i)).toBeVisible();
    await expect(page.getByText(/Open Settings and add your MuAPI key/i)).toBeVisible();
  });

  test('shows Open Settings button when no API key', async ({ page }) => {
    await page.goto('/personalization-demo');

    await expect(page.getByRole('button', { name: /Open Settings/i })).toBeVisible();
  });
});
