// The landing page's industry demos, served from the generated file so the
// page doesn't bundle every demo catalog. The mapping itself lives in
// nicheDemoSource.ts; regenerate with `npm run generate:niche-demos`.
import { type VideoDemo } from './types';
import { NICHE_DEMOS } from './nicheDemos.generated';

/** Get up to 30 demos for a given niche slug. */
export function getDemosForNiche(nicheId: string): VideoDemo[] {
  return NICHE_DEMOS[nicheId] ?? [];
}

export const NICHE_IDS = Object.keys(NICHE_DEMOS);
