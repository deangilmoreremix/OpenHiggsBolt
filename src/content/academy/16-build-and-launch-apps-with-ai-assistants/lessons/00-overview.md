# Track 16: Build and Launch Apps with Claude or ChatGPT, Netlify, Clerk and Stripe

> **SmartVideo GO AI Academy** — Take one of the ready-made reseller apps from your own GitHub copy to a live, hosted business, with an AI chat doing the technical work for you through connectors.

---

## Who this track is for

You own (or are about to own) one of the 38 reseller apps and you are not a developer. You do not want to learn a framework. You want to be able to say "host this", "add sign-up", "check the payment went through" to a chat and have it done, while you stay in control of what changes and what it costs.

If you can create accounts, copy and paste, and read a screen carefully, you can do this track. Every step tells you what you should see when it worked.

## What you will build

By the end you will have, for one app of your choice:

1. **Free accounts** on Netlify, Clerk and Stripe (Stripe in test mode), alongside GitHub.
2. **Connectors** that let Claude and/or ChatGPT see and use those services with your approval.
3. Your app **built and hosted on Netlify** from your own GitHub copy, at a netlify.app address.
4. **Clerk sign-up and sign-in** so real people can create accounts.
5. **Stripe test payments** that add credits, which you can check by asking the chat.
6. A **reusable set of prompts** so the next app takes a fraction of the time.

## The lessons

Every lesson takes **under 20 minutes**, so you can finish one in a sitting and stop at a safe point.

| # | Lesson | Time | What you finish with |
| --- | --- | --- | --- |
| 1 | Start your free accounts | 18 min | Netlify, Clerk, Stripe (test), GitHub |
| 2 | Connect Claude with connectors | 18 min | Claude can read your three services |
| 3 | Connect ChatGPT the same way | 15 min | ChatGPT can, or you know it cannot on your plan |
| 4 | Brief your assistant on the app | 18 min | An assistant that understands your app |
| 5 | Check readiness and create the Netlify site | 18 min | A Netlify site connected to your repo |
| 6 | Add variables, deploy and fix failures | 18 min | A live netlify.app address |
| 7 | Plan the Clerk change | 15 min | A reviewed plan that protects credits |
| 8 | Make the Clerk change and add the keys | 15 min | Clerk on a preview deploy |
| 9 | Test sign-up and merge | 15 min | Real sign-up and sign-in, merged |
| 10 | Stripe keys and the webhook | 18 min | Test keys and a webhook endpoint |
| 11 | Test purchase and check it from the chat | 15 min | A test purchase that adds credits |
| 12 | Save your prompts and run the customer test | 15 min | A repeatable checklist |
| 13 | Go live: domain, Clerk production, Stripe live | 18 min | A live business |

Plan on a weekend for your first app, taking breaks between lessons. The second app will take an afternoon.

## What the apps already include (and what they do not)

Be clear about this before you start, because it decides what your assistant has to change.

* **Already in the apps:** Stripe payments and credit packs, a PostgreSQL database accessed through Prisma, Google sign-in through NextAuth, and the AI calls through your own MuAPI key. Each app's workshop page lists its exact variable names.
* **Not in the apps:** Netlify hosting settings and Clerk sign-in. Your assistant adds those to **your own copy** of the code, on a separate branch, and you approve every step.

This is why the track is a build and not a button: you are making two real changes to a real application, safely.

## How this track fits with the Reseller Setup Walkthrough

The Reseller Setup Walkthrough (`/academy/reseller/launch`) takes you through Vercel-based deployment, the database, Google sign-in, Stripe and launch for the app you select. **Module 13** of that course is the interactive version of this track: Learn, Follow along, Complete and Verify for each lesson, with your selected app's facts shown beside the steps. Use this track to understand the whole picture; use Module 13 to do the work.

## The rules that keep you safe

* **Sign in to your own accounts only.** Never connect a client's or an employer's account to practise.
* **Read-only first.** Before a chat is allowed to change anything, test it with a question that only reads.
* **Never paste a secret key into a chat.** Not Stripe keys, not the Clerk secret key, not database addresses, not the MuAPI key. Secrets go into the dashboard settings of Netlify, Clerk and Stripe. The assistant's job is to tell you which variable name to fill in; your job is to paste the value into the dashboard yourself.
* **Test mode until you decide otherwise.** Stripe stays in test mode, and Clerk stays on its development instance, until lesson 8.
* **Small steps, explained first.** Ask the assistant to say what it will change and why before it changes it. You can undo anything in GitHub.
* **Menus change.** Claude, ChatGPT, Netlify, Clerk and Stripe all rename and move things. This track teaches the flow and tells you what the result should look like; when a label differs, follow the service's official page.

## How to use an assistant well (the habits that matter)

1. **Give context once, clearly** (lesson 4), then refer back to it.
2. **Ask for a plan before a change.** "Plan how to... Do not change anything yet."
3. **One change at a time.** After each, test it before the next.
4. **Make it show evidence.** "Show me the file you changed." "Read the deploy log and tell me the first error."
5. **Keep a note of what worked**, because the prompts become your template for every later app.

## Words you will meet

* **Repository (repo):** your app's folder of code on GitHub.
* **Branch:** a separate line of changes you can test without touching the working app.
* **Deploy:** building the app and putting it online.
* **Environment variable:** a named setting (like a key) kept in the hosting dashboard, not in the code.
* **Webhook:** a message Stripe sends your app to say a payment happened.
* **Connector (plugin):** a switch that lets Claude or ChatGPT use another service for you.
* **Test mode:** Stripe's practice mode: fake cards, no real money.

When you are ready, start with lesson 1. Each lesson ends at a safe stopping point.
