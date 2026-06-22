'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Check, ChevronRight } from 'lucide-react';
import { panels, buttons, semantic, appWrapper, optionStyle } from '@/shared/styles/designTokens';

type Concept = {
  title: string;
  tagline: string;
  visualTheme: string;
  copyAngle: string;
};

type Campaign = {
  id: string;
  brand_id: string;
  goal: string;
  concepts: Concept[];
};

const GLOBAL_GOALS = {
  product_launch: 'Product Launch',
  lead_generation: 'Lead Generation',
  brand_awareness: 'Brand Awareness',
  engagement: 'Engagement',
  thought_leadership: 'Thought Leadership',
  sales: 'Direct Sales',
};

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [brand, setBrand] = useState<any>(null);
  const [selectedConcept, setSelectedConcept] = useState<number | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/campaigns?brand_id=' + params.brandId).then((r) => r.json()),
      fetch(`/api/brand?id=${params.brandId}`).then((r) => r.json()),
    ]).then(([campaigns, brandData]) => {
      const found = (campaigns as any[]).find((c) => c.id === params.id);
      setCampaign(found || null);
      setBrand(brandData);
      if (found) setSelectedConcept(0);
    });
  }, [params.id, params.brandId]);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/assets?campaign_id=${params.id}`)
      .then((r) => r.json())
      .then(setAssets);
  }, [params.id]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const generateAssets = async () => {
    if (!selectedConcept && selectedConcept !== 0) return;
    if (selectedPlatforms.size === 0) return;
    setGenerating(true);
    const queue = Array.from(selectedPlatforms);
    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const platform = queue[cursor++];
        setProgress((p) => ({ ...p, [platform]: 'Generating...' }));
        try {
          const res = await fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaign_id: params.id, platform, concept_index: selectedConcept }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setProgress((p) => ({ ...p, [platform]: 'Done' }));
        } catch (err: any) {
          setProgress((p) => ({ ...p, [platform]: 'Failed: ' + err.message }));
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(2, queue.length) }, () => worker()));
    setGenerating(false);
    if (params.id) fetch(`/api/assets?campaign_id=${params.id}`).then((r) => r.json()).then(setAssets);
  };

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ ...appWrapper, color: semantic.textSecondary }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={appWrapper}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: semantic.textMuted }}>Campaign</p>
            <h1 className="text-3xl font-semibold">{GLOBAL_GOALS[campaign.goal as keyof typeof GLOBAL_GOALS] || campaign.goal}</h1>
            {brand && (
              <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>
                For{' '}
                <span className="font-medium" style={{ color: semantic.textPrimary }}>{brand.brand_name || brand.url}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Concepts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaign.concepts?.map((concept, i) => (
              <div
                key={i}
                onClick={() => setSelectedConcept(i)}
                className={`rounded-xl p-5 cursor-pointer transition ${selectedConcept === i ? 'ring-2' : ''}`}
                style={selectedConcept === i ? { ...buttons.activePill, ringColor: 'var(--color-primary)' } : panels.card}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedConcept === i ? 'border-transparent' : ''}`} style={selectedConcept === i ? buttons.activePill : { borderColor: 'var(--border-color)' }}>
                    {selectedConcept === i && <Check size={12} />}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{concept.title}</p>
                    <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>{concept.tagline}</p>
                    <p className="text-sm mt-2" style={{ color: semantic.textMuted }}>{concept.visualTheme}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Platforms</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'instagram_feed', label: 'Instagram Feed' },
              { id: 'instagram_story', label: 'Instagram Story' },
              { id: 'linkedin', label: 'LinkedIn' },
              { id: 'facebook_ad', label: 'Facebook Ad' },
              { id: 'twitter', label: 'X / Twitter' },
              { id: 'web_banner', label: 'Web Banner' },
              { id: 'email_header', label: 'Email Header' },
              { id: 'youtube_thumb', label: 'YouTube Thumbnail' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className="px-4 py-3 rounded-lg text-sm font-medium transition"
                style={optionStyle(selectedPlatforms.has(p.id))}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={generateAssets}
            disabled={generating || selectedPlatforms.size === 0 || selectedConcept === null}
            className="mt-4 px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            style={buttons.primary}
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : null}
            Generate Selected Assets ({selectedPlatforms.size})
          </button>
          {generating && (
            <div className="mt-4 space-y-2">
              {Array.from(selectedPlatforms).map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm" style={{ color: semantic.textSecondary }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{progress[p] || 'Queued...'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {assets.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Generated Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((a) => (
                <div key={a.id} className="rounded-xl overflow-hidden" style={panels.card}>
                  {a.image_url && <img src={a.image_url} alt={a.headline} className="w-full aspect-video object-cover" />}
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide" style={{ color: semantic.textMuted }}>{a.platform}</p>
                    <p className="font-semibold mt-1">{a.headline}</p>
                    <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>{a.body}</p>
                    <p className="text-sm mt-2 font-medium" style={{ color: semantic.textPrimary }}>{a.cta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
