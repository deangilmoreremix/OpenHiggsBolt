'use client'
import { useCallback, useEffect } from 'react'
import type { VideoDemo } from '@/data/types'

const VIDEO_DEMO_CREATE_TARGETS = [
  { id: 'video', label: 'Video Studio' },
  { id: 'cinema', label: 'Cinema Studio' },
] as const

type TargetId = typeof VIDEO_DEMO_CREATE_TARGETS[number]['id']

export interface VideoCreateTargetPickerProps {
  demo: VideoDemo
  onClose: () => void
}

export function VideoCreateTargetPicker({ demo, onClose }: VideoCreateTargetPickerProps) {
  const handleSelect = useCallback(
    (target: TargetId) => {
      if (!demo.sourceRepo) {
        throw new Error(`VideoDemo missing sourceRepo for slug: ${demo.slug}`)
      }
      const templateId = `${demo.sourceRepo}|${demo.slug}`
      const url = `/studio/${target}?template=${encodeURIComponent(templateId)}`
      window.location.href = url
    },
    [demo],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Open in studio"
      className="fixed inset-0 z-[110] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 p-4"
        style={{ background: 'var(--bg-panel)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-white mb-3">Open in...</p>
        <div className="flex flex-col gap-2">
          {VIDEO_DEMO_CREATE_TARGETS.map((target) => (
            <button
              key={target.id}
              onClick={() => handleSelect(target.id)}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors"
            >
              {target.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
