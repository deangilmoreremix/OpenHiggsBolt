'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Upload, Download, Loader2, Film, Camera } from 'lucide-react';
import { panels, buttons, semantic, optionStyle } from '@/shared/styles/designTokens';
import { useSmartVideoAccess, ENTITLEMENTS } from '@/access/SmartVideoAccessProvider';
import PersonalizeVideoAction from '@/components/PersonalizeVideoAction';
import type { StudioPersonalizeOptions } from '@/shared/personalization/studioEntry';
import { PHOTO_CATEGORIES, findPhotoStyle } from '@/src/lib/brandStudio/photoPresets';
import { studio, store, useHasMuapiKey } from '@/src/lib/brandStudio/client';
import { rowToBrand } from '@/src/lib/brandStudio/brandRows';
import { isUsableImageRef } from '@/src/lib/brandStudio/imageRefs';

export const dynamic = "force-dynamic";

const ASPECTS = ['1:1', '4:5', '16:9', '9:16'];
const RESOLUTIONS = ['1k', '2k', '4k'];

export default function PhotoStudioPage() {
  const { requireEntitlement } = useSmartVideoAccess();
  const hasKey = useHasMuapiKey();
  const fileRef = useRef<HTMLInputElement>(null);
  const [brandRows, setBrandRows] = useState<any[]>([]);
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState(PHOTO_CATEGORIES[0].id);
  const [styleId, setStyleId] = useState('');
  const [aspect, setAspect] = useState('');
  const [resolution, setResolution] = useState('2k');
  const [direction, setDirection] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const brand = brandRows.find((b) => b.id === brandId);
  const category = PHOTO_CATEGORIES.find((c) => c.id === categoryId)!;
  const found = styleId ? findPhotoStyle(categoryId, styleId) : null;

  useEffect(() => {
    store.list('brand').then(setBrandRows).catch(() => {});
    const q = new URLSearchParams(window.location.search);
    if (q.get('brand_id')) setBrandId(q.get('brand_id')!);
  }, []);

  useEffect(() => {
    setResult(null);
    store.list('photoshoot', brandId ? { brand_id: brandId } : {}).then((rows) => setHistory(brandId ? rows : rows.filter((r: any) => !r.brand_id))).catch(() => {});
  }, [brandId]);

  const upload = async (file: File) => {
    setUploading(true); setError(null);
    try {
      const data: string = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(file); });
      const r = await studio('upload', { data, filename: file.name, contentType: file.type || 'image/png' });
      setProductUrl(r.url);
    } catch (e: any) { setError(e.message); } finally { setUploading(false); }
  };

  const generate = () => {
    if (!styleId || !productUrl) return;
    requireEntitlement(ENTITLEMENTS.SMARTVIDEO_GO, async () => {
      setLoading(true); setResult(null); setError(null);
      try {
        const brandObj = brand ? rowToBrand(brand) : null;
        const photo = await studio('photo', { productImageUrl: productUrl, logoUrl: brandObj?.logoUrl, brand: brandObj, category: categoryId, style: styleId, direction, resolution, aspect: aspect || undefined });
        const saved = await store.create('photoshoot', { brand_id: brandId || undefined, style: photo.styleLabel, category: photo.category, product_url: productUrl, image_url: photo.imageUrl }).catch(() => null);
        setResult({ ...photo, id: saved?.id });
        if (saved) setHistory((h) => [saved, ...h]);
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    });
  };

  const siteImages: string[] = (brand ? rowToBrand(brand).siteImages ?? [] : []).filter(isUsableImageRef).slice(0, 12);

  const sourceMediaUrl = result?.imageUrl || history[0]?.image_url || null;
  const sourceLabel = result ? result.styleLabel : (history[0]?.style || 'Generated photo');
  const studioPersonalizeOptions: StudioPersonalizeOptions | null = sourceMediaUrl
    ? {
        originStudio: 'photo-studio',
        studioProjectId: `${brandId || 'no-brand'} : ${categoryId} : ${sourceMediaUrl.split('/').pop()}`,
        title: sourceLabel,
        category: 'photo-studio',
        media: { mediaType: 'image', url: sourceMediaUrl, poster: null, aspectRatio: '1:1' },
        prompt: { text: found?.style.label || sourceLabel },
      }
    : null;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Photo Studio</h1>
            <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>Place your product in 30 studio-grade scenes — {PHOTO_CATEGORIES.length} categories × 5 styles</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="rounded-lg px-3 py-2 outline-none" style={panels.card}>
              <option value="">No brand</option>
              {brandRows.map((b) => <option key={b.id} value={b.id}>{b.brand_name || b.url}</option>)}
            </select>
            {studioPersonalizeOptions && (
              <PersonalizeVideoAction options={studioPersonalizeOptions} className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/70 hover:text-white hover:border-primary/60 transition-colors">
                Personalize
              </PersonalizeVideoAction>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {PHOTO_CATEGORIES.map((c) => (
            <button key={c.id} data-category={c.id} title={c.description} onClick={() => { setCategoryId(c.id); setStyleId(''); setAspect(''); }} className="px-4 py-2 rounded-lg text-sm font-medium transition" style={optionStyle(categoryId === c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="text-xs mb-3" style={{ color: semantic.textMuted }}>{category.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {category.styles.map((s) => (
            <button key={s.id} data-style={s.id} title={s.prompt} onClick={() => { setStyleId(s.id); setAspect(''); }} className="px-3 py-2 rounded-lg text-sm font-medium transition text-left" style={optionStyle(styleId === s.id)}>
              {s.label}
              <span className="block text-[10px] font-normal opacity-60">{s.aspect}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl p-4 mb-6 space-y-3" style={panels.glass}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: semantic.textLabel }}>Product photo</p>
          <div className="flex flex-wrap gap-3 items-center">
            <input type="url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="Product image URL" className="flex-1 min-w-[16rem] rounded-lg px-4 py-2 outline-none" style={panels.card} />
            <button onClick={() => fileRef.current?.click()} disabled={!hasKey || uploading} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50" style={buttons.ghost}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
          </div>
          {siteImages.length > 0 && (
            <div>
              <p className="text-xs mb-2" style={{ color: semantic.textMuted }}>Or pick an image found on the brand's site</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {siteImages.map((u) => (
                  <button key={u} onClick={() => setProductUrl(u)} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg" style={productUrl === u ? buttons.activePill : buttons.inactivePill}>
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <label className="text-xs" style={{ color: semantic.textLabel }}>Aspect
              <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="ml-2 rounded-lg px-2 py-1.5 outline-none" style={panels.card}>
                <option value="">Preset ({found?.style.aspect || '—'})</option>
                {ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="text-xs" style={{ color: semantic.textLabel }}>Resolution
              <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="ml-2 rounded-lg px-2 py-1.5 outline-none" style={panels.card}>
                {RESOLUTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <input value={direction} onChange={(e) => setDirection(e.target.value)} placeholder="Extra direction (optional)" className="flex-1 min-w-[12rem] rounded-lg px-3 py-1.5 text-sm outline-none" style={panels.card} />
          </div>
          {brand && <p className="text-xs" style={{ color: semantic.textMuted }}>Brand palette and logo of {brand.brand_name || brand.url} guide the scene.</p>}
        </div>

        {!hasKey && <p className="mb-3 text-sm" style={{ color: semantic.error }}>Add your MuAPI key in Settings to generate.</p>}
        <button data-action="generate" onClick={generate} disabled={loading || !styleId || !productUrl || !hasKey} className="mb-6 px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50" style={buttons.primary}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          Generate photoshoot
        </button>
        {error && <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: semantic.errorBg, border: `1px solid ${semantic.errorBorder}`, color: semantic.error }}>{error}</div>}

        {result && (
          <div className="rounded-xl p-6 mb-8" style={panels.glass}>
            <h3 className="text-lg font-semibold mb-4">{result.styleLabel} · {result.category}</h3>
            <img src={result.imageUrl} alt={result.styleLabel} className="max-h-96 mx-auto rounded-lg" />
            <div className="mt-4 flex gap-2">
              <a href={result.imageUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={buttons.ghost}><Download size={14} /> Open</a>
              {result.id && <Link href={`/animate?photoshoot_id=${result.id}`} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={buttons.ghost}><Film size={14} /> Animate</Link>}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent photoshoots</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {history.map((h) => (
                <div key={h.id} className="rounded-xl overflow-hidden" style={panels.card}>
                  {h.image_url && <img src={h.image_url} alt={h.style} className="w-full aspect-square object-cover" />}
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{h.style}</p>
                      <p className="text-xs" style={{ color: semantic.textSecondary }}>{h.category}</p>
                    </div>
                    <Link href={`/animate?photoshoot_id=${h.id}`} className="text-xs flex items-center gap-1" style={{ color: 'var(--color-primary)' }}><Film size={12} /> Animate</Link>
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
