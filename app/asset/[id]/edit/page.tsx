'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, Download, RefreshCw, Loader2 } from 'lucide-react';
import { panels, buttons, semantic, appWrapper } from '@/shared/styles/designTokens';

const GRID = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

export default function AssetEditPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [cta, setCta] = useState('');
  const [position, setPosition] = useState('bottom-left');
  const [headlineSize, setHeadlineSize] = useState(48);
  const [bodySize, setBodySize] = useState(16);
  const [headlineColor, setHeadlineColor] = useState('#ffffff');
  const [bodyColor, setBodyColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');
  const [bgOpacity, setBgOpacity] = useState(0);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    fetch(`/api/assets?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setLoading(false);
          return;
        }
        const found = Array.isArray(data) ? data.find((a) => a.id === params.id) : data;
        if (found) {
          setAsset(found);
          setHeadline(found.headline || '');
          setBody(found.body || '');
          setCta(found.cta || '');
          const canvas = found.canvas_data || {};
          if (canvas.position) setPosition(canvas.position);
          if (canvas.headlineSize) setHeadlineSize(canvas.headlineSize);
          if (canvas.bodySize) setBodySize(canvas.bodySize);
          if (canvas.headlineColor) setHeadlineColor(canvas.headlineColor);
          if (canvas.bodyColor) setBodyColor(canvas.bodyColor);
          if (canvas.bgColor) setBgColor(canvas.bgColor);
          if (canvas.bgOpacity) setBgOpacity(canvas.bgOpacity);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const save = async () => {
    if (!params.id) return;
    setSaving(true);
    const canvas = { position, headlineSize, bodySize, headlineColor, bodyColor, bgColor, bgOpacity };
    const res = await fetch(`/api/assets?id=${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline, body, cta, canvas_data: canvas }),
    });
    if (res.ok) {
      alert('Saved');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ ...appWrapper, color: semantic.textSecondary }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  const cellClass: any = {
    'top-left': 'items-start justify-start text-left',
    'top-center': 'items-start justify-center text-center',
    'top-right': 'items-start justify-end text-right',
    'middle-left': 'items-center justify-start text-left',
    'middle-center': 'items-center justify-center text-center',
    'middle-right': 'items-center justify-end text-right',
    'bottom-left': 'items-end justify-start text-left',
    'bottom-center': 'items-end justify-center text-center',
    'bottom-right': 'items-end justify-end text-right',
  };

  return (
    <div className="min-h-screen" style={appWrapper}>
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.back()} className="text-sm" style={{ color: semantic.textSecondary }}>← Back</button>
            <div className="flex gap-2">
              <button onClick={() => window.open(asset?.image_url, '_blank')} className="px-3 py-1.5 rounded-lg text-xs" style={buttons.ghost}><Download size={14} /></button>
              <button className="px-3 py-1.5 rounded-lg text-xs" style={buttons.ghost}><RefreshCw size={14} /></button>
            </div>
          </div>
          <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--bg-card)' }}>
            {asset?.image_url && <img src={asset.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-2 p-[5%]">
              {GRID.map((pos) => {
                const active = position === pos;
                const blocks: any[] = [];
                if (['top-left', 'top-center', 'top-right'].includes(pos)) blocks.push({ kind: 'headline', text: headline ? headline.substring(0, 8) : '', size: headlineSize, color: headlineColor, bold: true });
                if (['middle-left', 'middle-center', 'middle-right'].includes(pos)) blocks.push({ kind: 'body', text: body ? body.substring(0, 15) : '', size: bodySize, color: bodyColor, bold: false });
                if (['bottom-left', 'bottom-center', 'bottom-right'].includes(pos)) blocks.push({ kind: 'headline', text: headline ? headline.substring(0, 8) : '', size: headlineSize, color: headlineColor, bold: true });
                return (
                  <div key={pos} onClick={() => setPosition(pos)} className={`flex flex-col gap-1 cursor-pointer ${cellClass[pos]}`} style={{ outline: active ? '2px dashed var(--color-primary)' : 'none' }}>
                    {blocks.map((b) => (
                      <span key={b.kind} style={{ fontSize: Math.min(b.size, 24), color: b.color, fontWeight: b.bold ? 700 : 400 }}>{b.text}</span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl p-4" style={panels.glass}>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>Headline</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full rounded-lg px-3 py-2 outline-none mb-3" style={panels.card} />
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 outline-none mb-3" style={panels.card} />
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>CTA</label>
            <input value={cta} onChange={(e) => setCta(e.target.value)} className="w-full rounded-lg px-3 py-2 outline-none mb-3" style={panels.card} />
          </div>

          <div className="rounded-xl p-4" style={panels.glass}>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: semantic.textLabel }}>Position</label>
            <div className="grid grid-cols-3 gap-1 mb-4">
              {GRID.map((p) => (
                <button key={p} onClick={() => setPosition(p)} className={`rounded px-2 py-1.5 text-[10px] ${position === p ? 'text-white' : ''}`} style={position === p ? buttons.activePill : buttons.inactivePill}>{p.replace('-', ' ')}</button>
              ))}
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>Headline size: {headlineSize}px</label>
            <input type="range" min={16} max={72} value={headlineSize} onChange={(e) => setHeadlineSize(Number(e.target.value))} className="w-full mb-3" />
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>Body size: {bodySize}px</label>
            <input type="range" min={12} max={24} value={bodySize} onChange={(e) => setBodySize(Number(e.target.value))} className="w-full mb-3" />
          </div>

          <div className="rounded-xl p-4" style={panels.glass}>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: semantic.textLabel }}>Colors</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="color" value={headlineColor} onChange={(e) => setHeadlineColor(e.target.value)} className="h-8 w-12 rounded border-0 bg-transparent p-1 cursor-pointer" />
              <input value={headlineColor} onChange={(e) => setHeadlineColor(e.target.value)} className="flex-1 rounded px-2 py-1 text-xs font-mono outline-none" style={panels.card} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input type="color" value={bodyColor} onChange={(e) => setBodyColor(e.target.value)} className="h-8 w-12 rounded border-0 bg-transparent p-1 cursor-pointer" />
              <input value={bodyColor} onChange={(e) => setBodyColor(e.target.value)} className="flex-1 rounded px-2 py-1 text-xs font-mono outline-none" style={panels.card} />
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-12 rounded border-0 bg-transparent p-1 cursor-pointer" />
              <input type="range" min={0} max={100} value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} className="flex-1" />
            </div>
          </div>

          <button onClick={save} disabled={saving} className="w-full px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={buttons.primary}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </aside>
      </div>
    </div>
  );
}
