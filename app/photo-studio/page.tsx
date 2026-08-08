'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, Loader2, ChevronRight } from 'lucide-react';
import { panels, buttons, semantic, appWrapper, optionStyle } from '@/shared/styles/designTokens';

const CATEGORIES = [
  'E-commerce', 'Lifestyle', 'Food & Beverage', 'Tech & Electronics', 'Beauty & Fashion', 'Health & Wellness'
];

export default function PhotoStudioPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [style, setStyle] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then(setBrands)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!brandId) return;
    fetch('/api/photo-studio?brand_id=' + brandId)
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {});
    setResult(null);
  }, [brandId]);

  const pollUntilDone = async (requestId: string): Promise<string> => {
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const r = await fetch(`/api/photo-studio?requestId=${encodeURIComponent(requestId)}`);
      const d = await r.json();
      if (d.status === 'completed') return d.image_url;
      if (d.status === 'failed') throw new Error(d.error || 'Generation failed');
    }
    throw new Error('Generation timed out');
  };

  const generate = async () => {
    if (!style) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/photo-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: brandId || undefined, product_url: productUrl || undefined, category, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      if (!data.requestId) throw new Error('No request id returned');
      const imageUrl = await pollUntilDone(data.requestId);
      setResult({ image_url: imageUrl });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = [
    'Studio White', 'Marble Clean', 'Dark Moody', 'Gradient Pop', 'Flat Lay',
    'Urban Street', 'Golden Hour', 'Cozy Interior', 'Scandi Living', 'Café Scene',
    'Restaurant Plated', 'Rustic Table', 'Bright & Fresh', 'Dark Kitchen', 'Flat Lay Food',
    'Dark Techy', 'Clean Desk', 'Neon Glow', 'Blueprint', 'Holographic',
    'Beauty Flat Lay', 'Skin Texture', 'Fashion Editorial', 'Pastel Minimal', 'Gold Luxury',
    'Nature Organic', 'Spa Minimal', 'Active Sports', 'Clean Science', 'Sunrise Glow',
  ];

  const currentStyles = styles.filter((s) => {
    if (category === 'E-commerce') return ['Studio White', 'Marble Clean', 'Dark Moody', 'Gradient Pop', 'Flat Lay'].includes(s);
    if (category === 'Lifestyle') return ['Urban Street', 'Golden Hour', 'Cozy Interior', 'Scandi Living', 'Café Scene'].includes(s);
    if (category === 'Food & Beverage') return ['Restaurant Plated', 'Rustic Table', 'Bright & Fresh', 'Dark Kitchen', 'Flat Lay Food'].includes(s);
    if (category === 'Tech & Electronics') return ['Dark Techy', 'Clean Desk', 'Neon Glow', 'Blueprint', 'Holographic'].includes(s);
    if (category === 'Beauty & Fashion') return ['Beauty Flat Lay', 'Skin Texture', 'Fashion Editorial', 'Pastel Minimal', 'Gold Luxury'].includes(s);
    return ['Nature Organic', 'Spa Minimal', 'Active Sports', 'Clean Science', 'Sunrise Glow'].includes(s);
  });

  return (
    <div className="min-h-screen" style={appWrapper}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Photo Studio</h1>
            <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>Generate product photography with AI</p>
          </div>
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="rounded-lg px-3 py-2 outline-none" style={panels.card}>
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.brand_name || b.url}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => { setCategory(c); setStyle(''); }} className="px-4 py-2 rounded-lg text-sm font-medium transition" style={optionStyle(category === c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {currentStyles.map((s) => (
            <button key={s} onClick={() => setStyle(s)} className="px-3 py-2 rounded-lg text-sm font-medium transition" style={optionStyle(style === s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <input
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="Product image URL (optional)"
            className="flex-1 rounded-lg px-4 py-2 outline-none"
            style={panels.card}
          />
          <button onClick={generate} disabled={loading || !style} className="px-6 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50" style={buttons.primary}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Generate
          </button>
        </div>

        {result && (
          <div className="rounded-xl p-6 mb-8" style={panels.glass}>
            <h3 className="text-lg font-semibold mb-4">Result</h3>
            {result.image_url && (
              <img src={result.image_url} alt={result.style} className="max-h-96 mx-auto rounded-lg" />
            )}
            <button onClick={() => window.open(result.image_url, '_blank')} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={buttons.ghost}>
              <Download size={14} /> Download
            </button>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((h) => (
                <div key={h.id} className="rounded-xl overflow-hidden" style={panels.card}>
                  {h.image_url && <img src={h.image_url} alt={h.style} className="w-full aspect-square object-cover" />}
                  <div className="p-4">
                    <p className="font-medium">{h.style}</p>
                    <p className="text-xs" style={{ color: semantic.textSecondary }}>{h.category}</p>
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
