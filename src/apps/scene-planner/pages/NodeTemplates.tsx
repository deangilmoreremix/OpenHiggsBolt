import { Plus } from 'lucide-react'

export default function NodeTemplates() {
  const templates = [
    { name: 'Text to Video', category: 'Video' },
    { name: 'Image to Video', category: 'Video' },
    { name: 'Prompt Enhance', category: 'AI' },
    { name: 'Storyboard Generator', category: 'Planning' },
    { name: 'Music Generator', category: 'Audio' },
    { name: 'Scene Analyzer', category: 'AI' }
  ]

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Node Templates</h1>
        
        <div className="grid grid-cols-3 gap-4">
          {templates.map((template, i) => (
            <div key={i} className="glass-panel p-4 rounded-xl cursor-pointer hover:scale-105 transition-transform">
              <h3 className="font-semibold mb-1">{template.name}</h3>
              <p className="text-sm text-primary">{template.category}</p>
            </div>
          ))}
        </div>
        
        <button className="fixed bottom-6 right-6 p-3 bg-primary text-black rounded-full hover:bg-primary-hover transition-all">
          <Plus size={24} />
        </button>
      </div>
    </div>
  )
}