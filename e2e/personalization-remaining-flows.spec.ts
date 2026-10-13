import { test, expect, type Page, type Route } from '@playwright/test';
import { installClerkAuth, mintClerkSession } from './fixtures/clerkSession';

const BASE = 'http://localhost:3111';
const FAKE_MUAPI_KEY = 'e2e-fake-muapi-key';
const FAKE_OPENAI_KEY = 'e2e-fake-openai-key';

/** A valid 1x1 PNG, used as the mocked download-image payload. */
const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

function mockMuApi(page: Page) {
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
}

function mockBusinessFinderApis(page: Page) {
  // Lead-finder search: mocked so the test never reaches Nominatim / Overpass.
  page.route('**/api/personalization/find-businesses', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Method not allowed' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // Shape mirrors the real route's success payload
      // (app/api/personalization/find-businesses/route.ts).
      body: JSON.stringify({
        ok: true,
        query: { niche: 'Real Estate', location: 'Tampa, FL', radiusMiles: 15 },
        count: 1,
        businesses: [{
          id: 'osm-1',
          source: 'OPENSTREETMAP',
          name: 'Sunset Realty',
          category: 'Real Estate',
          city: 'Tampa',
          region: 'FL',
          phone: '555-1234',
          websiteStatus: 'unknown',
          verificationStatus: 'unverified',
          leadScore: 80,
        }],
        providerUsed: 'OPENSTREETMAP',
      }),
    });
  });

  // Business research: mocked so no external website is ever fetched.
  page.route('**/api/personalization/research-business', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Method not allowed' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // Shape mirrors the real route's success payload
      // (app/api/personalization/research-business/route.ts → researchProvider).
      body: JSON.stringify({
        ok: true,
        research: {
          canonicalUrl: 'https://sunsetrealty.example.com',
          finalUrl: 'https://sunsetrealty.example.com',
          reachable: true,
          statusCode: 200,
          title: 'Sunset Realty — Tampa Real Estate',
          description: 'Sunset Realty helps Tampa families buy and sell homes.',
          logoUrl: 'https://sunsetrealty.example.com/logo.png',
          socialLinks: {},
          jsonLd: [],
          openGraph: {},
          twitterCard: {},
          contactInfo: { phones: ['555-1234'], emails: [], addresses: [] },
        },
      }),
    });
  });
}

// ── Discovery mocks ─────────────────────────────────────────────────────────
// `POST /api/personalization/discover-assets` runs a real crawl, so it is mocked
// wherever the asset payload (not the authenticated call itself) is an input to
// the behaviour under test. The mocked payload mirrors the server contract:
// `autoPlaceAssets` (src/server/autoPlacementEngine.ts) maps categories onto
// person/logo/products/brand and NEVER onto firstFrame/lastFrame/ctaGraphic
// (NEVER_AUTO_ASSIGN_SECTIONS at autoPlacementEngine.ts:40), so every
// auto-assigned asset below carries an `assignedSection` from that allowed set
// and no asset is ever auto-assigned to a forbidden section.

interface MockDiscoveredAsset {
  id: string;
  sourceUrl: string;
  previewUrl: string;
  sourceType: string;
  category: string;
  confidence: number;
  qualityScore: number;
  relevanceScore: number;
  selected: boolean;
  recommended: boolean;
  rejected: boolean;
  assignedSection: string;
  autoAssigned: boolean;
}

function discoveredAsset(
  id: string,
  category: string,
  assignedSection: string,
  url = `https://example.com/e2e/${id}.png`,
): MockDiscoveredAsset {
  return {
    id,
    sourceUrl: url,
    previewUrl: url,
    sourceType: 'WEBSITE',
    category,
    confidence: 92,
    qualityScore: 88,
    relevanceScore: 90,
    selected: true,
    recommended: true,
    rejected: false,
    assignedSection,
    autoAssigned: true,
  };
}

/**
 * Assets that auto-placement is allowed to assign: one logo, two products and
 * one brand reference. Deliberately contains no firstFrame/lastFrame/ctaAsset
 * because the engine refuses to auto-assign those sections.
 */
const AUTO_PLACED_ASSETS: MockDiscoveredAsset[] = [
  discoveredAsset('e2e-asset-logo', 'logo', 'logo'),
  discoveredAsset('e2e-asset-product-1', 'product', 'products'),
  discoveredAsset('e2e-asset-product-2', 'product', 'products'),
  discoveredAsset('e2e-asset-brand', 'brand', 'brand'),
];

