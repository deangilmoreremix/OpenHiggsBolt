import { Routes, Route } from 'react-router-dom'

function CinemaHome() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Cinema</h1></div>
}

export default function Cinema() {
  return (
    <Routes>
      <Route path="/" element={<CinemaHome />} />
    </Routes>
  )
}