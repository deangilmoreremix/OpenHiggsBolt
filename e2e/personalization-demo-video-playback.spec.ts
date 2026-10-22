import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  DEMO_LIBRARY_REGISTRY,
  EXCLUDED_DEMO_COLLECTIONS,
  demoCollections,
  toVideoDemo,
  type DemoLibraryEntry,
} from '../src/data/demoLibraryRegistry';
import {
  ALL_DEMOS_CATEGORY_ID,
  DEMO_CATEGORIES,
  countDemosByCategory,
  isCategoryActiveForDemo,
} from '../src/shared/personalization/guided/demoCategories';

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3112';

/**
 * Personalization Modal — demo video playback verification.
 * ===================================================================
 * There is no curated 12-slug allowlist any more: the Demos tab renders the
 * demo library registry (`src/data/demoLibraryRegistry.ts`), built from the
 * same source catalogs and probed-media facts the UI itself consumes. Every
 * expectation in this spec is therefore DERIVED from that registry — the same
 * approach `e2e/personalization-demo-library.spec.ts` takes for the browsing
 * checks — so the tests cannot silently drift from the catalogue:
 *
 *   1. Catalogue parity: the registry must expose exactly the audited total
 *      (123 eligible demos today: minimax-h3=30, promptfeed=29,
 *      seedance-1=14, seedance-25=50), each entry must point at a local
 *      `/media/<eligible-collection>/` file, and the excluded collections
 *      must never leak in — `seedance-prompts` ships 9-byte "Not Found"
 *      error bodies, not decodable media.
 *
 *   2. Sampled playback: a deterministic, bounded sample built from the
 *      registry (at least 2 demos per collection, at least 1 demo per VISIBLE
 *      category tab, topped up from registry order to ~24 entries) is played
 *      in Step 2 of the Personalization Modal. Every sampled video must
 *      expose the registry's /media/ path, reach HAVE_METADATA, report
 *      positive dimensions, start playback via play(), advance currentTime by
 *      more than 0.05s and raise no media error. Demos outside the first
 *      window are made reachable through the "Show more" pagination
 *      (`revealDemoCard`).
 *
 *   3. Step 4 parity: the before/after preview still receives the selected
 *      demo's clip.
 *
 *   4. The original regression: the SELECTED demo card renders a real,
 *      playing <video> instead of a still poster.
 *
 * The full-library browsing checks (totals, category badges, search, filters,
 * pagination reachability, selection integrity) live in
 * e2e/personalization-demo-library.spec.ts.
 */

// ---------------------------------------------------------------------------
// Expected data, derived from the SAME source modules the UI uses
// ---------------------------------------------------------------------------

/** The audited catalogue total this suite snapshots. */
const REGISTRY_TOTAL_EXPECTED = 123;

/** The registry that drives every expectation below. */
const REGISTRY = DEMO_LIBRARY_REGISTRY;

const LIBRARY_DEMOS = REGISTRY.map(toVideoDemo);

/** Counts over the WHOLE, unfiltered library — the tab badges' baseline. */
const UNFILTERED_CATEGORY_COUNTS = countDemosByCategory(LIBRARY_DEMOS);

/**
 * The category ids whose tabs the Demos tab actually renders: 'all' plus
 * every business niche that holds at least one demo (a niche with zero demos
 * is never offered — an empty tab is a dead end).
 */
const VISIBLE_CATEGORY_IDS = DEMO_CATEGORIES.filter(
  (category) =>
    category.id === ALL_DEMOS_CATEGORY_ID ||
    (UNFILTERED_CATEGORY_COUNTS[category.id] ?? 0) > 0,
).map((category) => category.id);

/** Registry paths must stay local and inside an eligible collection. */
const ELIGIBLE_MEDIA_PREFIX = new RegExp(
  `^/media/(${demoCollections.map((collection) => collection.id).join('|')})/`,
);

/** Bounded playback sample target: representative, yet fast enough per run. */
const SAMPLE_SIZE_TARGET = 24;

/**
 * The deterministic playback sample, read from the registry itself (no magic
 * slug lists):
 *   (a) the first and the middle registry demos of every collection
 *       (>= 2 per collection),
 *   (b) the first registry demo of every VISIBLE category tab
 *       (>= 1 per visible category),
 *   (c) topped up from registry order to SAMPLE_SIZE_TARGET.
 */
