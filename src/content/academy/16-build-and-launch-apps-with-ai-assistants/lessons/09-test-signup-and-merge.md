# Test sign-up and merge

> **Time:** about 15 minutes. **You will finish with:** Clerk handling sign-up and sign-in, tested with a fresh account, with each person's credits correct, and the branch merged.

---

Test on the preview deploy from lesson 8. Only merge when every check passes.

## Step by step

### 4. Test with a fresh account

1. Open the preview address in a private window.
2. Use sign-up with a **new** test email address (an alias you control is fine).
3. Complete any email verification Clerk asks for.
4. You should land in the app, signed in.
5. In Clerk's dashboard, open Users. Your test user should be listed.
6. In the app, check credits. A new user should have exactly what a new user should have.
7. Sign out and sign back in. You should return to the same account and the same credits.

### 5. Also test the edge cases

* Sign in with Google if you enabled it.
* Visit a page that needs sign-in while signed out. You should be sent to sign-in, not shown an error.
* Visit the sign-in page while signed in. You should be sent on into the app.

### 6. Merge when it works

Only merge the branch once every test above passes. If something fails, describe exactly what you saw to the assistant ("I signed up, landed on the dashboard, but credits show zero") and fix one thing at a time.

## Check yourself

* [ ] A fresh test sign-up works, appears in Clerk and has correct credits.
* [ ] I only merged after every test passed.

## Common mistakes

* **Merging before testing a fresh sign-up.** Existing sessions hide problems.
* **Putting the Clerk secret key in code or chat.**
* **Forgetting to redeploy** after adding the keys.
* **Using the production instance too early.**
* **Letting the assistant change payment code** as part of this step.

## If something is off

* *Sign-up works but credits are missing.* The new Clerk user is not linked to a user record. Ask the assistant to create or look up the record the first time a user is seen, and to show you where.
* *Sign-in fails on the preview address.* Check that you are using the development instance keys and that the allowed addresses in Clerk include your preview address. Ask the assistant to check the current Clerk docs.
* *Redirect loop.* Often a middleware setting. Ask the assistant to read the middleware and explain which routes are public.

Next: lesson 10, Stripe keys and the webhook.
