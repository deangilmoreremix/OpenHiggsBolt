import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { mintClerkSession, installClerkAuth } from './fixtures/clerkSession';

/**
 * P3-F — the Personalize trigger in the five NEWLY-WIRED studios, in a real
 * browser.
 *
 * Phase 2 wired ten studios through `components/StandaloneShell.js`, which
 * mounts `DemoPersonalizeProvider` once around every studio tab. Five studios
 * are rendered OUTSIDE that shell and had no provider and no trigger:
 *
 *   1. Brand Studio  — `/brand/[id]` (Brand DNA; provider mounted once in
 *      `app/(brand-studio)/layout.tsx`, trigger next to the header actions,
 *      personalizing the brand screenshot)
 *   2. Photo Studio  — `/photo-studio` (same layout provider; trigger in the
 *      header row, personalizing the newest generated product photo)
 *   3. Academy       — `/academy` (provider + trigger in `app/academy/page.tsx`,
 *      personalizing the first bundled example media of the course manifest)
 *   4. VFX Studio    — `/studio/vfx-studio` (inside StandaloneShell, which
 *      already provides the provider; the trigger arrives through a
 *      `renderPersonalizeAction` render prop passed to VFXStudio → VFXGenerate)
 *   5. Thumbnail Studio — `/studio/thumbnail-studio` (same shell provider;
 *      trigger passed to ThumbnailStudio through the render prop)
 *
 * This spec proves:
 *
 *   1. the STRUCTURAL invariant: every trigger has exactly ONE
 *      `DemoPersonalizeProvider` render-tree ancestor (the standalone script
 *      `e2e/structural-studio-provider-ancestors.mjs` runs as the evidence),
 *   2. each of the five studios SHOWS a "Personalize" trigger, and
 *   3. clicking it opens the shared Personalization Modal carrying exactly
 *      the media the studio was showing.
 *
 * HOW EACH STUDIO GETS ITS MEDIA
 * ------------------------------
 * The trigger renders nothing without source media (`PersonalizeStep`
 * requires `options.media.url`), so each test seeds the studio's own
 * persisted state (localStorage) or stubs its own data endpoint:
 *   - VFX Studio reads its UI state from `vfx_ui_state`;
 *   - Thumbnail Studio reads its local gallery from `thumbnail_studio_local`;
 *   - Photo Studio fetches its history from `/api/photo-studio?brand_id=…`
 *     (the history loads once a brand is selected from `/api/brands`);
 *   - Brand DNA fetches the brand from `/api/brand?id=…`;
 *   - Academy ships its example media manifest in the bundle.
 * The media URL is a REAL asset the app itself serves (a jpeg), so the modal
 * loads actual bytes.
 *
 * AUTH
 * ----
 * `/studio(.*)` and `/vfx(.*)` are Clerk-gated by middleware, and the
 * entitlement gate only opens for a paid, signed-in client. Every runtime
 * test therefore signs in through Clerk's own UI (`@clerk/testing`'s
 * `clerk.signIn`) and stubs `/api/access/resolve` to `paid`, so the gate opens
 * deterministically without a live Supabase entitlement row.
 *
 * REQUIREMENTS
 * ------------
 * A server must already be listening on http://localhost:3111 — the Playwright
 * config's own `webServer` reuses an existing server:
 *
 *     npx next start --port 3111   (or an already-running server)
 */

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3111';

/** The Clerk user the e2e run signs in as (the repo's shared demo user). */
const CLERK_TEST_EMAIL = 'smartvideo-demo+clerk_test@videoremix.vip';

/** A REAL jpeg the app itself serves — the source media for every studio. */
const IMAGE_MEDIA_URL = '/thumbnails/seed-ai-1.jpeg';

/** The first bundled example media of the Academy manifest (a real asset). */
const ACADEMY_MEDIA_URL = '/academy/02-ai-filmmaking/templates/examples/astronaut-anchor.jpg';
const ACADEMY_MEDIA_TITLE = 'AI Filmmaking example media';

const REPO_ROOT = process.cwd();

/** `clerkSetup()` fetches the testing token once per worker. */
let clerkSetupPromise: Promise<void> | null = null;
function ensureClerkSetup(): Promise<void> {
  if (!clerkSetupPromise) clerkSetupPromise = clerkSetup({ dotenv: true });
  return clerkSetupPromise;
}

/**
 * Stubs the network the studio pages touch on mount.
 *
 * `/api/access/resolve` is answered with `paid` so the Personalization Modal
 * opens instead of the Upgrade Modal. The MuAPI/keys endpoints are answered
 * with empty payloads so a run never waits on the real network.
 */
