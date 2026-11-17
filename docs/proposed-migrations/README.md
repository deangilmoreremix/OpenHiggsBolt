# Proposed migrations

Files here are **proposals for owner review**; they sit outside `supabase/migrations/` so nothing applies them
automatically. Nothing is pending right now.

The finder-continuity (E8) proposals were approved and applied on 2026-11-15, and are recorded as migrations:

- `supabase/migrations/20261115000000_finder_continuity_tables.sql` (tables, RLS)
- `supabase/migrations/20261115000100_finder_continuity_rpcs.sql` (server RPCs, service-role only)

Favourites are not part of E8: `lead_finder_leads.starred` already covers them.
