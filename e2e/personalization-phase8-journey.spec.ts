import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 8 — the credit-free customer journey in a REAL browser: business -> assets -> video (recast skipped)
 * -> personalize (asset usage) -> preview (goal-based recommendations, undo/redo) -> approve -> browser render
 * -> real MP4. Every network request is recorded: NONE may be AI generation, prompt personalization, MuAPI or
 * recast. Frames are extracted and inspected separately (ffmpeg), never assumed.
 */
const OUT = process.env.PHASE5_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'phase8-journey');
const LONG_NAME = 'Kreindler & Kreindler LLP';
const AI_REQUEST = /muapi|openai|\/api\/personalization\/(personalize|generate|recast)|promptPersonaliz|generate-prompt/i;
const RATIOS = (process.env.PHASE5_RATIOS ?? '16:9').split(',');

async function seedBrand(page: Page, finish: 'simple' | 'advanced' = 'simple') {
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs = blobs;
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      try { if (obj instanceof Blob) blobs.push(obj); } catch { /* ignore */ }
      return original(obj);
    };
  });
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', LONG_NAME);
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();
  // A 3:2 product photo: magenta background with a yellow SUBJECT circle close to the edges
  // (so cropping would cut it), and a transparent-background wordmark logo.
  const logo = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 200
    const g = c.getContext('2d')!; g.clearRect(0, 0, 600, 200)
    g.fillStyle = '#ffffff'; g.font = 'bold 90px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('KK LAW', 300, 100)
    return c.toDataURL('image/png')
  })
  // Four distinct library pictures (3:2, 4:3, 1:1, 3:2) so a collage's tiles are identifiable.
  const makePic = (bg: string, fg: string, w: number, h: number, shape: 'circle' | 'square' | 'triangle') =>
    page.evaluate(([bg, fg, w, h, shape]) => {
      const c = document.createElement('canvas'); c.width = w as number; c.height = h as number
      const g = c.getContext('2d')!
      g.fillStyle = bg as string; g.fillRect(0, 0, c.width, c.height)
      g.fillStyle = fg as string; g.beginPath()
      const cx = (w as number) / 2, cy = (h as number) / 2, r = Math.min(w as number, h as number) * 0.47
      if (shape === 'circle') g.arc(cx, cy, r, 0, Math.PI * 2)
      else if (shape === 'square') g.rect(cx - r, cy - r, 2 * r, 2 * r)
      else { g.moveTo(cx, cy - r); g.lineTo(cx + r, cy + r); g.lineTo(cx - r, cy + r); g.closePath() }
      g.fill()
      return c.toDataURL('image/png')
    }, [bg, fg, w, h, shape] as const);
  // REAL photographs (same-origin repo images used as stand-ins for a customer's own photos):
  // product close-up, kitchen interior (real estate), selfie with food, portrait.
  const photo = (file: string) => page.evaluate(async (u) => {
    const blob = await (await fetch(u)).blob();
    return await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(blob); });
  }, `/media/promptfeed/previews/${file}`);
  const pictures = process.env.PHASE5_REAL_PHOTOS === '0' ? [
    await makePic('#a33b6b', '#ffd400', 900, 600, 'circle'),
    await makePic('#1f5fae', '#ffffff', 800, 600, 'square'),
    await makePic('#1f8a70', '#ff8a00', 700, 700, 'triangle'),
    await makePic('#6a3fb5', '#ffe066', 900, 600, 'circle'),
  ] : [
    await photo(process.env.PHASE5_MAIN_PHOTO ?? '1521_luxury-diamond-ring-commercial-storyboard.jpg'),
    await photo('1949_handheld-coffee-vlog-with-mini-dv-aesthetic.jpg'),
    await photo('3310_handheld-selfie-vlog-eating-oden-in-hotel-room.jpg'),
    await photo('2984_the-decadent-snap-artisanal-chocolate-bar-video-prompt.jpg'),
  ];
  const logoCard = page.locator('article.asset-card').filter({ hasText: '2. LOGO' });
  await logoCard.getByPlaceholder('Paste logo URL and press Enter').fill(logo);
  await page.locator('button:has-text("Add Logo URL")').first().dispatchEvent('click');
  const prodCard = page.locator('article.asset-card').filter({ hasText: /3\. PRODUCTS/i }).first();
  for (const pic of pictures) {
    // once a picture exists the card shows "+ Add more" to reveal the input again
    const more = prodCard.getByRole('button', { name: /add more/i });
    if (await more.count()) await more.first().click();
    await prodCard.locator('input[placeholder*="Paste"]').first().fill(pic);
    await page.locator('button:has-text("Add Image/Video URL")').first().dispatchEvent('click');
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1500);
  if (finish === 'simple') await page.getByRole('button', { name: /Simple Mode/i }).click();
}


