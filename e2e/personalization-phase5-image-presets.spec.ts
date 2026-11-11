import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 5 — REAL demo footage from several families and shapes: pick the demo
 * in Step 2, apply Product Showcase at every aspect ratio, record what the
 * Layout Quality Check says for that footage, and export through the product's
 * own browser Remotion render. Output files are inspected by
 * scripts/phase5-compare-frames.sh and by eye (see the Phase 5 report).
 *
 * Browser-only: no AI, no MuAPI, no network beyond the local dev server.
 */
const OUT = process.env.PHASE5_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'phase5-presets');
const RATIOS = (process.env.PHASE5_RATIOS ?? '16:9,9:16,1:1,4:5').split(',');
const LAYOUT = process.env.PHASE5_LAYOUT ?? 'Product Showcase';
const LONG_NAME = 'Kreindler & Kreindler LLP';

/** Representative demos: family, real size (registry facts) and a slug fragment to find the card. */
const ALL_DEMOS = [
  { id: 'perfume-16x9', slug: 'luxury-perfume-commercial', search: 'luxury perfume', family: 'minimax-h3', size: '1280x720' },
  { id: 'serum-portrait', slug: 'emerald-bio-serum-product-film', search: 'emerald', family: 'minimax-h3', size: '720x1280' },
  { id: 'burger-ultrawide', slug: 'gourmet-burger-ugc-taste-test', search: 'burger', family: 'minimax-h3', size: '1698x720' },
  { id: 'seedance1-cat', slug: 'giant-orange-cat-meme-style', search: 'orange', family: 'seedance-1', size: '1280x720' },
  { id: 'promptfeed-ring', slug: 'luxury-diamond-ring-commercial-storyboard', search: 'diamond', family: 'promptfeed', size: '720x960' },
  { id: 'promptfeed-tresemme', slug: 'tresemm-luxury-haircare-commercial', search: 'tresemm', family: 'promptfeed', size: '1280x720' },
]
const DEMOS = ALL_DEMOS.filter((d) => !process.env.PHASE5_DEMOS || process.env.PHASE5_DEMOS.split(',').includes(d.id));

async function makeDataUrl(page: Page, w: number, h: number, bg: string, label: string): Promise<string> {
  return page.evaluate(
    ([w, h, bg, label]) => {
      const c = document.createElement('canvas');
      c.width = w as number; c.height = h as number;
      const g = c.getContext('2d')!;
      g.fillStyle = bg as string; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#fff'; g.font = `bold ${Math.round((h as number) / 6)}px sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label as string, c.width / 2, c.height / 2);
      return c.toDataURL('image/png');
    },
    [w, h, bg, label],
  );
}

async function seedBrand(page: Page) {
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
  await page.getByRole('button', { name: /Simple Mode/i }).click();
}

