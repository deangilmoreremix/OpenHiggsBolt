'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Download, RefreshCw, Loader2, Eraser, Upload, Film, Check } from 'lucide-react';
import { panels, buttons, semantic, optionStyle } from '@/shared/styles/designTokens';
import { findPlatform } from '@/src/lib/brandStudio/platforms';
import { studio, store, loadBrand, normalizeConcept, useHasMuapiKey } from '@/src/lib/brandStudio/client';
import { POSITIONS, SIZES, ALIGNS, defaultLayout, positionStyle, SIZE_CQW, type Layout, type BlockKey } from '@/src/lib/brandStudio/layout';

const BLOCKS: { key: BlockKey; label: string }[] = [
  { key: 'headline', label: 'Headline' },
  { key: 'body', label: 'Body' },
  { key: 'cta', label: 'CTA' },
];

export default function AssetEditPage() {
  const params = useParams();
  const hasKey = useHasMuapiKey();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [asset, setAsset] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [concept, setConcept] = useState<any>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState<BlockKey>('headline');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        const a = await store.get('asset', String(params.id));
        setAsset(a);
        setImageUrl(a.image_url || '');
        const b = a.brand_id ? await loadBrand(a.brand_id).catch(() => null) : null;
        setBrand(b);
        const fontFamily = b?.fonts?.[0] ? `${b.fonts[0]}, system-ui, sans-serif` : 'system-ui, sans-serif';
        const base = defaultLayout(a.headline || '', a.body || '', a.cta || '', fontFamily, b?.primaryColors?.[0]);
        const saved = a.canvas_data?.layout;
        setLayout(saved ? { headline: { ...base.headline, ...saved.headline }, body: { ...base.body, ...saved.body }, cta: { ...base.cta, ...saved.cta } } : base);
        if (a.campaign_id) {
          const c = await store.get('campaign', a.campaign_id).catch(() => null);
          if (c) setConcept(normalizeConcept((c.concepts || [])[a.concept_index] || {}));
        }
      } catch (e: any) { setError(e.message); }
      setLoading(false);
    })();
  }, [params.id]);

  const patch = (key: BlockKey, p: Record<string, unknown>) => setLayout((l) => (l ? { ...l, [key]: { ...l[key], ...p } } : l));

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name); setError(null);
    try { await fn(); } catch (e: any) { setError(e.message); } finally { setBusy(null); }
  };

  const regenerate = (noText: boolean) => run(noText ? 'clean' : 'swap', async () => {
    if (!brand || !concept) throw new Error('Brand or concept not available for this asset.');
    const r = await studio('regenerate-image', { brand, concept, platform: asset.platform, headline: layout?.headline.text || '', noText });
    setImageUrl(r.imageUrl);
  });

  const upload = (file: File) => run('upload', async () => {
    const data: string = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(file); });
    const r = await studio('upload', { data, filename: file.name, contentType: file.type || 'image/png' });
    setImageUrl(r.url);
  });

  const save = () => run('save', async () => {
    if (!layout) return;
    await store.update('asset', String(params.id), {
      headline: layout.headline.text, body: layout.body.text, cta: layout.cta.text, image_url: imageUrl,
      canvas_data: { ...(asset?.canvas_data || {}), layout },
    });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  });

  if (loading || !layout) {
    return (
      <div className="flex items-center justify-center py-24" style={{ color: error ? semantic.error : semantic.textSecondary }}>
        {error || <Loader2 size={24} className="animate-spin" />}
      </div>
    );
  }

  const platform = findPlatform(asset?.platform || '');
  const block = layout[active];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <button onClick={() => router.back()} className="text-sm" style={{ color: semantic.textSecondary }}>← Back</button>
          <div className="flex flex-wrap gap-2">
            <button data-action="swap" disabled={!hasKey || !!busy} onClick={() => regenerate(false)} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50" style={buttons.ghost}>
              {busy === 'swap' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Swap image
            </button>
            <button data-action="clean" disabled={!hasKey || !!busy} onClick={() => regenerate(true)} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50" style={buttons.ghost}>
              {busy === 'clean' ? <Loader2 size={14} className="animate-spin" /> : <Eraser size={14} />} Clean background
            </button>
            <button data-action="upload" disabled={!hasKey || !!busy} onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50" style={buttons.ghost}>
              {busy === 'upload' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
            <Link href={`/animate?asset_id=${params.id}`} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={buttons.ghost}><Film size={14} /> Animate</Link>
            <a href={imageUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={buttons.ghost}><Download size={14} /> Open</a>
            <button data-action="save" onClick={save} disabled={!!busy} className="px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50" style={buttons.primary}>
              {busy === 'save' ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />} {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        {error && <p className="mb-3 text-sm" style={{ color: semantic.error }}>{error}</p>}
        {!hasKey && <p className="mb-3 text-xs" style={{ color: semantic.textMuted }}>Add your MuAPI key in Settings to swap, clean or upload images.</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
          <div>
            <div data-preview className="relative mx-auto w-full overflow-hidden rounded-xl" style={{ aspectRatio: `${platform.width} / ${platform.height}`, maxHeight: '75vh', background: 'var(--bg-card)', containerType: 'inline-size' }}>
              {imageUrl && <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[4cqw]">
                {POSITIONS.map((pos) => (
                  <div key={pos} className="flex flex-col gap-[1cqw]" style={positionStyle(pos)}>
                    {BLOCKS.filter((b) => layout[b.key].position === pos && layout[b.key].text).map((b) => {
                      const l = layout[b.key];
                      return (
                        <span key={b.key} data-block={b.key} onClick={() => setActive(b.key)}
                          style={{ cursor: 'pointer', fontSize: `${SIZE_CQW[l.size]}cqw`, color: l.color, fontFamily: l.fontFamily, textAlign: l.align, fontWeight: b.key === 'headline' ? 800 : b.key === 'cta' ? 700 : 500, lineHeight: 1.1,
                            background: l.bg || undefined, padding: l.bg ? '0.6cqw 1.4cqw' : undefined, borderRadius: l.bg ? '0.8cqw' : undefined,
                            textShadow: l.bg ? undefined : '0 0.2cqw 1.2cqw rgba(0,0,0,0.65)', outline: active === b.key ? '2px dashed var(--color-primary)' : 'none', outlineOffset: 4, maxWidth: '100%' }}>
                          {l.text}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-center text-xs" style={{ color: semantic.textMuted }}>{platform.label} · {platform.width}×{platform.height}</p>
          </div>

          <aside className="space-y-4">
            <div className="flex gap-2">
              {BLOCKS.map((b) => (
                <button key={b.key} data-tab={b.key} onClick={() => setActive(b.key)} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium" style={optionStyle(active === b.key)}>{b.label}</button>
              ))}
            </div>
            <div className="rounded-xl p-4 space-y-3" style={panels.glass}>
              <Label>Text</Label>
              <textarea data-field="text" value={block.text} onChange={(e) => patch(active, { text: e.target.value })} rows={active === 'body' ? 3 : 2} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} />
              <Label>Position</Label>
              <div className="grid grid-cols-3 gap-1">
                {POSITIONS.map((p) => (
                  <button key={p} data-pos={p} onClick={() => patch(active, { position: p })} className="rounded px-1 py-1.5 text-[10px]" style={optionStyle(block.position === p)}>{p.replace('-', ' ')}</button>
                ))}
              </div>
              <Label>Size</Label>
              <div className="flex gap-1">
                {SIZES.map((s) => <button key={s} onClick={() => patch(active, { size: s })} className="flex-1 rounded px-2 py-1.5 text-xs capitalize" style={optionStyle(block.size === s)}>{s}</button>)}
              </div>
              <Label>Align</Label>
              <div className="flex gap-1">
                {ALIGNS.map((a) => <button key={a} onClick={() => patch(active, { align: a })} className="flex-1 rounded px-2 py-1.5 text-xs capitalize" style={optionStyle(block.align === a)}>{a}</button>)}
              </div>
              <Label>Text colour</Label>
              <ColorRow value={block.color} onChange={(v) => patch(active, { color: v })} />
              <Label>Background</Label>
              <div className="flex items-center gap-2">
                <ColorRow value={block.bg || '#000000'} onChange={(v) => patch(active, { bg: v })} />
                <button onClick={() => patch(active, { bg: null })} className="rounded px-2 py-1.5 text-xs" style={buttons.ghost}>None</button>
              </div>
              <Label>Font</Label>
              <input value={block.fontFamily} onChange={(e) => patch(active, { fontFamily: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={panels.card} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: semantic.textLabel }}>{children}</label>;
}
function ColorRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="h-8 w-12 rounded border-0 bg-transparent p-1 cursor-pointer" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded px-2 py-1 text-xs font-mono outline-none" style={panels.card} />
    </div>
  );
}
