'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import StandaloneShell from '@/components/StandaloneShell';
import { PRODUCT_NAME, NAV_ITEMS, LOGOS, TESTIMONIALS, PRICING, FAQS } from './landingData';
import PersonalizedHeroHeading from './PersonalizedHeroHeading';
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-4 text-lg font-black text-black shadow-lg shadow-cyan-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
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
  return (
    <div className="landing-card mx-auto mt-12 max-w-2xl rounded-3xl p-9 text-center">
      <div className="flex items-center justify-center gap-3">
        <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
        {plan.badge && (
          <span className="rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 px-3 py-1 text-xs font-bold text-black">{plan.badge}</span>
        )}
      </div>
      <div className="mt-5 text-5xl font-black text-white">{plan.price}</div>
      <p className="mt-4 text-base leading-7 text-white/55">{plan.description}</p>
      <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-left text-sm text-white/65 sm:grid-cols-3">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />{f}</li>
        ))}
      </ul>
      <PricingBuyButton />
      <p className="mt-4 text-xs text-white/40">
        One-time payment. No subscriptions. 30-day money-back guarantee.
      </p>
    </div>
  );
}

export default function LandingPage({ FullStudio, AuthControls }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="landing-noise" aria-hidden="true" />
      <div className="absolute inset-0 -z-10" style={{background:'radial-gradient(circle at top,rgba(34,211,238,0.12),transparent 28%),radial-gradient(circle at 80% 10%,rgba(168,85,247,0.10),transparent 30%),#050505'}} />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-black text-black">OG</span>
            <span className="font-semibold tracking-tight">{PRODUCT_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-white">{item.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {AuthControls && <AuthControls />}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 md:pb-32 md:pt-28">
        <div className="landing-orb" style={{left:'-6rem',top:'6rem',height:'18rem',width:'18rem',background:'#22d3ee'}} aria-hidden="true" />
        <div className="landing-orb" style={{right:0,top:'10rem',height:'24rem',width:'24rem',background:'#a855f7'}} aria-hidden="true" />
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-cyan-200">
            Every output is personalized to your brand and style
          </p>
          <PersonalizedHeroHeading />
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65 md:text-xl">
            Tell us your brand once — your colors, fonts, tone, audience, and reference work — and every model, preset, and workflow adapts to it. Generate on-brand video, images, UGC ads, scripts, and assets in your voice, not a generic one.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#studio" className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-6 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.02] sm:w-auto">
              Set up your brand
            </a>
            <a href="#studio" className="w-full rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.08] sm:w-auto">
              Launch full studio
            </a>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-3 text-center text-white/60">
            {[['20+','studio apps'],['200+','models'],['0','demo API key required']].map(([value,label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-center text-sm uppercase tracking-[0.35em] text-white/35">Built for teams creating</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
            {LOGOS.map((logo) => (
              <div key={logo} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-center text-sm font-semibold text-white/50">{logo}</div>
            ))}
          </div>
        </div>
      </section>

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
        {FullStudio ? <FullStudio embedded initialTab="image" demoMode /> : <StandaloneShell embedded initialTab="image" demoMode />}
      </section>

      {/* ── Workflow ── */}
      <section id="workflow" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Workflow</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">From idea to shipped campaign in one loop.</h2>
            <p className="mt-5 text-lg leading-8 text-white/60">Plan the concept, generate the assets, refine the edit, publish the campaign, and learn from analytics without switching tools.</p>
          </div>
          <div className="landing-card rounded-3xl p-6">
            {[
              ['1','Brief','Enter a product, script, or campaign goal.'],
              ['2','Generate','Use image, video, UGC, VFX, audio, or agent tools.'],
              ['3','Refine','Review outputs, adjust prompts, and rerun in seconds.'],
              ['4','Launch','Export assets, embed videos, and track campaign performance.']
            ].map(([step,title,copy]) => (
              <div key={step} className="flex gap-4 border-b border-white/10 py-5 last:border-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-sm font-black text-black">{step}</span>
                <div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/55">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="landing-card rounded-3xl p-7">
              <blockquote className="text-base leading-7 text-white/70">"{t.quote}"</blockquote>
              <figcaption className="mt-6">
                <div className="font-bold text-white">{t.name}</div>
                <div className="text-sm text-white/45">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-center text-4xl font-black tracking-tight md:text-5xl">Questions before you launch?</h2>
        <div className="mt-10 space-y-4">
          {FAQS.map((faq) => (
            <details key={faq.question} className="landing-card rounded-2xl p-6">
              <summary className="cursor-pointer font-bold text-white">{faq.question}</summary>
              <p className="mt-4 leading-7 text-white/60">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">Make the first demo feel like the full product.</h2>
          <p className="mt-5 text-lg leading-8 text-white/60">Visitors should understand the platform, try a feature, and know exactly where to go next.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#studio" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90">Try the studio</a>
            <a href="#studio" className="rounded-full border border-white/10 bg-transparent px-6 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]">Open full studio</a>
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
  );
}
