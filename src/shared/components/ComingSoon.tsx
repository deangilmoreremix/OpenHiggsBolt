import type { ReactNode } from 'react'
import { Sparkles, Github } from 'lucide-react'

export interface ComingSoonProps {
  title: string
  description?: string
  icon?: ReactNode
  eta?: string
  githubIssueUrl?: string
}

export default function ComingSoon({ title, description, icon, eta, githubIssueUrl }: ComingSoonProps) {
  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <div className="glass-panel max-w-md w-full rounded-2xl p-10 text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-[var(--active-accent)] border border-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary)]">
          {icon ?? <Sparkles size={28} />}
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">{title}</h2>
        {description && <p className="text-sm text-[var(--text-secondary)] mb-5">{description}</p>}
        {eta && (
          <div className="inline-block px-3 py-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)] mb-5">
            ETA: {eta}
          </div>
        )}
        <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Coming soon</div>
        {githubIssueUrl && (
          <a href={githubIssueUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline">
            <Github size={14} /> Track progress
          </a>
        )}
      </div>
    </div>
  )
}
