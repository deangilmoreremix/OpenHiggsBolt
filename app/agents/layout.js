import Link from 'next/link';

/**
 * Layout for /agents/* pages.
 * These pages host the AiAgent component full-screen — no studio chrome needed.
 * The api key is available via the muapi_key cookie which StandaloneShell sets.
 */
export const metadata = {
  title: "Agent Chat — GO-AI",
};

export default function AgentsLayout({ children }) {
  return (
    <div className="h-screen w-full overflow-hidden bg-black relative">
      <Link
        href="/studio/agents"
        className="absolute top-4 left-4 z-50 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur-md border border-white/10 hover:bg-black/80 hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Studio
      </Link>
      {children}
    </div>
  );
}
