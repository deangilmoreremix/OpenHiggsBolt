import { CalendarDays, Plus } from 'lucide-react'

export default function ContentPlanner() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Content Planner</h1>
          <button className="px-4 py-2 bg-primary text-black rounded-xl font-medium flex items-center gap-2 hover:bg-primary-hover transition-all">
            <Plus size={16} />
            New Plan
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={20} className="text-primary" />
                <h3 className="font-semibold">Content Plan {i}</h3>
              </div>
              <p className="text-sm text-muted mb-4">
                Video series for Q{i} marketing campaign
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-primary">In Progress</span>
                <span className="text-muted">5 steps</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}