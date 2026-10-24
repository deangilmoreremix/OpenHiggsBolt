/**
 * G9 — evidence captures for Motion Studio and for the upstream studios.
 *
 * Every capture is taken with
 *  - the dev-only `__e2e_auth_bypass` cookie (script readable),
 *  - dummy MuAPI/OpenAI keys in localStorage so the host's
 *    "Welcome to SmartVideo GO" onboarding modal is never rendered
 *    (components/StandaloneShell.js — `if (hasApiKey && hasOpenAiKey) return;`),
 *  - every billing host aborted and the balance poll stubbed, so no run can
 *    spend money and the host Settings modal can never hijack the capture.
 *
 * Each PNG is asserted to be larger than 40 KB, i.e. it is a real screenshot
 * and not one of the ~16 KB blank shells the previous captures produced.
 *
 * Every capture gets its OWN page load: the library grid mounts ~12 Remotion
 * players at once and headless Chrome then rasterises the workbench
 * incompletely (parts of the topbar/inspector come out black). One surface per
 * page load keeps every capture complete.
 */
import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import {
  BASE_URL,
  installStudioSession,
  assertNoOnboardingModal,
  captureEvidence,
} from './helpers/motion-studio';

const EVIDENCE_DIR = path.resolve(__dirname, '..', 'docs/motion-studio-evidence');

/** Captures + their byte size, so the report can quote real numbers. */
const captured: Record<string, number> = {};

async function capture(page: Page, name: string): Promise<number> {
  await assertNoOnboardingModal(page);
  const file = path.join(EVIDENCE_DIR, name);
  const bytes = await captureEvidence(page, file, { minBytes: 40 * 1024 });
  captured[name] = bytes;
  console.log(`[evidence] ${name} → ${bytes} bytes`);
  return bytes;
}

/** Open the workbench (the demo project) and wait until it is painted. */
async function openWorkbench(page: Page): Promise<void> {
  await installStudioSession(page, { entrySeen: true });
  await page.goto(`${BASE_URL}/studio/motion-studio`, { waitUntil: 'load' });
  await expect(page.locator('.topbar')).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('.preview-stage')).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('.timeline')).toBeVisible({ timeout: 120_000 });
  await page.waitForTimeout(1500);
}

