import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Image as ImageIcon, Loader2, Check, X, RefreshCcw } from 'lucide-react'
import {
  createSession,
  sendChatMessage,
  getMessages,
  getSessionAssets,
  createAsset,
  getAgentSkills,
  runSkill,
  pollEvents,
  getFileUploadUrl,
  uploadFileToStorage,
  approveJob,
  rejectJob
} from '@/api/designAgent'
import { Session, ChatMessage, Skill, Event, Asset } from '@/types/designAgent'

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
  const [events, setEvents] = useState<Event[]>([])
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
          setSession({ id: existingSession, createdAt: '', updatedAt: '', status: 'active' })
        } catch {
          localStorage.removeItem('design_agent_session_id')
        }
      }
      if (!session) {
        const newSession = await createSession({ 
          title: 'Design Session',
          description: 'Creative design with AI assistant'
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

  const handleSend = async () => {
    if (!input.trim() || !session || isSending) return

    setIsSending(true)
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      if (selectedSkill) {
        const job = await runSkill(session.id, {
          skill: selectedSkill,
          parameters: { prompt: input },
          assetRefs: selectedAssets.length > 0 ? selectedAssets : undefined
        })
        setPollingJobId(job.id)
        pollEvents(job.id, handleEvent, undefined, () => {
          setPollingJobId(null)
          loadAssets()
        })
      } else {
        await sendChatMessage(session.id, {
          message: input,
          mode: 'direct',
          assetRefs: selectedAssets.length > 0 ? selectedAssets : undefined
        })
      }
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleEvent = (event: Event) => {
    setEvents(prev => [...prev, event])
    if (event.type === 'text' && typeof event.content === 'string') {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: event.content,
        timestamp: event.timestamp
      }
      setMessages(prev => [...prev, assistantMessage])
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !session || files.length === 0) return
    
    setIsUploading(true)
    try {
      for (const file of Array.from(files).slice(0, 14)) {
        const uploadUrl = await getFileUploadUrl(file.name, file.type)
        await uploadFileToStorage(uploadUrl.url, file)
        
        const asset = await createAsset(session.id, {
          label: file.name,
          url: uploadUrl.key,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          metadata: { filename: file.name, size: file.size }
        })
        setAssets(prev => [...prev, asset])
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
          <h2 className="text-2xl font-bold mb-4">API Key Required</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Please set your Muapi.ai API key in the settings to use the Design Agent.
          </p>
          <button
            onClick={() => {
              const key = prompt('Enter your Muapi.ai API key:')
              if (key) localStorage.setItem('muapi_key', key)
              window.location.reload()
            }}
            className="px-6 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-primary-hover transition-all"
          >
            Set API Key
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map(message => (
              <div
                key={message.id}
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
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[var(--border-color)]">
            <div className="flex gap-2 mb-2">
              <select
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm"
              >
                <option value="">Direct Chat</option>
                {skills.map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-2 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--border-color)] transition-all flex items-center gap-2"
              >
                <Paperclip size={16} />
                <span className="text-sm hidden sm:inline">Attach</span>
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
                placeholder="Type your message..."
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
                  key={asset.label}
                  onClick={() => toggleAssetSelection(asset.label)}
                  className={`relative aspect-square bg-[var(--bg-card)] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedAssets.includes(asset.label)
                      ? 'border-primary'
                      : 'border-transparent hover:border-white/20'
                  }`}
                >
                  {asset.thumbnailUrl ? (
                    <img src={asset.thumbnailUrl} alt={asset.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-[var(--text-secondary)]" />
                    </div>
                  )}
                  {selectedAssets.includes(asset.label) && (
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