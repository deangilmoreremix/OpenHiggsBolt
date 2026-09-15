import { test, expect } from '@playwright/test';

test('debug video studio', async ({ page }) => {
  await page.goto('http://localhost:3111/studio/video');
  await page.waitForTimeout(10000);
  
  const title = await page.title();
  console.log('Page title:', title);
  
  const url = page.url();
  console.log('Page URL:', url);
});
