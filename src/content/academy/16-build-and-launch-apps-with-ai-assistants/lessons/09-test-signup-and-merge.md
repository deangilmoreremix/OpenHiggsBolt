# Test sign-up and merge

> **Time:** about 15 minutes. **You will finish with:** Clerk handling sign-up and sign-in, tested with a fresh account, with each person's credits correct, and the branch merged.

---

## Before you start

You will test on the preview deploy from lesson 8 and merge the branch only when every check passes. A fresh account matters because your existing sessions can hide problems: an old login may work while a brand-new visitor is stuck.

You will need:

* The preview address of the `clerk-signup` branch from lesson 8.
* A new test email address (an alias you control is fine).
* Your Clerk dashboard open in another tab.
* About 15 minutes. Menu names in Clerk, Netlify and your code host change from time to time, so look for the closest match.

## Step by step

### 1. Sign up with a fresh account

1. Open the preview address in a private window.
2. Use sign-up with a **new** test email address and complete any email verification Clerk asks for.

**You should see:** you land in the app, signed in.

**If not:** if sign-in fails on the preview address, check that you are using the development instance keys and that the allowed addresses in Clerk include your preview address. Ask the assistant to check the current Clerk docs.

### 2. Check the user in Clerk

In Clerk's dashboard, open Users.

**You should see:** your test user listed.

**If not:** you may be looking at the wrong Clerk instance. Make sure it is the development instance whose keys you added.

### 3. Check the credits

In the app, check credits.

**You should see:** a new user has exactly what a new user should have.

**If not:** if sign-up works but credits are missing, the new Clerk user is not linked to a user record. Ask the assistant to create or look up the record the first time a user is seen, and to show you where.

### 4. Sign out and back in

Sign out, then sign back in with the same test account.

**You should see:** the same account and the same credits.

**If not:** if you get a redirect loop, it is often a middleware setting. Ask the assistant to read the middleware and explain which routes are public.

### 5. Test the edge cases

1. Sign in with Google, if you enabled it.
2. While signed out, visit a page that needs sign-in.
3. While signed in, visit the sign-in page.

**You should see:** the Google sign-in works; the protected page sends you to sign-in, not an error; the sign-in page sends you on into the app.

**If not:** describe exactly what you saw to the assistant, for example "I signed up, landed on the dashboard, but credits show zero", and fix one thing at a time. Do not let it change payment code as part of this step.

### 6. Merge when every test passes

Merge the `clerk-signup` branch only once every test above has passed. Use your code host's merge button for the branch, or ask the assistant to explain where it is.

**You should see:** the branch merged, and Netlify building your main site with Clerk in it.

**If not:** if anything failed above, do not merge. Go back to the failing step and fix it first.

## Check yourself

* [ ] A fresh test sign-up works, appears in Clerk and has correct credits.
* [ ] Sign-out and sign-in returns me to the same account and credits.
* [ ] The edge cases behave as described.
* [ ] I only merged after every test passed.

## Common mistakes

* **Merging before testing a fresh sign-up.** Existing sessions hide problems.
* **Putting the Clerk secret key in code or chat.**
* **Forgetting to redeploy** after adding the keys.
* **Using the production instance too early.**
* **Letting the assistant change payment code** as part of this step.

Next: lesson 10, Stripe keys and the webhook.
