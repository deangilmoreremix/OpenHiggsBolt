import { useParams } from 'react-router-dom'

export default function VideoEditor() {
  const { id } = useParams()
  
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Video Editor</h1>
        
        <div className="glass p-6 rounded-xl">
          <div className="aspect-video bg-[var(--bg-card)] rounded-lg mb-4" />
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <input
                type="range"
                min="1"
                max="30"
                className="w-full"
              />
            </div>
            
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-[var(--color-primary)] text-black rounded-lg font-medium">
                Extend Video
              </button>
              <button className="px-4 py-2 bg-[var(--bg-card)] rounded-lg">
                Add Effects
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}