import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { StoryboardProvider } from './StoryboardContext'
import StoryboardPlanner from './pages/StoryboardPlanner'
import ShotEditor from './pages/ShotEditor'
import SceneAnalysis from './pages/SceneAnalysis'

export default function StoryboardApp({ apiKey }: { apiKey?: string }) {
  // The shared storyboard API client reads the key from the global
  // window.__MUAPI_KEY__ / localStorage 'muapi_key' source. Sync the global
  // key passed down by StandaloneShell so shot generation is authenticated
  // without forcing the user to re-enter the key inside Storyboard.
  useEffect(() => {
    if (apiKey && typeof window !== 'undefined') {
      ;(window as any).__MUAPI_KEY__ = apiKey
    }
  }, [apiKey])

  return (
    <StoryboardProvider>
      <Routes>
        <Route path="/" element={<StoryboardPlanner />} />
        <Route path="/shots/:sceneId" element={<ShotEditor />} />
        <Route path="/analysis/:sceneId" element={<SceneAnalysis />} />
      </Routes>
    </StoryboardProvider>
  )
}
