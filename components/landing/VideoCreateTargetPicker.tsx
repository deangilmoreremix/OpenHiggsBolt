'use client'
import { useCallback, useEffect, useRef } from 'react'
import type { VideoDemo } from '@/data/types'

const VIDEO_DEMO_CREATE_TARGETS = [
  { id: 'video', label: 'Video Studio' },
  { id: 'cinema', label: 'Cinema Studio' },
] as const

type TargetId = typeof VIDEO_DEMO_CREATE_TARGETS[number]['id']

export interface VideoCreateTargetPickerProps {
  demo: VideoDemo
  onClose: () => void
  triggerElement?: HTMLElement | null
}

export function VideoCreateTargetPicker({ demo, onClose, triggerElement }: VideoCreateTargetPickerProps) {
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

  const handleClose = useCallback(() => {
    triggerElement?.focus()
    onClose()
  }, [onClose, triggerElement])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [handleClose])

  useEffect(() => {
    const container = document.querySelector('[data-video-picker-container]')
    if (!container) return

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))

    const onTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || !container.contains(active)) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', onTab)
    return () => container.removeEventListener('keydown', onTab)
  }, [])

  useEffect(() => {
    const firstButton = document.querySelector('[data-video-create-target="video"]')
    if (firstButton instanceof HTMLElement) {
      firstButton.focus()
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Open in studio"
      className="fixed inset-0 z-[110] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={handleClose}
    >
      <div
        data-video-picker-container
        className="w-full max-w-sm rounded-2xl border border-white/10 p-4"
        style={{ background: 'var(--bg-panel)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-white mb-3">Open in...</p>
        <div className="flex flex-col gap-2">
          {VIDEO_DEMO_CREATE_TARGETS.map((target) => (
            <button
              key={target.id}
              data-video-create-target={target.id}
              onClick={() => handleSelect(target.id)}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors"
            >
              {target.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleClose}
          className="mt-3 w-full px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
