import { test, expect } from '@playwright/test';
import { DEMO_BASE_URL } from './helpers/demo';

test.describe('SmartVideo GO — personalization demo', () => {
  test('opens personalization demo in test mode without requiring an API key', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/personalization-demo?test=true`);

    await expect(page).toHaveURL(new RegExp('/personalization-demo'));

    // Test mode indicator is rendered on the page background.
    await expect(page.getByText(/Test mode active/)).toBeVisible();

    // Scope to the actual modal/dialog so background page content cannot
    // satisfy the assertion if AutoOpener fails.
    const dialog = page.getByRole('dialog', { name: /personalize this demo/i }).first();
    await expect(dialog).toBeVisible();
  });

  test('sample source modal is present for deterministic review', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/personalization-demo?test=true`);

    const dialog = page.getByRole('dialog', { name: /personalize this demo/i }).first();
    await expect(dialog).toBeVisible();

    await expect(dialog.getByText(/Viral Roofing Demo/i)).toBeVisible();
  });

  test('settings prompt is visible when no API key is configured', async ({ page }) => {
    await page.goto(`${DEMO_BASE_URL}/personalization-demo?test=true`);

    const dialog = page.getByRole('dialog', { name: /personalize this demo/i }).first();
    await expect(dialog).toBeVisible();

    await expect(dialog.getByRole('button', { name: /settings/i })).toBeVisible();
  });
});
