import { test, expect } from '@playwright/test';

test('debug video studio html', async ({ context, page }) => {
  await context.addCookies([
    { name: '__e2e_auth_bypass', value: '1', url: 'http://localhost:3111' },
  ]);
  
  await page.goto('http://localhost:3111/studio/video');
  await page.waitForTimeout(10000);
  
  const html = await page.content();
  console.log('HTML length:', html.length);
  console.log('Contains VideoStudio:', html.includes('VideoStudio'));
  console.log('Contains Seedance:', html.includes('Seedance'));
  console.log('Contains spinner:', html.includes('animate-spin'));
  console.log('Contains loading:', html.includes('Loading'));
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/video-debug.png' });
});
