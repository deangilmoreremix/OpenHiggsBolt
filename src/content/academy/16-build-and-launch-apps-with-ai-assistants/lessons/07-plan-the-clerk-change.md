# Plan the Clerk change

> **Time:** about 15 minutes. **You will finish with:** a reviewed plan for replacing NextAuth with Clerk that keeps every person's credits.

---

## Before you start

Your app ships with Google sign-in through NextAuth. Clerk replaces it with ready-made sign-up and sign-in screens, email and Google options, and a dashboard where you can see your users. This is a real change to your copy of the code, so we do it carefully, and the plan comes before the code.

**What must not break:** the link between a person and their **credits**. Your app stores users and credits in its own database. If Clerk creates a new user identity and the app does not connect it to a user record, every new sign-up will have no credits (or worse, someone sees another person's).

How Clerk works, in plain terms:

* Clerk keeps the account (email, password or Google, sessions).
* Your app asks Clerk, on every request, "who is signed in?" and gets a user ID.
* Your app uses that ID to find, or create, its own user record and its credits.

Clerk gives you two keys:

* A **publishable key**: safe to be visible in the browser.
* A **secret key**: private; it goes only in Netlify's environment variables, never in the chat.

Clerk's official docs describe adding it to Next.js and also describe tools for working with AI assistants. Always ask your assistant to follow the **current** Clerk docs rather than work from memory, because the exact setup changes between versions.

You will need:

* The chat from lessons 4 to 6, where the assistant knows your app.
* About 15 minutes. You will not change any code in this lesson.

## Step by step

### 1. Ask for a plan, not a change

Send this:

```text
Plan how to replace NextAuth with Clerk in this app using the current Clerk docs for Next.js. Show me where users and credits are stored, how each Clerk user will map to a user record in our database, what happens to people who already signed in with Google, and the exact files you will change. Do not change anything yet.
```

**You should see:** a written plan and no code changes.

**If not:** if it starts editing files, tell it to stop and undo, then send the prompt again.

### 2. Check the mapping

Look for how a Clerk user ID is stored against a user record, and how a new user gets starting credits (if the app gives any).

**You should see:** a clear statement of where the Clerk user ID is stored and how credits are attached to it.

**If not:** ask, "Where exactly will the Clerk user ID be stored, and how does a new user get their credits?"

### 3. Check what happens to existing users

If you already have customers, ask how they keep their credits. A new app with no customers can ignore this.

**You should see:** a plan that keeps existing people's credits, or you confirming you have no customers yet.

**If not:** ask, "How will someone who signed in with Google before keep their credits after the change?"

### 4. Check the file list

Read the list of files it will change.

**You should see:** files about sign-in, middleware and the user lookup, not payments or AI calls.

**If not:** if the plan touches payment code, ask why before going any further.

### 5. Confirm it follows the current Clerk docs

Ask the assistant to confirm which Clerk documentation it used and to note anything that depends on a version.

**You should see:** a reference to the current Clerk docs for Next.js.

**If not:** ask it to check the current Clerk docs again instead of working from memory.

### 6. Approve the plan in words

When you are satisfied, reply that you approve the plan and that the next step is to make the change on a new branch. Do not ask for the keys in the chat; you add them in Netlify in lesson 8.

**You should see:** the assistant agrees to wait for lesson 8's change, on a branch.

**If not:** if you are unsure about any point, do not approve yet. Ask for it to be explained in plain language.

## Check yourself

* [ ] I read the plan and it maps Clerk users to user records and credits.
* [ ] It says what happens to existing users (or I have none).
* [ ] The file list is about sign-in and users, not payments or AI calls.
* [ ] No code has been changed yet.

## Common mistakes

* **Approving a plan that touches payment code** without asking why.
* **Skipping the plan** and asking for the change directly.

Next: lesson 8, make the change and add the keys.
