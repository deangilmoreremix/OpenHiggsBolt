import { test, expect } from '@playwright/test';

const AUTH_STATE_PATH = 'playwright/.clerk/smartvideo-demo-http_localhost_3111.json';
const DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test.use({ storageState: AUTH_STATE_PATH });

test('complete person edit flow', async ({ page }) => {
  console.log('1. navigate');
  await page.goto('/personalization-demo?test=true');
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  console.log('2. fill client fields');
  await page.fill('input[placeholder="ABC Roofing"]', 'Certification Roofing');
  await page.fill('input[placeholder="Roofing"]', 'Roofing');
  await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
  await page.fill('input[placeholder="Residential Roof Replacement"]', 'Roof Replacement');
  await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Inspection');
  console.log('3. add image via URL');
  const urlInputs = page.locator('input[type="text"]');
  const firstUrlInput = urlInputs.nth(0);
  await firstUrlInput.fill(DATA_URL);
  await page.locator('button:has-text("Add Photo URL")').first().dispatchEvent('click');
  console.log('4. wait for edit button');
  const editButton = page.locator('button:has-text("Edit with AI")').first();
  await expect(editButton).toBeVisible({ timeout: 30000 });
  console.log('5. open editor');
  await editButton.dispatchEvent('click');
  const editor = page.getByRole('dialog', { name: /smartvideo go image editor/i }).first();
  await expect(editor).toBeVisible({ timeout: 15000 });
  console.log('6. editor open');
  await page.waitForTimeout(2000);
  
  // Switch to advanced mode
  const advancedBtn = page.getByRole('button', { name: /Advanced Edit/i }).first();
  console.log('7. advanced edit button visible:', await advancedBtn.isVisible().catch(() => false));
  if (await advancedBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await advancedBtn.dispatchEvent('click');
    console.log('8. switched to advanced mode');
    await page.waitForTimeout(1000);
  }
  
  // Expand "Local Canvas Tools" section
  const localToolsSummary = page.locator('summary:has-text("Local Canvas Tools")').first();
  console.log('9. local canvas tools summary visible:', await localToolsSummary.isVisible().catch(() => false));
  if (await localToolsSummary.isVisible({ timeout: 2000 }).catch(() => false)) {
    await localToolsSummary.dispatchEvent('click');
    console.log('10. expanded local canvas tools');
    await page.waitForTimeout(1000);
  }
  
  // Click "Apply Local Edit" button to create version B
  const applyLocalBtn = page.getByRole('button', { name: /Apply Local Edit/i }).first();
  console.log('11. apply local edit button visible:', await applyLocalBtn.isVisible().catch(() => false));
  if (await applyLocalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await applyLocalBtn.dispatchEvent('click');
    console.log('12. clicked apply local edit');
    await page.waitForTimeout(3000);
  } else {
    console.log('11. apply local edit button NOT visible');
  }
  
  // Check apply button state
  const applyBtn = page.getByRole('button', { name: /use edited asset/i }).first();
  const isEnabled = await applyBtn.isEnabled();
  const disabledAttr = await applyBtn.getAttribute('disabled');
  console.log('13. apply button state after local edit:', { isEnabled, disabledAttr });
  
  if (isEnabled) {
    console.log('14. clicking use edited asset');
    await applyBtn.dispatchEvent('click');
    console.log('15. waiting for editor to close');
    await expect(editor).toBeHidden({ timeout: 10000 });
    console.log('SUCCESS: editor closed after apply');
  } else {
    console.log('14. apply button still disabled, cannot complete flow');
    await page.screenshot({ path: 'playwright/marketing-artifacts/apply-button-disabled-complete.png', fullPage: true });
  }
});
