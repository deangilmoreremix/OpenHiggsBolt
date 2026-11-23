'use client';

import { useState, useEffect, useRef } from 'react';
import { Film, Loader2, Upload } from 'lucide-react';
import { panels, buttons, semantic, optionStyle } from '@/shared/styles/designTokens';
import { studio, store, waitForVideo, useHasMuapiKey } from '@/src/lib/brandStudio/client';
import { DURATION_RANGE, RESOLUTIONS, SOURCE_PROMPTS, type SourceType } from '@/src/lib/brandStudio/animate';

export const dynamic = 'force-dynamic';

const SOURCES: { id: SourceType; label: string }[] = [
  { id: 'asset', label: 'Campaign asset' },
  { id: 'photoshoot', label: 'Photoshoot' },
  { id: 'image', label: 'Upload / URL' },
];

export default function AnimatePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const hasKey = useHasMuapiKey();
  const [source, setSource] = useState<SourceType>('asset');
  const [assets, setAssets] = useState<any[]>([]);
  const [shoots, setShoots] = useState<any[]>([]);
  const [animations, setAnimations] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ url: string; brandId?: string } | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState<string>(SOURCE_PROMPTS.asset);
  const [duration, setDuration] = useState<number>(DURATION_RANGE.default);
  const [resolution, setResolution] = useState<(typeof RESOLUTIONS)[number]>('480p');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);

  const chooseSource = (s: SourceType) => { setSource(s); setPrompt(SOURCE_PROMPTS[s]); setSelected(null); };

  useEffect(() => {
    (async () => {
      const [a, p, v] = await Promise.all([
        store.list('asset').catch(() => []), store.list('photoshoot').catch(() => []), store.list('animation').catch(() => []),
      ]);
      setAssets(a); setShoots(p); setAnimations(v);
      const q = new URLSearchParams(window.location.search);
      const assetId = q.get('asset_id'), shootId = q.get('photoshoot_id');
      const hitA = assetId && a.find((x: any) => x.id === assetId);
      const hitP = shootId && p.find((x: any) => x.id === shootId);
      if (hitA) { setSource('asset'); setPrompt(SOURCE_PROMPTS.asset); setSelected({ url: hitA.image_url, brandId: hitA.brand_id }); }
      else if (hitP) { setSource('photoshoot'); setPrompt(SOURCE_PROMPTS.photoshoot); setSelected({ url: hitP.image_url, brandId: hitP.brand_id }); }
    })();
  }, []);

  const upload = async (file: File) => {
    setBusy(true); setError(null);
    try {
      const data: string = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(file); });
      setImageUrl((await studio('upload', { data, filename: file.name, contentType: file.type || 'image/png' })).url);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const sourceUrl = source === 'image' ? imageUrl : selected?.url || '';

  const animate = async () => {
    if (!sourceUrl) return;
    setBusy(true); setError(null); setVideo(null);
    try {
      const { requestId } = await studio('animate', { sourceUrl, prompt, duration, resolution });
      const row = await store.create('animation', { brand_id: selected?.brandId, source_url: sourceUrl, resolution, duration, request_id: requestId }).catch(() => null);
      const url = await waitForVideo(requestId);
      setVideo(url);
      if (row) { await store.update('animation', row.id, { video_url: url }).catch(() => {}); setAnimations((l) => [{ ...row, video_url: url }, ...l]); }
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const list = source === 'asset' ? assets : shoots;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold">Animate</h1>
        <p className="text-sm mt-1 mb-6" style={{ color: semantic.textSecondary }}>Turn a still into a short motion clip.</p>

        <div className="flex gap-2 mb-4">
          {SOURCES.map((s) => <button key={s.id} data-source={s.id} onClick={() => chooseSource(s.id)} className="px-4 py-2 rounded-lg text-sm font-medium" style={optionStyle(source === s.id)}>{s.label}</button>)}
        </div>

        {source === 'image' ? (
          <div className="flex gap-3 mb-6">
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="flex-1 rounded-lg px-4 py-2 outline-none" style={panels.card} />
            <button onClick={() => fileRef.current?.click()} disabled={!hasKey || busy} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50" style={buttons.ghost}><Upload size={14} /> Upload</button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-6">
            {list.length === 0 && <p className="col-span-full text-sm" style={{ color: semantic.textMuted }}>Nothing here yet — generate some in the {source === 'asset' ? 'campaign' : 'Photo Studio'} first.</p>}
            {list.map((x) => (
              <button key={x.id} onClick={() => setSelected({ url: x.image_url, brandId: x.brand_id })} className="aspect-square overflow-hidden rounded-lg" style={selected?.url === x.image_url ? buttons.activePill : buttons.inactivePill}>
                <img src={x.image_url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="rounded-xl p-4 mb-6 space-y-4" style={panels.glass}>
          <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Motion prompt</label>
          <textarea data-field="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} />
          <div className="flex flex-wrap items-center gap-6">
            <label className="text-xs" style={{ color: semantic.textLabel }}>Duration: {duration}s
              <input type="range" min={DURATION_RANGE.min} max={DURATION_RANGE.max} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="ml-3 align-middle accent-primary" />
            </label>
            <div className="flex gap-1">
              {RESOLUTIONS.map((r) => <button key={r} onClick={() => setResolution(r)} className="px-3 py-1.5 rounded text-xs" style={optionStyle(resolution === r)}>{r}</button>)}
            </div>
          </div>
        </div>

        {!hasKey && <p className="mb-3 text-sm" style={{ color: semantic.error }}>Add your MuAPI key in Settings to animate.</p>}
        <button data-action="animate" onClick={animate} disabled={busy || !sourceUrl || !hasKey} className="px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50" style={buttons.primary}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />} Animate
        </button>
        {error && <div data-animate-error className="mt-4 p-3 rounded-lg text-sm" style={{ background: semantic.errorBg, border: `1px solid ${semantic.errorBorder}`, color: semantic.error }}>{error}</div>}
        {video && <video src={video} controls autoPlay loop className="mt-6 max-h-96 rounded-xl" />}

        {animations.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-4">History</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {animations.filter((a) => a.video_url).map((a) => (
                <div key={a.id} className="rounded-xl overflow-hidden" style={panels.card}>
                  <video src={a.video_url} controls className="w-full" />
                  <p className="p-3 text-xs" style={{ color: semantic.textSecondary }}>{a.duration}s · {a.resolution}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
