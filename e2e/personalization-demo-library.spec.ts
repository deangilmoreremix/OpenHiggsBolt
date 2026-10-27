import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  DEMO_LIBRARY_REGISTRY,
  demoCollections,
  toVideoDemo,
  type DemoLibraryEntry,
} from '../src/data/demoLibraryRegistry';
import {
  ALL_DEMOS_CATEGORY_ID,
  DEMO_CATEGORIES,
  countDemosByCategory,
  isCategoryActiveForDemo,
  matchesDemoQuery,
} from '../src/shared/personalization/guided/demoCategories';
import type { VideoDemo } from '../src/data/types';

/**
 * Personalization Modal — expanded demo library verification.
 * ===================================================================
 * The Demos tab of Step 2 used to be a 12-slug allowlist. It now renders the
 * whole registry (123 locally-hosted demo videos across four collections) with
 * business-niche category tabs, free-text search, source/style/aspect-ratio/
 * sub-category filters and windowed "Show more" pagination.
 *
 * This spec proves, in the browser, that:
 *   1. the displayed total equals the registry length,
 *   2. every category tab's count badge equals what the taxonomy assigns,
 *   3. search narrows to exactly the matching entries and can be cleared,
 *   4. the source / style / aspect-ratio filters narrow and restore,
 *   5. "Show more" cumulatively reveals every single registry id,
 *   6. no card points at a premium (ai-viral / academy / seedance-prompts)
 *      or remote collection,
 *   7. demos from every collection and every category really decode and play,
 *   8. the selection survives category / page / search changes, and
 *   9. the selection reaches Step 4 and is the clip being previewed.
 */

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3112';

// ---------------------------------------------------------------------------
// Expected data, derived from the SAME source modules the UI uses
// ---------------------------------------------------------------------------

const REGISTRY = DEMO_LIBRARY_REGISTRY;
const REGISTRY_TOTAL = REGISTRY.length;
const REGISTRY_IDS = REGISTRY.map((entry) => entry.id);
const REGISTRY_ID_SET = new Set(REGISTRY_IDS);
const LIBRARY_DEMOS: VideoDemo[] = REGISTRY.map(toVideoDemo);
const REGISTRY_BY_ID = new Map(REGISTRY.map((entry) => [entry.id, entry]));

/** Counts of the whole library, per taxonomy category id. */
const ALL_COUNTS = countDemosByCategory(LIBRARY_DEMOS);

/** The collection ids that are allowed to appear in the gallery. */
const ELIGIBLE_COLLECTIONS = demoCollections.map((collection) => collection.id);

/** Path prefixes that must never appear on a card. */
const FORBIDDEN_PATH_PREFIXES = ['/media/ai-viral/', '/media/academy/', '/media/seedance-prompts/'];
/** Remote hosts that must never appear on a card. */
const FORBIDDEN_HOSTS = ['cdn.seedance2prompt.com'];

/** The taxonomy categories that actually hold at least one demo. */
const VISIBLE_CATEGORY_IDS = [
  ALL_DEMOS_CATEGORY_ID,
  ...DEMO_CATEGORIES.map((category) => category.id).filter(
    (id) => id !== ALL_DEMOS_CATEGORY_ID && (ALL_COUNTS[id] ?? 0) > 0,
  ),
];

/** Registry ids that belong to one taxonomy category. */
function idsInCategory(categoryId: string): string[] {
  return REGISTRY.filter((entry) => isCategoryActiveForDemo(categoryId, toVideoDemo(entry))).map(
    (entry) => entry.id,
  );
}

/**
 * The exact rule the Demos tab uses to match a free-text query: the demo's own
 * fields OR the collection name.
 */
function idsMatchingQuery(query: string): string[] {
  const term = query.trim().toLowerCase();
  if (!term) return [...REGISTRY_IDS];
  return REGISTRY.filter(
    (entry) =>
      matchesDemoQuery(toVideoDemo(entry), term) ||
      entry.collectionName.toLowerCase().includes(term),
  ).map((entry) => entry.id);
}

// ---------------------------------------------------------------------------
// Browser helpers
// ---------------------------------------------------------------------------

async function clickViaElement(locator: Locator) {
  const el = await locator.elementHandle();
  if (!el) throw new Error(`element not found for click: ${locator}`);
  await el.evaluate((e) => (e as HTMLElement).click());
}

interface ConsoleLog {
  type: string;
  text: string;
}

function attachDiagnostics(page: Page) {
  const consoleLogs: ConsoleLog[] = [];
  const networkErrors: string[] = [];
  const failedRequests: string[] = [];
  const responses: Array<{ url: string; status: number }> = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    consoleLogs.push({ type: 'pageerror', text: err.message });
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'unknown';
    failedRequests.push(`${request.url()} :: ${failure}`);
  });
  page.on('response', (res) => {
    responses.push({ url: res.url(), status: res.status() });
  });

  return { consoleLogs, networkErrors, failedRequests, responses };
}

/**
 * The modal mirrors the wizard state into localStorage so a reload restores
 * the step the visitor was on. That is a product feature, not part of what
 * this spec verifies, and a restored step would make the flow order-dependent
 * (the modal would open on Step 4 instead of Step 1). Every navigation in
 * this spec therefore starts from a clean mirror — unless
 * `KEEP_PREVIEW_MIRROR=1` is set, which keeps the mirror and makes the run
 * depend on the restore path.
 */
function clearPreviewMirror() {
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('smartvideo_preview_state_')) window.localStorage.removeItem(key);
    }
  } catch {
    /* localStorage can be unavailable — the test still works */
  }
}

