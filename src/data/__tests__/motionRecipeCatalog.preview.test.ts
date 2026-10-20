/**
 * Catalog integrity for the Motion Studio (ShotCraft) preview assets.
 *
 * The catalog hands the Personalization Modal a `preview` clip and an optional
 * `poster` still for every motion shot. This test proves that:
 *
 *   1. every catalog entry carries a preview clip,
 *   2. every clip key is a REAL upstream ShotCraft style whose published media
 *      basename matches it (no missing clip, no clip borrowed from another
 *      style), and
 *   3. every poster key resolves to a real upstream JPEG.
 *
 * It is a data-integrity test, so it runs in vitest (no browser, no dev
 * server) rather than in the Playwright suite — 150 upstream reads do not
 * belong in a browser run that also has to prove playback.
 */

import { describe, it, expect } from 'vitest';
import { MOTION_TEMPLATES, MOTION_TEMPLATE_CARDS } from '../motionRecipeCatalog';

const UPSTREAM_LIBRARY_URL =
  'https://raw.githubusercontent.com/Vincentwei1021/video-shotcraft/main/gallery/api/library.json';

interface UpstreamStyle {
  key?: string;
  media?: { url?: string };
  poster?: { url?: string };
}

interface UpstreamCard {
  name?: string;
  styles?: UpstreamStyle[];
}

interface UpstreamLibrary {
  cards?: UpstreamCard[];
}

/** Upstream style key -> published media basename (e.g. `basic-3d-scene.mp4`). */
async function loadUpstreamStyles(): Promise<Map<string, string>> {
  const res = await fetch(UPSTREAM_LIBRARY_URL);
  if (!res.ok) throw new Error(`upstream library returned ${res.status}`);
  const lib = (await res.json()) as UpstreamLibrary;
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
