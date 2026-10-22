'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import AnimatedHeadline from './AnimatedHeadline';
import AnimatedLine from './AnimatedLine';
import Magnetic from './fx/Magnetic';
import DesktopOnly3D from './fx/DesktopOnly3D';
import { gsap, SplitText, MOTION_OK, DESKTOP_MOTION } from './fx/gsap';
import {
  HERO_ANIMATED_CREATION_TYPES,
  HERO_AUDIENCE_PHRASES,
  HERO_BUSINESS_TYPE_PHRASES,
  HERO_WORKFLOW_STEPS,
  HERO_CREATION_PHRASE_INTERVAL_MS,
  HERO_AUDIENCE_PHRASE_INTERVAL_MS,
  HERO_BUSINESS_TYPE_PHRASE_INTERVAL_MS,
  HERO_PHRASE_TRANSITION_MS,
} from './heroConstants';

// Runs before paint on the client; falls back to a no-op during SSR.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : () => {};

/**
 * Hero. Same copy and links as before, enhanced with:
 * - GSAP SplitText: the headline rises line by line behind a mask.
 * - GSAP timeline: the supporting copy, offer card and workflow chips stagger in.
 * - GSAP ScrollTrigger (desktop): the content drifts up and fades as you scroll on.
 * - React Three Fiber + Drei (desktop): holographic demo panes behind the copy.
 * - Motion: magnetic, springy CTAs.
 *
 * Content is hidden by the `hero-pending` class until the entrance starts;
 * a CSS fallback reveals it after 2.5s if JavaScript never runs.
 */
export default function HeroSection() {
  const rootRef = useRef(null);
  const contentRef = useRef(null);
  const headlineRef = useRef(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      // Drop the pre-hydration hide first so gsap.from() reads the real
      // resting styles as its end values. This all runs before paint.
      root.classList.remove('hero-pending');
      const headline = headlineRef.current;
      // Give each split line its own gradient: transforms on children of a
      // background-clip:text element would otherwise render them invisible.
      headline.classList.remove('landing-gradient-text');
      const split = SplitText.create(headline, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'landing-gradient-text',
      });

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onComplete: () => {
          split.revert();
          headline.classList.add('landing-gradient-text');
        },
      });
      tl.from(root.querySelector('[data-hero-pill]'), { y: 16, opacity: 0, duration: 0.9 })
        .from(split.lines, { yPercent: 115, duration: 1.3, stagger: 0.12 }, '<0.1')
        .from(root.querySelector('[data-hero-rotator]'), { yPercent: 40, opacity: 0, filter: 'blur(10px)', duration: 1.2 }, '<0.35')
        .from(root.querySelectorAll('[data-hero-reveal]'), { y: 26, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, '<0.25')
        .from(root.querySelectorAll('[data-hero-step]'), { y: 12, opacity: 0, scale: 0.9, duration: 0.6, stagger: 0.05, ease: 'back.out(2)' }, '<0.3');

      return () => {
        tl.kill();
        split.revert();
        headline.classList.add('landing-gradient-text');
      };
    });

    mm.add(DESKTOP_MOTION, () => {
      gsap.to(contentRef.current, {
        yPercent: -12,
        opacity: 0.25,
        scale: 0.97,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    // Reduced motion: show everything immediately.
    mm.add('(prefers-reduced-motion: reduce)', () => {
      root.classList.remove('hero-pending');
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={rootRef} className="hero-pending relative isolate mx-auto max-w-7xl px-6 pb-20 pt-20 md:pb-32 md:pt-28">
      <div className="landing-orb" style={{ left: '-6rem', top: '6rem', height: '18rem', width: '18rem', background: '#22d3ee' }} aria-hidden="true" />
      <div className="landing-orb" style={{ right: 0, top: '10rem', height: '24rem', width: '24rem', background: '#a855f7' }} aria-hidden="true" />
      <DesktopOnly3D scene="hero" fullBleed className="-z-10 opacity-90 [mask-image:radial-gradient(ellipse_40%_50%_at_50%_42%,rgba(0,0,0,0.15)_30%,black_85%)]" />

      <div ref={contentRef} className="relative mx-auto max-w-4xl text-center">
        <p data-hero-pill className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-cyan-200">
          Every output is personalized to your brand and style
        </p>

        <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
          <span ref={headlineRef} className="landing-gradient-text" style={{ textWrap: 'balance' }}>Turn Any Local Business Into</span>
          <br className="hidden sm:inline" />
          <span data-hero-rotator className="mt-2 inline-block">
            <AnimatedHeadline
              phrases={HERO_ANIMATED_CREATION_TYPES}
              interval={HERO_CREATION_PHRASE_INTERVAL_MS}
              transition={HERO_PHRASE_TRANSITION_MS}
              className="text-5xl md:text-7xl lg:text-8xl"
            />
          </span>
        </h1>

        <p data-hero-reveal className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65 md:text-xl" style={{ textWrap: 'balance' }}>
          Find the business. Find their photos. Fix their assets. Personalize viral campaigns. Create content built specifically for them.
        </p>

        {/* min-height reserves two lines so the rotating words don't shift the page */}
        <div data-hero-reveal className="mt-4 min-h-[3.5rem]">
          <AnimatedLine
            text="SmartVideo GO gives [ANIMATED] an entire AI content production system for serving [ANIMATED]."
            words={[
              { phrases: HERO_AUDIENCE_PHRASES, interval: HERO_AUDIENCE_PHRASE_INTERVAL_MS },
              { phrases: HERO_BUSINESS_TYPE_PHRASES, interval: HERO_BUSINESS_TYPE_PHRASE_INTERVAL_MS },
            ]}
            interval={3000}
            transition={HERO_PHRASE_TRANSITION_MS}
            className="text-lg font-semibold text-white md:text-xl"
          />
        </div>

        <div data-hero-reveal className="mx-auto mt-6 max-w-2xl space-y-3 text-center text-base leading-7 text-white/60">
          <p>Enter a website — or discover a business.</p>
          <p>
            SmartVideo GO can find the business&apos;s:{' '}
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-cyan-200">
              <span>Branding</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>Photos</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>Products</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>Services</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>People</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>Offers</span>
            </span>
          </p>
          <p>Clean up their assets, personalize their content, and turn everything into videos, ads, graphics and social media content using 20+ AI Studios.</p>
        </div>

        <div data-hero-reveal className="hero-offer mx-auto mt-8 max-w-2xl rounded-3xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6 text-center backdrop-blur-sm">
          <p className="text-lg font-semibold text-white md:text-xl">
            Plus, with GO AI Viral, you can take viral video and image campaign concepts and personalize them for a specific business, product, service or niche.
          </p>
          <p className="mt-2 text-white/60">
            Turn what&apos;s already getting attention into branded campaigns built around the actual business you&apos;re promoting.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetic className="w-full sm:w-auto">
              <Link
                href="/studio/go-ai-viral"
                className="fx-shine w-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-400/40 sm:w-auto"
              >
                Personalize a Business
              </Link>
            </Magnetic>
            <Magnetic className="w-full sm:w-auto">
              <Link
                href="/studio/go-ai-viral"
                className="w-full rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.08] sm:w-auto"
              >
                Explore GO AI Viral
              </Link>
            </Magnetic>
          </div>
        </div>

        <div data-hero-reveal className="mx-auto mt-10 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/35">Workflow</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-white/75">
            {HERO_WORKFLOW_STEPS.map((step, i) => (
              <span key={step} data-hero-step className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{step}</span>
                {i < HERO_WORKFLOW_STEPS.length - 1 && (
                  <span aria-hidden="true" className="hidden text-white/25 sm:inline">
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
