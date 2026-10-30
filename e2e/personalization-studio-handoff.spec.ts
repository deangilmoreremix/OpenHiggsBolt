import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { mintClerkSession, installClerkAuth } from './fixtures/clerkSession';

/**
 * Phase 2 — the STUDIO → Personalization Modal hand-off, in a real browser.
 *
 * Ten studios now receive a `renderPersonalizeAction` render prop from
 * `components/StandaloneShell.js` (Video, Image, Clipping, VibeMotion,
 * MotionControl, LipSync, Cinema, Marketing, Recast, AiInfluencer). The app
 * root injects the shared Personalization trigger through it, so the studio
 * package never imports the app's own module (it is published standalone).
 *
 * This spec proves, in a real browser against the production build:
 *
 *   1. the app root really passes `renderPersonalizeAction` to all ten
 *      studios, and every one of those studio components accepts the prop;
 *   2. Video Studio renders a "Personalize" trigger NEXT TO its media
 *      preview, and so does at least one other studio (Image Studio);
 *   3. clicking that trigger opens the shared Personalization Modal with the
 *      STUDIO'S OWN MEDIA pre-loaded — the modal's source media element
 *      carries exactly the media URL the studio was showing.
 *
 * HOW THE STUDIO GETS ITS MEDIA
 * ------------------------------
 * A studio only shows the trigger when it has source media to hand over
 * (`PersonalizeStep` renders nothing without `options.media.url`). The studios
 * persist their uploaded media in localStorage under
 * `hg_<studio>_studio_persistent` — that is the very state a real upload
 * produces — so the spec seeds that state and then drives the real UI. The
 * media URLs are REAL assets served by the app itself (an mp4 and a jpeg), so
 * the studio preview and the modal both load actual bytes.
 *
 * AUTH
 * ----
 * The studio hand-off is gated by the SmartVideo GO entitlement
 * (`useStudioPersonalize` → `requireEntitlement`), exactly like every other
 * studio generate action, and the gate only opens for a SIGNED-IN user. The
 * spec therefore signs in through Clerk's own UI (`@clerk/testing`'s
 * `clerk.signIn`, which uses the Backend API's sign-in ticket) and stubs
 * `/api/access/resolve` to `paid`, so the gate opens deterministically without
 * depending on a live Supabase entitlement row.
 *
 * REQUIREMENTS
 * ------------
 * A production server must already be listening on http://localhost:3111 —
 * the Playwright config's own `webServer` command starts the broken
 * `--turbopack` dev server, so this spec reuses an existing server:
 *
 *     npm run build
 *     npx next start --port 3111
 */

const BASE = 'http://localhost:3111';

/** The Clerk user the e2e run signs in as (the repo's shared demo user). */
const CLERK_TEST_EMAIL = 'smartvideo-demo+clerk_test@videoremix.vip';

/** A REAL mp4 the app itself serves (used as the Video Studio's source clip). */
const VIDEO_MEDIA_URL =
  '/academy/07-ai-product-photography/templates/examples/batch-skincare-grid-clip.mp4';

/** The file name the studio shows for that clip — it becomes the modal title. */
const VIDEO_MEDIA_NAME = 'phase2-e2e-source.mp4';

/** A REAL jpeg the app itself serves (used as the Image Studio's source image). */
const IMAGE_MEDIA_URL = '/thumbnails/seed-ai-1.jpeg';

/** The studios that receive the `renderPersonalizeAction` prop. */
const WIRED_STUDIOS = [
  { component: 'VideoStudio', slug: 'video' },
  { component: 'ImageStudio', slug: 'image' },
  { component: 'ClippingStudio', slug: 'clipping' },
  { component: 'VibeMotionStudio', slug: 'vibe-motion' },
  { component: 'MotionControlStudio', slug: 'motion-control' },
  { component: 'LipSyncStudio', slug: 'lipsync' },
  { component: 'CinemaStudio', slug: 'cinema' },
  { component: 'MarketingStudio', slug: 'marketing' },
  { component: 'RecastStudio', slug: 'recast' },
  { component: 'AiInfluencerStudio', slug: 'ai-influencer' },
];

