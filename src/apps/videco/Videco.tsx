import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import VideoLibrary from './pages/VideoLibrary'
import VideoGenerate from './pages/VideoGenerate'
import VideoUpload from './pages/VideoUpload'
import VideoClone from './pages/VideoClone'
import CampaignBuilder from './pages/CampaignBuilder'
import VideoEditor from './pages/VideoEditor'
import Analytics from './pages/Analytics'
import Leads from './pages/Leads'
import Feedback from './pages/Feedback'
import SettingsPage from './pages/Settings'
import EmbedPlayer from './pages/EmbedPlayer'
import AIVideos from './pages/AIVideos'
import Integrations from './pages/Integrations'

export default function Videco() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/videco/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/library" element={<VideoLibrary />} />
      <Route path="/generate" element={<VideoGenerate />} />
      <Route path="/upload" element={<VideoUpload />} />
      <Route path="/clone" element={<VideoClone />} />
      <Route path="/campaign" element={<CampaignBuilder />} />
      <Route path="/editor/:id" element={<VideoEditor />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/leads" element={<Leads />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/embed/:slug" element={<EmbedPlayer />} />
      <Route path="/ai-videos" element={<AIVideos />} />
      <Route path="/integrations" element={<Integrations />} />
    </Routes>
  )
}
