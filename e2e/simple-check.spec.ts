import { test, expect } from '@playwright/test';

test('simple check', async ({ page }) => {
  await page.goto('http://localhost:3111/');
  await page.waitForTimeout(1000);
  await expect(page.locator('body')).toBeVisible();
});
