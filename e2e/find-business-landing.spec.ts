/**
 * Find Business — Landing page (production).
 *
 * Target: https://go.smartvid.app
 *   NOT https://smartvid.app — that is a different product ("Remix New Editor")
 *   and answers 404 for every /api/personalization/* call.
 *
 * Auth: the personalization APIs are Clerk-gated, so the run relies on the
 *   Playwright `storageState` produced by the auth-state generator for the
 *   https://go.smartvid.app origin. No auth-bypass cookie is used: the
 *   production deployment never honours it.
 *
 * Presentation: the personalization modal opens in Simple Mode (the guided
 *   wizard). The lead-finder surface asserted here — audience buttons,
 *   #business-niche, "Find Local Business", "Use This Business" — lives in
 *   the Advanced Editing (ConfigurationView) presentation, so every test
 *   switches to it before asserting.
 *
 * Honesty rules baked into this file:
 *   - A missing dialog / audience button / result list is a FAILURE.
 *   - An upstream 502/504 from /api/personalization/find-businesses is a
 *     FAILURE that names the upstream failure — never a silent pass.
 *   - `expect(true).toBe(true)` is never used as an assertion.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { resolveDemoAuthStatePath, resolveTargetBaseURL, isLocalDevTarget } from '../playwright.shared';

const BASE = resolveTargetBaseURL();
/** A local dev server honours the dev-only auth-bypass cookie; a
 *  production target must authenticate with a real Clerk session. */
const IS_LOCAL_DEV = isLocalDevTarget(BASE);
const LANDING_URL = `${BASE}/personalization-demo?test=true`;

const PRODUCTION_AUTH_STATE_PATH = path.join(
  process.cwd(),
  'playwright/.clerk',
  'smartvideo-demo-https_go_smartvid_app.json',
);

const DIALOG_TIMEOUT_MS = 45_000;
const SEARCH_TIMEOUT_MS = 90_000;

/** Industry / location pairs the lead finder has to cover. */
const DISCOVERY_CASES = [
  { niche: 'restaurants-food', location: 'Miami, Florida', label: 'restaurants in Miami, Florida' },
  { niche: 'healthcare-medical', location: 'Los Angeles, California', label: 'dentists in Los Angeles, California' },
  { niche: 'real-estate', location: 'New York, New York', label: 'real estate in New York, New York' },
  { niche: 'automotive', location: 'Austin, Texas', label: 'automotive businesses in Austin, Texas' },
];

// ── Clerk storage-state guard ───────────────────────────────────────────────
// A missing storage state is a setup failure, never a reason to skip. The
// check runs at module scope because Playwright creates the browser context
// (and would raise a bare ENOENT) before any beforeEach hook runs.
function assertAuthStatePresent(): void {
  const authStatePath = resolveDemoAuthStatePath(BASE);
  if (fs.existsSync(authStatePath)) return;
  throw new Error(
    [
      'Clerk storage state is missing, so the Clerk-gated personalization APIs cannot be called.',
      `Resolved storage state path : ${authStatePath}`,
      `Production auth state file  : ${PRODUCTION_AUTH_STATE_PATH}`,
      `Run the auth-state generator for ${BASE} (DEMO_BASE_URL=${BASE}) before running this spec.`,
    ].join('\n'),
  );
}

assertAuthStatePresent();

// ── Diagnostics ─────────────────────────────────────────────────────────────
interface Diagnostics {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  apiResponses: string[];
}

