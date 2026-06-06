import { Routes, Route } from 'react-router-dom'

function ScenePlannerHome() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Scene Planner</h1></div>
}

export default function ScenePlanner() {
  return (
    <Routes>
      <Route path="/" element={<ScenePlannerHome />} />
    </Routes>
  )
}