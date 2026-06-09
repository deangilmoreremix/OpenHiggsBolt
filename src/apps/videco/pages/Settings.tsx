import { useEffect, useState } from 'react'
import { Settings, Palette, Save, Loader, Eye, Link as LinkIcon, Copy, CheckCircle, Globe } from 'lucide-react'

interface BrandKit {
  primary_color: string
  secondary_color: string
  primary_text_color: string
  secondary_text_color: string
  cta_text: string
  logo_url: string
}

const DEFAULT_BRAND: BrandKit = {
  primary_color: '#22d3ee',
  secondary_color: '#a855f7',
  primary_text_color: '#ffffff',
  secondary_text_color: '#a1a1aa',
  cta_text: 'Learn More',
  logo_url: '',
}

export default function SettingsPage() {
  const [brand, setBrand] = useState<BrandKit>(DEFAULT_BRAND)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadBrandKit() {
      try {
        const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-brand-kit?tenant_id=default`
        const response = await fetch(fnUrl)
        if (response.ok) {
          const result = await response.json()
          if (result.brand_kit) {
            setBrand({
              primary_color: result.brand_kit.primary_color ?? DEFAULT_BRAND.primary_color,
              secondary_color: result.brand_kit.secondary_color ?? DEFAULT_BRAND.secondary_color,
              primary_text_color: result.brand_kit.primary_text_color ?? DEFAULT_BRAND.primary_text_color,
              secondary_text_color: result.brand_kit.secondary_text_color ?? DEFAULT_BRAND.secondary_text_color,
              cta_text: result.brand_kit.cta_text ?? DEFAULT_BRAND.cta_text,
              logo_url: result.brand_kit.logo_url ?? DEFAULT_BRAND.logo_url,
            })
          }
        }
      } catch (err) {
        console.error('Failed to load brand kit:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBrandKit()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-brand-kit`
      await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: 'default', ...brand }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save brand kit:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="animate-spin text-cyan-400" size={32} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-secondary mt-1">Manage your account, brand kit, and preferences</p>
      </div>

      {/* Brand Kit */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette size={20} className="text-cyan-400" />
          Brand Kit
        </h2>
        <p className="text-secondary text-sm mb-6">Customize the look and feel of your video embed pages and CTAs</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-2 block">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brand.primary_color}
                onChange={(e) => setBrand({ ...brand, primary_color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-border-color cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={brand.primary_color}
                onChange={(e) => setBrand({ ...brand, primary_color: e.target.value })}
                className="flex-1 px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm font-mono focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-2 block">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brand.secondary_color}
                onChange={(e) => setBrand({ ...brand, secondary_color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-border-color cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={brand.secondary_color}
                onChange={(e) => setBrand({ ...brand, secondary_color: e.target.value })}
                className="flex-1 px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm font-mono focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-2 block">Primary Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brand.primary_text_color}
                onChange={(e) => setBrand({ ...brand, primary_text_color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-border-color cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={brand.primary_text_color}
                onChange={(e) => setBrand({ ...brand, primary_text_color: e.target.value })}
                className="flex-1 px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm font-mono focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-2 block">Secondary Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brand.secondary_text_color}
                onChange={(e) => setBrand({ ...brand, secondary_text_color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-border-color cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={brand.secondary_text_color}
                onChange={(e) => setBrand({ ...brand, secondary_text_color: e.target.value })}
                className="flex-1 px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm font-mono focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-2 block">CTA Button Text</label>
            <input
              type="text"
              value={brand.cta_text}
              onChange={(e) => setBrand({ ...brand, cta_text: e.target.value })}
              className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-secondary font-semibold uppercase tracking-wider mb-2 block">Logo URL</label>
            <input
              type="url"
              value={brand.logo_url}
              onChange={(e) => setBrand({ ...brand, logo_url: e.target.value })}
              placeholder="https://your-logo.png"
              className="w-full px-3 py-2 bg-bg-card border border-border-color rounded-lg text-white text-sm placeholder:text-muted focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 p-4 bg-bg-card rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={14} className="text-muted" />
            <span className="text-xs text-secondary font-semibold uppercase tracking-wider">Preview</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: brand.secondary_color + '20' }}>
            {brand.logo_url && <img src={brand.logo_url} alt="Logo" className="w-8 h-8 rounded object-contain" />}
            <span className="font-medium" style={{ color: brand.primary_text_color }}>Your Brand</span>
            <button
              className="ml-auto px-4 py-1.5 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: brand.primary_color, color: '#000' }}
            >
              {brand.cta_text}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            Save Brand Kit
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-400">
              <CheckCircle size={14} />
              Saved!
            </span>
          )}
        </div>
      </div>

      {/* API Key */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <LinkIcon size={20} className="text-cyan-400" />
          API Key
        </h2>
        <p className="text-secondary text-sm mb-4">Use this API key to access the VideoCo API programmatically</p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter or generate your API key"
              className="w-full px-3 py-2 pr-20 bg-bg-card border border-border-color rounded-lg text-white text-sm font-mono focus:border-cyan-500/50 focus:outline-none"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-secondary hover:text-white transition-colors"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            onClick={handleCopyKey}
            disabled={!apiKey}
            className="px-3 py-2 bg-bg-card border border-border-color rounded-lg text-secondary hover:text-cyan-400 disabled:opacity-50 transition-colors"
          >
            {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel rounded-xl p-6 border-red-500/20">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-secondary text-sm mb-4">Irreversible actions</p>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-red-500/10 text-red-400 font-medium rounded-lg hover:bg-red-500/20 transition-colors text-sm">
            Reset All Data
          </button>
          <button className="px-4 py-2 bg-red-500/10 text-red-400 font-medium rounded-lg hover:bg-red-500/20 transition-colors text-sm">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