function collectDiagnostics(page: Page): Diagnostics {
  const diagnostics: Diagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    apiResponses: [],
  };

  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    diagnostics.failedRequests.push(
      `${request.method()} ${request.url()} — ${request.failure()?.errorText ?? 'unknown failure'}`,
    );
  });
  page.on('response', (response) => {
    if (response.url().includes('/api/personalization/')) {
      diagnostics.apiResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  return diagnostics;
}

function formatDiagnostics(diagnostics: Diagnostics): string {
  return [
    `console errors (${diagnostics.consoleErrors.length}): ${diagnostics.consoleErrors.slice(0, 8).join(' || ') || 'none'}`,
    `page errors (${diagnostics.pageErrors.length}): ${diagnostics.pageErrors.slice(0, 8).join(' || ') || 'none'}`,
    `failed requests (${diagnostics.failedRequests.length}): ${diagnostics.failedRequests.slice(0, 8).join(' || ') || 'none'}`,
    `personalization API responses (${diagnostics.apiResponses.length}): ${diagnostics.apiResponses.slice(0, 12).join(' || ') || 'none'}`,
  ].join('\n');
}

/**
 * Returns the full text of the error panel (heading + upstream message) that
 * contains the given banner, so failures can name the upstream error instead
 * of only the "Business Search Failed" heading.
 */
async function errorPanelText(banner: Locator): Promise<string> {
  const panel = banner.first().locator('xpath=ancestor::div[.//p][1]');
  if ((await panel.count()) === 0) {
    return ((await banner.first().textContent()) ?? '').trim();
  }
  return ((await panel.first().textContent()) ?? '').trim();
}

// ── Modal helpers ───────────────────────────────────────────────────────────
async function openPersonalizationDialog(page: Page): Promise<Locator> {
  await page.goto(LANDING_URL);
  await page.waitForLoadState('domcontentloaded');

  const dialogs = page.getByRole('dialog');
  await expect(
    dialogs.first(),
    `The personalization dialog never opened on ${LANDING_URL}. It is rendered by the personalization ` +
      'provider (role="dialog" + aria-labelledby="personalize-title"); if it stays hidden the client ' +
      'bundle failed to hydrate.',
  ).toBeVisible({ timeout: DIALOG_TIMEOUT_MS });

  if ((await dialogs.count()) > 1) {
    const labelled = page.locator('[role="dialog"][aria-labelledby="personalize-title"]');
    await expect(
      labelled,
      `Expected exactly one personalization dialog on ${LANDING_URL}.`,
    ).toHaveCount(1, { timeout: 15_000 });
    return labelled.first();
  }

  const dialog = dialogs.first();
  await expect(
    dialog,
    'The visible dialog is not the personalization dialog (aria-labelledby="personalize-title" is missing).',
  ).toHaveAttribute('aria-labelledby', 'personalize-title', { timeout: 15_000 });

  return dialog;
}

/** Switches the modal from Simple Mode to the Advanced Editing configuration view. */
async function openAdvancedConfiguration(dialog: Locator): Promise<void> {
  const advancedToggle = dialog.getByRole('button', { name: /advanced editing/i });
  if ((await advancedToggle.count()) > 0) {
    await advancedToggle.first().click();
  }

  await expect(
    dialog.getByRole('button', { name: 'Client', exact: true }),
    'The Advanced Editing configuration view did not render the Client Profile audience buttons ' +
      '("Me" / "My Business" / "Client").',
  ).toBeVisible({ timeout: 20_000 });
}

/** Picks the "Client" audience and opens the niche/location search form. */
async function openBusinessSearchForm(dialog: Locator): Promise<void> {
  const clientButton = dialog.getByRole('button', { name: 'Client', exact: true });
  await expect(
    clientButton,
    'The "Client" audience button is missing, so the Find Local Business entry point can never be reached.',
  ).toBeVisible({ timeout: 20_000 });
  await clientButton.click();

  const findLocalBusiness = dialog.getByRole('button', { name: 'Find Local Business', exact: true });
  await expect(
    findLocalBusiness,
    'The "Find Local Business" button did not appear after selecting the "Client" audience.',
  ).toBeVisible({ timeout: 20_000 });
  await findLocalBusiness.click();

  await expect(
    dialog.locator('#business-niche'),
    'The business search form did not open (no #business-niche select).',
  ).toBeVisible({ timeout: 20_000 });
}

// ── Search helpers ──────────────────────────────────────────────────────────
type SearchOutcome = {
  kind: 'results' | 'upstream-error' | 'no-results' | 'no-outcome';
  count: number;
  httpStatus: number | null;
  summary: string;
};

async function runBusinessSearch(
  page: Page,
  dialog: Locator,
  niche: string,
  location: string,
  radius: string,
): Promise<SearchOutcome> {
  await dialog.locator('#business-niche').selectOption(niche);
  await dialog.locator('#business-location').fill(location);

  const responsePromise = page
    .waitForResponse((response) => response.url().includes('/api/personalization/find-businesses'), {
      timeout: SEARCH_TIMEOUT_MS,
    })
    .catch(() => null);

  await dialog.getByRole('button', { name: radius, exact: true }).click();

  const response = await responsePromise;
  const httpStatus = response ? response.status() : null;

  const resultsSummary = dialog.getByText(/businesses found for/i);
  const errorBanner = dialog.getByText(/Business Search Failed/i);

  const outcome = await Promise.race([
    resultsSummary
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => 'results' as const, () => 'none' as const),
    errorBanner
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => 'error' as const, () => 'none' as const),
  ]);

  if (outcome === 'results') {
    const summary = (await resultsSummary.first().textContent()) ?? '';
    const match = summary.match(/(\d+)\s+businesses\s+found\s+for/i);
    return { kind: 'results', count: match ? Number(match[1]) : 0, httpStatus, summary };
  }

  if (outcome === 'error') {
    const summary = await errorPanelText(errorBanner);
    const upstream = httpStatus !== null && httpStatus >= 500;
    return { kind: upstream ? 'upstream-error' : 'no-results', count: 0, httpStatus, summary };
  }

  return { kind: 'no-outcome', count: 0, httpStatus, summary: '' };
}

