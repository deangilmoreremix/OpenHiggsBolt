'use client';

import React from 'react';
import AcademyCourse from '@/components/academy/AcademyCourse';
import { AcademyCard, Pill, ActionButton, SectionTitle, SparkIcon } from '@/components/academy/primitives';
import { semantic, colors } from '@/shared/styles/designTokens';
import type { AcademyTrack } from '@/lib/academyLessons';
import type { TrainingEntitlementGap } from '@/lib/resellerAccess';
import curriculum from '@/data/resellerTrainingCurriculum.json';

type PendingModule = {
  id: string;
  title: string;
  status: string;
  summary: string;
  requiredArtifacts: string[];
};

const PENDING_MODULES = (curriculum as { modules: PendingModule[] }).modules;

/* ------------------------------------------------------------------ */
/*  Content-pending panel (NO fabricated lessons/videos)               */
/* ------------------------------------------------------------------ */

function ContentPendingPanel() {
  return (
    <AcademyCard className="mt-8">
      <SectionTitle hint="nothing to play yet">
        Reseller training modules — content pending
      </SectionTitle>
      <p className="mb-4 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>
        These modules are required by the Apps + Training package but have NOT been produced
        yet. We list them honestly instead of publishing placeholder lessons or fake videos.
        The existing Academy tracks below are real and available now.
      </p>
      <ul className="space-y-3">
        {PENDING_MODULES.map((mod) => (
          <li
            key={mod.id}
            className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">{mod.title}</span>
              <Pill tone="warn">{mod.status === 'missing' ? 'MISSING' : mod.status}</Pill>
            </div>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>
              {mod.summary}
            </p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: semantic.textLabel }}>
              Required artifacts
            </p>
            <ul className="mt-1 space-y-0.5">
              {mod.requiredArtifacts.map((artifact) => (
                <li key={artifact} className="flex items-start gap-2 text-[11px]" style={{ color: semantic.textMuted }}>
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full" style={{ background: '#fbbf24' }} />
                  <span>{artifact}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </AcademyCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Locked state (DIY-only or unentitled callers)                      */
/* ------------------------------------------------------------------ */

function LockedPanel({ gap }: { gap: TrainingEntitlementGap }) {
  return (
    <AcademyCard className="mt-8">
      <SectionTitle hint="apps_studio_training required">
        Reseller training is locked
      </SectionTitle>
      <p className="text-sm leading-relaxed" style={{ color: semantic.textSecondary }}>
        This area is part of the <strong style={{ color: colors.primary }}>Apps + Training</strong> package
        ($597). {gap.upgrade
          ? `Upgrading from DIY adds instructor-led training for a $${gap.upgrade.priceDifferenceUsd} difference and grants only ${gap.upgrade.grants.join(', ')}.`
          : 'The full package includes every app source bundle plus instructor-led training.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill tone="warn">Missing: {gap.missingEntitlements.join(', ')}</Pill>
        {gap.requiresFullPurchase && <Pill>Full purchase required</Pill>}
      </div>
      <div className="mt-5">
        <ActionButton variant="primary" onClick={() => { window.location.href = '/studio/apps'; }}>
          <SparkIcon /> View reseller packages
        </ActionButton>
      </div>
      <p className="mt-3 text-[11px]" style={{ color: semantic.textMuted }}>
        Upgrade checkout is being wired to the reseller upgrade endpoint; purchases stay
        unavailable until it is live.
      </p>
    </AcademyCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Access-pending state (entitlement helper unavailable at runtime)   */
/* ------------------------------------------------------------------ */

function AccessPendingPanel() {
  return (
    <AcademyCard className="mt-8">
      <SectionTitle hint="apps_studio_training unavailable">
        Reseller training access — pending
      </SectionTitle>
      <p className="text-sm leading-relaxed" style={{ color: semantic.textSecondary }}>
        Entitlements could not be resolved right now, so training access cannot be confirmed. No
        lessons are shown until the check succeeds — nothing here is fabricated. Please retry in a
        moment; if it persists, contact support with your Apps + Training receipt.
      </p>
      <div className="mt-5">
        <ActionButton variant="primary" onClick={() => { window.location.reload(); }}>
          <SparkIcon /> Retry access check
        </ActionButton>
      </div>
    </AcademyCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Gated view                                                         */
/* ------------------------------------------------------------------ */

export default function ResellerAcademyView({
  entitled,
  gap,
  tracks,
  accessPending = false,
}: {
  entitled: boolean;
  gap: TrainingEntitlementGap;
  tracks: AcademyTrack[];
  /** True when the entitlement helper was unavailable — never fabricates access. */
  accessPending?: boolean;
}) {
  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      <header className="mx-auto max-w-7xl px-6 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.primary }}>
          Apps + Training · $597
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-white">Reseller Training Academy</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed" style={{ color: semantic.textSecondary }}>
          Full access to the SmartVideo GO AI Academy plus reseller-specific training modules.
          {accessPending
            ? ' Access status is being confirmed — training content stays hidden until the entitlement check succeeds.'
            : entitled
            ? ' Academy content is unlocked. Reseller-specific modules are still in production and are listed as pending below.'
            : ' Unlock it with the Apps + Training package.'}
        </p>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {accessPending ? (
          <AccessPendingPanel />
        ) : entitled ? (
          <>
            {/* Reuse the existing Academy course UI and primitives. The
                course view needs at least one track; an entitled caller
                with no published tracks still sees the honest pending
                panel instead of an empty (or broken) course shell. */}
            {tracks.length > 0 && <AcademyCourse tracks={tracks} />}
            <ContentPendingPanel />
          </>
        ) : (
          <LockedPanel gap={gap} />
        )}
      </div>
    </div>
  );
}
