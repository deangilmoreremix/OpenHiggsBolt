'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Check, Pencil } from 'lucide-react';
import { panels, buttons, semantic, optionStyle } from '@/shared/styles/designTokens';
import { STUDIO_PLATFORMS, isRecommendedPlatform } from '@/src/lib/brandStudio/platforms';
import { goalLabel } from '@/src/lib/brandStudio/goals';
import { studio, store, loadBrand, normalizeConcept, useHasMuapiKey } from '@/src/lib/brandStudio/client';

export default function CampaignPage() {
  const params = useParams();
  const hasKey = useHasMuapiKey();
  const [campaign, setCampaign] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [selectedConcept, setSelectedConcept] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const concepts = useMemo(() => (campaign?.concepts || []).map(normalizeConcept), [campaign]);

  const loadAssets = () => store.list('asset', { campaign_id: String(params.id) }).then(setAssets).catch(() => {});

  useEffect(() => {
    if (!params.id) return;
    store.get('campaign', String(params.id))
      .then(async (found) => {
        setCampaign(found);
        if (found.brand_id) setBrand(await loadBrand(found.brand_id).catch(() => null));
      })
      .catch((err) => setError(err.message));
    loadAssets();
  }, [params.id]);

  // Recommended platforms are pre-ticked for the chosen concept (Open-Pomelli behaviour).
  useEffect(() => {
    const rec = concepts[selectedConcept]?.recommended_platforms;
    if (!rec?.length) return;
    setSelectedPlatforms(new Set(STUDIO_PLATFORMS.filter((p) => isRecommendedPlatform(p, rec)).map((p) => p.id)));
  }, [concepts, selectedConcept]);

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const generateAssets = async () => {
    if (!selectedPlatforms.size || !brand) return;
    setGenerating(true);
    setError(null);
    const queue = Array.from(selectedPlatforms);
    let cursor = 0;
    async function worker() {
      while (cursor < queue.length) {
        const platform = queue[cursor++];
        setProgress((p) => ({ ...p, [platform]: 'Generating...' }));
        try {
          const a = await studio('asset', { brand, concept: concepts[selectedConcept], platform });
          await store.create('asset', {
            brand_id: campaign.brand_id, campaign_id: campaign.id, platform: a.platform, concept_index: selectedConcept,
            headline: a.headline, body: a.body, cta: a.cta, image_url: a.imageUrl,
          });
          setProgress((p) => ({ ...p, [platform]: 'Done' }));
        } catch (err: any) {
          setProgress((p) => ({ ...p, [platform]: 'Failed: ' + err.message }));
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(2, queue.length) }, () => worker()));
    setGenerating(false);
    loadAssets();
  };

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: error ? semantic.error : semantic.textSecondary }}>
        {error ? error : <Loader2 size={24} className="animate-spin" />}
      </div>
    );
  }


  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: semantic.textMuted }}>Campaign</p>
          <h1 className="text-3xl font-semibold">{goalLabel(campaign.goal)}</h1>
          {brand && (
            <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>
              For <span className="font-medium" style={{ color: semantic.textPrimary }}>{brand.brandName || brand.url}</span>
            </p>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Concepts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concepts.map((c: any, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedConcept(i)}
                data-concept={i}
                className={`rounded-xl p-5 text-left transition ${selectedConcept === i ? 'border-2' : ''}`}
                style={selectedConcept === i ? { ...buttons.activePill, borderColor: 'var(--color-primary)' } : panels.card}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0" style={selectedConcept === i ? buttons.activePill : { borderColor: 'var(--border-color)' }}>
                    {selectedConcept === i && <Check size={12} />}
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-lg" style={{ color: semantic.textPrimary }}>{c.title}</p>
                    {c.theme && <p className="text-sm" style={{ color: semantic.textSecondary }}>{c.theme}</p>}
                    {c.key_message && <p className="text-sm" style={{ color: semantic.textSecondary }}>{c.key_message}</p>}
                    {c.hook && <p className="text-sm italic" style={{ color: semantic.textMuted }}>“{c.hook}”</p>}
                    {c.visual_direction && <p className="text-xs" style={{ color: semantic.textMuted }}>{c.visual_direction}</p>}
                    {c.cta && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs" style={buttons.activePill}>{c.cta}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-1">Platforms</h2>
          <p className="text-xs mb-4" style={{ color: semantic.textMuted }}>Recommended formats for this concept are pre-selected.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STUDIO_PLATFORMS.map((p) => (
              <button key={p.id} onClick={() => togglePlatform(p.id)} data-platform={p.id} className="px-4 py-3 rounded-lg text-sm font-medium transition text-left" style={optionStyle(selectedPlatforms.has(p.id))}>
                {p.label}
              </button>
            ))}
          </div>
          {!hasKey && <p className="mt-3 text-sm" style={{ color: semantic.error }}>Add your MuAPI key in Settings to generate assets.</p>}
          <button
            onClick={generateAssets}
            disabled={generating || selectedPlatforms.size === 0 || !hasKey || !brand}
            className="mt-4 px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            style={buttons.primary}
          >
            {generating && <Loader2 size={18} className="animate-spin" />}
            Generate {selectedPlatforms.size} asset{selectedPlatforms.size === 1 ? '' : 's'}
          </button>
          {(generating || Object.keys(progress).length > 0) && (
            <div className="mt-4 space-y-1.5">
              {Array.from(selectedPlatforms).map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm" style={{ color: /^Failed/.test(progress[p] || '') ? semantic.error : semantic.textSecondary }}>
                  {generating && !/^(Done|Failed)/.test(progress[p] || '') && <Loader2 size={14} className="animate-spin" />}
                  <span>{STUDIO_PLATFORMS.find((x) => x.id === p)?.label}: {progress[p] || 'Queued...'}</span>
                </div>
              ))}
            </div>
          )}
          {error && <p className="mt-3 text-sm" style={{ color: semantic.error }}>{error}</p>}
        </div>

        {assets.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Generated Assets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((a) => (
                <Link key={a.id} href={`/asset/${a.id}/edit`} className="rounded-xl overflow-hidden block group" style={panels.card}>
                  {a.image_url && <img src={a.image_url} alt={a.headline} className="w-full aspect-video object-cover" />}
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide" style={{ color: semantic.textMuted }}>{STUDIO_PLATFORMS.find((x) => x.id === a.platform)?.label || a.platform}</p>
                    <p className="font-semibold mt-1">{a.headline}</p>
                    <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>{a.body}</p>
                    <p className="text-sm mt-2 font-medium flex items-center justify-between" style={{ color: semantic.textPrimary }}>
                      {a.cta}
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-primary)' }}><Pencil size={12} /> Edit</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
