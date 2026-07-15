import { test, expect } from '@playwright/test';

/**
 * Thumbnail Studio smoke test (mocked MuAPI, mocked auth).
 *
 * Fully self-contained / CI-safe:
 *  - Auth is bypassed via the dev-only `__e2e_auth_bypass` cookie (see middleware.js),
 *    so no live Clerk session is required.
 *  - Every `https://api.muapi.ai/**` request is intercepted with `page.route` and
 *    fulfilled with a fake `request_id` + a completed result, so generation completes
 *    end-to-end without a real key or network.
 *  - The MuAPI result URL is fulfilled with a tiny PNG so the gallery `<img>` renders.
 *
 * NOTE: the production client's `extractImageUrl` only accepts http(s) / data:image URLs,
 * so the mocked result uses a plain `https://` URL.
 */

const FAKE_KEY = 'e2e-fake-muapi-key';
const FAKE_IMAGE_URL = 'https://example.com/thumbnail.png';
const BASE = 'http://localhost:3111';

test.describe('Thumbnail Studio (mocked MuAPI, mocked auth)', () => {
  test.beforeEach(async ({ context, page }) => {
    // Bypass Clerk auth in dev (middleware.js honours this cookie).
    await context.addCookies([
      { name: '__e2e_auth_bypass', value: '1', url: BASE },
    ]);
    // Seed a fake MuAPI key so getImageClient() has something to use.
    await page.addInitScript((key) => {
      localStorage.setItem('muapi_key', key);
    }, FAKE_KEY);
  });

  test('renders the studio, generates a thumbnail, and shows it in the My gallery', async ({
    page,
  }) => {
    // Specific MuAPI routes first (first match wins); catch-all after.
    await page.route('**/api.muapi.ai/api/v1/flux-dev', async (route) => {
      const req = route.request();
      expect(req.method()).toBe('POST');
      expect(req.headers()['x-api-key']).toBe(FAKE_KEY);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ request_id: 'fake-request-1' }),
      });
    });

    await page.route('**/api.muapi.ai/api/v1/predictions/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'completed', url: FAKE_IMAGE_URL }),
      });
    });

    await page.route('**/api.muapi.ai/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ balance: 0 }),
      });
    });

    // Fulfill the returned image URL with a real (tiny) PNG so the <img> renders.
    await page.route(FAKE_IMAGE_URL, async (route) => {
      const png =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(png, 'base64'),
      });
    });

    await page.goto('/studio/thumbnail-studio');

    // The heading and generate form render without needing a real key.
    await expect(page.getByText('Thumbnail Studio')).toBeVisible();
    const promptBox = page.getByPlaceholder(/dramatic gaming thumbnail/i);
    await expect(promptBox).toBeVisible();

    // Drive generation: type a prompt and click Generate.
    await promptBox.fill('A dramatic gaming thumbnail with a shocked face');
    await page.getByRole('button', { name: /generate thumbnail/i }).click();

    // The generated image should land in the "My" gallery (the studio auto-switches
    // to the mine tab on completion).
    const galleryImage = page.locator(`img[src="${FAKE_IMAGE_URL}"]`);
    await expect(galleryImage).toBeVisible({ timeout: 30_000 });

    await expect(page.getByRole('button', { name: /mine/i })).toBeVisible();
  });
});
