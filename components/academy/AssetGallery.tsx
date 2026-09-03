'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AcademyCard, Pill, cx } from './primitives';
import type { AcademyAsset } from '@/data/academyAssets';
import { panels, buttons, semantic } from '@/shared/styles/designTokens';

/* ------------------------------------------------------------------ */
/* Asset gallery — the "SEE" step                                      */
/* ------------------------------------------------------------------ */

function AssetTile({ asset }: { asset: AcademyAsset }) {
  const [open, setOpen] = React.useState(false);
  const poster = asset.thumbnail || asset.src || asset.gifSrc;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-xl text-left"
        style={panels.card}
      >
        {asset.type === 'video' && asset.gifSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.gifSrc} alt={asset.title} className="aspect-[9/16] w-full object-cover" />
        ) : poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt={asset.title} className="aspect-[9/16] w-full object-cover" />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
          <span className="block text-xs font-semibold text-white">{asset.title}</span>
          <Pill tone={asset.type === 'video' ? 'primary' : 'default'}>{asset.type}</Pill>
        </div>
        {asset.requiresProvenanceReview && (
          <span className="absolute right-2 top-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            review
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl p-5"
            style={panels.card}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">{asset.title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-xs hover:bg-white/10"
                style={buttons.ghost}
              >
                Close
              </button>
            </div>
            <div className="flex justify-center rounded-xl bg-black/50 p-3">
              {asset.videoSrc ? (
                <video src={asset.videoSrc} poster={asset.gifSrc} controls className="max-h-[60vh] rounded-lg" />
              ) : poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster} alt={asset.title} className="max-h-[60vh] rounded-lg" />
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: semantic.textPrimary }}>{asset.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {asset.tags.map((t) => (
                <Pill key={t}>#{t}</Pill>
              ))}
            </div>
            {asset.requiresProvenanceReview && (
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[12px] text-amber-300">
                Provenance review: depicts a real-brand example asset. Confirm usage rights before reuse in paid client work.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function AssetGallery({ assets }: { assets: AcademyAsset[] }) {
  if (!assets.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {assets.map((a) => (
        <AssetTile key={a.id} asset={a} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson viewer — the "LEARN" step                                    */
/* ------------------------------------------------------------------ */

const mdComponents = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-3 mt-6 text-2xl font-extrabold text-white first:mt-0" {...p} />
  ),
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-2 mt-6 text-xl font-bold text-white" {...p} />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-2 mt-4 text-base font-bold text-[#22d3ee]" {...p} />
  ),
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-3 text-sm leading-relaxed" style={{ color: semantic.textPrimary }} {...p} />
  ),
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm" style={{ color: semantic.textPrimary }} {...p} />
  ),
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm" style={{ color: semantic.textPrimary }} {...p} />
  ),
  blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="mb-3 border-l-2 border-[#22d3ee]/50 bg-white/5 px-3 py-2 text-sm" style={{ color: semantic.textPrimary }} {...p} />
  ),
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-[#22d3ee] underline-offset-2 hover:underline" target="_blank" rel="noreferrer" {...p} />
  ),
  table: (p: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs" {...p} />
    </div>
  ),
  th: (p: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="border px-2 py-1.5 font-semibold" style={{ borderColor: 'var(--border-color)', background: 'var(--glass-bg)', color: semantic.textPrimary }} {...p} />
  ),
  td: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border px-2 py-1.5" style={{ borderColor: 'var(--border-color)', color: semantic.textPrimary }} {...p} />
  ),
  code: (p: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded px-1 py-0.5 font-mono text-[12px] text-[#c4b5fd]" {...p} />
  ),
};

export function LessonViewer({ markdown, track }: { markdown: string; track?: string }) {
  const processed = React.useMemo(() => {
    const withNav = stripCourseNav(markdown);
    return track ? resolveMediaPaths(withNav, track) : withNav;
  }, [markdown, track]);

  return (
    <div className={cx('text-white')}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}

/** Rewrite upstream-relative media paths to absolute public paths. */
function resolveMediaPaths(md: string, track: string): string {
  if (track === 'ugc') {
    // UGC assets live under /academy/ugc/{gifs,videos,images}
    return md.replace(
      /(src|href)="templates\/examples\/([^"]+)"/g,
      (_match, attr, file) => {
        const ext = file.split('.').pop()?.toLowerCase();
        let subdir = 'images';
        if (ext === 'gif') subdir = 'gifs';
        else if (['mp4', 'webm', 'mov'].includes(ext || '')) subdir = 'videos';
        else if (['mp3', 'wav', 'ogg'].includes(ext || '')) subdir = 'audio';
        return `${attr}="/academy/ugc/${subdir}/${file}"`;
      }
    );
  }

  // All other tracks publish media under /academy/<track>/templates/examples/
  return md.replace(
    /(src|href)="templates\/examples\/([^"]+)"/g,
    (_match, attr, file) => `${attr}="/academy/${track}/templates/examples/${file}"`
  );
}

/** Remove intra-repo navigation links so the imported lesson reads standalone. */
function stripCourseNav(md: string): string {
  return md
    // Remove entire navigation lines (← prev, Next:, Track overview/Overview)
    .replace(/^.*?(?:←|Next:|Track\s+overview|Track\s+Overview).*$/gm, '')
    // Replace [`file.md`](file.md) with just the filename
    .replace(/\[`([^`]+)`\]\([^)]*\)/g, '$1')
    // Replace [ROADMAP.md](../../ROADMAP.md) with plain text
    .replace(/\[ROADMAP\.md\]\(\.\.\/\.\/ROADMAP\.md\)/g, 'ROADMAP.md')
    // Replace [Module N: ...](...) with just the text
    .replace(/\[Module \d+[^\]]*\]\([^)]*\)/g, (_m) => _m.replace(/\[([^\]]*)\]\([^)]*\)/, '$1'))
    // Replace any remaining [text](N-slug.md) or [text](../N-slug.md) with just text
    .replace(/\[([^\]]+)\]\([^)]*\.md\)/g, '$1')
    // Remove Prerequisites lines
    .replace(/\*\*Prerequisites:\*\*.*$/gm, '');
}

export { AcademyCard };