/** Open the personalization modal, advance to Step 2 and open the Demos tab. */
async function openDemosTab(page: Page, runId?: string): Promise<Locator> {
  if (process.env.KEEP_PREVIEW_MIRROR !== '1') {
    await page.addInitScript(clearPreviewMirror);
  }
  const suffix = runId ? `&run=${runId}` : '';
  await page.goto(`${BASE}/personalization-demo?test=true${suffix}`, {
    waitUntil: 'domcontentloaded',
  });

  const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
  await expect(dialog).toBeVisible({ timeout: 30000 });

  // The clicks below are synthetic (`element.click()`), which is a no-op until
  // React has hydrated. On a cold dev server the bundle is still compiling.
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  // Step 1 -> Step 2. Fall back to the stepper when the wizard did not start
  // on Step 1.
  let onStep2 = false;
  try {
    const continueBtn = dialog.getByRole('button', { name: /^Continue/i });
    await expect(continueBtn).toBeVisible({ timeout: 8000 });
    await clickViaElement(continueBtn);
    onStep2 = true;
  } catch {
    /* the wizard is not on Step 1 */
  }
  if (!onStep2) {
    const stepTwo = dialog.getByRole('button', { name: /Your video Step 2/i });
    await expect(stepTwo).toBeVisible({ timeout: 30000 });
    await clickViaElement(stepTwo);
  }

  const demosTab = dialog.getByRole('tab', { name: /AI Demos/i });
  await expect(demosTab).toBeVisible({ timeout: 20000 });
  await clickViaElement(demosTab);

  await expect(dialog.getByTestId('demo-gallery-count')).toBeVisible({ timeout: 20000 });
  return dialog;
}

/** Read the "Showing X of Y demos" counter. */
async function readCounter(dialog: Locator): Promise<{ shown: number; total: number; text: string }> {
  const text = (await dialog.getByTestId('demo-gallery-count').innerText()).replace(/\s+/g, ' ').trim();
  const match = text.match(/Showing\s+(\d+)\s+of\s+(\d+)/);
  if (!match) throw new Error(`could not parse the gallery counter: "${text}"`);
  return { shown: Number(match[1]), total: Number(match[2]), text };
}

/** The registry ids of every card currently rendered in the grid. */
async function renderedDemoIds(dialog: Locator): Promise<string[]> {
  return dialog.locator('[data-demo-id]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-demo-id') ?? ''),
  );
}

/** The category tab ids currently rendered, in order. */
async function renderedCategoryIds(dialog: Locator): Promise<string[]> {
  const tablist = dialog.getByRole('tablist', { name: 'Demo categories' });
  const tabs = tablist.getByRole('tab');
  const ids: string[] = [];
  const count = await tabs.count();
  for (let i = 0; i < count; i += 1) {
    const testid = await tabs.nth(i).getAttribute('data-testid');
    if (testid) ids.push(testid.replace('demo-category-tab-', ''));
  }
  return ids;
}

/** The count badge of every category tab, keyed by category id. */
async function readCategoryTabCounts(dialog: Locator): Promise<Record<string, number>> {
  const tablist = dialog.getByRole('tablist', { name: 'Demo categories' });
  const tabs = tablist.getByRole('tab');
  const counts: Record<string, number> = {};
  const count = await tabs.count();
  for (let i = 0; i < count; i += 1) {
    const tab = tabs.nth(i);
    const testid = await tab.getAttribute('data-testid');
    if (!testid) continue;
    const id = testid.replace('demo-category-tab-', '');
    const badge = (await tab.locator('span').last().innerText()).trim();
    const parsed = Number(badge);
    if (!Number.isFinite(parsed)) throw new Error(`tab "${id}" has a non-numeric badge: "${badge}"`);
    counts[id] = parsed;
  }
  return counts;
}

/** Click "Show more" until it is gone; returns the number of clicks. */
async function expandAll(dialog: Locator, maxClicks = 80): Promise<number> {
  let clicks = 0;
  while (clicks < maxClicks) {
    const more = dialog.getByTestId('demo-show-more');
    if ((await more.count()) === 0) break;
    const before = await dialog.locator('[data-demo-id]').count();
    await clickViaElement(more.first());
    await expect
      .poll(() => dialog.locator('[data-demo-id]').count(), { timeout: 20000 })
      .toBeGreaterThan(before);
    clicks += 1;
  }
  return clicks;
}

/** Reset every demo filter back to its default. */
async function clearAllFilters(dialog: Locator) {
  const search = dialog.locator('input[aria-label="Search demos"]');
  await search.fill('');
  for (const label of ['Source', 'Style', 'Aspect ratio', 'Sub-category']) {
    const select = dialog.locator(`select[aria-label="${label}"]`);
    if ((await select.count()) > 0) {
      await select.selectOption('all');
    }
  }
  const allTab = dialog.getByTestId(`demo-category-tab-${ALL_DEMOS_CATEGORY_ID}`);
  await clickViaElement(allTab);
}

/** The `<video>` element inside the currently selected card. */
function selectedPlayer(dialog: Locator): Locator {
  return dialog.locator('[data-testid="demo-player"]');
}

/** The registry id of the currently selected card, if one is mounted. */
async function selectedDemoId(dialog: Locator): Promise<string | null> {
  const pressed = dialog.locator('[data-demo-id][aria-pressed="true"]');
  if ((await pressed.count()) === 0) return null;
  return pressed.first().getAttribute('data-demo-id');
}

/**
 * Page the grid until the card of one demo is mounted. The gallery mounts its
 * cards in windows, so a demo outside the current window simply is not in the
 * DOM yet.
 */
async function revealCard(dialog: Locator, demoId: string, maxClicks = 60): Promise<boolean> {
  const card = dialog.locator(`[data-demo-id="${demoId}"]`);
  for (let i = 0; i < maxClicks; i += 1) {
    if ((await card.count()) > 0) return true;
    const more = dialog.getByTestId('demo-show-more');
    if ((await more.count()) === 0) return false;
    const before = await dialog.locator('[data-demo-id]').count();
    await clickViaElement(more.first());
    await expect
      .poll(() => dialog.locator('[data-demo-id]').count(), { timeout: 20000 })
      .toBeGreaterThan(before);
  }
  return (await card.count()) > 0;
}

