'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { DemoPersonalizeProvider, useDemoPersonalize } from '@/shared/personalization'
import { useAuthConfig } from '@/lib/authConfig'

const SAMPLE_SOURCE = {
  id: 'demo-roofing-1',
  title: 'Viral Roofing Demo — Storm Damage',
  mediaType: 'video' as const,
  sourceMedia: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  shortPrompt: 'Dramatic storm clouds over a suburban home, cinematic lighting.',
  fullPrompt:
    'A dramatic cinematic shot of storm clouds rolling over a suburban home. Lightning flashes in the background. The camera slowly pushes in toward a damaged roof. Rain pours. Wind howls. The mood is tense and urgent.',
  originalPrompt:
    'A dramatic cinematic shot of storm clouds rolling over a suburban home. Lightning flashes in the background. The camera slowly pushes in toward a damaged roof. Rain pours. Wind howls. The mood is tense and urgent.',
  category: 'Roofing',
  aspectRatio: '9:16',
  durationLabel: '15s',
  modelName: 'Seedance 2.0',
  sourceType: 'landing-demo' as const,
  sourceMetadata: {},
}

function AutoOpener() {
  const { openPersonalize } = useDemoPersonalize()

  useEffect(() => {
    const t = setTimeout(() => {
      openPersonalize({ source: SAMPLE_SOURCE })
    }, 500)
    return () => clearTimeout(t)
  }, [openPersonalize])

  return null
}

export default function PersonalizationDemoPage() {
  const { apiKey, hasApiKey, setApiKey } = useAuthConfig()
  const [mounted, setMounted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Test mode: ?test=true bypasses API key requirement for UI testing
  const isTestMode = searchParams.get('test') === 'true'
  useEffect(() => {
    if (isTestMode && !apiKey) {
      setApiKey('test-mode-key')
    }
  }, [isTestMode, apiKey, setApiKey])

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Personalization Modal — Design Preview</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <DemoPersonalizeProvider>
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0b',
          color: 'white',
          padding: 20,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Personalization Modal — Design Preview
        </h1>
        {isTestMode && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
            Test mode active — UI is fully interactive. API calls will fail without a real key.
          </p>
        )}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          The modal will open automatically with the sample &quot;Viral Roofing Demo&quot; source.
        </p>
        <AutoOpener />
      </div>
    </DemoPersonalizeProvider>
  )
}

function SettingsPrompt({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    let destroyed = false

    // Use dynamic import to load the vanilla JS SettingsModal.
    // @ts-ignore - SettingsModal is a vanilla JS component without TS declarations
    import('../../src/components/SettingsModal')
      .then(({ SettingsModal }) => {
        if (destroyed) return
        const modal = SettingsModal(() => {
          // SettingsModal handles its own close; re-check key state.
          if (typeof window !== 'undefined') {
            const key = window.localStorage.getItem('muapi_key')
            if (key) onClose()
          }
        })
        document.body.appendChild(modal)
        return modal
      })
      .catch(() => {
        // SettingsModal may not be available in all environments
      })

    return () => {
      destroyed = true
    }
  }, [onClose])

  return null
}
