# Playwright Marketing Recordings

This directory contains the polished SmartVideo GO marketing recording suite.

## Local Recording

1. Configure demo credentials in `.env.local`:
   - `E2E_CLERK_USER_EMAIL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
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

When `DEMO_BASE_URL` points to a remote origin, the recordings config does not start the local Next.js server. Auth state remains origin-specific.

## Safety

- Mutating MuAPI, OpenAI, workflow, agent, personalization, checkout, purchase, and publishing requests are blocked before they leave the browser.
- The recording suite records blocked requests and fails the test if any are attempted.
- Auth state is origin-specific and stored under `playwright/.clerk/`.
- Video artifacts and auth state files are gitignored.
- Do not document or commit secret values.

## Suite Separation

- `e2e/marketing-demos/` — functional validation
- `e2e/marketing-recordings/` — polished customer-facing recordings


## CI Note

The repository currently has a broader GitHub Actions execution problem: existing production acceptance jobs can fail before any workflow step starts. Use the local commands above for executable verification until that repository-level runner issue is resolved.

A manual production verifier is available on `main` for later use once Actions jobs execute normally again.
