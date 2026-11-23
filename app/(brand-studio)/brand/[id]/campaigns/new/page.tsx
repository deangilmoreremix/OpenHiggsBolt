'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { panels, buttons, semantic } from '@/shared/styles/designTokens';
import { STUDIO_GOALS } from '@/src/lib/brandStudio/goals';
import { studio, store, loadBrand, getMuapiKey } from '@/src/lib/brandStudio/client';

export default function NewCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const [goal, setGoal] = useState('');
  const [direction, setDirection] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!goal || !params.id) return;
    setLoading(true);
    try {
      let id: string;
      if (getMuapiKey()) {
        const brand = await loadBrand(String(params.id));
        const concepts = await studio('concepts', { brand, goal, direction });
        const campaign = await store.create('campaign', { brand_id: params.id, goal, direction, concepts });
        id = campaign.id;
      } else {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand_id: params.id, goal: goal.replace(/-/g, '_'), direction }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        id = data.id;
      }
      router.push(`/campaign/${id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl">
        <p className="mb-1 text-xs uppercase tracking-wider" style={{ color: semantic.textMuted }}>
          Campaigns
        </p>
        <h1 className="mb-6 text-2xl font-bold">New Campaign</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {STUDIO_GOALS.map((g) => (
            <button
              key={g.value}
              onClick={() => setGoal(g.value)}
              className={`rounded-xl p-5 text-left transition ${goal === g.value ? 'border-2' : ''}`}
              style={goal === g.value ? { ...buttons.activePill, borderColor: 'var(--color-primary)' } : panels.card}
            >
              <p className="font-semibold">{g.label}</p>
              <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>{g.description}</p>
            </button>
          ))}
        </div>
        <textarea
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          placeholder="Optional creative direction..."
          rows={3}
          className="w-full rounded-lg px-4 py-3 outline-none mb-6"
          style={panels.card}
        />
        <button
          onClick={generate}
          disabled={!goal || loading}
          className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
          style={buttons.primary}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          Generate 4 Concepts
        </button>
      </div>
    </div>
  );
}
