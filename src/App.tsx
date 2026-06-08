import { Routes, Route, Navigate } from 'react-router-dom'
import TopNavigation from './shared/components/TopNavigation'
import SideNavigation from './shared/components/SideNavigation'
import VFXStudio from './apps/vfx-studio/VFXStudio'

function App() {
  return (
    <div className="flex h-screen bg-bg-app text-white">
      <SideNavigation />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavigation />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/vfx-studio" replace />} />
            <Route path="/vfx-studio/*" element={<VFXStudio />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App