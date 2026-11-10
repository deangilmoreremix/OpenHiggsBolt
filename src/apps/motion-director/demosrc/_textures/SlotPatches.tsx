import React from 'react';
import type { LiveLayout } from './LiveLayoutContext';

/**
 * A recipe that lifts, hides or replaces the cards of a page needs the page WITHOUT them beneath (the "empty plate").
 * A real capture provides one when it could hide the cards; when it could not, the plate texture is not set and the recipe
 * would show the sample's. This paints each card's slot in the page's own background colour over the captured page, so
 * no second copy of a card shows beneath the card that moves. Callers draw it only for a customer's layout whose capture
 * has no real plate.
 */
export const SlotPatches: React.FC<{ layout: LiveLayout; fallbackBg?: string; pad?: number }> = ({ layout, fallbackBg = '#f9f6f1', pad = 2 }) => (
  <>
    {layout.projects.cards.map((c, i) => (
      <div key={`slot-${i}`} style={{ position: 'absolute', left: c.x - pad, top: c.y - pad, width: c.w + pad * 2, height: c.h + pad * 2, background: layout.projects.bg ?? fallbackBg }} />
    ))}
  </>
);
