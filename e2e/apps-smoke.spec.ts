import { test, expect, type Page } from '@playwright/test';

test.describe('SmartVideo GO AI Apps smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('desktop /studio/apps loads and shows 38 apps', async ({ page }) => {
    const response = await page.goto('/studio/apps');
    expect(response?.status()).toBeLessThan(500);

    await page.waitForLoadState('networkidle');

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await page.waitForTimeout(2000);
    expect(pageErrors).toEqual([]);

    await expect(page.getByText('AI Apps')).toBeVisible();
    await expect(page.getByPlaceholderText('Search SmartVideo GO AI Apps...')).toBeVisible();

    const cards = page.locator('div.group >> h3');
    await expect(cards).toHaveCount(38);

    await expect(page.getByText('AI YouTube Shorts Generator')).toBeVisible();
    await expect(page.getByText('AI Group Photo')).toBeVisible();
    await expect(page.getByText('My Podcast')).toBeVisible();
    await expect(page.getByText('AI Character Studio')).toBeVisible();
    await expect(page.getByText('Nano Banana Studio')).toBeVisible();

    await expect(page.getByText('GitHub').first()).toBeVisible();
  });

  test('desktop search filters apps', async ({ page }) => {
    await page.goto('/studio/apps');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholderText('Search SmartVideo GO AI Apps...');
    await searchInput.fill('headshot');
    await expect(page.getByText('AI Headshot Studio')).toBeVisible();
    await expect(page.getByText('AI Clipping Studio')).not.toBeVisible();
  });

  test('desktop category filter works', async ({ page }) => {
    await page.goto('/studio/apps');
    await page.waitForLoadState('networkidle');

    const videoFilter = page.locator('button:has-text("Video")').first();
    await videoFilter.click();
    await expect(page.getByText('Seedance V2 Studio')).toBeVisible();
    await expect(page.getByText('AI Headshot Studio')).not.toBeVisible();
  });

  test('desktop no Coming Soon or Request Access UI', async ({ page }) => {
    await page.goto('/studio/apps');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Coming Soon')).toHaveCount(0);
    await expect(page.getByText('Request Access')).toHaveCount(0);
  });

  test('mobile layout is usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/studio/apps');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('AI Apps')).toBeVisible();
    const cards = page.locator('div.group >> h3');
    await expect(cards).toHaveCount(38);
  });
});
