/**
 * Release smoke — customer workflows that must work before a production release.
 *
 * Two targets, both configurable so the same spec runs locally or against a
 * Netlify preview:
 *
 *   RELEASE_SMOKE_BASE_URL    anonymous / public surface (production build).
 *                             Default: the Playwright config baseURL.
 *   RELEASE_SMOKE_STUDIO_URL  a server whose /studio is reachable for the test
 *                             browser (a local dev server honouring the
 *                             `__e2e_auth_bypass` cookie, or a preview with a
 *                             Clerk storage state). Unset → studio tests skip.
 *   RELEASE_SMOKE_STORAGE_STATE  optional Clerk storage state for the studio
 *                             target when it is not a local dev server.
 *   RELEASE_SMOKE_SCREENSHOTS directory for evidence screenshots (optional).
 *   RELEASE_SMOKE_PLACEHOLDER_CLERK=1  local builds that use a placeholder
 *                             Clerk dev key: pre-set the signed-out cookies so
 *                             Clerk does not redirect to its handshake.
 *
 * Paid generation is NEVER called: every MuAPI request in the studio tests is
 * answered by `page.route` and those tests are labelled MOCKED. The free
 * Business Asset Finder test mocks only the discovery payload; the routing,
 * access mode and UI are real.
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.RELEASE_SMOKE_BASE_URL || '';
const STUDIO = process.env.RELEASE_SMOKE_STUDIO_URL || '';
const STORAGE_STATE = process.env.RELEASE_SMOKE_STORAGE_STATE || '';
const SHOTS = process.env.RELEASE_SMOKE_SCREENSHOTS || '';
const PLACEHOLDER_CLERK = process.env.RELEASE_SMOKE_PLACEHOLDER_CLERK === '1';

const FAKE_MUAPI_KEY = 'e2e-fake-muapi-key';
const OUTPUT_VIDEO = '/media/minimax-h3/videos/luxury-perfume-commercial.webm';

/** Text that only appears when a paid entitlement gate fires. */
const UPGRADE_COPY = /Unlock SmartVideo GO AI|Get SmartVideo GO AI|upgrade required|PAYMENT_REQUIRED/i;

function urlFor(base: string, route: string): string {
  return base ? new URL(route, base).toString() : route;
}

async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

async function prepareContext(context: BrowserContext, origin: string, bypass: boolean) {
  const host = new URL(origin || 'http://localhost').hostname;
  const cookies: Array<{ name: string; value: string }> = [];
  if (PLACEHOLDER_CLERK) {
    cookies.push({ name: '__client_uat', value: '0' }, { name: '__clerk_db_jwt', value: 'dvb_placeholder' });
  }
  if (bypass) cookies.push({ name: '__e2e_auth_bypass', value: '1' });
  if (cookies.length) {
    await context.addCookies(cookies.map((c) => ({ ...c, domain: host, path: '/' })));
  }
}

/** Collects uncaught page errors; console noise from blocked third parties is ignored. */
function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    // A placeholder Clerk key points at a non-existent Clerk frontend, so its
    // script can never load there; that is the test setup, not the app.
    if (PLACEHOLDER_CLERK && /failed_to_load_clerk_js/.test(err.message)) return;
    errors.push(err.message);
  });
  return errors;
}

// ---------------------------------------------------------------------------
// Public surface (anonymous visitor)
// ---------------------------------------------------------------------------

