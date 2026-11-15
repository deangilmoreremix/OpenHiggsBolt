'use client';

import React from 'react';
import { colors } from '@/shared/styles/designTokens';

/**
 * Renders plain text where `backtick spans` become <code>. Text is never
 * interpreted as HTML or markdown, so course content cannot inject markup.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') && p.length > 2 ? (
          <code
            key={i}
            className="rounded px-1 py-0.5 font-mono text-[0.85em]"
            style={{ background: 'rgba(34,211,238,0.08)', color: colors.primary }}
          >
            {p.slice(1, -1)}
          </code>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}
