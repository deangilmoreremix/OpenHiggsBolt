import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3111';
const OUTPUT_DIR = path.resolve('/tmp', 'voice-studio-evidence');
const VIEWPORT = { width: 1920, height: 1080 };
const VOICE_STUDIO_TIMEOUT = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function mockVoiceApi(page: Page) {
  const apiHandlers: Record<string, string> = {
    '/api/voice/health': JSON.stringify({ status: 'ok' }),
    '/api/voice/model/status': JSON.stringify({ status: 'idle', sub_stage: null, detail: '', error: null, progress: null }),
    '/api/voice/api/settings/analytics': JSON.stringify({ available: false, prompted: true, opted_in: false }),
    '/api/voice/setup/status': JSON.stringify({ models_ready: true, missing: [], hf_cache_dir: '/deterministic/models', disk_free_gb: 100, min_free_gb: 1, enough_disk: true }),
    '/api/voice/profiles': JSON.stringify([]),
    '/api/voice/history': JSON.stringify([]),
    '/api/voice/dub/history': JSON.stringify([]),
    '/api/voice/projects': JSON.stringify([]),
    '/api/voice/export/history': JSON.stringify([]),
    '/api/voice/engines': JSON.stringify({ tts: { active: null, backends: [] }, asr: { active: null, backends: [] }, llm: { active: null, backends: [] } }),
    '/api/voice/sysinfo': JSON.stringify({ cpu: 0, ram: 0, total_ram: 32, vram: 0, gpu_active: false }),
    '/api/voice/workers': JSON.stringify({ enabled: false, running: false, workers: [] }),
    '/api/voice/media-tools/status': JSON.stringify({ status: 'ok' }),
  };

  for (const [url, body] of Object.entries(apiHandlers)) {
    page.route(url, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });
  }

  page.route('/api/voice/setup/preflight', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        has_warnings: false,
        checks: [],
        device: {
          os: 'darwin',
          arch: 'arm64',
          gpu_vendor: 'apple',
          gpu_backend: 'mps',
          gpu_available: true,
          gpu_driver: null,
          gpu_device_name: null,
          ram_gb: 32,
          disk_free_gb: 100,
        },
      }),
    });
  });

  page.route('/api/voice/models', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ models: [], installed: [] }),
    });
  });

  page.route('/api/voice/setup/recommendations', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        device: { os: 'darwin', arch: 'arm64', is_mac_arm: true, is_mac_intel: false, is_linux: false, is_windows: false, has_cuda: false, label: 'Apple Silicon' },
        rationale: 'Test',
        models: [],
        download_gb_remaining: 0,
        total_gb: 0,
        all_installed: true,
      }),
    });
  });

  page.route('/api/auth/muapi-key', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ key: 'e2e-fake-muapi-key', openaiKey: 'e2e-fake-openai-key' }),
    });
  });

  page.route('/setup/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        models_ready: true,
        missing: [],
        hf_cache_dir: '/deterministic/models',
        disk_free_gb: 100,
        min_free_gb: 1,
        enough_disk: true,
      }),
    });
  });

  page.route('/setup/preflight', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        has_warnings: false,
        checks: [],
        device: {
          os: 'darwin',
          arch: 'arm64',
          gpu_vendor: 'apple',
          gpu_backend: 'mps',
          gpu_available: true,
          gpu_driver: null,
          gpu_device_name: null,
          ram_gb: 32,
          disk_free_gb: 100,
        },
      }),
    });
  });

  page.route('/models', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ models: [], installed: [] }),
    });
  });

  page.route('/setup/recommendations', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        device: { os: 'darwin', arch: 'arm64', is_mac_arm: true, is_mac_intel: false, is_linux: false, is_windows: false, has_cuda: false, label: 'Apple Silicon' },
        rationale: 'Test environment',
        models: [],
        download_gb_remaining: 0,
        total_gb: 0,
        all_installed: true,
      }),
    });
  });

  page.route('/api/settings/analytics', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: false, prompted: true, opted_in: false }),
    });
  });

  page.route('/health', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    });
  });

  page.route('/model/status', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'idle', sub_stage: null, detail: '', error: null, progress: null }),
    });
  });

  page.route('/profiles', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  page.route('/history', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  page.route('/dub/history', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  page.route('/projects', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  page.route('/engines', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tts: { active: null, backends: [] }, asr: { active: null, backends: [] }, llm: { active: null, backends: [] } }),
    });
  });

  page.route('/sysinfo', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cpu: 0, ram: 0, total_ram: 32, vram: 0, gpu_active: false }),
    });
  });

  page.route('/workers', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ enabled: false, running: false, workers: [] }),
    });
  });
}

