# Brief your assistant on the app

> **Time:** about 25 minutes. **You will finish with:** an assistant that has read your app, understands what it already includes, and has agreed to your working rules.

---

## The assistant knows nothing about your app yet

Connected or not, a new chat does not know what your app is, where its code lives, what it already does or what you want. Most failed AI builds fail here: a vague request ("put my app online") produces vague, sometimes destructive, changes. A good briefing takes ten minutes and saves hours.

A good briefing has four parts.

### 1. Where the code is

Your own GitHub repository (the fork from the Reseller Setup Walkthrough). Not the original, and not someone else's.

### 2. What the app already includes

From your app's workshop page (the Overview, Accounts, Database and Environment panels):

* The framework: the reseller apps are Next.js applications.
* The database: PostgreSQL through Prisma, with the address in `DATABASE_URL`.
* Sign-in: Google sign-in through NextAuth.
* Payments: Stripe checkout and a webhook that adds credits.
* AI: calls made with your MuAPI key.

Your workshop page lists the exact variable names for your app. **Names only**, never values.

### 3. What you want changed

For this track: host on Netlify, replace sign-in with Clerk, and keep the Stripe credits flow working in test mode.

### 4. How you want to work

* Small steps.
* Explain before changing.
* Separate branch for risky changes.
* Never ask for secret keys; say which dashboard setting to use.

## The briefing

Copy this, fill in the three placeholders, and paste it into a new chat in the assistant you chose:

> I am building my own copy of a reseller app called <APP NAME>. My code is in my GitHub repo <YOUR REPO ADDRESS>. It already uses Next.js, Prisma with PostgreSQL, Stripe payments and Google sign-in through NextAuth. My goal: host it on Netlify, replace sign-in with Clerk, and keep the existing Stripe credits flow working in test mode. Work in small steps. Before each change, tell me what you will change and why, and wait for my approval. Make risky changes on a new branch. Never ask me to paste secret keys into this chat; tell me which dashboard setting to use instead. Start by reading the repo and summarising: how sign-in works, how payments and credits work, the build command, and every environment variable the code reads (names only).

## Check the summary against the workshop page

The assistant's summary is your first test. Compare it with your workshop panels:

* Does it name the same sign-in system (NextAuth with Google)?
* Does it find the Stripe webhook route and say what it does?
* Does it list the same environment variable names?
* Does it find where users and credits are stored?

If it gets something wrong, correct it now ("the webhook path is actually..."), because every later step builds on this understanding. If it cannot see your repo, use its GitHub connector or paste only the specific files it asks for, never anything containing a secret.

## Setting expectations with the assistant

After the summary, send:

> Good. For the rest of this project: always show me a plan first, change one thing at a time, tell me how to test each change, and tell me exactly which dashboard I must visit for anything involving a key or a setting.

This one message shapes the whole build.

## Reading changes without being a developer

You will be asked to approve code changes. You do not need to understand every line. You do need to check three things:

1. **Does the explanation match what I asked for?** If you asked for Clerk sign-in and it is also rewriting payment code, stop and ask why.
2. **Is it on a branch?** Risky work belongs on a branch, so the working app is untouched until you merge.
3. **Is there a test I can run?** Every change should come with "open this page, you should see this".

If anything looks off, say so: "Explain that change in plain language and tell me what could go wrong."

## Check yourself

* [ ] The assistant correctly summarised my app.
* [ ] It agreed to explain before changing and not to ask for secrets.
* [ ] I corrected anything it got wrong.

## Common mistakes

* **Pasting secrets "to help".** Never. The assistant does not need them to plan or to write code.
* **Letting it make many changes at once.** One change, one test.
* **Skipping the summary check.** A wrong assumption now becomes a broken build later.

Next: lesson 5, hosting on Netlify.
