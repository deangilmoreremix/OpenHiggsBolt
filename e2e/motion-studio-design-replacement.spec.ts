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
