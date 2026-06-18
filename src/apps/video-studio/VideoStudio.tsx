import { Routes, Route } from 'react-router-dom'
import VideoGenerate from './pages/VideoGenerate'
import VideoLibrary from './pages/VideoLibrary'
import VideoEditor from './pages/VideoEditor'

export default function VideoStudio() {
  return (
    <Routes>
      <Route path="/" element={<VideoGenerate />} />
      <Route path="/library" element={<VideoLibrary />} />
      <Route path="/editor/:id" element={<VideoEditor />} />
    </Routes>
  )
}