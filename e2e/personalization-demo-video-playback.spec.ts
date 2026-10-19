import { test, expect, type Locator, type Page } from '@playwright/test';

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3112';

/**
 * Expected curated demo data, mirroring GUIDED_DEMO_VIDEOS from
 * src/shared/personalization/guided/curatedDemos.ts (which concatenates
 * MINIMAX_H3_DEMOS then SEEDANCE_25_DEMOS, dropping entries missing media).
 */
const EXPECTED_DEMOS: Array<{ id: number; slug: string; title: string; videoSrc: string; sourceRepo: string }> = [
  { id: 2, slug: 'luxury-perfume-commercial', title: 'Luxury perfume commercial', videoSrc: '/media/minimax-h3/videos/luxury-perfume-commercial.webm', sourceRepo: 'minimax-h3' },
  { id: 14, slug: 'luxury-skincare-storyboard-commercial', title: 'Luxury Skincare Storyboard Commercial', videoSrc: '/media/minimax-h3/videos/luxury-skincare-storyboard-commercial.webm', sourceRepo: 'minimax-h3' },
  { id: 28, slug: 'emerald-bio-serum-product-film', title: 'Emerald Bio-Serum Product Film', videoSrc: '/media/minimax-h3/videos/emerald-bio-serum-product-film.webm', sourceRepo: 'minimax-h3' },
  { id: 29, slug: 'black-and-gold-perfume-commercial', title: 'Black-and-Gold Perfume Commercial', videoSrc: '/media/minimax-h3/videos/black-and-gold-perfume-commercial.webm', sourceRepo: 'minimax-h3' },
  { id: 18, slug: 'yellow-sunglasses-in-a-black-studio', title: 'Yellow Sunglasses in a Black Studio', videoSrc: '/media/minimax-h3/videos/yellow-sunglasses-in-a-black-studio.webm', sourceRepo: 'minimax-h3' },
  { id: 12, slug: 'ramen-bowl-ugc-taste-test', title: 'Ramen Bowl UGC Taste Test', videoSrc: '/media/minimax-h3/videos/ramen-bowl-ugc-taste-test.webm', sourceRepo: 'minimax-h3' },
  { id: 13, slug: 'gourmet-burger-ugc-taste-test', title: 'Gourmet Burger UGC Taste Test', videoSrc: '/media/minimax-h3/videos/gourmet-burger-ugc-taste-test.webm', sourceRepo: 'minimax-h3' },
  { id: 23, slug: 'porto-francesinha-comedy-recipe', title: 'Porto Francesinha Comedy Recipe', videoSrc: '/media/minimax-h3/videos/porto-francesinha-comedy-recipe.webm', sourceRepo: 'minimax-h3' },
  { id: 21, slug: 'strawberry-drink-transformation-commercial', title: 'Strawberry Drink Transformation Commercial', videoSrc: '/media/minimax-h3/videos/strawberry-drink-transformation-commercial.webm', sourceRepo: 'minimax-h3' },
  { id: 19, slug: 'theme-park-memory-montage', title: 'Theme Park Memory Montage', videoSrc: '/media/minimax-h3/videos/theme-park-memory-montage.webm', sourceRepo: 'minimax-h3' },
  { id: 16, slug: 'turkish-eggs-mini-dv-recipe-vlog-107610', title: 'Turkish Eggs Mini-DV Recipe Vlog', videoSrc: '/media/seedance-25/videos/video-2503ba98404071af.webm', sourceRepo: 'seedance-25' },
  { id: 29, slug: 'product-commercial-study-309837', title: 'Product Commercial Study 309837', videoSrc: '/media/seedance-25/videos/video-32ba5442fa856d7c.webm', sourceRepo: 'seedance-25' },
];

interface DemoResult {
  id: number;
  slug: string;
  title: string;
  videoSrc: string;
  sourceRepo: string;
  buttonFound: boolean;
  videoElementFound: boolean;
  videoSrcCorrect: boolean;
  metadataLoaded: boolean;
  videoWidthPositive: boolean;
  videoHeightPositive: boolean;
  playbackStarted: boolean;
  currentTimeAdvanced: boolean;
  videoError: string | null;
  consoleErrors: string[];
  networkErrors: string[];
  step4PreviewMatch: boolean;
  pass: boolean;
}

const allResults: DemoResult[] = [];

async function clickViaElement(locator: Locator) {
  const el = await locator.elementHandle();
  if (!el) throw new Error(`element not found for click: ${locator}`);
  await el.evaluate((e) => e.click());
}

async function waitForVideoMetadata(page: Page, videoSelector: string, timeoutMs = 10000): Promise<boolean> {
  return page.evaluate(async ({ selector, timeoutMs }) => {
    const video = document.querySelector(selector) as HTMLVideoElement | null;
    if (!video) return false;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  }, { selector: videoSelector, timeoutMs });
}

async function waitForCurrentTimeAdvance(page: Page, videoSelector: string, timeoutMs = 5000): Promise<boolean> {
  return page.evaluate(async ({ selector, timeoutMs }) => {
    const video = document.querySelector(selector) as HTMLVideoElement | null;
    if (!video) return false;
    const initial = video.currentTime;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (Math.abs(video.currentTime - initial) > 0.05) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  }, { selector: videoSelector, timeoutMs });
}

