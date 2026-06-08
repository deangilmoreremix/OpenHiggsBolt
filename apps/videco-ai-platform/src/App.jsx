import React, { useState } from 'react'
import Dashboard from './pages/Dashboard'
import AIImages from './pages/AIImages'
import AIVideos from './pages/AIVideos'
import AIChat from './pages/AIChat'
import Analytics from './pages/Analytics'
import Automation from './pages/Automation'
import Affiliate from './pages/Affiliate'
import Campaigns from './pages/Campaigns'
import Settings from './pages/Settings'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

export default function App() {
  const [page, setPage] = useState('dashboard')

  const pages = {
    dashboard: Dashboard,
    images: AIImages,
    videos: AIVideos,
    chat: AIChat,
    analytics: Analytics,
    automation: Automation,
    affiliate: Affiliate,
    campaigns: Campaigns,
    settings: Settings,
  }

  const PageComponent = pages[page] || Dashboard

  return (
    <div className="min-h-screen bg-[#08090b] flex">
      <Sidebar current={page} onNavigate={setPage} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={page} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-app-bg">
          <PageComponent />
        </main>
      </div>
    </div>
  )
}
