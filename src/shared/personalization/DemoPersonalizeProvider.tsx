/**
 * DemoPersonalizeProvider + useDemoPersonalize
 */

'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import PersonalizationModal from './PersonalizationModal'
import type { PersonalizationSource } from './types'
import { normalizePersonalizationSource } from './sourceNormalizer'

type OpenPersonalizeOptions = {
  source: unknown
  trigger?: HTMLElement | null
}

type DemoPersonalizeContextValue = {
  openPersonalize: (opts: OpenPersonalizeOptions) => void
  closePersonalize: () => void
}

const DemoPersonalizeContext = createContext<DemoPersonalizeContextValue | null>(null)

export function useDemoPersonalize(): DemoPersonalizeContextValue {
  const ctx = useContext(DemoPersonalizeContext)
  if (!ctx) throw new Error('useDemoPersonalize must be used within DemoPersonalizeProvider')
  return ctx
}

interface DemoPersonalizeProviderProps {
  apiKey?: string
  children: ReactNode
}

export function DemoPersonalizeProvider({ apiKey, children }: DemoPersonalizeProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [source, setSource] = useState<PersonalizationSource | null>(null)

  const openPersonalize = useCallback((opts: OpenPersonalizeOptions) => {
    const normalized = normalizePersonalizationSource(opts.source)
    if (normalized) {
      setSource(normalized)
      setIsOpen(true)
    }
  }, [])

  const closePersonalize = useCallback(() => {
    setIsOpen(false)
    setSource(null)
  }, [])

  const ctxValue: DemoPersonalizeContextValue = {
    openPersonalize,
    closePersonalize,
  }

  return (
    <DemoPersonalizeContext.Provider value={ctxValue}>
      {children}
      {isOpen && source && (
        <PersonalizationModal
          isOpen={isOpen}
          onClose={closePersonalize}
          source={source}
          apiKey={apiKey}
        />
      )}
    </DemoPersonalizeContext.Provider>
  )
}
