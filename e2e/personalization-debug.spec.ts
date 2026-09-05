import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3111';

test.describe('Personalization Debug', () => {
  test('check modal opens', async ({ page }) => {
    await page.goto('/personalization-demo');
    await page.waitForTimeout(1000);
    
    // Set keys after page loads
    await page.evaluate(() => {
      localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
      localStorage.setItem('openai_key', 'e2e-fake-openai-key');
    });
    
    // Reload to pick up keys
    await page.reload();
    await page.waitForTimeout(3000);
    
    const bodyText = await page.textContent('body');
    console.log('Has Source Demo:', bodyText?.includes('Source Demo'));
    console.log('Has Client Profile:', bodyText?.includes('Client Profile'));
    console.log('Has Person:', bodyText?.includes('Person'));
    console.log('Has CTA:', bodyText?.includes('CTA'));
    console.log('Has Brand References:', bodyText?.includes('Brand References'));
    
    await page.screenshot({ path: '/tmp/personalization-debug.png', fullPage: true });
  });
});
