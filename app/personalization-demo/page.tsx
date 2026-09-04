'use client'

import { useEffect } from 'react'
import { DemoPersonalizeProvider, useDemoPersonalize } from '@/shared/personalization'

const SAMPLE_SOURCE = {
  id: 'demo-roofing-1',
  title: 'Viral Roofing Demo',
  mediaType: 'video' as const,
  sourceMedia: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  poster: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  shortPrompt: 'Dramatic storm clouds over a suburban home, cinematic lighting.',
  fullPrompt:
    'Create a viral style roofing video ad that hooks in the first 3 seconds, shows dramatic before and after shots, builds trust with social proof, highlights the transformation, and ends with a strong call to action.',
  originalPrompt:
    'Create a viral style roofing video ad that hooks in the first 3 seconds, shows dramatic before and after shots, builds trust with social proof, highlights the transformation, and ends with a strong call to action.',
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
    }, 300)
    return () => clearTimeout(t)
  }, [openPersonalize])

  return null
}

export default function PersonalizationDemoPage() {
  return (
    <DemoPersonalizeProvider apiKey="demo-preview-key">
      <div style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white' }}>
        <AutoOpener />
      </div>
    </DemoPersonalizeProvider>
  )
}
