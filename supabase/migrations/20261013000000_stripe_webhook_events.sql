-- Stripe webhook idempotency ledger
--
-- One row per processed Stripe event id. The webhook claims an event id before
-- applying any entitlement mutation, so a re-delivered event (for example a
-- checkout.session.completed replayed after a refund) can never re-grant
-- access that was already revoked. Rows are retained for audit and are safe to
-- prune by processed_at.

create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

create index if not exists stripe_webhook_events_processed_at_idx
  on public.stripe_webhook_events(processed_at desc);

alter table public.stripe_webhook_events enable row level security;

drop policy if exists "Service role manages stripe webhook events" on public.stripe_webhook_events;

-- No authenticated/anon policy: this table is written only by the webhook route
-- through the service-role client, which is the only role granted access.
create policy "Service role manages stripe webhook events"
  on public.stripe_webhook_events for all
  to service_role
  using (true)
  with check (true);
