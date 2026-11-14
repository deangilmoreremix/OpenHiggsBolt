import { test, expect, type Page, type Request } from '@playwright/test';

/**
 * Business Finder in the real modal: results paging + contact enrichment.
 *
 * Network boundary: `find-businesses` and `enrich-business` are fulfilled by the test (the dev server's Clerk
 * middleware blocks API routes without real keys), so this proves what the BROWSER does — which requests the modal
 * sends, in what shape, and how it renders the answers — not the server (covered by Vitest + the live runs).
 *
 *  - only businesses with their own website are sent for enrichment, at most 5 per request
 *  - "Show 8 more" enriches only the newly visible cards, never the ones already looked up
 *  - extra social icons and an Email chip appear with a provenance tooltip
 *  - a 429 from enrichment stops quietly: no error banner, results stay
 *  - the counter reads "Showing N of M"
 */

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3111';
const biz = (i: number, over: Record<string, unknown> = {}) => ({
  id: `b${i}`, name: `Biz ${i}`, source: 'OPENSTREETMAP', category: 'restaurant', address: `${i} Main St`, city: 'Tampa', region: 'FL',
  websiteStatus: 'unknown', verificationStatus: 'unverified', ownership: 'independent', phone: '8135550100', ...over,
});
const businesses = [
  ...Array.from({ length: 24 }, (_, i) => biz(i, { website: `https://site${i}.example.com` })),
  biz(24), // no website at all
  biz(25, { website: 'https://www.facebook.com/biz25' }), // social page only: not an owned website
  ...Array.from({ length: 4 }, (_, i) => biz(26 + i, { website: `https://site${26 + i}.example.com` })),
];