async function stubStudioNetwork(page: Page): Promise<void> {
  await page.route('**/api/access/resolve', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'paid',
        access: {
          clerkUserId: 'e2e-paid',
          email: 'e2e-paid@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'manual',
          hasSmartVideoGo: true,
        },
      }),
    }),
  );

  await page.route(/\/api\/auth\/muapi-key/, (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ key: 'e2e-fake-muapi-key', openaiKey: 'e2e-fake-openai-key' }),
        })
      : route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );

  await page.route('**/api.muapi.ai/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
  );

  // The modal's project-restore fetch (P3-A's persistence layer). Without
  // this stub the restore races the "Advanced Editing" click in
  // expectModalWithMedia: the restore's late settle applies the stored
  // (simple) view mode and silently reverts the click. Stubbed, the restore
  // settles instantly and the click lands after it — the same order a fast
  // production round-trip produces.
  await page.route(/\/api\/personalization\/project/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ projects: [], sourceFilter: 'not-requested' }),
    }),
  );
}

/** Seeds a localStorage key before the page's scripts run. */
async function seedLocalStorage(page: Page, key: string, value: unknown): Promise<void> {
  await page.addInitScript(
    ({ k, v }: { k: string; v: unknown }) => {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        /* private mode / storage disabled — the studio then shows no media */
      }
    },
    { k: key, v: value },
  );
}

/**
 * Signs the browser in through Clerk's own sign-in flow (same pattern as the
 * Phase 2 studio hand-off spec).
 */
async function signIn(page: Page): Promise<void> {
  await ensureClerkSetup();

  const session = await mintClerkSession();
  await installClerkAuth(page.context(), page, session, BASE);

  await page.goto(`${BASE}/sign-in`, { waitUntil: 'domcontentloaded' });
  await clerk.signIn({ page, emailAddress: CLERK_TEST_EMAIL });
}

/** The Personalization Modal, identified the way the product identifies it. */
function personalizationModal(page: Page) {
  return page.locator('[role="dialog"][aria-labelledby="personalize-title"]');
}

/** A short description of what the page shows, for failure messages. */
async function describePage(page: Page): Promise<string> {
  return page
    .evaluate(() => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).map(
        (node) => (node.getAttribute('aria-labelledby') ?? 'unlabelled') as string,
      );
      const headings = Array.from(document.querySelectorAll('h1,h2,h3'))
        .map((node) => (node.textContent ?? '').trim())
        .filter(Boolean)
        .slice(0, 12);
      return `dialogs=[${dialogs.join(', ')}] headings=[${headings.join(' | ')}]`;
    })
    .catch(() => 'the page could not be inspected');
}

