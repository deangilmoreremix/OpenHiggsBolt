# Plan the Clerk change

> **Time:** about 15 minutes. **You will finish with:** a reviewed plan for replacing NextAuth with Clerk that keeps every person's credits.

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

## Check yourself

* [ ] I read the plan and it maps Clerk users to user records and credits.
* [ ] It says what happens to existing users (or I have none).
* [ ] The file list is about sign-in and users, not payments or AI calls.

## Common mistakes

* **Approving a plan that touches payment code** without asking why.
* **Skipping the plan** and asking for the change directly.

Next: lesson 8, make the change and add the keys.
