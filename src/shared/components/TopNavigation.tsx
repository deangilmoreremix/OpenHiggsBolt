import { useState } from 'react'
import { Bell, Settings } from 'lucide-react'

export default function TopNavigation() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <header className="h-16 glass-panel border-b border-[var(--border-color)] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-[var(--text-secondary)]">
          AI Generation Studios
        </h2>
      </div>
      
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors">
          <Bell size={20} className="text-[var(--text-secondary)]" />
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
          title="API Settings"
        >
          <Settings size={20} className="text-[var(--text-secondary)]" />
        </button>
      </div>

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
    </header>
  )
}