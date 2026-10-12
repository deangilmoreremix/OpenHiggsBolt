'use client';

import { RESELLER_APPS } from '@/packages/studio/src/components/AppsStudio';

/**
 * Academy training destination for the $597 package.
 *
 * The reseller training track is gated by the `apps_studio_training`
 * entitlement. While the dedicated /academy/reseller track is not published
 * yet, customers are pointed at the Academy home with an explanatory note
 * instead of a link that would 404.
 */
const ACADEMY_TRAINING_HREF = '/academy';
const ACADEMY_TRAINING_HAS_DEDICATED_ROUTE = false;

/** Postgres schema name for an app id: kebab-case is quoted in SQL, so normalize it. */
function schemaFor(appId) {
  return appId.replace(/-/g, '_');
}

const ENV_CLIENT = `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>`;

const ENV_SERVER = `SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`;

function SectionHeading({ id, eyebrow, title, children }) {
  return (
    <div className="space-y-1.5">
      {eyebrow && (
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#22d3ee]">{eyebrow}</span>
      )}
      <h2 id={id} className="text-xl sm:text-2xl font-black text-white tracking-tight">
        {title}
      </h2>
      {children && <p className="text-white/60 text-xs sm:text-sm font-medium leading-relaxed max-w-3xl">{children}</p>}
    </div>
  );
}

function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-[#0a0a0a] p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function Step({ num, title, children }) {
  return (
    <div className="relative overflow-hidden bg-white/[0.02] border border-white/10 rounded-lg p-5 flex flex-col gap-2">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee]/40 to-transparent" aria-hidden="true" />
      <span className="text-2xl font-black tracking-tighter text-[#22d3ee]/70 leading-none">{num}</span>
      <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-white/60 leading-relaxed font-medium">{children}</p>
    </div>
  );
}

function Code({ children }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md border border-white/10 bg-black/50 p-3 text-[11px] leading-relaxed text-[#22d3ee]/90">
      <code>{children}</code>
    </pre>
  );
}

function ExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#22d3ee] transition-colors hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40 rounded"
    >
      {children}
    </a>
  );
}

function InternalLink({ href, children }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#22d3ee] transition-colors hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22d3ee]/40 rounded"
    >
      {children}
    </a>
  );
}

