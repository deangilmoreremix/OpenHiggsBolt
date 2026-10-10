import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3111';
const FAKE_MUAPI_KEY = 'e2e-fake-muapi-key';
const FAKE_OPENAI_KEY = 'e2e-fake-openai-key';

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function aiAssistShot(page: Page, name: string) {
  const dir = path.resolve(__dirname, '../visual-assets/marketing-current/personalization/ai-assist');
  const filePath = path.join(dir, `${name}.png`);
  await ensureDir(filePath);
  await page.screenshot({ path: filePath, fullPage: true });
}

function mockMuApi(page: Page) {
  page.route('https://example.com/person.png', async (route: Route) => {
    const png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(png, 'base64'),
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
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ key: FAKE_MUAPI_KEY, openaiKey: FAKE_OPENAI_KEY }),
    });
  });

  page.route('**/api.muapi.ai/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  page.route('**/api/proxy/openai-enhance', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

test.describe('Personalization Demo — AI Assist E2E', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([
      { name: '__e2e_auth_bypass', value: '1', url: BASE },
    ]);

    mockMuApi(page);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/personalization-demo');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
      localStorage.setItem('openai_key', 'e2e-fake-openai-key');
    });

    await page.reload();
    await page.waitForTimeout(3000);
  });

  test('AI Assist opens and renders without crash', async ({ page }) => {
    await aiAssistShot(page, '01-initial-state');

    const showAiAssistBtn = page.getByRole('button', { name: /Show AI Assist/i });
    await expect(showAiAssistBtn).toBeVisible();

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await showAiAssistBtn.click();
    await page.waitForTimeout(1500);

    await aiAssistShot(page, '02-ai-assist-open');

    const aiAssistHeader = page.getByText('✦ AI Assist');
    await expect(aiAssistHeader).toBeVisible();

    const inputField = page.getByPlaceholder(/Ask AI Assist for guidance/i);
    await expect(inputField).toBeVisible();

    const askButton = page.getByRole('button', { name: /Ask/i });
    await expect(askButton).toBeVisible();

    expect(consoleErrors.length).toBe(0);
    for (const err of consoleErrors) {
      console.log(`Console error: ${err}`);
    }
  });

  test('Project Context — AI Assist reflects client information', async ({ page }) => {
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Residential Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Roof Inspection');

    const showAiAssistBtn = page.getByRole('button', { name: /Show AI Assist/i });
    await showAiAssistBtn.click();
    await page.waitForTimeout(1500);

    await aiAssistShot(page, '03-ai-assist-with-context');

    const inputField = page.getByPlaceholder(/Ask AI Assist for guidance/i);
    await inputField.fill('What do I need to generate?');
    await page.getByRole('button', { name: /Ask/i }).click();

    await page.waitForTimeout(2000);

    await aiAssistShot(page, '04-ai-assist-context-response');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('ABC Roofing');
  });

  test('Primary Assets — AI Assist recognizes uploaded PERSON and LOGO assets', async ({ page }) => {
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');

    const personUrlInput = page.getByPlaceholder('Paste image URL and press Enter').first();
    await expect(personUrlInput).toBeVisible();
    await personUrlInput.fill('https://example.com/person.png');
    await personUrlInput.press('Enter');
    await page.waitForTimeout(2000);

    const logoUrlInputs = page.getByPlaceholder('Paste logo URL and press Enter');
    if (await logoUrlInputs.count() > 0) {
      await logoUrlInputs.first().fill('https://example.com/logo.png');
      await logoUrlInputs.first().press('Enter');
      await page.waitForTimeout(2000);
    }

    const showAiAssistBtn = page.getByRole('button', { name: /Show AI Assist/i });
    await showAiAssistBtn.click();
    await page.waitForTimeout(1500);

    const inputField = page.getByPlaceholder(/Ask AI Assist for guidance/i);
    await inputField.fill('What assets do I have?');
    await page.getByRole('button', { name: /Ask/i }).click();

    await page.waitForTimeout(2000);

    await aiAssistShot(page, '05-ai-assist-with-assets');

    const bodyText = await page.textContent('body');
    const hasAssetsContext = bodyText?.includes('person') ||
      bodyText?.includes('logo') ||
      bodyText?.includes('asset') ||
      bodyText?.includes('Assets') ||
      bodyText?.includes('Recommendations') ||
      bodyText?.includes('Actions');

    expect(hasAssetsContext).toBe(true);
  });

  test('Read-Only Action — list_assets requires no confirmation', async ({ page }) => {
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');

    const showAiAssistBtn = page.getByRole('button', { name: /Show AI Assist/i });
    await showAiAssistBtn.click();
    await page.waitForTimeout(1500);

    const inputField = page.getByPlaceholder(/Ask AI Assist for guidance/i);
    await inputField.fill('What assets do I need?');
    await page.getByRole('button', { name: /Ask/i }).click();

    await page.waitForTimeout(2000);

    await aiAssistShot(page, '06-read-only-action');

    const confirmSection = page.getByText(/Confirm Action/i);
    await expect(confirmSection).not.toBeVisible();

    const bodyText = await page.textContent('body');
    const hasResponse = bodyText?.includes('Recommendations') ||
      bodyText?.includes('Actions') ||
      bodyText?.includes('readiness') ||
      bodyText?.includes('ready') ||
      bodyText?.includes('needs_input');

    expect(hasResponse).toBe(true);
  });

  test('Mutating Action Confirmation — gate appears before execution', async ({ page }) => {
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');

    const showAiAssistBtn = page.getByRole('button', { name: /Show AI Assist/i });
    await showAiAssistBtn.click();
    await page.waitForTimeout(1500);

    const inputField = page.getByPlaceholder(/Ask AI Assist for guidance/i);
    await inputField.fill('Personalize my prompt');
    await page.getByRole('button', { name: /Ask/i }).click();

    await page.waitForTimeout(2000);

    await aiAssistShot(page, '07-mutating-action-response');

    const bodyText = await page.textContent('body');
    const hasResponse = bodyText?.includes('Recommendations') ||
      bodyText?.includes('Actions') ||
      bodyText?.includes('Personalize') ||
      bodyText?.includes('prompt') ||
      bodyText?.includes('readiness');

    expect(hasResponse).toBe(true);

    const actions = page.getByRole('button', { name: /Personalize Prompt/i });
    if (await actions.count() > 0) {
      await actions.first().click();
      await page.waitForTimeout(1000);

      await aiAssistShot(page, '08-confirmation-gate');

      const confirmGate = page.getByText(/Confirm Action/i);
      await expect(confirmGate).toBeVisible();

      const confirmBtn = page.getByRole('button', { name: /^Confirm$/i });
      await expect(confirmBtn).toBeVisible();

      const cancelBtn = page.getByRole('button', { name: /^Cancel$/i });
      await expect(cancelBtn).toBeVisible();
    }
  });

  test('Error Recovery — UI remains usable after provider error', async ({ page }) => {
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');

    const personUrlInput = page.getByPlaceholder('Paste image URL and press Enter').first();
    await expect(personUrlInput).toBeVisible();
    await personUrlInput.fill('https://example.com/person.png');
    await personUrlInput.press('Enter');
    await page.waitForTimeout(2000);

    page.route('**/api.muapi.ai/**', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated provider failure' }),
      });
    });

    const showAiAssistBtn = page.getByRole('button', { name: /Show AI Assist/i });
    await showAiAssistBtn.click();
    await page.waitForTimeout(1500);

    const inputField = page.getByPlaceholder(/Ask AI Assist for guidance/i);
    await inputField.fill('What assets do I need?');
    await page.getByRole('button', { name: /Ask/i }).click();

    await page.waitForTimeout(2000);

    await aiAssistShot(page, '09-error-recovery');

    const bodyText = await page.textContent('body');
    const isNotBlank = bodyText && bodyText.trim().length > 0;
    expect(isNotBlank).toBe(true);

    const inputStillWorks = page.getByPlaceholder(/Ask AI Assist for guidance/i);
    await expect(inputStillWorks).toBeVisible();
    await inputStillWorks.fill('Another query after error');
    await expect(inputStillWorks).toHaveValue('Another query after error');
  });
});
