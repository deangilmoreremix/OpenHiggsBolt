'use client'

import { useEffect, useState } from 'react'
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
  const { apiKey, hasApiKey } = useAuthConfig()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Personalization Modal — Design Preview</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
      </div>
    )
  }

  if (!hasApiKey) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Personalization Modal — Design Preview</h1>
        <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(239,91,103,0.1)', border: '1px solid rgba(239,91,103,0.3)' }}>
          <p style={{ fontSize: 14, color: '#ef5b67', marginBottom: 8 }}>Missing MuAPI Key</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            Set your MuAPI key in Settings before testing the personalization demo. The modal will open automatically once a valid key is configured.
          </p>
        </div>
      </div>
    )
  }

  return (
    <DemoPersonalizeProvider apiKey={apiKey || undefined}>
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
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          The modal will open automatically with the sample &quot;Viral Roofing Demo&quot; source.
        </p>
        <AutoOpener />
      </div>
    </DemoPersonalizeProvider>
  )
}
