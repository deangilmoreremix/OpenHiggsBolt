'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Loader2, Check } from 'lucide-react';
import { panels, buttons, semantic } from '@/shared/styles/designTokens';
import { useSmartVideoAccess, ENTITLEMENTS } from '@/access/SmartVideoAccessProvider';

export const dynamic = "force-dynamic";

const STEPS = [
  'Fetching website...',
  'Analyzing brand identity...',
  'Saving brand DNA...',
];

export default function BrandStudioLanding() {
  const router = useRouter();
  const { requireEntitlement } = useSmartVideoAccess();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);

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
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-4xl font-bold">New Brand</h1>
          <p className="text-lg" style={{ color: semantic.textSecondary }}>
            Paste any website URL and Brand Studio extracts its Brand DNA, then generates on-brand campaigns,
            platform creatives, and product photography — all in one workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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

        <p className="mt-6 text-center text-sm" style={{ color: semantic.textMuted }}>
          Your existing brands are in the menu on the left. New brands you create appear there too.
        </p>
      </div>
    </div>
  );
}
