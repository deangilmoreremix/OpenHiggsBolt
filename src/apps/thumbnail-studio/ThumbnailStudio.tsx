import { Routes, Route } from 'react-router-dom'

function ThumbnailStudioHome() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Thumbnail Studio</h1></div>
}

export default function ThumbnailStudio() {
  return (
    <Routes>
      <Route path="/" element={<ThumbnailStudioHome />} />
    </Routes>
  )
}