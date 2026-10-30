'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import StandaloneShell from '@/components/StandaloneShell';
import { PRODUCT_NAME, TESTIMONIALS, PRICING, FAQS } from './landingData';
import PersonalizedHeroHeading from './PersonalizedHeroHeading';
import HeroSection from './HeroSection';
import LandingNav from './LandingNav';
import TrustStrip from './TrustStrip';
import WorkflowStory from './WorkflowStory';
import StudioFrame from './StudioFrame';
import FaqAccordion from './FaqAccordion';
import TestimonialCarousel from './TestimonialCarousel';
import SmoothScroll from './fx/SmoothScroll';
import ScrollFx from './fx/ScrollFx';
import Magnetic from './fx/Magnetic';
import TiltCard from './fx/TiltCard';
import CountUp from './fx/CountUp';
import DesktopOnly3D from './fx/DesktopOnly3D';
import { gsap, MOTION_OK } from './fx/gsap';
import { DemoPersonalizeProvider } from '@/shared/personalization';

const SmartVideoShowcase = dynamic(() => import('./SmartVideoShowcase'), {
  loading: () => (
    <div className="mx-auto max-w-7xl px-6 py-20 text-center">
      <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
      <p className="mt-4 text-sm text-white/50">Loading studio showcase…</p>
    </div>
  ),
  ssr: false,
});

function PricingBuyButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro_lifetime' }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Checkout failed');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="fx-shine inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-4 text-lg font-black text-black shadow-lg shadow-cyan-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            Redirecting to checkout…
          </>
        ) : (
          <>
            Buy Pro — $299
            <span className="text-sm font-semibold text-black/70">Lifetime access</span>
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function PricingCard({ plan }) {
  const listRef = useRef(null);
  const priceMatch = /^(\D*)(\d+)(.*)$/.exec(plan.price);

  // Stagger the feature list in as the card scrolls into view.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.from(list.children, {
        opacity: 0,
        y: 14,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.035,
        scrollTrigger: { trigger: list, start: 'top 88%', once: true },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <TiltCard max={4} className="mx-auto mt-12 max-w-2xl">
    <div className="landing-card fx-holo-border rounded-3xl p-9 text-center">
      <div className="flex items-center justify-center gap-3">
        <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
        {plan.badge && (
          <span className="rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 px-3 py-1 text-xs font-bold text-black">{plan.badge}</span>
        )}
      </div>
      <div className="mt-5 text-5xl font-black text-white">
        {priceMatch ? (
          <CountUp prefix={priceMatch[1]} value={Number(priceMatch[2])} suffix={priceMatch[3]} />
        ) : (
          plan.price
        )}
      </div>
      <p className="mt-4 text-base leading-7 text-white/55">{plan.description}</p>
      <ul ref={listRef} className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-left text-sm text-white/65 sm:grid-cols-3">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />{f}</li>
        ))}
      </ul>
      <PricingBuyButton />
      <p className="mt-4 text-xs text-white/40">
        One-time payment. No subscriptions. 30-day money-back guarantee.
      </p>
    </div>
    </TiltCard>
  );
}

export default function LandingPage({ FullStudio, AuthControls }) {
  return (
    <SmoothScroll>
    <ScrollFx />
    {/* overflow-x-clip (not overflow-hidden) so the sticky header keeps sticking. */}
    <main className="relative min-h-screen overflow-x-clip bg-black text-white">
      <div className="landing-noise" aria-hidden="true" />
      <div className="absolute inset-0 -z-10" style={{background:'radial-gradient(circle at top,rgba(34,211,238,0.12),transparent 28%),radial-gradient(circle at 80% 10%,rgba(168,85,247,0.10),transparent 30%),#050505'}} />

      {/* ── Nav ── */}
      <LandingNav AuthControls={AuthControls} />

      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Social proof strip ── */}
      <TrustStrip />

      {/* ── SmartVideo GO AI video showcase ── */}
      <DemoPersonalizeProvider>
        <SmartVideoShowcase />
      </DemoPersonalizeProvider>

      {/* ── Full studio ── */}
      <section id="studio" className="border-y border-white/10 bg-[#030303]">
        <div className="mx-auto max-w-7xl px-6 pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Full studio</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Every feature, live on this page.</h2>
            <p className="mt-5 text-lg leading-8 text-white/60">
              The complete studio — switch between any tool, generate with your key, and explore every function without leaving the landing page.
            </p>
          </div>
        </div>
        <StudioFrame>
          {FullStudio ? <FullStudio embedded initialTab="image" demoMode /> : <StandaloneShell embedded initialTab="image" demoMode />}
        </StudioFrame>
      </section>

      {/* ── Workflow ── */}
      <WorkflowStory />

      {/* ── Pricing ── */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Pricing</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">One plan. Every studio. Yours for life.</h2>
        </div>
        {PRICING.map((plan) => (
          <PricingCard key={plan.name} plan={plan} />
        ))}
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <TestimonialCarousel testimonials={TESTIMONIALS} />
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-center text-4xl font-black tracking-tight md:text-5xl">Questions before you launch?</h2>
        <FaqAccordion faqs={FAQS} />
      </section>

      {/* ── Final CTA ── */}
      <section className="relative isolate overflow-hidden border-y border-white/10 bg-white/[0.02]">
        <DesktopOnly3D scene="particles" className="-z-10" />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">Make the first demo feel like the full product.</h2>
          <p className="mt-5 text-lg leading-8 text-white/60">Visitors should understand the platform, try a feature, and know exactly where to go next.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Magnetic>
              <a href="#studio" className="fx-shine w-full rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90 sm:w-auto">Try the studio</a>
            </Magnetic>
            <Magnetic>
              <a href="#studio" className="w-full rounded-full border border-white/10 bg-transparent px-6 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08] sm:w-auto">Open full studio</a>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-white/40 md:flex-row md:items-center md:justify-between">
        <div>{PRODUCT_NAME} — premium AI image, video, and campaign studio. Made with SmartVideo GO AI</div>
        <div className="flex gap-5">
          <a href="#studio" className="hover:text-white">Studio</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </div>
      </footer>
    </main>
    </SmoothScroll>
  );
}