export default function DeploymentCenter() {
  return (
    <div className="min-h-screen bg-app-bg text-white flex flex-col">
      {/* ── Shell header (mirrors the studio shell/nav conventions) ────────── */}
      <header className="flex-shrink-0 h-14 border-b border-white/[0.03] flex items-center justify-between px-4 sm:px-6 bg-black/20 backdrop-blur-md z-40 gap-4">
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight hidden sm:block">SmartVideo GO</span>
        </div>
        <nav aria-label="Reseller navigation" className="flex items-center gap-4 sm:gap-5 overflow-x-auto scrollbar-none">
          <InternalLink href="/studio/apps">AI Apps</InternalLink>
          <span className="text-[13px] font-bold text-[#22d3ee] whitespace-nowrap">Deployment Center</span>
          <InternalLink href={ACADEMY_TRAINING_HREF}>Academy</InternalLink>
        </nav>
        <div className="flex-shrink-0 flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <span className="w-2 h-2 rounded-full bg-[#22d3ee]" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">Reseller</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12 sm:space-y-16">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <header className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#22d3ee]">
              SmartVideo AI Apps Reseller Program
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[0.95]">
            Reseller <span className="text-[#22d3ee]">Deployment Center</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base font-medium leading-relaxed max-w-2xl mx-auto">
            Everything you need to buy the collection, download the source code, set up one shared
            Supabase project, and deploy every app to your own Vercel account — then resell it under
            your own brand.
          </p>
        </header>

        {/* ── How to buy ──────────────────────────────────────────────────── */}
        <section aria-labelledby="how-to-buy" className="space-y-5">
          <SectionHeading id="how-to-buy" eyebrow="Step 1" title="How to buy">
            Two one-time packages cover the full collection. Checkout opens on the AI Apps page and is
            handled by Stripe — you pay once and keep the apps forever.
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">DIY App Builder</h3>
              <p className="mt-2 text-3xl font-black tracking-tighter text-white">
                $197 <span className="text-xs font-bold uppercase tracking-widest text-white/50">one-time</span>
              </p>
              <p className="mt-3 text-xs text-white/60 leading-relaxed font-medium">
                Every application in the reseller collection, the included source files, and the setup
                documentation. Build at your own pace — no instructor-led training.
              </p>
              <div className="mt-4">
                <InternalLink href="/studio/apps">Buy on the AI Apps page →</InternalLink>
              </div>
            </Panel>
            <Panel className="border-[#22d3ee]/40 shadow-xl shadow-[#22d3ee]/10">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#22d3ee]">Apps + Training</h3>
                <span className="inline-flex items-center rounded-full bg-[#22d3ee] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">
                  Most complete
                </span>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tighter text-white">
                $597 <span className="text-xs font-bold uppercase tracking-widest text-white/50">one-time</span>
              </p>
              <p className="mt-3 text-xs text-white/60 leading-relaxed font-medium">
                Everything in DIY App Builder plus instructor-led training, guided implementation
                lessons, and deployment walkthroughs in the Academy.
              </p>
              <div className="mt-4">
                <InternalLink href="/studio/apps">Buy on the AI Apps page →</InternalLink>
              </div>
            </Panel>
          </div>
          <Panel className="bg-white/[0.02]">
            <p className="text-xs text-white/60 leading-relaxed font-medium">
              Already own DIY App Builder? Upgrade to Apps + Training for a $400 difference — the
              upgrade button sits directly under the two package cards on the AI Apps page. Your Stripe
              receipt and your download access both stay tied to the account you purchased with, so
              sign in with the same account every time.
            </p>
          </Panel>
        </section>

        {/* ── What you get ────────────────────────────────────────────────── */}
        <section aria-labelledby="what-you-get" className="space-y-5">
          <SectionHeading id="what-you-get" eyebrow="Step 2" title="What you get">
            Purchasing unlocks the full source of every app in the collection, plus the documentation
            to run it as your own product.
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Panel>
              <h3 className="text-sm font-bold text-white tracking-tight">Complete source code</h3>
              <p className="mt-2 text-xs text-white/60 leading-relaxed font-medium">
                Every app ships with its full source repository. Rebrand the UI, swap the copy, and
                change the pricing — the codebase is yours.
              </p>
            </Panel>
            <Panel>
              <h3 className="text-sm font-bold text-white tracking-tight">This deployment guide</h3>
              <p className="mt-2 text-xs text-white/60 leading-relaxed font-medium">
                The shared Supabase setup, the Vercel deployment flow, and per-app instructions are
                documented here and linked from every card in the collection.
              </p>
            </Panel>
            <Panel>
              <h3 className="text-sm font-bold text-white tracking-tight">Training ($597)</h3>
              <p className="mt-2 text-xs text-white/60 leading-relaxed font-medium">
                The Apps + Training package adds guided lessons that walk through building,
                customizing, and launching each app, end to end.
              </p>
            </Panel>
          </div>
        </section>

        {/* ── Source download ─────────────────────────────────────────────── */}
        <section aria-labelledby="source-download" className="space-y-5">
          <SectionHeading id="source-download" eyebrow="Step 3" title="Download the source code">
            Source archives are served by the reseller download endpoint. Each response is a short-lived
            signed URL, so always download from the link while you are signed in.
          </SectionHeading>
          <Panel className="space-y-4">
            <ol className="space-y-2.5 text-xs text-white/70 leading-relaxed font-medium list-decimal list-inside">
              <li>
                Sign in with the account that owns the reseller package. Downloads are checked against
                that purchase.
              </li>
              <li>
                Request the app you need from the download endpoint, using its app id from the
                collection:
                <Code>{`GET /api/reseller/download?app=<app-id>`}</Code>
              </li>
              <li>
                A successful request answers <span className="font-mono text-[#22d3ee]">302</span> and
                redirects you to a time-limited signed URL — save the archive promptly.
              </li>
            </ol>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-md border border-white/10 bg-black/40 p-3">
                <p className="font-mono text-[11px] font-bold text-red-300">401</p>
                <p className="mt-1 text-[11px] text-white/60 leading-relaxed font-medium">
                  You are not signed in. Sign in with the purchasing account and retry.
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/40 p-3">
                <p className="font-mono text-[11px] font-bold text-red-300">403</p>
                <p className="mt-1 text-[11px] text-white/60 leading-relaxed font-medium">
                  The signed-in account does not own a reseller package yet.
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/40 p-3">
                <p className="font-mono text-[11px] font-bold text-red-300">404</p>
                <p className="mt-1 text-[11px] text-white/60 leading-relaxed font-medium">
                  That app id is not part of the collection — check the id in the gallery below.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed font-medium">
              The archive contains the application source and its migrations folder. Unzip it, keep
              the migrations — you will apply them to your own Supabase project in the next step.
            </p>
          </Panel>
        </section>

        {/* ── Shared Supabase setup ───────────────────────────────────────── */}
        <section aria-labelledby="supabase-setup" className="space-y-5">
          <SectionHeading id="supabase-setup" eyebrow="Step 4" title="Shared Supabase setup">
            All of your reseller apps run on ONE Supabase project that you own. Each app gets its own
            isolated schema, so nothing an app writes can touch another app&apos;s data.
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel className="space-y-3">
              <h3 className="text-sm font-bold text-white tracking-tight">The four rules</h3>
              <ul className="space-y-2.5 text-xs text-white/70 leading-relaxed font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="text-white">One customer-owned project.</strong> Create a single
                    Supabase project for your reseller business and use it for every app — one bill,
                    one dashboard.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="text-white">Isolated per-app schemas.</strong> Give every app its
                    own Postgres schema (for example <span className="font-mono text-[#22d3ee]">ai_headshot_studio</span>)
                    instead of dumping all apps into <span className="font-mono">public</span>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="text-white">Reviewed migrations only.</strong> Apply each
                    app&apos;s migrations from its source repo in order, and read them before running
                    them — they are the reviewed schema the app was tested against.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee] shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="text-white">Never the production database.</strong> Do not point a
                    reseller app at the SmartVideo GO / VideoRemix production Supabase project, and
                    never reuse its service-role key. That database holds live customer data.
                  </span>
                </li>
              </ul>
            </Panel>
            <Panel className="space-y-3">
              <h3 className="text-sm font-bold text-white tracking-tight">Create the project and the schemas</h3>
              <ol className="space-y-2.5 text-xs text-white/70 leading-relaxed font-medium list-decimal list-inside">
                <li>Create a new project at supabase.com and pick the region closest to your customers.</li>
                <li>
                  In the SQL editor, create one schema per app you plan to run, then apply that app&apos;s
                  migrations inside its schema:
                  <Code>{`create schema if not exists "ai_headshot_studio";`}</Code>
                </li>
                <li>
                  Repeat for every app you activate. Apps that share the project never read each
                  other&apos;s schemas.
                </li>
              </ol>
              <h3 className="text-sm font-bold text-white tracking-tight pt-1">Environment variables</h3>
              <p className="text-xs text-white/60 leading-relaxed font-medium">
                Client-side values (safe to expose, used by the browser client):
              </p>
              <Code>{ENV_CLIENT}</Code>
              <p className="text-xs text-white/60 leading-relaxed font-medium">
                Server-side values — keep the service-role key on the server only, never in a
                <span className="font-mono"> NEXT_PUBLIC_</span> variable or a client bundle:
              </p>
              <Code>{ENV_SERVER}</Code>
              <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                Each app repository README lists its exact variable names; the four above are the
                SmartVideo Supabase convention.
              </p>
            </Panel>
          </div>
        </section>

        {/* ── Vercel deployment ──────────────────────────────────────────── */}
        <section aria-labelledby="vercel-deploy" className="space-y-5">
          <SectionHeading id="vercel-deploy" eyebrow="Step 5" title="Deploy to Vercel">
            Every app deploys from its own source repository to your own Vercel account. The
            &ldquo;Deploy on Vercel&rdquo; button on each card starts Vercel&apos;s official import flow for
            that repository — nothing is deployed on your behalf.
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Step num="01" title="Import the repository">
              Use the Deploy on Vercel action on the app card (or New Project → Import Git Repository)
              and import that app&apos;s repository into your Vercel account.
            </Step>
            <Step num="02" title="Add environment variables">
              Paste the Supabase keys from your project plus any app keys the repository README asks
              for during import. Missing variables fail the build, not your customers.
            </Step>
            <Step num="03" title="Deploy and brand">
              Deploy, open the generated URL, then attach your own domain and rebrand the UI. Repeat
              per app — each app stays its own Vercel project.
            </Step>
          </div>
        </section>

        {/* ── Academy training ───────────────────────────────────────────── */}
        <section aria-labelledby="academy-training" className="space-y-5">
          <SectionHeading id="academy-training" eyebrow="Step 6" title="Academy training access ($597)">
            The Apps + Training package unlocks the instructor-led reseller track in the SmartVideo GO
            Academy.
          </SectionHeading>
          <Panel className="space-y-3">
            <ul className="space-y-2.5 text-xs text-white/70 leading-relaxed font-medium">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee] shrink-0" aria-hidden="true" />
                <span>Sign in with the account that owns the Apps + Training package.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee] shrink-0" aria-hidden="true" />
                <span>
                  Training lessons are gated by the{' '}
                  <span className="font-mono text-[#22d3ee]">apps_studio_training</span> entitlement,
                  which is granted to your account the moment the $597 purchase completes.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#22d3ee] shrink-0" aria-hidden="true" />
                <span>
                  DIY App Builder purchases keep full source access — the training lessons are the
                  only part reserved for the $597 package.
                </span>
              </li>
            </ul>
            <p className="text-[11px] text-white/50 leading-relaxed font-medium">
              {ACADEMY_TRAINING_HAS_DEDICATED_ROUTE ? (
                <>
                  Open the reseller training track at <InternalLink href={ACADEMY_TRAINING_HREF}>/academy/reseller</InternalLink>.
                </>
              ) : (
                <>
                  The dedicated reseller training track is being published in the Academy. Until it
                  goes live, open the <InternalLink href={ACADEMY_TRAINING_HREF}>Academy</InternalLink> and
                  look for the Apps + Training lessons — they unlock automatically for your account
                  once the purchase is active.
                </>
              )}
            </p>
          </Panel>
        </section>

        {/* ── Per-app instructions ───────────────────────────────────────── */}
        <section aria-labelledby="per-app" className="space-y-5">
          <SectionHeading id="per-app" eyebrow="Reference" title="Per-app deployment instructions">
            Every application in the collection, with its source repository, live demo where one
            exists, schema name, and download link. The shared setup above applies to each app; the
            repository README covers app-specific variables.
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RESELLER_APPS.map((app) => (
              <article
                key={app.id}
                id={`app-${app.id}`}
                className="group rounded-lg border border-white/10 bg-[#0a0a0a] p-5 flex flex-col gap-3 transition-all duration-300 hover:border-[#22d3ee]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-extrabold text-white tracking-tight">{app.name}</h3>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/50">
                    {app.category}
                  </span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed font-medium">{app.description}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11px]">
                  <dt className="font-bold uppercase tracking-widest text-white/40">Schema</dt>
                  <dd className="font-mono text-[#22d3ee]">{schemaFor(app.id)}</dd>
                  <dt className="font-bold uppercase tracking-widest text-white/40">Download</dt>
                  <dd className="font-mono text-white/70 break-all">/api/reseller/download?app={app.id}</dd>
                </dl>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                  {app.repo ? (
                    <ExternalLink href={app.repo}>Source repository ↗</ExternalLink>
                  ) : (
                    <span
                      aria-disabled="true"
                      title="Repository not yet published"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/50 rounded"
                    >
                      Source repository ↗
                    </span>
                  )}
                  {app.hosted && <ExternalLink href={app.hosted}>Live demo ↗</ExternalLink>}
                  {app.repo && (
                    <ExternalLink href={`https://vercel.com/new/import?repository-url=${encodeURIComponent(app.repo)}`}>
                      Deploy on Vercel ↗
                    </ExternalLink>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Footer note ────────────────────────────────────────────────── */}
        <footer className="border-t border-white/5 pt-6 pb-10 text-center space-y-2">
          <p className="text-[11px] text-white/50 font-medium leading-relaxed max-w-2xl mx-auto">
            Questions about a purchase or a download? Reply to your Stripe receipt email or open the AI
            Apps page and use the upgrade path — both are tied to the account you bought with.
          </p>
          <InternalLink href="/studio/apps">Back to the AI Apps collection →</InternalLink>
        </footer>
      </main>
    </div>
  );
}
