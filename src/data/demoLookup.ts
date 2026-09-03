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
for (const demo of ALL_DEMOS) {
  const key = `${demo.sourceRepo}|${demo.slug}`;
  DEMO_INDEX.set(key, demo);
}

export function findDemoById(templateId: string): VideoDemo | undefined {
  return DEMO_INDEX.get(templateId);
}

export function parseTemplateId(templateId: string): { sourceRepo: string; slug: string } | undefined {
  const idx = templateId.indexOf('|');
  if (idx === -1) return undefined;
  const sourceRepo = templateId.slice(0, idx);
  const slug = templateId.slice(idx + 1);
  if (!sourceRepo || !slug) return undefined;
  return { sourceRepo, slug };
}
