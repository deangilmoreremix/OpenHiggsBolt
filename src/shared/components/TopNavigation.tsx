import { Bell, Settings } from 'lucide-react'

export default function TopNavigation() {
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
        <button className="p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors">
          <Settings size={20} className="text-[var(--text-secondary)]" />
        </button>
      </div>
    </header>
  )
}