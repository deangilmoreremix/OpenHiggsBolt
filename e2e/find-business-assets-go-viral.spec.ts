/**
 * Find Business Assets — Go-Viral Studio (production).
 *
 * Target: https://go.smartvid.app
 *   NOT https://smartvid.app — that is a different product ("Remix New Editor")
 *   and answers 404 for every /api/personalization/* call.
 *
 * Auth: /api/personalization/discover-assets and /api/personalization/
 *   download-image are Clerk-gated, so the run relies on the Playwright
 *   `storageState` produced by the auth-state generator for the
 *   https://go.smartvid.app origin. No auth-bypass cookie is used: the
 *   production deployment never honours it.
 *
 * Presentation: the personalization modal opens in Simple Mode (the guided
 *   wizard). The asset-discovery surface asserted here — "Find Business
 *   Assets", the Discovered Assets review, "Use Selected Assets" — lives in
 *   the Advanced Editing (ConfigurationView) presentation, so every test
 *   switches to it before asserting.
 *
 * Honesty rules baked into this file:
 *   - Zero "Personalize This Demo" buttons, a missing dialog, a missing
 *     control, an empty asset list or a discovery that ends in an error is a
 *     FAILURE with a named reason.
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
const STUDIO_URL = `${BASE}/studio/go-ai-viral`;

const PRODUCTION_AUTH_STATE_PATH = path.join(
  process.cwd(),
  'playwright/.clerk',
  'smartvideo-demo-https_go_smartvid_app.json',
);

const DIALOG_TIMEOUT_MS = 45_000;
const SEARCH_TIMEOUT_MS = 90_000;
const FEED_TIMEOUT_MS = 60_000;
/** The discovery route aborts after 120s and the client then polls for a job. */
const DISCOVERY_TIMEOUT_MS = 180_000;

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
/**
 * The signed-in studio opens a first-login "Welcome to SmartVideo GO" overlay
 * that asks for a MuAPI key when the account has no key stored. It is a
 * full-screen modal, so it swallows the pointer events of the feed underneath
 * and every "Personalize This Demo" click hangs until the test times out.
 * The overlay carries a Close button, so dismiss it before using the feed.
 *
 * `waitMs` bounds how long the helper waits for the overlay to show up: the
 * overlay mounts only after the stored-key restore request resolves.
 */
async function dismissFirstLoginApiKeyOverlay(page: Page, waitMs = 500): Promise<boolean> {
  const muapiInput = page.locator('input[placeholder="Paste your MuAPI key here..."]');
  const overlay = muapiInput.locator('xpath=ancestor::div[contains(@class,"z-[200]")][1]');
  const closeButton = overlay.getByRole('button', { name: 'Close', exact: true });

  const appeared = await muapiInput
    .first()
    .waitFor({ state: 'visible', timeout: waitMs })
    .then(() => true, () => false);
  if (!appeared) return false;

  await expect(
    closeButton,
    'The first-login MuAPI key overlay is open but exposes no Close button, so the Go-Viral feed cannot be reached.',
  ).toBeVisible({ timeout: 15_000 });
  await closeButton.click();
  await expect(
    muapiInput,
    'The first-login MuAPI key overlay did not close.',
  ).toHaveCount(0, { timeout: 15_000 });
  return true;
}

