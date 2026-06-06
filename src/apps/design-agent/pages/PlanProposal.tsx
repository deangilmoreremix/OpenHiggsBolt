import { useState, useEffect } from 'react'
import { Check, X, Calendar, ArrowLeft } from 'lucide-react'
import { getSessionJobs, approveJob, rejectJob, getSession } from '@/api/designAgent'
import { Job, Session } from '@/types/designAgent'

export default function PlanProposal() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const sessionId = localStorage.getItem('design_agent_session_id')
      if (sessionId) {
        const sessionData = await getSession(sessionId)
        setSession(sessionData)
        const sessionJobs = await getSessionJobs(sessionId)
        setJobs(sessionJobs.filter(job => job.status === 'pending'))
      }
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (jobId: string) => {
    try {
      await approveJob(jobId)
      setJobs(prev => prev.filter(j => j.id !== jobId))
    } catch (error) {
      console.error('Failed to approve job:', error)
    }
  }

  const handleReject = async (jobId: string) => {
    try {
      await rejectJob(jobId)
      setJobs(prev => prev.filter(j => j.id !== jobId))
    } catch (error) {
      console.error('Failed to reject job:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">Loading proposals...</p>
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="glass p-8 rounded-xl text-center">
          <Calendar size={48} className="text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Pending Proposals</h2>
          <p className="text-[var(--text-secondary)] mb-4">
            New plan proposals will appear here for your approval
          </p>
          <a href="/design-agent/chat" className="px-4 py-2 bg-primary text-black rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <ArrowLeft size={16} />
            Back to Chat
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Plan Proposals</h1>
          <a href="/design-agent/chat" className="text-sm text-primary hover:underline">
            Back to Chat
          </a>
        </div>

        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="glass p-6 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Job {job.id.slice(0, 8)}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Type: {job.type}
                  </p>
                </div>
              </div>

              {job.result?.plan && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-2">
                    {(job.result.plan as any).title}
                  </h4>
                  <p className="text-sm mb-3">
                    {(job.result.plan as any).description}
                  </p>
                  {(job.result.plan as any).steps && (
                    <div className="space-y-2">
                      {((job.result.plan as any).steps as any[]).map((step: any, index: number) => (
                        <div key={step.id || index} className="p-3 bg-[var(--bg-card)] rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                            <span className="text-sm font-semibold">{step.title}</span>
                          </div>
                          {step.description && (
                            <p className="text-xs text-[var(--text-secondary)]">{step.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(job.id)}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-sm font-bold hover:bg-green-500/30 flex items-center gap-2"
                >
                  <Check size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(job.id)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/30 flex items-center gap-2"
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}