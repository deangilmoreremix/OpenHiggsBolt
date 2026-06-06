import { Routes, Route, Navigate } from 'react-router-dom'
import TopNavigation from './shared/components/TopNavigation'
import SideNavigation from './shared/components/SideNavigation'
import VideoStudio from './apps/video-studio/VideoStudio'
import Storyboard from './apps/storyboard/Storyboard'
import ScenePlanner from './apps/scene-planner/ScenePlanner'
import Cinema from './apps/cinema/Cinema'
import MusicStudio from './apps/music-studio/MusicStudio'
import ThumbnailStudio from './apps/thumbnail-studio/ThumbnailStudio'
import DesignAgent from './apps/design-agent/DesignAgent'
import ScriptWriter from './apps/script-writer/ScriptWriter'
import Presentation from './apps/presentation/Presentation'
import ContentPlanner from './apps/content-planner/ContentPlanner'

function App() {
  return (
    <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      <SideNavigation />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavigation />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/video-studio" replace />} />
            <Route path="/video-studio/*" element={<VideoStudio />} />
            <Route path="/storyboard/*" element={<Storyboard />} />
            <Route path="/scene-planner/*" element={<ScenePlanner />} />
            <Route path="/cinema/*" element={<Cinema />} />
            <Route path="/music-studio/*" element={<MusicStudio />} />
            <Route path="/thumbnail-studio/*" element={<ThumbnailStudio />} />
            <Route path="/design-agent/*" element={<DesignAgent />} />
            <Route path="/script-writer/*" element={<ScriptWriter />} />
            <Route path="/presentation/*" element={<Presentation />} />
            <Route path="/content-planner/*" element={<ContentPlanner />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App