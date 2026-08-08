import { useMemo, useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import {
  STORYBOARD_MODELS,
  getStoryboardProviders,
  type StoryboardModel,
} from './models'
import ModelIcon from './ModelIcon'
import { panels, buttons, semantic, colors } from '@/shared/styles/designTokens'

interface ModelSelectorProps {
  value: string
  onChange: (id: string) => void
}

/**
 * Storyboard model selector. Mirrors the upstream ImageStudio model dropdown:
 * a provider sidebar (with logo tabs, letter-badge fallback), a search box, and
 * a scrollable list of models. Each model row and the provider tabs render their
 * provider icon via ModelIcon (PROVIDER_LOGOS → invert → letter-badge fallback).
 */
export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeProvider, setActiveProvider] = useState<string>('all')
  const ref = useRef<HTMLDivElement>(null)

  const providers = useMemo(() => getStoryboardProviders(), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return STORYBOARD_MODELS.filter((m) => {
      if (activeProvider !== 'all' && m.provider !== activeProvider) return false
      if (!q) return true
      return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
    })
  }, [search, activeProvider])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  const selected = STORYBOARD_MODELS.find((m) => m.id === value) || STORYBOARD_MODELS[0]

  const handleSelect = (m: StoryboardModel) => {
    onChange(m.id)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Selected model button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
        style={{ ...panels.card, color: 'white' }}
      >
        <span className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
          <ModelIcon provider={selected.provider} providerName={selected.provider_name} />
        </span>
        <span className="text-xs font-medium">{selected.name}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-50"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+8px)] left-0 z-50 rounded-xl shadow-2xl p-2 flex"
          style={{ ...panels.glass, border: '1px solid var(--glass-border)', width: 360, height: 360 }}
        >
          {/* Provider sidebar tabs */}
          <div className="w-14 flex-shrink-0 flex flex-col items-center gap-1.5 pr-2 border-r border-white/5 overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setActiveProvider('all')}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all"
              style={
                activeProvider === 'all'
                  ? buttons.activePill
                  : { ...buttons.ghost, color: semantic.textSecondary }
              }
              title="All providers"
            >
              ALL
            </button>
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveProvider(p.id)}
                className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-white/5 transition-all"
                style={
                  activeProvider === p.id
                    ? { border: `1px solid ${colors.primary}`, background: 'rgba(34,211,238,0.15)' }
                    : { border: '1px solid transparent' }
                }
                title={p.name}
              >
                <ModelIcon provider={p.id} providerName={p.name} rounded />
              </button>
            ))}
          </div>

          {/* Model list */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-1 pb-2">
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 bg-white/5 border border-white/5">
                <Search size={13} className="opacity-50" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search models..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none text-xs text-white focus:outline-none w-full p-0"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
              {filtered.length === 0 && (
                <p className="text-xs p-2" style={{ color: semantic.textMuted }}>
                  No models found.
                </p>
              )}
              {filtered.map((m) => {
                const isSelected = m.id === value
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-all border"
                    style={
                      isSelected
                        ? { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }
                        : { background: 'transparent', borderColor: 'transparent' }
                    }
                  >
                    <span className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                      <ModelIcon provider={m.provider} providerName={m.provider_name} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium text-white truncate">{m.name}</span>
                      <span className="block text-[10px] truncate" style={{ color: semantic.textMuted }}>
                        {m.provider_name}
                      </span>
                    </span>
                    {isSelected && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
