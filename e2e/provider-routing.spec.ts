import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3111';
const FAKE_MUAPI_KEY = 'e2e-fake-muapi-key';
const FAKE_OPENAI_KEY = 'e2e-fake-openai-key';

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeReport(filePath: string, content: string) {
  await ensureDir(filePath);
  await fs.writeFile(filePath, content, 'utf-8');
}

// ── Types ────────────────────────────────────────────────────────────────────

type RouteEntry = {
  url: string;
  method: string;
  status: number;
  ts: number;
  provider: string;
};

type PayloadEntry = {
  url: string;
  method: string;
  body: Record<string, unknown>;
  provider: string;
};

// ── Shared test infrastructure ───────────────────────────────────────────────

function mockMuApiAndAuth(page: Page) {
  // Direct browser-to-MuAPI calls (catches the Next.js server's outgoing
  // fetch to api.muapi.ai when /api/v1/** proxy forwards the request).
  page.route('**/api.muapi.ai/**', async (route: Route) => {
    const req = route.request();
    const url = req.url();
    const match = url.match(/\/api\/v1\/([^\/?]+)/);
    const endpoint = match ? match[1] : 'unknown';
    let body: Record<string, unknown> = {};
    try {
      body = (await req.postDataJSON()) as Record<string, unknown>;
    } catch {
      body = { raw: req.postData()?.slice(0, 500) };
    }
    const entry: PayloadEntry = {
      url: `MuAPI: /api/v1/${endpoint}`,
      method: req.method(),
      body: { endpoint, ...body },
      provider: 'MuAPI',
    };
    // Expose via a global so tests can collect even if route fires
    // before the per-test array is set up.
    if ((page as any).__muapiCalls) {
      (page as any).__muapiCalls.push(entry);
    }

    // For generation submissions: return a request_id so polling begins.
    // For polling: return completed with a video URL.
    const isPoll = /predictions/.test(url) && req.method() === 'GET';
    if (isPoll) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'completed', url: 'https://example.com/e2e-mock-video.mp4' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ request_id: 'e2e-mock-req', id: 'e2e-mock-req', status: 'processing' }),
      });
    }
  });

  // Next.js proxy for /api/api/v1/** — VideoStudio calls this in dev mode
  // (http localhost) where BASE_URL resolves to "/api", producing a double
  // "/api/api/v1/{endpoint}" path. We intercept at the browser layer to
  // (a) capture routing evidence, (b) avoid hitting real MuAPI.
  page.route('/api/api/v1/**', async (route: Route) => {
    const req = route.request();
    const reqUrl = new URL(req.url(), 'http://localhost');
    const pathParts = reqUrl.pathname.replace('/api/api/v1/', '').split('/');
    const endpoint = pathParts[0] || 'unknown';

    let body: Record<string, unknown> = {};
    try {
      body = (await req.postDataJSON()) as Record<string, unknown>;
    } catch {
      body = { raw: req.postData()?.slice(0, 500) };
    }

    const entry: PayloadEntry = {
      url: `MuAPI (via proxy): /api/v1/${endpoint}`,
      method: req.method(),
      body: { endpoint, ...body },
      provider: 'MuAPI',
    };
    if ((page as any).__muapiCalls) {
      (page as any).__muapiCalls.push(entry);
    }

    // Mirror the same shape as the direct api.muapi.ai mock above so
    // VideoStudio's polling loop completes without hitting the network.
    const isPoll = pathParts[0] === 'predictions' && req.method() === 'GET';
    if (isPoll) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'completed', url: 'https://example.com/e2e-mock-video.mp4' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ request_id: 'e2e-mock-req', id: 'e2e-mock-req', status: 'processing' }),
      });
    }
  });

  // Fallback: also catch any /api/v1/** calls (https mode or future baseUrl
  // changes) so the test remains robust across environments.
  page.route('/api/v1/**', async (route: Route) => {
    const req = route.request();
    const reqUrl = new URL(req.url(), 'http://localhost');
    const pathParts = reqUrl.pathname.replace('/api/v1/', '').split('/');
    const endpoint = pathParts[0] || 'unknown';

    let body: Record<string, unknown> = {};
    try {
      body = (await req.postDataJSON()) as Record<string, unknown>;
    } catch {
      body = { raw: req.postData()?.slice(0, 500) };
    }

    const entry: PayloadEntry = {
      url: `MuAPI (via proxy): /api/v1/${endpoint}`,
      method: req.method(),
      body: { endpoint, ...body },
      provider: 'MuAPI',
    };
    if ((page as any).__muapiCalls) {
      (page as any).__muapiCalls.push(entry);
    }

    const isPoll = pathParts[0] === 'predictions' && req.method() === 'GET';
    if (isPoll) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'completed', url: 'https://example.com/e2e-mock-video.mp4' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ request_id: 'e2e-mock-req', id: 'e2e-mock-req', status: 'processing' }),
      });
    }
  });

  // Prevent any real OpenAI image-proxy calls from leaking through.
  page.route('**/api/proxy/openai-image', async (route: Route) => {
    const req = route.request();
    let body: Record<string, unknown> = {};
    try {
      body = (await req.postDataJSON()) as Record<string, unknown>;
    } catch {
      body = { raw: req.postData()?.slice(0, 500) };
    }
    if ((page as any).__openaiProxyCalls) {
      (page as any).__openaiProxyCalls.push({
        url: '/api/proxy/openai-image',
        method: req.method(),
        body,
        provider: 'OpenAI (proxy)',
      });
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  // Auth endpoint used by StandaloneShell to read/set the MuAPI key.
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

async function setupTestState(page: Page) {
  // Bypass Clerk auth in dev.
  await page.context().addCookies([
    { name: '__e2e_auth_bypass', value: '1', url: BASE },
  ]);

  // Seed both MuAPI and OpenAI keys into localStorage BEFORE any module
  // load so that authConfig.ts (which reads at module init) picks them up.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
      localStorage.setItem('openai_key', 'e2e-fake-openai-key');
    } catch {
      // ignore private-browsing storage errors
    }
  });

  // Register all route mocks before any navigation.
  mockMuApiAndAuth(page);
}