test.describe('Personalization Modal — Demo Video Playback', () => {
  test('all curated demo videos play successfully in the Personalization Modal', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });
    page.on('requestfailed', (request) => {
      networkErrors.push(request.url());
    });

    // ── Open the personalization demo page ─────────────────────────────
    await page.goto(`${BASE}/personalization-demo?test=true`, { waitUntil: 'domcontentloaded' });

    // Wait for the Personalization Modal dialog to open.
    const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
    await expect(dialog).toBeVisible({ timeout: 20000 });

    // ── Step 1 → Step 2: click Continue ────────────────────────────────
    const continueBtn = dialog.getByRole('button', { name: /Continue/i });
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await clickViaElement(continueBtn);

    // Wait for Step 2: the video source picker tabs appear.
    await expect(dialog.getByRole('tab', { name: /Your video/i })).toBeVisible({ timeout: 10000 });

    // Click the "AI Demos" tab.
    const aiDemosTab = dialog.getByRole('tab', { name: /AI Demos/i });
    await expect(aiDemosTab).toBeVisible({ timeout: 10000 });
    await clickViaElement(aiDemosTab);

    // Wait for the demo grid to render.
    const playButtons = dialog.locator('button[aria-label^="Play "]');
    await expect(playButtons.first()).toBeAttached({ timeout: 10000 });
    const buttonCount = await playButtons.count();
    console.log(`Found ${buttonCount} demo play buttons`);

    // Test each demo.
    for (const expected of EXPECTED_DEMOS) {
      const result: DemoResult = {
        id: expected.id,
        slug: expected.slug,
        title: expected.title,
        videoSrc: expected.videoSrc,
        sourceRepo: expected.sourceRepo,
        buttonFound: false,
        videoElementFound: false,
        videoSrcCorrect: false,
        metadataLoaded: false,
        videoWidthPositive: false,
        videoHeightPositive: false,
        playbackStarted: false,
        currentTimeAdvanced: false,
        videoError: null,
        consoleErrors: [...consoleErrors],
        networkErrors: [...networkErrors],
        step4PreviewMatch: false,
        pass: false,
      };

      console.log(`\n--- Testing demo: ${result.title} (${result.slug}) ---`);

      // Find the play button for this demo by its exact aria-label.
      // The overlay starts invisible (opacity 0) until hovered; locate by exact
      // aria-label (avoids matching the outer card button) and click via element
      // handle so the invisible overlay can still be activated.
      const playButton = dialog.locator(`button[aria-label="Play ${result.title}"]`);
      try {
        await expect(playButton.first()).toBeAttached({ timeout: 5000 });
        result.buttonFound = true;
      } catch {
        console.log(`  PLAY BUTTON NOT FOUND: Play ${result.title}`);
        allResults.push(result);
        continue;
      }

      // Reveal the overlay (move mouse over it so opacity -> 1) then click it.
      try {
        const box = await playButton.first().boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await expect(playButton.first()).toBeVisible({ timeout: 5000 });
        }
      } catch {
        // best-effort reveal; proceed with programmatic click regardless
      }
      await clickViaElement(playButton.first());

      // Wait for the <video> to reflect the newly selected demo's src.
      const videoSelector = 'video';
      try {
        await page.waitForFunction(
          (expectedSrc: string) => {
            const v = document.querySelector('video') as HTMLVideoElement | null;
            return Boolean(v && v.src && v.src.includes(expectedSrc));
          },
          expected.videoSrc,
          { timeout: 10000 },
        );
      } catch {
        console.log(`  VIDEO SRC DID NOT UPDATE to ${expected.videoSrc}`);
        allResults.push(result);
        continue;
      }

      const videoEl = page.locator(videoSelector).last();
      result.videoElementFound = true;

      const actualSrc = await videoEl.getAttribute('src');
      console.log(`  video src: ${actualSrc}`);
      result.videoSrcCorrect = Boolean(actualSrc && actualSrc.includes(expected.videoSrc));

      const poster = await videoEl.getAttribute('poster');
      console.log(`  video poster: ${poster}`);

      // Wait for metadata to load.
      result.metadataLoaded = await waitForVideoMetadata(page, videoSelector, 10000);

      if (result.metadataLoaded) {
        const dims = await videoEl.evaluate((v: HTMLVideoElement) => ({ w: v.videoWidth, h: v.videoHeight }));
        result.videoWidthPositive = dims.w > 0;
        result.videoHeightPositive = dims.h > 0;
        console.log(`  video dimensions: ${dims.w}x${dims.h}`);
      }

      // Check for video error.
      result.videoError = await videoEl.evaluate((v: HTMLVideoElement) => v.error?.message || null);
      if (result.videoError) {
        console.log(`  VIDEO ERROR: ${result.videoError}`);
      }

      // Try to play.
      try {
        await videoEl.evaluate((v: HTMLVideoElement) => v.play());
        result.playbackStarted = true;
        console.log(`  playback started: true`);

        result.currentTimeAdvanced = await waitForCurrentTimeAdvance(page, videoSelector, 5000);
        console.log(`  currentTime advanced: ${result.currentTimeAdvanced}`);
      } catch (e) {
        console.log(`  playback failed: ${e}`);
      }

      // Determine pass/fail.
      result.pass =
        result.buttonFound &&
        result.videoElementFound &&
        result.videoSrcCorrect &&
        result.metadataLoaded &&
        result.videoWidthPositive &&
        result.videoHeightPositive &&
        result.playbackStarted &&
        result.currentTimeAdvanced &&
        !result.videoError;

      allResults.push(result);
      console.log(`  RESULT: ${result.pass ? 'PASS' : 'FAIL'}`);
    }

    // ── Step 4: select a demo, continue to Step 4, verify Before/After ──
    const step4Demo = EXPECTED_DEMOS[0]; // luxury-perfume-commercial
    console.log(`\n=== Step 4 verification with demo: ${step4Demo.title} ===`);

    let step4Reached = false;
    let step4BeforeAfterVisible = false;
    let step4VideoMatch = false;

    try {
      // Re-select the Step 4 demo (in case the last loop iteration selected a different one).
      const step4PlayButton = dialog.locator(`button[aria-label="Play ${step4Demo.title}"]`);
      await clickViaElement(step4PlayButton.first());

      // Wait for video to load.
      await page.waitForFunction(
        (expectedSrc: string) => {
          const v = document.querySelector('video') as HTMLVideoElement | null;
          return Boolean(v && v.src && v.src.includes(expectedSrc));
        },
        step4Demo.videoSrc,
        { timeout: 10000 },
      );

      // Click Continue to advance Step 2 → Step 3.
      const continueToStep3 = dialog.getByRole('button', { name: /Continue/i });
      await expect(continueToStep3).toBeVisible({ timeout: 10000 });
      await clickViaElement(continueToStep3);

      // Wait for Step 3 ("Personalize").
      await expect(dialog.getByRole('tab', { name: /Your video/i })).not.toBeVisible({ timeout: 5000 });
      // Step 3 renders StepPersonalize which has a "Preview my video" button.
      const previewMyVideoBtn = page.getByRole('button', { name: /Preview my video/i });
      await expect(previewMyVideoBtn).toBeVisible({ timeout: 10000 });
      await clickViaElement(previewMyVideoBtn);

      // Wait for Step 4 ("Preview and approve"). Target the heading role so we
      // don't match the stepper button span (which caused a strict-mode
      // violation with getByText).
      await expect(dialog.getByRole('heading', { name: /Preview and approve/i })).toBeVisible({ timeout: 10000 });
      step4Reached = true;
      console.log('  Step 4 reached: true');

      // Verify Before/After preview is visible.
      const beforeAfterToggle = page.getByRole('button', { name: /Before|After/i }).first();
      if (await beforeAfterToggle.isVisible({ timeout: 5000 })) {
        step4BeforeAfterVisible = true;
        console.log('  Before/After toggle visible: true');
      }

      // Verify the Remotion player renders a video element with the same source.
      // Remotion Player renders a <video> internally.
      const step4Video = page.locator('video').last();
      if (await step4Video.isVisible({ timeout: 5000 })) {
        const step4Src = await step4Video.getAttribute('src');
        step4VideoMatch = Boolean(step4Src && step4Src.includes(step4Demo.videoSrc));
        console.log(`  Step 4 video src: ${step4Src}, matches expected: ${step4VideoMatch}`);
      } else {
        console.log('  No video element found in Step 4 preview');
      }
    } catch (e) {
      console.log(`  Step 4 verification error: ${e}`);
    }

    // ── Summary ──
    const passed = allResults.filter((r) => r.pass).length;
    const failed = allResults.filter((r) => !r.pass).length;
    console.log(`\n=== DEMO VIDEO PLAYBACK SUMMARY ===`);
    console.log(`Total: ${allResults.length}, Passed: ${passed}, Failed: ${failed}`);
    console.log(`\n| Slug | Title | Video Src | Status |`);
    console.log(`|------|-------|-----------|--------|`);
    for (const r of allResults) {
      console.log(`| ${r.slug} | ${r.title} | ${r.videoSrc} | ${r.pass ? 'PASS' : 'FAIL'} |`);
    }
    console.log(`\nStep 4 — Reached: ${step4Reached}, Before/After visible: ${step4BeforeAfterVisible}, Video match: ${step4VideoMatch}`);

    if (consoleErrors.length > 0) {
      console.log(`\nConsole errors (${consoleErrors.length}):`);
      for (const err of consoleErrors) {
        console.log(`  - ${err}`);
      }
    }
    if (networkErrors.length > 0) {
      console.log(`\nNetwork errors (${networkErrors.length}):`);
      for (const url of networkErrors) {
        console.log(`  - ${url}`);
      }
    }

    expect(buttonCount).toBeGreaterThan(0);
    expect(failed).toBe(0);
  });
});
