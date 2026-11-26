'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { normalizeVideo } from '@/src/lib/landingPages/handoff.js'

export type PickedPage = { id: string; url: string; published: boolean; page: any; contacts?: any[]; contactError?: string }
export type PickerRequest = {
  /** The video to attach: anything normalizeVideo accepts (url + optional name/thumbnail_url/studio). */
  video?: Record<string, unknown> | null
  /** People you already have (e.g. imported contacts); listed first as customers. */
  customers?: any[]
  preselect?: 'active' | 'all'
  /** Called once the user saved a page from a design. */
  onPick?: (picked: PickedPage) => void
  onClose?: () => void
}

const Modal = dynamic(() => import('./LandingPagePickerModal'), { ssr: false })
const MyPagesModal = dynamic(() => import('./MyPagesModal'), { ssr: false })

/** Any button anywhere can open these windows with window.dispatchEvent(new CustomEvent(OPEN_VIDEO_PAGES_EVENT, { detail: { my: true } })). */
export const OPEN_VIDEO_PAGES_EVENT = 'video-pages:open'

type Ctx = { open: (req: PickerRequest) => void; openMyPages: () => void }
const PickerContext = createContext<Ctx>({ open: () => {}, openMyPages: () => {} })

/** Mount once near the app root. Video Pages is two windows, not a studio: the page picker + editor, and "My pages". */
export function LandingPagePickerProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<PickerRequest | null>(null)
  const [myPages, setMyPages] = useState(false)
  const [session, setSession] = useState(0)   // a new picker request gets a fresh picker (its own video, not the previous request's)
  const reqRef = useRef<PickerRequest | null>(null)
  const open = useCallback((r: PickerRequest) => { reqRef.current = r; setSession((n) => n + 1); setReq(r) }, [])
  const close = useCallback(() => { reqRef.current?.onClose?.(); reqRef.current = null; setReq(null) }, [])
  const openMyPages = useCallback(() => setMyPages(true), [])
  const closeMyPages = useCallback(() => setMyPages(false), [])
  const value = useMemo(() => ({ open, openMyPages }), [open, openMyPages])
  useEffect(() => {
    const onOpen = (e: Event) => { if ((e as CustomEvent).detail?.my) setMyPages(true); else open({}) }
    window.addEventListener(OPEN_VIDEO_PAGES_EVENT, onOpen)
    // an old /studio/video-pages link or bookmark: land on the studio the page sits in and open My pages
    if (window.location.pathname.replace(/\/+$/, '').endsWith('/studio/video-pages')) { window.history.replaceState(null, '', '/studio/image'); setMyPages(true) }
    return () => window.removeEventListener(OPEN_VIDEO_PAGES_EVENT, onOpen)
  }, [open])
  // the picker closed while My pages stays open: its focused element is gone, so hand focus back to the My pages dialog
  useEffect(() => { if (!req && myPages) document.querySelector<HTMLElement>('[data-my-pages] [role="dialog"]')?.focus() }, [req, myPages])
  return (
    <PickerContext.Provider value={value}>
      {children}
      {req ? <Modal key={session} video={normalizeVideo({ kind: (req.video as any)?.source?.kind === 'image' ? 'image' : 'video', ...(req.video || {}) }, { allowImage: true })} customers={req.customers} preselect={req.preselect} onPick={req.onPick} onClose={close} openStudio={() => setMyPages(true)} /> : null}
      {myPages ? <MyPagesModal onClose={closeMyPages} /> : null}
    </PickerContext.Provider>
  )
}

export const useLandingPagePicker = () => useContext(PickerContext)

/** Button for any studio's finished video. Renders nothing when there is no https video to attach. */
export function LandingPageAction({ video, className, children }: { video: Record<string, unknown>; className?: string; children?: ReactNode }) {
  const { open } = useLandingPagePicker()
  if (!normalizeVideo({ kind: 'video', ...video }, { allowImage: true })) return null
  return (
    <button type="button" className={className} onClick={() => open({ video })}>
      {children ?? 'Landing page'}
    </button>
  )
}
