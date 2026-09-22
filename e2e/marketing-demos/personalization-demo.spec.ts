import { test, expect } from '@playwright/test';
import { DEMO_BASE_URL } from './helpers/demo';

test.describe('SmartVideo GO — personalization demo', () => {
  test('opens personalization demo in test mode without requiring an API key', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/personalization-demo?test=true`);

    await expect(page).toHaveURL(new RegExp('/personalization-demo'));
    await expect(page.getByText(/Personalization Modal/i)).toBeVisible();
    await expect(page.getByText(/Test mode active/i)).toBeVisible();
  });

  test('sample source modal is present for deterministic review', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/personalization-demo?test=true`);

    await expect(page.getByText(/Viral Roofing Demo/i)).toBeVisible();
  });

  test('settings prompt is visible when no API key is configured', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/personalization-demo?test=true`);

    await expect(page.getByRole('button', { name: /settings/i })).toBeVisible();
  });
});
