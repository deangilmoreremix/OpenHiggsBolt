import React from 'react';
import { Composition } from 'remotion';
import { HERO_DURATION, HERO_FPS, HeroConverge } from './HeroConverge';

export const Root: React.FC = () => (
  <Composition id="HeroConverge" component={HeroConverge} durationInFrames={HERO_DURATION} fps={HERO_FPS} width={1920} height={1080} />
);
