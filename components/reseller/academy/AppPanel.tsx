'use client';

import React from 'react';
import { semantic, colors } from '@/shared/styles/designTokens';
import { Pill } from '@/components/academy/primitives';
import type { AppPanelKind } from '@/content/resellerAcademy';
import { ROLE_LABEL, formatUsd, getWorkshop, placeholderFor, type WorkshopSummary } from '@/lib/resellerAcademyApps';
import { CopyBlock } from './CopyBlock';

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-3">
      <dt className="w-44 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide" style={{ color: semantic.textLabel }}>{k}</dt>
      <dd className="min-w-0 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{children}</dd>
    </div>
  );
}

export function SourceBanner({ w }: { w: WorkshopSummary }) {
  const tone = w.readiness === 'ready' ? 'primary' : 'warn';
  return (
    <p className="mb-3 flex items-start gap-2 text-[11px] leading-relaxed" style={{ color: semantic.textSecondary }}>
      <Pill tone={tone}>{w.readiness === 'ready' ? 'Verified from destination source' : w.readiness === 'cli-only' ? 'Python CLI' : 'Upstream-derived'}</Pill>
      <span>{w.sourceStatement}</span>
    </p>
  );
}

function EnvTable({ w, roles }: { w: WorkshopSummary; roles?: string[] }) {
  const rows = w.requiredEnv.filter((e) => !roles || roles.includes(e.role));
  if (!rows.length) return <p className="text-xs" style={{ color: semantic.textSecondary }}>No variables of this kind were found in the app source.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead>
          <tr style={{ color: semantic.textLabel }}>
            <th className="py-1 pr-3 font-semibold">Variable</th>
            <th className="py-1 pr-3 font-semibold">Used for</th>
            <th className="py-1 font-semibold">What you enter</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.name} className="border-t" style={{ borderColor: 'var(--glass-border)' }}>
              <td className="py-1.5 pr-3 font-mono" style={{ color: colors.primary }}>{e.name}</td>
              <td className="py-1.5 pr-3" style={{ color: semantic.textSecondary }}>
                {ROLE_LABEL[e.role] ?? e.role}
                {e.secret && <span className="ml-1.5"><Pill tone="warn">secret</Pill></span>}
              </td>
              <td className="py-1.5 font-mono" style={{ color: semantic.textMuted }}>{placeholderFor(e)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Verified, per-app facts for a lesson. Never shows values — only names and placeholders. */
export function AppPanel({ appId, kind }: { appId: string | null; kind: AppPanelKind }) {
  const w = appId ? getWorkshop(appId) : null;
  if (!w) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-xs" style={{ borderColor: 'var(--glass-border)', color: semantic.textSecondary }}>
        Choose your application on the dashboard to see its verified details here.
      </div>
    );
  }
  const f = w.facts;
  const title: Record<AppPanelKind, string> = {
    overview: 'Your application', accounts: 'Accounts this app needs', muapi: 'MuAPI configuration', database: 'Database',
    envvars: 'Environment variables for Vercel', stripe: 'Stripe in this app', webhook: 'Stripe webhook', plans: 'Credit packs (defaults in the code)',
    branding: 'Branding options in this app', launch: 'Launch checks for this app',
  };

  let body: React.ReactNode;
  switch (kind) {
    case 'overview':
      body = (
        <dl>
          <Row k="App">{f.name} · {f.category}</Row>
          <Row k="Source repository">{w.repoUrl ? <a className="underline" style={{ color: colors.primary }} href={w.repoUrl} target="_blank" rel="noopener noreferrer">{w.repoUrl.replace('https://github.com/', '')}</a> : 'No verified destination repository yet (owner item).'}</Row>
          <Row k="Live demo">{w.demoUrl ? <a className="underline" style={{ color: colors.primary }} href={w.demoUrl} target="_blank" rel="noopener noreferrer">Open demo</a> : 'No demo exists for this app.'}</Row>
          <Row k="Deploy on Vercel">{w.vercelButton ? 'One-click import is enabled on the app card.' : 'Not enabled yet for this app — see the status note above.'}</Row>
        </dl>
      );
      break;
    case 'accounts':
      body = (
        <ul className="list-disc space-y-1 pl-4 text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
          <li>GitHub (your copy of the source)</li>
          <li>MuAPI ({w.aiKeyVars.map((v) => v).join(', ') || 'AI key'})</li>
          <li>{w.usesSupabaseKeys ? 'Supabase (this app reads Supabase-specific keys)' : 'A PostgreSQL host such as Supabase or Neon'}</li>
          <li>Google Cloud (Sign in with Google)</li>
          <li>Vercel</li>
          <li>Stripe</li>
        </ul>
      );
      break;
    case 'muapi':
      body = (
        <dl>
          <Row k="Variable name">{w.aiKeyVars.length ? w.aiKeyVars.map((v) => <code key={v} className="mr-2 font-mono" style={{ color: colors.primary }}>{v}</code>) : 'No AI key variable was found in the source.'}</Row>
          <Row k="Where it goes">Vercel → Settings → Environment Variables (Production). Never in code or screenshots.</Row>
        </dl>
      );
      break;
    case 'database':
      body = (
        <dl>
          <Row k="Stack">{f.database.prisma ? 'Prisma + PostgreSQL' : 'No Prisma schema found'}</Row>
          <Row k="Variables">{f.envVars.filter((e) => e.role === 'database').map((e) => e.name).join(', ') || 'none found'}</Row>
          <Row k="Supabase-specific keys">{w.usesSupabaseKeys ? 'Yes — this app also reads Supabase client/service keys (see table).' : 'No. Any PostgreSQL database works; Supabase is just one option.'}</Row>
          <Row k="Tables">{f.database.prismaMigrationsPresent || f.database.supabaseMigrationsPresent ? 'Migration files are included.' : 'No migration files ship with the app. Create the tables with prisma db push (the app README documents this).'}</Row>
          <Row k="Variables table"><EnvTable w={w} roles={['database']} /></Row>
        </dl>
      );
      break;
    case 'envvars':
      body = <EnvTable w={w} />;
      break;
    case 'stripe':
      body = (
        <dl>
          <Row k="Payment model">{f.payment.model === 'credit-packs-one-time' ? 'One-time credit packs (Stripe Checkout, payment mode). No subscriptions.' : f.payment.model}</Row>
          <Row k="Checkout route(s)">{f.payment.checkoutRoutes.map((r) => <code key={r} className="mr-2 font-mono">{r}</code>)}</Row>
          <Row k="Stripe Products / Prices">Not required — pack names, credits and prices are defined in <code className="font-mono">{f.payment.configFile ?? 'the app config'}</code>.</Row>
          <Row k="Webhook event handled">{f.payment.eventsHandled.join(', ') || 'none found'}</Row>
          <Row k="Stripe variables"><EnvTable w={w} roles={['stripe']} /></Row>
        </dl>
      );
      break;
    case 'webhook':
      body = (
        <dl>
          <Row k="Endpoint to register">{f.payment.recommendedWebhookPath ? <><code className="font-mono" style={{ color: colors.primary }}>https://YOUR-DOMAIN{f.payment.recommendedWebhookPath}</code></> : 'No Stripe webhook route was found in the source.'}</Row>
          <Row k="Event">checkout.session.completed</Row>
          <Row k="Other webhook-style routes">{f.payment.webhookRoutes.filter((r) => r !== f.payment.recommendedWebhookPath).join(', ') || 'None'}</Row>
          <Row k="Signing secret variable"><code className="font-mono">STRIPE_WEBHOOK_SECRET</code> (separate value for test and live)</Row>
        </dl>
      );
      break;
    case 'plans':
      body = f.payment.plans.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr style={{ color: semantic.textLabel }}><th className="py-1 pr-3">Pack</th><th className="py-1 pr-3">Credits</th><th className="py-1">Default price</th></tr></thead>
            <tbody>
              {f.payment.plans.map((p) => (
                <tr key={p.key} className="border-t" style={{ borderColor: 'var(--glass-border)' }}>
                  <td className="py-1.5 pr-3">{p.name ?? p.key}</td>
                  <td className="py-1.5 pr-3">{p.credits ?? '—'}</td>
                  <td className="py-1.5">{formatUsd(p.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px]" style={{ color: semantic.textMuted }}>Edit these in <code className="font-mono">{f.payment.configFile}</code> in your fork. Amounts are in cents.</p>
        </div>
      ) : (
        <p className="text-xs" style={{ color: semantic.textSecondary }}>No credit packs were found in this app's configuration.</p>
      );
      break;
    case 'branding':
      body = (
        <dl>
          <Row k="App name">Set <code className="font-mono">appName</code> in <code className="font-mono">{f.payment.configFile ?? 'src/lib/config.js'}</code>.</Row>
          <Row k="Theme variable">{w.optionalEnv.some((e) => e.name === 'NEXT_PUBLIC_THEME') ? <code className="font-mono">NEXT_PUBLIC_THEME</code> : 'This app does not read a theme variable.'}</Row>
        </dl>
      );
      break;
    case 'launch':
      body = <ol className="list-decimal space-y-1 pl-4 text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>{w.verification.map((v) => <li key={v}>{v}</li>)}</ol>;
      break;
  }

  return (
    <section aria-label={title[kind]} className="mt-3 rounded-xl border p-4" style={{ borderColor: 'rgba(34,211,238,0.25)', background: 'rgba(34,211,238,0.03)' }}>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: colors.primary }}>{title[kind]}</h4>
      <SourceBanner w={w} />
      {body}
      {f.payment.model !== 'not-found-in-source' && kind === 'stripe' && f.payment.webhookRoutes.length > 1 && (
        <CopyBlock label="Webhook path to register" value={f.payment.recommendedWebhookPath ?? ''} />
      )}
    </section>
  );
}
