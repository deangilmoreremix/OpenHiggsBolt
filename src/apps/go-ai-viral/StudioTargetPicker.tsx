'use client'
import { emitSendTo, TARGET_LABEL, VIRAL_TARGETS_BY_MEDIA, type StudioTarget, type ViralSourceMedia, type CreateViralHandoffOptions } from '../../shared/crossStudio'

export interface StudioTargetPickerProps {
  mediaType: ViralSourceMedia | null | undefined
  onClose: () => void
  onSelectTarget?: (target: StudioTarget, record: CreateViralHandoffOptions['record']) => void
  record?: CreateViralHandoffOptions['record']
}

export function StudioTargetPicker({ mediaType, onClose, onSelectTarget, record }: StudioTargetPickerProps) {
  const targets = (mediaType && VIRAL_TARGETS_BY_MEDIA[mediaType]) || VIRAL_TARGETS_BY_MEDIA.video

  const handleSelect = (target: StudioTarget) => {
    if (onSelectTarget && record) {
      onSelectTarget(target, record)
    } else {
      emitSendTo(target)
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Open in studio"
      className="fixed inset-0 z-[60] flex items-center justify-center"
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
          {targets.map((target) => (
            <button
              key={target}
              onClick={() => handleSelect(target)}
              className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors"
            >
              {TARGET_LABEL[target]}
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
