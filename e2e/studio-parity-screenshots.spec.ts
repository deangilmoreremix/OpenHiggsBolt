import { test, expect, type Page, type Route } from '@playwright/test';
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import fs from 'fs/promises';
import path from 'path';

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3111';
const OUTPUT_DIR = path.resolve(
  process.env.SCREENSHOT_OUTPUT_DIR || './visual-assets/parity-evidence-538b97d'
);
const IS_PRODUCTION = BASE.includes('smartvid.app');

const FAKE_MUAPI_KEY = 'e2e-fake-muapi-key';
const FAKE_OPENAI_KEY = 'e2e-fake-openai-key';

// ---------------------------------------------------------------------------
// Mock MuAPI / internal API routes so studios never wait on real network.
// ---------------------------------------------------------------------------
function mockMuApi(page: Page) {
  page.route('**/api.muapi.ai/api/v1/**', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ request_id: `fake-${Date.now()}` }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ balance: 0 }),
    });
  });

  page.route('**/api.muapi.ai/api/v1/predictions/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'completed', url: 'https://example.com/fake-result.png' }),
    });
  });

  page.route('https://example.com/fake-result.png', async (route: Route) => {
    const png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(png, 'base64'),
    });
  });

  page.route('**/api.muapi.ai/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  page.route('/api/auth/muapi-key', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ key: FAKE_MUAPI_KEY, openaiKey: FAKE_OPENAI_KEY }),
      });
      return;
    }
    if (req.method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ key: FAKE_MUAPI_KEY, openaiKey: FAKE_OPENAI_KEY }),
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function captureNamed(
  page: Page,
  filePath: string,
  selector: string | undefined,
  timeout = 5000,
) {
  if (!selector) return;
  try {
    const loc = selector ? page.locator(selector).first() : page.locator('body').first();
    await loc.waitFor({ timeout, state: 'visible' });
    await ensureDir(filePath);
    await loc.screenshot({ path: filePath });
  } catch {
    // Region not present — skip silently.
  }
}

// ---------------------------------------------------------------------------
// Studio catalogue
// ---------------------------------------------------------------------------
interface StudioTarget {
  slug: string;
  label: string;
  route: string;
}

const STUDIOS: StudioTarget[] = [
  { slug: 'image', label: 'Image', route: '/studio/image' },
  { slug: 'video', label: 'Video', route: '/studio/video' },
  { slug: 'audio', label: 'Audio', route: '/studio/audio' },
  { slug: 'clipping', label: 'Clipping', route: '/studio/clipping' },
  { slug: 'vibe-motion', label: 'Vibe Motion', route: '/studio/vibe-motion' },
  { slug: 'lipsync', label: 'Lip Sync', route: '/studio/lipsync' },
  { slug: 'cinema', label: 'Cinema', route: '/studio/cinema' },
  { slug: 'marketing', label: 'Marketing', route: '/studio/marketing' },
  { slug: 'recast', label: 'Body Swap', route: '/studio/recast' },
  { slug: 'layers', label: 'Layers', route: '/studio/layers' },
  { slug: 'workflows', label: 'Workflows', route: '/studio/workflows' },
  { slug: 'agents', label: 'Agents', route: '/studio/agents' },
  { slug: 'design-agent', label: 'Design Agent', route: '/studio/design-agent' },
  { slug: 'ai-influencer', label: 'AI Influencer', route: '/studio/ai-influencer' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
test.describe('Studio parity screenshots', () => {
  test.beforeAll(async () => {
    if (!IS_PRODUCTION) {
      await clerkSetup();
    }
  });

  test.beforeEach(async ({ context, page }) => {
    if (!IS_PRODUCTION) {
      await context.addCookies([
        { name: '__e2e_auth_bypass', value: '1', url: BASE },
      ]);

      await page.addInitScript(() => {
        try {
          localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
          localStorage.setItem('openai_key', 'e2e-fake-openai-key');
        } catch {
          // ignore private-browsing storage errors
        }
      });

      mockMuApi(page);
    }

    await page.setViewportSize({ width: 1440, height: 1000 });
  });

  test.afterEach(async () => {
    const failures = test.info().errors;
    if (failures && failures.length > 0) {
      // Ensure failures have trace/screenshot artifacts from Playwright config.
    }
  });

  for (const studio of STUDIOS) {
    test.describe(`${studio.route}`, () => {
      test('desktop overview', async ({ page }) => {
        if (IS_PRODUCTION && process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
          await setupClerkTestingToken({ page });
        }

        await page.goto(`${BASE}${studio.route}`);
        await page.waitForLoadState('networkidle');

        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));
        await page.waitForTimeout(2000);
        expect(pageErrors).toEqual([]);

        const outDir = path.join(OUTPUT_DIR, 'desktop', studio.slug);
        await ensureDir(path.join(outDir, '01-studio-overview.png'));
        await page.screenshot({
          path: path.join(outDir, '01-studio-overview.png'),
          fullPage: true,
        });
      });

      test('mobile overview', async ({ page }) => {
        if (IS_PRODUCTION && process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
          await setupClerkTestingToken({ page });
        }

        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`${BASE}${studio.route}`);
        await page.waitForLoadState('networkidle');

        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));
        await page.waitForTimeout(2000);
        expect(pageErrors).toEqual([]);

        const outDir = path.join(OUTPUT_DIR, 'mobile', studio.slug);
        await ensureDir(path.join(outDir, '01-studio-overview.png'));
        await page.screenshot({
          path: path.join(outDir, '01-studio-overview.png'),
          fullPage: true,
        });
      });
    });
  }
});
