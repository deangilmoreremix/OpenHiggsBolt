import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3111';
const OUTPUT_DIR = path.resolve(__dirname, '../visual-assets/voice-studio-acceptance');
const VIEWPORT = { width: 1920, height: 1080 };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

// Mock /api/voice/* so backend-dependent actions don't 404 during acceptance.
function mockVoiceApi(page: Page) {
  page.route('/api/voice/**', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'POST' || req.method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, _mock: true }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, _mock: true }),
    });
  });
}

// ---------------------------------------------------------------------------
// Workspace definitions
// ---------------------------------------------------------------------------
type Workspace = {
  name: string;
  navText: string | RegExp;
  assertion: (page: Page) => Promise<void>;
  screenshot?: string;
};

const WORKSPACES: Workspace[] = [
  {
    name: 'Launchpad',
    navText: /launchpad/i,
    assertion: async (page: Page) => {
      await expect(page.locator('.launchpad')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '01-launchpad.png',
  },
  {
    name: 'Voice From Audio',
    navText: /voice/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /voice/i }).click();
      await page.getByRole('button', { name: /from audio/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '02-voice-from-audio.png',
  },
  {
    name: 'Voice By Design',
    navText: /voice/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /voice/i }).click();
      await page.getByRole('button', { name: /by design/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '03-voice-by-design.png',
  },
  {
    name: 'Convert',
    navText: /convert/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /convert/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '04-convert.png',
  },
  {
    name: 'Dub',
    navText: /dub/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /dub/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '05-dub.png',
  },
  {
    name: 'Stories',
    navText: /stories/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /stories/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '06-stories.png',
  },
  {
    name: 'Audiobook',
    navText: /audiobook/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /audiobook/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '07-audiobook.png',
  },
  {
    name: 'Gallery',
    navText: /gallery/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /gallery/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '08-gallery.png',
  },
  {
    name: 'Transcriptions',
    navText: /transcriptions/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /transcriptions/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '09-transcriptions.png',
  },
  {
    name: 'Projects',
    navText: /projects/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /projects/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '10-projects.png',
  },
  {
    name: 'Settings',
    navText: /settings/i,
    assertion: async (page: Page) => {
      await page.getByRole('button', { name: /settings/i }).click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: 15000 });
    },
    screenshot: '11-settings.png',
  },
];

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------
test.describe('VoiceStudio native integration acceptance', () => {
  test.beforeEach(async ({ context, page }) => {
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

    mockVoiceApi(page);
    await page.setViewportSize(VIEWPORT);
  });

  test('authenticated /studio/voice renders upstream VoiceStudio UI', async ({ page }) => {
    const pageErrors: string[] = [];
    const failedRequests: { url: string; status?: number }[] = [];

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        status: request.response()?.status(),
      });
    });

    await page.goto('/studio/voice');
    await page.waitForLoadState('networkidle');

    // --- Critical assertions ---
    // No iframe
    const iframeCount = await page.locator('iframe').count();
    expect(iframeCount).toBe(0);

    // No backend placeholder
    await expect(page.getByText(/BACKEND_DEPLOYMENT_PENDING/i)).toHaveCount(0);

    // Actual upstream VoiceStudio shell is present
    await expect(page.locator('.app-container')).toBeVisible({ timeout: 15000 });

    // Launchpad is the initial workspace
    await expect(page.locator('.launchpad')).toBeVisible({ timeout: 15000 });

    // No uncaught runtime errors
    expect(pageErrors).toEqual([]);

    // --- Screenshot: initial Launchpad ---
    await ensureDir(path.join(OUTPUT_DIR, '01-launchpad.png'));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-launchpad.png'), fullPage: true });
  });

  for (const workspace of WORKSPACES) {
    test(`workspace renders: ${workspace.name}`, async ({ page }) => {
      await page.goto('/studio/voice');
      await page.waitForLoadState('networkidle');

      // Wait for VoiceStudio app container
      await expect(page.locator('.app-container')).toBeVisible({ timeout: 15000 });

      // Navigate to the workspace via actual upstream navigation
      await workspace.assertion(page);

      // Capture screenshot
      if (workspace.screenshot) {
        await ensureDir(path.join(OUTPUT_DIR, workspace.screenshot));
        await page.screenshot({
          path: path.join(OUTPUT_DIR, workspace.screenshot),
          fullPage: true,
        });
      }
    });
  }

  test('API requests target /api/voice/* and not :3900', async ({ page }) => {
    const apiRequests: { url: string }[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/voice/')) {
        apiRequests.push({ url });
      }
    });

    await page.goto('/studio/voice');
    await page.waitForLoadState('networkidle');

    // Interact to trigger at least one API call
    await page.getByRole('button', { name: /dub/i }).click();
    await page.waitForTimeout(2000);

    // At least one /api/voice/* request should have been made
    expect(apiRequests.length).toBeGreaterThan(0);

    // No direct :3900 requests
    const direct3900 = apiRequests.some((r) => r.url.includes(':3900'));
    expect(direct3900).toBe(false);
  });

  test('VoiceStudio CSS does not leak into other studios', async ({ page }) => {
    // Capture VoiceStudio background
    await page.goto('/studio/voice');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.app-container')).toBeVisible({ timeout: 15000 });

    const voiceBg = await page.evaluate(() => {
      const container = document.querySelector('[data-voice-studio] .app-container') || document.querySelector('.app-container');
      if (!container) return null;
      return getComputedStyle(container).backgroundColor;
    });

    // Navigate to Image Studio
    await page.goto('/studio/image');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const imageBg = await page.evaluate(() => {
      const body = document.body;
      return getComputedStyle(body).backgroundColor;
    });

    // Image Studio background should not be VoiceStudio's scoped background
    // VoiceStudio scoped CSS should not affect the host shell
    expect(imageBg).not.toBe(voiceBg);
  });
});
