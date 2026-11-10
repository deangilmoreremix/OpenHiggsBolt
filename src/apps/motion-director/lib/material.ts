import type { SiteCapture } from './directorClient';
import type { MediaAttachment } from './mediaUpload';
import type { Material } from './productBrief';
import { captureQuality } from './captureQuality';
import { layoutFromCapture } from './customerLayout';

/** What material is actually in hand for a film: the site capture (only if it screenshotted pages), uploads, brand and words. */
export function materialOf(capture: SiteCapture | null | undefined, media: readonly MediaAttachment[], opts: { brandLogo?: boolean } = {}): Material {
  const complete = captureQuality(capture) === 'complete';
  const lay = complete && capture ? layoutFromCapture(capture) : null;
  const c = capture?.content;
  return {
    pages: complete ? capture?.pages?.length || 1 : 0,
    cards: lay?.cards ?? 0,
    images: media.filter((m) => m.kind === 'image').length + (capture?.assets?.length ?? 0),
    videos: media.filter((m) => m.kind === 'video').length,
    logo: Boolean(capture?.logo || opts.brandLogo),
    textLines: [c?.headline, c?.description, ...(c?.headings ?? []), ...(c?.nav ?? []), ...(c?.ctas ?? [])].filter(Boolean).length,
    documentBlocks: (c?.headings?.length ?? 0) + (c?.description ? 1 : 0) + (c?.headline ? 1 : 0),
    music: media.some((m) => m.kind === 'audio'),
    parts: lay?.layout.source?.mapped ?? [],
  };
}
