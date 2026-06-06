import { Routes, Route } from 'react-router-dom'

function MusicStudioHome() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Music Studio</h1></div>
}

export default function MusicStudio() {
  return (
    <Routes>
      <Route path="/" element={<MusicStudioHome />} />
    </Routes>
  )
}