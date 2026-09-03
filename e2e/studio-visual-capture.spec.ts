import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3111';
const OUTPUT_DIR = path.resolve(__dirname, '../visual-assets/studios');
const VIEWPORT = { width: 1920, height: 1080 };

const FAKE_MUAPI_KEY = 'e2e-fake-muapi-key';
const FAKE_OPENAI_KEY = 'e2e-fake-openai-key';

// ---------------------------------------------------------------------------
// Mock MuAPI / internal API routes so studios never wait on real network.
// ---------------------------------------------------------------------------
function mockMuApi(page: Page) {
  // Generation endpoints return an immediate request_id.
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

  // Prediction polling returns completed instantly.
  page.route('**/api.muapi.ai/api/v1/predictions/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'completed', url: 'https://example.com/fake-result.png' }),
    });
  });

  // Image result placeholder.
  page.route('https://example.com/fake-result.png', async (route: Route) => {
    const png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(png, 'base64'),
    });
  });

  // Catch-all for any other MuAPI calls (supabase, etc.).
  page.route('**/api.muapi.ai/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  // Auth / balance endpoints used by StandaloneShell.
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

async function captureIfVisible(
  page: Page,
  filePath: string,
  selector: string,
  timeout = 3000,
) {
  try {
    const loc = page.locator(selector).first();
    await loc.waitFor({ timeout, state: 'visible' });
    await ensureDir(filePath);
    await loc.screenshot({ path: filePath });
  } catch {
    // Region not present in this studio — skip silently.
  }
}

// ---------------------------------------------------------------------------
// Studio catalogue
// ---------------------------------------------------------------------------
interface StudioTarget {
  slug: string;
  label: string;
  route: string;
  closeUps?: { name: string; selector: string }[];
}

const STUDIOS: StudioTarget[] = [
  {
    slug: 'image',
    label: 'Image Studio',
    route: '/studio/image',
  },
  {
    slug: 'video',
    label: 'Video Studio',
    route: '/studio/video',
  },
  {
    slug: 'audio',
    label: 'Audio Studio',
    route: '/studio/audio',
  },
  {
    slug: 'clipping',
    label: 'AI Clipping',
    route: '/studio/clipping',
  },
  {
    slug: 'vibe-motion',
    label: 'Vibe Motion',
    route: '/studio/vibe-motion',
  },
  {
    slug: 'lipsync',
    label: 'Lip Sync',
    route: '/studio/lipsync',
  },
  {
    slug: 'cinema',
    label: 'Cinema Studio',
    route: '/studio/cinema',
  },
  {
    slug: 'storyboard',
    label: 'Storyboard',
    route: '/studio/storyboard',
  },
  {
    slug: 'marketing',
    label: 'Marketing Studio',
    route: '/studio/marketing',
  },
  {
    slug: 'recast',
    label: 'Body Swap',
    route: '/studio/recast',
  },
  {
    slug: 'layers',
    label: 'Layers Studio',
    route: '/studio/layers',
  },
  {
    slug: 'workflows',
    label: 'Workflows',
    route: '/studio/workflows',
  },
  {
    slug: 'agents',
    label: 'Agents',
    route: '/studio/agents',
  },
  {
    slug: 'design-agent',
    label: 'Design Agent AI',
    route: '/studio/design-agent',
  },
  {
    slug: 'vfx-studio',
    label: 'VFX',
    route: '/studio/vfx-studio',
  },
  {
    slug: 'thumbnail-studio',
    label: 'Thumbnail Studio',
    route: '/studio/thumbnail-studio',
  },
  {
    slug: 'ai-influencer',
    label: 'AI Influencer Studio',
    route: '/studio/ai-influencer',
  },
  {
    slug: 'social-publishing',
    label: 'Social Publishing',
    route: '/studio/social-publishing',
  },
  {
    slug: 'go-ai-viral',
    label: 'GO-Viral',
    route: '/studio/go-ai-viral',
  },
  {
    slug: 'photo-studio',
    label: 'Photo Studio',
    route: '/photo-studio',
  },
  {
    slug: 'brand-studio',
    label: 'Brand Studio',
    route: '/brand-studio',
  },
];

// Generic regions present in most generation studios.
const GENERIC_CLOSE_UPS = [
  { name: 'top-navigation', selector: 'nav, header' },
  {
    name: 'prompt-area',
    selector:
      'textarea[placeholder*="prompt" i], textarea[placeholder*="describe" i], textarea[placeholder*="brief" i], [contenteditable="true"]',
  },
  {
    name: 'generate-button',
    selector:
      'button:has-text("Generate"), button:has-text("Create"), button:has-text("Submit"), button:has-text("Generate Thumbnail")',
  },
  { name: 'model-selector', selector: 'button:has-text("Model"), [aria-label*="model" i]' },
  {
    name: 'history-gallery',
    selector: 'text=History, text=Gallery, text=My, text=Mine, text=Community',
  },
  {
    name: 'advanced-options',
    selector: 'button:has-text("Advanced"), button:has-text("Settings"), button:has-text("Options")',
  },
  {
    name: 'upload-zone',
    selector: 'text=Drop your media here, button:has-text("Upload"), input[type="file"]',
  },
];

// Studio-specific extras for richer captures.
const STUDIO_SPECIFIC_CLOSE_UPS: Record<string, { name: string; selector: string }[]> = {
  cinema: [
    { name: 'camera-config-button', selector: 'button:has-text("Camera Config")' },
    { name: 'camera-scroll-column', selector: '[data-value]' },
  ],
  vfx: [
    { name: 'category-ai-effects', selector: 'button:has-text("AI Effects")' },
    { name: 'category-motion-controls', selector: 'button:has-text("Motion Controls")' },
    { name: 'category-vfx', selector: 'button:has-text("VFX")' },
    { name: 'effects-grid', selector: '[data-category="ai-effects"], [data-category="motion-controls"], [data-category="vfx"]' },
  ],
  storyboard: [
    { name: 'project-name-input', selector: 'input[placeholder*="project" i]' },
    { name: 'brief-textarea', selector: 'textarea[placeholder*="brief" i]' },
  ],
  'thumbnail-studio': [
    { name: 'model-dropdown', selector: '[aria-label="Select image generation model"]' },
    { name: 'style-presets', selector: 'button:has-text("Cinematic"), button:has-text("Vibrant")' },
  ],
  'photo-studio': [
    { name: 'category-selector', selector: 'button:has-text("E-commerce"), button:has-text("Lifestyle")' },
    { name: 'style-grid', selector: 'button:has-text("Studio White"), button:has-text("Marble Clean")' },
    { name: 'generate-button', selector: 'button:has-text("Generate")' },
  ],
  'brand-studio': [
    { name: 'url-input', selector: 'input[placeholder*="http" i]' },
    { name: 'analyze-button', selector: 'button:has-text("Analyze")' },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
test.describe('Studio Visual Capture', () => {
  test.beforeEach(async ({ context, page }) => {
    // Bypass Clerk auth in dev.
    await context.addCookies([
      { name: '__e2e_auth_bypass', value: '1', url: BASE },
    ]);

    // Seed both MuAPI and OpenAI keys so StandaloneShell never shows the
    // first-login ApiKeyModal overlay.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
        localStorage.setItem('openai_key', 'e2e-fake-openai-key');
      } catch {
        // ignore private-browsing storage errors
      }
    });

    // Ensure deterministic API responses before any navigation.
    mockMuApi(page);

    // High-quality viewport for all captures.
    await page.setViewportSize(VIEWPORT);
  });

  for (const studio of STUDIOS) {
    test(studio.label, async ({ page }) => {
      const dir = path.join(OUTPUT_DIR, studio.slug);
      await ensureDir(dir);

      // Navigate and wait for the studio shell to render.
      await page.goto(studio.route);
      await page.waitForLoadState('networkidle');

      // Confirm the studio label is present (loose match in case of extra whitespace).
      try {
        await page.getByText(studio.label, { exact: false }).waitFor({ timeout: 15000 });
      } catch {
        // Some wrappers (e.g. brand-studio) use a different heading; continue.
      }

      // Give the studio shell, lazy-loaded packages, and mocked generation
      // pipelines extra time to settle before capturing visual assets.
      await page.waitForTimeout(10_000);

      // -------------------------------------------------------------------
      // 1. Full-page screenshot of the entire studio interface.
      // -------------------------------------------------------------------
      await page.screenshot({ path: path.join(dir, 'full-page.png'), fullPage: true });

      // -------------------------------------------------------------------
      // 2. Targeted close-up screenshots of key UI components.
      // -------------------------------------------------------------------
      const targets = [
        ...GENERIC_CLOSE_UPS,
        ...(STUDIO_SPECIFIC_CLOSE_UPS[studio.slug] || []),
      ];

      for (const target of targets) {
        const outPath = path.join(dir, `${target.name}.png`);
        await captureIfVisible(page, outPath, target.selector);
      }
    });
  }
});
