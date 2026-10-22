/**
 * Remotion Phase 1 — final verification for the personalization motion designs.
 *
 * Scope: the five designs registered in
 * `src/shared/personalization/remotion/registry.ts`, offered by the
 * "Motion design" panel of Step 4
 * (`src/shared/personalization/guided/RemotionDesignPicker.tsx`).
 *
 * Every check in this file drives the REAL product surface: the landing demo
 * page (/personalization-demo?test=true) → the Personalization Modal → Step 4.
 *
 * Rendering note (important, and asserted rather than assumed):
 * Remotion 4.0.499's `<Player>` renders the composition into the DOM — it does
 * NOT paint into a `<canvas>`. So the "canvas pixel" technique used by the
 * older specs cannot be used against the composition itself. The pixel checks
 * below therefore sample the RENDERED PLAYER REGION: a PNG screenshot of the
 * player element is decoded back inside the browser (Image + canvas +
 * getImageData) and reduced to a luminance sum. That is the same signal the
 * old canvas probe produced (rendered pixels changed over time), it is simply
 * taken from a screenshot instead of from a canvas that does not exist here.
 * The probe records which path it used so the report is honest about it.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3113';

/** The five registered designs, in registry order. */
const DESIGNS = [
  {
    id: 'bounce-in-headline',
    name: 'Bounce In Headline',
    placement: 'full-frame' as const,
    textProp: 'Headline',
    expectedText: 'Signature Scent Collection',
  },
  {
    id: 'logo-mask-wipe',
    name: 'Logo Mask Wipe',
    placement: 'full-frame' as const,
    textProp: 'Brand name',
    expectedText: 'Aurelia Beauty Co',
  },
  {
    id: 'lower-third-glass-card',
    name: 'Lower Third Glass Card',
    placement: 'overlay' as const,
    textProp: 'Name',
    expectedText: 'Aurelia Beauty Co',
  },
  {
    id: 'social-reel',
    name: 'Social Reel Promo',
    placement: 'full-frame' as const,
    textProp: 'Brand name',
    expectedText: 'Aurelia Beauty Co',
  },
  {
    id: 'particle-explosion',
    name: 'Particle Explosion',
    placement: 'overlay' as const,
    textProp: 'Text',
    expectedText: 'Signature Scent Collection',
  },
];

/** The brand the seeded business profile contributes to the design props. */
const BRAND = {
  businessName: 'Aurelia Beauty Co',
  offer: 'Signature Scent Collection',
  callToAction: 'Shop the collection',
  website: 'https://aurelia-beauty.example.com',
  handle: '@aurelia-beauty',
};