async function openPersonalizationFromStudio(page: Page): Promise<Locator> {
  await page.goto(STUDIO_URL);
  await page.waitForLoadState('domcontentloaded');

  // The overlay mounts after the stored-key restore request resolves, so give
  // it a window to appear before the feed is touched.
  await dismissFirstLoginApiKeyOverlay(page, 20_000);

  const personalizeButtons = page.getByRole('button', { name: 'Personalize This Demo', exact: true });
  const appeared = await personalizeButtons
    .first()
    .waitFor({ state: 'visible', timeout: FEED_TIMEOUT_MS })
    .then(() => true, () => false);

  if (!appeared) {
    throw new Error(
      `The Go-Viral feed rendered no "Personalize This Demo" button on ${STUDIO_URL} ` +
        `(the browser ended up on ${page.url()}). /studio is Clerk-protected, so a signed-in storage state ` +
        'is required, and the feed API (/api/go-ai-viral/prompts) must answer before a demo can be personalized.',
    );
  }

  const buttonCount = await personalizeButtons.count();
  if (buttonCount === 0) {
    throw new Error(
      `The Go-Viral feed rendered no "Personalize This Demo" button on ${STUDIO_URL}. ` +
        'A feed without a personalize entry point cannot be exercised.',
    );
  }
  console.log(`[find-business-assets-go-viral] "Personalize This Demo" buttons on the feed: ${buttonCount}`);

  // A late-mounting overlay would swallow the click, so dismiss it and retry
  // instead of letting the click hang until the test timeout.
  await expect(
    async () => {
      await dismissFirstLoginApiKeyOverlay(page, 500);
      await personalizeButtons.first().click({ timeout: 10_000 });
    },
    'The Go-Viral feed never accepted the click on "Personalize This Demo".',
  ).toPass({ timeout: 60_000, intervals: [500, 1000, 2000] });

  const dialogs = page.getByRole('dialog');
  await expect(
    dialogs.first(),
    'The personalization dialog did not open after clicking "Personalize This Demo".',
  ).toBeVisible({ timeout: DIALOG_TIMEOUT_MS });

  if ((await dialogs.count()) > 1) {
    const labelled = page.locator('[role="dialog"][aria-labelledby="personalize-title"]');
    await expect(
      labelled,
      'Expected exactly one personalization dialog on the Go-Viral studio.',
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
  /** Retry-After the route reported for a 429, in milliseconds. */
  retryAfterMs?: number;
  /** The businesses the search actually returned, used to pick a live website. */
  businesses: Array<{ name?: string; website?: string }>;
};

/**
 * The free Lead Finder allows 10 searches per minute per client, so a full
 * E2E run trips the limit. A 429 is therefore EXPECTED here and is retried
 * after the window the route itself reports, instead of failing the test.
 * Only the rate limit is retried: an upstream error still fails the test.
 */
const RATE_LIMIT_MAX_ATTEMPTS = 8;

async function runBusinessSearch(
  page: Page,
  dialog: Locator,
  niche: string,
  location: string,
  radius: string,
): Promise<SearchOutcome> {
  let last: SearchOutcome | null = null;

  for (let attempt = 0; attempt < RATE_LIMIT_MAX_ATTEMPTS; attempt++) {
    last = await runBusinessSearchOnce(page, dialog, niche, location, radius);
    if (last.httpStatus !== 429) return last;

    const waitMs = Math.min(90_000, Math.max(15_000, last.retryAfterMs ?? 0) + 2_000);
    console.log(
      `[rate-limit] search for ${niche} @ ${location} was rate limited (attempt ${attempt + 1}); ` +
        `waiting ${Math.round(waitMs / 1000)}s`,
    );
    await page.waitForTimeout(waitMs);

    const tryAgain = dialog.getByRole('button', { name: 'Try Again', exact: true });
    if (await tryAgain.isVisible().catch(() => false)) {
      await tryAgain.click();
      await dialog.locator('#business-niche').selectOption(niche).catch(() => {});
      await dialog.locator('#business-location').fill(location).catch(() => {});
    }
  }

  return last as SearchOutcome;
}

async function runBusinessSearchOnce(
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
  const retryAfterMs = (() => {
    // Playwright exposes the response headers as a plain object with
    // lower-cased keys, not as a Headers instance.
    const header = response?.headers()?.['retry-after'];
    const seconds = header ? Number(header) : Number.NaN;
    return Number.isFinite(seconds) ? seconds * 1000 : undefined;
  })();
  let businesses: Array<{ name?: string; website?: string }> = [];
  if (response) {
    try {
      const body = await response.json();
      if (Array.isArray(body?.businesses)) businesses = body.businesses;
    } catch {
      // A non-JSON body is reported by the assertions that follow.
    }
  }

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
    return { kind: 'results', count: match ? Number(match[1]) : 0, httpStatus, summary, retryAfterMs, businesses };
  }

  if (outcome === 'error') {
    const summary = await errorPanelText(errorBanner);
    const upstream = httpStatus !== null && httpStatus >= 500;
    return { kind: upstream ? 'upstream-error' : 'no-results', count: 0, httpStatus, summary, retryAfterMs };
  }

  return { kind: 'no-outcome', count: 0, httpStatus, summary: '' };
}

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

/** Finds the result card that carries the given OpenStreetMap badge and returns its "Use This Business" button. */
function resultCardByBadge(dialog: Locator, badgeText: string): Locator {
  const badge = dialog.getByText(badgeText, { exact: true }).first();
  return badge.locator(
    `xpath=ancestor::div[.//button[contains(normalize-space(.), "Use This Business")]][1]`,
  );
}

/**
 * Picks a search result whose website actually answers.
 *
 * A business directory lists the website a business had when it was mapped.
 * That domain can have lapsed, been parked, or stopped resolving, and an
 * unreachable site can never produce assets. The candidates are probed
 * instead of taking the first one, so the discovery step is always
 * exercised against a LIVE site.
 *
 * If no candidate answers the test FAILS with the probed URLs - it is never
 * silently skipped.
 */
async function selectBusinessWithLiveWebsite(
  page: Page,
  dialog: Locator,
  businesses: Array<{ name?: string; website?: string }>,
): Promise<string> {
  const candidates = businesses.filter((b) => Boolean(b.website));
  expect(
    candidates.length,
    'None of the search results lists a website, so the asset-discovery path cannot be exercised.',
  ).toBeGreaterThan(0);

  const probed: string[] = [];
  for (const candidate of candidates.slice(0, 8)) {
    const url = candidate.website as string;
    const alive = await page
      .request.head(url, { timeout: 20_000, failOnStatusCode: false })
      .then((response) => response.status() < 500)
      .catch(() => false);
    probed.push(`${url} -> ${alive ? 'alive' : 'unreachable'}`);
    if (!alive) continue;

    await dialog.getByText(candidate.name as string, { exact: true }).first().click();

    const selected = dialog.getByText(/^Selected:/);
    await expect(
      selected,
      `The "Selected: <business>" summary did not appear after choosing ${candidate.name}.`,
    ).toBeVisible({ timeout: 20_000 });

    const websiteField = dialog.getByPlaceholder('https://joesroofing.com');
    await expect(websiteField, 'The Website field of the client profile is missing.').toBeVisible({
      timeout: 15_000,
    });
    const value = (await websiteField.inputValue()).trim();
    expect(
      value,
      `The Website field is empty after selecting ${candidate.name}.`,
    ).toContain('http');
    return value;
  }

  throw new Error(
    `None of the listed websites answered, so the asset-discovery path cannot be exercised. Probed: ${probed.join(' | ')}`,
  );
}

// ── Asset discovery helpers ─────────────────────────────────────────────────
type DiscoveryOutcome = {
  kind: 'assets' | 'error' | 'no-outcome';
  httpStatus: number | null;
  assetCount: number;
  message: string;
};

async function startAssetDiscovery(page: Page, dialog: Locator): Promise<DiscoveryOutcome> {
  const findAssetsButton = dialog.getByRole('button', { name: 'Find Business Assets', exact: true });
  await expect(
    findAssetsButton,
    'The "Find Business Assets" button is missing from the Client Profile step.',
  ).toBeVisible({ timeout: 20_000 });

  const responsePromise = page
    .waitForResponse(
      (response) =>
        response.url().includes('/api/personalization/discover-assets') &&
        !response.url().includes('/status'),
      { timeout: DISCOVERY_TIMEOUT_MS },
    )
    .catch(() => null);

  await findAssetsButton.click();

  const response = await responsePromise;
  const httpStatus = response ? response.status() : null;
  const retryAfterMs = (() => {
    // Playwright exposes the response headers as a plain object with
    // lower-cased keys, not as a Headers instance.
    const header = response?.headers()?.['retry-after'];
    const seconds = header ? Number(header) : Number.NaN;
    return Number.isFinite(seconds) ? seconds * 1000 : undefined;
  })();
  let businesses: Array<{ name?: string; website?: string }> = [];
  if (response) {
    try {
      const body = await response.json();
      if (Array.isArray(body?.businesses)) businesses = body.businesses;
    } catch {
      // A non-JSON body is reported by the assertions that follow.
    }
  }

  const discoveredHeading = dialog.getByRole('heading', { name: 'Discovered Assets', exact: true });
  const errorBanner = dialog.getByText(/couldn.t find business assets/i);

  const outcome = await Promise.race([
    discoveredHeading
      .waitFor({ state: 'visible', timeout: DISCOVERY_TIMEOUT_MS })
      .then(() => 'assets' as const, () => 'none' as const),
    errorBanner
      .waitFor({ state: 'visible', timeout: DISCOVERY_TIMEOUT_MS })
      .then(() => 'error' as const, () => 'none' as const),
  ]);

  if (outcome === 'assets') {
    const assetCount = await dialog.locator('#pz-discovered img').count();
    return { kind: 'assets', httpStatus, assetCount, message: '' };
  }

  if (outcome === 'error') {
    const message = await errorPanelText(errorBanner);
    return { kind: 'error', httpStatus, assetCount: 0, message };
  }

  return { kind: 'no-outcome', httpStatus, assetCount: 0, message: '' };
}

function assertDiscoverySucceeded(outcome: DiscoveryOutcome, website: string): void {
  if (outcome.kind === 'error') {
    throw new Error(
      `Asset discovery for ${website} ended in a terminal error ` +
        `(POST /api/personalization/discover-assets -> HTTP ${outcome.httpStatus}): "${outcome.message}". ` +
        'No assets could be reviewed or imported.',
    );
  }
  if (outcome.kind === 'no-outcome') {
    throw new Error(
      `Asset discovery for ${website} reported neither a Discovered Assets list nor an error banner ` +
        `(HTTP ${outcome.httpStatus}).`,
    );
  }
}

async function imageSources(locator: Locator): Promise<string[]> {
  return locator.evaluateAll((elements) =>
    elements.map((element) => (element as HTMLImageElement).getAttribute('src') || ''),
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────
test.describe('Find Business Assets — Go-Viral Studio', () => {
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
      `[find-business-assets-go-viral failure] ${testInfo.titlePath.join(' > ')}\n` +
        `screenshot: ${screenshotPath}\n${formatDiagnostics(diagnostics)}`,
    );
  });

  test('discovers the assets of a business with a website and imports them into Personalization', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const dialog = await test.step('open the personalization dialog from the studio feed', () =>
      openPersonalizationFromStudio(page),
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
      `[find-business-assets-go-viral] restaurants-food in Miami, Florida -> ${outcome.count} businesses ` +
        `(HTTP ${outcome.httpStatus})`,
    );

    await test.step('assert the search produced selectable results', async () => {
      assertSearchSucceeded(outcome, 'restaurants-food', 'Miami, Florida');
      expect(outcome.count, 'No businesses were returned for restaurants in Miami, Florida.').toBeGreaterThan(0);
    });

    const website = await test.step('select a business whose website actually answers', async () =>
      selectBusinessWithLiveWebsite(page, dialog, outcome.businesses),
    );

    const discovery = await test.step('start asset discovery', () => startAssetDiscovery(page, dialog));
    console.log(
      `[find-business-assets-go-viral] asset discovery for ${website} -> ${discovery.kind} ` +
        `(HTTP ${discovery.httpStatus}, ${discovery.assetCount} assets)`,
    );

    await test.step('assert the discovered assets are usable', async () => {
      assertDiscoverySucceeded(discovery, website);
      expect(discovery.assetCount, `No assets were discovered for ${website}.`).toBeGreaterThan(0);

      const sources = await imageSources(dialog.locator('#pz-discovered img'));
      expect(sources.length, 'The Discovered Assets section rendered no images.').toBeGreaterThan(0);

      for (const source of sources) {
        expect(source.length, `A discovered asset has an empty src ("${source}").`).toBeGreaterThan(0);
        expect(
          /^(https?:\/\/|data:image\/)/i.test(source),
          `A discovered asset has an unusable src ("${source}").`,
        ).toBe(true);
      }
    });

    await test.step('select an asset and import it into Personalization', async () => {
      // An asset's toggle is labelled "Select" while it is unselected and
      // "Deselect" once it is selected, and discovered assets can arrive
      // pre-selected — so both labels have to be considered, and a toggle
      // that already reads "Deselect" must NOT be clicked (that would undo
      // the selection).
      const unselectedToggle = dialog.locator('#pz-discovered button[aria-label="Select"]');
      const selectedToggle = dialog.locator('#pz-discovered button[aria-label="Deselect"]');

      await expect(
        unselectedToggle.or(selectedToggle).first(),
        'The Discovered Assets section rendered no asset toggle.',
      ).toBeVisible({ timeout: 20_000 });

      if ((await unselectedToggle.count()) > 0) {
        await unselectedToggle.first().click();
      }

      const useSelected = dialog.getByRole('button', { name: 'Use Selected Assets', exact: true });
      await expect(
        useSelected,
        'The "Use Selected Assets" button is missing from the Discovered Assets section.',
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        useSelected,
        'The "Use Selected Assets" button stayed disabled after selecting an asset.',
      ).toBeEnabled({ timeout: 15_000 });
      await useSelected.click();

      const confirmation = dialog.getByText(/\d+ assets? added/i);
      await expect(
        confirmation,
        'The import confirmation ("<n> assets added") never appeared.',
      ).toBeVisible({ timeout: 30_000 });
    });

    await test.step('assert the imported asset persists across the personalization steps', async () => {
      const before = await imageSources(dialog.locator('#pz-client-assets img'));
      expect(
        before.filter((source) => source.length > 0).length,
        'The imported asset did not appear in the Client Assets section.',
      ).toBeGreaterThan(0);

      const nav = dialog.getByRole('navigation', { name: 'Personalization sections' });
      await expect(
        nav,
        'The personalization section navigation is missing.',
      ).toBeVisible({ timeout: 15_000 });

      await nav.getByRole('link', { name: 'Business', exact: true }).click();
      await expect(dialog.locator('#pz-content'), 'The Business step did not open.').toBeVisible({
        timeout: 15_000,
      });

      await nav.getByRole('link', { name: 'Client Assets', exact: true }).click();
      await expect(
        dialog.locator('#pz-client-assets'),
        'The Client Assets step did not open.',
      ).toBeVisible({ timeout: 15_000 });

      const after = await imageSources(dialog.locator('#pz-client-assets img'));
      expect(
        after,
        'The imported assets changed after navigating between the personalization steps.',
      ).toEqual(before);
      expect(
        after.filter((source) => source.length > 0).length,
        'The imported asset disappeared after navigating between the personalization steps.',
      ).toBeGreaterThan(0);
    });
  });

  test('a business without a website cannot start asset discovery', async ({ page }) => {
    const dialog = await test.step('open the personalization dialog from the studio feed', () =>
      openPersonalizationFromStudio(page),
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
    assertSearchSucceeded(outcome, 'restaurants-food', 'Miami, Florida');
    expect(outcome.count, 'No businesses were returned for restaurants in Miami, Florida.').toBeGreaterThan(0);

    await test.step('select a business without a website (or clear the website field)', async () => {
      const noWebsiteCard = resultCardByBadge(dialog, 'Not listed in OpenStreetMap');
      const websiteField = dialog.getByPlaceholder('https://joesroofing.com');

      if ((await noWebsiteCard.count()) > 0 && (await noWebsiteCard.first().isVisible())) {
        await noWebsiteCard
          .first()
          .getByRole('button', { name: 'Use This Business', exact: true })
          .click();
        console.log(
          '[find-business-assets-go-viral] selected a business with no website listed in OpenStreetMap',
        );
      } else {
        await dialog.getByRole('button', { name: 'Use This Business', exact: true }).first().click();
        await websiteField.fill('');
        console.log(
          '[find-business-assets-go-viral] every result listed a website, so the website field was cleared instead',
        );
      }

      await expect(
        dialog.getByText(/^Selected:/),
        'The "Selected: <business>" summary did not appear after choosing a business.',
      ).toBeVisible({ timeout: 20_000 });
    });

    await test.step('assert the discovery button is disabled and fires no request', async () => {
      const websiteField = dialog.getByPlaceholder('https://joesroofing.com');
      const websiteValue = (await websiteField.inputValue()).trim();
      if (websiteValue.length > 0) {
        await websiteField.fill('');
      }

      const findAssetsButton = dialog.getByRole('button', { name: 'Find Business Assets', exact: true });
      await expect(
        findAssetsButton,
        'The "Find Business Assets" button is missing from the Client Profile step.',
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        findAssetsButton,
        'The "Find Business Assets" button must be disabled when no website is known.',
      ).toBeDisabled({ timeout: 15_000 });

      const requests: string[] = [];
      const listener = (request: { url(): string }) => {
        if (request.url().includes('/api/personalization/discover-assets')) requests.push(request.url());
      };
      page.on('request', listener);
      await findAssetsButton.click({ force: true });
      page.off('request', listener);

      expect(
        requests.length,
        'A discover-assets request was fired even though no website is known.',
      ).toBe(0);
    });
  });

  test('an empty website URL cannot start asset discovery', async ({ page }) => {
    const dialog = await test.step('open the personalization dialog from the studio feed', () =>
      openPersonalizationFromStudio(page),
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
    assertSearchSucceeded(outcome, 'restaurants-food', 'Miami, Florida');
    expect(outcome.count, 'No businesses were returned for restaurants in Miami, Florida.').toBeGreaterThan(0);

    await test.step('select a business and empty the website field', async () => {
      await dialog.getByRole('button', { name: 'Use This Business', exact: true }).first().click();
      await expect(
        dialog.getByText(/^Selected:/),
        'The "Selected: <business>" summary did not appear after choosing a business.',
      ).toBeVisible({ timeout: 20_000 });

      const websiteField = dialog.getByPlaceholder('https://joesroofing.com');
      await websiteField.fill('');
      await expect(websiteField, 'The website field does not hold an empty value.').toHaveValue('', {
        timeout: 15_000,
      });
    });

    await test.step('assert the discovery button is disabled and no error is raised', async () => {
      const findAssetsButton = dialog.getByRole('button', { name: 'Find Business Assets', exact: true });
      await expect(
        findAssetsButton,
        'The "Find Business Assets" button is missing from the Client Profile step.',
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        findAssetsButton,
        'The "Find Business Assets" button must be disabled for an empty website URL.',
      ).toBeDisabled({ timeout: 15_000 });

      await expect(
        dialog.getByText(/couldn.t find business assets/i),
        'An empty website URL produced a discovery error banner.',
      ).toHaveCount(0, { timeout: 10_000 });
    });
  });

  test('an invalid website URL surfaces a clean terminal error', async ({ page }) => {
    const dialog = await test.step('open the personalization dialog from the studio feed', () =>
      openPersonalizationFromStudio(page),
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
    assertSearchSucceeded(outcome, 'restaurants-food', 'Miami, Florida');
    expect(outcome.count, 'No businesses were returned for restaurants in Miami, Florida.').toBeGreaterThan(0);

    await test.step('select a business and enter an invalid URL', async () => {
      await dialog.getByRole('button', { name: 'Use This Business', exact: true }).first().click();
      await expect(
        dialog.getByText(/^Selected:/),
        'The "Selected: <business>" summary did not appear after choosing a business.',
      ).toBeVisible({ timeout: 20_000 });

      const websiteField = dialog.getByPlaceholder('https://joesroofing.com');
      await websiteField.fill('not-a-valid-url');
      await expect(websiteField, 'The website field does not hold the invalid URL.').toHaveValue(
        'not-a-valid-url',
        { timeout: 15_000 },
      );
    });

    await test.step('assert the invalid URL is rejected with a terminal error', async () => {
      const findAssetsButton = dialog.getByRole('button', { name: 'Find Business Assets', exact: true });
      await expect(
        findAssetsButton,
        'The "Find Business Assets" button is missing from the Client Profile step.',
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        findAssetsButton,
        'The "Find Business Assets" button must be enabled for a non-empty (even invalid) URL.',
      ).toBeEnabled({ timeout: 15_000 });

      const responsePromise = page
        .waitForResponse(
          (response) =>
            response.url().includes('/api/personalization/discover-assets') &&
            !response.url().includes('/status'),
          { timeout: DISCOVERY_TIMEOUT_MS },
        )
        .catch(() => null);

      await findAssetsButton.click();

      const response = await responsePromise;
      expect(
        response,
        'No request was sent to /api/personalization/discover-assets for the invalid URL.',
      ).not.toBeNull();

      // The URL gate accepts a schemeless host ("joes.com" is what a business
      // directory hands over) and only rejects what it must: a non-http(s)
      // scheme, an over-long string or a private/loopback/metadata address.
      // So an unresolvable host is accepted as a DISCOVERY JOB (202) and has
      // to reach a clean terminal error, while a syntactically impossible
      // input is rejected outright (400). Either way the request must not
      // hang and must not produce a Discovered Assets list.
      const status = response ? response.status() : null;
      expect(
        status === 400 || status === 202,
        `The invalid website URL produced HTTP ${status}; expected a 400 rejection or a 202 discovery job.`,
      ).toBe(true);

      const errorBanner = dialog.getByText(/couldn.t find business assets/i);
      await expect(
        errorBanner,
        'The invalid website URL did not produce the "We couldn\'t find business assets" error banner.',
      ).toBeVisible({ timeout: 30_000 });

      const bannerText = await errorPanelText(errorBanner);
      expect(
        /invalid website url|not.*find business assets|discover/i.test(bannerText),
        `The error banner does not explain the failure ("${bannerText}").`,
      ).toBe(true);

      await expect(
        dialog.getByRole('heading', { name: 'Discovered Assets', exact: true }),
        'The invalid website URL still produced a Discovered Assets list.',
      ).toHaveCount(0, { timeout: 10_000 });
    });
  });

  test('a repeated search returns fresh results and a second discovery run is refused while one is in flight', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    const dialog = await test.step('open the personalization dialog from the studio feed', () =>
      openPersonalizationFromStudio(page),
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
      `[find-business-assets-go-viral] first search restaurants-food in Miami, Florida -> ` +
        `${first.count} businesses (HTTP ${first.httpStatus})`,
    );
    assertSearchSucceeded(first, 'restaurants-food', 'Miami, Florida');
    expect(first.count, 'The first search returned no businesses.').toBeGreaterThan(0);

    await test.step('reset with "New Search" and run a second search', async () => {
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

      const second = await runBusinessSearch(
        page,
        dialog,
        'real-estate',
        'Orlando, Florida',
        '15 mi',
      );
      console.log(
        `[find-business-assets-go-viral] second search real-estate in Orlando, Florida -> ` +
          `${second.count} businesses (HTTP ${second.httpStatus})`,
      );
      assertSearchSucceeded(second, 'real-estate', 'Orlando, Florida');
      expect(second.count, 'The repeated search returned no businesses.').toBeGreaterThan(0);
    });

    await test.step('select a business and start discovery', async () => {
      await dialog.getByRole('button', { name: 'Use This Business', exact: true }).first().click();
      await expect(
        dialog.getByText(/^Selected:/),
        'The "Selected: <business>" summary did not appear after choosing a business.',
      ).toBeVisible({ timeout: 20_000 });

      const websiteField = dialog.getByPlaceholder('https://joesroofing.com');
      const website = (await websiteField.inputValue()).trim();
      if (!/^https?:\/\//i.test(website)) {
        await websiteField.fill('https://example.com');
      }

      const findAssetsButton = dialog.getByRole('button', { name: 'Find Business Assets', exact: true });
      await expect(
        findAssetsButton,
        'The "Find Business Assets" button is missing from the Client Profile step.',
      ).toBeVisible({ timeout: 20_000 });

      await findAssetsButton.click();

      const busyButton = dialog.getByRole('button', { name: 'Discovering...', exact: true });
      await expect(
        busyButton,
        'The "Find Business Assets" button never switched to its "Discovering..." state.',
      ).toBeVisible({ timeout: 30_000 });
      await expect(
        busyButton,
        'The discovery control stayed enabled while a discovery run was in flight.',
      ).toBeDisabled({ timeout: 15_000 });
    });
  });
});
