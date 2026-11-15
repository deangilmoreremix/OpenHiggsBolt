# Proposed migrations (not applied)

Files here are **proposals for owner review**. They are deliberately outside `supabase/migrations/`, so nothing
applies them automatically. To adopt one: review it, copy it into `supabase/migrations/` with a timestamped name,
and apply it through the normal migration route.

- `PROPOSED_e8_finder_continuity.sql` — saved searches, "looks wrong" feedback, and a public-data enrichment cache.
  Favourites are not included: `lead_finder_leads.starred` already covers them.