const REPO_ROOT = process.cwd();
const SHELL_PATH = path.join(REPO_ROOT, 'components', 'StandaloneShell.js');
const STUDIO_DIR = path.join(REPO_ROOT, 'packages', 'studio', 'src', 'components');

/** `clerkSetup()` fetches the testing token once per worker. */
let clerkSetupPromise: Promise<void> | null = null;
function ensureClerkSetup(): Promise<void> {
  if (!clerkSetupPromise) clerkSetupPromise = clerkSetup({ dotenv: true });
  return clerkSetupPromise;
}

/**
 * Stubs the network the studio shell touches on mount.
 *
 * `/api/access/resolve` is the entitlement gate the hand-off goes through —
 * it is answered with `paid` so the Personalization Modal opens instead of
 * the Upgrade Modal. The MuAPI endpoints are answered with empty payloads so
 * a run never waits on the real network.
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
}

/**
 * Seeds the studio's persisted media state.
 *
 * This is the exact state a real upload leaves behind: the studio writes its
 * uploaded media URLs into localStorage under this key and reads them back on
 * mount.
 */
async function seedStudioMedia(
  page: Page,
  persistKey: string,
  state: Record<string, unknown>,
): Promise<void> {
  await page.addInitScript(
    ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* private mode / storage disabled — the studio then shows no media */
      }
    },
    { key: persistKey, value: state },
  );
}

/**
 * Signs the browser in through Clerk's own sign-in flow.
 *
 * The cookie-only session mint (`e2e/fixtures/clerkSession.ts`) is enough for
 * route-level `auth()`, but the CLIENT stays signed out on a Clerk dev
 * instance (the dev browser reports `sessions: []`), and the entitlement gate
 * only opens for a signed-in client. `@clerk/testing`'s helper signs in through
 * the Backend API's sign-in ticket, which produces a real client session.
 *
 * The session mint is still installed as well: it is what puts the
 * `Authorization: Bearer` header on the app's own `/api/personalization/**`
 * calls, so the modal's project-restore request is authenticated instead of
 * 401-ing.
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

/**
 * A short description of what the page shows, used in failure messages.
 *
 * The hand-off can fail silently (the entitlement gate denies, the source is
 * refused, the modal never mounts), so the failure message has to say what
 * the page actually showed.
 */
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

/**
 * Asserts that the Personalization Modal is open AND carries the studio's
 * media.
 *
 * The modal's "Source Demo" panel renders the handed-over source media, so
 * the media element's `src` is the studio's own media URL — that is the
 * hand-off payload, proven in the DOM.
 */
async function expectModalWithMedia(
  page: Page,
  mediaUrl: string,
  title: string,
): Promise<void> {
  const modal = personalizationModal(page);
  try {
    await expect(modal).toBeVisible({ timeout: 30_000 });
  } catch (error) {
    throw new Error(
      `the Personalization Modal did not open.\npage: ${await describePage(page)}`,
    );
  }
  await expect(modal.locator('[aria-label="Close personalization modal"]')).toBeVisible();

  // Switch the modal to the advanced view, where the "Source Demo" panel
  // shows the source media the studio handed over.
  const advanced = modal.getByRole('button', { name: 'Advanced Editing' });
  if (await advanced.count()) {
    await advanced.click();
  }

  await expect(modal.getByText('Source Demo', { exact: true })).toBeVisible();

  const media = modal.locator(`[src="${mediaUrl}"]`);
  await expect(media.first(), 'the modal does not carry the studio media').toBeAttached();

  // The title the studio built travelled with the media.
  await expect(modal.getByText(title, { exact: true }).first()).toBeVisible();
}

