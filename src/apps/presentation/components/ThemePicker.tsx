import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import {
  themes,
  type ThemeName,
  type ThemeProperties,
} from '@/apps/presentation/lib/themes'

interface ThemePickerProps {
  value: ThemeName
  onChange: (theme: ThemeName) => void
}

export default function ThemePicker({ value, onChange }: ThemePickerProps) {
  const themeList = Object.values(themes)
  const [mode, setMode] = useState<'all' | 'light' | 'dark'>('all')
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered = themeList.filter((theme) =>
    mode === 'all' ? true : theme.mode === mode,
  )

  useEffect(() => {
    if (!scrollRef.current) return
    const selected = scrollRef.current.querySelector('[data-selected="true"]')
    selected?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [value])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(['all', 'light', 'dark'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              mode === m
                ? 'bg-primary text-black'
                : 'bg-bg-card text-secondary hover:text-white'
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => {
            scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-bg-card border border-border-color flex items-center justify-center text-secondary hover:text-white"
          aria-label="Scroll themes left"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-10 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filtered.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={theme.id === value}
              onClick={() => onChange(theme.id)}
            />
          ))}
        </div>

        <button
          onClick={() => {
            scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-bg-card border border-border-color flex items-center justify-center text-secondary hover:text-white"
          aria-label="Scroll themes right"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

interface ThemeCardProps {
  theme: ThemeProperties
  selected: boolean
  onClick: () => void
}

function ThemeCard({ theme, selected, onClick }: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-selected={selected}
      className={`relative shrink-0 w-32 text-left rounded-xl border-2 transition-all overflow-hidden ${
        selected ? 'border-primary scale-105' : 'border-border-color hover:border-secondary'
      }`}
      aria-pressed={selected}
    >
      <div
        className="h-20 p-3 flex flex-col justify-end"
        style={{ background: theme.background, color: theme.colors.text }}
      >
        <div
          className="text-sm font-bold truncate"
          style={{ color: theme.colors.heading, fontFamily: theme.fonts.heading }}
        >
          {theme.name}
        </div>
        <div className="text-[10px] opacity-70 truncate">{theme.description}</div>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-black flex items-center justify-center">
          <Check size={12} />
        </div>
      )}
    </button>
  )
}
