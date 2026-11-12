'use client';

import React from 'react';

const CROPS = [
  { id: 'youtube', label: 'YouTube', ratio: '16 / 9', width: 128 },
  { id: 'square', label: 'Instagram 1:1', ratio: '1 / 1', width: 72 },
  { id: 'portrait', label: 'IG/FB 4:5', ratio: '4 / 5', width: 58 },
  { id: 'reels', label: 'Reels / TikTok', ratio: '9 / 16', width: 42 },
] as const;

/** Shows how the chosen image crops on each platform's thumbnail/cover size. */
export default function ThumbnailPlatformPreview({ imageUrl }: { imageUrl: string }) {
  return (
    <div data-testid="thumbnail-platform-preview" className="flex items-end gap-3 flex-wrap">
      {CROPS.map((c) => (
        <figure key={c.id} className="m-0">
          <div className="overflow-hidden rounded-md border border-white/10" style={{ width: c.width, aspectRatio: c.ratio }}>
            <img src={imageUrl} alt={`${c.label} crop preview`} className="w-full h-full object-cover" />
          </div>
          <figcaption className="mt-1 text-[9px] text-white/35 text-center">{c.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
