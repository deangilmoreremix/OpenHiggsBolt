// Studio-to-demo mapping for the landing page.
//
// Groups every known VideoDemo by its `studioTab` so the landing page can
// render a per-studio showcase section. Studios with no demos get an empty
// array so UI can fall back to a placeholder.
//
// Source of truth for valid studio tabs:
//   - components/landing/landingData.js FEATURES ids
//   - components/StandaloneShell.js TABS ids

import { type VideoDemo } from './types';
import { MINIMAX_H3_DEMOS } from './minimaxH3Demos';
import { SEEDANCE_25_DEMOS } from './seedance25Demos';
import { SEEDANCE_1_DEMOS } from './seedance1Demos';
import { PROMPTFEED_DEMOS } from './promptFeedDemos';

// seedancePromptsDemos is currently empty (HuyLe82US videos were unavailable)
import { SEEDANCE_PROMPTS_DEMOS } from './seedancePromptsDemos';

const ALL_DEMOS: VideoDemo[] = [
  ...MINIMAX_H3_DEMOS,
  ...SEEDANCE_25_DEMOS,
  ...SEEDANCE_1_DEMOS,
  ...SEEDANCE_PROMPTS_DEMOS,
  ...PROMPTFEED_DEMOS,
];

/** All studio tabs that have at least one demo assigned. */
export const STUDIOS_WITH_DEMOS = Array.from(
  new Set(ALL_DEMOS.map((d) => d.studioTab).filter(Boolean))
).sort();

/** All known studio tabs from landingData + StandaloneShell. */
export const ALL_KNOWN_STUDIO_TABS = [
  // landingData FEATURES (18)
  'image',
  'video',
  'audio',
  'clipping',
  'vibe-motion',
  'lipsync',
  'cinema',
  'storyboard',
  'marketing',
  'recast',
  'workflows',
  'agents',
  'design-agent',
  'vfx-studio',
  'thumbnail-studio',
  'ai-influencer',
  'social-publishing',
  'go-ai-viral',
  // additional tabs in StandaloneShell not in landingData FEATURES
  'music-studio',
  'scene-planner',
  'apps',
];

/** Demo count per studio tab across all repos. */
export const STUDIO_DEMO_COUNTS: Record<string, number> = {};
for (const demo of ALL_DEMOS) {
  const tab = demo.studioTab || 'video';
  STUDIO_DEMO_COUNTS[tab] = (STUDIO_DEMO_COUNTS[tab] || 0) + 1;
}

/** Grouped demos by studio tab. Studios with no demos return []. */
export const DEMOS_BY_STUDIO: Record<string, VideoDemo[]> = {};
for (const demo of ALL_DEMOS) {
  const tab = demo.studioTab || 'video';
  if (!DEMOS_BY_STUDIO[tab]) {
    DEMOS_BY_STUDIO[tab] = [];
  }
  DEMOS_BY_STUDIO[tab].push(demo);
}

/** Get demos for a specific studio tab. Returns [] if none exist. */
export function getDemosForStudio(studioTab: string): VideoDemo[] {
  return DEMOS_BY_STUDIO[studioTab] || [];
}

/** Get the best demo for a studio (first featured, then hero, then first). */
export function getBestDemoForStudio(studioTab: string): VideoDemo | undefined {
  const demos = DEMOS_BY_STUDIO[studioTab] || [];
  if (!demos.length) return undefined;
  return (
    demos.find((d) => d.featured) ||
    demos.find((d) => d.hero) ||
    demos[0]
  );
}

/** Audit report: which studios have demos and which don't. */
export function getStudioCoverageReport() {
  return ALL_KNOWN_STUDIO_TABS.map((tab) => ({
    tab,
    count: STUDIO_DEMO_COUNTS[tab] || 0,
    hasDemos: (STUDIO_DEMO_COUNTS[tab] || 0) > 0,
  }));
}
