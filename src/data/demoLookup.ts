import { MINIMAX_H3_DEMOS } from './minimaxH3Demos';
import { SEEDANCE_25_DEMOS } from './seedance25Demos';
import { SEEDANCE_1_DEMOS } from './seedance1Demos';
import { PROMPTFEED_DEMOS } from './promptFeedDemos';
import { type VideoDemo } from './types';
import { DEMO_LIBRARY_REGISTRY, toVideoDemo } from './demoLibraryRegistry';

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

// The template-library clips (hosted in the demo-template-videos bucket) are not in the catalogs above, but step 2 offers them and
// `/studio?template={sourceRepo}|{slug}` and `/demo/{slug}` resolve through this index. Index them too so those links never open empty.
for (const entry of DEMO_LIBRARY_REGISTRY) {
  const demo = toVideoDemo(entry);
  const key = `${demo.sourceRepo}|${demo.slug}`;
  if (!DEMO_INDEX.has(key)) DEMO_INDEX.set(key, demo);
  if (demo.slug && !DEMO_SLUG_INDEX.has(demo.slug)) DEMO_SLUG_INDEX.set(demo.slug, demo);
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