async function completeFirstRunSetup(page: Page): Promise<void> {
  // --- UI Scale Setup: click continue first ---
  const uiScaleSetup = page.locator('[data-testid="ui-scale-setup"]').first();
  if (await uiScaleSetup.count() > 0) {
    // Use JavaScript to bypass overlay intercept
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="ui-scale-setup-continue"]');
      if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    await page.waitForTimeout(1000);
  }

  // --- ApiKeyModal: fill MuAPI key and click Get Started ---
  const apiKeyModal = page.locator('text=Welcome to SmartVideo GO').first();
  if (await apiKeyModal.count() > 0) {
    const muapiInput = page.locator('input[placeholder*="MuAPI" i], input[placeholder*="muapi" i]').first();
    const openaiInput = page.locator('input[placeholder*="OpenAI" i]').first();

    if (await muapiInput.count() > 0) {
      await muapiInput.fill('e2e-fake-muapi-key');
    }
    if (await openaiInput.count() > 0) {
      await openaiInput.fill('e2e-fake-openai-key');
    }
    
    // Use JavaScript to click Get Started to bypass overlay
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Get Started'));
      if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    await page.waitForTimeout(1000);
  }

  // --- SetupWizard: click through to Enter studio ---
  const setupWizard = page.locator('h1:has-text("Set up VoiceStudio"), h1:has-text("VoiceStudio")').first();
  if (await setupWizard.count() > 0) {
    const enterStudioBtn = page.getByRole('button', { name: /enter studio/i });
    if (await enterStudioBtn.count() > 0) {
      await enterStudioBtn.click();
    } else {
      const primaryButtons = page.locator('button:has-text("Continue"), button:has-text("Continue")');
      const count = await primaryButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = primaryButtons.nth(i);
        if (await btn.isVisible()) {
          await btn.click();
          await page.waitForTimeout(500);
        }
      }
      const finalBtn = page.getByRole('button', { name: /enter studio/i });
      if (await finalBtn.count() > 0) {
        await finalBtn.click();
      }
    }
    await page.waitForTimeout(1000);
  }
}

