# Chain suggestions from "Looks wrong" flags (suggest-only)

When a signed-in user flags a business with **"It is a chain / franchise"**, the flag is stored under a stable key
(website domain, name+address or phone; see `src/shared/personalization/finderFlagKeys.ts`). The database function
`finder_chain_flag_summary(p_min_users)` reports which keys were flagged by at least N **different** users:

```sql
select * from public.finder_chain_flag_summary(3);
-- business_key                  | distinct_users | last_flagged_at
-- domain:somechain.example.com  | 5              | 2026-11-20 ...
```

- It returns **no user ids**; N is floored at 2, so a single user can never surface a business on their own.
- It is **service-role only** (run it from the Supabase SQL editor or the Supabase tool; the browser cannot call it).
- Nothing reads it automatically. Adding a chain to `NATIONAL_CHAIN_NAMES`
  (`src/server/businessDiscovery/ownershipClassification.ts`) stays a **manual, reviewed code change**.
- With no flags yet it returns nothing.

Also in this migration: the durable enrichment cache (`business_enrichment_cache`) is capped at 5,000 rows and 64 KB per
row; the oldest rows are evicted first and an oversized value is simply not stored.
