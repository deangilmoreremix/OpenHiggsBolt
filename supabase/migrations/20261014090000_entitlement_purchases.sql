-- Purchase ledger for payment entitlements.
--
-- `public.user_purchases` is an append-mostly audit/reconciliation ledger of
-- verified Stripe purchases. Every checkout.session.completed webhook upserts
-- a row here (keyed by stripe_session_id) BEFORE any entitlement is granted,
-- so a purchase can never be silently dropped: if the entitlement write fails,
-- Stripe retries the event and the ledger row is already durable.
--
-- This table NEVER stores card data. It holds only Stripe object identifiers
-- (session / payment intent / customer), the price id, the amount and currency
-- Stripe reports on the event, and the resolution outcome. Card numbers, CVCs
-- and full bank details only ever exist inside Stripe (PCI SAQ-A); nothing
-- sensitive is accepted or persisted here.
--
-- Rows are matched back to buyers by email or clerk_user_id so that:
--   * refunds / disputes can revoke the matching entitlement row(s)
--   * a purchase made before the buyer had a Clerk account can be adopted
--     later by POST /api/access/restore (email-keyed entitlement rows).
--
-- Writes happen exclusively through the service role (server-side webhooks and
-- reconciliation scripts), exactly like user_entitlements; RLS exposes an
-- owner-scoped SELECT only. Re-runnable: every statement is idempotent.

create table if not exists public.user_purchases (
  id text primary key default gen_random_uuid()::text,
  -- Nullable: a purchase can be recorded before the buyer has a Clerk account
  -- (the entitlement row is then keyed 'email:<normalizedEmail>').
  clerk_user_id text,
  email text not null,
  stripe_session_id text unique,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  stripe_price_id text,
  entitlement_key text,
  amount_total bigint,
  currency text,
  -- 'pending' | 'paid' | 'refunded' | 'disputed'
  purchase_status text not null default 'pending',
  livemode boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_purchases_email_idx on public.user_purchases(email);
create index if not exists user_purchases_clerk_user_id_idx on public.user_purchases(clerk_user_id);
create index if not exists user_purchases_payment_intent_idx on public.user_purchases(stripe_payment_intent_id);
create index if not exists user_purchases_customer_id_idx on public.user_purchases(stripe_customer_id);
create unique index if not exists user_purchases_stripe_session_id_unique on public.user_purchases(stripe_session_id);

alter table public.user_purchases enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_purchases'
      and policyname = 'Users can view own purchases'
  ) then
    create policy "Users can view own purchases"
      on public.user_purchases for select
      using (clerk_user_id = current_setting('app.clerk_user_id', true));
  end if;
end $$;

comment on table public.user_purchases is
  'Audit/reconciliation ledger of verified Stripe purchases. Never stores card data; all writes are service-role only.';

-- Supporting changes for the entitlement lifecycle (refund + subscription
-- handling). Both are additive and idempotent.
alter table public.user_entitlements add column if not exists revoked_reason text;
create index if not exists user_entitlements_stripe_customer_id_idx on public.user_entitlements(stripe_customer_id);
