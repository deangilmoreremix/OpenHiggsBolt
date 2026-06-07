import { useState } from 'react'
import { Palette, Settings, LayoutTemplate } from 'lucide-react'
import Chat from './pages/Chat'
import Assets from './pages/Assets'
import PlanProposal from './pages/PlanProposal'
import Sessions from './pages/Sessions'
import Templates from './pages/Templates'

function DesignAgentLayout({ children }: { children: React.ReactNode }) {
  const [showSettings, setShowSettings] = useState(false)
  
  return (
    <div className="flex flex-col h-full">
      <header className="h-16 glass-panel border-b border-[var(--border-color)] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Palette size={24} className="text-primary" />
          <h1 className="text-xl font-bold">Design Agent</h1>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          title="API Settings"
        >
          <Settings size={20} className="text-[var(--text-secondary)]" />
        </button>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
      
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">API Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Muapi.ai API Key</label>
                <input
                  type="password"
                  placeholder="Enter API key"
                  defaultValue={localStorage.getItem('muapi_key') || ''}
                  className="w-full px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget as HTMLInputElement
                      if (input.value) {
                        localStorage.setItem('muapi_key', input.value)
                        setShowSettings(false)
                        window.location.reload()
                      }
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-[var(--bg-card)] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('muapi_key')
                    localStorage.removeItem('design_agent_session_id')
                    setShowSettings(false)
                    window.location.reload()
                  }}
                  className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg"
                >
                  Clear Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DesignAgentHome() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="glass p-8 rounded-xl text-center">
        <Palette size={48} className="text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Design Agent</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Describe a brand or campaign in plain English — the agent plans deliverables, picks the right model per asset, generates them in order, and assembles the kit
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/design-agent/chat" className="px-6 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all">
            Start Chat
          </a>
          <a href="/design-agent/templates" className="px-6 py-3 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--border-color)] transition-all flex items-center gap-2">
            <LayoutTemplate size={20} />
            Templates
          </a>
          <a href="/design-agent/assets" className="px-6 py-3 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--border-color)] transition-all">
            View Assets
          </a>
          <a href="/design-agent/sessions" className="px-6 py-3 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--border-color)] transition-all">
            Sessions
          </a>
        </div>
      </div>
    </div>
  )
}

export default function DesignAgent() {
  return (
    <Routes>
      <Route path="/" element={<DesignAgentLayout><DesignAgentHome /></DesignAgentLayout>} />
      <Route path="/chat" element={<DesignAgentLayout><Chat /></DesignAgentLayout>} />
      <Route path="/assets" element={<DesignAgentLayout><Assets /></DesignAgentLayout>} />
      <Route path="/plans" element={<DesignAgentLayout><PlanProposal /></DesignAgentLayout>} />
      <Route path="/sessions" element={<DesignAgentLayout><Sessions /></DesignAgentLayout>} />
      <Route path="/templates" element={<DesignAgentLayout><Templates /></DesignAgentLayout>} />
    </Routes>
  )
}