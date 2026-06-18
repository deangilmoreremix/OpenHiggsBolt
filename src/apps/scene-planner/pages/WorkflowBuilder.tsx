import { useState } from 'react'
import { Play, Plus, Settings, Loader2 } from 'lucide-react'
import { generateText, generateVideo, generateImage } from '@/api/muapi'

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState<Array<{ id: string; type: string; label: string; value?: string; model?: string; result?: any }>>([
    { id: '1', type: 'prompt', label: 'Prompt', value: '' },
    { id: '2', type: 'video', label: 'Video Generator', model: 'kling-3.0' },
    { id: '3', type: 'output', label: 'Output', result: null }
  ])
  const [isRunning, setIsRunning] = useState(false)

  const handleRunWorkflow = async () => {
    setIsRunning(true)
    try {
      const promptNode = nodes.find(n => n.type === 'prompt')
      const videoNode = nodes.find(n => n.type === 'video')
      const outputNode = nodes.find(n => n.type === 'output')
      
      if (promptNode?.value) {
        const result = await generateVideo({ 
          prompt: promptNode.value, 
          duration: 5,
          model: videoNode?.model || 'kling-3.0'
        })
        outputNode!.result = result
        setNodes([...nodes])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Scene Planner - Workflow Builder</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[var(--bg-card)] rounded-xl flex items-center gap-2 hover:bg-[var(--border-color)] transition-all">
            <Settings size={16} />
            Settings
          </button>
          <button 
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className="px-4 py-2 bg-primary text-black rounded-xl font-medium flex items-center gap-2 hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {isRunning ? 'Running...' : 'Run Workflow'}
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
              <div className="text-sm text-muted">
                {node.type === 'prompt' && (
                  <textarea
                    value={node.value}
                    onChange={(e) => {
                      node.value = e.target.value
                      setNodes([...nodes])
                    }}
                    placeholder="Enter your prompt here..."
                    className="w-full h-16 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2 resize-none text-xs"
                  />
                )}
                {node.type === 'video' && (node.model || 'FLUX, SDXL, etc.')}
                {node.type === 'output' && (node.result ? 'Generated ✓' : 'Generated results')}
              </div>
            </div>
          ))}
        </svg>
        
        <button className="absolute bottom-6 right-6 p-3 bg-primary text-black rounded-full hover:bg-primary-hover transition-all">
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}