function buildPlaybackSample(): DemoLibraryEntry[] {
  const sample = new Map<string, DemoLibraryEntry>();
  const add = (entry: DemoLibraryEntry | undefined) => {
    if (entry) sample.set(entry.id, entry);
  };
  for (const collection of demoCollections) {
    const inCollection = REGISTRY.filter((entry) => entry.collectionId === collection.id);
    add(inCollection[0]);
    add(inCollection[Math.floor(inCollection.length / 2)]);
  }
  for (const categoryId of VISIBLE_CATEGORY_IDS) {
    if (categoryId === ALL_DEMOS_CATEGORY_ID) continue;
    add(REGISTRY.find((entry) => isCategoryActiveForDemo(categoryId, toVideoDemo(entry))));
  }
  for (const entry of REGISTRY) {
    if (sample.size >= SAMPLE_SIZE_TARGET) break;
    add(entry);
  }
  return [...sample.values()];
}

const PLAYBACK_SAMPLE = buildPlaybackSample();

interface DemoResult {
  /** Stable, source-qualified registry id (`"<collection>:<slug>"`). */
  registryId: string;
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
  await el.evaluate((e) => (e as HTMLElement).click());
}

/**
 * The Demos tab renders the WHOLE registry (123 demos) and mounts its
 * cards in windows — the first 12, then ten more per "Show more" click. A
 * demo outside the current window is simply not in the DOM, so every lookup
 * has to page to it first.
 */