test.describe('Phase 2 — studio → Personalization Modal hand-off', () => {
  test('the app root wires the Personalize trigger into all ten studios', async () => {
    const shell = fs.readFileSync(SHELL_PATH, 'utf8');

    const wired = WIRED_STUDIOS.filter((studio) =>
      new RegExp(`<${studio.component}\\b[^>]*renderPersonalizeAction=`).test(shell),
    );

    expect(
      wired.map((studio) => studio.component),
      'these studios do not receive renderPersonalizeAction from StandaloneShell.js',
    ).toEqual(WIRED_STUDIOS.map((studio) => studio.component));

    // Every one of those studio components actually accepts the prop.
    for (const studio of WIRED_STUDIOS) {
      const file = path.join(STUDIO_DIR, `${studio.component}.jsx`);
      expect(fs.existsSync(file), `${studio.component}.jsx is missing`).toBe(true);
      const source = fs.readFileSync(file, 'utf8');
      expect(
        source.includes('renderPersonalizeAction'),
        `${studio.component}.jsx does not accept renderPersonalizeAction`,
      ).toBe(true);
    }
  });

  test('Video Studio shows a Personalize trigger next to its media and hands that media to the modal', async ({
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
    await seedStudioMedia(page, 'hg_video_studio_persistent', {
      uploadedVideoUrl: VIDEO_MEDIA_URL,
      uploadedVideoName: VIDEO_MEDIA_NAME,
    });

    await signIn(page);

    // The entitlement gate resolves after the client is signed in; wait for
    // that answer so the click is not made against an unresolved gate.
    const accessResolved = page.waitForResponse('**/api/access/resolve', { timeout: 60_000 });
    await page.goto(`${BASE}/studio/video`, { waitUntil: 'domcontentloaded' });
    await accessResolved;

    // The studio rendered its own media preview from the persisted upload.
    const studioVideo = page.locator(`video[src="${VIDEO_MEDIA_URL}"]`);
    await expect(studioVideo.first(), 'Video Studio did not render its media preview').toBeAttached();

    // …and the trigger sits next to it.
    const trigger = page.getByRole('button', { name: 'Personalize', exact: true });
    await expect(trigger, 'Video Studio renders no Personalize trigger').toBeVisible();

    // The trigger is a sibling of the media preview, not somewhere else.
    const nextToMedia = await trigger.first().evaluate((el, mediaUrl) => {
      const container = el.closest('div');
      if (!container) return false;
      return Array.from(container.querySelectorAll('video, img')).some(
        (node) => node.getAttribute('src') === mediaUrl,
      );
    }, VIDEO_MEDIA_URL);
    expect(nextToMedia, 'the Personalize trigger is not next to the media preview').toBe(true);

    await trigger.first().click();

    await expectModalWithMedia(page, VIDEO_MEDIA_URL, VIDEO_MEDIA_NAME);

    // eslint-disable-next-line no-console
    console.log(
      'V2: video studio hand-off:',
      JSON.stringify({ studio: 'video', mediaUrl: VIDEO_MEDIA_URL, title: VIDEO_MEDIA_NAME }),
    );
  });

  test('Image Studio shows a Personalize trigger next to its media and hands that media to the modal', async ({
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
    await seedStudioMedia(page, 'hg_image_studio_persistent', {
      uploadedImageUrls: [IMAGE_MEDIA_URL],
    });

    await signIn(page);

    const accessResolved = page.waitForResponse('**/api/access/resolve', { timeout: 60_000 });
    await page.goto(`${BASE}/studio/image`, { waitUntil: 'domcontentloaded' });
    await accessResolved;

    const studioImage = page.locator(`img[src="${IMAGE_MEDIA_URL}"]`);
    await expect(studioImage.first(), 'Image Studio did not render its media preview').toBeAttached();

    const trigger = page.getByRole('button', { name: 'Personalize', exact: true });
    await expect(trigger, 'Image Studio renders no Personalize trigger').toBeVisible();

    const nextToMedia = await trigger.first().evaluate((el, mediaUrl) => {
      const container = el.closest('div');
      if (!container) return false;
      return Array.from(container.querySelectorAll('video, img')).some(
        (node) => node.getAttribute('src') === mediaUrl,
      );
    }, IMAGE_MEDIA_URL);
    expect(nextToMedia, 'the Personalize trigger is not next to the media preview').toBe(true);

    await trigger.first().click();

    await expectModalWithMedia(page, IMAGE_MEDIA_URL, 'Image Studio image');

    // eslint-disable-next-line no-console
    console.log(
      'V2: image studio hand-off:',
      JSON.stringify({ studio: 'image', mediaUrl: IMAGE_MEDIA_URL, title: 'Image Studio image' }),
    );
  });
});
