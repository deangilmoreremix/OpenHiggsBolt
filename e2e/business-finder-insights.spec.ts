import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

/**
 * Finder insights in the real modal (network boundary mocked): status chips from site signals, "Open now first",
 * "Seen earlier" across searches, CSV export (content + formula-safety), and the look-alike/competitor/website panel.
 */
const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3111';
const biz = (i: number, over: Record<string, unknown> = {}) => ({
  id: `b${i}`, name: `Biz ${i}`, source: 'OPENSTREETMAP', osmType: 'node', osmId: String(100 + i), category: 'italian restaurant',
  address: `${i} Main St`, city: 'Tampa', region: 'FL', latitude: 27.95 + i * 0.001, longitude: -82.46, websiteStatus: 'unknown',
  verificationStatus: 'unverified', ownership: 'independent', website: `https://site${i}.example.com`, ...over,
});
const list = [
  biz(0, { openingHours: 'Mo-Su 00:00-00:01' }),                 // essentially always closed → "Closed now"
  biz(1, { openingHours: '24/7' }),                              // always open
  biz(2, { name: '=HYPERLINK("http://evil")' }),                 // spreadsheet-formula name
  biz(3, { category: 'plumber', openingHours: 'Mo-Fr 09:00-17:00; PH off' }), // unparseable → no chip
];
const enrichment = (b: { id: string; website: string }) => ({
  website: b.website, emails: [{ value: `hi@${b.id}.example.com`, sourceUrl: `${b.website}/contact`, confidence: 0.95, method: 'mailto' }], phones: [], addresses: [], contactNames: [],
  socials: {}, pagesVisited: [b.website], pagesSkipped: [], robots: { checked: true, status: 'allow-all' }, jsRendered: false, notes: [], enrichedAt: new Date().toISOString(),
  siteSignals: b.id === 'b1'
    ? { contactForm: { sourceUrl: `${b.website}/contact` }, booking: { sourceUrl: b.website, href: 'https://calendly.com/x', provider: 'Calendly' }, video: { sourceUrl: b.website, kinds: ['youtube'] },
        quality: { sourceUrl: b.website, https: true, mobileViewport: false, hasTitle: true, hasMetaDescription: true, hasStructuredData: false, looksOutdated: true, copyrightYear: 2018 } }
    : {},
});

async function setup(page: Page, results = list) {
  await page.route('**/api/personalization/find-businesses', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, businesses: results, query: { niche: 'Restaurants / Food', location: 'Tampa, FL', radiusMiles: 15 } }) }));
  await page.route('**/api/personalization/enrich-business', async (r) => {
    const body = JSON.parse(r.request().postData() || '{}');
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, results: body.businesses.map((b: { id: string; website: string }) => ({ id: b.id, website: b.website, ok: true, enrichment: enrichment(b) })) }) });
  });
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
async function search(dialog: ReturnType<Page['getByRole']>) {
  await dialog.locator('#business-niche').selectOption('restaurants-food');
  await dialog.locator('#business-location').fill('Tampa, FL');
  await dialog.getByRole('button', { name: /15/ }).first().click();
  await expect(dialog.getByText(/businesses found for/i).first()).toBeVisible({ timeout: 30_000 });
}
const card = (dialog: ReturnType<Page['getByRole']>, name: string) =>
  dialog.getByText(name, { exact: true }).first().locator('xpath=ancestor::div[.//button[normalize-space()="Use This Business"]][1]');

test('cards show honest status chips; "Open now first" reorders; unparseable hours show no chip', async ({ page }) => {
  const dialog = await setup(page);
  await search(dialog);
  const b1 = card(dialog, 'Biz 1');
  await expect(b1.getByTestId('chip-open')).toHaveText('Open now');
  await expect(b1.getByTestId('chip-form')).toBeVisible({ timeout: 15_000 });
  await expect(b1.getByTestId('chip-booking')).toContainText('Calendly');
  await expect(b1.getByTestId('chip-video')).toHaveText('Has video');
  await expect(b1.getByTestId('chip-outdated')).toBeVisible();
  await expect(b1.getByTestId('chip-fresh')).toHaveText(/checked (just now|\d+ min ago)/);
  const b0 = card(dialog, 'Biz 0');
  await expect(b0.getByTestId('chip-open')).toHaveText('Closed now');
  await expect(b0.getByTestId('chip-novideo')).toHaveAttribute('title', /does not prove/);
  await expect(card(dialog, 'Biz 3').getByTestId('chip-open')).toHaveCount(0); // "PH off" → unknown → say nothing

  const names = () => dialog.locator('xpath=//div[.//button[normalize-space()="Use This Business"]]/div/div/div[1]').allTextContents();
  await dialog.getByTestId('pz-open-first').click();
  const ordered = (await dialog.getByText(/^Biz \d$|^=HYPERLINK/).allTextContents()).filter((t) => t.startsWith('Biz') || t.startsWith('='));
  expect(ordered.indexOf('Biz 1')).toBeLessThan(ordered.indexOf('Biz 0')); // open before closed
  void names;
});

