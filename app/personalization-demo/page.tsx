'use client'

import { useEffect } from 'react'
import { DemoPersonalizeProvider, useDemoPersonalize } from '@/shared/personalization'

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
  return (
    <DemoPersonalizeProvider apiKey="demo-key-for-preview">
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
          The modal will open automatically with the sample "Viral Roofing Demo" source.
        </p>
        <AutoOpener />
      </div>
    </DemoPersonalizeProvider>
  )
}