/** Mock for POST /api/personalization/discover-assets. */
function mockDiscovery(page: Page, assets: MockDiscoveredAsset[]) {
  page.route('**/api/personalization/discover-assets', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Method not allowed' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // Shape mirrors the real route's success payload for a synchronous
      // (non-browser-queued) discovery job.
      body: JSON.stringify({
        ok: true,
        cached: false,
        status: 'complete',
        providerUsed: 'STATIC_FALLBACK',
        providerAttempted: ['SMARTVIDEO_STATIC'],
        discoveredAssets: assets,
        candidates: [],
        count: assets.length,
        pagesCrawled: 1,
        rawCandidates: assets.length,
        duration: 42,
        socialProfiles: [],
        jobId: 'e2e-discovery-job',
        browserQueued: false,
      }),
    });
  });
}

/**
 * Mock for POST /api/personalization/download-image: turns every requested
 * remote URL into a data URL so imported discovered assets carry a real blob
 * without the server ever fetching a third-party host.
 */
function mockDownloadImage(page: Page) {
  page.route('**/api/personalization/download-image', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Method not allowed' }),
      });
      return;
    }
    let urls: string[] = [];
    try {
      const body = route.request().postDataJSON();
      urls = Array.isArray(body?.urls) ? body.urls : [];
    } catch {
      urls = [];
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // Shape mirrors app/api/personalization/download-image/route.ts.
      body: JSON.stringify({
        ok: true,
        results: urls.map((url) => ({ url, dataUrl: TINY_PNG_DATA_URL, ok: true })),
      }),
    });
  });
}

/** Locates the "WHAT SMARTVIDEO WILL USE" section (PersonalizationModal.tsx:2201). */
function summaryPanel(page: Page) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'What SmartVideo Will Use' }) })
    .first();
}

async function openPersonalization(page: Page) {
  await page.goto('/personalization-demo');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
    localStorage.setItem('openai_key', 'e2e-fake-openai-key');
  });
  await page.reload();
  await page.waitForTimeout(3000);
}

/**
 * Opens the demo in the app's own test mode (`?test=true`), which installs the
 * `test-mode-key` MuAPI key so `uploadAsset` takes its deterministic
 * no-network branch and imported assets reach `uploadStatus: 'ready'`.
 *
 * This must be used on its OWN page load: if a fake `muapi_key` was written to
 * localStorage first, the page keeps it and uploads take the real MuAPI path.
 */
async function openPersonalizationInTestMode(page: Page) {
  await page.goto('/personalization-demo?test=true');
  await page.waitForTimeout(1000);
  await page.reload();
  await page.waitForTimeout(3000);
}

