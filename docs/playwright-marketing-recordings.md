# Playwright Marketing Recordings

This directory contains the polished SmartVideo GO marketing recording suite.

## Local Recording

1. Configure demo credentials in `.env.local`:
   - `E2E_CLERK_USER_EMAIL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `DEMO_BASE_URL=http://localhost:3111`

2. Authenticate:
   ```bash
   npm run recordings:auth:local
   ```

3. Capture recordings:
   ```bash
   npm run recordings:capture:local
   ```

4. Output files are written to:
   ```bash
   playwright/marketing-recordings/
   ```

## Production Recording

Production recording requires authorized production credentials.

```bash
DEMO_BASE_URL=https://go.smartvid.app npm run recordings:auth
DEMO_BASE_URL=https://go.smartvid.app npm run recordings:capture
```

## Safety

- No paid generation endpoints are allowed during recordings.
- The recording suite throws a clear test error if a forbidden generation/purchase request is attempted.
- Auth state is origin-specific and stored under `playwright/.clerk/`.
- Video artifacts and auth state files are gitignored.
- Do not document or commit secret values.

## Suite Separation

- `e2e/marketing-demos/` — functional validation
- `e2e/marketing-recordings/` — polished customer-facing recordings
