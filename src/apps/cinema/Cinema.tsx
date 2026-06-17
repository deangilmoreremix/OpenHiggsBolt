import { Routes, Route } from 'react-router-dom'
import CinemaGenerate from './pages/CinemaGenerate'
import CinemaHistory from './pages/CinemaHistory'

export default function Cinema() {
  return (
    <Routes>
      <Route path="/" element={<CinemaGenerate />} />
      <Route path="/history" element={<CinemaHistory />} />
    </Routes>
  )
}