import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3111';
const OUTPUT_DIR = path.resolve(__dirname, '../visual-assets/studio-routes');
const VIEWPORT = { width: 1920, height: 1080 };

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

test.describe('Studio route parity', () => {
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

    mockMuApi(page);
    await page.setViewportSize(VIEWPORT);
  });

  for (const studio of STUDIO_ROUTES) {
    test(studio.route, async ({ page }) => {
      const slug = studio.route.replace('/studio/', '');
      const dir = path.join(OUTPUT_DIR, slug);
      await ensureDir(dir);

      const response = await page.goto(studio.route);
      await page.waitForLoadState('networkidle');

      // Route should load without a server/runtime error.
      expect(response?.status()).toBeLessThan(500);

      // No uncaught page errors.
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));
      await page.waitForTimeout(2000);
      expect(pageErrors).toEqual([]);

      // Studio label should be present.
      await page.getByText(studio.label, { exact: false }).first().waitFor({ timeout: 15000 });

      // Capture full-page screenshot.
      await page.screenshot({ path: path.join(dir, 'full-page.png'), fullPage: true });

      // Capture model picker if present.
      const modelPicker = page
        .locator('[aria-label*="model" i], button:has-text("Model"), [data-model-picker]')
        .first();
      if (await modelPicker.count() > 0) {
        await modelPicker.screenshot({ path: path.join(dir, 'model-picker.png') });
      }

      // Capture prompt area if present.
      const promptArea = page
        .locator('textarea[placeholder*="prompt" i], textarea[placeholder*="describe" i], [contenteditable="true"]')
        .first();
      if (await promptArea.count() > 0) {
        await promptArea.screenshot({ path: path.join(dir, 'prompt-area.png') });
      }

      // Capture generate button if present.
      const generateButton = page
        .locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Submit")')
        .first();
      if (await generateButton.count() > 0) {
        await generateButton.screenshot({ path: path.join(dir, 'generate-button.png') });
      }
    });
  }
});
