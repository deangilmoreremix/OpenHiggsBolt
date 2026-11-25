'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import VideoPagesStudio from './VideoPagesStudio'
import { ui } from './ui'

/** "My pages" in a window: your saved landing pages (open, edit, publish, share, analytics). Video Pages has no studio page of its own. */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

export default function MyPagesModal({ onClose }: { onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.body.style.overflow
    const opener = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    root.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      const picker = document.querySelector('[data-landing-picker]')   // the picker is above this window: it owns Escape and Tab
      if (picker) return
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !root.current) return
      const nodes = Array.from(root.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null)
      if (!nodes.length) { e.preventDefault(); return }
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root.current)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); if (opener && opener.isConnected) opener.focus() }
  }, [onClose])

  const body = (
    <div data-my-pages className="fixed inset-0 z-[190] bg-black/80 backdrop-blur-xl flex items-center justify-center p-2 md:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label="My Video Pages" className="w-full max-w-7xl h-full max-h-[94vh] flex flex-col rounded-2xl border border-white/10 bg-panel-bg overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-white/5">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex-1">My Video Pages</h2>
          <button type="button" aria-label="Close" className={ui.ghost} onClick={onClose}><X size={14} /></button>
        </div>
        <div className="flex-1 min-h-0">
          <VideoPagesStudio embedded />
        </div>
      </div>
    </div>
  )
  return typeof document === 'undefined' ? null : createPortal(body, document.body)
}
