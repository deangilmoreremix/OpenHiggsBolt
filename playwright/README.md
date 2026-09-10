# Production Acceptance Testing Setup

This directory contains Playwright tests for authenticated production acceptance testing of all 14 studio routes.

## Required GitHub Secrets

The following secrets must be configured in the repository settings under **Settings → Secrets and variables → Actions**:

| Secret | Description | Required |
|--------|-------------|----------|
| `E2E_TEST_EMAIL` | Clerk test account email | Yes |
| `E2E_TEST_PASSWORD` | Clerk test account password | Yes |
| `CLERK_TESTING_TOKEN` | Clerk testing token for the test account | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production Clerk publishable key | Yes |
| `NEXT_PUBLIC_CLERK_SECRET_KEY` | Production Clerk secret key | Yes |

## Test Account Setup

1. Create a dedicated QA account in your Clerk production instance
2. Ensure the account has the correct application entitlement
3. Generate a Clerk testing token for the account
4. Store credentials in GitHub Secrets as listed above

## Running Tests Locally

```bash
# Set environment variables
export E2E_TEST_EMAIL="your-test-account@example.com"
export E2E_TEST_PASSWORD="your-test-password"
export CLERK_TESTING_TOKEN="your-clerk-testing-token"
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
export NEXT_PUBLIC_CLERK_SECRET_KEY="sk_live_..."

# Run tests
npx playwright test e2e/studio-production-acceptance.spec.ts --config=playwright.production.config.ts
```

## Running Tests in CI

The workflow `production-acceptance.yml` runs automatically on pushes to `main` and can be triggered manually from the GitHub Actions tab.

## Security Notes

- Authentication state is stored in `playwright/.auth/` (gitignored)
- Test artifacts are uploaded to GitHub Actions with 30-day retention
- Auth state artifacts have 7-day retention
- No credentials are committed to the repository
- No production authentication bypass is used
