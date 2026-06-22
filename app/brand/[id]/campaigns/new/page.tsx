'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { panels, buttons, semantic, appWrapper } from '@/shared/styles/designTokens';

const GOALS = [
  { id: 'product_launch', label: 'Product Launch', desc: 'Announce a new product or feature', icon: '🚀' },
  { id: 'lead_generation', label: 'Lead Generation', desc: 'Capture qualified prospects', icon: '🎯' },
  { id: 'brand_awareness', label: 'Brand Awareness', desc: 'Reach new audiences', icon: '📢' },
  { id: 'engagement', label: 'Engagement', desc: 'Drive replies, shares, comments', icon: '💬' },
  { id: 'thought_leadership', label: 'Thought Leadership', desc: 'Establish authority and POV', icon: '🧠' },
  { id: 'sales', label: 'Direct Sales', desc: 'Drive purchases or sign-ups', icon: '💰' },
];

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
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: params.id, goal, direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push(`/campaign/${data.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ ...appWrapper, color: semantic.textPrimary }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">New Campaign</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              className={`rounded-xl p-5 text-left transition ${goal === g.id ? 'ring-2' : ''}`}
              style={goal === g.id ? { ...buttons.activePill, ringColor: 'var(--color-primary)' } : panels.card}
            >
              <span className="text-2xl mb-2 block">{g.icon}</span>
              <p className="font-semibold">{g.label}</p>
              <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>{g.desc}</p>
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