test.describe('Phase 8 credit-free journey (real browser, real export)', () => {
  for (const ratio of RATIOS) {
    test(`journey @ ${ratio}`, async ({ page }) => {
      test.setTimeout(300_000);
      fs.mkdirSync(OUT, { recursive: true });
      const slug = ratio.replace(':', 'x');
      const requests: string[] = [];
      page.on('request', (r) => requests.push(r.url()));
      await seedBrand(page);
      const dialog = page.getByRole('dialog');

      // Step 2: pick a demo; the optional recast is offered and defaults to keeping the original.
      await dialog.getByRole('button', { name: /Step 2/i }).click();
      await dialog.getByRole('tab', { name: /AI Demos/i }).click();
      await dialog.getByPlaceholder('Search demos…').fill('luxury perfume');
      const card = dialog.locator('[data-testid*="luxury-perfume-commercial"]').first();
      await card.scrollIntoViewIfNeeded(); await card.click();
      await page.waitForTimeout(1500);
      await dialog.getByRole('tab', { name: /Your video/i }).click();
      await expect(dialog.getByTestId('guided-recast-status')).toContainText('Keeping your original video');
      await expect(dialog.getByTestId('guided-recast-credit-note')).toContainText(/credits/i);

      // Step 4 first for the shape, then Step 3 for the personalization.
      await dialog.getByRole('button', { name: /Step 4/i }).click();
      await dialog.getByLabel(/video shape/i).selectOption(ratio);
      await dialog.getByRole('button', { name: /Step 3/i }).click();
      await expect(dialog.getByTestId('asset-usage-panel')).toBeVisible();
      const summary = await dialog.getByTestId('asset-usage-summary').innerText();
      fs.writeFileSync(path.join(OUT, `${slug}-asset-summary.txt`), summary);
      expect(summary).toMatch(/imported/);
      await dialog.getByTestId('asset-usage-panel').screenshot({ path: path.join(OUT, `${slug}-1-assets.png`) });

      // Step 4: goal-based recommendations (not a wall of pills), undo/redo present.
      await dialog.getByRole('button', { name: /Step 4/i }).click();
      await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
      const recs = dialog.locator('[data-testid^="design-rec-"]');
      expect(await recs.count()).toBeGreaterThan(0);
      expect(await recs.count()).toBeLessThanOrEqual(6);
      await dialog.getByTestId('design-goal-promote-offer').click();
      await expect(dialog.getByTestId('editor-undo')).toBeVisible();
      await dialog.getByTestId('design-recommendations').screenshot({ path: path.join(OUT, `${slug}-2-recommendations.png`) });

      // Approve, confirm clip rights (never assumed), render for real.
      await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
      const rights = page.getByTestId('guided-rights-confirm').locator('input');
      if (await rights.count()) await rights.check();
      await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 240_000, intervals: [500, 1000] })
        .toBeGreaterThan(0);
      const base64 = await page.evaluate(async () => {
        const blobs = (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) => /^video\//.test(b.type));
        const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
        let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
        return btoa(binary);
      });
      const file = path.join(OUT, `${slug}.mp4`);
      fs.writeFileSync(file, Buffer.from(base64, 'base64'));
      expect(fs.statSync(file).size).toBeGreaterThan(10_000);

      // Zero AI / prompt-personalization / MuAPI / recast requests in the whole journey.
      const ai = requests.filter((u) => AI_REQUEST.test(u));
      fs.writeFileSync(path.join(OUT, `${slug}-requests.json`), JSON.stringify({ total: requests.length, ai }, null, 2));
      expect(ai, `AI requests: ${ai.join(', ')}`).toEqual([]);
    });
  }

  test('Advanced Editing: Create without AI renders with no mode, no consent and no AI request', async ({ page }) => {
    test.setTimeout(300_000);
    fs.mkdirSync(OUT, { recursive: true });
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await seedBrand(page, 'advanced');
    const dialog = page.getByRole('dialog');

    // Output & engine: choose "Video" output (prompt-only needs no method).
    await dialog.getByRole('tab', { name: /Overlays & Create/i }).click();
    await dialog.getByRole('tab', { name: /Output & engine/i }).click();
    await dialog.getByRole('button', { name: /^Video\b/ }).first().click();
    const noAi = dialog.getByTestId('pz-method-browser');
    await expect(noAi).toBeVisible();
    await expect(noAi).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByTestId('pz-mode-reason-full_body')).toHaveCount(0);
    await dialog.getByTestId('pz-method-browser').screenshot({ path: path.join(OUT, 'advanced-1-method.png') });

    // The footer button is enabled with no mode / consent and makes the video in the browser.
    const footer = dialog.locator('footer').getByRole('button').last();
    await expect(footer).toBeEnabled();
    await footer.click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 240_000, intervals: [500, 1000] })
      .toBeGreaterThan(0);
    const ai = requests.filter((u) => AI_REQUEST.test(u));
    fs.writeFileSync(path.join(OUT, 'advanced-requests.json'), JSON.stringify({ total: requests.length, ai }, null, 2));
    expect(ai, `AI requests: ${ai.join(', ')}`).toEqual([]);
  });

  test('Editor (S1) + undo/redo + Add vs Replace in a real browser', async ({ page }) => {
    test.setTimeout(240_000);
    fs.mkdirSync(OUT, { recursive: true });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
    const editor = dialog.getByText('Edit on the video').locator('xpath=ancestor::div[1]/..');

    // Undo/redo: edit the headline text, undo, redo.
    await dialog.getByRole('button', { name: /^Select Headline/ }).click();
    const text = dialog.getByLabel('Layer text');
    const original = await text.inputValue();
    await text.fill('Undo me please');
    await page.waitForTimeout(800);
    await expect(dialog.getByTestId('editor-undo')).toBeEnabled();
    await dialog.getByTestId('editor-undo').click();
    await expect(text).toHaveValue(original);
    await dialog.getByTestId('editor-redo').click();
    await expect(text).toHaveValue('Undo me please');

    // Add on top keeps the layout's layers (and the edit); the design joins as one more layer.
    const layerRows = () => dialog.getByRole('button', { name: /^Select / }).count();
    const before = await layerRows();
    await dialog.getByTestId('design-how-add').click();
    await dialog.getByTestId('design-goal-stand-out').click();
    await dialog.locator('[data-testid^="design-rec-"]').first().click();
    await expect.poll(layerRows).toBe(before + 1);
    await dialog.getByRole('button', { name: /^Select Headline/ }).click();
    await expect(dialog.getByLabel('Layer text')).toHaveValue('Undo me please');

    // S1: select the design layer; the stage draws the real animation, not a label; no resize handle; no text controls.
    await dialog.getByRole('button', { name: /^Select Design/ }).click();
    await expect(dialog.getByTestId('design-layer-player').first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Resize Design/ })).toHaveCount(0);
    await expect(dialog.getByLabel('Text color')).toHaveCount(0);
    await expect(dialog.getByTestId('design-restore-defaults')).toBeVisible();
    await page.waitForTimeout(1500);
    await dialog.getByText('Edit on the video').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, 'editor-starfield.png') });
  });
});
