import { test, expect } from '@playwright/test';
import { MOTION_TEMPLATES, MOTION_TEMPLATE_CARDS } from '../src/data/motionRecipeCatalog';

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3111';

/**
 * Full-clip-universe health check for the ShotCraft same-origin proxy.
 *
 * Companion to `personalization-motion-template-video.spec.ts`: that spec
 * range-probes only the FIRST 5 clips (it must stay focused on playback),
 * while this spec proves the proxy can serve EVERY clip URL the catalog
 * references — the full union of `MOTION_TEMPLATES` + `MOTION_TEMPLATE_CARDS`
 * previews (150 unique style keys) — plus the rejection paths (unknown key,
 * traversal).
 *
 * Nothing here is mocked: every request flows through the local Next.js dev
 * server started by `playwright.shared.ts` and out of the proxy route to its
 * real upstream, so a broken key, a lost release asset, or a route regression
 * (content type, range support) fails visibly.
 */

const PROXY_PREFIX = '/api/media/shotcraft/';
const KEY_PATTERN = /^\/api\/media\/shotcraft\/([a-z0-9][a-z0-9-]*)\.mp4$/;
const SWEEP_CONCURRENCY = 8;
const RANGE_SAMPLE_SIZE = 15;

/** Every unique style key referenced by BOTH catalog arrays, sorted. */
const CLIP_KEYS = [...new Set(
  [...MOTION_TEMPLATES, ...MOTION_TEMPLATE_CARDS]
    .map((entry) => entry.preview?.trim())
    .filter((preview): preview is string => Boolean(preview))
    .map((preview) => {
      const match = preview.match(KEY_PATTERN);
      if (!match) throw new Error(`catalog preview is not a ShotCraft proxy URL: ${preview}`);
      return match[1];
    }),
)].sort();

/** Deterministic range-probe sample spread across all template categories. */
function pickCategorySpreadSample(size: number): { key: string; category: string }[] {
  const byCategory = new Map<string, string[]>();
  for (const template of MOTION_TEMPLATES) {
    if (!template.preview) continue;
    const match = template.preview.match(KEY_PATTERN);
    if (!match) continue;
    const bucket = byCategory.get(template.category) ?? [];
    bucket.push(match[1]);
    byCategory.set(template.category, bucket);
  }

  const categories = [...byCategory.keys()].sort();
  const picked: { key: string; category: string }[] = [];
  const cursor = new Map<string, number>();
  // Round-robin one entry per category per pass, walking each category's
  // bucket with wrap-around so later passes deepen into the category.
  outer: for (let round = 0; round < Math.ceil(size / Math.max(categories.length, 1)); round += 1) {
    for (const category of categories) {
      if (picked.length >= size) break outer;
      const bucket = byCategory.get(category)!;
      const index = (cursor.get(category) ?? round) % bucket.length;
      cursor.set(category, index + 1);
      const key = bucket[index];
      if (!picked.some((item) => item.key === key)) picked.push({ key, category });
    }
  }
  return picked;
}

/** Run async tasks with a bounded pool of parallel workers. */
async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (true) {
      const index = next;
      next += 1;
      if (index >= tasks.length) return;
      const task = tasks[index];
      if (!task) return;
      results.push(await task());
    }
  });
  await Promise.all(workers);
  return results;
}

// Upstream verification (executed out-of-band with curl, 2026-10-21): the
// release chain resolves ALL 150 keys (HEAD 200 via
// release-assets.githubusercontent.com after one redirect, accept-ranges:
// bytes) and the Pages origin mirrors all 150 (video/mp4), so the route needs
// no fallback — full-clip coverage is proven end to end here.

// Budget so a healthy sweep finishes inside the QA wave's runtime bound; a
// broken upstream shows up as aggregate failures long before hitting these.
const HEAD_SWEEP_TIMEOUT_MS = 120_000;
const SAMPLE_TIMEOUT_MS = 120_000;

