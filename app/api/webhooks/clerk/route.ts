import { verifyWebhook } from '@clerk/nextjs/webhooks';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type EmailEntry = { id: string; email_address: string; verification?: { status?: string } };

function primaryEmail(event: WebhookEvent): { email: string | null; verified: boolean } {
  const data = event.data as {
    email_addresses?: EmailEntry[];
    primary_email_address_id?: string | null;
  };
  const list = data.email_addresses ?? [];
  const primary = list.find((e) => e.id === data.primary_email_address_id) ?? list[0];
  const verified = primary?.verification?.status === 'verified';
  return { email: primary?.email_address ?? null, verified };
}

export async function POST(request: NextRequest) {
  let event: WebhookEvent;
  try {
    event = await verifyWebhook(request);
  } catch (err) {
    console.error('[clerk webhook] verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'user.created' && event.type !== 'user.updated') {
    return NextResponse.json({ received: true });
  }

  const { id, first_name, last_name, image_url } = event.data as {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };

  const { email, verified } = primaryEmail(event);
  const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || email || id;

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('users').upsert(
      {
        id,
        name,
        email,
        email_verified: verified,
        image: image_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('[clerk webhook] supabase upsert failed', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (err) {
    console.error('[clerk webhook] supabase error', err);
    return NextResponse.json({ error: 'Supabase write failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
