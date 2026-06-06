import { Routes, Route } from 'react-router-dom'

function ContentPlannerHome() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Content Planner</h1></div>
}

export default function ContentPlanner() {
  return (
    <Routes>
      <Route path="/" element={<ContentPlannerHome />} />
    </Routes>
  )
}