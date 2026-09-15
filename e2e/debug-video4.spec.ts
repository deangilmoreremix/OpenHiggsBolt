import { test, expect } from '@playwright/test';

test('debug video studio with auth', async ({ context, page }) => {
  await context.addCookies([
    { name: '__e2e_auth_bypass', value: '1', url: 'http://localhost:3111' },
  ]);
  
  await page.goto('http://localhost:3111/studio/video');
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log('Page URL:', url);
  
  const title = await page.title();
  console.log('Page title:', title);
});
