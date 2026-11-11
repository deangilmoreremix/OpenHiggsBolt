import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import {
  canAccessTraining,
  getTrainingEntitlementGap,
  resolveResellerEntitlements,
  type TrainingEntitlementGap,
} from '@/lib/resellerAccess';
import ResellerAcademyView from '@/components/reseller/ResellerAcademyView';
import ResellerAcademyShell from '@/components/reseller/academy/ResellerAcademyShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reseller Setup Walkthrough — Reseller Academy · SmartVideo GO AI',
  description: '12-module guided course: choose an app, deploy it, connect Stripe, and start selling.',
};

const ACCESS_PENDING_GAP: TrainingEntitlementGap = {
  entitled: false,
  missingEntitlements: [],
  upgrade: null,
  requiresFullPurchase: false,
};

/**
 * Separate page; the existing /academy/reseller page is untouched. Same access
 * rule (`canAccessTraining`, unchanged) and the same existing locked /
 * access-pending panels for everyone else.
 */
export default async function LaunchCoursePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/academy/reseller/launch');

  try {
    const user = await resolveResellerEntitlements(userId);
    if (!canAccessTraining(user)) {
      return <ResellerAcademyView entitled={false} gap={getTrainingEntitlementGap(user)} tracks={[]} />;
    }
  } catch {
    return <ResellerAcademyView entitled={false} gap={ACCESS_PENDING_GAP} tracks={[]} accessPending />;
  }

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      <header className="mx-auto max-w-7xl px-6 pt-8">
        <a href="/academy/reseller" className="text-xs underline" style={{ color: 'var(--color-primary)' }}>← Reseller Training Academy</a>
        <h1 className="mt-2 text-2xl font-extrabold text-white">Reseller Setup Walkthrough</h1>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <ResellerAcademyShell />
      </div>
    </div>
  );
}
