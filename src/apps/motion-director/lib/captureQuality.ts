import type { SiteCapture } from './directorClient';

/**
 * What a site capture amounts to, in one place, so nothing claims "your site" when it did not happen.
 *  - complete: the page was screenshotted, so the film can show the site's own pages.
 *  - partial: only the site's words and colours came back (the page was too slow to screenshot).
 *  - failed: nothing came back (or no capture was attempted).
 */
export type CaptureQuality = 'complete' | 'partial' | 'failed';

export const captureQuality = (capture: Pick<SiteCapture, 'partial' | 'page'> | null | undefined): CaptureQuality => {
  if (!capture) return 'failed';
  if (capture.partial || !capture.page?.url) return 'partial';
  return 'complete';
};

/** True only for a capture that put the site's pages in the film. */
export const personalisesWithSite = (capture: Pick<SiteCapture, 'partial' | 'page'> | null | undefined): boolean => captureQuality(capture) === 'complete';
