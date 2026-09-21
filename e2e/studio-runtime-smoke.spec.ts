import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const KB_PATH = path.resolve(process.cwd(), 'src/data/studioKnowledgeBase.json');
const BASE = 'http://localhost:3111';
const VIEWPORT = { width: 1280, height: 720 };

const FAKE_MUAPI_KEY = 'e2e-fake-muapi-key';
const FAKE_OPENAI_KEY = 'e2e-fake-openai-key';

// Load studios at module init time so Playwright can generate tests from them.
const STUDIOS: { id: string; name: string; route: string }[] = (() => {
  try {
    const kb = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
    const arr = Array.isArray(kb) ? kb : (kb.studios || []);
    return arr.map((entry: any) => ({ id: entry.id, name: entry.name, route: entry.route }));
  } catch {
    return [];
  }
})();

function mockMuApi(page: Page) {
  page.route('**/api.muapi.ai/api/v1/**', async (route) => {
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

  page.route('**/api.muapi.ai/api/v1/predictions/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'completed', url: 'https://example.com/fake-result.png' }),
    });
  });

  page.route('https://example.com/fake-result.png', async (route) => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(png, 'base64'),
    });
  });

  page.route('**/api.muapi.ai/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  page.route('/api/auth/muapi-key', async (route) => {
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

test.describe('Studio runtime smoke coverage', () => {
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

  for (const studio of STUDIOS) {
    test(`${studio.id} — ${studio.name}`, async ({ page }) => {
      const response = await page.goto(`${BASE}${studio.route}`);
      await page.waitForLoadState('networkidle');

      // Route should load without a server/runtime error.
      expect(response?.status()).toBeLessThan(500);

      // No uncaught page errors.
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));
      await page.waitForTimeout(2000);
      expect(pageErrors).toEqual([]);

      // Studio name or label should be present in the page.
      const nameFound = await page.getByText(studio.name, { exact: false }).count();
      expect(nameFound).toBeGreaterThan(0);
    });
  }
});
