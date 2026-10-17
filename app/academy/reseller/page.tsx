import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getAllTracks } from '@/lib/academyLessons';
import {
  canAccessTraining,
  getTrainingEntitlementGap,
  resolveResellerEntitlements,
  type TrainingEntitlementGap,
} from '@/lib/resellerAccess';
import ResellerAcademyView from '@/components/reseller/ResellerAcademyView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reseller Training Academy — Apps + Training · SmartVideo GO AI',
  description:
    'Gated Academy access for the $597 Apps + Training reseller package: existing Academy tracks plus reseller training modules.',
};

/** Neutral gap used only while the entitlement helper is unavailable. */
const ACCESS_PENDING_GAP: TrainingEntitlementGap = {
  entitled: false,
  missingEntitlements: [],
  upgrade: null,
  requiresFullPurchase: false,
};

/**
 * Server-side gate for the reseller training area ($597 /
 * `apps_studio_training`). Signed-out visitors are sent to sign-in;
 * signed-in users without the training entitlement see the locked
 * upgrade state. Existing Academy content is reused via AcademyCourse.
 * If the entitlement helper is unavailable at request time the page
 * renders a safe "access pending" state instead of guessing or
 * fabricating access.
 */
export default async function ResellerAcademyPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/academy/reseller');
  }

  try {
    const user = await resolveResellerEntitlements(userId);
    const entitled = canAccessTraining(user);
    const gap = getTrainingEntitlementGap(user);
    const tracks = getAllTracks();

    return (
      <ResellerAcademyView entitled={entitled} gap={gap} tracks={tracks} />
    );
  } catch {
    return (
      <ResellerAcademyView
        entitled={false}
        gap={ACCESS_PENDING_GAP}
        tracks={[]}
        accessPending
      />
    );
  }
}