/** Asserts the Personalization Modal is open AND carries the studio's media. */
async function expectModalWithMedia(page: Page, mediaUrl: string, title: string): Promise<void> {
  const modal = personalizationModal(page);
  try {
    await expect(modal).toBeVisible({ timeout: 30_000 });
  } catch (error) {
    throw new Error(`the Personalization Modal did not open.\npage: ${await describePage(page)}`);
  }
  await expect(modal.locator('[aria-label="Close personalization modal"]')).toBeVisible();

  // Switch the modal to the advanced view, where the "Source Demo" panel
  // shows the source media the studio handed over.
  //
  // RACE (documented): the provider's project-restore effect settles shortly
  // after the modal opens and re-applies the STORED view mode, which can
  // revert an "Advanced Editing" click that landed inside that window (the
  // provider itself declares the view mode "a session preference" and does
  // not reset it on open — the restore path can still re-apply it late).
  // The assertion below is NOT weakened: "Source Demo" must appear. If the
  // provider reverted the toggle, the click is simply repeated until the
  // advanced view sticks.
  const advanced = modal.getByRole('button', { name: 'Advanced Editing' });
  await expect(async () => {
    if (await advanced.count()) {
      await advanced.click();
    }
    await expect(modal.getByText('Source Demo', { exact: true })).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  const media = modal.locator(`[src="${mediaUrl}"]`);
  await expect(media.first(), 'the modal does not carry the studio media').toBeAttached();

  await expect(modal.getByText(title, { exact: true }).first()).toBeVisible();
}

test.describe('Phase 3 — Personalize trigger in the five newly-wired studios', () => {
  test('the structural invariant: exactly ONE DemoPersonalizeProvider ancestor per trigger', async () => {
    // The standalone script is the evidence: it walks each trigger's
    // hand-verified ancestor chain, counts the provider mounts per node,
    // proves the app-root wiring, the cross-package invariant and P3-B's
    // z-index preservation, and exits non-zero on any violation.
    const stdout = execFileSync('node', ['e2e/structural-studio-provider-ancestors.mjs'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // eslint-disable-next-line no-console
    console.log(stdout);
    expect(stdout).toContain('ALL CHECKS PASSED');
  });

  test('VFX Studio shows a Personalize trigger for its source image and hands that image to the modal', async ({
    page,
  }) => {
    test.setTimeout(240_000);

    await page.addInitScript(() => {
      try {
        localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
        localStorage.setItem('openai_key', 'e2e-fake-openai-key');
      } catch {
        /* ignore */
      }
    });
    await stubStudioNetwork(page);
    // VFX Studio persists its own UI state — the exact state a real upload
    // leaves behind (imageUrl + prompt + aspect ratio).
    await seedLocalStorage(page, 'vfx_ui_state', {
      activeCategory: 'ai-effects',
      selectedEffectId: 'kiss-me-ai',
      imageUrl: IMAGE_MEDIA_URL,
      prompt: 'e2e vfx source image',
      aspectRatio: '16:9',
      resolution: '480p',
      duration: 5,
      quality: 'medium',
    });

    await signIn(page);

    const accessResolved = page.waitForResponse('**/api/access/resolve', { timeout: 60_000 });
    await page.goto(`${BASE}/studio/vfx-studio`, { waitUntil: 'domcontentloaded' });
    await accessResolved;

    // The studio rendered its source image from the persisted upload state.
    const studioImage = page.locator(`img[src="${IMAGE_MEDIA_URL}"]`);
    await expect(studioImage.first(), 'VFX Studio did not render its source image').toBeAttached();

    const trigger = page.getByRole('button', { name: 'Personalize', exact: true });
    await expect(trigger, 'VFX Studio renders no Personalize trigger').toBeVisible();

    await trigger.first().click();

    await expectModalWithMedia(page, IMAGE_MEDIA_URL, 'Kiss Me AI image');

    // eslint-disable-next-line no-console
    console.log(
      'P3-F: vfx-studio hand-off:',
      JSON.stringify({ studio: 'vfx-studio', mediaUrl: IMAGE_MEDIA_URL, title: 'Kiss Me AI image' }),
    );
  });

  test('Thumbnail Studio shows a Personalize trigger for its newest image and hands that image to the modal', async ({
    page,
  }) => {
    test.setTimeout(240_000);

    await page.addInitScript(() => {
      try {
        localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
        localStorage.setItem('openai_key', 'e2e-fake-openai-key');
      } catch {
        /* ignore */
      }
    });
    await stubStudioNetwork(page);
    // Thumbnail Studio persists its local gallery — the exact state a real
    // generation leaves behind.
    await seedLocalStorage(page, 'thumbnail_studio_local', [
      {
        id: 'e2e-thumb-1',
        url: IMAGE_MEDIA_URL,
        prompt: 'e2e thumbnail source image',
        model: 'gpt-image-2',
        quality: 'medium',
        format: 'jpeg',
        style: 'cinematic',
        aspectRatio: '1:1',
        width: 1024,
        height: 1024,
        isPublic: true,
        sessionId: 'e2e-session',
        createdAt: '2026-10-21T00:00:00.000Z',
      },
    ]);

    await signIn(page);

    const accessResolved = page.waitForResponse('**/api/access/resolve', { timeout: 60_000 });
    await page.goto(`${BASE}/studio/thumbnail-studio`, { waitUntil: 'domcontentloaded' });
    await accessResolved;

    const trigger = page.getByRole('button', { name: 'Personalize', exact: true });
    await expect(trigger, 'Thumbnail Studio renders no Personalize trigger').toBeVisible();

    await trigger.first().click();

    await expectModalWithMedia(page, IMAGE_MEDIA_URL, 'My thumbnail');

    // eslint-disable-next-line no-console
    console.log(
      'P3-F: thumbnail-studio hand-off:',
      JSON.stringify({ studio: 'thumbnail-studio', mediaUrl: IMAGE_MEDIA_URL, title: 'My thumbnail' }),
    );
  });

  test('Photo Studio shows a Personalize trigger for its newest product photo and hands that photo to the modal', async ({
    page,
  }) => {
    test.setTimeout(240_000);

    await page.addInitScript(() => {
      try {
        localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
        localStorage.setItem('openai_key', 'e2e-fake-openai-key');
      } catch {
        /* ignore */
      }
    });
    await stubStudioNetwork(page);
    // The brand list the header select reads; the history that loads once a
    // brand is selected.
    await page.route('**/api/brands', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 'e2e-brand-1', brand_name: 'E2E Brand', url: 'https://e2e-brand.example.com' }],
        }),
      }),
    );
    await page.route(/\/api\/photo-studio\?brand_id=/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'e2e-photo-1',
              image_url: IMAGE_MEDIA_URL,
              style: 'Studio White',
              category: 'E-commerce',
            },
          ],
        }),
      }),
    );

    await signIn(page);

    await page.goto(`${BASE}/photo-studio`, { waitUntil: 'domcontentloaded' });
    // The Personalize trigger is entitlement-gated (requireEntitlement opens
    // the UpgradeModal instead when access has not resolved to 'paid' yet),
    // so the click must wait until the access state actually resolved.
    await page.waitForResponse('**/api/access/resolve', { timeout: 60_000 });

    // The history only loads once a brand is selected — the page's own flow.
    await page.locator('select').first().selectOption('e2e-brand-1');

    const studioImage = page.locator(`img[src="${IMAGE_MEDIA_URL}"]`);
    await expect(studioImage.first(), 'Photo Studio did not render its product photo').toBeAttached();

    const trigger = page.getByRole('button', { name: 'Personalize', exact: true });
    await expect(trigger, 'Photo Studio renders no Personalize trigger').toBeVisible();

    await trigger.first().click();

    await expectModalWithMedia(page, IMAGE_MEDIA_URL, 'Studio White');

    // eslint-disable-next-line no-console
    console.log(
      'P3-F: photo-studio hand-off:',
      JSON.stringify({ studio: 'photo-studio', mediaUrl: IMAGE_MEDIA_URL, title: 'Studio White' }),
    );
  });

  test('Brand Studio (Brand DNA) shows a Personalize trigger for its brand screenshot and hands it to the modal', async ({
    page,
  }) => {
    test.setTimeout(240_000);

    await page.addInitScript(() => {
      try {
        localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
        localStorage.setItem('openai_key', 'e2e-fake-openai-key');
      } catch {
        /* ignore */
      }
    });
    await stubStudioNetwork(page);
    await page.route('**/api/brands', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      }),
    );
    await page.route(/\/api\/brand\?id=/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'e2e-brand-1',
          url: 'https://e2e-brand.example.com',
          brand_name: 'E2E Brand',
          industry: 'E2E',
          tagline: 'E2E brand tagline',
          value_proposition: 'E2E value proposition',
          target_audience: 'E2E audience',
          tone_of_voice: 'confident',
          brand_personality: 'bold',
          key_messages: 'E2E key message',
          primary_colors: '#22d3ee',
          secondary_colors: '#a855f7',
          fonts: 'Inter',
          imagery_style: 'cinematic',
          layout_style: 'grid',
          logo_url: '',
          screenshot_url: IMAGE_MEDIA_URL,
        }),
      }),
    );

    await signIn(page);

    await page.goto(`${BASE}/brand/e2e-brand-1`, { waitUntil: 'domcontentloaded' });
    // Entitlement gate — see the photo-studio note.
    await page.waitForResponse('**/api/access/resolve', { timeout: 60_000 });

    // The brand (and its screenshot) rendered from the fetched Brand DNA.
    const screenshot = page.locator(`img[src="${IMAGE_MEDIA_URL}"]`);
    await expect(screenshot.first(), 'Brand Studio did not render its brand screenshot').toBeAttached();

    const trigger = page.getByRole('button', { name: 'Personalize', exact: true });
    await expect(trigger, 'Brand Studio renders no Personalize trigger').toBeVisible();

    await trigger.first().click();

    await expectModalWithMedia(page, IMAGE_MEDIA_URL, 'E2E Brand Brand DNA');

    // eslint-disable-next-line no-console
    console.log(
      'P3-F: brand-studio hand-off:',
      JSON.stringify({ studio: 'brand-studio', mediaUrl: IMAGE_MEDIA_URL, title: 'E2E Brand Brand DNA' }),
    );
  });

  test('Academy shows a Personalize trigger for its bundled example media and hands it to the modal', async ({
    page,
  }) => {
    test.setTimeout(240_000);

    await page.addInitScript(() => {
      try {
        localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
        localStorage.setItem('openai_key', 'e2e-fake-openai-key');
      } catch {
        /* ignore */
      }
    });
    await stubStudioNetwork(page);

    await signIn(page);

    await page.goto(`${BASE}/academy`, { waitUntil: 'domcontentloaded' });
    // Entitlement gate — see the photo-studio note.
    await page.waitForResponse('**/api/access/resolve', { timeout: 60_000 });

    const trigger = page.getByRole('button', { name: 'Personalize', exact: true });
    await expect(trigger, 'Academy renders no Personalize trigger').toBeVisible();

    await trigger.first().click();

    await expectModalWithMedia(page, ACADEMY_MEDIA_URL, ACADEMY_MEDIA_TITLE);

    // eslint-disable-next-line no-console
    console.log(
      'P3-F: academy hand-off:',
      JSON.stringify({ studio: 'academy', mediaUrl: ACADEMY_MEDIA_URL, title: ACADEMY_MEDIA_TITLE }),
    );
  });
});
