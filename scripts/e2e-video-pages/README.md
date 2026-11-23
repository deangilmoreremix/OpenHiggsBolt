# Video Pages end-to-end checks

```bash
pnpm install
bash scripts/e2e-video-pages/run.sh      # or: npm run e2e:video-pages
```

What it runs (about 3 minutes, mostly the first Next.js compile):

| Spec | Checks |
|---|---|
| `public.cjs` | `/p/<slug>` renders on desktop and phone with no overflow; unpublished and malformed ids return 404; `?c=` greets the contact and never exposes their email; the lead form and view events reach the server routes |
| `studio.cjs` | Video Pages studio: page list, new-page flow with 34 designs, editor in the app's dark theme, save, publish, personal links (CSV import, mapping, skipped rows, remove), AI rewrite review/apply/undo (words only, structure unchanged), MailerLite connect and push, analytics |

Everything external is faked: a small Supabase REST server (`fake-supabase.cjs`), dummy Clerk keys with signed-out cookies, and the OpenAI and MailerLite routes are mocked in the browser. `harness-page.tsx` is copied to `app/harness-e2e/` while the run lasts and removed afterwards, so nothing extra ships.

Not covered: real Clerk sign-in, real Supabase RLS (see the SQL assertions in the migration review), real OpenAI and MailerLite calls.
