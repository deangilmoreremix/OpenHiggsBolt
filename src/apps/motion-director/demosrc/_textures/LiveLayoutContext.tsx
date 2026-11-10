import { createContext, use } from 'react';
import sample from './live-layout.json';

/**
 * The geometry of the page a screenshot recipe is drawn on: where its cards, rows and sections are, in page CSS px on a
 * 1920-wide stage (the screenshots are 2x and drawn at width 1920, so pictures and coordinates share one system).
 *
 * The recipes were tuned on upstream's sample product ("live"), whose layout is `live-layout.json`. A clip of a real
 * site provides that site's layout in the SAME SHAPE (lib/customerLayout), and a recipe reads it through
 * `useLiveLayout()` while it renders. Without one it gets the sample, so an unpersonalised recipe is unchanged.
 */
export type LiveLayout = typeof sample & {
  projects: (typeof sample)['projects'] & { main?: number; bg?: string };
  /** Set by lib/customerLayout: which parts of this layout come from the customer's real page. */
  source?: { mapped: string[]; sample: string[] };
};

export const SAMPLE_LAYOUT = sample as LiveLayout;

export const LiveLayoutContext = createContext<LiveLayout | null>(null);

/** The layout of the clip's own page, or the sample's. Call during render. */
export function useLiveLayout(): LiveLayout {
  return use(LiveLayoutContext) ?? SAMPLE_LAYOUT;
}

/** True when the clip carries a real page's layout (not the sample's). */
export function useHasCustomerLayout(): boolean {
  return use(LiveLayoutContext) !== null;
}
