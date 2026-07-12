import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { syncUserFromClerk } from '../../../../src/lib/tenantSync';
import { getSupabaseAdmin } from '../../../../src/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req, {
      signingSecret:
        process.env.CLERK_WEBHOOK_SIGNING_SECRET ?? process.env.CLERK_WEBHOOK_SECRET,
    });
  } catch (err) {
    console.error('[clerk webhook] verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = event;

  if (type === 'user.created' || type === 'user.updated') {
    const primary = data.email_addresses.find(
      (e: { id: string }) => e.id === data.primary_email_address_id
    );
    try {
      await syncUserFromClerk(
        data.id,
        primary?.email_address ?? data.email_addresses[0]?.email_address ?? null,
        data.first_name ?? null,
        data.last_name ?? null,
        data.image_url ?? null
      );
    } catch (err) {
      console.error('[clerk webhook] sync failed', err);
      return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
  }

  if (type === 'user.deleted' && data.id) {
    const supabase = getSupabaseAdmin();
    await supabase.from('app_users').delete().eq('clerk_user_id', data.id);
  }

  return NextResponse.json({ ok: true });
}

