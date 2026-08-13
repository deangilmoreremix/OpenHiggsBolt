'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AcademyCard, Pill, cx } from './primitives';
import type { AcademyAsset } from '@/data/academyAssets';

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
        className="group relative block w-full overflow-hidden rounded-xl border border-white/10 bg-black/40 text-left"
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
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-[#0a0a0a] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">{asset.title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10"
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
            <p className="mt-3 text-sm leading-relaxed text-white/70">{asset.description}</p>
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
    <p className="mb-3 text-sm leading-relaxed text-white/75" {...p} />
  ),
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-white/75" {...p} />
  ),
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-white/75" {...p} />
  ),
  blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="mb-3 border-l-2 border-[#22d3ee]/50 bg-white/5 px-3 py-2 text-sm text-white/70" {...p} />
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
    <th className="border border-white/10 bg-white/5 px-2 py-1.5 font-semibold text-white/80" {...p} />
  ),
  td: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border border-white/10 px-2 py-1.5 text-white/70" {...p} />
  ),
  code: (p: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[12px] text-[#c4b5fd]" {...p} />
  ),
};

export function LessonViewer({ markdown }: { markdown: string }) {
  return (
    <div className={cx('text-white')}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {stripCourseNav(markdown)}
      </ReactMarkdown>
    </div>
  );
}

/** Remove intra-repo navigation links so the imported lesson reads standalone. */
function stripCourseNav(md: string): string {
  return md
    .replace(/\[←[^\]]*\]\([^)]*\)/g, '')
    .replace(/\n\s*Next:.*$/gm, '')
    .replace(/\n\s*\[Track overview\].*$/gm, '')
    .replace(/\[`templates\/[^]]*`\]\([^)]*\)/g, '$1')
    .replace(/\[Module \d+[^\]]*\]\([^)]*\)/g, (_m, _g) => _m.replace(/\[([^\]]*)\]\([^)]*\)/, '$1'));
}

export { AcademyCard };
