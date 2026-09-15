import { test, expect } from '@playwright/test';

test('debug video studio buttons', async ({ context, page }) => {
  await context.addCookies([
    { name: '__e2e_auth_bypass', value: '1', url: 'http://localhost:3111' },
  ]);
  
  await page.goto('http://localhost:3111/studio/video');
  await page.waitForTimeout(8000);
  
  const buttons = await page.locator('button').all();
  console.log('Total buttons:', buttons.length);
  
  for (let i = 0; i < Math.min(buttons.length, 20); i++) {
    const text = await buttons[i].textContent();
    const html = await buttons[i].innerHTML();
    console.log(`Button ${i}: text="${text?.trim().slice(0, 50)}"`);
  }
  
  const modelBtn = page.locator('button:has(img)').first();
  const count = await modelBtn.count();
  console.log('Buttons with img:', count);
  
  if (count > 0) {
    const text = await modelBtn.textContent();
    console.log('Model button text:', text?.trim());
  }
});
