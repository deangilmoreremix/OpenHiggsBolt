'use client';

// Remotion composition for the Zack D final cut: clips joined by short transitions, impact-zoom
// shots punched in slightly, narration with music ducked underneath. Rendered in the browser by
// @remotion/web-renderer (see finalCut.js) and previewable with @remotion/player.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { iris } from '@remotion/transitions/iris';
import { Video, Audio } from '@remotion/media';
import { toPlayablePreviewMediaUrl } from '@/shared/personalization/preview/remoteMedia';
import { MUSIC_VOLUME } from './finalCutPlan.js';

// Mirrors the upstream default sequence: fade -> wipeleft -> slideleft -> circleopen.
const PRESENTATIONS = [
  () => fade(),
  () => wipe({ direction: 'from-right' }),
  () => slide({ direction: 'from-right' }),
  () => iris({ width: 720, height: 1280 }),
];

export function ZackDComposition({ clips = [], narrationUrl = null, musicUrl = null, transitionFrames = 10, keepClipAudio = false, clipVolume = 1 }) {
  const items = [];
  clips.forEach((clip, i) => {
    items.push(
      <TransitionSeries.Sequence key={`c-${i}`} durationInFrames={clip.frames}>
        <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
          <Video
            src={toPlayablePreviewMediaUrl(clip.src)}
            // The clips' own (Veo) sound is kept by default; @remotion/media <Video> audio survives the web export.
            muted={!keepClipAudio}
            volume={clipVolume}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: clip.zoom ? 'scale(1.05)' : undefined }}
          />
        </AbsoluteFill>
      </TransitionSeries.Sequence>,
    );
    if (i < clips.length - 1 && transitionFrames > 0) {
      items.push(
        <TransitionSeries.Transition
          key={`t-${i}`}
          presentation={PRESENTATIONS[i % PRESENTATIONS.length]()}
          timing={linearTiming({ durationInFrames: transitionFrames })}
        />,
      );
    }
  });
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <TransitionSeries>{items}</TransitionSeries>
      {narrationUrl ? <Audio src={toPlayablePreviewMediaUrl(narrationUrl)} /> : null}
      {musicUrl ? <Audio src={toPlayablePreviewMediaUrl(musicUrl)} volume={MUSIC_VOLUME} loop /> : null}
    </AbsoluteFill>
  );
}

export default ZackDComposition;