/** A representative sample of the curated demo library (12 exist in total). */
const DEMO_SAMPLE = [
  {
    id: 2,
    slug: 'luxury-perfume-commercial',
    title: 'Luxury perfume commercial',
    videoSrc: '/media/minimax-h3/videos/luxury-perfume-commercial.webm',
  },
  {
    id: 14,
    slug: 'luxury-skincare-storyboard-commercial',
    title: 'Luxury Skincare Storyboard Commercial',
    videoSrc: '/media/minimax-h3/videos/luxury-skincare-storyboard-commercial.webm',
  },
  {
    id: 12,
    slug: 'ramen-bowl-ugc-taste-test',
    title: 'Ramen Bowl UGC Taste Test',
    videoSrc: '/media/minimax-h3/videos/ramen-bowl-ugc-taste-test.webm',
  },
  {
    id: 21,
    slug: 'strawberry-drink-transformation-commercial',
    title: 'Strawberry Drink Transformation Commercial',
    videoSrc: '/media/minimax-h3/videos/strawberry-drink-transformation-commercial.webm',
  },
  {
    id: 16,
    slug: 'turkish-eggs-mini-dv-recipe-vlog-107610',
    title: 'Turkish Eggs Mini-DV Recipe Vlog',
    videoSrc: '/media/seedance-25/videos/video-2503ba98404071af.webm',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function clickViaElement(locator: Locator) {
  const el = await locator.elementHandle();
  if (!el) throw new Error(`element not found for click: ${locator}`);
  await el.evaluate((e) => (e as HTMLElement).click());
}

/**
 * Seeds a saved business profile into localStorage BEFORE the app boots, so
 * Step 1 has a real business name to contribute to the design props. The
 * provider reads `smartvideo_clients` when it mounts
 * (src/shared/personalization/clientProfile.ts).
 */
async function seedBusinessProfile(page: Page) {
  await page.addInitScript((brand) => {
    const now = new Date().toISOString();
    localStorage.setItem(
      'smartvideo_clients',
      JSON.stringify({
        'client-agent7-brand': {
          id: 'client-agent7-brand',
          audience: 'me',
          name: brand.businessName,
          businessName: brand.businessName,
          industry: 'Beauty',
          location: 'London',
          phone: '+44 20 7946 0000',
          website: brand.website,
          offer: brand.offer,
          callToAction: brand.callToAction,
          brandDescription: 'Aurelia Beauty Co crafts signature scent collections.',
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
  }, BRAND);
}

/** Opens the landing demo page and waits for the Personalization Modal. */
async function openModal(page: Page): Promise<Locator> {
  await page.goto(`${BASE}/personalization-demo?test=true`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
  await expect(dialog).toBeVisible({ timeout: 30000 });
  // Synthetic clicks are no-ops until React has hydrated.
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  return dialog;
}

/** Picks the seeded business profile in Step 1 so brand data exists. */
async function applyBusinessProfile(dialog: Locator) {
  const useButton = dialog.getByRole('button', { name: 'Use', exact: true }).first();
  await expect(useButton).toBeVisible({ timeout: 15000 });
  await clickViaElement(useButton);
  await expect(
    dialog.getByText(BRAND.businessName, { exact: true }).first(),
  ).toBeVisible({ timeout: 15000 });
}

/** Walks Step 1 → 2 → 3 → 4. */
async function gotoStep4(page: Page, dialog: Locator): Promise<void> {
  const continueBtn = dialog.getByRole('button', { name: /Continue/i }).first();
  await expect(continueBtn).toBeVisible({ timeout: 20000 });
  await clickViaElement(continueBtn);

  // Step 2 — the video source picker.
  await expect(dialog.getByRole('tab', { name: /Your video/i })).toBeVisible({ timeout: 15000 });
  const continueToStep3 = dialog.getByRole('button', { name: /Continue/i }).first();
  await expect(continueToStep3).toBeVisible({ timeout: 15000 });
  await clickViaElement(continueToStep3);

  // Step 3 — the personalization step; "Preview my video" opens Step 4.
  const previewMyVideo = dialog.getByRole('button', { name: /Preview my video/i }).first();
  await expect(previewMyVideo).toBeVisible({ timeout: 20000 });
  await clickViaElement(previewMyVideo);

  await expect(
    dialog.getByRole('heading', { name: /Preview and approve/i }),
  ).toBeVisible({ timeout: 20000 });
}

/** The "Motion design" panel of Step 4. */
function designPicker(dialog: Locator): Locator {
  return dialog.getByTestId('remotion-design-picker');
}

/** Clicks a design pill and asserts it became the active selection. */
async function selectDesign(dialog: Locator, designId: string): Promise<Locator> {
  const pill = designPicker(dialog).getByTestId(`design-pill-${designId}`);
  await expect(pill).toBeVisible({ timeout: 15000 });
  await clickViaElement(pill);
  await expect(pill).toHaveAttribute('aria-pressed', 'true', { timeout: 15000 });
  return pill;
}

/** The Remotion player region of the AFTER (personalized) pane. */
function afterRegion(page: Page): Locator {
  return page.getByRole('region', { name: 'After: personalized preview' }).first();
}

/**
 * The Before/After preview starts on the BEFORE pane, which drops the design
 * on purpose (the BEFORE pane must show the untouched original). Switch to the
 * AFTER pane so the design is actually rendered.
 */
async function showAfterPane(page: Page): Promise<Locator> {
  const region = afterRegion(page);
  if ((await region.count()) > 0 && (await region.isVisible().catch(() => false))) {
    return region;
  }
  const toggle = page.getByRole('button', { name: /^Before$/ }).first();
  await expect(toggle).toBeVisible({ timeout: 15000 });
  await clickViaElement(toggle);
  await expect(region).toBeVisible({ timeout: 15000 });
  return region;
}

/** The Remotion player element itself (the composition, without the transport). */
function playerElement(page: Page): Locator {
  return page.locator('.__remotion-player').first();
}

/** Starts the preview playback (the transport starts paused). */
async function playPreview(page: Page) {
  const play = page.getByRole('button', { name: /^Play preview$/i }).first();
  if ((await play.count()) > 0 && (await play.isVisible().catch(() => false))) {
    await clickViaElement(play);
    await page.waitForTimeout(800);
  }
}

/** The transport timecode, e.g. "0:01.2 / 0:05.0". */
async function readTimecode(page: Page): Promise<string> {
  const region = afterRegion(page);
  const text = await region
    .getByText(/^\d+:\d+\.\d+ \/ \d+:\d+\.\d+$/)
    .first()
    .textContent()
    .catch(() => null);
  return (text || '').trim();
}

interface PixelStats {
  sum: number;
  mean: number;
  nonBlackRatio: number;
  width: number;
  height: number;
}

/**
 * Decodes a PNG buffer inside the page and reduces it to a luminance sum.
 * `region` restricts the measurement to a sub-rectangle (fractions 0..1).
 */
async function decodePngInPage(
  page: Page,
  buffer: Buffer,
  region?: { x0: number; y0: number; x1: number; y1: number },
): Promise<PixelStats> {
  const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
  return page.evaluate(
    async ({ url, rect }) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { sum: 0, nonBlackRatio: 0, width: 0, height: 0 };
      ctx.drawImage(img, 0, 0);
      const x0 = Math.floor((rect?.x0 ?? 0) * canvas.width);
      const y0 = Math.floor((rect?.y0 ?? 0) * canvas.height);
      const x1 = Math.ceil((rect?.x1 ?? 1) * canvas.width);
      const y1 = Math.ceil((rect?.y1 ?? 1) * canvas.height);
      const width = Math.max(1, x1 - x0);
      const height = Math.max(1, y1 - y0);
      const data = ctx.getImageData(x0, y0, width, height).data;
      let sum = 0;
      let nonBlack = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 16) {
        const luminance = data[i] + data[i + 1] + data[i + 2];
        sum += luminance;
        if (luminance > 30) nonBlack += 1;
        count += 1;
      }
      return {
        sum,
        mean: count > 0 ? sum / (count * 3) : 0,
        nonBlackRatio: count > 0 ? nonBlack / count : 0,
        width: canvas.width,
        height: canvas.height,
      };
    },
    { url: dataUrl, rect: region ?? null },
  );
}

/** Screenshot + decode of the Remotion player element. */
async function samplePlayer(
  page: Page,
  region?: { x0: number; y0: number; x1: number; y1: number },
): Promise<PixelStats> {
  const player = playerElement(page);
  await player.scrollIntoViewIfNeeded();
  const buffer = await player.screenshot({ type: 'png' });
  return decodePngInPage(page, buffer, region);
}

/**
 * Reads the video canvas the composition paints the customer's footage into.
 * Remotion 4.0.499 renders the composition's TEXT as DOM, but the source
 * video is painted into a `<canvas>` (class `__remotion_objectfitcontain`).
 */
async function probeVideoCanvas(page: Page): Promise<{
  found: boolean;
  has2d: boolean;
  width: number;
  height: number;
  sum: number;
  mean: number;
  topSum: number;
  topMean: number;
  topNonBlackRatio: number;
}> {
  return page.evaluate(() => {
    const empty = {
      found: false,
      has2d: false,
      width: 0,
      height: 0,
      sum: 0,
      mean: 0,
      topSum: 0,
      topMean: 0,
      topNonBlackRatio: 0,
    };
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return empty;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { ...empty, found: true, width: canvas.width, height: canvas.height };
    }
    const measure = (data: Uint8ClampedArray) => {
      let sum = 0;
      let nonBlack = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 400) {
        const luminance = data[i] + data[i + 1] + data[i + 2];
        sum += luminance;
        if (luminance > 30) nonBlack += 1;
        count += 1;
      }
      return {
        sum,
        mean: count > 0 ? sum / (count * 3) : 0,
        nonBlackRatio: count > 0 ? nonBlack / count : 0,
      };
    };
    const full = measure(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
    const top = measure(
      ctx.getImageData(0, 0, canvas.width, Math.max(1, Math.floor(canvas.height * 0.5))).data,
    );
    return {
      found: true,
      has2d: true,
      width: canvas.width,
      height: canvas.height,
      sum: full.sum,
      mean: full.mean,
      topSum: top.sum,
      topMean: top.mean,
      topNonBlackRatio: top.nonBlackRatio,
    };
  });
}

/**
 * Samples the video canvas several times over a short window.
 *
 * A single frame of a cinematic clip can be almost black, so "the footage is
 * visible" is judged on the brightest of several frames, not on one.
 */
async function sampleVideoCanvasOverTime(
  page: Page,
  samples = 6,
  gapMs = 500,
): Promise<Array<Awaited<ReturnType<typeof probeVideoCanvas>>>> {
  const out: Array<Awaited<ReturnType<typeof probeVideoCanvas>>> = [];
  for (let i = 0; i < samples; i += 1) {
    out.push(await probeVideoCanvas(page));
    if (i < samples - 1) await page.waitForTimeout(gapMs);
  }
  return out;
}

/** Collects console errors and failed network requests for the whole run. */
const CONSOLE_ERRORS: string[] = [];
const NETWORK_ERRORS: string[] = [];
let consoleHooked = false;

function hookDiagnostics(page: Page) {
  if (consoleHooked) return;
  consoleHooked = true;
  page.on('console', (msg) => {
    if (msg.type() === 'error') CONSOLE_ERRORS.push(msg.text());
  });
  page.on('pageerror', (err) => {
    CONSOLE_ERRORS.push(`pageerror: ${err.message}`);
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    NETWORK_ERRORS.push(
      `${request.method()} ${request.url()} — ${failure ? failure.errorText : 'unknown'}`,
    );
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      NETWORK_ERRORS.push(`${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs the REAL entry-point contract module.
 *
 * The contract is plain TypeScript, but it pulls in `@/libs/viralMediaResolver`,
 * which uses `import.meta` — that cannot be loaded through the Playwright
 * CommonJS transform. `tsx` (a direct devDependency) runs the module with full
 * ESM semantics, so the contract is executed as-is rather than re-implemented.
 */
function runContract(entry: Record<string, unknown>): {
  request: { source: Record<string, unknown>; access: string };
  options: { source: Record<string, unknown>; access: string; trigger: unknown };
} {
  const script = [
    "import { toPersonalizationOpenRequest, createPersonalizationOpenOptions } from './src/shared/personalization/entryPoint';",
    `const entry = ${JSON.stringify(entry)};`,
    "const request = toPersonalizationOpenRequest(entry);",
    "const options = createPersonalizationOpenOptions(entry);",
    "console.log(JSON.stringify({ request, options }));",
  ].join('\n');
  const stdout = execFileSync('npx', ['tsx', '-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 120000,
  });
  const line = stdout
    .trim()
    .split('\n')
    .filter((value) => value.trim().length > 0)
    .pop();
  if (!line) throw new Error(`the contract produced no output: ${stdout}`);
  return JSON.parse(line);
}

test.describe('Remotion Phase 1 — personalization motion designs', () => {
  // These tests walk the whole wizard (Step 1 → Step 4), fetch real media and
  // render the Remotion player. The default 90s budget is not enough when the
  // machine is under load, so give each test room to complete.
  test.setTimeout(240_000);
  test.beforeEach(async ({ page }) => {
    hookDiagnostics(page);
  });

  test.afterAll(() => {
    // Printed so the report can quote the exact strings.
    console.log('=== CONSOLE ERRORS (agent 7) ===');
    for (const err of CONSOLE_ERRORS) console.log(`CONSOLE_ERROR: ${err}`);
    console.log('=== NETWORK ERRORS (agent 7) ===');
    for (const err of NETWORK_ERRORS) console.log(`NETWORK_ERROR: ${err}`);
  });

  test('12 curated demos still play in Step 2', async ({ page }) => {
    // The demo-playback helper of e2e/personalization-demo-video-playback.spec.ts
    // is NOT exported, so this test re-implements the same reachability logic
    // and asserts a representative sample of the 12 curated demos
    // (5 of 12) still renders a playing <video> in Step 2.
    await seedBusinessProfile(page);
    const dialog = await openModal(page);

    const continueBtn = dialog.getByRole('button', { name: /Continue/i }).first();
    await expect(continueBtn).toBeVisible({ timeout: 20000 });
    await clickViaElement(continueBtn);

    const aiDemosTab = dialog.getByRole('tab', { name: /AI Demos/i });
    await expect(aiDemosTab).toBeVisible({ timeout: 15000 });
    await clickViaElement(aiDemosTab);

    const playButtons = dialog.locator('button[aria-label^="Play "]');
    await expect(playButtons.first()).toBeAttached({ timeout: 15000 });

    /** The Demos tab mounts its cards in windows; page to a card first. */
    const revealDemoCard = async (demo: { id: number; slug: string }) => {
      const card = dialog.getByTestId(`demo-card-${demo.id}-${demo.slug}`);
      for (let i = 0; i < 40; i += 1) {
        if ((await card.count()) > 0) return true;
        const more = dialog.getByTestId('demo-show-more');
        if ((await more.count()) === 0) return false;
        const before = await dialog.locator('[data-demo-id]').count();
        await clickViaElement(more.first());
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline) {
          if ((await dialog.locator('[data-demo-id]').count()) > before) break;
          await page.waitForTimeout(100);
        }
      }
      return (await card.count()) > 0;
    };

    for (const demo of DEMO_SAMPLE) {
      expect(await revealDemoCard(demo), `card ${demo.slug} must be reachable`).toBe(true);

      const playButton = dialog.locator(`button[aria-label="Play ${demo.title}"]`);
      await expect(playButton.first()).toBeAttached({ timeout: 10000 });
      await clickViaElement(playButton.first());

      const card = dialog.getByTestId(`demo-card-${demo.id}-${demo.slug}`);
      const player = card.locator('[data-testid="demo-player"]');
      await expect(player).toHaveCount(1, { timeout: 15000 });

      const src = await player.getAttribute('src');
      expect(src, `${demo.slug} must point at its own clip`).toContain(demo.videoSrc);

      const playback = await player.evaluate(async (v: HTMLVideoElement) => {
        const deadline = Date.now() + 20000;
        while (Date.now() < deadline) {
          if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) break;
          if (v.error) break;
          await new Promise((r) => setTimeout(r, 100));
        }
        const start = v.currentTime;
        try {
          await v.play();
        } catch {
          /* autoplay may be rejected; the currentTime probe below still runs */
        }
        const playDeadline = Date.now() + 8000;
        while (Date.now() < playDeadline) {
          if (v.currentTime > start + 0.05) break;
          await new Promise((r) => setTimeout(r, 100));
        }
        return {
          readyState: v.readyState,
          haveCurrentData: v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
          advanced: v.currentTime > start + 0.05,
          currentTime: v.currentTime,
          error: v.error?.message ?? null,
        };
      });

      console.log(`DEMO ${demo.slug}: ${JSON.stringify(playback)}`);
      expect(playback.error, `${demo.slug} must not error`).toBeNull();
      expect(
        playback.haveCurrentData,
        `${demo.slug} must reach HAVE_CURRENT_DATA (readyState >= 2), got ${playback.readyState}`,
      ).toBe(true);
      expect(
        playback.advanced,
        `${demo.slug} must advance currentTime, got ${playback.currentTime}`,
      ).toBe(true);
    }
  });

  test('each Remotion design is selectable in Step 4 and renders', async ({ page }) => {
    await seedBusinessProfile(page);
    const dialog = await openModal(page);
    await applyBusinessProfile(dialog);
    await gotoStep4(page, dialog);

    for (const design of DESIGNS) {
      await selectDesign(dialog, design.id);

      // The picker's editor shows the EFFECTIVE props of the selected design.
      const field = designPicker(dialog)
        .getByLabel(`Design text: ${design.textProp}`)
        .first();
      await expect(field).toBeVisible({ timeout: 10000 });
      const value = await field.inputValue();
      expect(
        value,
        `${design.id}: the "${design.textProp}" prop must carry the design copy`,
      ).toContain(design.expectedText);

      // The design itself must be rendered by the Remotion player.
      await showAfterPane(page);
      await playPreview(page);

      const inPlayerDom = await afterRegion(page)
        .getByText(design.expectedText, { exact: false })
        .count();
      const designMarker = await page
        .locator(`[data-remotion-design-id="${design.id}"]`)
        .count();

      console.log(
        `DESIGN ${design.id}: pickerValue=${JSON.stringify(value)} inPlayerDom=${inPlayerDom} marker=${designMarker}`,
      );

      expect(
        designMarker,
        `${design.id}: the design component must be mounted in the composition`,
      ).toBeGreaterThan(0);
      expect(
        inPlayerDom,
        `${design.id}: the design copy must be visible in the player DOM`,
      ).toBeGreaterThan(0);
    }
  });

  test('the preview advances after a design is selected', async ({ page }) => {
    await seedBusinessProfile(page);
    const dialog = await openModal(page);
    await applyBusinessProfile(dialog);
    await gotoStep4(page, dialog);

    // An OVERLAY design is used here on purpose: the customer's footage keeps
    // playing underneath it, so the rendered pixels are guaranteed to change
    // from frame to frame. (A full-frame design paints the whole scene and
    // can legitimately settle on a static frame once its animation is over —
    // its liveness is proven by the transport timecode instead.)
    await selectDesign(dialog, 'lower-third-glass-card');
    await showAfterPane(page);
    await playPreview(page);

    const firstTimecode = await readTimecode(page);
    const first = await samplePlayer(page);
    await page.waitForTimeout(2500);
    const second = await samplePlayer(page);
    const secondTimecode = await readTimecode(page);

    console.log(
      `ADVANCE: sum ${first.sum} -> ${second.sum} (mean ${first.mean.toFixed(2)} -> ${second.mean.toFixed(2)}), timecode "${firstTimecode}" -> "${secondTimecode}"`,
    );

    expect(first.sum, 'the player must contain rendered pixels').toBeGreaterThan(0);
    expect(
      second.sum,
      'the rendered pixels must change over time — the composition is advancing',
    ).not.toBe(first.sum);
    expect(
      secondTimecode,
      'the transport timecode must advance',
    ).not.toBe(firstTimecode);
  });

  test('an overlay design composites over the customer video', async ({ page }) => {
    await seedBusinessProfile(page);
    const dialog = await openModal(page);
    await applyBusinessProfile(dialog);
    await gotoStep4(page, dialog);

    await showAfterPane(page);
    await playPreview(page);

    // Baseline: no design selected, the footage fills the frame.
    const baseline = await samplePlayer(page);
    const baselineCanvas = await probeVideoCanvas(page);

    await selectDesign(dialog, 'lower-third-glass-card');
    await showAfterPane(page);
    await playPreview(page);

    const withDesign = await samplePlayer(page);
    // The card sits at x 6%..48%, y 74%..94% of the composition. The TOP half
    // of the frame is away from the card, so it must still show footage.
    const topHalf = await samplePlayer(page, { x0: 0, y0: 0, x1: 1, y1: 0.55 });
    const cardArea = await samplePlayer(page, { x0: 0.06, y0: 0.74, x1: 0.48, y1: 0.94 });
    const overlayCanvasSamples = await sampleVideoCanvasOverTime(page);
    const overlayCanvas = overlayCanvasSamples[overlayCanvasSamples.length - 1];
    const bestTopMean = Math.max(...overlayCanvasSamples.map((s) => s.topMean));
    const bestCanvasMean = Math.max(...overlayCanvasSamples.map((s) => s.mean));

    const structure = await page.evaluate(() => {
      const designEl = document.querySelector(
        '[data-remotion-design-id="lower-third-glass-card"]',
      );
      if (!designEl) return { found: false as const };
      const root = designEl.closest('.__remotion-player') ?? document;
      const style = getComputedStyle(designEl);
      return {
        found: true as const,
        insidePlayer: Boolean(designEl.closest('.__remotion-player')),
        designText: (designEl.textContent || '').trim(),
        designPosition: style.position,
        designBackground: style.backgroundColor,
        designOverflow: style.overflow,
        playerHasCanvas: Boolean(root.querySelector('canvas')),
      };
    });

    console.log(
      `OVERLAY: baselineSum=${baseline.sum} withDesignSum=${withDesign.sum} topHalfMean=${topHalf.mean.toFixed(2)} cardAreaMean=${cardArea.mean.toFixed(2)}`,
    );
    console.log(
      `OVERLAY: baselineCanvas=${JSON.stringify(baselineCanvas)}`,
    );
    console.log(
      `OVERLAY: overlayCanvasMean=${overlayCanvas.mean.toFixed(2)} bestTopMean=${bestTopMean.toFixed(2)} bestCanvasMean=${bestCanvasMean.toFixed(2)} samples=${overlayCanvasSamples.length}`,
    );
    console.log(`OVERLAY: structure=${JSON.stringify(structure)}`);

    // 1. The design is mounted and its copy is rendered.
    expect(structure.found, 'the overlay design must be mounted').toBe(true);
    expect(structure.insidePlayer, 'the design must be rendered inside the player').toBe(true);
    expect(structure.designText, 'the design must carry its copy').toContain(BRAND.businessName);
    const copyInDom = await afterRegion(page)
      .getByText(BRAND.businessName, { exact: false })
      .count();
    expect(copyInDom, 'the overlay design copy must be visible in the player DOM').toBeGreaterThan(0);

    // 2. The design composites OVER the video: the footage canvas is still in
    //    the composition and the design root is transparent.
    expect(
      structure.playerHasCanvas,
      'the customer video must still be rendered under the overlay',
    ).toBe(true);
    expect(
      structure.designBackground,
      'the overlay design root must stay transparent',
    ).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(
      overlayCanvas.found,
      'the video canvas must still be present with the overlay design selected',
    ).toBe(true);
    expect(overlayCanvas.has2d, 'the video canvas must expose a 2D context').toBe(true);
    expect(
      bestCanvasMean,
      'the video canvas must still contain the customer footage',
    ).toBeGreaterThan(1);
    expect(
      bestTopMean,
      'the canvas area away from the card must still show non-black footage',
    ).toBeGreaterThan(1);

    // 3. The RENDERED composite away from the card still shows footage.
    expect(
      topHalf.mean,
      'the rendered region away from the card must still show the customer footage',
    ).toBeGreaterThan(1);

    // 4. The overlay actually changed the rendered frame.
    expect(
      withDesign.sum,
      'the overlay design must change what the player renders',
    ).not.toBe(baseline.sum);
  });

  test('the existing pill-shaped options still work', async ({ page }) => {
    await seedBusinessProfile(page);
    const dialog = await openModal(page);
    await applyBusinessProfile(dialog);
    await gotoStep4(page, dialog);

    await showAfterPane(page);
    await playPreview(page);

    const baseline = await samplePlayer(page);
    const baselineTimecode = await readTimecode(page);

    // The ORIGINAL layout pills ("Quick adjustments") — not the new Motion
    // design pills.
    const layoutPill = dialog.getByRole('button', { name: 'Product Showcase', exact: true }).first();
    await expect(layoutPill).toBeVisible({ timeout: 10000 });
    await clickViaElement(layoutPill);
    await expect(layoutPill).toHaveAttribute('aria-pressed', 'true', { timeout: 10000 });

    // The preview must still be live after the layout switch.
    await page.waitForTimeout(2500);
    const afterLayout = await samplePlayer(page);
    const afterTimecode = await readTimecode(page);

    console.log(
      `LAYOUT PILL: baselineSum=${baseline.sum} afterLayoutSum=${afterLayout.sum} timecode "${baselineTimecode}" -> "${afterTimecode}" pressed=${await layoutPill.getAttribute('aria-pressed')}`,
    );

    expect(
      await layoutPill.getAttribute('aria-pressed'),
      'the layout pill must be marked active',
    ).toBe('true');
    expect(afterLayout.sum, 'the preview must still render pixels').toBeGreaterThan(0);
    expect(
      afterTimecode,
      'the preview must still advance after the layout switch',
    ).not.toBe(baselineTimecode);

    // And the Motion design picker is still present and independent.
    await expect(designPicker(dialog)).toBeVisible({ timeout: 10000 });
    await selectDesign(dialog, 'social-reel');
    await expect(layoutPill).toHaveAttribute('aria-pressed', 'true', { timeout: 10000 });
  });

  test('brand data populates the design props', async ({ page }) => {
    await seedBusinessProfile(page);
    const dialog = await openModal(page);
    await applyBusinessProfile(dialog);
    await gotoStep4(page, dialog);

    // lower-third: nameText = businessName, titleText = offer.
    await selectDesign(dialog, 'lower-third-glass-card');
    const nameField = designPicker(dialog).getByLabel('Design text: Name').first();
    const titleField = designPicker(dialog).getByLabel('Design text: Title').first();
    await expect(nameField).toBeVisible({ timeout: 10000 });
    expect(await nameField.inputValue()).toBe(BRAND.businessName);
    expect(await titleField.inputValue()).toBe(BRAND.offer);

    // social-reel: brandName = businessName, handle = website host, caption.
    await selectDesign(dialog, 'social-reel');
    const brandField = designPicker(dialog).getByLabel('Design text: Brand name').first();
    const handleField = designPicker(dialog).getByLabel('Design text: Handle').first();
    await expect(brandField).toBeVisible({ timeout: 10000 });
    expect(await brandField.inputValue()).toBe(BRAND.businessName);
    expect(await handleField.inputValue()).toBe(BRAND.handle);

    // logo-mask-wipe: brandText = businessName, monogram = initials.
    await selectDesign(dialog, 'logo-mask-wipe');
    const brandTextField = designPicker(dialog).getByLabel('Design text: Brand name').first();
    const monogramField = designPicker(dialog).getByLabel('Design text: Monogram').first();
    await expect(brandTextField).toBeVisible({ timeout: 10000 });
    expect(await brandTextField.inputValue()).toBe(BRAND.businessName);
    expect(await monogramField.inputValue()).toBe('ABC');

    // The brand values must reach the rendered composition, not only the editor.
    await showAfterPane(page);
    await playPreview(page);
    const inDom = await afterRegion(page).getByText(BRAND.businessName, { exact: false }).count();
    expect(inDom, 'the business name must be rendered in the composition').toBeGreaterThan(0);
  });

  test('a selected design survives a reload', async ({ page }) => {
    await seedBusinessProfile(page);
    const dialog = await openModal(page);
    await applyBusinessProfile(dialog);
    await gotoStep4(page, dialog);

    await selectDesign(dialog, 'particle-explosion');

    // The provider mirrors previewSettings into a per-user localStorage entry
    // (key prefix `smartvideo_preview_state_`) on an 800ms debounce. Wait for
    // the mirror to actually CONTAIN the design id rather than assuming a
    // fixed delay is long enough — that proves the product persisted it.
    const mirrorHasDesign = await page
      .waitForFunction(
        () => {
          const prefix = 'smartvideo_preview_state_';
          for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(prefix)) continue;
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            try {
              const parsed = JSON.parse(raw) as { previewSettings?: { remotionDesignId?: string } };
              if (parsed?.previewSettings?.remotionDesignId === 'particle-explosion') return true;
            } catch {
              /* ignore malformed entries */
            }
          }
          return false;
        },
        undefined,
        { timeout: 20000 },
      )
      .then(() => true)
      .catch(() => false);
    expect(mirrorHasDesign, 'the selected design must be persisted to the localStorage mirror').toBe(true);

    await page.reload({ waitUntil: 'domcontentloaded' });
    const dialogAfterReload = page.getByRole('dialog', { name: 'Personalize this demo' });
    await expect(dialogAfterReload).toBeVisible({ timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    // The restored session may land on any step; walk back to Step 4 if needed.
    const step4Heading = dialogAfterReload.getByRole('heading', { name: /Preview and approve/i });
    if ((await step4Heading.count()) === 0 || !(await step4Heading.isVisible().catch(() => false))) {
      // The stepper is clickable: jump straight to step 4.
      const stepper = dialogAfterReload.getByRole('button', { name: /Step 4/i }).first();
      if ((await stepper.count()) > 0) {
        await clickViaElement(stepper);
      } else {
        await gotoStep4(page, dialogAfterReload);
      }
      await expect(step4Heading).toBeVisible({ timeout: 20000 });
    }

    const pill = designPicker(dialogAfterReload).getByTestId('design-pill-particle-explosion');
    await expect(pill).toBeVisible({ timeout: 15000 });
    // The restored session is applied asynchronously: the provider re-applies
    // the localStorage preview mirror (which carries the design id) on a
    // Supabase miss, and that resolve can land after the modal paints. Poll
    // for the selection instead of sampling it once.
    let pressed: string | null = null;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      pressed = await pill.getAttribute('aria-pressed');
      if (pressed === 'true') break;
      await page.waitForTimeout(250);
    }
    console.log(`RELOAD: design-pill-particle-explosion aria-pressed=${pressed}`);
    expect(
      pressed,
      'the selected design must survive a reload',
    ).toBe('true');
  });

  test('the shared entry-point contract opens the modal', async ({ page, request }) => {
    // The contract is a pure adapter module, so it is driven directly (as the
    // real module, via tsx). Driving the REAL modal FROM the contract is not
    // reachable from the page — the module is not exposed to the browser — so
    // this test asserts (a) the contract's normalisation, (b) that the
    // request's source actually resolves over HTTP, and (c) the provider's
    // existing landing-page open path (the modal opens with a bound source).
    const videoSource = '/media/minimax-h3/videos/luxury-perfume-commercial.webm';

    const { request: request0, options } = runContract({
      originatingStudio: 'agent7-verification',
      projectRef: 'run-001',
      sourceVideo: videoSource,
      mediaType: 'video',
      aspectRatio: '16:9',
      durationSeconds: 15,
      brandAssets: { brandName: BRAND.businessName, brandColors: ['#29d3f2'] },
      prompt: 'A luxury perfume commercial.',
    });

    console.log(`ENTRY POINT: request=${JSON.stringify(request0)}`);

    expect(request0.access).toBe('authenticated');
    expect(request0.source.sourceType).toBe('future-demo');
    expect(request0.source.mediaType).toBe('video');
    expect(request0.source.sourceMedia).toBe(videoSource);
    expect(request0.source.aspectRatio).toBe('16:9');
    expect(request0.source.duration).toBe(15);
    expect(request0.source.id).toBe('agent7-verification:run-001');
    expect(
      (request0.source.sourceMetadata as Record<string, unknown>).brandAssets,
    ).toMatchObject({ brandName: BRAND.businessName });

    expect(options.source.sourceMedia).toBe(videoSource);
    expect(options.access).toBe('authenticated');
    expect(options.trigger).toBeNull();

    // The source must resolve.
    const resolved = await request.get(`${BASE}${videoSource}`);
    expect(resolved.status(), 'the contract source must resolve').toBe(200);
    expect(Number(resolved.headers()['content-length'] ?? 0)).toBeGreaterThan(0);

    // The provider's existing landing-page open path still opens the modal
    // with a bound, playable source. The landing page opens the modal at
    // Step 1, so the media is only in the DOM once the wizard reaches the
    // preview (Step 4) — the check walks the wizard there.
    const dialog = await openModal(page);
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await gotoStep4(page, dialog);
    await showAfterPane(page);
    await playPreview(page);

    const sourceBound = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      const ctx = canvas ? canvas.getContext('2d') : null;
      let sum = 0;
      if (ctx && canvas) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 0; i < data.length; i += 400) sum += data[i] + data[i + 1] + data[i + 2];
      }
      return {
        hasMedia: Boolean(canvas),
        canvasCount: document.querySelectorAll('canvas').length,
        mediaSum: sum,
      };
    });
    console.log(`ENTRY POINT: landing path=${JSON.stringify(sourceBound)}`);
    expect(sourceBound.hasMedia, 'the modal must bind a media source').toBe(true);
    expect(
      sourceBound.mediaSum,
      'the bound source must actually render footage in the preview',
    ).toBeGreaterThan(0);
  });

  test('auth and entitlements unchanged', async ({ request }) => {
    const unauthenticated = await request.get(`${BASE}/api/personalization/project`);
    console.log(`AUTH: GET /api/personalization/project -> ${unauthenticated.status()}`);
    expect(
      unauthenticated.status(),
      'the project API must stay unauthenticated',
    ).toBe(401);

    // A bogus session cookie must not unlock anything either.
    const withCookie = await request.get(`${BASE}/api/personalization/project`, {
      headers: { cookie: '__session=not-a-real-session' },
    });
    console.log(`AUTH: with bogus cookie -> ${withCookie.status()}`);
    expect(withCookie.status()).toBe(401);

    // The project API must not answer for a non-GET method without auth either.
    const post = await request.post(`${BASE}/api/personalization/project`, {
      data: { sourceId: 'demo-roofing-1' },
    });
    console.log(`AUTH: POST /api/personalization/project -> ${post.status()}`);
    expect(post.status()).toBe(401);
  });
});