test.describe('Image Overlay Styles — each preset on real footage, selected in the editor, exported for real', () => {
  for (const demo of DEMOS) {
    for (const ratio of RATIOS) {
      test(`${demo.id} (${demo.family} ${demo.size}) @ ${ratio}`, async ({ page }) => {
        test.setTimeout(Number(process.env.PHASE5_TIMEOUT ?? 300_000));
        fs.mkdirSync(OUT, { recursive: true });
        const slug = `${demo.id}-${ratio.replace(':', 'x')}`;
        await seedBrand(page);
        const dialog = page.getByRole('dialog');

        // Step 2: choose the real demo from the library grid.
        await dialog.getByRole('button', { name: /Step 2/i }).click();
        await dialog.getByRole('tab', { name: /AI Demos/i }).click();
        const search = dialog.getByPlaceholder('Search demos…');
        await search.fill(demo.search);
        const card = dialog.locator(`[data-testid*="${demo.slug}"]`).first();
        await card.scrollIntoViewIfNeeded();
        await card.click();
        await page.waitForTimeout(1500);

        // Aspect ratio, then the layout.
        await dialog.getByRole('button', { name: /Step 4/i }).click();
        await dialog.getByLabel(/video shape/i).selectOption(ratio);
        await dialog.getByRole('button', { name: /Step 3/i }).click();
        const other = LAYOUT === 'Business Introduction' ? 'Product Showcase' : 'Business Introduction';
        await dialog.locator('[data-testid="personalization-template-card"]', { hasText: other }).first().locator('[data-testid="personalization-template-use"]').click();
        await page.waitForTimeout(800);
        const target = dialog.locator('[data-testid="personalization-template-card"]', { hasText: LAYOUT }).first();
        await target.scrollIntoViewIfNeeded();
        await target.locator('[data-testid="personalization-template-use"]').click();
        await page.waitForTimeout(1500);

        // Optional A/B: turn the image shadow off through the editor's own control.
        if (process.env.PHASE5_SHADOW) {
          await dialog.getByRole('button', { name: /Step 4/i }).click();
          await dialog.getByRole('button', { name: 'Select Product image' }).click();
          await dialog.getByLabel('Image shadow').selectOption(process.env.PHASE5_SHADOW);
        }

        // Select the preset through the editor's own selector (the customer's choice).
        const PRESET = process.env.PHASE5_PRESET;
        if (PRESET) {
          await dialog.getByRole('button', { name: /Step 4/i }).click();
          await dialog.getByRole('button', { name: 'Select Product image' }).click();
          await dialog.getByTestId(`image-preset-${PRESET}`).click();
          if (PRESET === 'multi-image-collage') {
            const boxes = dialog.getByTestId('collage-picker').locator('input[type=checkbox]');
            const n = Math.min(Number(process.env.PHASE5_COLLAGE_N ?? 3), await boxes.count());
            for (let i = 0; i < n; i++) await boxes.nth(i).check();
          }
          if (process.env.PHASE5_BADGE) await dialog.getByLabel('Promo badge text').fill(process.env.PHASE5_BADGE);
          await page.waitForTimeout(800);
        }

        // Step 4: what the Layout Quality Check says for THIS footage.
        await dialog.getByRole('button', { name: /Step 4/i }).click();
        await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
        const panel = page.getByTestId('layout-quality-panel');
        await panel.scrollIntoViewIfNeeded();
        await expect(page.getByTestId('layout-quality-scope')).not.toContainText('Measuring', { timeout: 60_000 });
        const quality = {
          status: await page.getByTestId('layout-quality-status').getAttribute('data-status'),
          scope: (await page.getByTestId('layout-quality-scope').innerText()).trim(),
          issues: await page.locator('[data-testid="layout-quality-issues"] li').evaluateAll((l) =>
            l.map((x) => `${x.getAttribute('data-code')}:${x.getAttribute('data-severity')} ${(x.textContent ?? '').trim().slice(0, 110)}`)),
        };
        await panel.screenshot({ path: path.join(OUT, `${slug}-2-quality-before.png`) });
        // The customer marks where the subject is (panel control); the engine then avoids it.
        if (process.env.PHASE5_SUBJECT) {
          await page.getByTestId(`layout-quality-subject-${process.env.PHASE5_SUBJECT}`).click();
          await page.waitForTimeout(1200);
        }
        // Apply the engine's recommendation (never moves hand-placed or locked layers) and re-check.
        const readIssues = () => page.locator('[data-testid="layout-quality-issues"] li').evaluateAll((l) =>
          l.map((x) => `${x.getAttribute('data-code')}:${x.getAttribute('data-severity')} ${(x.textContent ?? '').trim().slice(0, 110)}`));
        const layerPositions = () => page.evaluate(() => (window as unknown as { __personalizationCtx?: { previewSettings?: { layers: { id: string; x: number; y: number }[] } } }).__personalizationCtx?.previewSettings?.layers.map((l) => `${l.id}@${l.x.toFixed(3)},${l.y.toFixed(3)}`) ?? []);
        const positionsBefore = await layerPositions();
        let afterRecommended: { status: string | null; issues: string[] } | null = null;
        if (!process.env.PHASE5_SHADOW && await page.locator('[data-testid="layout-quality-fix"]').count()) {
          await page.getByTestId('layout-quality-apply').click();
          await page.waitForTimeout(1500);
          afterRecommended = { status: await page.getByTestId('layout-quality-status').getAttribute('data-status'), issues: await readIssues() };
        }
        fs.writeFileSync(path.join(OUT, `${slug}-quality.json`), JSON.stringify({ demo, ratio, layout: LAYOUT, ...quality, positionsBefore, afterRecommended, positionsAfter: await layerPositions(), imageHints: await page.evaluate(() => (window as unknown as { __personalizationCtx?: { previewSettings?: { imageHints?: unknown } } }).__personalizationCtx?.previewSettings?.imageHints ?? null) }, null, 2));
        await panel.screenshot({ path: path.join(OUT, `${slug}-2-quality.png`) });
        await dialog.getByRole('button', { name: 'Compare' }).click().catch(() => undefined);
        await page.waitForTimeout(1500);
        const after = page.getByRole('region', { name: /After: personalized preview/i });
        if (await after.count()) {
          await after.first().evaluate((root) => {
            const range = root.querySelector('input[type=range]') as HTMLInputElement | null;
            if (!range) return;
            const max = Number(range.max) || 1; const min = Number(range.min) || 0;
            const m = /\/\s*(\d+):(\d+(?:\.\d+)?)/.exec(root.textContent ?? '');
            const total = m ? Number(m[1]) * 60 + Number(m[2]) : 5;
            const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
            set.call(range, String(min + (max - min) * (1.5 / total)));
            range.dispatchEvent(new Event('input', { bubbles: true }));
            range.dispatchEvent(new Event('change', { bubbles: true }));
          });
          await page.waitForTimeout(1500);
          await after.first().screenshot({ path: path.join(OUT, `${slug}-3-preview.png`) });
        }

        // Approve, confirm rights (never assumed), export for real.
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
      });
    }
  }
});
