'use client';

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { setBrand } from '../demosrc/_fixtures/Brand';
import { CARDS } from '../cards/registry';
import { cardFps, cardSize } from '../cards/types';
import { themedProps } from '../theme';
import { MANIFEST } from '../cards/projectCards';
import { MOTION_CATEGORIES, motionCardId, type MotionTemplate } from '@/data/motionRecipeCatalog';

const CATEGORY_LABEL_EN = Object.fromEntries(MOTION_CATEGORIES.map((c) => [c.key, c.labelEn]));

/**
 * Recipe thumbnail for the template picker.
 *
 * `playing` mounts a live Remotion `<Player>` of the recipe's own card — the
 * same component the timeline renders. Callers pass `playing` for one recipe
 * at a time (hovered or selected); every other tile shows the upstream poster,
 * or a category tile when upstream has no poster, so the grid never mounts
 * more than one Player.
 */
export function RecipePreview({ recipe, playing }: { recipe: MotionTemplate; playing: boolean }) {
  const card = CARDS[motionCardId(recipe)];
  const [posterBroken, setPosterBroken] = useState(false);
  const live = playing && card && card.kind !== 'audio';
  // Picker previews always show the recipe as designed, never a company film's brand.
  if (live) setBrand(null);

  return (
    <div
      className="relative w-full aspect-video rounded-lg overflow-hidden"
      style={{ background: '#000', border: '1px solid var(--border-color)' }}
      data-recipe-preview={live ? 'player' : 'poster'}
    >
      {/* The still layer stays mounted under the player: swapping the node under
          the pointer would fire a spurious mouseleave (killing the hover preview)
          and swallow a click that started on it. */}
      {recipe.poster && !posterBroken ? (
        <img
          src={recipe.poster}
          alt=""
          loading="lazy"
          onError={() => setPosterBroken(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.18), transparent 60%), var(--bg-card)' }}>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#60a5fa' }}>
            {CATEGORY_LABEL_EN[recipe.category] ?? recipe.category}
          </span>
          {card && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Hover to preview</span>}
        </div>
      )}
      {live && (
        <div className="absolute inset-0" style={{ background: '#000', pointerEvents: 'none' }}>
          <Player
            component={card.component}
            inputProps={themedProps(MANIFEST, card, undefined, {}, undefined)}
            durationInFrames={Math.max(2, card.durationInFrames)}
            compositionWidth={cardSize(card).width}
            compositionHeight={cardSize(card).height}
            fps={cardFps(card)}
            autoPlay
            loop
            controls={false}
            clickToPlay={false}
            initiallyMuted
            numberOfSharedAudioTags={0}
            acknowledgeRemotionLicense
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}
      {!live && card && (
        <span className="absolute bottom-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.7)' }}>
          ▶ {recipe.durationSec ? `${recipe.durationSec}s` : 'Preview'}
        </span>
      )}
    </div>
  );
}

export default RecipePreview;