async function openFinder(page: Page) {
  await page.context().addCookies([{ name: '__e2e_auth_bypass', value: '1', url: BASE }]);
  await page.goto('/personalization-demo', { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  const adv = dialog.getByRole('button', { name: /advanced editing/i });
  if (await adv.count()) await adv.first().click();
  await dialog.getByRole('button', { name: 'Client', exact: true }).click();
  await dialog.getByRole('button', { name: 'Find Local Business', exact: true }).click();
  return dialog;
}

test('modal enriches only visible, owned-website businesses, in batches of ≤5, and renders what comes back', async ({ page }) => {
  const enrichBodies: Array<{ businesses: Array<{ id: string; website: string }> }> = [];
  await page.route('**/api/personalization/find-businesses', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, businesses, query: { niche: 'Restaurants / Food', location: 'Tampa, FL', radiusMiles: 15 } }) }));
  await page.route('**/api/personalization/enrich-business', async (r) => {
    const body = JSON.parse(r.request().postData() || '{}');
    enrichBodies.push(body);
    const results = body.businesses.map((b: { id: string; website: string }) => ({
      id: b.id, website: b.website, ok: true,
      enrichment: {
        website: b.website, emails: [{ value: `hello@${b.id}.example.com`, sourceUrl: `${b.website}/contact`, confidence: 0.95, method: 'mailto' }],
        phones: [], addresses: [], contactNames: [], pagesVisited: [b.website], pagesSkipped: [], robots: { checked: true, status: 'allow-all' }, jsRendered: false, notes: [],
        socials: { linkedin: { value: `https://www.linkedin.com/company/${b.id}`, sourceUrl: b.website, confidence: 0.85, method: 'footer-link' } },
      },
    }));
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, results }) });
  });

  const dialog = await openFinder(page);
  await dialog.locator('#business-niche').selectOption('restaurants-food');
  await dialog.locator('#business-location').fill('Tampa, FL');
  await dialog.getByRole('button', { name: /15/ }).first().click();
  await expect(dialog.getByText(/businesses found for/i).first()).toBeVisible({ timeout: 30_000 });

  // First page: 8 visible cards → one request, ≤5 per request, all with an owned website.
  await expect(dialog.getByTestId('pz-results-count')).toHaveText('Showing 8 of 30');
  await expect.poll(() => enrichBodies.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  const sentFirst = enrichBodies.flatMap((b) => b.businesses.map((x) => x.id));
  expect(sentFirst).toEqual(['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7']);
  expect(enrichBodies.every((b) => b.businesses.length <= 5)).toBe(true);
  expect(enrichBodies.flatMap((b) => b.businesses).every((b) => /^https:\/\/site\d+\.example\.com$/.test(b.website))).toBe(true);

  // Rendered: Email chip with provenance tooltip + LinkedIn icon on an enriched card.
  const firstCard = dialog.getByText('Biz 0', { exact: true }).locator('xpath=ancestor::div[.//button[normalize-space()="Use This Business"]][1]');
  await expect(firstCard.getByText('✓ Email')).toBeVisible({ timeout: 15_000 });
  await expect(firstCard.getByText('✓ Email')).toHaveAttribute('title', /Found on https:\/\/site0\.example\.com\/contact \(mailto, confidence 95%\)/);
  await expect(firstCard.locator('a[data-network="linkedin"]')).toHaveAttribute('href', 'https://www.linkedin.com/company/b0');

  // "Show 8 more": only the 8 NEW cards are sent; none of b0–b7 again; the social-only and no-website cards are skipped.
  const before = enrichBodies.length;
  await dialog.getByTestId('pz-results-show-more').click();
  await expect(dialog.getByTestId('pz-results-count')).toHaveText('Showing 16 of 30');
  await expect.poll(() => enrichBodies.length, { timeout: 15_000 }).toBeGreaterThan(before);
  const sentSecond = enrichBodies.slice(before).flatMap((b) => b.businesses.map((x) => x.id));
  expect(sentSecond).toEqual(['b8', 'b9', 'b10', 'b11', 'b12', 'b13', 'b14', 'b15']);
  expect(sentSecond.some((id) => sentFirst.includes(id))).toBe(false);

  // Page through to the end: the no-website and social-only cards never appear in any request.
  await dialog.getByTestId('pz-results-show-more').click();
  await dialog.getByTestId('pz-results-show-more').click();
  await expect(dialog.getByTestId('pz-results-count')).toHaveText('Showing all 30');
  await expect(dialog.getByTestId('pz-results-show-more')).toHaveCount(0);
  await expect.poll(() => enrichBodies.flatMap((b) => b.businesses.map((x) => x.id)).includes('b29'), { timeout: 15_000 }).toBe(true);
  const allSent = enrichBodies.flatMap((b) => b.businesses.map((x) => x.id));
  expect(allSent).not.toContain('b24');
  expect(allSent).not.toContain('b25');
  expect(new Set(allSent).size).toBe(allSent.length); // each business is looked up once
});

test('a rate-limited enrichment (429) stops quietly: results stay, no error banner', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/personalization/find-businesses', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, businesses: businesses.slice(0, 10), query: { niche: 'Restaurants / Food', location: 'Tampa, FL', radiusMiles: 15 } }) }));
  await page.route('**/api/personalization/enrich-business', (r) => { calls++; return r.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"rate limited"}' }); });

  const dialog = await openFinder(page);
  await dialog.locator('#business-niche').selectOption('restaurants-food');
  await dialog.locator('#business-location').fill('Tampa, FL');
  await dialog.getByRole('button', { name: /15/ }).first().click();
  await expect(dialog.getByText(/businesses found for/i).first()).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => calls, { timeout: 15_000 }).toBeGreaterThanOrEqual(1);
  await expect(dialog.getByText('Looking up contacts…')).toHaveCount(0, { timeout: 15_000 }); // nothing left spinning
  await expect(dialog.getByText(/Business Search Failed/i)).toHaveCount(0);
  await expect(dialog.getByText('Biz 0', { exact: true })).toBeVisible();
  expect(calls).toBe(1); // stopped after the first 429; the second batch was not attempted
});