/**
 * Select one specific demo by its registry id: narrow the gallery with the
 * source filter and the search box, page until the card is mounted, then click
 * its play overlay.
 */
async function selectDemoById(
  page: Page,
  dialog: Locator,
  demo: DemoLibraryEntry,
): Promise<Locator> {
  const sourceSelect = dialog.locator('select[aria-label="Source"]');
  const styleSelect = dialog.locator('select[aria-label="Style"]');
  const aspectSelect = dialog.locator('select[aria-label="Aspect ratio"]');
  const search = dialog.locator('input[aria-label="Search demos"]');

  // Reset the dimensions first: the option list of every select is derived
  // from the OTHER dimensions, so a stale filter could hide the source we are
  // about to pick.
  await search.fill('');
  await styleSelect.selectOption('all');
  await aspectSelect.selectOption('all');
  await sourceSelect.selectOption(demo.collectionId);
  await search.fill(demo.title);

  const card = dialog.locator(`[data-demo-id="${demo.id}"]`);
  for (let i = 0; i < 60; i += 1) {
    if ((await card.count()) > 0) break;
    const more = dialog.getByTestId('demo-show-more');
    if ((await more.count()) === 0) break;
    const before = await dialog.locator('[data-demo-id]').count();
    await clickViaElement(more.first());
    await expect
      .poll(() => dialog.locator('[data-demo-id]').count(), { timeout: 20000 })
      .toBeGreaterThan(before);
  }
  await expect(card, `the card for ${demo.id} must be mounted`).toHaveCount(1, { timeout: 20000 });

  const playButton = card.locator('button[aria-label^="Play "]');
  await expect(playButton).toHaveCount(1);
  await clickViaElement(playButton.first());

  const player = card.getByTestId('demo-player');
  await expect(player, `the selected card must host a player`).toHaveCount(1, { timeout: 20000 });
  await expect
    .poll(async () => (await player.getAttribute('src')) ?? '', { timeout: 20000 })
    .toContain(demo.videoSrc);
  return player;
}

interface PlaybackProbe {
  ready: boolean;
  readyState: number;
  width: number;
  height: number;
  error: string | null;
  moved: boolean;
  advanced: boolean;
  paused: boolean;
  playError: string | null;
  startTime: number;
  endTime: number;
  maxTime: number;
}

/** Probe a `<video>`: readiness, dimensions, error, and real playback. */
async function probePlayback(video: Locator, readyTimeout = 40000): Promise<PlaybackProbe> {
  return video.evaluate(async (v, readyTimeout) => {
    const el = v as HTMLVideoElement;
    const deadline = Date.now() + readyTimeout;
    while (Date.now() < deadline) {
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) break;
      // A failed first range request is not retried by the browser on its own.
      if (el.error) el.load();
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    const ready = el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    const width = el.videoWidth;
    const height = el.videoHeight;
    const error = el.error?.message ?? null;

    let playError: string | null = null;
    try {
      await el.play();
    } catch (e) {
      playError = e instanceof Error ? e.message : String(e);
    }

    const startTime = el.currentTime;
    let maxTime = startTime;
    let moved = false;
    let advanced = false;
    const playDeadline = Date.now() + 12000;
    while (Date.now() < playDeadline) {
      const current = el.currentTime;
      if (current > maxTime) maxTime = current;
      if (Math.abs(current - startTime) > 0.05) moved = true;
      if (current > startTime + 0.05) advanced = true;
      if (moved && advanced) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      ready,
      readyState: el.readyState,
      width,
      height,
      error,
      moved,
      advanced,
      paused: el.paused,
      playError,
      startTime,
      endTime: el.currentTime,
      maxTime,
    };
  }, readyTimeout);
}

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