test('"Seen earlier" marks a business that reappears in a second search', async ({ page }) => {
  const dialog = await setup(page);
  await search(dialog);
  await expect(card(dialog, 'Biz 1').getByTestId('chip-seen')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'New Search', exact: true }).click();
  await dialog.getByRole('button', { name: 'Find Local Business', exact: true }).click(); // New Search returns to the entry point
  await search(dialog);
  await expect(card(dialog, 'Biz 1').getByTestId('chip-seen')).toBeVisible({ timeout: 10_000 });
});

test('CSV export contains found contacts + sources and neutralises formulas', async ({ page }) => {
  const dialog = await setup(page);
  await search(dialog);
  await expect(card(dialog, 'Biz 1').getByTestId('chip-form')).toBeVisible({ timeout: 15_000 });
  const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByTestId('pz-export-csv').click()]);
  expect(download.suggestedFilename()).toMatch(/^businesses-\d{4}-\d{2}-\d{2}\.csv$/);
  const text = fs.readFileSync((await download.path())!, 'utf8');
  const lines = text.replace(/^﻿/, '').trimEnd().split('\r\n');
  expect(lines).toHaveLength(1 + list.length);
  expect(lines[0]).toContain('Email (found on website)');
  const row1 = lines.find((l) => l.startsWith('Biz 1'))!;
  expect(row1).toContain('hi@b1.example.com'); expect(row1).toContain('https://site1.example.com/contact'); expect(row1).toContain('yes (Calendly)'); expect(row1).toContain('open');
  expect(lines.some((l) => l.startsWith(`"'=HYPERLINK`) || l.startsWith(`'=HYPERLINK`))).toBe(true); // formula neutralised
  expect(lines.some((l) => /^=HYPERLINK/.test(l))).toBe(false);
});

test('choosing a business shows the website check, similar businesses and nearest competitors from this search', async ({ page }) => {
  const dialog = await setup(page);
  await search(dialog);
  await expect(card(dialog, 'Biz 1').getByTestId('chip-form')).toBeVisible({ timeout: 15_000 });
  await card(dialog, 'Biz 1').getByRole('button', { name: 'Use This Business' }).click();
  const panel = dialog.getByTestId('lead-insights');
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel.getByTestId('site-quality')).toContainText('✓ HTTPS');
  await expect(panel.getByTestId('site-quality')).toContainText('✗ mobile-ready');
  await expect(panel.getByTestId('site-quality')).toContainText('© 2018');
  await expect(panel.getByTestId('lookalikes')).toContainText('Biz 0');
  await expect(panel.getByTestId('lookalikes')).not.toContainText('Biz 3'); // a plumber is not a look-alike
  await expect(panel.getByTestId('competitors')).toContainText(/Biz \d.*mi/);
});

test('an outreach draft is built from the facts found, editable, and sends nothing', async ({ page }) => {
  const dialog = await setup(page);
  await search(dialog);
  await expect(card(dialog, 'Biz 1').getByTestId('chip-form')).toBeVisible({ timeout: 15_000 });
  await card(dialog, 'Biz 1').getByRole('button', { name: 'Use This Business' }).click();
  const panel = dialog.getByTestId('lead-insights');
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await panel.getByTestId('outreach-toggle').click();
  await expect(panel.getByTestId('outreach-facts')).toContainText('Homepage has no mobile viewport tag');
  const text = panel.getByTestId('outreach-text');
  await expect(text).toHaveValue(/Biz 1/);
  await expect(text).toHaveValue(/\[link to your sample video\]/);
  await text.fill('Hello, edited by me');
  await expect(text).toHaveValue('Hello, edited by me');
});
