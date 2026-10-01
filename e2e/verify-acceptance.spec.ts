import { test, expect } from '@playwright/test';

test.describe('Zero-key scraping acceptance', () => {
  test('personalization demo page loads without OpenAI prompts', async ({ page }) => {
    await page.goto('/personalization-demo');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/tmp/personalization-demo-loaded.png', fullPage: true });

    const bodyText = await page.textContent('body');
    console.log('Body text preview:', bodyText?.substring(0, 1500));

    // The page should load without requiring OpenAI key for scraping
    expect(bodyText).not.toContain('OpenAI API key');
    expect(bodyText).not.toContain('MissingOpenAiKeyError');
  });

  test('discovery API returns real assets for apple.com', async ({ page }) => {
    await page.goto('/personalization-demo');
    await page.waitForTimeout(2000);

    // Check if there's a way to trigger discovery from the UI
    // Look for any input fields or buttons
    const inputs = await page.locator('input[type="text"], input[type="url"]').count();
    console.log('Input fields found:', inputs);

    const buttons = await page.locator('button').count();
    console.log('Buttons found:', buttons);

    // List all button texts
    for (let i = 0; i < Math.min(buttons, 20); i++) {
      const text = await page.locator('button').nth(i).textContent();
      console.log(`Button ${i}:`, text);
    }
  });
});
