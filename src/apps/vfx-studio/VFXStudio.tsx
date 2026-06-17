import { Routes, Route } from 'react-router-dom'
import VFXGenerate from './pages/VFXGenerate'

export default function VFXStudio() {
  return (
    <Routes>
      <Route path="/" element={<VFXGenerate />} />
    </Routes>
  )
}