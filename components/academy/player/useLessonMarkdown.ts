'use client';

import React from 'react';

/** Fetches one lesson's markdown from the public Academy content API. */
export function useLessonMarkdown(track: string, slug: string) {
  const [md, setMd] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMd(null);
    fetch(`/api/academy/content?track=${encodeURIComponent(track)}&slug=${encodeURIComponent(slug)}&kind=lesson`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setMd(d.markdown ?? '');
      })
      .catch(() => !cancelled && setMd('Failed to load content.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [track, slug]);
  return { md, loading };
}
