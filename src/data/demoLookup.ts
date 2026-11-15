import { MINIMAX_H3_DEMOS } from './minimaxH3Demos';
import { SEEDANCE_25_DEMOS } from './seedance25Demos';
import { SEEDANCE_1_DEMOS } from './seedance1Demos';
import { PROMPTFEED_DEMOS } from './promptFeedDemos';
import { type VideoDemo } from './types';

const ALL_DEMOS: VideoDemo[] = [
  ...MINIMAX_H3_DEMOS,
  ...SEEDANCE_25_DEMOS,
  ...SEEDANCE_1_DEMOS,
  ...PROMPTFEED_DEMOS,
];

const DEMO_INDEX = new Map<string, VideoDemo>();
const DEMO_SLUG_INDEX = new Map<string, VideoDemo>();
for (const demo of ALL_DEMOS) {
  const key = `${demo.sourceRepo}|${demo.slug}`;
  DEMO_INDEX.set(key, demo);
  if (demo.slug) {
    DEMO_SLUG_INDEX.set(demo.slug, demo);
  }
}

export function findDemoById(templateId: string): VideoDemo | undefined {
  return DEMO_INDEX.get(templateId);
}

export function findDemoBySlug(slug: string): VideoDemo | undefined {
  return DEMO_SLUG_INDEX.get(slug);
}

export function parseTemplateId(templateId: string): { sourceRepo: string; slug: string } | undefined {
  const idx = templateId.indexOf('|');
  if (idx === -1) return undefined;
  const sourceRepo = templateId.slice(0, idx);
  const slug = templateId.slice(idx + 1);
  if (!sourceRepo || !slug) return undefined;
  return { sourceRepo, slug };
}

// The industry sections also show demos from the Seedance 2.0 prompt catalog,
// which is too large to bundle here. Their records are in the generated
// niche file; load it on demand (its own chunk) only when a lookup misses the
// core catalogs above.
let extraIndex: Promise<{ byId: Map<string, VideoDemo>; bySlug: Map<string, VideoDemo> }> | null = null;
function loadExtraIndex() {
  extraIndex ??= import('./nicheDemos.generated').then(({ NICHE_DEMOS }) => {
    const byId = new Map<string, VideoDemo>();
    const bySlug = new Map<string, VideoDemo>();
    for (const demo of Object.values(NICHE_DEMOS).flat()) {
      byId.set(`${demo.sourceRepo}|${demo.slug}`, demo);
      if (demo.slug && !bySlug.has(demo.slug)) bySlug.set(demo.slug, demo);
    }
    return { byId, bySlug };
  });
  return extraIndex;
}

/** Like findDemoBySlug, but also resolves the industry sections' extra demos. */
export async function resolveDemoBySlug(slug: string): Promise<VideoDemo | undefined> {
  return findDemoBySlug(slug) ?? (await loadExtraIndex()).bySlug.get(slug);
}

/** Like findDemoById, but also resolves the industry sections' extra demos. */
export async function resolveDemoById(templateId: string): Promise<VideoDemo | undefined> {
  return findDemoById(templateId) ?? (await loadExtraIndex()).byId.get(templateId);
}
