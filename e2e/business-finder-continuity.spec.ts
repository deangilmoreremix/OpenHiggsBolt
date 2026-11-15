import { test, expect, type Page } from '@playwright/test';

/**
 * Saved searches and "looks wrong" flags in the real modal (network boundary mocked): save a search -> it is listed
 * and can be run again; flag a business -> it is hidden with a count, shown again, and un-flagged.
 */
const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3111';
const biz = (i: number) => ({
  id: `b${i}`, name: `Biz ${i}`, source: 'OPENSTREETMAP', osmType: 'node', osmId: String(100 + i), category: 'italian restaurant',
  address: `${i} Main St`, city: 'Tampa', region: 'FL', latitude: 27.95 + i * 0.001, longitude: -82.46, websiteStatus: 'unknown',
  verificationStatus: 'unverified', ownership: 'independent', website: `https://site${i}.example.com`,
});
const list = [biz(0), biz(1), biz(2)];

async function setup(page: Page) {
  const state = { searches: [] as Array<Record<string, unknown>>, flags: [] as Array<{ business_id: string; reason: string }>, findCalls: 0, posted: [] as unknown[] };
  await page.route('**/api/personalization/find-businesses', (r) => { state.findCalls++; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, businesses: list, query: { niche: 'Restaurants / Food', location: 'Tampa, FL', radiusMiles: 15 } }) }); });
  await page.route('**/api/personalization/enrich-business', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, results: [] }) }));
  await page.route('**/api/personalization/saved-searches*', async (r) => {
    const m = r.request().method();
    if (m === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, searches: state.searches }) });
    if (m === 'POST') { const b = JSON.parse(r.request().postData() || '{}'); state.posted.push(b); const s = { id: `s${state.searches.length + 1}`, name: b.name, niche: b.niche, location: b.location, radius_miles: b.radiusMiles, include_chains: false }; state.searches.unshift(s); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, search: s }) }); }
    state.searches = []; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.route('**/api/personalization/lead-feedback*', async (r) => {
    const m = r.request().method();
    if (m === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, flags: state.flags }) });
    if (m === 'POST') { const b = JSON.parse(r.request().postData() || '{}'); state.flags.push({ business_id: b.businessId, reason: b.reason }); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, flag: {} }) }); }
    const u = new URL(r.request().url()); state.flags = state.flags.filter((f) => !(f.business_id === u.searchParams.get('businessId') && f.reason === u.searchParams.get('reason')));
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.context().addCookies([{ name: '__e2e_auth_bypass', value: '1', url: BASE }]);
  await page.goto('/personalization-demo', { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  const adv = dialog.getByRole('button', { name: /advanced editing/i });
  if (await adv.count()) await adv.first().click();
  await dialog.getByRole('button', { name: 'Client', exact: true }).click();
  await dialog.getByRole('button', { name: 'Find Local Business', exact: true }).click();
  return { dialog, state };
}
const card = (dialog: ReturnType<Page['getByRole']>, name: string) =>
  dialog.getByText(name, { exact: true }).first().locator('xpath=ancestor::div[.//button[normalize-space()="Use This Business"]][1]');

test('save a search, see it listed, and run it again', async ({ page }) => {
  const { dialog, state } = await setup(page);
  await dialog.locator('#business-niche').selectOption('restaurants-food');
  await dialog.locator('#business-location').fill('Tampa, FL');
  await dialog.getByTestId('save-search-open').click();
  await expect(dialog.getByTestId('save-search-name')).toHaveValue(/Restaurants \/ Food · Tampa, FL/);
  await dialog.getByTestId('save-search-name').fill('Tampa pizza');
  await dialog.getByTestId('save-search-confirm').click();
  await expect(dialog.getByTestId('save-search-message')).toHaveText('Saved.');
  await expect(dialog.getByTestId('saved-search-item')).toContainText('Tampa pizza');
  expect(state.posted[0]).toMatchObject({ name: 'Tampa pizza', niche: 'restaurants-food', location: 'Tampa, FL', radiusMiles: 15 });
  expect(state.findCalls).toBe(0);
  await dialog.getByTestId('saved-search-run').click();
  await expect(dialog.getByText(/businesses found for/i).first()).toBeVisible({ timeout: 30_000 });
  expect(state.findCalls).toBe(1);
});

test('"Looks wrong" hides a business with a count, can show it again, and undo restores it', async ({ page }) => {
  const { dialog, state } = await setup(page);
  await dialog.locator('#business-niche').selectOption('restaurants-food');
  await dialog.locator('#business-location').fill('Tampa, FL');
  await dialog.getByRole('button', { name: /15/ }).first().click();
  await expect(dialog.getByText(/businesses found for/i).first()).toBeVisible({ timeout: 30_000 });
  await expect(card(dialog, 'Biz 1')).toBeVisible();

  await card(dialog, 'Biz 1').getByTestId('looks-wrong-open').click();
  await dialog.getByTestId('looks-wrong-is_a_chain').click();
  await expect(card(dialog, 'Biz 1')).toHaveCount(0);
  await expect(card(dialog, 'Biz 0')).toBeVisible();
  await expect(dialog.getByTestId('hidden-bar')).toContainText('1 hidden');
  expect(state.flags).toEqual([{ business_id: 'b1', reason: 'is_a_chain' }]);

  await dialog.getByTestId('hidden-toggle').click();
  await expect(card(dialog, 'Biz 1')).toBeVisible();
  await dialog.getByTestId('hidden-toggle').click();
  await expect(card(dialog, 'Biz 1')).toHaveCount(0);

  await dialog.getByTestId('hidden-undo').click();
  await expect(card(dialog, 'Biz 1')).toBeVisible();
  await expect(dialog.getByTestId('hidden-bar')).toHaveCount(0);
  expect(state.flags).toEqual([]);
});
