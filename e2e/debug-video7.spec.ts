import { test, expect } from '@playwright/test';

test('debug video studio js errors', async ({ context, page }) => {
  await context.addCookies([
    { name: '__e2e_auth_bypass', value: '1', url: 'http://localhost:3111' },
  ]);
  
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    errors.push(err.message);
    console.log('Page error:', err.message);
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  await page.goto('http://localhost:3111/studio/video');
  await page.waitForTimeout(10000);
  
  console.log('Total errors:', errors.length);
  console.log('HTML length:', await page.evaluate(() => document.body.innerHTML.length));
});
