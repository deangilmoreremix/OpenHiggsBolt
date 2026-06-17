import { Routes, Route } from 'react-router-dom'
import StoryboardPlanner from './pages/StoryboardPlanner'
import ShotEditor from './pages/ShotEditor'
import SceneAnalysis from './pages/SceneAnalysis'

export default function StoryboardApp() {
  return (
    <Routes>
      <Route path="/" element={<StoryboardPlanner />} />
      <Route path="/shots/:sceneId" element={<ShotEditor />} />
      <Route path="/analysis/:sceneId" element={<SceneAnalysis />} />
    </Routes>
  )
}