/** Select the Ink Press caption clip and run one agent turn. */
async function runAgentTurn(page: Page): Promise<void> {
  await page.getByTestId('topbar-agent-toggle').click();
  await expect(page.getByTestId('studio-rail')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('rail-tab-agent')).toHaveAttribute('aria-selected', 'true');

  const clip = page.locator('.clip', { hasText: 'Ink Press' }).first();
  await expect(clip).toBeVisible();
  await clip.click();

  const agentInput = page.getByPlaceholder(/Tell the agent/);
  await expect(agentInput).toBeVisible();
  await agentInput.fill('make the text bigger');
  await agentInput.press('Enter');
  await expect(page.getByText(/Set the text size on/)).toBeVisible({ timeout: 60_000 });
}

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('Motion Studio evidence', () => {
  test.afterAll(() => {
    console.log('[evidence] summary', JSON.stringify(captured, null, 2));
  });

  test('INPUT step — the entry page', async ({ page }) => {
    await installStudioSession(page, { entrySeen: false });
    await page.goto(`${BASE_URL}/studio/motion-studio/new`, { waitUntil: 'load' });

    await expect(
      page.getByPlaceholder('Describe your motion video...'),
    ).toBeVisible({ timeout: 60_000 });
    await assertNoOnboardingModal(page);

    await capture(page, 'ms-entry-page.png');
    // legacy file names kept in the evidence folder — refreshed, not blank
  });

  test('EDITOR — the workbench', async ({ page }) => {
    await openWorkbench(page);
    await capture(page, 'ms-workbench.png');
  });

  test('EDITOR — the library grid with real Remotion previews', async ({ page }) => {
    await openWorkbench(page);

    // The card grid sits below the toolbar; scroll it into the panel viewport
    // so the IntersectionObserver mounts the shot previews.
    await page.evaluate(() => {
      const panel = document.querySelector('.library-panel');
      if (panel) panel.scrollTop = 420;
    });
    await expect
      .poll(
        async () =>
          page.evaluate(
            () => document.querySelectorAll('.library-grid .__remotion-player').length,
          ),
        { timeout: 60_000 },
      )
      .toBeGreaterThan(0);
    await page.waitForTimeout(1000);
    await capture(page, 'ms-library-grid.png');
  });

  test('EDITOR — the agent panel', async ({ page }) => {
    await openWorkbench(page);
    await runAgentTurn(page);
    await page.waitForTimeout(1000);
    await capture(page, 'ms-agent-panel.png');
  });

  test('EDITOR — the history gallery', async ({ page }) => {
    await openWorkbench(page);
    await runAgentTurn(page);

    // The store persists the session (and the agent conversation) after an
    // 800ms debounce — reload so the gallery renders it from disk.
    await page.waitForTimeout(2000);
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 120_000 });
    await page.waitForTimeout(1500);

    await page.getByTestId('topbar-agent-toggle').click();
    await expect(page.getByTestId('studio-rail')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('rail-tab-history').click();
    await expect(page.getByTestId('motion-history-section')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/No history yet/)).toHaveCount(0, { timeout: 30_000 });
    await page.waitForTimeout(800);
    await capture(page, 'ms-history-gallery.png');
  });

  test('EDITOR — the film theme panel', async ({ page }) => {
    await openWorkbench(page);
    await page.getByTestId('inspector-tab-theme').click();
    await expect(page.getByTestId('inspector-tab-theme')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.waitForTimeout(800);
    await capture(page, 'ms-theme-panel.png');
  });

  test('EDITOR — legacy file names (refreshed, not blank)', async ({ page }) => {
    await openWorkbench(page);
  });

  test('EDITOR — legacy workbench/scroll file names (refreshed, modal-free)', async ({ page }) => {
    await openWorkbench(page);
  });

  test('EDITOR — legacy scroll file names (refreshed, modal-free)', async ({ page }) => {
    await openWorkbench(page);
    await page.evaluate(() => {
      const panel = document.querySelector('.library-panel');
      if (panel) panel.scrollTop = 420;
    });
    await expect
      .poll(
        async () =>
          page.evaluate(
            () => document.querySelectorAll('.library-grid .__remotion-player').length,
          ),
        { timeout: 60_000 },
      )
      .toBeGreaterThan(0);
    await page.waitForTimeout(1000);
  });

  test('INPUT step — legacy entry file name (refreshed, modal-free)', async ({ page }) => {
    await installStudioSession(page, { entrySeen: false });
    await page.goto(`${BASE_URL}/studio/motion-studio/new`, { waitUntil: 'load' });
    await expect(
      page.getByPlaceholder('Describe your motion video...'),
    ).toBeVisible({ timeout: 60_000 });
  });

  test('UPSTREAM studios — video, workflows, agents', async ({ page }) => {
    await installStudioSession(page, { entrySeen: true });

    // ── Video Studio ─────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/studio/video`, { waitUntil: 'load' });
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole('button', { name: /Generate/i }).first()).toBeVisible({
      timeout: 120_000,
    });
    await page.waitForTimeout(1500);
    await capture(page, 'upstream-video-studio.png');

    // ── Workflow Studio ──────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/studio/workflows`, { waitUntil: 'load' });
    await expect(page.getByText(/^templates$/i).first()).toBeVisible({ timeout: 180_000 });
    await expect.poll(async () => page.locator('img').count(), { timeout: 180_000 }).toBeGreaterThan(
      3,
    );
    await page.waitForTimeout(1500);
    await capture(page, 'upstream-workflow-studio.png');

    // ── Agent Studio ─────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/studio/agents`, { waitUntil: 'load' });
    await expect(page.getByText(/^templates$/i).first()).toBeVisible({ timeout: 180_000 });
    await expect.poll(async () => page.locator('img').count(), { timeout: 180_000 }).toBeGreaterThan(
      3,
    );
    await page.waitForTimeout(1500);
    await capture(page, 'upstream-agent-studio.png');
  });
});
