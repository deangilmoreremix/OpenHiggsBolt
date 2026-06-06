import { Link } from 'react-router-dom'

export default function VideoLibrary() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Video Library</h1>
        
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-4 rounded-xl">
              <div className="aspect-video bg-[var(--bg-card)] rounded-lg mb-3" />
              <h3 className="font-medium mb-1">Video {i}</h3>
              <p className="text-sm text-muted">Generated 5 seconds ago</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}