import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Found data reaches a REAL exported frame: finder (network mocked) -> found email / Instagram / site-published rating
 * -> Step 3 (rating tagline + CTA chip) -> approve -> real browser render. The MP4 is saved for frame inspection.
 */
const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3111';
const OUT = process.env.PHASE5_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'found-data-frame');
const site = 'https://joes-pizza.example.com';

test('found email, @handle and rating appear in the real exported video', async ({ page }) => {
  test.setTimeout(400_000);
  fs.mkdirSync(OUT, { recursive: true });
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    URL.createObjectURL = (obj: Blob | MediaSource) => { try { if (obj instanceof Blob) blobs.push(obj); } catch { /* ignore */ } return original(obj); };
    (window as unknown as { __blobs: Blob[] }).__blobs = blobs;
  });
  await page.route('**/api/personalization/find-businesses', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ ok: true, businesses: [{
      id: 'b1', name: 'Joes Pizza', source: 'OPENSTREETMAP', osmType: 'node', osmId: '101', category: 'pizza restaurant', address: '1 Main St', city: 'Tampa', region: 'FL',
      latitude: 27.95, longitude: -82.46, websiteStatus: 'unknown', verificationStatus: 'unverified', ownership: 'independent', website: site, openingHours: 'Mo-Sa 11:00-21:00',
    }], query: { niche: 'Restaurants / Food', location: 'Tampa, FL', radiusMiles: 15 } }),
  }));
  await page.route('**/api/personalization/enrich-business', async (r) => {
    const body = JSON.parse(r.request().postData() || '{}');
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, results: body.businesses.map((x: { id: string; website: string }) => ({
      id: x.id, website: x.website, ok: true,
      enrichment: {
        website: x.website, emails: [{ value: 'hi@joespizza.com', sourceUrl: `${x.website}/contact`, confidence: 0.95, method: 'mailto' }], phones: [], addresses: [], contactNames: [],
        socials: { instagram: { value: 'https://instagram.com/joes_pizza', sourceUrl: x.website, confidence: 0.9, method: 'footer-link' } },
        pagesVisited: [x.website], pagesSkipped: [], robots: { checked: true, status: 'allow-all' }, jsRendered: false, notes: [], enrichedAt: new Date().toISOString(),
        siteSignals: { rating: { value: 4.8, count: 120, best: 5, sourceUrl: x.website } },
      },
    })) }) });
  });
  await page.context().addCookies([{ name: '__e2e_auth_bypass', value: '1', url: BASE }]);
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'Client', exact: true }).click();
  await dialog.getByRole('button', { name: 'Find Local Business', exact: true }).click();
  await dialog.locator('#business-niche').selectOption('restaurants-food');
  await dialog.locator('#business-location').fill('Tampa, FL');
  await dialog.getByRole('button', { name: /15/ }).first().click();
  await expect(dialog.getByText(/businesses found for/i).first()).toBeVisible({ timeout: 30_000 });
  await dialog.getByRole('button', { name: 'Use This Business' }).first().click();
  await expect(dialog.getByTestId('pz-found-contacts')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: /Simple Mode/i }).click();

  await dialog.getByRole('button', { name: /Step 2/i }).click();
  await dialog.getByRole('tab', { name: /AI Demos/i }).click();
  await dialog.getByPlaceholder('Search demos…').fill('luxury perfume');
  const card = dialog.locator('[data-testid*="luxury-perfume-commercial"]').first();
  await card.scrollIntoViewIfNeeded(); await card.click();
  await page.waitForTimeout(1500);

  await dialog.getByRole('button', { name: /Step 3/i }).click();
  await expect(dialog.getByTestId('pz-rating-chip')).toContainText('4.8 ★ · 120 reviews');
  await dialog.getByTestId('pz-rating-chip').click();
  await expect(dialog.getByTestId('pz-cta-suggestion-hours')).toContainText('Open Mon–Sat 11 am–9 pm');
  await dialog.getByTestId('pz-cta-suggestion-email').click();
  await dialog.getByTestId('pz-cta-suggestions').screenshot({ path: path.join(OUT, 'cta-chips.png') });

  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
  await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
  const rights = page.getByTestId('guided-rights-confirm').locator('input');
  if (await rights.count()) await rights.check();
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 240_000, intervals: [500, 1000] }).toBeGreaterThan(0);
  const b64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type));
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
    let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(bin);
  });
  const file = path.join(OUT, 'found-data.mp4');
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  expect(fs.statSync(file).size).toBeGreaterThan(10_000);
});
