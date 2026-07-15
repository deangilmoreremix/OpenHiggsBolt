import { Routes, Route } from 'react-router-dom'
import VFXGenerate from './pages/VFXGenerate'

export default function VFXStudio({ apiKey }: { apiKey?: string }) {
  return (
    <Routes>
      <Route path="/" element={<VFXGenerate apiKey={apiKey} />} />
    </Routes>
  )
}