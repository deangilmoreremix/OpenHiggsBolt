import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { syncUserFromClerk } from '../../../../src/lib/tenantSync';
import { getSupabaseAdmin } from '../../../../src/lib/supabaseServer';

export const runtime = 'nodejs';

type ClerkEmailAddress = { id: string; email_address: string };
type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    email_addresses: ClerkEmailAddress[];
    primary_email_address_id: string | null;
    deleted?: boolean;
  };
};

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'CLERK_WEBHOOK_SECRET is not set' },
      { status: 500 }
    );
  }

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(secret);

  let event: ClerkUserEvent;
  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = event;

  if (type === 'user.created' || type === 'user.updated') {
    const primary = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id
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
