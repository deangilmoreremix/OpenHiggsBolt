import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Palette } from 'lucide-react'
import Chat from './pages/Chat'
import Assets from './pages/Assets'
import PlanProposal from './pages/PlanProposal'

function DesignAgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <header className="h-16 glass-panel border-b border-[var(--border-color)] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Palette size={24} className="text-primary" />
          <h1 className="text-xl font-bold">Design Agent</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function DesignAgentHome() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="glass p-8 rounded-xl text-center">
        <Palette size={48} className="text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Welcome to Design Agent</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Create and edit images using conversational AI
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/design-agent/chat" className="px-6 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all">
            Start Chat
          </a>
          <a href="/design-agent/assets" className="px-6 py-3 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--border-color)] transition-all">
            View Assets
          </a>
        </div>
      </div>
    </div>
  )
}

export default function DesignAgent() {
  const location = useLocation()
  
  return (
    <Routes>
      <Route path="/" element={<DesignAgentLayout><DesignAgentHome /></DesignAgentLayout>} />
      <Route path="/chat" element={<DesignAgentLayout><Chat /></DesignAgentLayout>} />
      <Route path="/assets" element={<DesignAgentLayout><Assets /></DesignAgentLayout>} />
      <Route path="/plans" element={<DesignAgentLayout><PlanProposal /></DesignAgentLayout>} />
    </Routes>
  )
}