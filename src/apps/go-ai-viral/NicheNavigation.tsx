/**
 * Niche Navigation
 * ------------------------------------------------------------------
 * Sidebar section for browsing prompts by business niche.
 *
 * Shows:
 * - "All Niches" entry with total count
 * - Grouped niche list with counts
 * - Active state highlighting
 */

import { Grid } from 'lucide-react'
import { optionStyle } from '@/shared/styles/designTokens'

export interface NicheItem {
  id: string
  label: string
  count: number
}

export interface NicheNavigationProps {
  /** All available niches from the API meta. */
  niches: NicheItem[]
  /** Currently selected niche id. 'all' means no niche filter. */
  selectedNiche: string
  /** Callback when a niche is selected. */
  onSelectNiche: (nicheId: string) => void
  /** Total number of prompts across all niches. */
  totalPrompts: number
}

export function NicheNavigation({
  niches,
  selectedNiche,
  onSelectNiche,
  totalPrompts,
}: NicheNavigationProps) {
  return (
    <div className="space-y-1">
      {/* All Niches */}
      <button
        onClick={() => onSelectNiche('all')}
        className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
        style={optionStyle(selectedNiche === 'all')}
      >
        <span className="flex items-center gap-2">
          <Grid size={14} />
          <span>All Niches</span>
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{
            background: selectedNiche === 'all'
              ? 'rgba(34,211,238,0.2)'
              : 'rgba(255,255,255,0.05)',
            color: selectedNiche === 'all'
              ? 'var(--color-primary)'
              : 'var(--text-muted)',
          }}
        >
          {totalPrompts}
        </span>
      </button>

      {/* Divider */}
      <div className="h-px bg-white/5 my-2" />

      {/* Niche list */}
      <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
        {niches.map((niche) => (
          <button
            key={niche.id}
            onClick={() => onSelectNiche(niche.id)}
            className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all capitalize"
            style={optionStyle(selectedNiche === niche.id)}
          >
            <span>{niche.label}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: selectedNiche === niche.id
                  ? 'rgba(34,211,238,0.2)'
                  : 'rgba(255,255,255,0.05)',
                color: selectedNiche === niche.id
                  ? 'var(--color-primary)'
                  : 'var(--text-muted)',
              }}
            >
              {niche.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