test.describe('public surface', () => {
  test.beforeEach(async ({ context }) => {
    await prepareContext(context, BASE, false);
  });

  test('landing page renders without fatal errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    const res = await page.goto(urlFor(BASE, '/'), { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/SmartVideo/i);
    await page.waitForTimeout(1500);
    await shot(page, '01-landing');
    expect(errors).toEqual([]);
  });

  test('personalization demo renders without fatal errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    const res = await page.goto(urlFor(BASE, '/personalization-demo'), { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    await page.waitForTimeout(1500);
    await shot(page, '02-personalization-demo');
    expect(errors).toEqual([]);
  });

  test('studio requires sign-in for an anonymous visitor', async ({ page }) => {
    await page.goto(urlFor(BASE, '/studio/video'), { waitUntil: 'domcontentloaded' });
    expect(new URL(page.url()).pathname).toMatch(/^\/sign-in/);
  });

  test('the dev auth-bypass cookie is ignored by a production build', async ({ context, page }) => {
    await prepareContext(context, BASE, true);
    await page.goto(urlFor(BASE, '/studio/video'), { waitUntil: 'domcontentloaded' });
    expect(new URL(page.url()).pathname).toMatch(/^\/sign-in/);
  });

  test('free Business Asset Finder: anonymous visitor discovers and reviews assets without billing (discovery payload MOCKED)', async ({ page }) => {
    const errors = trackPageErrors(page);
    const gatedResponses: string[] = [];
    page.on('response', (r) => {
      if ([402, 403].includes(r.status()) && r.url().includes('/api/')) gatedResponses.push(`${r.status()} ${r.url()}`);
    });

    let discoverBody: Record<string, unknown> | null = null;
    await page.route('**/api/demo/discover', async (route) => {
      discoverBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          url: 'https://acme-roofing.example',
          title: 'Acme Roofing',
          description: 'Residential roofing',
          logo: urlFor(BASE, '/banner.png'),
          assets: [
            { kind: 'logo', url: urlFor(BASE, '/banner.png'), source: 'og' },
            { kind: 'photo', url: urlFor(BASE, '/banner.png?team'), source: 'img' },
          ],
        }),
      });
    });

    await page.goto(urlFor(BASE, '/demo'), { waitUntil: 'domcontentloaded' });
    const website = page.getByPlaceholder('https://yourbusiness.com');
    await expect(website).toBeVisible({ timeout: 60_000 });
    await website.fill('https://acme-roofing.example');
    await page.getByRole('button', { name: /find my brand/i }).click();

    await expect.poll(() => discoverBody, { timeout: 30_000 }).not.toBeNull();
    expect(discoverBody).toMatchObject({ websiteUrl: 'https://acme-roofing.example' });
    // The reviewable asset list is shown (the same UI the paid pipeline uses).
    await expect(page.locator('img[src*="banner.png"]').first()).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(500);
    await shot(page, '03-free-asset-discovery');

    await expect(page.locator('body')).not.toContainText(UPGRADE_COPY);
    expect(gatedResponses).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('free Business Asset Finder endpoints are never payment-gated (real handlers)', async ({ request }) => {
    const calls: Array<[string, Record<string, unknown>]> = [
      ['/api/demo/discover', { websiteUrl: 'not a url' }],
      ['/api/personalization/find-businesses', {}],
      ['/api/personalization/research-business', {}],
      ['/api/personalization/discover-assets', {}],
    ];
    for (const [route, body] of calls) {
      const res = await request.post(urlFor(BASE, route), { data: body });
      expect(res.status(), route).not.toBe(404);
      expect([401, 402, 403], route).not.toContain(res.status());
    }
  });

  test('landing and demo fit a phone viewport without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ['/', '/demo']) {
      await page.goto(urlFor(BASE, route), { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, route).toBeLessThanOrEqual(1);
    }
    await shot(page, '04-demo-mobile');
  });

  test('local demo media plays in the browser', async ({ page }) => {
    await page.goto(urlFor(BASE, '/'), { waitUntil: 'domcontentloaded' });
    const played = await page.evaluate(async (src) => {
      const v = document.createElement('video');
      v.muted = true;
      v.src = src;
      document.body.appendChild(v);
      try {
        await v.play();
        await new Promise((r) => setTimeout(r, 1200));
        return { currentTime: v.currentTime, readyState: v.readyState, error: v.error?.code ?? null };
      } catch (e) {
        return { currentTime: 0, readyState: v.readyState, error: String(e) };
      }
    }, urlFor(BASE, OUTPUT_VIDEO));
    expect(played.error).toBeNull();
    expect(played.currentTime).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Studio workflows (authenticated surface; every MuAPI call MOCKED)
// ---------------------------------------------------------------------------

test.describe('studio workflows (MuAPI MOCKED)', () => {
  test.skip(!STUDIO, 'RELEASE_SMOKE_STUDIO_URL not set: the studio needs an authenticated session');
  if (STORAGE_STATE) test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ context, page }) => {
    const local = /localhost|127\.0\.0\.1/.test(STUDIO);
    await prepareContext(context, STUDIO, local);
    await page.route('**/api/auth/muapi-key', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ key: FAKE_MUAPI_KEY, openaiKey: null }),
      }),
    );
  });

  async function openVideoStudio(page: Page) {
    await page.goto(urlFor(STUDIO, '/studio/video'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible({ timeout: 120_000 });
  }

  test('video model catalog: categories, search and selection', async ({ page }) => {
    const errors = trackPageErrors(page);
    await openVideoStudio(page);
    const picker = page.getByRole('button', { name: /Seedance 1\.0 Lite/ });
    await picker.click();
    for (const tab of ['All', 'Text to Video', 'Image to Video', 'Video Tools']) {
      await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible();
    }
    await page.getByPlaceholder('Search models...').fill('Kling');
    const kling = page.getByRole('button', { name: /^Kling/ }).first();
    await expect(kling).toBeVisible();
    const chosen = (await kling.innerText()).split('\n')[0].trim();
    await kling.click();
    await expect(page.getByRole('button', { name: new RegExp(chosen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()).toBeVisible();
    await shot(page, '05-video-model-selected');
    expect(errors).toEqual([]);
  });

  test('video input modes expose the matching media controls', async ({ page }) => {
    const errors = trackPageErrors(page);
    await openVideoStudio(page);
    const modeButton = () => page.getByRole('button', { name: /^(From prompt|Animate image|Start & end frames|Use references)$/ }).first();

    await modeButton().click();
    await page.getByRole('menuitemradio', { name: /^Animate image/ }).click();
    await expect(page.locator('input[type=file]').first()).toBeAttached();
    await shot(page, '06-mode-animate-image');

    await modeButton().click();
    await page.getByRole('menuitemradio', { name: /^Start & end frames/ }).click();
    await expect(page.locator('body')).toContainText(/end frame|last frame|end image/i);
    await shot(page, '07-mode-start-end');

    await modeButton().click();
    await page.getByRole('menuitemradio', { name: /^Use references/ }).click();
    await expect(page.locator('body')).toContainText(/reference/i);
    expect(errors).toEqual([]);
  });

  test('text-to-video sends the prompt/model payload and renders the result (MOCKED)', async ({ page }) => {
    const errors = trackPageErrors(page);
    const submitted: Array<{ url: string; body: Record<string, unknown>; apiKey: string | null }> = [];
    let polls = 0;
    await page.route('**/api/api/v1/**', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        submitted.push({ url: req.url(), body: req.postDataJSON(), apiKey: req.headers()['x-api-key'] ?? null });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ request_id: 'req_smoke_1' }) });
      }
      if (req.url().includes('/predictions/req_smoke_1/result')) {
        polls += 1;
        // First poll is a transient 5xx: the client must retry, not fail.
        if (polls === 1) return route.fulfill({ status: 503, body: 'busy' });
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'completed', outputs: [urlFor(STUDIO, OUTPUT_VIDEO)] }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await openVideoStudio(page);
    await page.getByPlaceholder('Describe the video you want to create').fill('A drone shot over a red barn at sunrise');
    await page.getByRole('button', { name: 'Generate' }).click();

    await expect.poll(() => submitted.length, { timeout: 30_000 }).toBeGreaterThan(0);
    expect(submitted[0].body).toMatchObject({ prompt: 'A drone shot over a red barn at sunrise' });
    expect(submitted[0].apiKey).toBe(FAKE_MUAPI_KEY);
    await expect(page.locator(`video[src*="${OUTPUT_VIDEO}"]`).first()).toBeAttached({ timeout: 60_000 });
    expect(polls).toBeGreaterThanOrEqual(2);
    await shot(page, '08-t2v-result');
    expect(errors).toEqual([]);
  });

  test('a failed generation surfaces an error instead of hanging (MOCKED)', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.route('**/api/api/v1/**', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ request_id: 'req_smoke_fail' }) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'failed', error: 'content policy violation (mocked)' }),
      });
    });
    await openVideoStudio(page);
    await page.getByPlaceholder('Describe the video you want to create').fill('failure path');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.locator('body')).toContainText(/content policy violation \(mocked\)|generation failed/i, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Generate' })).toBeEnabled({ timeout: 30_000 });
    await shot(page, '09-t2v-failure');
    expect(errors).toEqual([]);
  });

  test('a generation keeps running in the background and notifies on completion (MOCKED)', async ({ page }) => {
    const errors = trackPageErrors(page);
    let release = false;
    await page.route('**/api/api/v1/**', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ request_id: 'req_bg_1' }) });
      }
      const body = release
        ? { status: 'completed', outputs: [urlFor(STUDIO, OUTPUT_VIDEO)] }
        : { status: 'processing' };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    await openVideoStudio(page);
    await page.getByPlaceholder('Describe the video you want to create').fill('background generation');
    await page.getByRole('button', { name: 'Generate' }).click();
    const activity = page.locator('[data-testid="generation-activity"][data-generation-tab="video"]');
    await expect(activity).toContainText('Video Studio is generating', { timeout: 30_000 });

    // Leave the studio while the job is still running.
    await page.getByRole('button', { name: 'Image Studio', exact: true }).first().click();
    await expect(page).toHaveURL(/\/studio\/image/);
    await expect(activity).toBeVisible();
    await shot(page, '10-background-generation-activity');

    release = true;
    const toast = page.locator('[data-notification-type="success"][data-notification-tab="video"]');
    await expect(toast).toContainText('Video Studio', { timeout: 30_000 });
    await expect(activity).toHaveCount(0);
    await shot(page, '11-generation-complete-toast');

    await toast.getByRole('button', { name: 'Open Video Studio result' }).click();
    await expect(page).toHaveURL(/\/studio\/video/);
    await expect(page.locator(`video[src*="${OUTPUT_VIDEO}"]`).first()).toBeAttached({ timeout: 30_000 });
    expect(errors).toEqual([]);
  });

  test('switching studios keeps unsaved studio state; back/forward follow the URL', async ({ page }) => {
    const errors = trackPageErrors(page);
    await openVideoStudio(page);
    const prompt = page.getByPlaceholder('Describe the video you want to create');
    await prompt.fill('unsaved draft prompt');
    await page.getByRole('button', { name: 'Image Studio', exact: true }).first().click();
    await expect(page).toHaveURL(/\/studio\/image$/);
    await expect(prompt).toBeHidden();

    await page.goBack();
    await expect(page).toHaveURL(/\/studio\/video$/);
    await expect(prompt).toBeVisible();
    await expect(prompt).toHaveValue('unsaved draft prompt');

    await page.goForward();
    await expect(page).toHaveURL(/\/studio\/image$/);
    await expect(prompt).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('a failed generation raises an error notification (MOCKED)', async ({ page }) => {
    await page.route('**/api/api/v1/**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ request_id: 'req_bg_fail' }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'failed', error: 'mocked provider outage' }) });
    });
    await openVideoStudio(page);
    await page.getByPlaceholder('Describe the video you want to create').fill('failure notification');
    await page.getByRole('button', { name: 'Generate' }).click();
    const toast = page.locator('[data-notification-type="error"][data-notification-tab="video"]');
    await expect(toast).toContainText('mocked provider outage', { timeout: 30_000 });
    await toast.getByRole('button', { name: 'Dismiss notification' }).click();
    await expect(toast).toHaveCount(0);
  });

  test('every studio tab renders and navigation keeps the shell working', async ({ page }) => {
    const errors = trackPageErrors(page);
    await openVideoStudio(page);
    const tabs = [
      'Image Studio', 'Audio Studio', 'AI Clipping', 'Vibe Motion', 'Motion Control', 'Lip Sync',
      'Cinema Studio', 'Storyboard', 'Marketing Studio', 'Layers Studio', 'Workflows', 'Agents',
      'AI Influencer Studio', 'Video Studio',
    ];
    const failures: string[] = [];
    for (const tab of tabs) {
      await page.getByRole('button', { name: tab, exact: true }).first().click();
      await page.waitForTimeout(1500);
      const text = (await page.locator('main, body').first().innerText()).trim();
      if (text.length < 20 || /Application error|Unhandled Runtime Error/i.test(text)) failures.push(tab);
    }
    expect(failures).toEqual([]);
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('selected video model survives a reload (persisted state)', async ({ page }) => {
    await openVideoStudio(page);
    await page.getByRole('button', { name: /Seedance 1\.0 Lite/ }).click();
    await page.getByPlaceholder('Search models...').fill('Seedance 2.0');
    // Picker entries are named "<provider> <model> <provider>".
    await page.getByRole('button', { name: /Seedance 2\.0 KIE_AI$/ }).first().click();
    await expect(page.getByRole('button', { name: /^Seedance 2\.0/ }).first()).toBeVisible();
    // The studio saves its state on a 500 ms debounce; reload only once it has.
    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.keys(localStorage)
            .filter((k) => k.startsWith('hg_video_studio_persistent'))
            .map((k) => JSON.parse(localStorage.getItem(k) || '{}').selectedModel),
        ),
      )
      .toContain('seedance-2-text-to-video');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole('button', { name: /^Seedance 2\.0/ }).first()).toBeVisible();
  });
});
