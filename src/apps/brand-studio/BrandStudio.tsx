'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Sparkles,
  Image,
  Film,
  Camera,
  BarChart3,
  Palette,
  Loader2,
  Plus,
  X,
  ChevronRight,
  Download,
  RefreshCw,
  Upload,
  Check,
} from 'lucide-react';
import { panels, buttons, semantic, appWrapper, optionStyle } from '@/shared/styles/designTokens';
import { supabase } from '@/shared/api/supabase';

type View = 'HOME' | 'BRAND' | 'CAMPAIGN' | 'ASSET' | 'PHOTO' | 'ANIMATE';

type BrandDNA = {
  id: string;
  url: string;
  name: string;
  tagline: string;
  description: string;
  tone: string[];
  personality: string[];
  messages: string[];
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  fonts: string[];
  logo_url: string;
  screenshot_url: string;
  raw_colors: string[];
  created_at?: string;
};

type CampaignConcept = {
  title: string;
  concept: string;
  hook: string;
  angle: string;
  platforms: string[];
};

type Campaign = {
  id: string;
  brand_id: string;
  goal: string;
  direction: string;
  concepts: CampaignConcept[];
  created_at?: string;
};

type Asset = {
  id: string;
  brand_id: string;
  campaign_id: string;
  platform: string;
  concept_index: number;
  headline: string;
  body: string;
  cta: string;
  image_url: string;
  created_at?: string;
};

type Photoshoot = {
  id: string;
  brand_id: string;
  style: string;
  category: string;
  product_url: string;
  image_url: string;
  created_at?: string;
};

type Animation = {
  id: string;
  brand_id: string;
  source_url: string;
  video_url: string;
  resolution: string;
  duration: number;
  created_at?: string;
};

const GOALS = [
  { id: 'product_launch', label: 'Product Launch' },
  { id: 'lead_generation', label: 'Lead Generation' },
  { id: 'brand_awareness', label: 'Brand Awareness' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'thought_leadership', label: 'Thought Leadership' },
  { id: 'sales', label: 'Sales' },
];

const PLATFORMS = [
  { id: 'instagram_feed', label: 'Instagram Feed' },
  { id: 'instagram_story', label: 'Instagram Story' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook_ad', label: 'Facebook Ad' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'web_banner', label: 'Web Banner' },
  { id: 'email_header', label: 'Email Header' },
  { id: 'youtube_thumb', label: 'YouTube Thumbnail' },
];

const PHOTO_CATEGORIES: Record<string, string[]> = {
  'E-commerce': ['Studio White', 'Marble Clean', 'Dark Moody', 'Gradient Pop', 'Flat Lay'],
  'Lifestyle': ['Urban Street', 'Golden Hour', 'Cozy Interior', 'Scandi Living', 'Café Scene'],
  'Food & Beverage': ['Restaurant Plated', 'Rustic Table', 'Bright & Fresh', 'Dark Kitchen', 'Flat Lay Food'],
  'Tech & Electronics': ['Dark Techy', 'Clean Desk', 'Neon Glow', 'Blueprint', 'Holographic'],
  'Beauty & Fashion': ['Beauty Flat Lay', 'Skin Texture', 'Fashion Editorial', 'Pastel Minimal', 'Gold Luxury'],
  'Health & Wellness': ['Nature Organic', 'Spa Minimal', 'Active Sports', 'Clean Science', 'Sunrise Glow'],
};

const SIDEBAR_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'HOME', label: 'Home', icon: Globe },
  { id: 'BRAND', label: 'Brand DNA', icon: Palette },
  { id: 'CAMPAIGN', label: 'Campaigns', icon: BarChart3 },
  { id: 'ASSET', label: 'Assets', icon: Image },
  { id: 'PHOTO', label: 'Photo Studio', icon: Camera },
  { id: 'ANIMATE', label: 'Animate', icon: Film },
];