test.describe('ShotCraft proxy — full clip universe', () => {
  test('HEAD: all 150 catalog clip keys resolve through the same-origin proxy', async () => {
    test.setTimeout(HEAD_SWEEP_TIMEOUT_MS);

    // Document the universe being swept: 150 unique upstream style keys,
    // reached via 150 shot previews + 124 card previews (two shots share one
    // key, so the union de-duplicates).
    expect(CLIP_KEYS.length).toBe(150);

    const problems: string[] = [];
    let checked = 0;

    await runWithConcurrency(
      CLIP_KEYS.map((key) => async () => {
        try {
          const res = await fetch(`${BASE}${PROXY_PREFIX}${key}.mp4`, { method: 'HEAD' });
          const contentType = res.headers.get('content-type') ?? '';
          const acceptRanges = res.headers.get('accept-ranges') ?? '';
          checked += 1;
          if (res.status !== 200) problems.push(`${key}: HEAD status ${res.status} (want 200)`);
          if (!contentType.includes('video/mp4')) problems.push(`${key}: content-type ${contentType} (want video/mp4)`);
          if (acceptRanges !== 'bytes') problems.push(`${key}: accept-ranges ${acceptRanges} (want bytes)`);
        } catch (err) {
          problems.push(`${key}: HEAD threw ${(err as Error).message}`);
        }
      }),
      SWEEP_CONCURRENCY,
    );

    console.log(`  proxy HEAD sweep: ${checked}/${CLIP_KEYS.length} keys checked`);
    // One aggregate failure listing every unhappy key keeps a single run
    // usable for diagnosing which upstream assets are missing.
    expect(problems, `${problems.length}/${CLIP_KEYS.length} keys failed the HEAD sweep`).toEqual([]);
  });

  test('Range GET: a 15-key category-spread sample returns 206 with real MP4 bytes', async () => {
    test.setTimeout(SAMPLE_TIMEOUT_MS);

    const sample = pickCategorySpreadSample(RANGE_SAMPLE_SIZE);
    expect(sample.length).toBe(RANGE_SAMPLE_SIZE);
    // The catalog publishes exactly 10 categories; the spread sample must
    // reach all of them (15 slots > 10 categories guarantees dense coverage).
    const catalogCategories = new Set(MOTION_TEMPLATES.map((t) => t.category)).size;
    expect(catalogCategories).toBe(10);
    expect(new Set(sample.map((s) => s.category)).size, 'sample must span categories')
      .toBe(Math.min(RANGE_SAMPLE_SIZE, catalogCategories));

    const problems: string[] = [];
    await runWithConcurrency(
      sample.map(({ key, category }) => async () => {
        try {
          // Whole-file GET: unsliced playback path (status 200, full body).
          const full = await fetch(`${BASE}${PROXY_PREFIX}${key}.mp4`);
          const fullBuf = new Uint8Array(await full.arrayBuffer());
          const fullMagic = fullBuf.length >= 8 ? String.fromCharCode(...fullBuf.slice(4, 8)) : '';
          const fullType = full.headers.get('content-type') ?? '';
          if (full.status !== 200) problems.push(`${key}: full GET status ${full.status} (want 200)`);
          if (!fullType.includes('video/mp4')) problems.push(`${key}: full GET content-type ${fullType}`);
          if (fullBuf.length <= 100) problems.push(`${key}: full GET body only ${fullBuf.length} bytes`);
          if (fullMagic !== 'ftyp') problems.push(`${key}: full GET first MP4 box is ${fullMagic || 'absent'}`);

          // Sliced playback path: the Range request must yield a Partial
          // Content response carrying real MP4 bytes.
          const res = await fetch(`${BASE}${PROXY_PREFIX}${key}.mp4`, {
            headers: { Range: 'bytes=0-99' },
          });
          const buf = new Uint8Array(await res.arrayBuffer());
          const magic = buf.length >= 8 ? String.fromCharCode(...buf.slice(4, 8)) : '';
          const contentRange = res.headers.get('content-range') ?? '';
          const contentType = res.headers.get('content-type') ?? '';
          if (res.status !== 206) problems.push(`${key}: range status ${res.status} (want 206)`);
          if (!contentType.includes('video/mp4')) problems.push(`${key}: content-type ${contentType}`);
          if (!contentRange.startsWith('bytes 0-99/')) problems.push(`${key}: content-range ${contentRange}`);
          if (magic !== 'ftyp') problems.push(`${key}: first MP4 box is ${magic || 'absent'} (want ftyp)`);
        } catch (err) {
          problems.push(`${key}[${category}]: media GET threw ${(err as Error).message}`);
        }
      }),
      SWEEP_CONCURRENCY,
    );

    expect(problems, `${problems.length}/${sample.length} sampled keys failed the range probe`).toEqual([]);
  });

  test('unknown keys and traversal attempts are rejected outright', async () => {
    // An unknown style key must not silently resolve to an upstream 200.
    const missing = await fetch(`${BASE}${PROXY_PREFIX}not-a-real-style-key.mp4`);
    expect([404, 400]).toContain(missing.status);

    // Traversal must never be able to leave the proxy's key namespace — the
    // route validates the key charset, so both encoded flavours are rejected.
    const traversalSlash = await fetch(
      `${BASE}${PROXY_PREFIX}${encodeURIComponent('../../etc/passwd')}.mp4`,
    );
    expect([400, 404]).toContain(traversalSlash.status);

    const traversalDots = await fetch(`${BASE}${PROXY_PREFIX}%2e%2e%2fetc%2fpasswd.mp4`);
    expect([400, 404]).toContain(traversalDots.status);

    // The key charset is lowercase kebab; an invalid character must be a 400.
    const upperCase = await fetch(`${BASE}${PROXY_PREFIX}Basic-3D-Scene.mp4`);
    expect([400, 404]).toContain(upperCase.status);

    const absurdLength = await fetch(`${BASE}${PROXY_PREFIX}${'x'.repeat(500)}.mp4`);
    expect([400, 404]).toContain(absurdLength.status);
  });
});
