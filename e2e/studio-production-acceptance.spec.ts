import { test, expect, type Page } from '@playwright/test';
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';

const PROD_URL = 'https://go.smartvid.app';

const STUDIO_ROUTES: { route: string; label: string }[] = [
  { route: '/studio/image', label: 'Image' },
  { route: '/studio/video', label: 'Video' },
  { route: '/studio/audio', label: 'Audio' },
  { route: '/studio/clipping', label: 'Clipping' },
  { route: '/studio/vibe-motion', label: 'Vibe Motion' },
  { route: '/studio/lipsync', label: 'Lip Sync' },
  { route: '/studio/cinema', label: 'Cinema' },
  { route: '/studio/marketing', label: 'Marketing' },
  { route: '/studio/recast', label: 'Body Swap' },
  { route: '/studio/layers', label: 'Layers' },
  { route: '/studio/workflows', label: 'Workflows' },
  { route: '/studio/agents', label: 'Agents' },
  { route: '/studio/design-agent', label: 'Design Agent' },
  { route: '/studio/ai-influencer', label: 'AI Influencer' },
];

// clerkSetup() must run inside the worker process so its env vars are visible to
// setupClerkTestingToken, which runs in beforeEach.
test.beforeAll(async () => {
  await clerkSetup();
});

test.describe('Production studio acceptance', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.skip(
    !process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
    'Missing E2E_TEST_EMAIL or E2E_TEST_PASSWORD'
  );

  for (const studio of STUDIO_ROUTES) {
    test(studio.route, async ({ page }) => {
      await setupClerkTestingToken({ page });

      const response = await page.goto(`${PROD_URL}${studio.route}`);
      await page.waitForLoadState('networkidle');

      // Route should load without a server error.
      expect(response?.status()).toBeLessThan(500);

      // No uncaught page errors.
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));
      await page.waitForTimeout(2000);
      expect(pageErrors).toEqual([]);

      // Studio label should be visible.
      await page.getByText(studio.label, { exact: false }).first().waitFor({ timeout: 15000 });
    });
  }
});
