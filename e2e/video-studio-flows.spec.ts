import { test, expect } from '@playwright/test';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Video Studio end-to-end flows (mocked MuAPI, mocked auth).
 *
 * Two flows from VIDEO_STUDIO_AUDIT.md §8 recommendation 1:
 *   1. T2V → Extend  (generate with Seedance 2.0, then Extend the result)
 *   2. I2V end-frame (upload start frame, switch to a lastImageField model,
 *      upload the end frame)
 *
 * Conventions mirrored from e2e/thumbnail-studio.spec.ts (auth-bypass cookie +
 * `page.route` MuAPI interception) and e2e/video-studio.spec.ts (model picker).
 * No live MuAPI key / network is touched: every `api.muapi.ai` call (including
 * the XHR `upload_file` used by uploads) is fulfilled locally.
 *
 * REQUIRES a running dev server: `next dev --port 3210` (see playwright.config.ts).
 * Run with: `npm run test:e2e -- e2e/video-studio-flows.spec.ts`
 */

const FAKE_KEY = 'e2e-fake-muapi-key';
const FAKE_VIDEO_URL = 'https://example.com/clip.mp4';
const BASE = 'http://localhost:3210';

// A 1x1 transparent PNG so uploads / result <img> have a real (tiny) payload.
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';

let TEMP_IMG: string;

test.beforeAll(async () => {
  TEMP_IMG = join(tmpdir(), 'video-studio-e2e.png');
  writeFileSync(TEMP_IMG, Buffer.from(TINY_PNG, 'base64'));
});

// Intercept the MuAPI traffic the studio issues over the Next proxy.
// Under http the client uses the relative `/api` base, so the browser hits
// `http://localhost:3210/api/api/v1/...`; we match both that and the upstream.
async function routeMuapi(route: import('@playwright/test').Route) {
  const url = route.request().url();
  const method = route.request().method();

  // File uploads (XHR) — uploadFile() reads `data.url`.
  if (url.includes('/upload_file')) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://example.com/uploaded.png' }),
    });
  }
  // Prediction poll — return a completed result so generation resolves.
  if (url.includes('/predictions/')) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'succeeded', url: FAKE_VIDEO_URL }),
    });
  }
  // Submissions — hand back a request_id so submitAndPoll enters the poll loop.
  if (method === 'POST') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ request_id: 'fake-request-1' }),
    });
  }
  // Balance / account and any other GETs.
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ balance: 0 }),
  });
}

test.describe('Video Studio flows', () => {
  test.beforeEach(async ({ context, page }) => {
    // Dev-only auth bypass (see middleware.js) — no live Clerk session needed.
    await context.addCookies([{ name: '__e2e_auth_bypass', value: '1', url: BASE }]);
    // Seed a fake MuAPI key so StandaloneShell mounts the studio.
    await page.addInitScript((key) => {
      localStorage.setItem('muapi_key', key);
    }, FAKE_KEY);

    await page.route('**/api.muapi.ai/api/v1/**', routeMuapi);
    await page.route('**/api/v1/**', routeMuapi);

    await page.goto('/studio/video');
    await expect(page.getByText('Video Studio', { exact: true })).toBeVisible();
  });

  test('T2V → Extend: generate with Seedance 2.0 then Extend the result', async ({
    page,
  }) => {
    // Pick Seedance 2.0 (T2V, quality-capable, extendable).
    await page.getByRole('button', { name: /seedance lite/i }).click();
    await page.getByPlaceholder(/search/i).fill('Seedance 2.0');
    await page.getByText('Seedance 2.0', { exact: true }).first().click();

    // Drive a T2V generation.
    const prompt = page.getByPlaceholder(/describe the video you want to create/i);
    await expect(prompt).toBeVisible();
    await prompt.fill('A cat walking through a sunlit garden');
    await page.getByRole('button', { name: /generate/i }).first().click();

    // The per-result Extend action appears once the mocked generation completes.
    const extendBtn = page.getByTitle(/Extend this video using Seedance 2.0 Extend/i);
    await expect(extendBtn).toBeVisible({ timeout: 30_000 });

    // Extending switches to the Seedance 2.0 Extend model and shows the banner.
    await extendBtn.click();
    await expect(
      page.getByText('Extending previous Seedance 2.0 generation'),
    ).toBeVisible();
  });

  test('I2V end-frame: upload start frame, switch to a lastImageField model, upload end frame', async ({
    page,
  }) => {
    // Start from a T2V model whose I2V sibling supports a lastImageField.
    // Kling v2.1 Master (T2V, family "kling-v2.1") auto-switches to
    // Kling v2.1 Master I2V, which declares lastImageField:"last_image".
    await page.getByRole('button', { name: /seedance lite/i }).click();
    await page.getByPlaceholder(/search/i).fill('Kling v2.1 Master');
    await page.getByText('Kling v2.1 Master', { exact: true }).first().click();

    // Upload a start frame → auto-switches to the I2V sibling.
    const [startChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('button[title="Upload reference image"]').click(),
    ]);
    await startChooser.setFiles(TEMP_IMG);

    // The end-frame button is only rendered for lastImageField I2V models.
    const endFrameBtn = page.locator('button[title="Upload end frame (optional)"]');
    await expect(endFrameBtn).toBeVisible({ timeout: 30_000 });

    // Upload the end frame.
    const [endChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      endFrameBtn.click(),
    ]);
    await endChooser.setFiles(TEMP_IMG);

    // The end-frame preview badge ("END") confirms it was attached.
    await expect(page.getByText('END', { exact: true })).toBeVisible({ timeout: 30_000 });
    // And the end-frame upload button is consumed (gated by !uploadedEndImageUrl).
    await expect(endFrameBtn).toHaveCount(0);
  });
});
