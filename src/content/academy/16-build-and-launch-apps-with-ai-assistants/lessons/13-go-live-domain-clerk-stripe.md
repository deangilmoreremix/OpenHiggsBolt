# Go live: domain, Clerk production and Stripe live

> **Time:** about 18 minutes. **You will finish with:** your app live on your own domain with Clerk production and Stripe live mode, tested with a real payment you refunded.

---

## Going live deliberately

Going live changes three things at once, and each has a separate "live" version that does **not** carry over from test:

1. **Your domain.** Add it in Netlify and follow its DNS instructions. Netlify serves the site on the new address once DNS settles.
2. **Clerk production instance.** Clerk's production instance needs your own domain and has its own keys and its own (empty) user list. Create it, add its keys to Netlify's **production** environment variables, and redeploy.
3. **Stripe live mode.** Activate your account (Module 7 of the walkthrough), create live keys, create a **live** webhook for your real address, and put the live signing secret in Netlify.

Ask the assistant to build the checklist for your specific app:

> Give me a go-live checklist for this app on Netlify with Clerk and Stripe: custom domain, Clerk production instance, live Stripe keys, live webhook, environment variables per environment, and a final test. Mark each item as either "I do this in a dashboard" or "you change this in the code". Do not change anything.

### The final test

1. Sign up with a new real email on your domain.
2. Buy the smallest credit pack with a real card.
3. Confirm credits arrive and Stripe shows the payment and a successful webhook.
4. Refund the payment yourself in Stripe and check it behaves as your Module 9 plan says.

Do this once, deliberately, before you tell anyone the app is live.

## Check yourself

* [ ] I have a go-live checklist for this specific app.
* [ ] I understand that domain, Clerk production and Stripe live are three separate switches.

## Common mistakes

* **Going live without a final end-to-end test.**
* **Carrying test keys into production** (or live keys into preview builds).
* **Forgetting the live webhook.** The test one does not work for live payments.
* **Not refunding your own test purchase.**

## If something is off

* *It worked on the preview but not on my domain.* Production variables, the Clerk production instance and the Stripe live webhook are separate from test. Check each one.
* *Sign-in fails only on my domain.* The Clerk production instance may not list the domain yet.
* *A payment succeeded but nothing happened.* Check the **live** webhook's recent deliveries.

You now have the full process. Repeat it for every app you launch, and use Module 12 of the Reseller Setup Walkthrough to find and win your first customers.