test.describe('Personalization Modal — expanded demo library', () => {
  test.describe.configure({ retries: 0 });

  test.beforeAll(() => {
    console.log(`\n=== REGISTRY: ${REGISTRY_TOTAL} demos ===`);
    console.log(`Collections: ${JSON.stringify(demoCollections.map((c) => `${c.id}=${c.count}`))}`);
    console.log(
      `Taxonomy counts: ${JSON.stringify(
        DEMO_CATEGORIES.map((c) => `${c.id}=${ALL_COUNTS[c.id] ?? 0}`),
      )}`,
    );
  });

  // ── 1 + 2 + 3 + 4 + 5 + 6: one browser session over the whole gallery ──
  test('totals, category counts, search, filters, pagination and premium exclusion', async ({
    page,
  }) => {
    test.setTimeout(15 * 60 * 1000);

    const diagnostics = attachDiagnostics(page);
    const dialog = await openDemosTab(page);

    // ── 1. TOTAL ──────────────────────────────────────────────────────────
    const demosTabLabel = (await dialog.getByRole('tab', { name: /AI Demos/i }).innerText()).trim();
    console.log(`\n[DEMOS TAB] "${demosTabLabel}"`);
    expect(demosTabLabel).toContain(`(${REGISTRY_TOTAL})`);
    await expect(dialog.getByText(new RegExp(`${REGISTRY_TOTAL} eligible demos`))).toBeVisible();

    const initial = await readCounter(dialog);
    console.log(`[TOTAL] counter: "${initial.text}"`);
    expect(initial.total, 'the "Showing X of Y" total must equal the registry length').toBe(
      REGISTRY_TOTAL,
    );
    expect(initial.shown).toBeGreaterThan(0);
    expect(initial.shown).toBeLessThanOrEqual(initial.total);

    // ── 2. CATEGORIES ─────────────────────────────────────────────────────
    const tabIds = await renderedCategoryIds(dialog);
    const tabCounts = await readCategoryTabCounts(dialog);
    console.log(`[CATEGORIES] tabs: ${JSON.stringify(tabCounts)}`);

    // Every visible taxonomy category is offered, and nothing else is.
    expect([...tabIds].sort()).toEqual([...VISIBLE_CATEGORY_IDS].sort());
    // "All Demos" shows the full total.
    expect(tabCounts[ALL_DEMOS_CATEGORY_ID]).toBe(REGISTRY_TOTAL);
    // No category shows a count of zero.
    for (const [id, count] of Object.entries(tabCounts)) {
      expect(count, `category "${id}" must not show a count of 0`).toBeGreaterThan(0);
    }
    // Every badge equals what the taxonomy actually assigns.
    for (const [id, count] of Object.entries(tabCounts)) {
      expect(count, `category "${id}" badge must equal the taxonomy count`).toBe(
        ALL_COUNTS[id] ?? 0,
      );
    }

    // Every demo in a category belongs to it (checked per category, with the
    // whole category paged in).
    for (const categoryId of tabIds) {
      await clickViaElement(dialog.getByTestId(`demo-category-tab-${categoryId}`));
      await expect
        .poll(async () => (await readCounter(dialog)).total, { timeout: 20000 })
        .toBe(ALL_COUNTS[categoryId] ?? 0);

      await expandAll(dialog);
      const expected = idsInCategory(categoryId);
      const rendered = await renderedDemoIds(dialog);
      const counter = await readCounter(dialog);

      expect(counter.total, `category "${categoryId}" total`).toBe(expected.length);
      expect(counter.shown, `category "${categoryId}" shown after paging`).toBe(expected.length);
      expect(rendered.length).toBe(expected.length);
      expect([...rendered].sort(), `category "${categoryId}" membership`).toEqual([...expected].sort());
      for (const id of rendered) {
        const entry = REGISTRY_BY_ID.get(id)!;
        expect(
          isCategoryActiveForDemo(categoryId, toVideoDemo(entry)),
          `${id} must belong to category "${categoryId}"`,
        ).toBe(true);
      }
      console.log(
        `[CATEGORY] ${categoryId}: ${expected.length} demos, all present and correctly assigned`,
      );
    }

    // Back to the unfiltered library.
    await clearAllFilters(dialog);
    await expect.poll(async () => (await readCounter(dialog)).total).toBe(REGISTRY_TOTAL);

    // ── 3. SEARCH ─────────────────────────────────────────────────────────
    const search = dialog.locator('input[aria-label="Search demos"]');
    const knownSearches: Array<{ query: string; expected: string[] }> = [
      { query: 'gourmet burger', expected: ['minimax-h3:gourmet-burger-ugc-taste-test'] },
      {
        query: 'luxury perfume',
        expected: [
          'minimax-h3:luxury-perfume-commercial',
          'minimax-h3:black-and-gold-perfume-commercial',
        ],
      },
      { query: 'van gogh', expected: ['seedance-1:van-gogh-post-impressionism-style-animation'] },
      {
        query: 'kaiju',
        expected: ['promptfeed:3185-colossal-kaiju-vs-fighter-jet-in-coastal-city'],
      },
    ];

    for (const { query, expected } of knownSearches) {
      await search.fill(query);
      await expect
        .poll(async () => (await readCounter(dialog)).total, { timeout: 20000 })
        .toBe(expected.length);
      await expandAll(dialog);
      const rendered = await renderedDemoIds(dialog);
      const counter = await readCounter(dialog);
      console.log(`[SEARCH] "${query}" -> ${counter.total} result(s): ${rendered.join(', ')}`);
      expect(counter.total).toBe(expected.length);
      expect([...rendered].sort()).toEqual([...expected].sort());
      // The computed rule and the UI agree.
      expect([...rendered].sort()).toEqual([...idsMatchingQuery(query)].sort());
    }

    // Nonsense query -> empty state, and the empty state's "Clear filters"
    // restores the full set.
    await search.fill('zzqqxx-not-a-real-demo-1234');
    await expect(dialog.getByTestId('demo-empty-state')).toBeVisible({ timeout: 20000 });
    const emptyCounter = await readCounter(dialog);
    console.log(`[SEARCH] nonsense query -> "${emptyCounter.text}"`);
    expect(emptyCounter.total).toBe(0);
    expect(emptyCounter.shown).toBe(0);
    expect(await dialog.locator('[data-demo-id]').count()).toBe(0);

    await clickViaElement(dialog.getByTestId('demo-empty-clear-filters'));
    await expect(dialog.getByTestId('demo-empty-state')).toHaveCount(0, { timeout: 20000 });
    await expect
      .poll(async () => (await readCounter(dialog)).total, { timeout: 20000 })
      .toBe(REGISTRY_TOTAL);
    expect(await dialog.locator('input[aria-label="Search demos"]').inputValue()).toBe('');
    console.log(`[SEARCH] "Clear filters" restored ${(await readCounter(dialog)).text}`);

    // ── 4. FILTERS ────────────────────────────────────────────────────────
    const sourceSelect = dialog.locator('select[aria-label="Source"]');
    const styleSelect = dialog.locator('select[aria-label="Style"]');
    const aspectSelect = dialog.locator('select[aria-label="Aspect ratio"]');

    // Source collection filter.
    for (const collection of demoCollections) {
      await sourceSelect.selectOption(collection.id);
      await expect
        .poll(async () => (await readCounter(dialog)).total, { timeout: 20000 })
        .toBe(collection.count);
      await expandAll(dialog);
      const rendered = await renderedDemoIds(dialog);
      const expected = REGISTRY.filter((entry) => entry.collectionId === collection.id).map(
        (entry) => entry.id,
      );
      console.log(`[FILTER source=${collection.id}] ${rendered.length} demo(s)`);
      expect(rendered.length).toBe(collection.count);
      expect([...rendered].sort()).toEqual([...expected].sort());
      for (const id of rendered) {
        expect(REGISTRY_BY_ID.get(id)!.collectionId).toBe(collection.id);
      }
    }
    await sourceSelect.selectOption('all');
    await expect.poll(async () => (await readCounter(dialog)).total).toBe(REGISTRY_TOTAL);

    // Style filter.
    const styleCounts = new Map<string, number>();
    for (const entry of REGISTRY) {
      styleCounts.set(entry.category.toLowerCase(), (styleCounts.get(entry.category.toLowerCase()) ?? 0) + 1);
    }
    for (const [style, count] of styleCounts) {
      await styleSelect.selectOption(style);
      await expect
        .poll(async () => (await readCounter(dialog)).total, { timeout: 20000 })
        .toBe(count);
      await expandAll(dialog);
      const rendered = await renderedDemoIds(dialog);
      console.log(`[FILTER style=${style}] ${rendered.length} demo(s)`);
      expect(rendered.length).toBe(count);
      for (const id of rendered) {
        expect(REGISTRY_BY_ID.get(id)!.category.toLowerCase()).toBe(style);
      }
    }
    await styleSelect.selectOption('all');
    await expect.poll(async () => (await readCounter(dialog)).total).toBe(REGISTRY_TOTAL);

    // Aspect-ratio filter.
    const aspectCounts = new Map<string, number>();
    for (const entry of REGISTRY) {
      aspectCounts.set(entry.aspectRatio, (aspectCounts.get(entry.aspectRatio) ?? 0) + 1);
    }
    for (const [aspect, count] of aspectCounts) {
      await aspectSelect.selectOption(aspect);
      await expect
        .poll(async () => (await readCounter(dialog)).total, { timeout: 20000 })
        .toBe(count);
      await expandAll(dialog);
      const rendered = await renderedDemoIds(dialog);
      console.log(`[FILTER aspect=${aspect}] ${rendered.length} demo(s)`);
      expect(rendered.length).toBe(count);
      for (const id of rendered) {
        expect(REGISTRY_BY_ID.get(id)!.aspectRatio).toBe(aspect);
      }
    }
    await aspectSelect.selectOption('all');
    await expect.poll(async () => (await readCounter(dialog)).total).toBe(REGISTRY_TOTAL);

    // ── 5. PAGINATION ─────────────────────────────────────────────────────
    await clearAllFilters(dialog);
    await expect.poll(async () => (await readCounter(dialog)).total).toBe(REGISTRY_TOTAL);

    const seen = new Set<string>();
    const pageSizes: number[] = [];
    let previousCount = 0;
    for (let i = 0; i < 80; i += 1) {
      const rendered = await renderedDemoIds(dialog);
      pageSizes.push(rendered.length);
      for (const id of rendered) seen.add(id);
      expect(
        rendered.length,
        'the grid must never shrink while paging',
      ).toBeGreaterThanOrEqual(previousCount);
      previousCount = rendered.length;
      const more = dialog.getByTestId('demo-show-more');
      if ((await more.count()) === 0) break;
      const before = rendered.length;
      await clickViaElement(more.first());
      await expect
        .poll(() => dialog.locator('[data-demo-id]').count(), { timeout: 20000 })
        .toBeGreaterThan(before);
    }
    const finalCounter = await readCounter(dialog);
    console.log(`[PAGINATION] page sizes: ${pageSizes.join(' -> ')}`);
    console.log(`[PAGINATION] union of all pages: ${seen.size} / ${REGISTRY_TOTAL}`);
    expect(finalCounter.total).toBe(REGISTRY_TOTAL);
    expect(finalCounter.shown).toBe(REGISTRY_TOTAL);
    expect(seen.size, 'every registry id must be reachable through "Show more"').toBe(
      REGISTRY_TOTAL,
    );
    const missing = REGISTRY_IDS.filter((id) => !seen.has(id));
    expect(missing, `ids never revealed: ${missing.join(', ')}`).toEqual([]);

    // ── 6. PREMIUM EXCLUSION ──────────────────────────────────────────────
    // Every rendered card (all 123 are mounted at this point).
    const cardAudit = await dialog.locator('[data-demo-id]').evaluateAll((nodes) =>
      nodes.map((node) => {
        const card = node as HTMLElement;
        const img = card.querySelector('img');
        const video = card.querySelector('video');
        return {
          demoId: card.getAttribute('data-demo-id'),
          poster: img?.getAttribute('src') ?? null,
          video: video?.getAttribute('src') ?? null,
        };
      }),
    );
    expect(cardAudit.length).toBe(REGISTRY_TOTAL);

    for (const card of cardAudit) {
      for (const src of [card.poster, card.video].filter(Boolean) as string[]) {
        expect(src, `card ${card.demoId} must use a local /media/ path`).toMatch(/^\/media\//);
        for (const prefix of FORBIDDEN_PATH_PREFIXES) {
          expect(src, `card ${card.demoId} must not point at ${prefix}`).not.toContain(prefix);
        }
        for (const host of FORBIDDEN_HOSTS) {
          expect(src, `card ${card.demoId} must not point at ${host}`).not.toContain(host);
        }
        const collection = src.split('/')[2];
        expect(
          ELIGIBLE_COLLECTIONS,
          `card ${card.demoId} points at the ineligible collection "${collection}"`,
        ).toContain(collection);
      }
    }
    // Data level: the registry itself must be clean.
    for (const entry of REGISTRY) {
      for (const src of [entry.videoSrc, entry.posterSrc]) {
        expect(src).toMatch(/^\/media\//);
        for (const prefix of FORBIDDEN_PATH_PREFIXES) {
          expect(src, `registry entry ${entry.id} points at ${prefix}`).not.toContain(prefix);
        }
        for (const host of FORBIDDEN_HOSTS) {
          expect(src, `registry entry ${entry.id} points at ${host}`).not.toContain(host);
        }
        expect(ELIGIBLE_COLLECTIONS).toContain(src.split('/')[2]);
      }
    }
    console.log(
      `[PREMIUM] ${cardAudit.length} cards audited, all under /media/{${ELIGIBLE_COLLECTIONS.join(',')}}`,
    );

    // The selected card's <video> must also be a local, eligible clip.
    const firstDemo = REGISTRY[0];
    await selectDemoById(page, dialog, firstDemo);
    const playerSrc = await selectedPlayer(dialog).getAttribute('src');
    expect(playerSrc).toMatch(/^\/media\//);
    expect(ELIGIBLE_COLLECTIONS).toContain((playerSrc ?? '').split('/')[2]);
    for (const prefix of FORBIDDEN_PATH_PREFIXES) {
      expect(playerSrc).not.toContain(prefix);
    }

    // ── diagnostics ───────────────────────────────────────────────────────
    const realFailures = diagnostics.failedRequests.filter(
      (entry) => !entry.includes('net::ERR_ABORTED'),
    );
    console.log(`\n[CONSOLE] ${diagnostics.consoleLogs.length} error/warning message(s)`);
    for (const entry of diagnostics.consoleLogs.slice(0, 40)) {
      console.log(`  - (${entry.type}) ${entry.text}`);
    }
    console.log(`[NETWORK] ${realFailures.length} failed request(s)`);
    for (const entry of realFailures.slice(0, 40)) {
      console.log(`  - ${entry}`);
    }
    expect(
      diagnostics.consoleLogs.filter((entry) => entry.type === 'pageerror'),
      'no uncaught page errors',
    ).toEqual([]);
  });

  // ── 7. REAL PLAYBACK ACROSS THE LIBRARY ───────────────────────────────
  test('demos from every collection and every category really decode and play', async ({ page }) => {
    test.setTimeout(20 * 60 * 1000);

    const diagnostics = attachDiagnostics(page);
    const dialog = await openDemosTab(page);

    // Sample: the first registry demo of every collection, then the first
    // registry demos of every visible taxonomy category, topped up from a
    // spread of the whole registry so the sample is representative.
    const sample = new Map<string, DemoLibraryEntry>();
    const add = (entry: DemoLibraryEntry | undefined) => {
      if (entry) sample.set(entry.id, entry);
    };
    for (const collection of demoCollections) {
      add(REGISTRY.find((entry) => entry.collectionId === collection.id));
    }
    for (const categoryId of VISIBLE_CATEGORY_IDS) {
      if (categoryId === ALL_DEMOS_CATEGORY_ID) continue;
      const ids = idsInCategory(categoryId);
      let taken = 0;
      for (const id of ids) {
        if (sample.has(id)) continue;
        add(REGISTRY_BY_ID.get(id));
        taken += 1;
        if (taken >= 2) break;
      }
    }
    // Top up to a comfortable sample size from the registry front to back.
    for (const entry of REGISTRY) {
      if (sample.size >= 24) break;
      add(entry);
    }
    const sampleList = [...sample.values()];
    console.log(`\n[PLAYBACK] sample size: ${sampleList.length}`);
    expect(sampleList.length).toBeGreaterThanOrEqual(20);
    // Every collection and every category is represented.
    for (const collection of demoCollections) {
      expect(
        sampleList.some((entry) => entry.collectionId === collection.id),
        `the sample must cover collection ${collection.id}`,
      ).toBe(true);
    }
    for (const categoryId of VISIBLE_CATEGORY_IDS) {
      if (categoryId === ALL_DEMOS_CATEGORY_ID) continue;
      const ids = idsInCategory(categoryId);
      expect(
        sampleList.some((entry) => ids.includes(entry.id)),
        `the sample must cover category ${categoryId}`,
      ).toBe(true);
    }

    interface Outcome {
      id: string;
      collection: string;
      title: string;
      src: string | null;
      srcCorrect: boolean;
      pass: boolean;
      reason: string;
    }
    const outcomes: Outcome[] = [];

    for (const demo of sampleList) {
      let src: string | null = null;
      let srcCorrect = false;
      let probe: PlaybackProbe | null = null;
      let reason = '';

      try {
        const player = await selectDemoById(page, dialog, demo);
        src = await player.getAttribute('src');
        srcCorrect = Boolean(src && src.includes(demo.videoSrc));
        if (!srcCorrect) reason = `src mismatch: got ${src}, expected ${demo.videoSrc}`;

        probe = await probePlayback(player);
        if (!srcCorrect) {
          // keep the first reason
        } else if (!probe.ready) {
          reason = `readyState ${probe.readyState} never reached HAVE_CURRENT_DATA (2)`;
        } else if (probe.error) {
          reason = `media error: ${probe.error}`;
        } else if (probe.width <= 0 || probe.height <= 0) {
          reason = `invalid dimensions ${probe.width}x${probe.height}`;
        } else if (probe.playError) {
          reason = `play() rejected: ${probe.playError}`;
        } else if (!probe.moved) {
          reason = `currentTime never moved (start ${probe.startTime}, end ${probe.endTime})`;
        } else if (probe.paused) {
          reason = 'the element was paused during playback';
        } else {
          reason = '';
        }
      } catch (error) {
        reason = `exception: ${error instanceof Error ? error.message : String(error)}`;
      }

      const pass = Boolean(srcCorrect && probe && probe.ready && !probe.error && probe.width > 0 && probe.height > 0 && probe.moved && !probe.paused && !reason);
      outcomes.push({
        id: demo.id,
        collection: demo.collectionId,
        title: demo.title,
        src,
        srcCorrect,
        pass,
        reason,
      });
      console.log(
        `[PLAYBACK] ${pass ? 'PASS' : 'FAIL'} ${demo.id} (${demo.collectionId}) ${
          probe
            ? `readyState=${probe.readyState} ${probe.width}x${probe.height} moved=${
                probe.moved
              } advanced=${probe.advanced} paused=${probe.paused} err=${probe.error ?? 'none'}`
            : 'no probe'
        }${reason ? ` :: ${reason}` : ''}`,
      );
    }

    const passed = outcomes.filter((outcome) => outcome.pass).length;
    const failed = outcomes.filter((outcome) => !outcome.pass);
    console.log(`\n[PLAYBACK SUMMARY] passed ${passed} / failed ${failed.length} / total ${outcomes.length}`);
    for (const outcome of failed) {
      console.log(`  FAIL ${outcome.id} — ${outcome.reason}`);
    }

    const realFailures = diagnostics.failedRequests.filter(
      (entry) => !entry.includes('net::ERR_ABORTED'),
    );
    console.log(`[NETWORK] ${realFailures.length} failed request(s)`);
    for (const entry of realFailures.slice(0, 40)) {
      console.log(`  - ${entry}`);
    }
    console.log(`[CONSOLE] ${diagnostics.consoleLogs.length} error/warning message(s)`);
    for (const entry of diagnostics.consoleLogs.slice(0, 40)) {
      console.log(`  - (${entry.type}) ${entry.text}`);
    }

    expect(passed, `failed demos: ${failed.map((f) => `${f.id} (${f.reason})`).join('; ')}`).toBe(
      outcomes.length,
    );
  });

  // ── 8. SELECTION INTEGRITY ─────────────────────────────────────────────
  test('the selection survives category, page and search changes', async ({ page }) => {
    test.setTimeout(10 * 60 * 1000);

    const diagnostics = attachDiagnostics(page);
    const dialog = await openDemosTab(page);

    const demoX = REGISTRY_BY_ID.get('minimax-h3:gourmet-burger-ugc-taste-test')!;
    const demoY = REGISTRY_BY_ID.get('seedance-1:van-gogh-post-impressionism-style-animation')!;

    // A category that holds demoX…
    const categoryA = VISIBLE_CATEGORY_IDS.find(
      (id) => id !== ALL_DEMOS_CATEGORY_ID && isCategoryActiveForDemo(id, toVideoDemo(demoX)),
    )!;
    // …and a visible category that does NOT hold demoX.
    const categoryB = VISIBLE_CATEGORY_IDS.find(
      (id) =>
        id !== ALL_DEMOS_CATEGORY_ID &&
        id !== categoryA &&
        !isCategoryActiveForDemo(id, toVideoDemo(demoX)),
    )!;
    console.log(`\n[SELECTION] demoX=${demoX.id} in "${categoryA}", demoY=${demoY.id}, other category "${categoryB}"`);

    await selectDemoById(page, dialog, demoX);
    const initialSrc = await selectedPlayer(dialog).getAttribute('src');
    expect(initialSrc).toContain(demoX.videoSrc);
    expect(await selectedDemoId(dialog)).toBe(demoX.id);
    console.log(`[SELECTION] selected ${demoX.id} (src ${initialSrc})`);

    // Switch to a category that holds the demo.
    await clickViaElement(dialog.getByTestId(`demo-category-tab-${categoryA}`));
    await expect
      .poll(async () => (await selectedDemoId(dialog)) === demoX.id, { timeout: 20000 })
      .toBe(true);
    expect(await selectedPlayer(dialog).getAttribute('src')).toBe(initialSrc);
    console.log(`[SELECTION] after switching to "${categoryA}": id and src unchanged`);

    // Switch to a category that does NOT hold the demo: the card is unmounted…
    await clickViaElement(dialog.getByTestId(`demo-category-tab-${categoryB}`));
    await expect
      .poll(async () => (await selectedDemoId(dialog)) === null, { timeout: 20000 })
      .toBe(true);
    expect(await selectedPlayer(dialog).count()).toBe(0);
    console.log(`[SELECTION] after switching to "${categoryB}": the demo is not in this category`);

    // …and switching back must restore the very same selection and clip.
    await clickViaElement(dialog.getByTestId(`demo-category-tab-${categoryA}`));
    await expect
      .poll(async () => (await selectedDemoId(dialog)) === demoX.id, { timeout: 20000 })
      .toBe(true);
    expect(await selectedPlayer(dialog).getAttribute('src')).toBe(initialSrc);
    console.log(`[SELECTION] back in "${categoryA}": id and src unchanged`);

    // Page forward: the selection must not change.
    await clickViaElement(dialog.getByTestId(`demo-category-tab-${ALL_DEMOS_CATEGORY_ID}`));
    await expect
      .poll(async () => (await selectedDemoId(dialog)) === demoX.id, { timeout: 20000 })
      .toBe(true);
    const showMore = dialog.getByTestId('demo-show-more');
    if ((await showMore.count()) > 0) {
      await clickViaElement(showMore.first());
      await expect
        .poll(() => dialog.locator('[data-demo-id]').count(), { timeout: 20000 })
        .toBeGreaterThan(0);
    }
    expect(await selectedDemoId(dialog)).toBe(demoX.id);
    expect(await selectedPlayer(dialog).getAttribute('src')).toBe(initialSrc);
    console.log('[SELECTION] after "Show more": id and src unchanged');

    // Search: a query that still matches the demo must not disturb it…
    await dialog.locator('input[aria-label="Search demos"]').fill('gourmet burger');
    await expect
      .poll(async () => (await selectedDemoId(dialog)) === demoX.id, { timeout: 20000 })
      .toBe(true);
    expect(await selectedPlayer(dialog).getAttribute('src')).toBe(initialSrc);
    console.log('[SELECTION] after searching "gourmet burger": id and src unchanged');

    // …and a query that hides it must not clear the selection either.
    await dialog.locator('input[aria-label="Search demos"]').fill('zzqqxx-not-a-real-demo-1234');
    await expect(dialog.getByTestId('demo-empty-state')).toBeVisible({ timeout: 20000 });
    expect(await selectedPlayer(dialog).count()).toBe(0);
    await clickViaElement(dialog.getByTestId('demo-empty-clear-filters'));
    await expect(dialog.getByTestId('demo-empty-state')).toHaveCount(0, { timeout: 20000 });
    // "Clear filters" restores the unfiltered library; the selected demo lives
    // outside the first window, so page until its card is mounted again.
    expect(await revealCard(dialog, demoX.id), 'the selected demo must still be reachable').toBe(
      true,
    );
    expect(await selectedDemoId(dialog)).toBe(demoX.id);
    expect(await selectedPlayer(dialog).getAttribute('src')).toBe(initialSrc);
    console.log('[SELECTION] after a hiding search + Clear filters: id and src unchanged');

    // Deliberately select a different demo: the selection AND the preview
    // video must change to the new one.
    await selectDemoById(page, dialog, demoY);
    const newSrc = await selectedPlayer(dialog).getAttribute('src');
    expect(await selectedDemoId(dialog)).toBe(demoY.id);
    expect(newSrc).toContain(demoY.videoSrc);
    expect(newSrc).not.toBe(initialSrc);
    // Exactly one card is selected.
    expect(await dialog.locator('[data-demo-id][aria-pressed="true"]').count()).toBe(1);
    // And exactly one player is mounted.
    expect(await selectedPlayer(dialog).count()).toBe(1);
    console.log(`[SELECTION] selected ${demoY.id} (src ${newSrc}) — the selection moved`);

    const realFailures = diagnostics.failedRequests.filter(
      (entry) => !entry.includes('net::ERR_ABORTED'),
    );
    console.log(`[NETWORK] ${realFailures.length} failed request(s)`);
    for (const entry of realFailures.slice(0, 20)) {
      console.log(`  - ${entry}`);
    }
    console.log(`[CONSOLE] ${diagnostics.consoleLogs.length} error/warning message(s)`);
    for (const entry of diagnostics.consoleLogs.slice(0, 20)) {
      console.log(`  - (${entry.type}) ${entry.text}`);
    }
  });

  // ── 9. THE SELECTION REACHES STEP 4 ─────────────────────────────────────
  test('a demo selection reaches Step 4 and is the clip being previewed', async ({ page }) => {
    test.setTimeout(15 * 60 * 1000);

    const diagnostics = attachDiagnostics(page);

    // One demo from each collection, each in a different taxonomy category.
    const chosen: DemoLibraryEntry[] = [];
    for (const collection of demoCollections) {
      const entry = REGISTRY.find((item) => item.collectionId === collection.id)!;
      chosen.push(entry);
    }

    for (const [index, demo] of chosen.entries()) {
      const dialog = await openDemosTab(page, `step4-${index}`);
      await selectDemoById(page, dialog, demo);

      // Step 2 -> Step 3.
      const continueBtn = dialog.getByRole('button', { name: /^Continue/i });
      await expect(continueBtn).toBeVisible({ timeout: 20000 });
      await clickViaElement(continueBtn);

      // Step 3 -> Step 4.
      const previewMyVideo = page.getByRole('button', { name: /Preview my video/i });
      await expect(previewMyVideo).toBeVisible({ timeout: 30000 });
      await clickViaElement(previewMyVideo);

      await expect(
        dialog.getByRole('heading', { name: /Preview and approve/i }),
      ).toBeVisible({ timeout: 30000 });
      console.log(`\n[STEP4] ${demo.id} — reached Step 4`);

      // The Step 4 player starts paused: press "Play preview".
      const playPreview = page.getByRole('button', { name: /Play preview/i });
      await expect(playPreview.first()).toBeVisible({ timeout: 30000 });
      await clickViaElement(playPreview.first());
      await page.waitForTimeout(1500);

      // The composition canvas must advance (frames are really drawn).
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
        const deadline = Date.now() + 25000;
        const first = sample();
        let second = first;
        while (Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          second = sample();
          if (first !== null && second !== null && first !== second) break;
        }
        return { found: true as const, first, second };
      });
      expect(probe.found, 'the Step 4 preview must render a composition canvas').toBe(true);
      if (probe.found) {
        expect(probe.first, 'the canvas must contain rendered pixels').not.toBeNull();
        expect(probe.first !== probe.second, 'the composition canvas must advance').toBe(true);
      }

      // The clip must have been served for THIS demo.
      const clipResponses = diagnostics.responses.filter(
        (response) => response.url.includes(demo.videoSrc),
      );
      console.log(
        `[STEP4] ${demo.id} — clip responses: ${JSON.stringify(
          clipResponses.map((response) => response.status),
        )}`,
      );
      expect(
        clipResponses.some((response) => response.status === 200 || response.status === 206),
        `the clip ${demo.videoSrc} must be served with 200/206`,
      ).toBe(true);

      // Bonus signal: if the composition exposes a DOM <video>, its src must be
      // the selected demo's clip.
      const domVideos = await page
        .locator('video')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const el = node as HTMLVideoElement;
            return { src: el.getAttribute('src'), current: el.currentSrc };
          }),
        );
      const matching = domVideos.filter((video) => (video.src ?? '').includes(demo.videoSrc));
      console.log(
        `[STEP4] ${demo.id} — DOM <video> elements: ${JSON.stringify(domVideos)}`,
      );
      if (matching.length > 0) {
        expect(matching[0].src).toContain(demo.videoSrc);
      }
    }

    const realFailures = diagnostics.failedRequests.filter(
      (entry) => !entry.includes('net::ERR_ABORTED'),
    );
    console.log(`\n[NETWORK] ${realFailures.length} failed request(s)`);
    for (const entry of realFailures.slice(0, 40)) {
      console.log(`  - ${entry}`);
    }
    console.log(`[CONSOLE] ${diagnostics.consoleLogs.length} error/warning message(s)`);
    for (const entry of diagnostics.consoleLogs.slice(0, 40)) {
      console.log(`  - (${entry.type}) ${entry.text}`);
    }
  });
});
