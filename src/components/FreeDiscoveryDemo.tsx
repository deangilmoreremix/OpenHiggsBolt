'use client'

/**
 * FreeDiscoveryDemo — thin landing entry point.
 *
 * This is the public marketing surface for the free discovery pipeline. It does
 * NOT implement discovery, research or any asset UI of its own: it opens the
 * ONE shared Personalization modal (src/shared/personalization) in anonymous
 * mode, where "Find My Brand" runs the free `POST /api/demo/discover` pipeline.
 * There is exactly one Personalization implementation.
 *
 * Architecture note: `app/demo/page.tsx` mounts the provider with
 * `access="anonymous"`, and the provider renders `<PersonalizationModal />` —
 * the same component the signed-in app renders. The only difference is the
 * `access` mode.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useDemoPersonalize } from '@/shared/personalization/DemoPersonalizeProvider'

/**
 * Synthetic source for the free run. `mediaType: 'prompt-only'` keeps the modal
 * on its prompt surface (no media to personalize — this is a discovery demo),
 * and `sourceMetadata.freeDiscovery` marks the session for the modal so paid
 * affordances stay hidden. `originalPrompt` is what the visitor reads first.
 */
const FREE_DISCOVERY_SOURCE = {
  id: 'free-discovery',
  title: 'Find My Brand',
  mediaType: 'prompt-only',
  sourceMedia: null,
  poster: null,
  shortPrompt:
    'Find My Brand — paste a business website and see the real logos, photos, products and branding already on it.',
  fullPrompt:
    'Find My Brand — paste a business website and see the real logos, photos, products and branding already on it. Nothing is generated and nothing is charged.',
  originalPrompt:
    'Find My Brand — paste a business website and see the real logos, photos, products and branding already on it. Nothing is generated and nothing is charged.',
  sourceType: 'landing-demo',
  sourceMetadata: { freeDiscovery: true },
} as const

export default function FreeDiscoveryDemo() {
  const { openPersonalize, isOpen } = useDemoPersonalize()
  const autoOpenedRef = useRef(false)

  // Open the SHARED modal in anonymous mode as soon as the landing surface is
  // mounted, so the visitor lands directly in the "Find My Brand" flow.
  useEffect(() => {
    if (autoOpenedRef.current) return
    autoOpenedRef.current = true
    openPersonalize({ source: FREE_DISCOVERY_SOURCE, access: 'anonymous' })
  }, [openPersonalize])

  const openModal = useCallback(() => {
    openPersonalize({ source: FREE_DISCOVERY_SOURCE, access: 'anonymous' })
  }, [openPersonalize])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0b0f14 0%, #10161d 55%, #0b0f14 100%)',
        color: '#e8edf2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: '#41d3f2',
          marginBottom: 14,
        }}
      >
        SmartVideo GO — Free Discovery
      </span>
      <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(28px, 5vw, 46px)', lineHeight: 1.1, fontWeight: 850 }}>
        Find My Brand
      </h1>
      <p style={{ margin: '0 0 26px', maxWidth: 560, fontSize: 15, lineHeight: 1.6, color: '#9aa7b4' }}>
        Paste a business website and SmartVideo reads the page it already has — the logo, photos,
        products and branding found on it, ready to review. Nothing is generated, nothing is charged,
        and nothing is saved.
      </p>
      <button
        type="button"
        onClick={openModal}
        data-testid="free-discovery-open"
        style={{
          minHeight: 48,
          padding: '0 26px',
          borderRadius: 12,
          border: '1px solid #41d3f2',
          background: '#41d3f2',
          color: '#041014',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          opacity: isOpen ? 0.5 : 1,
        }}
      >
        {isOpen ? 'Modal open' : '✦ Find My Brand'}
      </button>
    </main>
  )
}
