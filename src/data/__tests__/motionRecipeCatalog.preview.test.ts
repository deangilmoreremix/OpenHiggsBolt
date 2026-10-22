/**
 * Catalog integrity for the Motion Studio (ShotCraft) preview assets.
 *
 * The catalog hands the Personalization Modal a `preview` clip and an optional
 * `poster` still for every motion shot. This test proves that:
 *
 *   1. every catalog entry carries a preview clip,
 *   2. the catalogue is exactly the upstream library — 150 unique style keys
 *      and 124 unique card slugs that match `library.json` BIDIRECTIONALLY
 *      (no retired local entries, no missing upstream entries),
 *   3. every clip key is a REAL upstream ShotCraft style whose published media
 *      basename matches it (no missing clip, no clip borrowed from another
 *      style), and
 *   4. every poster key resolves to a real upstream JPEG.
 *
 * It is a data-integrity test, so it runs in vitest (no browser, no dev
 * server) rather than in the Playwright suite — 150 upstream reads do not
 * belong in a browser run that also has to prove playback.
 */

import { describe, it, expect } from 'vitest';
import {
  MOTION_CATEGORIES,
  MOTION_TEMPLATES,
  MOTION_TEMPLATE_CARDS,
  normalizeCardCounts,
} from '../motionRecipeCatalog';

const UPSTREAM_LIBRARY_URL =
  'https://raw.githubusercontent.com/Vincentwei1021/video-shotcraft/main/gallery/api/library.json';

interface UpstreamStyle {
  key?: string;
  media?: { url?: string };
  poster?: { url?: string };
}

interface UpstreamCard {
  name?: string;
  summary?: string;
  category?: string;
  styles?: UpstreamStyle[];
}

interface UpstreamLibrary {
  cards?: UpstreamCard[];
}

/** The upstream library JSON, parsed. Throws (fails the test) on a bad fetch. */
async function loadUpstreamLibrary(): Promise<UpstreamLibrary> {
  const res = await fetch(UPSTREAM_LIBRARY_URL);
  if (!res.ok) throw new Error(`upstream library returned ${res.status}`);
  return (await res.json()) as UpstreamLibrary;
}

/** Upstream style key -> published media basename (e.g. `basic-3d-scene.mp4`). */
async function loadUpstreamStyles(): Promise<Map<string, string>> {
  const lib = await loadUpstreamLibrary();
  const styles = new Map<string, string>();
  for (const card of lib.cards ?? []) {
    for (const style of card.styles ?? []) {
      const key = style.key;
      const media = (style.media?.url ?? '').split('/').pop()?.split('?')[0];
      if (key && media) styles.set(key, media);
    }
  }
  return styles;
}

/** `basic-3d-scene.mp4` -> `basic-3d-scene` */
function clipKeyOf(preview: string): string {
  return preview.replace('/api/media/shotcraft/', '').replace(/\.mp4$/, '');
}

/** Upstream per-category card counts, e.g. `{ opening: 11, typographics… }`. */
const UPSTREAM_CARD_COUNTS: Record<string, number> = {
  opening: 11,
  typography: 22,
  'ui-entrance': 21,
  camera: 10,
  data: 5,
  interaction: 11,
  transition: 15,
  rhythm: 8,
  effects: 15,
  outro: 6,
};

