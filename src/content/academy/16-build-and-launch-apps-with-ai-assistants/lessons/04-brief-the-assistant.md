# Brief your assistant on the app

> **Time:** about 18 minutes. **You will finish with:** an assistant that has read your app, understands what it already includes, and has agreed to your working rules.

---

## Before you start

A new chat knows nothing about your app, even when connectors are working. It does not know what the app is, where its code lives, what it already does or what you want. Most failed AI builds fail here: a vague request ("put my app online") produces vague, sometimes destructive, changes. A good briefing takes about ten minutes and saves hours.

A good briefing has four parts:

1. **Where the code is.** Your own GitHub repository (the fork from the Reseller Setup Walkthrough), not the original and not someone else's.
2. **What the app already includes.** Taken from your app's workshop page (the Overview, Accounts, Database and Environment panels, though panel names may differ slightly on your screen):
   * Framework: the reseller apps are Next.js applications.
   * Database: PostgreSQL through Prisma, with the address in `DATABASE_URL`.
   * Sign-in: Google sign-in through NextAuth.
   * Payments: Stripe checkout and a webhook that adds credits.
   * AI: calls made with your MuAPI key.
3. **What you want changed.** For this track: host on Netlify, replace sign-in with Clerk, and keep the Stripe credits flow working in test mode.
4. **How you want to work.** Small steps, explain before changing, a separate branch for risky changes, and never ask for secret keys (the assistant says which dashboard setting to use instead).

Your workshop page lists the exact variable names for your app. **Names only**, never values.

You will need:

* The assistant you chose in lessons 2 or 3, open in a new chat.
* Your fork's GitHub address and your app's workshop page.
* About 18 minutes.

## Step by step

### 1. Find your repository address

Open your own fork on GitHub and copy its address from the browser bar.

**You should see:** an address with your own GitHub username in it.

**If not:** if the username is not yours, you are on the original repository. Go back to the Reseller Setup Walkthrough and open your fork.

### 2. Note what your app includes

Open your app's workshop page and look at the panels listed above. Write down the app name and the environment variable **names** (not values).

**You should see:** Next.js, PostgreSQL with Prisma, NextAuth with Google, Stripe and MuAPI, plus a list of variable names.

**If not:** if a panel is missing or named differently, look for the same information elsewhere on the page. Do not guess.

### 3. Send the briefing

Copy this, fill in the two placeholders (`<APP NAME>` and `<YOUR REPO ADDRESS>`), and paste it into a new chat:

```text
I am building my own copy of a reseller app called <APP NAME>. My code is in my GitHub repo <YOUR REPO ADDRESS>. It already uses Next.js, Prisma with PostgreSQL, Stripe payments and Google sign-in through NextAuth. My goal: host it on Netlify, replace sign-in with Clerk, and keep the existing Stripe credits flow working in test mode. Work in small steps. Before each change, tell me what you will change and why, and wait for my approval. Make risky changes on a new branch. Never ask me to paste secret keys into this chat; tell me which dashboard setting to use instead. Start by reading the repo and summarising: how sign-in works, how payments and credits work, the build command, and every environment variable the code reads (names only).
```

**You should see:** the assistant reads the repository and replies with a summary.

**If not:** if it says it cannot see your repo, use its GitHub connector. Otherwise paste only the specific files it asks for, never anything containing a secret.

### 4. Check the summary against the workshop page

The summary is your first test. Compare it with your panels:

* Does it name the same sign-in system (NextAuth with Google)?
* Does it find the Stripe webhook route and say what it does?
* Does it list the same environment variable names?
* Does it find where users and credits are stored?

**You should see:** matching answers to all four questions.

**If not:** go to step 5.

### 5. Correct anything it got wrong

Tell it plainly, for example: "the webhook path is actually..." and ask it to summarise again.

**You should see:** a corrected summary that matches your workshop page.

**If not:** if it keeps getting something wrong, ask it to show you the file where it found that information. Every later step builds on this understanding, so do not move on with a wrong assumption.

### 6. Send the working rules

Send this:

```text
Good. For the rest of this project: always show me a plan first, change one thing at a time, tell me how to test each change, and tell me exactly which dashboard I must visit for anything involving a key or a setting.
```

**You should see:** the assistant agrees to those rules.

**If not:** if it starts changing things without a plan, stop it and send the message again. This one message shapes the whole build.

### 7. Learn to read a change without being a developer

You will be asked to approve code changes. You do not need to understand every line, but check three things each time:

1. **Does the explanation match what I asked for?** If you asked for Clerk sign-in and it is also rewriting payment code, stop and ask why.
2. **Is it on a branch?** Risky work belongs on a branch, so the working app is untouched until you merge.
3. **Is there a test I can run?** Every change should come with "open this page, you should see this".

**You should see:** you can answer all three questions for any proposed change.

**If not:** say, "Explain that change in plain language and tell me what could go wrong."

## Check yourself

* [ ] The assistant correctly summarised my app.
* [ ] It agreed to explain before changing and not to ask for secrets.
* [ ] I corrected anything it got wrong.
* [ ] I know the three checks for approving a change.

## Common mistakes

* **Pasting secrets "to help".** Never. The assistant does not need them to plan or to write code.
* **Letting it make many changes at once.** One change, one test.
* **Skipping the summary check.** A wrong assumption now becomes a broken build later.

Next: lesson 5, hosting on Netlify.