/** Turns a non-successful search outcome into an explicit, named failure. */
function assertSearchSucceeded(outcome: SearchOutcome, niche: string, location: string): void {
  if (outcome.kind === 'upstream-error') {
    throw new Error(
      `Upstream business search failed for ${niche} in ${location}: ` +
        `POST /api/personalization/find-businesses returned HTTP ${outcome.httpStatus}. ` +
        `Error banner: "${outcome.summary.trim()}". This is an upstream failure and must not be reported as a pass.`,
    );
  }
  if (outcome.kind === 'no-results') {
    throw new Error(
      `Business search returned no businesses for ${niche} in ${location} (HTTP ${outcome.httpStatus}). ` +
        `Banner: "${outcome.summary.trim()}".`,
    );
  }
  if (outcome.kind === 'no-outcome') {
    throw new Error(
      `Business search for ${niche} in ${location} produced neither results nor an error banner ` +
        `(HTTP ${outcome.httpStatus}). The UI never reported the outcome of the search.`,
    );
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────
test.describe('Find Business — Landing page', () => {
  let diagnostics: Diagnostics;

  test.beforeEach(async ({ page }) => {
    assertAuthStatePresent();
    if (IS_LOCAL_DEV) {
      // Dev-only escape hatch, honoured by the local server and by no
      // production deployment. Never sent to a production origin.
      await page.context().addCookies([
        { name: '__e2e_auth_bypass', value: '1', url: BASE },
      ]);
    }
    diagnostics = collectDiagnostics(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return;
    const screenshotPath = testInfo.outputPath('failure.png');
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
    console.error(
      `[find-business-landing failure] ${testInfo.titlePath.join(' > ')}\n` +
        `screenshot: ${screenshotPath}\n${formatDiagnostics(diagnostics)}`,
    );
  });

  for (const discoveryCase of DISCOVERY_CASES) {
    test(`returns real selectable businesses for ${discoveryCase.label}`, async ({ page }) => {
      const dialog = await test.step('open the personalization dialog', () =>
        openPersonalizationDialog(page),
      );

      await test.step('switch to the Advanced Editing configuration view', async () => {
        await openAdvancedConfiguration(dialog);
      });

      await test.step('choose the "Client" audience and open the search form', async () => {
        await openBusinessSearchForm(dialog);
      });

      const outcome = await test.step(
        `search ${discoveryCase.niche} in ${discoveryCase.location}`,
        () =>
          runBusinessSearch(
            page,
            dialog,
            discoveryCase.niche,
            discoveryCase.location,
            '15 mi',
          ),
      );

      console.log(
        `[find-business-landing] ${discoveryCase.niche} in ${discoveryCase.location} -> ` +
          `${outcome.count} businesses (HTTP ${outcome.httpStatus})`,
      );

      await test.step('assert the search produced selectable results', async () => {
        assertSearchSucceeded(outcome, discoveryCase.niche, discoveryCase.location);
        expect(
          outcome.count,
          `No businesses were returned for ${discoveryCase.niche} in ${discoveryCase.location}.`,
        ).toBeGreaterThan(0);

        const useButtons = dialog.getByRole('button', { name: 'Use This Business', exact: true });
        await expect(
          useButtons,
          `The result list for ${discoveryCase.niche} in ${discoveryCase.location} has no "Use This Business" buttons.`,
        ).toHaveCount(outcome.count, { timeout: 15_000 });
      });

      await test.step('select a business and confirm the selection is shown', async () => {
        const useButtons = dialog.getByRole('button', { name: 'Use This Business', exact: true });
        await useButtons.first().click();

        const selected = dialog.getByText(/^Selected:/);
        await expect(
          selected,
          'The "Selected: <business>" summary did not appear after choosing a business.',
        ).toBeVisible({ timeout: 20_000 });

        const selectedText = ((await selected.first().textContent()) ?? '').trim();
        const selectedName = selectedText.replace(/^Selected:\s*/, '').trim();
        expect(selectedName.length, 'The selected business summary is empty.').toBeGreaterThan(0);
      });
    });
  }

  test('blocks the search until both a niche and a location are provided', async ({ page }) => {
    const dialog = await test.step('open the personalization dialog', () =>
      openPersonalizationDialog(page),
    );
    await test.step('switch to the Advanced Editing configuration view', async () => {
      await openAdvancedConfiguration(dialog);
    });
    await test.step('choose the "Client" audience and open the search form', async () => {
      await openBusinessSearchForm(dialog);
    });

    await test.step('assert the radius buttons are disabled while the form is empty', async () => {
      for (const radius of ['5 mi', '10 mi', '15 mi', '25 mi', '50 mi']) {
        const radiusButton = dialog.getByRole('button', { name: radius, exact: true });
        await expect(
          radiusButton,
          `The "${radius}" radius button is missing from the search form.`,
        ).toBeVisible({ timeout: 15_000 });
        await expect(
          radiusButton,
          `The "${radius}" radius button must stay disabled while the niche and location are empty.`,
        ).toBeDisabled();
      }
    });

    await test.step('assert no search request is fired by the disabled form', async () => {
      const requests: string[] = [];
      const listener = (request: { url(): string }) => {
        if (request.url().includes('/api/personalization/find-businesses')) requests.push(request.url());
      };
      page.on('request', listener);

      await dialog.getByRole('button', { name: '15 mi', exact: true }).click({ force: true });
      page.off('request', listener);

      expect(
        requests.length,
        'A business search request was fired even though the niche and location were empty.',
      ).toBe(0);
      await expect(
        dialog.getByText(/businesses found for/i),
        'An empty form produced search results.',
      ).toHaveCount(0, { timeout: 10_000 });
    });
  });

  test('transfers the selected business into the Personalization client profile', async ({ page }) => {
    const dialog = await test.step('open the personalization dialog', () =>
      openPersonalizationDialog(page),
    );
    await test.step('switch to the Advanced Editing configuration view', async () => {
      await openAdvancedConfiguration(dialog);
    });
    await test.step('choose the "Client" audience and open the search form', async () => {
      await openBusinessSearchForm(dialog);
    });

    const outcome = await test.step('search restaurants in Miami, Florida', () =>
      runBusinessSearch(page, dialog, 'restaurants-food', 'Miami, Florida', '15 mi'),
    );

    console.log(
      `[find-business-landing] restaurants-food in Miami, Florida -> ${outcome.count} businesses ` +
        `(HTTP ${outcome.httpStatus})`,
    );

    await test.step('assert the search produced selectable results', async () => {
      assertSearchSucceeded(outcome, 'restaurants-food', 'Miami, Florida');
      expect(outcome.count, 'No businesses were returned for restaurants in Miami, Florida.').toBeGreaterThan(0);
    });

    await test.step('select the business and check the client profile fields', async () => {
      const useButtons = dialog.getByRole('button', { name: 'Use This Business', exact: true });
      await useButtons.first().click();

      const selected = dialog.getByText(/^Selected:/);
      await expect(
        selected,
        'The "Selected: <business>" summary did not appear after choosing a business.',
      ).toBeVisible({ timeout: 20_000 });

      const selectedText = ((await selected.first().textContent()) ?? '').trim();
      const selectedName = selectedText.replace(/^Selected:\s*/, '').trim();
      expect(selectedName.length, 'The selected business summary is empty.').toBeGreaterThan(0);

      const businessNameField = dialog.getByPlaceholder('ABC Roofing');
      await expect(
        businessNameField,
        'The Business Name field of the client profile is missing.',
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        businessNameField,
        `The Business Name field does not carry the selected business ("${selectedName}").`,
      ).toHaveValue(selectedName, { timeout: 15_000 });

      const websiteField = dialog.getByPlaceholder('https://joesroofing.com');
      await expect(
        websiteField,
        'The Website field of the client profile is missing.',
      ).toBeVisible({ timeout: 15_000 });
      const websiteValue = (await websiteField.inputValue()).trim();
      expect(
        websiteValue === '' || /^https?:\/\//i.test(websiteValue),
        `The Website field holds an unusable value: "${websiteValue}".`,
      ).toBe(true);
    });
  });

  test('starts a fresh search with "New Search" and returns new results', async ({ page }) => {
    const dialog = await test.step('open the personalization dialog', () =>
      openPersonalizationDialog(page),
    );
    await test.step('switch to the Advanced Editing configuration view', async () => {
      await openAdvancedConfiguration(dialog);
    });
    await test.step('choose the "Client" audience and open the search form', async () => {
      await openBusinessSearchForm(dialog);
    });

    const first = await test.step('first search: restaurants in Miami, Florida', () =>
      runBusinessSearch(page, dialog, 'restaurants-food', 'Miami, Florida', '15 mi'),
    );
    console.log(
      `[find-business-landing] first search restaurants-food in Miami, Florida -> ${first.count} businesses ` +
        `(HTTP ${first.httpStatus})`,
    );
    assertSearchSucceeded(first, 'restaurants-food', 'Miami, Florida');
    expect(first.count, 'The first search returned no businesses.').toBeGreaterThan(0);

    await test.step('reset the search with "New Search"', async () => {
      const newSearch = dialog.getByRole('button', { name: 'New Search', exact: true });
      await expect(newSearch, 'The "New Search" button is missing from the result list.').toBeVisible({
        timeout: 15_000,
      });
      await newSearch.click();

      const findLocalBusiness = dialog.getByRole('button', { name: 'Find Local Business', exact: true });
      await expect(
        findLocalBusiness,
        '"New Search" did not reset the lead finder back to its entry point.',
      ).toBeVisible({ timeout: 20_000 });
      await findLocalBusiness.click();
      await expect(
        dialog.locator('#business-niche'),
        'The business search form did not reopen after "New Search".',
      ).toBeVisible({ timeout: 20_000 });
    });

    const second = await test.step('second search: real estate in Orlando, Florida', () =>
      runBusinessSearch(page, dialog, 'real-estate', 'Orlando, Florida', '15 mi'),
    );
    console.log(
      `[find-business-landing] second search real-estate in Orlando, Florida -> ${second.count} businesses ` +
        `(HTTP ${second.httpStatus})`,
    );

    await test.step('assert the repeated search produced selectable results', async () => {
      assertSearchSucceeded(second, 'real-estate', 'Orlando, Florida');
      expect(second.count, 'The repeated search returned no businesses.').toBeGreaterThan(0);

      const useButtons = dialog.getByRole('button', { name: 'Use This Business', exact: true });
      await expect(
        useButtons,
        'The repeated search produced no "Use This Business" buttons.',
      ).toHaveCount(second.count, { timeout: 15_000 });
    });
  });
});
