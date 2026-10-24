import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  assertNoOnboardingModal,
  captureEvidence,
  installStudioSession,
} from './helpers/motion-studio';

/**
 * Evidence for the Motion Studio design replacement (Design Agent look).
 *
 * Captures the Motion Studio home and the workbench on desktop and mobile.
 * `MS_SHOT_LABEL=before|after` names the files so the same spec records the
 * old UI (run on the pre-change commit) and the new one.
 *
 * Local sandboxed run: `MS_OFFLINE_CLERK=1 MS_SHOT_LABEL=after npx playwright test
 * -c playwright.ms.config.ts e2e/motion-studio-design-replacement.spec.ts`.
 */
const LABEL = process.env.MS_SHOT_LABEL ?? 'after';
const OUT = 'docs/motion-studio-design-replacement';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Motion Studio design (${vp.name})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
    });

    test('home', async ({ page }) => {
      await installStudioSession(page);
      await page.goto(`${BASE_URL}/studio/motion-studio/new`);
      await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
      await page.waitForTimeout(1500);
      await assertNoOnboardingModal(page);
      await captureEvidence(page, `${OUT}/${LABEL}-home-${vp.name}.png`, { minBytes: 10 * 1024 });
    });

    test('template picker plays a Remotion preview', async ({ page }) => {
      await installStudioSession(page);
      await page.goto(`${BASE_URL}/studio/motion-studio/new`);
      await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
      await assertNoOnboardingModal(page);
      await page.getByRole('button', { name: /Select a recipe/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Motion Templates' });
      await expect(dialog).toBeVisible();
      await dialog.getByPlaceholder('Search recipes...').fill('crash zoom');
      const card = dialog.locator('button').filter({ hasText: 'Crash Zoom Punch' }).first();
      await expect(card).toBeVisible();
      // Nothing plays until a card is hovered; then exactly one live Remotion player.
      await expect(dialog.locator('[data-recipe-preview="player"]')).toHaveCount(0);
      // Real pointer movement (locator.hover() did not dispatch moves here).
      const box = (await card.boundingBox())!;
      await page.mouse.move(10, 10);
      await page.mouse.move(box.x + box.width / 2, box.y + 60, { steps: 5 });
      await expect(dialog.locator('[data-recipe-preview="player"]')).toHaveCount(1);
      await expect(card.locator('.__remotion-player')).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(1500);
      await captureEvidence(page, `${OUT}/${LABEL}-template-picker-${vp.name}.png`, { minBytes: 10 * 1024 });
    });

    test('workbench', async ({ page }) => {
      await installStudioSession(page, { entrySeen: true });
      await page.goto(`${BASE_URL}/studio/motion-studio`);
      await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
      await page.waitForTimeout(2500);
      await assertNoOnboardingModal(page);
      await captureEvidence(page, `${OUT}/${LABEL}-workbench-${vp.name}.png`, { minBytes: 10 * 1024 });
    });
  });
}
