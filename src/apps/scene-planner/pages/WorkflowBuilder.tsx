import { useState } from 'react'
import { Play, Plus, Settings } from 'lucide-react'

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState([
    { id: '1', type: 'prompt', label: 'Prompt' },
    { id: '2', type: 'video', label: 'Video Generator' },
    { id: '3', type: 'output', label: 'Output' }
  ])

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Scene Planner - Workflow Builder</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[var(--bg-card)] rounded-lg flex items-center gap-2">
            <Settings size={16} />
            Settings
          </button>
          <button className="px-4 py-2 bg-[var(--color-primary)] text-black rounded-lg font-medium flex items-center gap-2">
            <Play size={16} />
            Run Workflow
          </button>
        </div>
      </div>
      
      <div className="glass flex-1 rounded-xl p-6 relative">
        <svg className="w-full h-full">
          {nodes.map((node, i) => (
            <div
              key={node.id}
              className="absolute glass-panel p-4 rounded-xl w-48 cursor-move"
              style={{ 
                top: `${50 + i * 120}px`, 
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <h3 className="font-semibold mb-2">{node.label}</h3>
              <div className="text-sm text-[var(--text-muted)]">
                {node.type === 'prompt' && 'Enter your prompt here...'}
                {node.type === 'video' && 'FLUX, SDXL, etc.'}
                {node.type === 'output' && 'Generated results'}
              </div>
            </div>
          ))}
        </svg>
        
        <button className="absolute bottom-6 right-6 p-3 bg-[var(--color-primary)] text-black rounded-full shadow-lg">
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}