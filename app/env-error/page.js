export default function EnvErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
      <div className="max-w-lg rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center">
        <h1 className="text-2xl font-bold text-red-400">Production Environment Misconfigured</h1>
        <p className="mt-4 text-white/80">
          This instance is running in <strong className="text-red-300">production mode</strong> but is
          configured with <strong className="text-red-300">Clerk test/development keys</strong>.
        </p>
        <p className="mt-2 text-white/60">
          The application will not function correctly until production Clerk keys are provided.
        </p>
        <div className="mt-6 rounded-lg bg-black/40 p-4 text-left text-sm text-white/70">
          <p className="font-semibold text-white/90">To fix this:</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Set <code className="rounded bg-white/10 px-1 py-0.5">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> to a production key (<code className="rounded bg-white/10 px-1 py-0.5">pk_live_...</code>)</li>
            <li>Set <code className="rounded bg-white/10 px-1 py-0.5">CLERK_SECRET_KEY</code> to a production key (<code className="rounded bg-white/10 px-1 py-0.5">sk_live_...</code>)</li>
            <li>Ensure these values come from <code className="rounded bg-white/10 px-1 py-0.5">.env.production</code> or your deployment platform&apos;s environment variables</li>
            <li>Restart the application</li>
          </ol>
        </div>
        <p className="mt-4 text-xs text-white/40">
          If you are developing locally, run <code className="rounded bg-white/10 px-1 py-0.5">npm run dev</code> instead.
        </p>
      </div>
    </div>
  );
}
