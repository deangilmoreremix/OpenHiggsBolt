import { test, expect } from '@playwright/test';
import { clerkSetup, clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

/**
 * Video Studio smoke test — proves the Quality & Mode controls added in the
 * VideoStudio.jsx audit fix actually render for capable models.
 *
 * Exercises the real UI at `/studio/video` but NEVER touches live MuAPI.
 * All `https://api.muapi.ai/**` traffic is intercepted, so no real key/network.
 *
 * AUTH: `/studio/*` is Clerk-protected (middleware.js). We sign in with the
 * same `@clerk/testing` token pattern as e2e/auth.spec.ts / thumbnail-studio.spec.ts.
 * If E2E_TEST_EMAIL is not configured the test is skipped (honest fail, no bypass).
 */

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const FAKE_KEY = 'e2e-fake-muapi-key';
const FAKE_VIDEO_URL = 'https://example.com/clip.mp4';

test.beforeAll(async () => {
  await clerkSetup();
});

test.describe('Video Studio — Quality & Mode controls', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!email, 'No E2E test credentials configured (set E2E_TEST_EMAIL)');

    await setupClerkTestingToken({ page });
    await page.goto('/');
    await clerk.signIn({ page, emailAddress: email, password });
  });

  test('renders the studio and shows Quality for a quality-capable model', async ({
    page,
  }) => {
    // Seed a fake MuAPI key so StandaloneShell mounts the studio (not an auth wall).
    await page.addInitScript((key) => {
      localStorage.setItem('muapi_key', key);
    }, FAKE_KEY);

    // Keep everything offline: fake a completed generation result for any video endpoint.
    await page.route('**/api.muapi.ai/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/predictions/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'completed', url: FAKE_VIDEO_URL }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ request_id: 'fake-request-1', balance: 0 }),
      });
    });

    await page.goto('/studio/video');

    // The studio heading + prompt bar mount.
    await expect(page.getByText('Video Studio', { exact: true })).toBeVisible();
    const promptBar = page.getByPlaceholder(/describe the video you want to create/i);
    await expect(promptBar).toBeVisible();

    // Open the model picker (default model is "Seedance Lite").
    await page.getByRole('button', { name: /seedance lite/i }).click();

    // Filter + pick "Seedance 2.0" (T2V — has a `quality` input).
    await page.getByPlaceholder(/search/i).fill('Seedance 2.0');
    await page.getByText('Seedance 2.0', { exact: true }).first().click();

    // The Quality control should now be present. Its trigger shows the current
    // quality value ("basic" for Seedance 2.0 T2V); opening it reveals
    // the "Quality" dropdown heading.
    const qualityTrigger = page.getByRole('button', { name: /^basic$/i });
    await expect(qualityTrigger).toBeVisible();
    await qualityTrigger.click();
    await expect(page.getByText('Quality', { exact: true })).toBeVisible();
  });

  test('shows Mode for a mode-capable model (Grok Imagine)', async ({
    page,
  }) => {
    await page.addInitScript((key) => {
      localStorage.setItem('muapi_key', key);
    }, FAKE_KEY);

    await page.route('**/api.muapi.ai/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/predictions/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'completed', url: FAKE_VIDEO_URL }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ request_id: 'fake-request-1', balance: 0 }),
      });
    });

    await page.goto('/studio/video');
    await expect(page.getByText('Video Studio', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /seedance lite/i }).click();
    await page.getByPlaceholder(/search/i).fill('Grok Imagine');
    await page.getByText('Grok Imagine', { exact: true }).first().click();

    // Grok Imagine has a `mode` input; the Mode control shows the fallback
    // "normal" label until changed.
    const modeTrigger = page.getByRole('button', { name: /^normal$/i });
    await expect(modeTrigger).toBeVisible();
    await modeTrigger.click();
    await expect(page.getByText('Mode', { exact: true })).toBeVisible();
  });
});