function setupCaptureArrays(page: Page) {
  (page as any).__muapiCalls = [];
  (page as any).__openaiProxyCalls = [];
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Provider Routing — Deterministic Network Interception', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page);
  });

  // ── OpenAI Proof ────────────────────────────────────────────────────────────
  // Verify that AI Assist panel operations do NOT route to MuAPI image endpoints.
  // NOTE: The current AI Assist tool registry does not directly call
  // /api/proxy/openai-image from the chat input flow (image editing is routed
  // through /api/personalization/image-edit on the server side). This test
  // verifies the routing boundary: AI Assist actions must not produce MuAPI
  // image tool calls.

  test('OpenAI Proof: AI Assist operations do not route to MuAPI image endpoints', async ({
    page,
  }) => {
    const muApiCalls: PayloadEntry[] = [];
    const allRoutes: RouteEntry[] = [];

    setupCaptureArrays(page);
    (page as any).__muapiCalls = muApiCalls;
    (page as any).__openaiProxyCalls = [];

    // Track all API responses for routing classification
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      if (!/\/api\//.test(url) && !/api\.muapi\.ai/.test(url)) return;

      let provider = 'unknown';
      if (/api\.muapi\.ai/.test(url)) provider = 'MuAPI';
      else if (url.includes('/api/proxy/openai-image')) provider = 'OpenAI (proxy)';
      else if (url.includes('/api/proxy/openai-enhance')) provider = 'OpenAI (proxy)';
      else if (url.includes('/api/personalization/')) provider = 'Supabase';
      else if (url.startsWith(BASE + '/api/v1/') || /\/api\/api\/v1\//.test(url)) provider = 'MuAPI (via proxy)';

      allRoutes.push({
        url,
        method: response.request().method(),
        status,
        ts: Date.now(),
        provider,
      });
    });

    // Navigate to personalization demo in test mode
    await page.goto('/personalization-demo?test=true');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open AI Assist — actual button text is "Show AI Assist" / "Hide AI Assist"
    const showAiAssistBtn = page.getByRole('button', { name: /Show AI Assist/i });
    await expect(showAiAssistBtn).toBeVisible({ timeout: 15_000 });
    await showAiAssistBtn.click();
    await page.waitForTimeout(1500);

    // Fill business context fields
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');

    // Submit a "readiness check" query — this triggers the prepare_everyness
    // action (auto_execute) and must NOT produce any MuAPI image tool calls.
    // Actual placeholder is "Ask AI Assist for guidance..." (PersonalizationModal.tsx:3641)
    const chatInput = page.getByPlaceholder(/Ask AI Assist for guidance/i).first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });
    await chatInput.fill('What do I need to generate?');
    await chatInput.press('Enter');
    await page.waitForTimeout(5000);

    // Write evidence files
    const reportDir = '/tmp/provider-routing-openai-proof';
    await ensureDir(path.join(reportDir, 'dummy'));
    await writeReport(path.join(reportDir, 'muapi-calls.json'), JSON.stringify(muApiCalls, null, 2));
    await writeReport(path.join(reportDir, 'all-routes.json'), JSON.stringify(allRoutes, null, 2));

    console.log('\n=== OPENAI PROOF — AI Assist Panel Routing ===');
    console.log(`api.muapi.ai calls: ${muApiCalls.length}`);

    for (const call of muApiCalls) {
      console.log(`\n  ${call.method} ${call.url}`);
      console.log(`  endpoint: ${(call.body as any).endpoint}`);
    }

    console.log(`\nReports written to: ${reportDir}`);

    // Authoritative assertions: AI Assist panel operations must NOT produce
    // MuAPI image tool calls (upscale, background-removal, style-transfer, etc.)
    const muapiImageToolCalls = muApiCalls.filter((c) => {
      const endpoint = (c.body as any).endpoint as string;
      return /upscale|background-remov|style-transfer|restore|skin-enhancer|seededit|generateImage|generateI2V|editImage/.test(endpoint);
    });
    expect(muapiImageToolCalls).toEqual([]);
  });

  // ── MuAPI Proof ─────────────────────────────────────────────────────────────
  // Trigger an actual video generation action from Video Studio and verify it hits
  // api.muapi.ai and does NOT hit /api/proxy/openai-image for the video request.

  test('MuAPI Proof: Video Studio generate triggers api.muapi.ai, not OpenAI image proxy', async ({
    page,
  }) => {
    const muApiCalls: PayloadEntry[] = [];
    const openaiProxyCalls: PayloadEntry[] = [];
    const allRoutes: RouteEntry[] = [];

    setupCaptureArrays(page);
    (page as any).__muapiCalls = muApiCalls;
    (page as any).__openaiProxyCalls = openaiProxyCalls;

    // Track all API responses
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      if (!/\/api\//.test(url) && !/api\.muapi\.ai/.test(url)) return;

      let provider = 'unknown';
      if (/api\.muapi\.ai/.test(url)) provider = 'MuAPI';
      else if (url.includes('/api/proxy/openai-image')) provider = 'OpenAI (proxy)';
      else if (url.includes('/api/proxy/openai-enhance')) provider = 'OpenAI (proxy)';
      else if (url.includes('/api/personalization/')) provider = 'Supabase';
      else if (url.startsWith(BASE + '/api/v1/') || /\/api\/api\/v1\//.test(url)) provider = 'MuAPI (via proxy)';

      allRoutes.push({
        url,
        method: response.request().method(),
        status,
        ts: Date.now(),
        provider,
      });
    });

    // Navigate to video studio generate page.
    // /studio/video routes to StandaloneShell → VideoStudio (vanilla JS).
    // Default model is Seedance Lite (seedance-lite-t2v, first in t2vModels).
    await page.goto('/studio/video');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Dismiss the "Welcome to SmartVideo GO" onboarding dialog if present
    const closeBtn = page.getByRole('button', { name: /^Close$/i });
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }

    // Fill in the prompt.
    // The vanilla JS VideoStudio textarea has placeholder
    // "Describe the video you want to create" (VideoStudio.js line 284/1108).
    const promptInput = page.getByPlaceholder(/Describe the video you want to create/i);
    await expect(promptInput).toBeVisible({ timeout: 20_000 });
    await promptInput.fill('A cinematic drone shot over a suburban home during a storm');
    await page.waitForTimeout(500);

    // Click Generate.
    // The generate button renders t('common.generate') = "Generate ✨"
    // The button text starts with "Generate" (VideoStudio.js line 1224: generateBtn.innerHTML = t('common.generate'))
    const generateBtn = page.getByRole('button', { name: /^Generate/i });
    await expect(generateBtn).toBeVisible({ timeout: 15_000 });
    await expect(generateBtn).toBeEnabled({ timeout: 60_000 });
    await generateBtn.click();

    // Wait for generation to complete: the mock returns {request_id, status:'processing'}
    // immediately; VideoStudio then polls /api/v1/predictions/{id}/result which the mock
    // returns as {status:'completed', url:'...'} — the full t2v flow takes ~2s.
    await page.waitForTimeout(8000);

    // Write evidence files
    const reportDir = '/tmp/provider-routing-muapi-proof';
    await ensureDir(path.join(reportDir, 'dummy'));
    await writeReport(path.join(reportDir, 'muapi-calls.json'), JSON.stringify(muApiCalls, null, 2));
    await writeReport(path.join(reportDir, 'openai-proxy-calls.json'), JSON.stringify(openaiProxyCalls, null, 2));
    await writeReport(path.join(reportDir, 'all-routes.json'), JSON.stringify(allRoutes, null, 2));

    console.log('\n=== MUAPI PROOF — Video Studio Generate Video ===');
    console.log(`MuAPI calls (direct + proxy): ${muApiCalls.length}`);
    console.log(`/api/proxy/openai-image calls: ${openaiProxyCalls.length}`);

    for (const call of muApiCalls) {
      console.log(`\n  ${call.method} ${call.url}`);
      console.log(`  endpoint: ${(call.body as any).endpoint}`);
      console.log(`  prompt: ${String((call.body as any).prompt || '').slice(0, 100)}`);
    }

    console.log('\n=== OPENAI PROXY CALLS (should be empty for video generation) ===');
    for (const call of openaiProxyCalls) {
      console.log(`  ${call.method} ${call.url}`);
    }

    console.log(`\nReports written to: ${reportDir}`);

    // Authoritative assertions
    // At least one MuAPI call must have been made (direct or via Next.js proxy).
    expect(muApiCalls.length).toBeGreaterThan(0);

    // The endpoint must be a recognised video-generation endpoint.
    const hasVideoEndpoint = muApiCalls.some((c) => {
      const endpoint = (c.body as any).endpoint as string;
      return /seedance|kling|veo|sora|ltx|generateVideo|generateI2V|processV2V|processRecast|processLipSync/.test(endpoint);
    });
    expect(hasVideoEndpoint).toBe(true);

    // OpenAI image proxy must never be called for video generation.
    const openaiProxyVideoCalls = openaiProxyCalls.filter((c) => {
      return c.url.includes('/api/proxy/openai-image');
    });
    expect(openaiProxyVideoCalls).toEqual([]);
  });
});
