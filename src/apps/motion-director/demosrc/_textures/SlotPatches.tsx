import React from 'react';
import { liveTexture } from '../_fixtures/liveTexture';
import { staticFile } from 'remotion';
import type { LiveLayout } from './LiveLayoutContext';

/**
 * A recipe that lifts, hides or replaces the cards of a page needs the page WITHOUT them beneath (the "empty plate").
 * A real capture provides one when it could hide the cards; when it could not, the plate texture is not set and the recipe
 * would show the sample's. This paints each card's slot in the page's own background colour over the captured page, so
 * no second copy of a card shows beneath the card that moves. It renders nothing for the sample's layout or when the
 * capture has a real plate.
 */
export const useNeedsSlotPatches = (layout: LiveLayout): boolean => {
  const plate = liveTexture('projects-empty.png');
  const isSample = plate === staticFile('motion-studio/textures/live/projects-empty.png');
  const customer = Boolean(layout.source?.mapped.includes('projects.cards'));
  return customer && (isSample || !layout.source?.mapped.includes('plate'));
};

export const SlotPatches: React.FC<{ layout: LiveLayout; fallbackBg?: string; pad?: number }> = ({ layout, fallbackBg = '#f9f6f1', pad = 2 }) => (
  <>
    {layout.projects.cards.map((c, i) => (
      <div key={`slot-${i}`} style={{ position: 'absolute', left: c.x - pad, top: c.y - pad, width: c.w + pad * 2, height: c.h + pad * 2, background: layout.projects.bg ?? fallbackBg }} />
    ))}
  </>
);
