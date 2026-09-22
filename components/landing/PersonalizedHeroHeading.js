'use client';

import AnimatedHeadline from './AnimatedHeadline';
import {
  HERO_ANIMATED_CREATION_TYPES,
  HERO_CREATION_PHRASE_INTERVAL_MS,
  HERO_PHRASE_TRANSITION_MS,
} from './heroConstants';

const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function PersonalizedHeroHeading() {
  const shared = (
    <h1 className="landing-gradient-text text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
      Turn Any Local Business Into
      <br className="hidden sm:inline" />
      <span className="mt-2 inline-block">
        <AnimatedHeadline
          phrases={HERO_ANIMATED_CREATION_TYPES}
          interval={HERO_CREATION_PHRASE_INTERVAL_MS}
          transition={HERO_PHRASE_TRANSITION_MS}
          className="text-5xl md:text-7xl lg:text-8xl"
        />
      </span>
    </h1>
  );

  if (!isClerkEnabled) {
    return shared;
  }

  const { isSignedIn, isLoaded, user } = useUser();

  if (!isLoaded || !isSignedIn) {
    return shared;
  }

  const firstName =
    user?.firstName?.trim() ||
    user?.username?.split(/[_\-.\s]/)[0] ||
    'there';

  return (
    <h1 className="landing-gradient-text text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
      Turn Any Local Business Into
      <br className="hidden sm:inline" />
      <span className="mt-2 inline-block">
        <AnimatedHeadline
          phrases={HERO_ANIMATED_CREATION_TYPES}
          interval={HERO_CREATION_PHRASE_INTERVAL_MS}
          transition={HERO_PHRASE_TRANSITION_MS}
          className="text-5xl md:text-7xl lg:text-8xl"
        />
      </span>
    </h1>
  );
}
