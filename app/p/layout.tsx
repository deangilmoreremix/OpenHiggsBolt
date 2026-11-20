import type { ReactNode } from 'react'

/** Public landing pages: no app shell, nothing but the page. */
export default function PublicPagesLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white text-slate-900">{children}</div>
}
