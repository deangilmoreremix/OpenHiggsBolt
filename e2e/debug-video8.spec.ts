import { test, expect } from '@playwright/test';

test('debug video studio network', async ({ context, page }) => {
  await context.addCookies([
    { name: '__e2e_auth_bypass', value: '1', url: 'http://localhost:3111' },
  ]);
  
  const failedRequests: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });
  
  await page.goto('http://localhost:3111/studio/video');
  await page.waitForTimeout(10000);
  
  console.log('Failed requests:');
  failedRequests.forEach(req => console.log('  ', req));
});
