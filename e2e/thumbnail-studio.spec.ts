import { test, expect } from '@playwright/test';
import { clerkSetup, clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

/**
 * Thumbnail Studio smoke test (mocked MuAPI).
 *
 * This spec exercises the real UI at `/studio/thumbnail-studio` but NEVER touches
 * the live MuAPI API. Every `https://api.muapi.ai/**` request is intercepted with
 * `page.route` and fulfilled with a fake `request_id` + a fake completed result, so
 * generation completes end-to-end without a real key or network.
 *
 * NOTE on the mocked image URL: the production client's `extractImageUrl` helper only
 * accepts URLs that start with `http(s)` (see src/shared/api/muapiImage.ts). A `data:`
 * URL would be silently discarded, so we return a plain `https://` URL here. If you
 * change the mocked result to a `data:` URL, the gallery assertion would fail until
 * that helper is extended to accept non-http URLs.
 *
 * AUTH: `/studio/*` is Clerk-protected (middleware.js). We sign in with the same
 * `@clerk/testing` token pattern used by e2e/auth.spec.ts. If `E2E_TEST_EMAIL` is not
 * configured the test is skipped. We do not fake or bypass auth — if Clerk sign-in
 * cannot complete in the environment, this test will fail at sign-in (not silently
 * pass), which is the intended, honest behavior.
 */

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const FAKE_KEY = 'e2e-fake-muapi-key';
const FAKE_IMAGE_URL = 'https://example.com/thumbnail.png';

test.beforeAll(async () => {
  await clerkSetup();
});

test.describe('Thumbnail Studio (mocked MuAPI)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!email, 'No E2E test credentials configured (set E2E_TEST_EMAIL)');
    // Establish a Clerk session via the testing token so the protected studio renders.
    await setupClerkTestingToken({ page });
    await page.goto('/');
    await clerk.signIn({ page, emailAddress: email, password });
  });

  test('renders the studio, generates a thumbnail, and shows it in the My gallery', async ({
    page,
  }) => {
    // Seed a fake MuAPI key so the studio's getImageClient() has something to use.
    // Registered before navigation so it is present when StandaloneShell mounts.
    await page.addInitScript((key) => {
      localStorage.setItem('muapi_key', key);
    }, FAKE_KEY);

    // Intercept all MuAPI traffic. Specific routes first (first match wins); the
    // catch-all fulfills any other muapi.ai call (e.g. balance) so we stay offline.
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

    // Fulfill the returned image URL with a real (tiny) PNG so the <img> actually
    // renders instead of 404-ing in the gallery.
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

    // The My tab should now reflect at least one image (count badge or the image).
    await expect(page.getByRole('button', { name: /mine/i })).toBeVisible();
  });
});
