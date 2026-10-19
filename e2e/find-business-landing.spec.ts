import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3111';

test.describe('Find Business — Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      { name: '__e2e_auth_bypass', value: '1', url: BASE },
    ]);
  });

  async function openFindBusinessForm(page: any) {
    await page.goto('/personalization-demo?test=true');

    const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
    await expect(dialog).toBeVisible();

    // Select "Client" audience to expose the Find Local Business button
    await dialog.getByRole('button', { name: 'Client' }).click();

    await dialog.getByRole('button', { name: /Find Local Business/i }).click();

    return dialog;
  }

  test('Search restaurants in Miami, Florida returns real selectable businesses', async ({ page }) => {
    const dialog = await openFindBusinessForm(page);

    await dialog.selectOption('#business-niche', 'restaurants-food');
    await dialog.locator('#business-location').fill('Miami, Florida');

    // Click radius to trigger search
    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    const count = await resultCards.count();
    console.log(`Miami restaurants result count: ${count}`);

    expect(count).toBeGreaterThan(0);

    // Click "Use This Business" on the first result
    await resultCards.first().click();

    // Verify selected business summary appears
    await expect(dialog.getByText(/Selected:/i)).toBeVisible({ timeout: 10000 });
  });

  test('Search dentists in Los Angeles, California returns real selectable businesses', async ({ page }) => {
    const dialog = await openFindBusinessForm(page);

    await dialog.selectOption('#business-niche', 'healthcare-medical');
    await dialog.locator('#business-location').fill('Los Angeles, California');

    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    const count = await resultCards.count();
    console.log(`Los Angeles dentists result count: ${count}`);

    expect(count).toBeGreaterThan(0);

    await resultCards.first().click();

    await expect(dialog.getByText(/Selected:/i)).toBeVisible({ timeout: 10000 });
  });

  test('Search real estate businesses in New York, New York returns real selectable businesses', async ({ page }) => {
    const dialog = await openFindBusinessForm(page);

    await dialog.selectOption('#business-niche', 'real-estate');
    await dialog.locator('#business-location').fill('New York, New York');

    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    const count = await resultCards.count();
    console.log(`New York real estate result count: ${count}`);

    expect(count).toBeGreaterThan(0);

    await resultCards.first().click();

    await expect(dialog.getByText(/Selected:/i)).toBeVisible({ timeout: 10000 });
  });

  test('Search businesses using a different industry/location combination', async ({ page }) => {
    const dialog = await openFindBusinessForm(page);

    await dialog.selectOption('#business-niche', 'automotive');
    await dialog.locator('#business-location').fill('Austin, Texas');

    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    const count = await resultCards.count();
    console.log(`Austin automotive result count: ${count}`);

    expect(count).toBeGreaterThan(0);
  });

  test('Empty search shows validation error', async ({ page }) => {
    const dialog = await openFindBusinessForm(page);

    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/niche is required|location is required/i)).toBeVisible({ timeout: 15000 });
  });

  test('Selecting a business transfers its information to Personalization', async ({ page }) => {
    const dialog = await openFindBusinessForm(page);

    await dialog.selectOption('#business-niche', 'restaurants-food');
    await dialog.locator('#business-location').fill('Miami, Florida');

    await dialog.getByRole('button', { name: '15 mi' }).click();

    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    expect(await resultCards.count()).toBeGreaterThan(0);

    await resultCards.first().click();

    await expect(dialog.getByText(/Selected:/i)).toBeVisible({ timeout: 10000 });

    // Business name should appear in the selected summary
    const selectedText = await dialog.getByText(/Selected:/i).textContent();
    expect(selectedText).toBeTruthy();
    expect(selectedText.length).toBeGreaterThan('Selected: '.length);
  });

  test('Repeated searches return results without errors', async ({ page }) => {
    const dialog = await openFindBusinessForm(page);

    // First search
    await dialog.selectOption('#business-niche', 'restaurants-food');
    await dialog.locator('#business-location').fill('Miami, Florida');
    await dialog.getByRole('button', { name: '15 mi' }).click();
    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    // New search
    await dialog.getByRole('button', { name: /New Search/i }).click();
    await dialog.selectOption('#business-niche', 'real-estate');
    await dialog.locator('#business-location').fill('Orlando, Florida');
    await dialog.getByRole('button', { name: '15 mi' }).click();
    await expect(dialog.getByText(/businesses found for/i)).toBeVisible({ timeout: 60000 });

    const resultCards = dialog.locator('[role="button"]').filter({ hasText: /Use This Business/i });
    expect(await resultCards.count()).toBeGreaterThan(0);
  });
});
