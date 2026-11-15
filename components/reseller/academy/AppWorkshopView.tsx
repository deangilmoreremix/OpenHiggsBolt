'use client';

import React from 'react';
import { semantic, colors } from '@/shared/styles/designTokens';
import { AcademyCard, Pill, SectionTitle } from '@/components/academy/primitives';
import { RESELLER_APPS, vercelImportUrl } from '@/packages/studio/src/components/AppsStudio';
import { getWorkshop } from '@/lib/resellerAcademyApps';
import { AppPanel, SourceBanner } from './AppPanel';
import { useAcademyProgress } from './useAcademyProgress';
import { Rich } from './Rich';

/**
 * One workshop template for every app. All app-specific content comes from
 * src/data/resellerAppFacts.json (read from each app's real source). The page
 * is rendered only after the existing server-side training gate passes.
 */
export default function AppWorkshopView({ appId, syncRemote = true }: { appId: string; syncRemote?: boolean }) {
  const p = useAcademyProgress(syncRemote);
  const w = getWorkshop(appId);
  const app = RESELLER_APPS.find((a: { id: string }) => a.id === appId);
  if (!w || !app) return null;
  const importUrl = w.vercelButton ? vercelImportUrl(w.repoUrl) : null;
  const selected = p.progress.selectedAppId === appId;
  const cli = w.readiness === 'cli-only';

  const link = (href: string, label: string, ext = true) => (
    <a href={href} className="underline" style={{ color: colors.primary }} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}{ext ? ' ↗' : ''}</a>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5" data-testid="app-workshop">
      <nav aria-label="Breadcrumb" className="text-xs" style={{ color: semantic.textSecondary }}>
        {link('/academy/reseller/launch', 'Reseller Academy', false)} · {link(`/studio/apps#app-card-${appId}`, `Back to ${app.name} in the Reseller Studio`, false)}
      </nav>

      <AcademyCard>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.primary }}>App workshop</p>
        <h1 className="mt-1 text-2xl font-extrabold text-white">Launch {app.name}</h1>
        <p className="mt-1 max-w-[68ch] text-sm leading-relaxed" style={{ color: semantic.textSecondary }}>{app.description}</p>
        <SourceBanner w={w} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {w.demoUrl && <a className="rounded-full px-4 py-1.5 text-xs font-bold text-black" style={{ background: colors.primary }} href={w.demoUrl} target="_blank" rel="noopener noreferrer">Try Live Demo ↗</a>}
          {w.repoUrl && <a className="rounded-full border px-4 py-1.5 text-xs font-bold text-white" style={{ borderColor: 'var(--glass-border)' }} href={w.repoUrl} target="_blank" rel="noopener noreferrer">Source Code ↗</a>}
          <a className="rounded-full border px-4 py-1.5 text-xs font-bold text-white" style={{ borderColor: 'var(--glass-border)' }} href={`/reseller/deployment#app-${appId}`}>Deployment Guide</a>
          {importUrl ? (
            <a className="rounded-full border px-4 py-1.5 text-xs font-bold text-white" style={{ borderColor: 'var(--glass-border)' }} href={importUrl} target="_blank" rel="noopener noreferrer">Deploy on Vercel ↗</a>
          ) : (
            <Pill tone="warn">{cli ? 'No Vercel deployment for this tool' : 'One-click Vercel import not enabled yet for this app'}</Pill>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!p.ready || selected}
            onClick={() => p.selectApp(appId)}
            className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-60"
            style={{ borderColor: 'rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.15)', color: colors.primary }}
          >
            {selected ? 'This is your selected app ✓' : 'Make this my selected app'}
          </button>
          <a className="text-sm font-semibold underline" style={{ color: colors.primary }} href="/academy/reseller/launch">Open the 12-module course →</a>
        </div>
      </AcademyCard>

      {cli ? (
        <AcademyCard>
          <SectionTitle>What this means for you</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: semantic.textSecondary }}>
            This application is a Python command-line tool, not a web app. It has no sign-in, no Stripe checkout and no webhook, so the Vercel and Stripe lessons in the course do not apply to it. Read its README for how to run it. If you want to sell a hosted version, choose one of the other apps for your first launch.
          </p>
        </AcademyCard>
      ) : (
        <>
          <AcademyCard><AppPanel appId={appId} kind="accounts" /></AcademyCard>
          <AcademyCard><AppPanel appId={appId} kind="envvars" /></AcademyCard>
          <AcademyCard><AppPanel appId={appId} kind="database" /></AcademyCard>
          <AcademyCard><AppPanel appId={appId} kind="stripe" /></AcademyCard>
          <AcademyCard><AppPanel appId={appId} kind="webhook" /></AcademyCard>
          <AcademyCard><AppPanel appId={appId} kind="plans" /></AcademyCard>

          <AcademyCard>
            <SectionTitle>How to verify your launch</SectionTitle>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm" style={{ color: 'rgba(255,255,255,0.88)' }}>
              {w.verification.map((v) => <li key={v}><Rich text={v} /></li>)}
            </ol>
          </AcademyCard>

          <AcademyCard>
            <SectionTitle>Common errors for this app</SectionTitle>
            <div className="space-y-1.5">
              {w.commonErrors.map((e) => (
                <details key={e.problem} className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--glass-border)' }}>
                  <summary className="cursor-pointer text-xs font-semibold text-white">{e.problem}</summary>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>{e.fix}</p>
                </details>
              ))}
            </div>
          </AcademyCard>
        </>
      )}

      {w.facts.notes.length > 0 && (
        <AcademyCard>
          <SectionTitle hint="from the code review">Notes</SectionTitle>
          <ul className="list-disc space-y-1 pl-5 text-xs" style={{ color: semantic.textSecondary }}>
            {w.facts.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </AcademyCard>
      )}
    </div>
  );
}
