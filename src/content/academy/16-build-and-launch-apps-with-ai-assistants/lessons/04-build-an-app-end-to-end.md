# Build an app end to end with your assistant

This is the whole path, in the order you do it. Each step has a full follow-along lesson in the Reseller Setup Walkthrough, Module 13.

## 1. Brief the assistant (13.4)

Tell it where your code is, what the app already includes (Stripe, Prisma/PostgreSQL, Google sign-in through NextAuth) and what you want changed. Ask it to explain every change before making it and never to ask you for secrets.

## 2. Host on Netlify (13.5)

The assistant checks the build command and the environment variables the code reads. You add the values in Netlify's dashboard, then deploy. After changing a variable, redeploy.

## 3. Add Clerk sign-up (13.6)

The assistant plans how to replace NextAuth with Clerk using the current Clerk docs, shows you where users and credits are stored, and makes the change on a new branch. You add the Clerk keys in Netlify yourself, test a fresh sign-up on a preview deploy, and merge only when credits still work.

## 4. Connect Stripe test payments (13.7)

Stripe is already built in. You add your own test keys and webhook secret in Netlify, buy a credit pack with a test card, and ask the assistant to confirm the payment and the webhook delivery from Stripe.

## 5. Repeat for any app (13.8)

Only the facts change from app to app (name, database, variable names). Save your prompts and reuse them. Finish with branding, your own domain and a full customer test, then go live deliberately with a live Stripe key.

## Reusable prompt: plan before changing

> Plan how to replace NextAuth with Clerk in this app using the current Clerk docs for Next.js. Show me where users and credits are stored, how each Clerk user will map to a user record, and the files you will change. Do not change anything yet.

## Check yourself

You could build a second app using only your saved prompts and its workshop page.