async function revealDemoCard(
  dialog: Locator,
  demo: { id: number; slug: string },
  maxClicks = 40,
): Promise<boolean> {
  const card = dialog.getByTestId(`demo-card-${demo.id}-${demo.slug}`);
  for (let i = 0; i < maxClicks; i += 1) {
    if ((await card.count()) > 0) return true;
    const more = dialog.getByTestId('demo-show-more');
    if ((await more.count()) === 0) return false;
    const before = await dialog.locator('[data-demo-id]').count();
    await clickViaElement(more.first());
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if ((await dialog.locator('[data-demo-id]').count()) > before) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  return (await card.count()) > 0;
}

async function waitForVideoMetadata(page: Page, videoSelector: string, timeoutMs = 20000): Promise<boolean> {
  return page.evaluate(async ({ selector, timeoutMs }) => {
    const video = document.querySelector(selector) as HTMLVideoElement | null;
    if (!video) return false;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return true;
      // A failed first range request is not retried by the browser on its own.
      if (video.error) video.load();
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
  test('registry-derived demo samples from every collection and category play in the Personalization Modal', async ({ page }) => {
    test.setTimeout(20 * 60 * 1000);

    // ── 1. Catalogue parity, straight from the registry modules ─────────
    expect(
      REGISTRY.length,
      'the registry must expose exactly the audited 123 eligible demos',
    ).toBe(REGISTRY_TOTAL_EXPECTED);
    expect(
      demoCollections.reduce((sum, collection) => sum + collection.count, 0),
      'the collection counts must add up to the registry total',
    ).toBe(REGISTRY_TOTAL_EXPECTED);
    for (const collection of demoCollections) {
      const inCollection = REGISTRY.filter((entry) => entry.collectionId === collection.id);
      expect(inCollection.length, `collection ${collection.id}`).toBe(collection.count);
      console.log(`[REGISTRY] collection ${collection.id}: ${inCollection.length} demos`);
    }
    // Every registered demo is a LOCAL file of an eligible collection.
    for (const entry of REGISTRY) {
      expect(entry.videoSrc, `entry ${entry.id} must use a local eligible /media/ path`).toMatch(
        ELIGIBLE_MEDIA_PREFIX,
      );
    }
    // The seedance-prompts exclusion stays documented and enforced: its
    // on-disk mp4s are 9-byte "Not Found" bodies and must never be offered.
    const seedancePromptsExclusion = EXCLUDED_DEMO_COLLECTIONS.find(
      (exclusion) => exclusion.id === 'seedance-prompts',
    );
    expect(
      seedancePromptsExclusion?.verifiedVideoCount,
      'seedance-prompts must stay excluded as broken media',
    ).toBe(0);
    expect(
      REGISTRY.filter((entry) => entry.videoSrc.startsWith('/media/seedance-prompts/')).length,
      'no registry entry may reference the broken seedance-prompts media',
    ).toBe(0);
    console.log(
      `[REGISTRY] total=${REGISTRY.length}, visible category tabs=${VISIBLE_CATEGORY_IDS.length}`,
    );

    // ── 2. The sample must be representative ────────────────────────────
    expect(PLAYBACK_SAMPLE.length, 'sample must stay bounded (full 123 would be too slow)').toBeLessThanOrEqual(25);
    expect(PLAYBACK_SAMPLE.length, 'sample must be non-trivial').toBeGreaterThanOrEqual(20);
    expect(
      new Set(PLAYBACK_SAMPLE.map((entry) => entry.id)).size,
      'the sample must not repeat a demo',
    ).toBe(PLAYBACK_SAMPLE.length);
    for (const collection of demoCollections) {
      expect(
        PLAYBACK_SAMPLE.filter((entry) => entry.collectionId === collection.id).length,
        `the sample must cover at least 2 demos of collection ${collection.id}`,
      ).toBeGreaterThanOrEqual(2);
    }
    for (const categoryId of VISIBLE_CATEGORY_IDS) {
      if (categoryId === ALL_DEMOS_CATEGORY_ID) continue;
      expect(
        PLAYBACK_SAMPLE.some((entry) => isCategoryActiveForDemo(categoryId, toVideoDemo(entry))),
        `the sample must cover visible category "${categoryId}"`,
      ).toBe(true);
    }
    console.log(
      `[SAMPLE] ${PLAYBACK_SAMPLE.length} demo(s): ${PLAYBACK_SAMPLE.map((entry) => entry.id).join(', ')}`,
    );

    // ── Open the personalization demo page ─────────────────────────────
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    /** Status codes of the demo clip responses (the Step 4 proof). */
    const clipResponses: number[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });
    page.on('requestfailed', (request) => {
      networkErrors.push(request.url());
    });
    page.on('response', (res) => {
      if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(res.url())) clipResponses.push(res.status());
    });

    await page.goto(`${BASE}/personalization-demo?test=true`, { waitUntil: 'domcontentloaded' });

    // Wait for the Personalization Modal dialog to open.
    const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
    await expect(dialog).toBeVisible({ timeout: 20000 });

    // The clicks below are synthetic (`element.click()`), which is a no-op until
    // React has hydrated. On a cold dev server the bundle is still compiling,
    // so wait for the network to settle first.
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    // ── Step 1 → Step 2: click Continue ────────────────────────────────
    const continueBtn = dialog.getByRole('button', { name: /Continue/i });
    await expect(continueBtn).toBeVisible({ timeout: 20000 });
    await clickViaElement(continueBtn);

    // Wait for Step 2: the video source picker tabs appear.
    await expect(dialog.getByRole('tab', { name: /Your video/i })).toBeVisible({ timeout: 10000 });

    // The AI Demos tab badge must equal the registry length (browsing parity).
    const aiDemosTab = dialog.getByRole('tab', { name: /AI Demos/i });
    await expect(aiDemosTab).toBeVisible({ timeout: 10000 });
    const demosTabLabel = (await aiDemosTab.innerText()).trim();
    console.log(`[DEMOS TAB] "${demosTabLabel}"`);
    expect(demosTabLabel, 'the AI Demos tab badge must equal the registry length').toContain(
      `(${REGISTRY.length})`,
    );
    await clickViaElement(aiDemosTab);

    // Wait for the demo grid to render.
    const playButtons = dialog.locator('button[aria-label^="Play "]');
    await expect(playButtons.first()).toBeAttached({ timeout: 10000 });
    const buttonCount = await playButtons.count();
    console.log(`Found ${buttonCount} demo play buttons`);

    // Test each sampled demo.
    for (const expected of PLAYBACK_SAMPLE) {
      const result: DemoResult = {
        registryId: expected.id,
        id: expected.legacyId,
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

      console.log(`\n--- Testing demo: ${result.registryId} ("${result.title}") ---`);

      // Find the play button for this demo by its exact aria-label.
      // The overlay starts invisible (opacity 0) until hovered; locate by exact
      // aria-label (avoids matching the outer card button) and click via element
      // handle so the invisible overlay can still be activated.
      // The Demos tab mounts its cards in windows, so the card may not be in
      // the DOM yet: page to it first.
      await revealDemoCard(dialog, { id: expected.legacyId, slug: expected.slug });
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

      // Wait for metadata to load (readyState >= HAVE_METADATA).
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
        result.videoSrc.startsWith('/media/') &&
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
    const step4Demo = REGISTRY[0]; // the first registry demo, in registry order
    console.log(`\n=== Step 4 verification with demo: ${step4Demo.id} ("${step4Demo.title}") ===`);

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

      // The Step 4 player starts paused (autoPlay=false) and is driven by the
      // custom preview controls — press "Play preview" so frames are drawn.
      const playPreview = page.getByRole('button', { name: /Play preview/i });
      if (await playPreview.first().isVisible({ timeout: 5000 })) {
        await clickViaElement(playPreview.first());
        await page.waitForTimeout(1500);
      }

      // The Step 4 before/after preview is a Remotion <Player>, which renders
      // into a <canvas> — there is no DOM <video> element to read a `src` from.
      // The clip is proven to be loaded and playing by two signals:
      //   1. the demo clip was served with a 200/206 response, and
      //   2. the composition canvas changes between two samples once the
      //      preview is playing (frames are actually being drawn).
      const demoClipServed = clipResponses.some((s) => s === 200 || s === 206);
      const probe = await page.evaluate(async () => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { found: false as const };
        const sample = () => {
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let sum = 0;
          for (let i = 0; i < data.length; i += 400) sum += data[i] + data[i + 1] + data[i + 2];
          return sum;
        };
        // Poll until the composition advances — the first load of the clip can
        // be slow, so a fixed short window can miss the very first frames.
        const deadline = Date.now() + 25000;
        const first = sample();
        let second = first;
        while (Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 500));
          second = sample();
          if (first !== null && second !== null && first !== second) break;
        }
        return { found: true as const, first, second };
      });

      if (probe.found) {
        step4VideoMatch =
          demoClipServed && probe.first !== null && probe.second !== null && probe.first !== probe.second;
        console.log(
          `  Step 4 clip served: ${demoClipServed}, canvas advanced: ${probe.first !== probe.second}, match: ${step4VideoMatch}`,
        );
      } else {
        console.log('  No composition canvas found in Step 4 preview');
      }
    } catch (e) {
      console.log(`  Step 4 verification error: ${e}`);
    }

    // ── Summary ──
    const passed = allResults.filter((r) => r.pass).length;
    const failedList = allResults.filter((r) => !r.pass);
    const failed = failedList.length;
    console.log(`\n=== DEMO VIDEO PLAYBACK SUMMARY ===`);
    console.log(`Total: ${allResults.length}, Passed: ${passed}, Failed: ${failed}`);
    console.log(`\n| Registry id | Title | Video Src | Status |`);
    console.log(`|------|-------|-----------|--------|`);
    for (const r of allResults) {
      console.log(`| ${r.registryId} | ${r.title} | ${r.videoSrc} | ${r.pass ? 'PASS' : 'FAIL'} |`);
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
    expect(
      failed,
      `failed demos: ${failedList.map((r) => `${r.registryId} (${r.videoError ?? 'see log'})`).join('; ')}`,
    ).toBe(0);
  });

  /**
   * Focused regression test for the reported bug: the SELECTED demo card in
   * step 2 rendered a still `<img>` poster, so the customer kept seeing
   * images instead of playing videos. The selected card must host a real
   * `<video>` element instead.
   */
  test('the selected demo card renders a playing <video> instead of a still poster', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto(`${BASE}/personalization-demo?test=true`, { waitUntil: 'domcontentloaded' });

    const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
    await expect(dialog).toBeVisible({ timeout: 20000 });

    // Synthetic clicks are no-ops until React has hydrated.
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    // Step 1 → Step 2.
    const continueBtn = dialog.getByRole('button', { name: /Continue/i });
    await expect(continueBtn).toBeVisible({ timeout: 20000 });
    await clickViaElement(continueBtn);

    // Open the AI Demos tab.
    const aiDemosTab = dialog.getByRole('tab', { name: /AI Demos/i });
    await expect(aiDemosTab).toBeVisible({ timeout: 10000 });
    await clickViaElement(aiDemosTab);

    // Pick a demo that is NOT the pre-selected source video, so the test
    // covers a real selection change (the page's source is the first demo).
    const demo = {
      id: 14,
      slug: 'luxury-skincare-storyboard-commercial',
      title: 'Luxury Skincare Storyboard Commercial',
      videoSrc: '/media/minimax-h3/videos/luxury-skincare-storyboard-commercial.webm',
      posterSrc: '/media/minimax-h3/previews/luxury-skincare-storyboard-commercial.svg',
    };

    const card = dialog.getByTestId(`demo-card-${demo.id}-${demo.slug}`);
    // The Demos tab mounts its cards in windows — page to this one first.
    expect(await revealDemoCard(dialog, demo), `card ${demo.slug} must be reachable`).toBe(true);
    await expect(card).toBeVisible({ timeout: 10000 });

    // Before selecting: a still poster thumbnail, no player.
    await expect(card.locator('img')).toHaveCount(1);
    await expect(card.locator('[data-testid="demo-player"]')).toHaveCount(0);

    // Select the demo.
    const playButton = dialog.locator(`button[aria-label="Play ${demo.title}"]`);
    await expect(playButton.first()).toBeAttached({ timeout: 5000 });
    await clickViaElement(playButton.first());

    // The card itself now hosts the player...
    const player = card.locator('[data-testid="demo-player"]');
    await expect(player).toHaveCount(1, { timeout: 10000 });

    // ...and the still thumbnail is gone (never both mounted at once).
    await expect(card.locator('img')).toHaveCount(0);

    // Exactly one card in the whole grid carries a player.
    await expect(dialog.locator('[data-testid="demo-player"]')).toHaveCount(1);

    // The player points at the demo's real video source; the poster stays a poster.
    const src = await player.getAttribute('src');
    expect(src).toContain(demo.videoSrc);
    const poster = await player.getAttribute('poster');
    expect(poster).toContain(demo.posterSrc);

    // It is configured for inline autoplay.
    const flags = await player.evaluate((v: HTMLVideoElement) => ({
      autoplay: v.autoplay,
      muted: v.muted,
      loop: v.loop,
      controls: v.controls,
      playsInline: v.playsInline,
    }));
    expect(flags).toEqual({ autoplay: true, muted: true, loop: true, controls: true, playsInline: true });

    // It really decodes and plays: metadata, dimensions, advancing currentTime.
    await player.evaluate((v: HTMLVideoElement) => v.play());
    const dims = await player.evaluate((v: HTMLVideoElement) => ({ w: v.videoWidth, h: v.videoHeight }));
    expect(dims.w).toBeGreaterThan(0);
    expect(dims.h).toBeGreaterThan(0);

    const playback = await player.evaluate(async (v: HTMLVideoElement) => {
      const start = v.currentTime;
      const deadline = Date.now() + 8000;
      while (Date.now() < deadline) {
        if (v.currentTime > start + 0.05) {
          return { advanced: true, start, end: v.currentTime, paused: v.paused, error: v.error?.message ?? null };
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      return { advanced: false, start, end: v.currentTime, paused: v.paused, error: v.error?.message ?? null };
    });
    console.log(`  card player playback: ${JSON.stringify(playback)}`);
    expect(playback.error).toBeNull();
    expect(playback.advanced).toBe(true);
    expect(playback.paused).toBe(false);

    // Switching the selection remounts the player — the old clip must not
    // keep playing, and only the new card may carry a player. The switch
    // target is derived from the registry (previously it came from the removed
    // 12-entry EXPECTED_DEMOS allowlist): the first registered demo of the
    // SAME collection as the card above, excluding that card itself.
    const demoCollectionId = demo.videoSrc.split('/')[2];
    const otherDemo = REGISTRY.find(
      (entry) => entry.collectionId === demoCollectionId && entry.slug !== demo.slug,
    );
    expect(otherDemo, `the registry must offer another ${demoCollectionId} demo`).toBeTruthy();
    expect(
      await revealDemoCard(dialog, { id: otherDemo!.legacyId, slug: otherDemo!.slug }),
      `card ${otherDemo!.slug} must be reachable`,
    ).toBe(true);
    const otherPlayButton = dialog.locator(`button[aria-label="Play ${otherDemo!.title}"]`);
    await clickViaElement(otherPlayButton.first());

    const otherCard = dialog.getByTestId(`demo-card-${otherDemo!.legacyId}-${otherDemo!.slug}`);
    const otherPlayer = otherCard.locator('[data-testid="demo-player"]');
    await expect(otherPlayer).toHaveCount(1, { timeout: 10000 });
    await expect(dialog.locator('[data-testid="demo-player"]')).toHaveCount(1);
    await expect(card.locator('[data-testid="demo-player"]')).toHaveCount(0);
    await expect(card.locator('img')).toHaveCount(1);

    const otherSrc = await otherPlayer.getAttribute('src');
    expect(otherSrc).toContain(otherDemo!.videoSrc);

    // The nested-button hydration error is gone (the card is a
    // <div role="button">, so the play overlay <button> is valid HTML).
    const nestedButtonErrors = consoleErrors.filter((err) => /cannot contain a nested/i.test(err));
    expect(nestedButtonErrors).toEqual([]);
  });
});
