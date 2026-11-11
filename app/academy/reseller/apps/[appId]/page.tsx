import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import {
  canAccessTraining,
  getResellerApp,
  getTrainingEntitlementGap,
  resolveResellerEntitlements,
  type TrainingEntitlementGap,
} from '@/lib/resellerAccess';
import ResellerAcademyView from '@/components/reseller/ResellerAcademyView';
import AppWorkshopView from '@/components/reseller/academy/AppWorkshopView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'App launch workshop — Reseller Academy · SmartVideo GO AI',
  description: 'Step-by-step launch workshop for one reseller application, generated from its real source code.',
};

const ACCESS_PENDING_GAP: TrainingEntitlementGap = {
  entitled: false,
  missingEntitlements: [],
  upgrade: null,
  requiresFullPurchase: false,
};

/**
 * Per-app workshop. Uses EXACTLY the same access rule as /academy/reseller
 * (`canAccessTraining`, unchanged): signed-out → sign-in; not entitled →
 * the existing locked panel; entitlement lookup failure → the existing
 * access-pending panel. Unknown app ids 404.
 */
export default async function AppWorkshopPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/academy/reseller/apps/${appId}`)}`);
  }
  if (!getResellerApp(appId)) notFound();

  try {
    const user = await resolveResellerEntitlements(userId);
    if (!canAccessTraining(user)) {
      return <ResellerAcademyView entitled={false} gap={getTrainingEntitlementGap(user)} tracks={[]} />;
    }
  } catch {
    return <ResellerAcademyView entitled={false} gap={ACCESS_PENDING_GAP} tracks={[]} accessPending />;
  }

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: '#050505' }}>
      <AppWorkshopView appId={appId} />
    </div>
  );
}
