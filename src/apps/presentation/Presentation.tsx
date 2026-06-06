import { Presentation, Loader2, Download, Copy } from 'lucide-react'
import { useState } from 'react'
import { generateText } from '@/api/muapi'

export default function PresentationApp() {
  const [prompt, setPrompt] = useState('')
  const [slides, setSlides] = useState(10)
  const [theme, setTheme] = useState('Professional Dark')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      const text = await generateText({
        prompt: `Create a ${slides}-slide presentation on: ${prompt}. Theme: ${theme}. Format as markdown with slide headings`,
        systemPrompt: 'You are a professional presentation designer. Create compelling slide content with titles, bullet points, and speaker notes.',
        model: 'gpt-4',
        maxTokens: 2000
      })
      setResult(text)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Presentation Studio</h1>
        
        <div className="glass p-6 rounded-xl mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Presentation Topic</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Quarterly business report..."
                className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Slides</label>
                <input
                  type="number"
                  value={slides}
                  onChange={(e) => setSlides(Number(e.target.value))}
                  min="1"
                  max="50"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                >
                  <option>Professional Dark</option>
                  <option>Clean Light</option>
                  <option>Creative Colorful</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 px-4 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Slides...
                </>
              ) : (
                <>
                  <Presentation size={20} />
                  Generate Presentation
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Generated Presentation</h2>
            <div className="bg-[var(--bg-card)] rounded-xl p-4 mb-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{result.text}</pre>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[var(--bg-card)] rounded-xl text-sm hover:bg-[var(--border-color)] transition-all flex items-center gap-2">
                <Copy size={16} />
                Copy
              </button>
              <button className="px-4 py-2 bg-primary text-black rounded-xl font-medium hover:bg-primary-hover transition-all flex items-center gap-2">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}