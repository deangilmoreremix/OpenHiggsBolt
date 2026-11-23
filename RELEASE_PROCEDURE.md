# SmartVideo GO AI — Netlify Production Release Procedure

**Site:** `marvelous-strudel-a6dc23` (site ID `76f606a3-8546-440f-8469-33a0236a8a23`)
**Production URL:** https://go.smartvid.app
**App:** Next.js 15 (App Router) deployed via `@netlify/plugin-nextjs` (Essential Next.js)

## 1. Why this procedure exists

Production deployments were previously executed through the Netlify CLI **without** `--build`
(`netlify deploy --prod`). That skips the `next build` step and the `@netlify/plugin-nextjs`
plugin entirely, so the raw `.next` server output was published as a static site. That output
contains no `.html` files and no Netlify Functions, causing every route (`/`,
`/personalization-demo`, `/api/personalization/*`, `/api/v1/*`) to return HTTP 404 and the
framework to be misdetected.

This procedure makes production promotion an explicit, gated, verifiable action.

## 2. Required safeguards (always)

- **Never** run `netlify deploy --prod` during ordinary development.
- **Never** run `netlify deploy --prod` without `--build`.
- **Never** run `netlify deploy --prod` without a successful preview smoke test.
- Production promotion requires **explicit release authorization** (a human approves after
  reviewing the preview smoke-test results).
- Development agents / automation must not execute production deployments.
- A record of the deployed Git commit and Netlify deploy ID is kept for every release.

## 3. Release process (Development → Build → Preview → Smoke tests → Approve → Production → Verify)

### Step A — Prepare (local)

1. Create a dedicated release branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b release/production-<date>
   ```
2. Verify the working tree is clean:
   ```bash
   git status --short
   ```
3. Record the commit to be released:
   ```bash
   git rev-parse HEAD
   ```

### Step B — Build (local)

4. Run the production build:
   ```bash
   npm run build
   ```
   The build must exit 0 with no errors. Warnings are acceptable only if pre-existing and
   unrelated.

### Step C — Preview deployment

5. Deploy a preview (NOT production) with the build:
   ```bash
   NETLIFY_AUTH_TOKEN=<token> netlify deploy --build
   ```
   This runs `next build` + `@netlify/plugin-nextjs` on Netlify and publishes a deploy preview.
   Capture the preview URL from the output.

### Step D — Smoke tests (against the live preview)

6. Run smoke tests against the actual deployed preview URL (not localhost). The release
   script (`scripts/release.mjs`) automates this. Required checks:

   | Route | Method | Expected | Pass criterion |
   |---|---|---|---|
   | `/` | GET | Landing page renders | HTTP 200, body contains landing-page markup |
   | `/personalization-demo` | GET | Demo renders | HTTP 200 |
   | `/studio` | GET | Page or auth redirect | HTTP 200, or 302/307 to `/sign-in` |
   | `/api/personalization/find-businesses` | POST | Handler responds | NOT HTTP 404 (400/401/200 acceptable) |
   | `/api/personalization/discover-assets` | POST | Handler responds | NOT HTTP 404 (400/401/200 acceptable) |
   | `/api/v1/account/balance` | GET | Authenticated API behavior | NOT HTTP 404 (401/400 acceptable; requires API key for 200) |

   - Fail if the landing page returns 404 or 5xx.
   - Fail if any required API route returns 404 (missing route).
   - Do not accept an arbitrary 200 as proof; assert the correct handler/status per contract.

### Step E — Explicit production approval

7. A human reviewer confirms the preview smoke tests passed and authorizes production promotion.
   The release script pauses here and requires an explicit `--approve-production` flag (or
   interactive confirmation) before continuing.

### Step F — Production deployment

8. Promote to production:
   ```bash
   NETLIFY_AUTH_TOKEN=<token> netlify deploy --build --prod
   ```
   Record the production deploy ID and URL.

### Step G — Production verification

9. Re-run the smoke-test table against `https://go.smartvid.app`. All checks must pass.
   Fail release verification if the landing page returns 404 or 5xx, or if required API
   routes return 404.

### Step H — Record

10. Record in the release log: Git commit, Netlify preview deploy ID, Netlify production
    deploy ID, smoke-test results, approver, timestamp.

## 4. Rollback procedure

If a production release breaks critical routes:

1. Identify the last known-good production deploy ID from Netlify (site deploys history).
2. Roll back in the Netlify Dashboard (Site deploys → select prior deploy → "Roll back this
   deploy") **or** via CLI:
   ```bash
   NETLIFY_AUTH_TOKEN=<token> netlify deploy --prod <deploy-id>
   ```
   (re-publish the prior deploy ID to production).
3. Re-run the production smoke-test table against `https://go.smartvid.app`.
4. If routes still fail, repeat with an earlier deploy ID until a working version is live.
5. Document the rollback in the release log and open an incident review.

Do NOT force-push, reset, or overwrite production branches to fix a bad deploy — roll back
the deployed artifact instead.

## 5. What must NOT be done

- Do not publish to production before explicit authorization.
- Do not use GitHub Actions for deployment (per project policy).
- Do not force-push branches or reset production branches.
- Do not delete the Netlify site, change domains, revoke credentials, or disable
  authentication/entitlements.
- Do not modify customer data.
- Do not replace the application with a static landing page or remove functionality.
