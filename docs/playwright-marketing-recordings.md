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


## CI Verification

PR #40 includes a branch-only GitHub Actions verifier that uses the repository's protected production test environment to run the recording suite against `https://go.smartvid.app`. It does not permit paid or state-changing requests and uploads only the generated `.webm` recordings plus diagnostics on failure.
