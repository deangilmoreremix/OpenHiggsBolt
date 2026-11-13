# Start your free accounts: Netlify, Clerk and Stripe

> **Time:** about 18 minutes. **You will finish with:** GitHub, Netlify, Clerk and Stripe accounts, all protected, with Stripe in test mode.

---

## Before you start

A live app is several services working together. You will open or check four accounts, each with one job, and knowing the job makes every later step make sense.

| Account | Its one job | What you will put in it |
| --- | --- | --- |
| **GitHub** | Stores your own copy of the app's code | The repository for your chosen app |
| **Netlify** | Builds the code and serves it on the internet | Your site and its environment variables |
| **Clerk** | Handles sign-up, sign-in and user accounts | Your application and its keys |
| **Stripe** | Takes payments and reports them | Test keys, a webhook, test payments |

The AI part (MuAPI) and the database (Supabase or Neon) you already set up in Modules 4 and 5 of the Reseller Setup Walkthrough. If you have not done those, finish them first; lesson 6 needs the database address.

All three new services offer a free plan at the time of writing. That does not mean free forever at any size. Free plans have limits (for example on build minutes, bandwidth or monthly active users), and the numbers change. A free plan is more than enough to build and test, and often to take your first customers. Nothing in this track asks you to pay.

You will need:

* Your GitHub account from the Reseller Setup Walkthrough, with your app already forked.
* A business email address and a password manager.
* About 18 minutes. This is a full lesson with four sign-ups, so go at a calm pace and stop at any step.

## Step by step

### 1. Check your GitHub copy

1. Sign in to the GitHub account you used in the Reseller Setup Walkthrough.
2. Open your own copy (fork) of the app.

**You should see:** the app's repository under **your** account name.

**If not:** fork the app into your account first, because Netlify deploys from **your** copy.

### 2. Note each free plan's limits

1. Open the pricing page of Netlify, Clerk and Stripe (menus and prices move; use each service's current page).
2. Find the current free plan and write its main limits in your own notes, with today's date.

**You should see:** a dated note with limits such as build minutes, bandwidth or monthly active users.

**If not:** if a service has no free plan today, re-check the page before paying for anything.

### 3. Sign up to Netlify

1. Open Netlify's sign-up page and choose **Sign up with GitHub**. This lets Netlify read the repositories you choose, which makes lesson 5 easier.
2. When asked, accept the free plan and give your team a name matching your business.

**You should see:** your team dashboard, a list of projects that is empty for now.

**If not:** if Netlify cannot see your repo, change which repositories it may read in your GitHub settings under installed applications.

### 4. Create your Clerk application

1. Open Clerk's sign-up page and create an account.
2. Create an **application** named after your business. This is the name people see on sign-up screens.
3. Keep the sign-in options **Email** and **Google**. Add others later if you want.

**You should see:** a Clerk **development instance**, the practice version. It works on netlify.app and preview addresses, and it is where you stay until you have your own domain.

**If not:** if Clerk asks you to choose a plan, choose the free plan if the current pricing page offers one.

### 5. Find your Clerk API keys

1. In Clerk, open the **API keys** page.
2. Look at the **publishable key** and the **secret key**, but do not copy them anywhere yet.

**You should see:** both keys listed. Just know where they are; later lessons tell you where each one goes.

**If not:** menus move, so look for a page named API keys or developers in the dashboard's current layout.

### 6. Put Stripe in test mode

1. Create or sign in to your Stripe account.
2. Check that the dashboard shows a **Test mode** or **Sandbox** indicator.

**You should see:** test mode on. Everything in this track uses test mode. You do not need to activate your account for real payments yet; that is lesson 13 and Module 9.

**If not:** switch to test mode before doing anything else. There is nothing to gain from live mode before the test purchase works.

### 7. Protect every account

1. For each of the four accounts, turn on two-step sign-in.
2. Save a strong, unique password in your password manager, and make sure each account uses your business email.

**You should see:** two-step sign-in listed as on in each account's security settings.

**If not:** if you used a personal email, change it now; it makes handing the business over harder later. These accounts control your app, your customers' sign-ups and your payments, so treat them like the keys to a shop.

## Check yourself

* [ ] I can open GitHub, Netlify, Clerk and Stripe dashboards.
* [ ] Stripe shows test mode and Clerk shows a development instance.
* [ ] Two-step sign-in is on for all four.
* [ ] I wrote down each free plan's limits and the date.

## Common mistakes

* **Skipping the pricing pages**, then discovering a limit mid-launch.
* **Using a personal email**, which makes handing the business over harder later.
* **Switching Stripe to live too early.** Stay in test mode until lesson 13.
* **Connecting a client's account to practise.** Use your own.

Next: lesson 2, connecting Claude.
