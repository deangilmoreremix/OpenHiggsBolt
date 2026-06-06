import { Routes, Route } from 'react-router-dom'

function PresentationHome() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Presentation</h1></div>
}

export default function Presentation() {
  return (
    <Routes>
      <Route path="/" element={<PresentationHome />} />
    </Routes>
  )
}