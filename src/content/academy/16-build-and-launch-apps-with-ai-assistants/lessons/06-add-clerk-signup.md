# Let people sign up with Clerk

> **Time:** about 45 minutes. **You will finish with:** Clerk handling sign-up and sign-in in your app, tested with a fresh account, with each person's credits still correct.

---

## What changes and what must not

Your app ships with Google sign-in through NextAuth. Clerk replaces it with ready-made sign-up and sign-in screens, email and Google options, and a dashboard where you can see your users. This is a real change to your copy of the code, so we do it carefully.

**What must not break:** the link between a person and their **credits**. Your app stores users and credits in its own database. If Clerk creates a new user identity and the app does not connect it to a user record, every new sign-up will have no credits (or worse, someone sees another person's). So the plan comes before the code.

## How Clerk works, in plain terms

* Clerk keeps the account (email, password or Google, sessions).
* Your app asks Clerk, on every request, "who is signed in?" and gets a user ID.
* Your app uses that ID to find, or create, its own user record and its credits.

Clerk gives you two keys:

* A **publishable key**: safe to be visible in the browser.
* A **secret key**: private; it goes only in Netlify's environment variables.

Clerk's official docs describe adding it to Next.js and also describe tools for working with AI assistants. Always ask your assistant to follow the **current** Clerk docs rather than from memory, because the exact setup changes between versions.

## Step by step

### 1. Plan before any change

> Plan how to replace NextAuth with Clerk in this app using the current Clerk docs for Next.js. Show me where users and credits are stored, how each Clerk user will map to a user record in our database, what happens to people who already signed in with Google, and the exact files you will change. Do not change anything yet.

Read the plan for these points:

* **A mapping.** It should say how a Clerk user ID is stored against a user record, and how a new user gets starting credits (if the app gives any).
* **Existing users.** If you already have customers, ask how they keep their credits. A new app with no customers can ignore this.
* **Files.** The list should be about sign-in, middleware and the user lookup, not payments or AI calls.

If the plan touches payment code, ask why.

### 2. Make the change on a branch

> Create a branch called clerk-signup and make the change you described. Explain each file you change. Tell me the exact environment variable names I need to add in Netlify. Do not ask me for secret keys.

### 3. Add the Clerk keys in Netlify

1. In Clerk, open the API keys page for your development instance.
2. In Netlify, open your site's environment variable settings.
3. Add the variable names the assistant gave you, pasting the publishable and secret keys yourself.
4. Redeploy the **branch** as a deploy preview (Netlify can build a preview for a branch).

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

## Development instance vs production

Clerk's development instance is for building and testing. It works on netlify.app and preview addresses. A **production instance** requires your own domain and its own keys, and it is a separate set of users. You will set that up when you go live in lesson 8; do not use it earlier.

## Check yourself

* [ ] I read the plan and it mapped Clerk users to user records and credits.
* [ ] The change was on a branch.
* [ ] Clerk keys are in Netlify only.
* [ ] A fresh test sign-up works, appears in Clerk and has correct credits.
* [ ] I only merged after testing.

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

Next: lesson 7, Stripe test payments.
