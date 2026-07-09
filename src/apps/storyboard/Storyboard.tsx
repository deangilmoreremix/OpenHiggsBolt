import { Routes, Route } from 'react-router-dom'
import { StoryboardProvider } from './StoryboardContext'
import StoryboardPlanner from './pages/StoryboardPlanner'
import ShotEditor from './pages/ShotEditor'
import SceneAnalysis from './pages/SceneAnalysis'

export default function StoryboardApp() {
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