export default function BrandStudio({ apiKey }: { apiKey: string | null }) {
  const [view, setView] = useState<View>('HOME');
  const [brands, setBrands] = useState<BrandDNA[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandDNA | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Home
  const [url, setUrl] = useState('');

  // Brand DNA editing
  const [editedBrand, setEditedBrand] = useState<Partial<BrandDNA>>({});

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [goal, setGoal] = useState('product_launch');
  const [direction, setDirection] = useState('');

  // Assets
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Photo studio
  const [photoCategory, setPhotoCategory] = useState('E-commerce');
  const [photoStyle, setPhotoStyle] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string>('');
  const [shoots, setShoots] = useState<Photoshoot[]>([]);

  // Animate
  const [animSource, setAnimSource] = useState('');
  const [animResolution, setAnimResolution] = useState('720p');
  const [animDuration, setAnimDuration] = useState(5);
  const [animPrompt, setAnimPrompt] = useState('');
  const [animations, setAnimations] = useState<Animation[]>([]);

  const clearError = () => setError(null);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const { data, error: sbError } = await supabase
        .from('brand_dna')
        .select('*')
        .order('created_at', { ascending: false });
      if (sbError) throw sbError;
      setBrands((data as BrandDNA[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const loadCampaigns = useCallback(async (brandId: string) => {
    const { data } = await supabase
      .from('brand_campaigns')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });
    setCampaigns((data as Campaign[]) || []);
  }, []);

  const loadAssets = useCallback(async (brandId: string) => {
    const { data } = await supabase
      .from('brand_assets')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });
    setAssets((data as Asset[]) || []);
  }, []);

  const loadShoots = useCallback(async (brandId: string) => {
    const { data } = await supabase
      .from('brand_photoshoots')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });
    setShoots((data as Photoshoot[]) || []);
  }, []);

  const loadAnimations = useCallback(async (brandId: string) => {
    const { data } = await supabase
      .from('brand_animations')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });
    setAnimations((data as Animation[]) || []);
  }, []);

  const selectBrand = useCallback(
    async (brand: BrandDNA) => {
      setSelectedBrand(brand);
      setEditedBrand(brand);
      setView('BRAND');
      await Promise.all([
        loadCampaigns(brand.id),
        loadAssets(brand.id),
        loadShoots(brand.id),
        loadAnimations(brand.id),
      ]);
    },
    [loadCampaigns, loadAssets, loadShoots, loadAnimations]
  );

  const handleScrapeAndAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    clearError();
    try {
      const scrapeRes = await fetch('/api/brand-studio/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Scrape failed');

      const analyzeRes = await fetch('/api/brand-studio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: scrapeData.url,
          title: scrapeData.title,
          description: scrapeData.description,
          bodyText: scrapeData.bodyText,
          colors: scrapeData.colors,
          fonts: scrapeData.fonts,
          logos: scrapeData.logos,
          ogImage: scrapeData.ogImage,
        }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || 'Analyze failed');

      await loadBrands();
      await selectBrand(analyzeData);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze brand');
    } finally {
      setLoading(false);
    }
  };

  const saveBrand = async () => {
    if (!selectedBrand || !editedBrand) return;
    setLoading(true);
    clearError();
    try {
      const { data, error: sbError } = await supabase
        .from('brand_dna')
        .update(editedBrand)
        .eq('id', selectedBrand.id)
        .select()
        .single();
      if (sbError) throw sbError;
      setSelectedBrand(data as BrandDNA);
      await loadBrands();
    } catch (err: any) {
      setError(err.message || 'Failed to save brand');
    } finally {
      setLoading(false);
    }
  };

  const generateCampaign = async () => {
    if (!selectedBrand) return;
    setLoading(true);
    clearError();
    try {
      const res = await fetch('/api/brand-studio/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: selectedBrand.id, goal, direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Campaign generation failed');
      await loadCampaigns(selectedBrand.id);
      setSelectedCampaign(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate campaign');
    } finally {
      setLoading(false);
    }
  };

  const generateAsset = async (platform: string) => {
    if (!selectedBrand || !selectedCampaign) {
      setError('Select a brand and campaign first');
      return;
    }
    setSelectedPlatform(platform);
    setLoading(true);
    clearError();
    try {
      const res = await fetch('/api/brand-studio/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          campaignId: selectedCampaign.id,
          conceptIndex: 0,
          platform,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Asset generation failed');
      await loadAssets(selectedBrand.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate asset');
    } finally {
      setLoading(false);
      setSelectedPlatform(null);
    }
  };

  const generatePhoto = async () => {
    if (!selectedBrand || !photoStyle) {
      setError('Select a brand and photo style first');
      return;
    }
    setLoading(true);
    clearError();
    try {
      const res = await fetch('/api/brand-studio/photo-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          category: photoCategory,
          style: photoStyle,
          productImageUrl: productImage || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Photo generation failed');
      await loadShoots(selectedBrand.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate photo');
    } finally {
      setLoading(false);
    }
  };

  const generateAnimation = async () => {
    if (!selectedBrand || !animSource) {
      setError('Select a brand and provide an image source');
      return;
    }
    setLoading(true);
    clearError();
    try {
      const res = await fetch('/api/brand-studio/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          sourceUrl: animSource,
          resolution: animResolution,
          duration: animDuration,
          prompt: animPrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Animation generation failed');
      await loadAnimations(selectedBrand.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate animation');
    } finally {
      setLoading(false);
    }
  };

  const updateChipArray = (field: keyof BrandDNA, value: string[]) => {
    setEditedBrand((prev) => ({ ...prev, [field]: value }));
  };

  const updateField = (field: keyof BrandDNA, value: any) => {
    setEditedBrand((prev) => ({ ...prev, [field]: value }));
  };

  // ── Views ────────────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div className="space-y-6 p-6">
      <div className="rounded-xl p-6" style={panels.glass}>
        <h2 className="text-xl font-semibold mb-2">Brand Studio</h2>
        <p className="text-sm mb-4" style={{ color: semantic.textSecondary }}>
          Enter a website URL to scrape, analyze, and build a complete brand profile.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-lg px-4 py-3 outline-none"
            style={panels.card}
          />
          <button
            onClick={handleScrapeAndAnalyze}
            disabled={loading || !url.trim()}
            className="px-5 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            style={buttons.primary}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Analyze
          </button>
        </div>
      </div>

      <div className="rounded-xl p-6" style={panels.glass}>
        <h3 className="text-lg font-semibold mb-4">Recent Brands</h3>
        {brands.length === 0 ? (
          <p className="text-sm" style={{ color: semantic.textMuted }}>
            No brands yet. Analyze a URL to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => selectBrand(brand)}
                className="text-left rounded-xl p-4 transition hover:opacity-80"
                style={panels.card}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{brand.name || 'Untitled Brand'}</p>
                    <p className="text-xs truncate mt-1" style={{ color: semantic.textSecondary }}>
                      {brand.url}
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: semantic.textMuted }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBrandDNA = () => {
    if (!selectedBrand || !editedBrand.id) {
      return (
        <div className="p-6" style={{ color: semantic.textSecondary }}>
          Select a brand from Home to view Brand DNA.
        </div>
      );
    }
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Brand DNA</h2>
          <button
            onClick={saveBrand}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            style={buttons.primary}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Save
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 rounded-xl p-5" style={panels.glass}>
            <Label>Brand Name</Label>
            <input
              value={editedBrand.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg px-3 py-2 outline-none"
              style={panels.card}
            />
            <Label>Tagline</Label>
            <input
              value={editedBrand.tagline || ''}
              onChange={(e) => updateField('tagline', e.target.value)}
              className="w-full rounded-lg px-3 py-2 outline-none"
              style={panels.card}
            />
            <Label>Description</Label>
            <textarea
              value={editedBrand.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="w-full rounded-lg px-3 py-2 outline-none"
              style={panels.card}
            />
          </div>

          <div className="space-y-4 rounded-xl p-5" style={panels.glass}>
            <Label>Colors</Label>
            <div className="flex gap-4">
              <ColorField
                label="Primary"
                value={editedBrand.primary_color || '#000000'}
                onChange={(v) => updateField('primary_color', v)}
              />
              <ColorField
                label="Secondary"
                value={editedBrand.secondary_color || '#ffffff'}
                onChange={(v) => updateField('secondary_color', v)}
              />
              <ColorField
                label="Accent"
                value={editedBrand.accent_color || '#0066cc'}
                onChange={(v) => updateField('accent_color', v)}
              />
            </div>

            <Label>Logo URL</Label>
            <input
              value={editedBrand.logo_url || ''}
              onChange={(e) => updateField('logo_url', e.target.value)}
              className="w-full rounded-lg px-3 py-2 outline-none"
              style={panels.card}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChipEditor
            label="Tone of Voice"
            values={editedBrand.tone || []}
            onChange={(v) => updateChipArray('tone', v)}
          />
          <ChipEditor
            label="Personality"
            values={editedBrand.personality || []}
            onChange={(v) => updateChipArray('personality', v)}
          />
          <ChipEditor
            label="Key Messages"
            values={editedBrand.messages || []}
            onChange={(v) => updateChipArray('messages', v)}
          />
        </div>
      </div>
    );
  };

  const renderCampaigns = () => {
    if (!selectedBrand) {
      return (
        <div className="p-6" style={{ color: semantic.textSecondary }}>
          Select a brand from Home first.
        </div>
      );
    }
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl p-6" style={panels.glass}>
          <h2 className="text-xl font-semibold mb-4">Campaigns</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition"
                style={optionStyle(goal === g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <textarea
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="Optional direction..."
            rows={2}
            className="w-full rounded-lg px-3 py-2 outline-none mb-4"
            style={panels.card}
          />
          <button
            onClick={generateCampaign}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            style={buttons.primary}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Generate 4 Concepts
          </button>
        </div>

        {selectedCampaign && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCampaign.concepts?.map((concept, i) => (
              <div key={i} className="rounded-xl p-5" style={panels.card}>
                <p className="font-semibold text-lg">{concept.title}</p>
                <p className="text-sm mt-2" style={{ color: semantic.textSecondary }}>
                  {concept.concept}
                </p>
                <p className="text-sm mt-2" style={{ color: semantic.textMuted }}>
                  Hook: {concept.hook}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl p-6" style={panels.glass}>
          <h3 className="text-lg font-semibold mb-3">Past Campaigns</h3>
          {campaigns.length === 0 ? (
            <p className="text-sm" style={{ color: semantic.textMuted }}>
              No campaigns yet.
            </p>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaign(c)}
                  className="w-full text-left rounded-lg p-3 transition hover:opacity-80"
                  style={panels.card}
                >
                  <p className="font-medium">{GOALS.find((g) => g.id === c.goal)?.label || c.goal}</p>
                  {c.direction && (
                    <p className="text-xs mt-1" style={{ color: semantic.textSecondary }}>
                      {c.direction}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAssets = () => {
    if (!selectedBrand) {
      return (
        <div className="p-6" style={{ color: semantic.textSecondary }}>
          Select a brand from Home first.
        </div>
      );
    }
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl p-6" style={panels.glass}>
          <h2 className="text-xl font-semibold mb-2">Assets</h2>
          <p className="text-sm mb-4" style={{ color: semantic.textSecondary }}>
            {selectedCampaign
              ? `Generating for campaign: ${GOALS.find((g) => g.id === selectedCampaign.goal)?.label}`
              : 'Select a campaign in the Campaigns tab first.'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => generateAsset(p.id)}
                disabled={loading || !selectedCampaign}
                className="px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40"
                style={optionStyle(selectedPlatform === p.id)}
              >
                {loading && selectedPlatform === p.id ? (
                  <Loader2 size={14} className="inline animate-spin mr-1" />
                ) : null}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="rounded-xl overflow-hidden" style={panels.card}>
              {asset.image_url && (
                <img src={asset.image_url} alt={asset.headline} className="w-full aspect-video object-cover" />
              )}
              <div className="p-4">
                <p className="text-xs uppercase tracking-wide" style={{ color: semantic.textMuted }}>
                  {PLATFORMS.find((p) => p.id === asset.platform)?.label || asset.platform}
                </p>
                <p className="font-semibold mt-1">{asset.headline}</p>
                <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>
                  {asset.body}
                </p>
                <p className="text-sm mt-2 font-medium" style={{ color: semantic.textPrimary }}>
                  {asset.cta}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPhotoStudio = () => {
    if (!selectedBrand) {
      return (
        <div className="p-6" style={{ color: semantic.textSecondary }}>
          Select a brand from Home first.
        </div>
      );
    }
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl p-6" style={panels.glass}>
          <h2 className="text-xl font-semibold mb-4">Photo Studio</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(PHOTO_CATEGORIES).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setPhotoCategory(cat);
                  setPhotoStyle(null);
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
                style={optionStyle(photoCategory === cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
            {PHOTO_CATEGORIES[photoCategory].map((style) => (
              <button
                key={style}
                onClick={() => setPhotoStyle(style)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition"
                style={optionStyle(photoStyle === style)}
              >
                {style}
              </button>
            ))}
          </div>
          <input
            type="url"
            value={productImage}
            onChange={(e) => setProductImage(e.target.value)}
            placeholder="Product image URL (optional)"
            className="w-full rounded-lg px-3 py-2 outline-none mb-4"
            style={panels.card}
          />
          <button
            onClick={generatePhoto}
            disabled={loading || !photoStyle}
            className="px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            style={buttons.primary}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            Generate Photo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shoots.map((shoot) => (
            <div key={shoot.id} className="rounded-xl overflow-hidden" style={panels.card}>
              {shoot.image_url && (
                <img src={shoot.image_url} alt={shoot.style} className="w-full aspect-square object-cover" />
              )}
              <div className="p-4">
                <p className="font-medium">{shoot.style}</p>
                <p className="text-xs" style={{ color: semantic.textSecondary }}>
                  {shoot.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnimate = () => {
    if (!selectedBrand) {
      return (
        <div className="p-6" style={{ color: semantic.textSecondary }}>
          Select a brand from Home first.
        </div>
      );
    }
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl p-6" style={panels.glass}>
          <h2 className="text-xl font-semibold mb-4">Animate</h2>
          <input
            type="url"
            value={animSource}
            onChange={(e) => setAnimSource(e.target.value)}
            placeholder="Image URL to animate"
            className="w-full rounded-lg px-3 py-2 outline-none mb-4"
            style={panels.card}
          />
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <Label>Resolution</Label>
              <div className="flex gap-2 mt-1">
                {['480p', '720p', '1080p'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setAnimResolution(r)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
                    style={optionStyle(animResolution === r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Duration</Label>
              <div className="flex gap-2 mt-1">
                {[3, 5, 8, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => setAnimDuration(d)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
                    style={optionStyle(animDuration === d)}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          </div>
          <textarea
            value={animPrompt}
            onChange={(e) => setAnimPrompt(e.target.value)}
            placeholder="Motion prompt (optional)"
            rows={2}
            className="w-full rounded-lg px-3 py-2 outline-none mb-4"
            style={panels.card}
          />
          <button
            onClick={generateAnimation}
            disabled={loading || !animSource}
            className="px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            style={buttons.primary}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Film size={18} />}
            Generate Video
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {animations.map((anim) => (
            <div key={anim.id} className="rounded-xl overflow-hidden" style={panels.card}>
              {anim.video_url ? (
                <video src={anim.video_url} controls className="w-full" />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center" style={{ color: semantic.textMuted }}>
                  No video
                </div>
              )}
              <div className="p-4">
                <p className="text-sm font-medium">
                  {anim.resolution} · {anim.duration}s
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (view) {
      case 'HOME':
        return renderHome();
      case 'BRAND':
        return renderBrandDNA();
      case 'CAMPAIGN':
        return renderCampaigns();
      case 'ASSET':
        return renderAssets();
      case 'PHOTO':
        return renderPhotoStudio();
      case 'ANIMATE':
        return renderAnimate();
      default:
        return renderHome();
    }
  };

  return (
    <div className="h-full flex" style={appWrapper}>
      {/* Sidebar */}
      <aside className="w-16 md:w-56 flex-shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--border-color)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={iconBadgeStyle}>
              <Palette size={18} />
            </div>
            <span className="font-semibold hidden md:block">Brand Studio</span>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition"
                style={active ? { ...buttons.activePill } : { color: semantic.textSecondary }}
              >
                <Icon size={18} />
                <span className="hidden md:block">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {error && (
          <div
            className="m-6 p-4 rounded-lg flex items-start justify-between gap-3"
            style={{ background: semantic.errorBg, border: `1px solid ${semantic.errorBorder}` }}
          >
            <p className="text-sm" style={{ color: semantic.error }}>
              {error}
            </p>
            <button onClick={clearError} style={{ color: semantic.error }}>
              <X size={16} />
            </button>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: semantic.textLabel }}>{children}</p>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border-0 p-0"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg px-2 py-1.5 text-sm font-mono outline-none"
          style={panels.card}
        />
      </div>
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
    <div className="rounded-xl p-5" style={panels.glass}>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 mb-3">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
            style={buttons.inactivePill}
          >
            {v}
            <button
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              style={{ color: semantic.textMuted }}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add..."
          className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none"
          style={panels.card}
        />
        <button onClick={add} className="px-3 py-1.5 rounded-lg" style={buttons.ghost}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

const iconBadgeStyle = {
  background: 'var(--color-primary)',
  color: 'black',
};
