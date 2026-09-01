import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { StoryboardProvider, useStoryboard } from './StoryboardContext'
import StoryboardPlanner from './pages/StoryboardPlanner'
import ShotEditor from './pages/ShotEditor'
import SceneAnalysis from './pages/SceneAnalysis'

function StoryboardPlannerWithTemplate({ templateData }: { templateData?: { prompt?: string; [key: string]: any } }) {
  const { brief, setBrief } = useStoryboard()

  useEffect(() => {
    if (!templateData?.prompt) return
    if (brief != null && brief !== '') return // don't overwrite existing brief
    setBrief(templateData.prompt)
  }, [templateData, brief, setBrief])

  return <StoryboardPlanner />
}

export default function StoryboardApp({ apiKey, templateData }: { apiKey?: string; templateData?: { prompt?: string; [key: string]: any } }) {
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
        <Route path="/" element={<StoryboardPlannerWithTemplate templateData={templateData} />} />
        <Route path="/shots/:sceneId" element={<ShotEditor />} />
        <Route path="/analysis/:sceneId" element={<SceneAnalysis />} />
      </Routes>
    </StoryboardProvider>
  )
}
