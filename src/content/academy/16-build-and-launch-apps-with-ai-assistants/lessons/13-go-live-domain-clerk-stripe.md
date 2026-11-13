# Go live: domain, Clerk production and Stripe live

> **Time:** about 18 minutes. **You will finish with:** your app live on your own domain with Clerk production and Stripe live mode, tested with a real payment you refunded.

---

## Before you start

> **Warning: this is the only lesson that uses live mode.** Live mode means real cards and real money. Everything before this lesson was test. Do this lesson once, slowly, and only when lessons 11 and 12 passed.

Going live changes three things at once, and each has a separate "live" version that does **not** carry over from test:

1. **Your domain.** Add it in Netlify and follow its DNS instructions. Netlify serves the site on the new address once DNS settles.
2. **Clerk production instance.** Clerk's production instance needs your own domain and has its own keys and its own (empty) user list.
3. **Stripe live mode.** Activate your account (Module 7 of the walkthrough), create live keys, create a **live** webhook for your real address, and put the live signing secret in Netlify.

The safety rule does not change: **never paste a key or signing secret into the chat.** Put keys only into Netlify's environment variables. Your assistant can tell you where each one goes.

You will need:

* Lessons 11 and 12 passed in test mode.
* Your own domain name, and access to where its DNS is managed.
* Your Netlify, Clerk and Stripe dashboards open in separate tabs.
* A real card of your own, and a few minutes for a small real payment you will refund.
* About 18 minutes. DNS can take longer to settle; that wait is normal.

## Step by step

### 1. Ask the assistant for your go-live checklist

Paste this into your assistant and send it:

```text
Give me a go-live checklist for this app on Netlify with Clerk and Stripe: custom domain, Clerk production instance, live Stripe keys, live webhook, environment variables per environment, and a final test. Mark each item as either "I do this in a dashboard" or "you change this in the code". Do not change anything.
```

**You should see:** a checklist for your app with each item marked as a dashboard step or a code change.

**If not:** if it is vague, ask it to name your app's actual variables from the briefing. Save this prompt in your lesson 12 note.

### 2. Add your domain in Netlify

1. In Netlify, open your site and look for a domain settings area (the label may differ).
2. Choose to add your own domain and enter it.

**You should see:** your domain listed, with DNS instructions from Netlify.

**If not:** if Netlify says the domain is taken or cannot be verified, check you spelled it right and that you own it.

### 3. Follow Netlify's DNS instructions

1. Where your domain is managed, add the DNS records Netlify shows you, exactly as given.

**You should see:** Netlify marks the domain as working or secured once DNS settles, which can take from a few minutes to many hours.

**If not:** wait, then check the records for typos. Keep going with steps 4 to 7 while you wait.

### 4. Create the Clerk production instance

1. In the Clerk dashboard, find the option to create or switch to a production instance (the label may differ).
2. Enter your own domain when asked and follow Clerk's DNS instructions.

**You should see:** a production instance with its own keys and an empty user list.

**If not:** if Clerk says your domain is not verified yet, finish step 3 first. Sign-in that fails only on your domain usually means the production instance does not list the domain yet.

### 5. Put the Clerk production keys in Netlify

1. In Netlify, open the environment variables for your site.
2. Add the Clerk production keys as **production** values only, using the same variable names as before.
3. Redeploy the site.

**You should see:** the variable names present for production, and a successful new deploy.

**If not:** if the deploy fails, ask the assistant to read the deploy log and explain the first error. Do not paste the key values into the chat.

### 6. Activate Stripe and create live keys

1. Complete Stripe's account activation (Module 7 of the walkthrough).
2. In the Stripe dashboard, switch to live mode (look for a test or live toggle) and create your live keys.

**You should see:** Stripe showing live mode, with live keys available.

**If not:** if activation is still pending, wait for Stripe to approve it. Do not continue until live mode is available.

### 7. Create the live webhook

1. While in live mode, create a **live** webhook pointing to your real address, using the same path as your test webhook.
2. Copy its signing secret from the dashboard.

**You should see:** a live webhook endpoint with its own signing secret.

**If not:** remember the test webhook does not work for live payments. If you see only your test endpoint, you are still in test mode.

### 8. Put the live Stripe values in Netlify and redeploy

1. In Netlify, set the live Stripe keys and the live signing secret as **production** values only.
2. Leave preview builds on test keys. Live keys must never reach preview builds, and test keys must not stay in production.
3. Redeploy.

**You should see:** a successful deploy, with production on live values and previews on test values.

**If not:** if it worked on the preview but not on your domain, production variables, the Clerk production instance and the Stripe live webhook are separate from test. Check each one.

### 9. Final step: sign up on your domain

> **Last chance to stop:** from here a real card is charged. If any earlier step is unfinished, go back first.

1. In a private browser window, open your own domain.
2. Sign up with a new real email.

**You should see:** a new account on your domain, listed in the Clerk **production** user list.

**If not:** if sign-in fails only on your domain, check step 4 and step 5.

### 10. Buy the smallest pack with a real card

1. Buy the smallest credit pack using a real card.

**You should see:** Stripe's Checkout page in live mode, then your app with the credits added.

**If not:** if the payment succeeded but nothing happened, check the **live** webhook's recent deliveries in Stripe.

### 11. Confirm everything in Stripe

1. In Stripe (live mode), check the payment.
2. Check the live webhook shows a successful delivery.

**You should see:** the payment as succeeded and a successful webhook delivery.

**If not:** ask your assistant to read the live delivery result and explain the first error. Do not change live data without a plan you have read.

### 12. Refund your own payment

1. In Stripe, refund the payment you just made.
2. Check your app behaves as your Module 9 plan says.

**You should see:** the refund shown in Stripe, and the app doing what your plan says.

**If not:** if the refund is not handled as planned, note it and ask the assistant for a plan to fix it. Do this once, deliberately, before you tell anyone the app is live.

## If you need to roll back

You can undo going live without losing anything:

* In Netlify, set the production variables back to your **test** values and redeploy. The app is then back in test mode.
* In Stripe, refund any real payment and disable the live webhook.
* Your domain and Clerk production instance can stay; they do no harm on their own.

## Check yourself

* [ ] I have a go-live checklist for this specific app.
* [ ] I understand that domain, Clerk production and Stripe live are three separate switches.
* [ ] My live webhook delivered successfully on a real payment.
* [ ] I refunded my own test purchase.

## Common mistakes

* **Going live without a final end-to-end test.**
* **Carrying test keys into production** (or live keys into preview builds).
* **Forgetting the live webhook.** The test one does not work for live payments.
* **Not refunding your own test purchase.**

You now have the full process. Next: repeat it for every app you launch, using your saved prompts from lesson 12, and use Module 12 of the Reseller Setup Walkthrough to find and win your first customers.
