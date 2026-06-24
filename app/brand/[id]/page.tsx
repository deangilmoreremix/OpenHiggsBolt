'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Check, Plus, X } from 'lucide-react';
import { panels, buttons, semantic, appWrapper, optionStyle } from '@/shared/styles/designTokens';

type Brand = {
  id: string;
  url: string;
  brand_name: string;
  industry: string;
  tagline: string;
  value_proposition: string;
  target_audience: string;
  tone_of_voice: string;
  brand_personality: string;
  key_messages: string;
  primary_colors: string;
  secondary_colors: string;
  fonts: string;
  imagery_style: string;
  layout_style: string;
  logo_url: string;
  screenshot_url: string;
};

export default function BrandPage() {
  const params = useParams();
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    brand_name: '',
    industry: '',
    tagline: '',
    value_proposition: '',
    target_audience: '',
    tone_of_voice: [] as string[],
    brand_personality: [] as string[],
    key_messages: [] as string[],
    primary_colors: [] as string[],
    secondary_colors: [] as string[],
    fonts: [] as string[],
    imagery_style: '',
    layout_style: '',
    logo_url: '',
  });

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    fetch(`/api/brand?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBrand(data);
        setForm({
          brand_name: data.brand_name || '',
          industry: data.industry || '',
          tagline: data.tagline || '',
          value_proposition: data.value_proposition || '',
          target_audience: data.target_audience || '',
          tone_of_voice: (data.tone_of_voice || '').split(',').map((s) => s.trim()).filter(Boolean),
          brand_personality: (data.brand_personality || '').split(',').map((s) => s.trim()).filter(Boolean),
          key_messages: (data.key_messages || '').split(',').map((s) => s.trim()).filter(Boolean),
          primary_colors: (data.primary_colors || '').split(',').map((s) => s.trim()).filter(Boolean),
          secondary_colors: (data.secondary_colors || '').split(',').map((s) => s.trim()).filter(Boolean),
          fonts: (data.fonts || '').split(',').map((s) => s.trim()).filter(Boolean),
          imagery_style: data.imagery_style || '',
          layout_style: data.layout_style || '',
          logo_url: data.logo_url || '',
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const save = async () => {
    if (!params.id) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...form,
        tone_of_voice: form.tone_of_voice.join(', '),
        brand_personality: form.brand_personality.join(', '),
        key_messages: form.key_messages.join(', '),
        primary_colors: form.primary_colors.join(', '),
        secondary_colors: form.secondary_colors.join(', '),
        fonts: form.fonts.join(', '),
      };
      const res = await fetch(`/api/brand?id=${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setBrand(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ ...appWrapper, color: semantic.textSecondary }}>
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen p-6" style={{ ...appWrapper, color: semantic.error }}>
        {error || 'Brand not found'}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={appWrapper}>
      <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: 'var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/brand-studio')} className="p-2 rounded-lg hover:opacity-80" style={buttons.ghost}>
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              {form.primary_colors[0] && (
                <div className="w-5 h-5 rounded-full border border-white/10" style={{ background: form.primary_colors[0] }} />
              )}
              <h1 className="text-lg font-semibold">{form.brand_name || 'Brand DNA'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/brand/${params.id}/campaigns/new`)} className="px-4 py-2 rounded-lg text-sm font-medium" style={buttons.ghost}>
              Create Campaign
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50" style={buttons.primary}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="p-4 rounded-lg text-sm" style={{ background: semantic.errorBg, border: `1px solid ${semantic.errorBorder}`, color: semantic.error }}>{error}</div>
        </div>
      )}

      {brand.screenshot_url && (
        <div className="w-full h-48">
          <img src={brand.screenshot_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="rounded-xl p-6" style={panels.glass}>
              <h2 className="text-base font-semibold mb-4">Core Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Brand Name" value={form.brand_name} onChange={(v) => update('brand_name', v)} />
                <Field label="Industry" value={form.industry} onChange={(v) => update('industry', v)} />
                <Field label="Tagline" value={form.tagline} onChange={(v) => update('tagline', v)} />
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>Value Proposition</label>
                <textarea value={form.value_proposition} onChange={(e) => update('value_proposition', e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} />
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>Target Audience</label>
                <textarea value={form.target_audience} onChange={(e) => update('target_audience', e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} />
              </div>
            </section>

            <section className="rounded-xl p-6" style={panels.glass}>
              <h2 className="text-base font-semibold mb-4">Voice & Personality</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ChipEditor label="Tone of Voice" values={form.tone_of_voice} onChange={(v) => update('tone_of_voice', v)} />
                <ChipEditor label="Personality" values={form.brand_personality} onChange={(v) => update('brand_personality', v)} />
                <ChipEditor label="Key Messages" values={form.key_messages} onChange={(v) => update('key_messages', v)} />
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-xl p-6" style={panels.glass}>
              <h2 className="text-base font-semibold mb-4">Colors</h2>
              <ColorList label="Primary" values={form.primary_colors} onChange={(v) => update('primary_colors', v)} />
              <ColorList label="Secondary" values={form.secondary_colors} onChange={(v) => update('secondary_colors', v)} />
            </section>

            <section className="rounded-xl p-6" style={panels.glass}>
              <ChipEditor label="Fonts" values={form.fonts} onChange={(v) => update('fonts', v)} />
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>Imagery Style</label>
                <input value={form.imagery_style} onChange={(e) => update('imagery_style', e.target.value)} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} />
              </div>
              {form.logo_url && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>Logo</label>
                  <img src={form.logo_url} alt="logo" className="max-h-24 object-contain" />
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`/brand/${params.id}/campaigns/new`} className="px-3 py-2 rounded-lg text-sm font-medium" style={buttons.ghost}>Create Campaign</a>
                 <a href={`/photo-studio?brand_id=${params.id}`} className="px-3 py-2 rounded-lg text-sm font-medium" style={buttons.ghost}>Photo Studio</a>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg px-3 py-2 outline-none" style={panels.card} />
    </div>
  );
}

function ChipEditor({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft('');
  };
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: semantic.textLabel }}>{label}</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((v, i) => (
          <span key={`${v}-${i}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={buttons.inactivePill}>
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} style={{ color: semantic.textMuted }}><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Add..." className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none" style={panels.card} />
        <button onClick={add} className="px-3 py-1.5 rounded-lg" style={buttons.ghost}><Plus size={16} /></button>
      </div>
    </div>
  );
}

function ColorList({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('#');
  const add = () => {
    const v = draft.trim();
    if (!/^#[0-9a-f]{6}$/i.test(v)) return;
    if (values.includes(v)) return;
    onChange([...values, v]);
    setDraft('#');
  };
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: semantic.textLabel }}>{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((c, i) => (
          <div key={`${c}-${i}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={panels.card}>
            <input type="color" value={c} onChange={(e) => onChange(values.map((x, j) => j === i ? e.target.value : x))} className="h-6 w-6 rounded border-0 bg-transparent p-0 cursor-pointer" />
            <span className="text-xs font-mono">{c}</span>
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} style={{ color: semantic.textMuted }}><X size={12} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="color" value={draft} onChange={(e) => setDraft(e.target.value)} className="h-9 w-12 rounded cursor-pointer border-0 bg-transparent p-1" style={panels.card} />
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} className="flex-1 rounded-lg px-3 py-1.5 text-sm font-mono outline-none" style={panels.card} />
        <button onClick={add} className="px-3 py-1.5 rounded-lg" style={buttons.ghost}><Plus size={16} /></button>
      </div>
    </div>
  );
}
