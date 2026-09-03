/**
 * Featured Section
 * ------------------------------------------------------------------
 * Horizontal scrollable row of featured prompts.
 * Shows the top curated prompts for the current niche or across the whole feed.
 */

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { semantic } from '@/shared/styles/designTokens'
import type { PromptRecord } from '@/types/go-ai-viral/prompt'

export interface FeaturedSectionProps {
  records: PromptRecord[]
  onSelect: (record: PromptRecord) => void
  selectedId?: string
  /** Optional card renderer; falls back to a simple preview if omitted. */
  renderCard?: (record: PromptRecord) => React.ReactNode
}

export function FeaturedSection({ records, onSelect, selectedId, renderCard }: FeaturedSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const featured = records.filter((r) => r.isFeatured)

  if (featured.length === 0) return null

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 400
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles size={14} style={{ color: semantic.activeAccent }} />
          Featured
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="rounded-lg p-1.5 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: semantic.textSecondary,
            }}
            aria-label="Scroll featured left"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="rounded-lg p-1.5 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: semantic.textSecondary,
            }}
            aria-label="Scroll featured right"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {featured.map((record) => (
          <div key={record.id} style={{ minWidth: '280px', maxWidth: '320px', scrollSnapAlign: 'start' }}>
            {renderCard ? (
              renderCard(record)
            ) : (
              <button
                onClick={() => onSelect(record)}
                className="w-full text-left rounded-xl border p-3 transition-all"
                style={{
                  border: selectedId === record.id ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                  background: selectedId === record.id ? 'rgba(34,211,238,0.03)' : 'var(--bg-card)',
                }}
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-white/5 mb-2">
                  <img
                    src={record.media?.[0]?.previewUrl || ''}
                    alt={record.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-sm font-medium text-white line-clamp-1">{record.title}</p>
                <p className="text-xs text-white/40 mt-1 line-clamp-2">{record.prompt.slice(0, 120)}</p>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
