import { Route, Routes } from 'react-router-dom'
import HeadshotNavbar from './components/HeadshotNavbar'
import HeadshotHistory from './pages/HeadshotHistory'
import HeadshotPricing from './pages/HeadshotPricing'
import HeadshotStudio from './pages/HeadshotStudio'

export default function HeadshotGenerator() {
  return (
    <div className="flex flex-col h-full bg-bg-app text-white">
      <HeadshotNavbar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HeadshotStudio />} />
          <Route path="/history" element={<HeadshotHistory />} />
          <Route path="/pricing" element={<HeadshotPricing />} />
        </Routes>
      </div>
    </div>
  )
}
