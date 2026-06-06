import { Link } from 'react-router-dom'
import { Film } from 'lucide-react'

export default function CinemaHistory() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Cinema History</h1>
        
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-4 rounded-xl">
              <div className="aspect-video bg-[var(--bg-card)] rounded-lg mb-3 flex items-center justify-center">
                <Film size={48} className="text-[var(--color-primary)]" />
              </div>
              <h3 className="font-medium mb-1">Cinematic Video {i}</h3>
              <p className="text-sm text-[var(--text-muted)]">Generated 2 days ago</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}