describe('motion recipe catalog — upstream catalogue parity', () => {
  it('carries exactly 150 shots, 124 unique card slugs and 150 unique style keys', () => {
    expect(MOTION_TEMPLATES.length).toBe(150);
    expect(MOTION_TEMPLATE_CARDS.length).toBe(124);

    const slugs = new Set(MOTION_TEMPLATE_CARDS.map((c) => c.slug));
    expect(slugs.size, 'unique card slugs').toBe(124);

    const clipKeys = new Set(MOTION_TEMPLATES.filter((t) => t.preview).map((t) => clipKeyOf(t.preview!)));
    // Shots alone carry 149 distinct keys: upstream `flash-cut` (first style of
    // the three-style `shot-transitions` card) has no dedicated local shot, so
    // its clip is referenced by the card preview itself. The union of shot +
    // card previews must still cover all 150 upstream styles — asserted in
    // 'every upstream style key is covered by a local clip reference' below.
    expect(clipKeys.size, 'unique style keys via shot previews').toBe(149);

    // Stable deterministic ordering the e2e suite depends on.
    expect(MOTION_TEMPLATE_CARDS[0]?.id).toBe('camera/basic-3d-scene');
    expect(MOTION_TEMPLATE_CARDS[1]?.id).toBe('camera/crash-zoom-punch');
  });

  it('per-category card counts match the upstream library exactly', () => {
    const counts = normalizeCardCounts();
    expect(counts).toEqual(UPSTREAM_CARD_COUNTS);
    const sum = Object.values(counts).reduce((acc, n) => acc + n, 0);
    expect(sum).toBe(124);
  });

  it('per-category shot counts sum to 150 and match the declared categories', () => {
    const counts: Record<string, number> = {};
    for (const template of MOTION_TEMPLATES) counts[template.category] = (counts[template.category] ?? 0) + 1;
    for (const category of MOTION_CATEGORIES) {
      expect(counts[category.key], category.key).toBe(category.count);
    }
    const sum = Object.values(counts).reduce((acc, n) => acc + n, 0);
    expect(sum).toBe(150);
  });

  it('every card slug exists upstream AND every upstream card name exists locally', async () => {
    const lib = await loadUpstreamLibrary();
    expect((lib.cards ?? []).length).toBeGreaterThan(0);

    const upstreamNames = new Set(
      (lib.cards ?? []).map((c) => c.name).filter((name): name is string => Boolean(name)),
    );
    const localSlugs = new Set(MOTION_TEMPLATE_CARDS.map((c) => c.slug));

    const missing = [...upstreamNames].filter((name) => !localSlugs.has(name));
    expect(missing, 'upstream cards with no local entry').toEqual([]);

    const extra = [...localSlugs].filter((slug) => !upstreamNames.has(slug));
    expect(extra, 'local cards retired upstream').toEqual([]);
  });

  it('every upstream style key is covered by a local clip reference', async () => {
    const upstream = await loadUpstreamStyles();
    expect(upstream.size).toBe(150);

    // The clip universe is the UNION of shot previews and card previews:
    // shot previews cover each per-component style, and for the one style
    // with no dedicated local component (upstream `flash-cut`, first style
    // of the three-style `shot-transitions` card) the card itself points at
    // the clip. The shots alone therefore carry 149 distinct keys; the union
    // must cover all 150 upstream styles with no drift in either direction.
    const localKeys = new Set(
      [...MOTION_TEMPLATES, ...MOTION_TEMPLATE_CARDS]
        .filter((t) => t.preview)
        .map((t) => clipKeyOf(t.preview!)),
    );
    const missing = [...upstream.keys()].filter((key) => !localKeys.has(key));
    expect(missing, 'upstream styles with no local preview clip').toEqual([]);
  });
});

describe('motion recipe catalog — ShotCraft preview assets', () => {
  it('every shot and card carries a preview clip', () => {
    const missing = MOTION_TEMPLATES.filter((t) => !t.preview).map((t) => t.id);
    expect(missing, 'shots without a preview clip').toEqual([]);

    const missingCards = MOTION_TEMPLATE_CARDS.filter((c) => !c.preview).map((c) => c.id);
    expect(missingCards, 'recipe cards without a preview clip').toEqual([]);
  });

  it('every preview points at the same-origin ShotCraft proxy', () => {
    const bad = MOTION_TEMPLATES.filter(
      (t) => !/^\/api\/media\/shotcraft\/[a-z0-9][a-z0-9-]*\.mp4$/.test(t.preview ?? ''),
    ).map((t) => `${t.id} -> ${t.preview}`);
    expect(bad, 'previews that are not proxy paths').toEqual([]);

    const badCards = MOTION_TEMPLATE_CARDS.filter(
      (c) => !/^\/api\/media\/shotcraft\/[a-z0-9][a-z0-9-]*\.mp4$/.test(c.preview ?? ''),
    ).map((c) => `${c.id} -> ${c.preview}`);
    expect(badCards, 'card previews that are not proxy paths').toEqual([]);
  });

  it('every clip key is a real upstream style with a matching media basename', async () => {
    const upstream = await loadUpstreamStyles();
    expect(upstream.size).toBeGreaterThan(0);

    const unknown: string[] = [];
    const wrongMedia: string[] = [];
    for (const template of MOTION_TEMPLATES) {
      const key = clipKeyOf(template.preview!);
      const media = upstream.get(key);
      if (!media) {
        unknown.push(`${template.id} -> ${key}`);
      } else if (media !== `${key}.mp4`) {
        wrongMedia.push(`${template.id} -> ${key} (upstream media ${media})`);
      }
    }

    expect(unknown, 'clips with no matching upstream ShotCraft style').toEqual([]);
    expect(wrongMedia, 'clips pointing at a different style\'s media').toEqual([]);
  });

  it('every poster key resolves to a real upstream JPEG', async () => {
    const withPoster = MOTION_TEMPLATES.filter((t) => Boolean(t.poster));
    expect(withPoster.length).toBeGreaterThan(0);

    const results = await Promise.all(
      withPoster.map(async (template) => {
        const key = template.poster!.split('/').pop()!.replace(/\.jpg$/, '');
        try {
          const res = await fetch(template.poster!, { method: 'GET' });
          const buf = new Uint8Array(await res.arrayBuffer());
          // JPEG files start with the SOI marker 0xFFD8.
          const isJpeg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8;
          return { id: template.id, key, status: res.status, isJpeg };
        } catch (e) {
          return { id: template.id, key, status: 0, isJpeg: false };
        }
      }),
    );

    const broken = results.filter((r) => r.status !== 200 || !r.isJpeg).map((r) => `${r.id} -> ${r.key} (${r.status})`);
    expect(broken, 'posters that are not a real JPEG').toEqual([]);
  });
});
