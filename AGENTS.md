# Agent notes

## Feature Registry

When you add or change a user-facing feature, add or update its page in `docs/features/<area>/` (copy `docs/features/_TEMPLATE.md`), then run `node scripts/build-feature-index.mjs`. Each page records what the feature does, where it lives in the app, and its key code paths.

## Testing Signed In on Production — QA Test Accounts

When a check needs a signed-in account (studios behind sign-in such as /studio, paid features, account settings), test on **production** (https://smartvid.app, https://go.smartvid.app), not a local copy, using the QA test accounts. Do not create new accounts, and never use the owner's own account.

The details are in the cloud environment's variables, not in this public repo:

| Variable | What it is |
|---|---|
| `QA_TEST_EMAIL` | The test accounts' email address (the same on both sites) |
| `QA_CLERK_APP_SMARTVID` / `QA_CLERK_USER_SMARTVID` | Clerk app and user for smartvid.app ("Smart Video", production) |
| `QA_CLERK_APP_GO` / `QA_CLERK_USER_GO` | Clerk app and user for go.smartvid.app ("Smart Video GO", production) |

Both users have `legacy_access: true` and `qa_test_account: true` in Clerk public metadata, which gives full access. Neither has a password or saved API keys.

**Signing in.** Both sites sign in with an emailed code. The sign-in form on smartvid.app only offers a password, so use Clerk's browser library:
1. Open the site in Playwright: `https://smartvid.app/sign-in` or `https://go.smartvid.app/academy`.
2. Wait for `window.Clerk.loaded`.
3. Ask Clerk for a code. The address comes from the environment variable and is passed into the page:
   ```js
   // Playwright (Node): `page` is the open page.
   await page.evaluate(async (email) => {
     const si = await window.Clerk.client.signIn.create({ identifier: email });
     const f = si.supportedFirstFactors.find((x) => x.strategy === 'email_code');
     await si.prepareFirstFactor({ strategy: 'email_code', emailAddressId: f.emailAddressId });
   }, process.env.QA_TEST_EMAIL);
   ```
4. Read the code with the Gmail connector:
   - search `to:` followed by the value of `QA_TEST_EMAIL`, plus `newer_than:1h`;
   - the subject is "NNNNNN is your verification code";
   - read only that message.
5. Finish signing in, with the code passed into the page the same way:
   ```js
   await page.evaluate(async (code) => {
     const r = await window.Clerk.client.signIn.attemptFirstFactor({ strategy: 'email_code', code });
     if (r.status === 'complete') await window.Clerk.setActive({ session: r.createdSessionId });
   }, code);
   ```
   If the code is rejected or has expired, ask Clerk for a new one (step 3). Don't retry the same code.
6. Save the session with Playwright's `await context.storageState({ path: 'state.json' })`, and reuse it (`browser.newContext({ storageState: 'state.json' })`) for the rest of the session.

**Things you will meet as a new account:**
- smartvid.app opens "Welcome — set up your API keys": click "Skip for now".
- go.smartvid.app opens "Welcome to SmartVideo GO" because the account has no MuAPI key: close it.
- The Video Outreach welcome steps: fill them with placeholder values (for example `example.com`), then click "Do this later". "Make my video" spends MuAPI credit.

**Rules:**
- Don't generate anything paid, or send email, without the user's OK.
- Remove anything you saved to the account, such as a placeholder key (`DELETE /api/auth/muapi-key`).
- Never print sign-in codes or session cookies.
- If the variables are missing (an environment without them), ask the user. Don't sign in as anyone else.
