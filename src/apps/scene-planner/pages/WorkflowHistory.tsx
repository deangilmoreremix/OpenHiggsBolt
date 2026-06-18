import { Clock } from 'lucide-react'

export default function WorkflowHistory() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Workflow History</h1>
        
        <div className="glass p-6 rounded-xl">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel p-4 rounded-xl flex items-center gap-4">
                <Clock size={20} className="text-primary" />
                <div className="flex-1">
                  <h3 className="font-medium">Workflow {i}</h3>
                  <p className="text-sm text-muted">Completed 5 hours ago</p>
                </div>
                <button className="px-3 py-1 bg-[var(--bg-card)] rounded-xl text-sm hover:bg-[var(--border-color)] transition-all">
                  Reuse
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}