import { useState, useEffect } from 'react'
import { Calendar, Trash2, Plus, ArrowRight } from 'lucide-react'
import { getSessions, createSession, deleteSession } from '../../../shared/api/designAgent'
import { Session } from '../../../shared/types/designAgent'

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const sessionsList = await getSessions()
      setSessions(sessionsList)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewSession = async () => {
    try {
      const newSession = await createSession({ name: 'Design Session' })
      localStorage.setItem('design_agent_session_id', newSession.id)
      window.location.href = '/design-agent/chat'
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleSelectSession = (id: string) => {
    localStorage.setItem('design_agent_session_id', id)
    window.location.href = '/design-agent/chat'
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">Loading sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <button
          onClick={handleNewSession}
          className="px-4 py-2 bg-primary text-black rounded-xl font-semibold flex items-center gap-2"
        >
          <Plus size={16} />
          New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="glass p-8 rounded-xl text-center">
          <Calendar size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Sessions Yet</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Create a new session to start designing
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <div key={session.id} className="glass p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="font-bold">{session.name}</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {session.assetCount || 0} assets • {session.creditsSpent || 0} credits
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Updated: {new Date(session.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectSession(session.id)}
                  className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs font-bold hover:bg-primary/30 flex items-center gap-1"
                >
                  Open <ArrowRight size={12} />
                </button>
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}