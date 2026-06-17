import { FileText, Loader2, Save, Download, Copy } from 'lucide-react'
import { useState } from 'react'
import { generateText } from '@/api/muapi'

export default function ScriptWriter() {
  const [prompt, setPrompt] = useState('')
  const [genre, setGenre] = useState('Sci-Fi')
  const [length, setLength] = useState('Short (2-3 min)')
  const [format, setFormat] = useState('Screenplay')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      const systemPrompt = `You are a professional ${format.toLowerCase().replace('_', '-')} writer. Genre: ${genre}. Length: ${length}. Write creatively and professionally.`
      const text = await generateText({
        prompt: `Write a ${length.toLowerCase()} ${format.toLowerCase().replace('_', ' ')} about: ${prompt}`,
        systemPrompt,
        model: 'gpt-4',
        temperature: 0.7
      })
      setResult(text)
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Script Writer</h1>
          <div className="flex gap-2">
            <button 
              onClick={copyToClipboard}
              disabled={!result}
              className="px-4 py-2 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--border-color)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Copy size={16} />
              Copy
            </button>
            <button className="px-4 py-2 bg-primary text-black rounded-xl font-medium hover:bg-primary-hover transition-all flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        
        <div className="glass p-6 rounded-xl mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Story Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A sci-fi story about time travel..."
                className="w-full h-32 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 resize-none"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                >
                  <option>Sci-Fi</option>
                  <option>Drama</option>
                  <option>Action</option>
                  <option>Comedy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                >
                  <option>Short (2-3 min)</option>
                  <option>Medium (5-10 min)</option>
                  <option>Feature (15+ min)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2"
                >
                  <option>Screenplay</option>
                  <option>Novel</option>
                  <option>Video Script</option>
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
                  Writing Script...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Generate Script
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Generated Script</h2>
            <div className="bg-[var(--bg-card)] rounded-xl p-4 mb-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{result.text}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}