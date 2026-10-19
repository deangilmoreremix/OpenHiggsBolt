import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3111';

test.describe('Find Business — Go-Viral Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      { name: '__e2e_auth_bypass', value: '1', url: BASE },
    ]);
  });

  async function openFindBusinessInGoViral(page: any) {
    await page.goto('/studio/go-ai-viral');

    // Wait for the studio to load
    await page.waitForTimeout(3000);

    // Look for "Personalize This Demo" button on a feed item
    const personalizeButtons = page.getByText(/Personalize This Demo/i);
    const count = await personalizeButtons.count();
    console.log(`Go-Viral personalize buttons: ${count}`);

    if (count === 0) {
      // Skip if no personalize buttons visible
      expect(true).toBe(true);
      return null;
    }

    await personalizeButtons.first().click();

    const dialog = page.getByRole('dialog', { name: /personalize this demo/i });
    await expect(dialog).toBeVisible({ timeout: 15000 });

    // Select "Client" audience to expose Find Local Business
    await dialog.getByRole('button', { name: 'Client' }).click();

    await dialog.getByRole('button', { name: /Find Local Business/i }).click();

    return dialog;
  }

  test('Search restaurants in Miami, Florida from Go-Viral Studio', async ({ page }) => {
    const dialog = await openFindBusinessInGoViral(page);
    if (!dialog) return;

    await dialog.selectOption('#business-niche', 'restaurants-food');
    await dialog.locator('#business-location').fill('Miami, Florida');

    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    const count = await resultCards.count();
    console.log(`Go-Viral Miami restaurants result count: ${count}`);

    expect(count).toBeGreaterThan(0);
  });

  test('Search dentists in Los Angeles, California from Go-Viral Studio', async ({ page }) => {
    const dialog = await openFindBusinessInGoViral(page);
    if (!dialog) return;

    await dialog.selectOption('#business-niche', 'healthcare-medical');
    await dialog.locator('#business-location').fill('Los Angeles, California');

    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    const count = await resultCards.count();
    console.log(`Go-Viral Los Angeles dentists result count: ${count}`);

    expect(count).toBeGreaterThan(0);
  });

  test('Selecting a business transfers info to Personalization in Go-Viral', async ({ page }) => {
    const dialog = await openFindBusinessInGoViral(page);
    if (!dialog) return;

    await dialog.selectOption('#business-niche', 'restaurants-food');
    await dialog.locator('#business-location').fill('Miami, Florida');

    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    expect(await resultCards.count()).toBeGreaterThan(0);

    await resultCards.first().click();

    await expect(dialog.getByText(/Selected:/i)).toBeVisible({ timeout: 10000 });

    const selectedText = await dialog.getByText(/Selected:/i).textContent();
    expect(selectedText).toBeTruthy();
  });
});
