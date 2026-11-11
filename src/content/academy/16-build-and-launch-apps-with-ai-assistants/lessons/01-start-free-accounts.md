# Start your free accounts: Netlify, Clerk and Stripe

> **Time:** about 20 minutes. **You will finish with:** GitHub, Netlify, Clerk and Stripe accounts, all protected, with Stripe in test mode.

---

## Why four accounts

A live app is several services working together. Each account has one job, and knowing the job makes every later step make sense.

| Account | Its one job | What you will put in it |
| --- | --- | --- |
| **GitHub** | Stores your own copy of the app's code | The repository for your chosen app |
| **Netlify** | Builds the code and serves it on the internet | Your site and its environment variables |
| **Clerk** | Handles sign-up, sign-in and user accounts | Your application and its keys |
| **Stripe** | Takes payments and reports them | Test keys, a webhook, test payments |

The AI part (MuAPI) and the database (Supabase or Neon) you already set up in Modules 4 and 5 of the Reseller Setup Walkthrough. If you have not done those, finish them first; lesson 5 needs the database address.

## What "free" means here

All three services offer a free plan at the time of writing. That does not mean free forever at any size. Free plans have limits (for example on build minutes, bandwidth or monthly active users), and the numbers change. Before you rely on any of them:

1. Open each pricing page.
2. Find the current free plan.
3. Write the main limits in your own notes, with today's date.

A free plan is more than enough to build and test, and often to take your first customers. You decide later whether to upgrade; nothing in this track asks you to pay.

## Step by step

### 1. GitHub

Sign in to the account you used in the Reseller Setup Walkthrough. Your app should already be forked into your own account. If not, do that first, because Netlify deploys from **your** copy.

### 2. Netlify

1. Open Netlify's sign-up page.
2. Choose **Sign up with GitHub**. This lets Netlify read the repositories you choose, which makes lesson 5 easier.
3. When asked, accept the free plan and give your team a name matching your business.
4. You should land on your team dashboard (a list of projects, empty for now).

### 3. Clerk

1. Open Clerk's sign-up page and create an account.
2. Create an **application**. Name it after your business. This is the name people see on sign-up screens.
3. Choose the sign-in options: keep **Email** and **Google**. Add others later if you want.
4. Clerk creates a **development instance** for you. This is the practice version: it works on netlify.app and preview addresses, and it is where you stay until you have your own domain.
5. Find the **API keys** page. You will see a **publishable key** and a **secret key**. Do not copy them anywhere yet; just know where they are.

### 4. Stripe

1. Create or sign in to your Stripe account.
2. Make sure you are in **test mode** (Stripe shows a Test mode or Sandbox indicator in the dashboard). Everything in this track uses test mode.
3. You do not need to activate your account for real payments yet. That is lesson 8 and Module 9.

### 5. Protect every account

For each of the four accounts:

* Turn on two-step sign-in.
* Use a strong, unique password in a password manager.
* Use your business email, so the accounts do not depend on a personal address.

These accounts control your app, your customers' sign-ups and your payments. Treat them like the keys to a shop.

## Check yourself

* [ ] I can open GitHub, Netlify, Clerk and Stripe dashboards.
* [ ] Stripe shows test mode.
* [ ] Clerk shows a development instance.
* [ ] Two-step sign-in is on for all four.
* [ ] I wrote down each free plan's limits and the date.

## Common mistakes

* **Skipping the pricing pages**, then discovering a limit mid-launch.
* **Using a personal email**, which makes handing the business over harder later.
* **Switching Stripe to live too early.** There is nothing to gain before the test purchase works.
* **Connecting a client's account to practise.** Use your own.

## If something is off

* *Clerk asks me to choose a plan.* Choose the free plan if the current pricing page offers one. If not, re-check the page before paying for anything.
* *Netlify cannot see my repo.* You can change which repositories Netlify may read in your GitHub settings under installed applications.

Next: lesson 2, connecting Claude.