async function waitForVoiceStudioReady(page: Page): Promise<void> {
  // Dismiss UI scale setup if present (first-run screen)
  const uiScaleSetup = page.locator('[data-testid="ui-scale-setup"]').first();
  if (await uiScaleSetup.count() > 0) {
    const continueBtn = page.locator('[data-testid="ui-scale-setup-continue"]').first();
    if (await continueBtn.count() > 0) {
      await continueBtn.click();
      await page.waitForTimeout(500);
    }
  }

  await expect(page.locator('.app-container')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });

  const voiceStudioHeader = page.locator('h1:has-text("VoiceStudio"), [data-voice-studio]').first();
  if (await voiceStudioHeader.count() > 0) {
    await expect(voiceStudioHeader).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
  }

  await expect(page.locator('.launchpad, [data-active-tab="voice"]')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
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
      await expect(page.locator('.launchpad')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '01-launchpad.png',
  },
  {
    name: 'Voice From Audio',
    navText: /voice/i,
    assertion: async (page: Page) => {
      await page.locator('.nav-rail-item').filter({ hasText: /^Voice$/ }).first().click();
      await page.locator('.lp-action-card').filter({ hasText: /From Audio|Voice Clone/i }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '02-voice-from-audio.png',
  },
  {
    name: 'Voice By Design',
    navText: /voice/i,
    assertion: async (page: Page) => {
      await page.locator('.nav-rail-item').filter({ hasText: /^Voice$/ }).first().click();
      await page.locator('.lp-action-card').filter({ hasText: /By Design|Voice Design/i }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '03-voice-by-design.png',
  },
  {
    name: 'Convert',
    navText: /convert/i,
    assertion: async (page: Page) => {
      await page.locator('.nav-rail-item').filter({ hasText: /^Voice$/ }).first().click();
      await page.locator('.lp-action-card').filter({ hasText: /Convert/i }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '04-convert.png',
  },
  {
    name: 'Dub',
    navText: /dub/i,
    assertion: async (page: Page) => {
      await page.locator('.nav-rail-item').filter({ hasText: /^Dub$/ }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '05-dub.png',
  },
  {
    name: 'Stories',
    navText: /stories/i,
    assertion: async (page: Page) => {
      await page.locator('.nav-rail-item').filter({ hasText: /^Stories$/ }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '06-stories.png',
  },
  {
    name: 'Audiobook',
    navText: /audiobook/i,
    assertion: async (page: Page) => {
      await page.locator('.nav-rail-item').filter({ hasText: /^Audiobook$/ }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '07-audiobook.png',
  },
  {
    name: 'Gallery',
    navText: /gallery/i,
    assertion: async (page: Page) => {
      await page.locator('.nav-rail-item').filter({ hasText: /^Gallery$/ }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '08-gallery.png',
  },
  {
    name: 'Transcriptions',
    navText: /transcriptions/i,
    assertion: async (page: Page) => {
      await page.locator('.nav-rail-item').filter({ hasText: /^Transcripts$/ }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '09-transcriptions.png',
  },
  {
    name: 'Projects',
    navText: /projects/i,
    assertion: async (page: Page) => {
      await page.locator('.nav-rail-item').filter({ hasText: /^OmniDrive$/ }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
    },
    screenshot: '10-projects.png',
  },
  {
    name: 'Settings',
    navText: /settings/i,
    assertion: async (page: Page) => {
      await page.locator('button').filter({ hasText: /^Settings$/ }).first().click();
      await expect(page.locator('.studio-with-history')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });
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
        localStorage.setItem('omnivoice.app', JSON.stringify({ state: { uiScaleConfigured: true, uiScale: 1 }, version: 7 }));
      } catch {
        // ignore private-browsing storage errors
      }
    });

    mockVoiceApi(page);
    await page.setViewportSize(VIEWPORT);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/api/dev-login').catch(() => {});
    await page.waitForTimeout(500);
  });

  test('authenticated /studio/voice renders upstream VoiceStudio UI', async ({ page }) => {
    const pageErrors: string[] = [];
    const failedRequests: { url: string; status?: number }[] = [];

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('requestfailed', (request) => {
      try {
        const response = request.response();
        failedRequests.push({
          url: request.url(),
          status: response ? (typeof response.status === 'function' ? response.status() : undefined) : undefined,
        });
      } catch {
        failedRequests.push({ url: request.url() });
      }
    });

    await page.goto('/studio/voice');
    await page.waitForLoadState('domcontentloaded');

    await completeFirstRunSetup(page);
    await waitForVoiceStudioReady(page);

    // --- Critical assertions ---
    // No iframe
    const iframeCount = await page.locator('iframe').count();
    expect(iframeCount).toBe(0);

    // No backend placeholder
    await expect(page.getByText(/BACKEND_DEPLOYMENT_PENDING/i)).toHaveCount(0);

    // VoiceStudio shell header is present
    await expect(page.locator('h1:has-text("VoiceStudio"), [data-voice-studio] h1')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });

    // Launchpad is the initial workspace
    await expect(page.locator('.launchpad')).toBeVisible({ timeout: VOICE_STUDIO_TIMEOUT });

    // No uncaught runtime errors
    expect(pageErrors).toEqual([]);

    // --- Screenshot: initial Launchpad ---
    await ensureDir(path.join(OUTPUT_DIR, '01-launchpad.png'));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-launchpad.png'), fullPage: true });
  });

  for (const workspace of WORKSPACES) {
    test(`workspace renders: ${workspace.name}`, async ({ page }) => {
      await page.goto('/studio/voice');
      await page.waitForLoadState('domcontentloaded');

      await completeFirstRunSetup(page);
      await waitForVoiceStudioReady(page);

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
    await page.waitForLoadState('domcontentloaded');

    await completeFirstRunSetup(page);
    await waitForVoiceStudioReady(page);

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
    await page.waitForLoadState('domcontentloaded');

    await completeFirstRunSetup(page);
    await waitForVoiceStudioReady(page);

    const voiceBg = await page.evaluate(() => {
      const container = document.querySelector('[data-voice-studio] .app-container') || document.querySelector('.app-container');
      if (!container) return null;
      return getComputedStyle(container).backgroundColor;
    });

    // Navigate to Image Studio
    await page.goto('/studio/image');
    await page.waitForLoadState('domcontentloaded');
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
