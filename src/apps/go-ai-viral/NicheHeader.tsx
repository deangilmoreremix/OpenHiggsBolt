/**
 * Niche Header
 * ------------------------------------------------------------------
 * Displays the currently selected niche with description and count.
 * Also shows quick-filter chips for sub-niches when available.
 */

import { Sparkles } from 'lucide-react'
import { semantic } from '@/shared/styles/designTokens'
import type { NicheItem } from './NicheNavigation'

export interface NicheHeaderProps {
  /** Currently selected niche, or null for "All Niches". */
  selectedNiche: NicheItem | null
  /** Number of prompts matching the current selection. */
  promptCount: number
  /** Optional sub-niche filters to show as chips. */
  subNiches?: NicheItem[]
  /** Currently selected sub-niche ids. */
  selectedSubNiches: string[]
  /** Callback when a sub-niche is toggled. */
  onToggleSubNiche: (subNicheId: string) => void
  /** Callback to clear all filters. */
  onClearFilters: () => void
}

export function NicheHeader({
  selectedNiche,
  promptCount,
  subNiches = [],
  selectedSubNiches,
  onToggleSubNiche,
  onClearFilters,
}: NicheHeaderProps) {
  const isAll = !selectedNiche

  return (
    <div className="mb-6 space-y-4">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {!isAll && <Sparkles size={18} style={{ color: semantic.activeAccent }} />}
            {isAll ? 'All Niches' : selectedNiche.label}
          </h2>
          <p className="text-sm mt-1" style={{ color: semantic.textSecondary }}>
            {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'} available
          </p>
        </div>

        {!isAll && (
          <button
            onClick={onClearFilters}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: semantic.textSecondary,
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Sub-niche chips */}
      {subNiches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subNiches.map((sub) => {
            const isSelected = selectedSubNiches.includes(sub.id)
            return (
              <button
                key={sub.id}
                onClick={() => onToggleSubNiche(sub.id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: isSelected
                    ? 'rgba(34,211,238,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  color: isSelected ? 'var(--color-primary)' : semantic.textSecondary,
                }}
              >
                {sub.label}
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isSelected
                      ? 'rgba(34,211,238,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    color: isSelected
                      ? 'var(--color-primary)'
                      : semantic.textMuted,
                  }}
                >
                  {sub.count}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
