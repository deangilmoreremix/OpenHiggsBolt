import { Routes, Route } from 'react-router-dom'

function VideoStudioHome() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Video Studio</h1></div>
}

export default function VideoStudio() {
  return (
    <Routes>
      <Route path="/" element={<VideoStudioHome />} />
    </Routes>
  )
}