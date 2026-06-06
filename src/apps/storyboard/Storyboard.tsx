import { Routes, Route } from 'react-router-dom'

function StoryboardHome() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Storyboard</h1></div>
}

export default function Storyboard() {
  return (
    <Routes>
      <Route path="/" element={<StoryboardHome />} />
    </Routes>
  )
}