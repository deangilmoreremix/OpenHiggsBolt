import type { SiteCapture } from './directorClient';
import type { MediaAttachment } from './mediaUpload';
import type { Material } from './productBrief';
import { captureQuality } from './captureQuality';
import { layoutFromCapture } from './customerLayout';
import { documentBlockCount, documentFromCapture, documentFromText, isDocumentUsable } from './documentContent';

/** What material is actually in hand for a film: the site capture (only if it screenshotted pages), uploads, brand and words. */
export function materialOf(capture: SiteCapture | null | undefined, media: readonly MediaAttachment[], opts: { brandLogo?: boolean; prompt?: string | null } = {}): Material {
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
    // The site's words, else the person's own text: the same source the build feeds DocumentTypewriterReveal.
    documentBlocks: documentBlockCount([documentFromCapture(c), documentFromText(opts.prompt)].find((d) => isDocumentUsable(d)) ?? documentFromCapture(c) ?? { title: '', sections: [], sideLeft: [], sideRight: [], history: [], meta: {} }),
    music: media.some((m) => m.kind === 'audio'),
    parts: lay?.layout.source?.mapped ?? [],
  };
}
