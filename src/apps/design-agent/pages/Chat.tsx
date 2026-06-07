import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Paperclip, ImageIcon, Loader2, Check, X, Palette, Download, ExternalLink } from 'lucide-react'
import {
  createSession,
  sendChatMessage,
  getMessages,
  getSessionAssets,
  runSkill,
  pollEvents,
  getFileUploadUrl,
  approveJob,
  rejectJob,
  getAgentSkills,
  getSession
} from '../../../shared/api/designAgent'
import { Session, ChatMessage, Skill, EventItem, Asset, BrandKit } from '../../../shared/types/designAgent'

export default function Chat() {
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<string>('')
  const [skills, setSkills] = useState<Skill[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pollingJobId, setPollingJobId] = useState<string | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [plan, setPlan] = useState<any | null>(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>('gpt-5-mini')
  const [aspectRatio, setAspectRatio] = useState<string>('16:9')
  const [brandKit, setBrandKit] = useState<BrandKit>({})
  const [showBrandKit, setShowBrandKit] = useState(false)
  const [showPlanApproval, setShowPlanApproval] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initializeSession()
    loadSkills()
  }, [])

  useEffect(() => {
    if (session) {
      loadAssets()
      loadMessages()
    }
  }, [session])

  useEffect(() => {
    scrollToBottom()
  }, [messages, events])

  const initializeSession = async () => {
    try {
      const existingSession = localStorage.getItem('design_agent_session_id')
      if (existingSession) {
        try {
          const sessionCheck = await getSession(existingSession)
          setSession(sessionCheck)
        } catch {
          localStorage.removeItem('design_agent_session_id')
        }
      }
      if (!session) {
        const newSession = await createSession({ 
          name: 'Design Session'
        })
        setSession(newSession)
        localStorage.setItem('design_agent_session_id', newSession.id)
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }

  const loadSkills = async () => {
    try {
      const skillsList = await getAgentSkills()
      setSkills(skillsList)
    } catch (error) {
      console.error('Failed to load skills:', error)
      setSkills([
        { name: 'fashion-try-on', description: 'Virtual clothing try-on', inputs: ['person_image', 'clothing_image'], trigger_keywords: ['fashion', 'try on'], estimated_credits: 150 },
        { name: 'action-figure-generator', description: 'Create 3D action figure', inputs: ['person_image'], trigger_keywords: ['action figure'], estimated_credits: 80 },
        { name: 'product-showcase-video', description: 'Product showcase video', inputs: ['product_image'], trigger_keywords: ['product video'], estimated_credits: 200 },
        { name: 'interior-design-visualizer', description: 'Furnish empty room', inputs: ['room_image'], trigger_keywords: ['interior', 'room'], estimated_credits: 100 },
        { name: 'multi-angle-reshoot', description: 'Multiple camera angles', inputs: ['image'], trigger_keywords: ['angle', 'camera'], estimated_credits: 120 },
        { name: 'talking-baby-video', description: 'Talking baby video', inputs: ['image'], trigger_keywords: ['baby', 'talking'], estimated_credits: 180 },
        { name: 'keyboard-art-maker', description: 'Custom message keycaps', inputs: [], trigger_keywords: ['keyboard', 'keycap'], estimated_credits: 50 }
      ])
    }
  }

  const loadAssets = async () => {
    if (!session) return
    try {
      const sessionAssets = await getSessionAssets(session.id)
      setAssets(sessionAssets)
    } catch (error) {
      console.error('Failed to load assets:', error)
    }
  }

  const loadMessages = async () => {
    if (!session) return
    try {
      const sessionMessages = await getMessages(session.id)
      setMessages(sessionMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleEvent = useCallback((event: EventItem) => {
    setEvents(prev => [...prev, event])
    
    if (event.type === 'text' && event.payload.content) {
      const content = typeof event.payload.content === 'string' ? event.payload.content : JSON.stringify(event.payload.content)
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: content,
        timestamp: event.created_at,
        events: [event]
      }
      setMessages(prev => [...prev, assistantMessage])
    }
    
    if (event.type === 'tool_result' && event.payload.asset) {
      setAssets(prev => [...prev, event.payload.asset!])
    }
    
    if (event.type === 'plan_propose' && event.payload.title) {
      setPlan({
        title: event.payload.title,
        nodes: event.payload.nodes || [],
        totalCredits: event.payload.total_credits || 0,
        needsApproval: event.payload.needs_approval || false
      })
      if (event.payload.needs_approval) {
        setShowPlanApproval(true)
      }
    }
    
    if (event.type === 'info' && event.payload.message) {
      const infoMessage: ChatMessage = {
        role: 'assistant',
        content: event.payload.message,
        timestamp: event.created_at
      }
      setMessages(prev => [...prev, infoMessage])
    }
  }, [])

  const handleSend = async () => {
    if (!input.trim() || !session || isSending) return

    setIsSending(true)
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      attachments: selectedAssets.map(label => {
        const asset = assets.find(a => a.asset_label === label)
        return asset ? { asset_label: label, url: asset.url, kind: asset.kind } : null
      }).filter((a): a is NonNullable<typeof a> => !!a)
    }
    setMessages(prev => [...prev, userMessage])

    try {
      let job
      if (selectedSkill) {
        job = await runSkill(session.id, {
          skill_name: selectedSkill,
          model: selectedModel,
          messages_snapshot: messages
        })
      } else {
        job = await sendChatMessage(session.id, {
          message: input,
          model: selectedModel
        })
      }
      setPollingJobId(job.id)
      pollEvents(job.id, (event) => {
        handleEvent(event)
      }, undefined, () => {
        setPollingJobId(null)
        setPlan(null)
      })
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !session || files.length === 0) return
    
    setIsUploading(true)
    try {
      for (const file of Array.from(files).slice(0, 14)) {
        const uploadUrl = await getFileUploadUrl(file.name)
        const formData = new FormData()
        if (uploadUrl.fields) {
          Object.entries(uploadUrl.fields).forEach(([key, value]) => formData.append(key, value))
        }
        formData.append('file', file)
        
        await fetch(uploadUrl.url, {
          method: 'POST',
          body: formData
        })
        
        const cdnUrl = `https://cdn.muapi.ai/${uploadUrl.key}`
        const response = await fetch(`/.netlify/functions/design-agent/sessions/${session.id}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': localStorage.getItem('muapi_key') || '' },
          body: JSON.stringify({
            url: cdnUrl,
            kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio',
            source_tool: 'upload',
            prompt: file.name
          })
        })
        const newAsset = await response.json()
        setAssets(prev => [...prev, newAsset])
      }
    } catch (error) {
      console.error('Failed to upload files:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const toggleAssetSelection = (assetLabel: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetLabel) 
        ? prev.filter(a => a !== assetLabel)
        : [...prev, assetLabel]
    )
  }

  const handleApproveJob = async () => {
    if (!pollingJobId) return
    try {
      await approveJob(pollingJobId)
      setPollingJobId(null)
    } catch (error) {
      console.error('Failed to approve job:', error)
    }
  }

  const handleRejectJob = async () => {
    if (!pollingJobId) return
    try {
      await rejectJob(pollingJobId)
      setPollingJobId(null)
    } catch (error) {
      console.error('Failed to reject job:', error)
    }
  }

  const hasApiKey = !!localStorage.getItem('muapi_key')

  if (!hasApiKey) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="glass p-8 rounded-xl text-center">
          <Palette size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">API Key Required</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Please set your Muapi.ai API key to use the Design Agent.
          </p>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="px-6 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all"
          >
            Set API Key
          </button>
        </div>
        
        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass p-6 rounded-xl max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Enter Muapi.ai API Key</h3>
              <input
                type="password"
                placeholder="API Key"
                className="w-full px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg mb-4"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget as HTMLInputElement
                    if (input.value) {
                      localStorage.setItem('muapi_key', input.value)
                      setShowApiKeyModal(false)
                      window.location.reload()
                    }
                  }
                }}
              />
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="w-full px-4 py-2 bg-[var(--bg-card)] rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-xl ${
                    message.role === 'user'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-[var(--bg-card)] text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.skill_name && (
                    <span className="text-xs text-[var(--text-secondary)] block mt-1">Skill: {message.skill_name}</span>
                  )}
                  {message.events?.map((event, idx) => 
                    event.type === 'tool_result' && event.payload.asset ? (
                      <div key={idx} className="mt-2 p-2 bg-[var(--bg-app)] rounded-lg">
                        <img 
                          src={event.payload.asset.url} 
                          alt="Generated" 
                          className="max-w-full max-h-48 object-contain rounded"
                        />
                        <div className="flex gap-2 mt-2">
                          <a
                            href={event.payload.asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            <ExternalLink size={12} className="inline mr-1" />
                            View
                          </a>
                          <a
                            href={event.payload.asset.url}
                            download
                            className="text-xs text-primary hover:underline"
                          >
                            <Download size={12} className="inline mr-1" />
                            Download
                          </a>
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-[var(--bg-card)] p-3 rounded-xl flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm text-[var(--text-secondary)]">Thinking...</span>
                </div>
              </div>
            )}
{plan && (
               <div className="flex justify-start">
                 <div className="bg-[var(--bg-card)] p-4 rounded-xl max-w-[70%]">
                   <h4 className="font-bold mb-2">{plan.title}</h4>
                   <p className="text-sm mb-3">Estimated credits: {plan.totalCredits}</p>
                   {plan.nodes && (
                     <div className="space-y-2 mb-3">
                       {plan.nodes.map((node: any, index: number) => (
                         <div key={index} className="p-2 bg-[var(--bg-app)] rounded">
                           <span className="text-xs font-bold text-primary">{index + 1}</span>
                           <span className="text-sm ml-2">{node.tool}</span>
                           {node.model && <span className="text-xs text-[var(--text-secondary)] ml-2">({node.model})</span>}
                         </div>
                       ))}
                     </div>
                   )}
                   {plan.needsApproval && (
                     <div className="flex gap-2 mt-3">
                       {pollingJobId && (
                         <>
                           <button
                             onClick={handleApproveJob}
                             className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 flex items-center gap-1"
                           >
                             <Check size={14} />
                             Approve Plan
                           </button>
                           <button
                             onClick={handleRejectJob}
                             className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 flex items-center gap-1"
                           >
                             <X size={14} />
                             Reject Plan
                           </button>
                         </>
                       )}
                     </div>
                   )}
                 </div>
               </div>
             )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[var(--border-color)]">
            <div className="flex flex-wrap gap-2 mb-2">
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm"
              >
                <option value="gpt-5-mini">GPT-5 Mini</option>
                <option value="gpt-5">GPT-5</option>
                <option value="gpt-image">GPT-Image</option>
                <option value="flux-pro">Flux Pro</option>
                <option value="flux-dev">Flux Dev</option>
                <option value="flux-pro-ultra">Flux Pro Ultra</option>
                <option value="seedream-5">Seedream 5</option>
                <option value="nano-banana-2">Nano Banana 2</option>
                <option value="nano-banana-2-edit">Nano Banana 2 Edit</option>
                <option value="ideogram-v3">Ideogram v3</option>
                <option value="recraft-v3">Recraft v3</option>
                <option value="kling-v3">Kling v3</option>
                <option value="sora-2">Sora 2</option>
                <option value="veo-3">Veo 3</option>
                <option value="runway">Runway</option>
                <option value="luma-ray2">Luma Ray2</option>
              </select>
              
              <select
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm"
              >
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait</option>
                <option value="4:5">4:5 Social</option>
                <option value="3:2">3:2 Photo</option>
                <option value="2:3">2:3 Photo</option>
                <option value="A4">A4 Print</option>
              </select>
              
              <button
                onClick={() => setShowBrandKit(true)}
                className="px-3 py-2 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--border-color)] transition-all text-sm"
                title="Brand Kit Settings"
              >
                Brand Kit
              </button>
              
              <select
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm"
              >
                <option value="">Direct Chat / Agent Mode</option>
                {skills.map(skill => (
                  <option key={skill.name} value={skill.name}>
                    {skill.name} ({skill.estimated_credits} credits)
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-2 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--border-color)] transition-all flex items-center gap-2"
                title="Upload images (up to 14)"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                <span className="text-sm hidden sm:inline">Attach ({selectedAssets.length}/14)</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={e => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>

            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Describe your design..."
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-sm resize-none"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="px-4 py-2 bg-primary text-black rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50"
              >
                {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            
            {showBrandKit && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="glass p-6 rounded-xl max-w-md w-full">
                  <h3 className="text-lg font-bold mb-4">Brand Kit</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] block mb-1">Colors (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="#FF6B35, #2D3142, #FFFFFF"
                        defaultValue={brandKit.colors?.join(', ')}
                        className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm"
                        onBlur={e => setBrandKit({...brandKit, colors: e.target.value.split(',').map(c => c.trim()).filter(c => c)})}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] block mb-1">Fonts (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="Inter, Roboto, Playfair Display"
                        defaultValue={brandKit.fonts?.join(', ')}
                        className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm"
                        onBlur={e => setBrandKit({...brandKit, fonts: e.target.value.split(',').map(f => f.trim()).filter(f => f)})}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] block mb-1">Tone</label>
                      <input
                        type="text"
                        placeholder="modern, minimalist, playful"
                        defaultValue={brandKit.tone || ''}
                        className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm"
                        onBlur={e => setBrandKit({...brandKit, tone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowBrandKit(false)}
                      className="flex-1 px-4 py-2 bg-[var(--bg-card)] rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-72 border-l border-[var(--border-color)] p-4 overflow-y-auto custom-scrollbar">
          <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-3">Assets ({assets.length})</h3>
          {assets.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">No assets uploaded yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {assets.map(asset => (
                <div
                  key={asset.asset_label}
                  onClick={() => toggleAssetSelection(asset.asset_label)}
                  className={`relative aspect-square bg-[var(--bg-card)] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedAssets.includes(asset.asset_label)
                      ? 'border-primary'
                      : 'border-transparent hover:border-white/20'
                  }`}
                >
                  {asset.url ? (
                    <img src={asset.url} alt={asset.asset_label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-[var(--text-secondary)]" />
                    </div>
                  )}
                  {selectedAssets.includes(asset.asset_label) && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check size={16} className="text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pollingJobId && (
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Job {pollingJobId.slice(0, 8)}...</span>
            <div className="flex gap-2">
              <button
                onClick={handleApproveJob}
                className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 flex items-center gap-1"
              >
                <Check size={14} />
                Approve
              </button>
              <button
                onClick={handleRejectJob}
                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 flex items-center gap-1"
              >
                <X size={14} />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}