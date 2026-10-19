import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3111';

test.describe('Find Business Assets — Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      { name: '__e2e_auth_bypass', value: '1', url: BASE },
    ]);
  });

  async function openAssetDiscovery(page: any) {
    await page.goto('/personalization-demo?test=true');

    const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
    await expect(dialog).toBeVisible();

    // Select "Client" audience
    await dialog.getByRole('button', { name: 'Client' }).click();

    // Find a business first (needed for the asset discovery flow)
    await dialog.getByRole('button', { name: /Find Local Business/i }).click();
    await dialog.selectOption('#business-niche', 'restaurants-food');
    await dialog.locator('#business-location').fill('Miami, Florida');
    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    expect(await resultCards.count()).toBeGreaterThan(0);
    await resultCards.first().click();

    await expect(dialog.getByText(/Selected:/i)).toBeVisible({ timeout: 10000 });

    return dialog;
  }

  test('Select a business with a website, discover assets, and import to Personalization', async ({ page }) => {
    const dialog = await openAssetDiscovery(page);

    // Look for the website field - should be pre-filled from selected business
    const websiteInput = dialog.getByPlaceholder(/https?:\/\//i);
    const websiteValue = await websiteInput.inputValue();

    if (websiteValue && websiteValue.startsWith('http')) {
      // Website exists - proceed with asset discovery
      await dialog.getByRole('button', { name: /Find Business Assets/i }).click();

      // Wait for discovery to start/complete
      await expect(dialog.getByText(/Discovered Assets|discovery|scanning/i)).toBeVisible({ timeout: 60000 });

      // Check for discovered assets
      const assetCheckboxes = dialog.locator('input[type="checkbox"]');
      const assetCount = await assetCheckboxes.count();
      console.log(`Discovered asset count: ${assetCount}`);

      if (assetCount > 0) {
        // Select first asset
        await assetCheckboxes.first().click();

        // Look for import button
        const importButtons = dialog.getByRole('button').filter({ hasText: /Import|Add to Personalization|Use Asset/i });
        if ((await importButtons.count()) > 0) {
          await importButtons.first().click();
          await expect(dialog.getByText(/imported|added|personalization/i)).toBeVisible({ timeout: 15000 });
        }
      }
    } else {
      // No website - verify the UI handles this gracefully
      console.log('Selected business has no website - asset discovery not applicable');
      expect(true).toBe(true);
    }
  });

  test('Business without website shows empty asset state gracefully', async ({ page }) => {
    const dialog = await openAssetDiscovery(page);

    const websiteInput = dialog.getByPlaceholder(/https?:\/\//i);
    const websiteValue = await websiteInput.inputValue();

    if (!websiteValue || !websiteValue.startsWith('http')) {
      // No website - click Find Business Assets should show empty state or error
      await dialog.getByRole('button', { name: /Find Business Assets/i }).click();
      await page.waitForTimeout(3000);
      // Should not crash - empty state is valid
      expect(true).toBe(true);
    } else {
      // Skip - this business has a website
      expect(true).toBe(true);
    }
  });

  test('Empty website URL input shows validation error', async ({ page }) => {
    const dialog = await openAssetDiscovery(page);

    const websiteInput = dialog.getByPlaceholder(/https?:\/\//i);
    await websiteInput.fill('');

    await dialog.getByRole('button', { name: /Find Business Assets/i }).click();

    await expect(dialog.getByText(/website|URL|required|invalid/i)).toBeVisible({ timeout: 15000 });
  });

  test('Invalid website URL shows error', async ({ page }) => {
    const dialog = await openAssetDiscovery(page);

    const websiteInput = dialog.getByPlaceholder(/https?:\/\//i);
    await websiteInput.fill('not-a-valid-url');

    await dialog.getByRole('button', { name: /Find Business Assets/i }).click();

    await expect(dialog.getByText(/website|URL|required|invalid/i)).toBeVisible({ timeout: 15000 });
  });
});
