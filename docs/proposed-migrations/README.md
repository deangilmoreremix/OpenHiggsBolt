# Proposed migrations

Files here are **proposals for owner review**. They are deliberately outside `supabase/migrations/`, so nothing
applies them automatically. To adopt one: review it, copy it into `supabase/migrations/` with a timestamped name,
and apply it through the normal migration route.

- `PROPOSED_e8_finder_continuity.sql` — the three tables. **Approved and applied 2026-11-15** as migration
  `finder_continuity_tables`; recorded in `supabase/migrations/20261115000000_finder_continuity_tables.sql`.
- `PROPOSED_e8_finder_rpcs.sql` — server RPCs the routes need (same pattern as `lead_finder_leads_*`).
  **Not applied; waiting for the owner's yes.**

Favourites are not part of this: `lead_finder_leads.starred` already covers them.
