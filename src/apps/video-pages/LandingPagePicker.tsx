'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { normalizeVideo } from '@/src/lib/landingPages/handoff.js'

export type PickedPage = { id: string; url: string; published: boolean; page: any }
export type PickerRequest = {
  /** The video to attach: anything normalizeVideo accepts (url + optional name/thumbnail_url/studio). */
  video?: Record<string, unknown> | null
  /** Called once the user saved a page from a design. */
  onPick?: (picked: PickedPage) => void
  onClose?: () => void
}

const Modal = dynamic(() => import('./LandingPagePickerModal'), { ssr: false })

type Ctx = { open: (req: PickerRequest) => void }
const PickerContext = createContext<Ctx>({ open: () => {} })

/** Mount once near the app root. `openStudio` navigates to the Video Pages studio. */
export function LandingPagePickerProvider({ children, openStudio }: { children: ReactNode; openStudio?: () => void }) {
  const [req, setReq] = useState<PickerRequest | null>(null)
  const reqRef = useRef<PickerRequest | null>(null)
  const open = useCallback((r: PickerRequest) => { reqRef.current = r; setReq(r) }, [])
  const close = useCallback(() => { reqRef.current?.onClose?.(); reqRef.current = null; setReq(null) }, [])
  const value = useMemo(() => ({ open }), [open])
  return (
    <PickerContext.Provider value={value}>
      {children}
      {req ? <Modal video={normalizeVideo({ kind: 'video', ...(req.video || {}) })} onPick={req.onPick} onClose={close} openStudio={openStudio} /> : null}
    </PickerContext.Provider>
  )
}

export const useLandingPagePicker = () => useContext(PickerContext)

/** Button for any studio's finished video. Renders nothing when there is no https video to attach. */
export function LandingPageAction({ video, className, children }: { video: Record<string, unknown>; className?: string; children?: ReactNode }) {
  const { open } = useLandingPagePicker()
  if (!normalizeVideo({ kind: 'video', ...video })) return null
  return (
    <button type="button" className={className} onClick={() => open({ video })}>
      {children ?? 'Landing page'}
    </button>
  )
}
