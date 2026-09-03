'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Palette, BarChart3, Image, Camera, Film, Loader2, Check, ChevronRight } from 'lucide-react';
import { panels, buttons, semantic, appWrapper, optionStyle } from '@/shared/styles/designTokens';
import { useSmartVideoAccess, ENTITLEMENTS } from '@/access/SmartVideoAccessProvider';

const STEPS = [
  'Fetching website...',
  'Analyzing brand identity...',
  'Saving brand DNA...',
];

const FEATURES = [
  { label: 'Brand DNA', icon: Palette },
  { label: 'Campaigns', icon: BarChart3 },
  { label: '8 Platforms', icon: Image },
  { label: 'Photo Studio', icon: Camera },
  { label: 'Animate', icon: Film },
];

export default function BrandStudioLanding() {
  const router = useRouter();
  const { requireEntitlement } = useSmartVideoAccess();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then(setBrands)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    requireEntitlement(
      ENTITLEMENTS.SMARTVIDEO_GO,
      async () => {
        setLoading(true);
        setError(null);
        setStep(0);
        try {
          const res = await fetch('/api/brands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to analyze brand');
          router.push(`/brand/${data.id}`);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
          setStep(-1);
        }
      },
      () => {
        setError('Payment required to analyze brands');
      }
    );
  };

  useEffect(() => {
    if (!loading) return;
    const timers = [
      setTimeout(() => setStep(0), 400),
      setTimeout(() => setStep(1), 1800),
      setTimeout(() => setStep(2), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  return (
    <div className="min-h-screen p-6" style={appWrapper}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Brand Studio</h1>
          <p className="text-lg" style={{ color: semantic.textSecondary }}>
            Paste any website URL to extract brand DNA and generate campaigns, assets, and photos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-12">
          <div className="rounded-xl p-8" style={panels.glass}>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-brand.com"
                className="flex-1 rounded-lg px-4 py-3 outline-none"
                style={panels.card}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                style={buttons.primary}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                Analyze
              </button>
            </div>
            {loading && (
              <div className="mt-4 space-y-2">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-sm" style={{ color: semantic.textSecondary }}>
                    {i < step ? <Check size={14} style={{ color: semantic.success }} /> : i === step ? <Loader2 size={14} className="animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-current opacity-40" />}
                    <span style={{ color: i <= step ? semantic.textPrimary : semantic.textMuted }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: semantic.errorBg, border: `1px solid ${semantic.errorBorder}`, color: semantic.error }}>
                {error}
              </div>
            )}
          </div>
        </form>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Brands</h2>
          {brands.length === 0 ? (
            <p className="text-sm" style={{ color: semantic.textMuted }}>
              No brands yet. Paste a URL above to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => router.push(`/brand/${b.id}`)}
                  className="text-left rounded-xl p-4 transition hover:opacity-80"
                  style={panels.card}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {b.primary_colors && (
                        <div className="w-6 h-6 rounded-full border border-white/10" style={{ background: b.primary_colors.split(',')[0] || '#000' }} />
                      )}
                      <div>
                        <p className="font-semibold">{b.brand_name || 'Untitled Brand'}</p>
                        <p className="text-xs truncate mt-1" style={{ color: semantic.textSecondary }}>{b.industry || b.url}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: semantic.textMuted }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <span key={f.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={buttons.inactivePill}>
                <Icon size={14} /> {f.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