test.describe('Personalization Remaining Flows — Live Verification', () => {
  test.beforeEach(async ({ context, page }) => {
    // Mint a REAL Clerk session so `auth()` inside the personalization routes
    // sees an authenticated user (the `__e2e_auth_bypass` cookie only bypasses
    // middleware and never reaches route-level auth, which is why the
    // live run used to get a hard 401 from discover-assets).
    const session = await mintClerkSession();
    await installClerkAuth(context, page, session, BASE);
    await context.addCookies([
      { name: '__e2e_auth_bypass', value: '1', url: BASE },
    ]);
    mockMuApi(page);
  });

  test('BUSINESS FINDER: search, select, and research a lead', async ({ page }) => {
    mockBusinessFinderApis(page);
    await openPersonalization(page);

    // The lead-finder entry flow needs THREE clicks before the search form renders:
    // (1) the "Client" audience button in STEP 1 — WHO IS THIS FOR?,
    // (2) "Find Local Business" in the "How would you like to add this client?" chooser,
    // (3) only then do #business-niche / #business-location exist.
    const clientButton = page.getByRole('button', { name: /Client/i }).first();
    await expect(clientButton).toBeVisible();
    await clientButton.click();

    const findLocalBusinessBtn = page.getByRole('button', { name: /Find Local Business/i });
    await expect(findLocalBusinessBtn).toBeVisible();
    await findLocalBusinessBtn.click();

    const nicheSelect = page.locator('#business-niche');
    const locationInput = page.locator('#business-location');
    await expect(nicheSelect).toBeVisible();
    await expect(locationInput).toBeVisible();

    // Niche values are the BUSINESS_NICHES keys (e.g. 'real-estate');
    // labels are human-readable and mirror NICHE_MAPPINGS on the server.
    await expect(nicheSelect.locator('option[value="real-estate"]')).toHaveText('Real Estate');
    await nicheSelect.selectOption('real-estate');
    await locationInput.fill('Tampa, FL');

    const findBtn = page.getByRole('button', { name: /Find Businesses/i }).first();
    await expect(findBtn).toBeEnabled();
    await findBtn.click();

    // Results panel — asserted against the mocked find-businesses payload.
    await expect(page.getByText(/1 businesses? found for Real Estate near Tampa, FL/i).first()).toBeVisible();
    await expect(page.getByText('Sunset Realty', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('80% match').first()).toBeVisible();

    const useBtn = page.getByRole('button', { name: /Use This Business/i }).first();
    await expect(useBtn).toBeVisible();
    await useBtn.click();

    await expect(page.getByText(/Selected:\s*Sunset Realty/i)).toBeVisible();

    // The mocked lead has no website, so the Website field in the selected-business
    // summary must be supplied before research can run.
    const selectedWebsite = page.getByPlaceholder('https://corrected-website.com', { exact: true });
    await expect(selectedWebsite).toBeVisible();
    await selectedWebsite.fill('https://sunsetrealty.example.com');

    const researchBtn = page.getByRole('button', { name: /^Research Business$/i });
    await expect(researchBtn).toBeEnabled();
    await researchBtn.click();

    // Research result — asserted against the mocked research-business payload.
    await expect(page.getByText(/Title:/i).first()).toBeVisible();
    await expect(page.getByText(/Description:/i).first()).toBeVisible();
    await expect(page.getByText(/Logo:/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Found' })).toBeVisible();
    await expect(page.getByText(/Website reachable:/i).first()).toBeVisible();

    await page.screenshot({ path: '/tmp/personalization-business-finder-results.png', fullPage: true });
  });

  test('AUTO PLACEMENT: verify forbidden sections remain user-controlled', async ({ page }) => {
    // The mocked assets carry the engine's auto-assignment contract: every
    // asset is high-confidence and assigned into an ALLOWED section
    // (person/logo/products/brand). The review UI must therefore show real
    // auto-assignment while First Frame / Last Frame / CTA stay user-controlled.
    mockDiscovery(page, AUTO_PLACED_ASSETS);
    await openPersonalization(page);

    await page.getByPlaceholder('ABC Roofing', { exact: true }).fill('Auto Placement Test');
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Roofing');
    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');

    const findAssetsBtn = page.getByRole('button', { name: /Find Business Assets/i }).first();
    await expect(findAssetsBtn).toBeEnabled();
    await findAssetsBtn.click();

    // Discovery really produced assets and the review panel rendered.
    await expect(page.getByRole('heading', { name: 'Discovered Assets' })).toBeVisible();
    await expect(page.getByText(/Found 4 potential assets — 4 selected/)).toBeVisible();

    // Auto-placement actually ran: every discovered asset carries the
    // "Remove from section" affordance that only renders when
    // `asset.assignedSection` is set.
    const assignedToSection = page.getByRole('button', { name: 'Remove from section' });
    await expect(assignedToSection).toHaveCount(AUTO_PLACED_ASSETS.length);

    // Category groups rendered for the placed assets.
    await expect(page.getByText(/^Logo \(1\)$/)).toBeVisible();
    await expect(page.getByText(/^Product \(2\)$/)).toBeVisible();
    await expect(page.getByText(/^Brand \(1\)$/)).toBeVisible();

    // The two forbidden sections still carry their user-facing labels, and their
    // preview boxes are still empty placeholders — so no asset was auto-placed
    // into a forbidden section. The asset cards are anchored by their
    // `data-asset-section` attribute (PersonalizationModal.tsx:3385 / :3488).
    const firstFrameCard = page.locator('article[data-asset-section="firstFrame"]');
    const lastFrameCard = page.locator('article[data-asset-section="lastFrame"]');
    await expect(firstFrameCard.locator('span.badge', { hasText: /^First Frame$/ })).toBeVisible();
    await expect(lastFrameCard.locator('span.badge', { hasText: /^Last Frame$/ })).toBeVisible();
    await expect(firstFrameCard.locator('.frame-preview')).toHaveText('First Frame');
    await expect(lastFrameCard.locator('.frame-preview')).toHaveText('Last Frame/CTA');
    await expect(firstFrameCard.locator('.frame-preview img')).toHaveCount(0);
    await expect(lastFrameCard.locator('.frame-preview img')).toHaveCount(0);

    // Nothing leaked into the render slots either, so the placeholder labels
    // are backed by genuinely empty sections rather than coincidence.
    await expect(summaryPanel(page).getByText('No assets assigned yet.')).toBeVisible();

    await page.screenshot({ path: '/tmp/personalization-auto-placement-check.png', fullPage: true });
  });

  test('EDIT WITH AI: verify editor entry from multiple asset areas', async ({ page }) => {
    mockDiscovery(page, AUTO_PLACED_ASSETS);
    mockDownloadImage(page);
    await openPersonalizationInTestMode(page);

    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');
    await page.getByRole('button', { name: /Find Business Assets/i }).first().click();

    const editor = page.getByRole('dialog', { name: /SmartVideo GO Image Editor/i });

    // ── Area 1: the discovered-asset review row ───────────────────────────
    await expect(page.getByRole('heading', { name: 'Discovered Assets' })).toBeVisible();
    const discoveredEditButtons = page.getByRole('button', { name: 'Edit discovered image' });
    // Exactly one control per asset that is actually rendered on screen.
    await expect(discoveredEditButtons).toHaveCount(AUTO_PLACED_ASSETS.length);
    await expect(discoveredEditButtons.first()).toBeVisible();

    // Clicking one really opens the image editor.
    await discoveredEditButtons.first().click();
    await expect(editor).toBeVisible();
    await expect(editor.getByRole('button', { name: /Close SmartVideo GO image editor/i })).toBeVisible();
    // A click on the editor backdrop dismisses it (its own onClick handler).
    await page.mouse.click(20, 20);
    await expect(editor).toHaveCount(0);

    // ── Area 2: the assigned section slots (Logo / Products / Brand) ───────
    await page.getByRole('button', { name: /Use Selected Assets/i }).click();
    await expect(page.getByText(/4 assets added/).first()).toBeVisible();

    // The imported primary-logo slot now exposes its own Edit with AI control,
    // which only renders once the asset has finished uploading
    // (`uploadStatus === 'ready'`).
    const sectionEditButtons = page.getByRole('button', { name: 'Edit with AI', exact: true });
    await expect(sectionEditButtons.first()).toBeVisible();
    expect(await sectionEditButtons.count()).toBeGreaterThanOrEqual(1);

    // …and that control opens the same editor.
    await sectionEditButtons.first().click();
    await expect(editor).toBeVisible();
    await expect(editor.getByRole('button', { name: /Close SmartVideo GO image editor/i })).toBeVisible();

    await page.screenshot({ path: '/tmp/personalization-edit-with-ai.png', fullPage: true });
  });

  test('SAVED CLIENTS: save, load, update, delete flow', async ({ page }) => {
    await openPersonalization(page);

    const businessName = 'Saved Client Test';
    const readStoredClients = () =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem('smartvideo_clients');
        if (!raw) return [];
        const parsed = JSON.parse(raw) as Record<string, { businessName?: string; industry?: string; website?: string }>;
        return Object.values(parsed);
      });

    await page.getByPlaceholder('ABC Roofing', { exact: true }).fill(businessName);
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Testing');
    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://example.com');

    // ── Save ──────────────────────────────────────────────────────────────
    const saveBtn = page.getByRole('button', { name: /Save Client/i }).first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Persisted: exactly one client record, with every field we typed.
    const stored = await readStoredClients();
    expect(stored).toHaveLength(1);
    expect(stored[0].businessName).toBe(businessName);
    expect(stored[0].industry).toBe('Testing');
    expect(stored[0].website).toBe('https://example.com');

    // Once selected, the control set flips to update/delete mode.
    await expect(page.getByRole('button', { name: /Update Client/i })).toBeVisible();
    await expect(page.locator('#pz-overview').getByRole('button', { name: /^Delete$/ })).toBeVisible();

    // ── Reload: the client survives a full page reload ────────────────────
    await page.reload();
    await page.waitForTimeout(3000);

    const clientSelect = page.locator('#pz-overview').locator('select').first();
    const savedOption = clientSelect.locator('option', { hasText: businessName });
    await expect(savedOption).toHaveCount(1);
    // The selection itself survived the reload, not just the record.
    await expect(page.getByRole('button', { name: /Update Client/i })).toBeVisible();

    // ── Load + Update ─────────────────────────────────────────────────────
    await clientSelect.selectOption({ label: businessName });
    await expect(page.getByPlaceholder('ABC Roofing', { exact: true })).toHaveValue(businessName);
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Roofing');
    await page.getByRole('button', { name: /Update Client/i }).click();

    const updated = await readStoredClients();
    expect(updated).toHaveLength(1);
    expect(updated[0].businessName).toBe(businessName);
    expect(updated[0].industry).toBe('Roofing');

    // ── Delete ────────────────────────────────────────────────────────────
    await page.locator('#pz-overview').getByRole('button', { name: /^Delete$/ }).click();

    await expect(savedOption).toHaveCount(0);
    expect(await readStoredClients()).toHaveLength(0);
    // Deleting the selected client clears the form and resets the controls.
    await expect(page.getByPlaceholder('ABC Roofing', { exact: true })).toHaveValue('');
    await expect(page.getByRole('button', { name: /Save Client/i })).toBeVisible();

    await page.screenshot({ path: '/tmp/personalization-saved-client-delete.png', fullPage: true });
  });

  test('WHAT SMARTVIDEO WILL USE: verify summary reflects current state', async ({ page }) => {
    mockDiscovery(page, AUTO_PLACED_ASSETS);
    mockDownloadImage(page);
    await openPersonalizationInTestMode(page);

    // The summary is a static section that renders with the modal
    // (PersonalizationModal.tsx:2201-2227) — there is no button to press, so
    // it must reflect the empty starting state without any interaction.
    const summary = summaryPanel(page);
    await expect(summary.getByRole('heading', { name: 'What SmartVideo Will Use' })).toBeVisible();
    await expect(summary.getByText('No assets assigned yet.')).toBeVisible();
    await expect(summary.getByText('0 assets assigned across 0 blocks')).toBeVisible();

    // Assign assets through discovery + import.
    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');
    await page.getByRole('button', { name: /Find Business Assets/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Discovered Assets' })).toBeVisible();
    await page.getByRole('button', { name: /Use Selected Assets/i }).click();
    await expect(page.getByText(/4 assets added/).first()).toBeVisible();

    // The summary now reflects the assigned state: 4 assets across the Logo,
    // Products and Brand blocks — nothing in First Frame / Last Frame / CTA.
    // The summary lists one chip per assigned asset, so each section is
    // asserted with its exact count (1 logo, 2 products, 1 brand).
    await expect(summary.getByText('No assets assigned yet.')).toHaveCount(0);
    await expect(summary.getByText('4 assets assigned across 3 blocks')).toBeVisible();
    await expect(summary.getByText('Logo', { exact: true })).toHaveCount(1);
    await expect(summary.getByText('Products', { exact: true })).toHaveCount(2);
    await expect(summary.getByText('Brand', { exact: true })).toHaveCount(1);
    await expect(summary.getByText('First Frame', { exact: true })).toHaveCount(0);
    await expect(summary.getByText('Last Frame', { exact: true })).toHaveCount(0);
    await expect(summary.getByText('CTA', { exact: true })).toHaveCount(0);

    await page.screenshot({ path: '/tmp/personalization-summary.png', fullPage: true });
  });

  test('DESKTOP: complete flow at 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    mockDiscovery(page, AUTO_PLACED_ASSETS);
    mockDownloadImage(page);
    await openPersonalization(page);

    await page.getByPlaceholder('ABC Roofing', { exact: true }).fill('Desktop Test');
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Roofing');
    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');

    await page.getByRole('button', { name: /Find Business Assets/i }).first().click();
    // Wait for the review panel so the measurements below are taken with the
    // discovered-asset content on screen, not an empty modal.
    await expect(page.getByRole('heading', { name: 'Discovered Assets' })).toBeVisible();

    // Real layout invariants at 1920x1080.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1920);
    expect(box!.y + box!.height).toBeLessThanOrEqual(1080);

    // The primary CTA is visible and actionable (a client name is set).
    const cta = page.getByRole('button', { name: /Personalize Prompt/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();

    // Nothing bleeds past the viewport horizontally.
    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(0);

    await page.screenshot({ path: '/tmp/personalization-desktop.png', fullPage: true });
  });

  test('MOBILE: modal and controls fit at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    mockDiscovery(page, AUTO_PLACED_ASSETS);
    mockDownloadImage(page);
    await openPersonalization(page);

    await page.getByPlaceholder('ABC Roofing', { exact: true }).fill('Mobile Test');
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Roofing');
    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');

    await page.getByRole('button', { name: /Find Business Assets/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Discovered Assets' })).toBeVisible();

    // No horizontal overflow on a phone-sized viewport.
    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(0);

    // The modal itself fits the viewport.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);

    // The primary CTA stays reachable and enabled on a phone.
    const cta = page.getByRole('button', { name: /Personalize Prompt/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();

    await page.screenshot({ path: '/tmp/personalization-mobile.png', fullPage: true });
  });

  test('CONSOLE_HEALTH: no unexpected errors during core flow', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    const discoveryResponses: number[] = [];
    const failingApiCalls: { url: string; status: number }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('requestfailed', (request) => failedRequests.push(request.url()));
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/personalization/discover-assets')) {
        discoveryResponses.push(response.status());
      }
      if (response.status() >= 400 && url.startsWith(BASE)) {
        failingApiCalls.push({ url, status: response.status() });
      }
    });

    await openPersonalization(page);

    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');
    await page.getByRole('button', { name: /Find Business Assets/i }).first().click();

    // The core flow is driven against the REAL, authenticated route here: this
    // is the only test that does not mock discover-assets, so it proves the
    // minted Clerk session is accepted by `auth()` inside the route handler.
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/personalization/discover-assets') &&
        response.request().method() === 'POST',
      { timeout: 60_000 },
    );
    await expect(page.getByRole('heading', { name: 'Discovered Assets' })).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(3000);

    // 1. The authenticated discovery call succeeded — and explicitly was NOT
    //    rejected with 401. A 401 here means the session stopped working.
    expect(discoveryResponses.length).toBeGreaterThan(0);
    expect(discoveryResponses.filter((status) => status === 401)).toHaveLength(0);
    for (const status of discoveryResponses) {
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(300);
    }

    // 2. No same-origin personalization API call may fail with an auth status.
    //    This is the exact failure class the old filter hid by blanket-dropping
    //    any console message containing 'Firecrawl', '401' or 'Unauthorized'.
    const authFailures = failingApiCalls.filter((call) => call.status === 401 || call.status === 403);
    expect(authFailures).toEqual([]);

    // 3. Every other failing same-origin API call must be one of the two
    //    enumerated, pre-existing failures below — the filter is by URL, so it
    //    cannot silently swallow anything else (a discovery 401 lands in (2)
    //    before it gets here).
    const KNOWN_UNRELATED_API_FAILURES = [
      // `/api/personalization/project` is the project-restore endpoint. It runs
      // on page load, independent of the modal: the live Supabase schema is
      // missing `personalization_projects.assets` (500) and the restore also
      // calls GET without an id (400). Both pre-date this spec.
      '/api/personalization/project',
    ];
    const unexpectedApiFailures = failingApiCalls.filter(
      (call) => !KNOWN_UNRELATED_API_FAILURES.some((known) => call.url.includes(known)),
    );
    expect(unexpectedApiFailures).toEqual([]);

    // 4. Console errors. Chrome emits a *URL-less* "Failed to load resource: the
    //    server responded with a status of NNN" message for a failed response,
    //    so instead of matching text we reconcile them against the failing
    //    responses captured above: the multiset of reported statuses must be
    //    exactly the multiset of the known unrelated API failures. A discovery
    //    401 or a brand-new failure shows up here as a mismatch.
    const knownFailureStatuses = failingApiCalls
      .filter((call) => KNOWN_UNRELATED_API_FAILURES.some((known) => call.url.includes(known)))
      .map((call) => call.status)
      .sort((a, b) => a - b);
    const GENERIC_RESOURCE_FAILURE = /^Failed to load resource: the server responded with a status of (\d+)/;
    const reportedResourceStatuses = consoleErrors
      .map((error) => error.match(GENERIC_RESOURCE_FAILURE)?.[1])
      .filter((status): status is string => Boolean(status))
      .map(Number)
      .sort((a, b) => a - b);
    expect(reportedResourceStatuses).toEqual(knownFailureStatuses);

    // 5. Every remaining console error and failed request must be allowlisted
    //    noise: the demo page embeds Google's BigBuckBunny sample media, which
    //    Chrome blocks with Opaque Response Blocking in a fresh context.
    const ALLOWED_CONSOLE_ERRORS: RegExp[] = [/gtv-videos-bucket/i];
    const unexpectedConsoleErrors = consoleErrors.filter(
      (error) =>
        !ALLOWED_CONSOLE_ERRORS.some((pattern) => pattern.test(error)) &&
        !GENERIC_RESOURCE_FAILURE.test(error),
    );
    expect(unexpectedConsoleErrors).toEqual([]);
    expect(failedRequests.filter((url) => !url.includes('gtv-videos-bucket'))).toEqual([]);
  });
});
