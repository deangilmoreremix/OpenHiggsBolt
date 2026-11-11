# The full build, and going live

> **Time:** about 40 minutes plus your own testing. **You will finish with:** a repeatable checklist for any of the 38 apps, your saved prompts, and a go-live plan.

---

## The whole path in one page

| Step | Lesson | You do | The assistant does |
| --- | --- | --- | --- |
| Accounts | 1 | Create Netlify, Clerk, Stripe (test) | Nothing yet |
| Connect | 2 or 3 | Approve connectors | Reads your accounts |
| Brief | 4 | Paste the briefing, check the summary | Summarises the app |
| Host | 5 | Add variable values, deploy | Checks readiness, explains errors |
| Sign-up | 6 | Add Clerk keys, test a fresh account | Plans and changes the code on a branch |
| Payments | 7 | Add Stripe keys and webhook, buy a pack | Verifies payment and webhook |
| Launch | 8 | Domain, live keys, final test | Produces the go-live checklist |

What changes from app to app is only the facts on its workshop page: the name, the database, the variable names. The prompts stay the same, which is why saving them matters.

## Save your prompts

Make a note titled "Launch prompts" and paste in:

1. The briefing from lesson 4.
2. The deploy-readiness prompt from lesson 5.
3. The Clerk plan prompt from lesson 6.
4. The Stripe verification prompt from lesson 7.
5. The go-live prompt below.

For the next app you replace the app name and repo address and go straight down the list.

## Branding, domain and the customer test

Before you go live, finish the business side with Modules 10 and 11 of the Reseller Setup Walkthrough: your app's name and logo, your own domain, and the full customer test (sign up, buy, use the app, see credits). Run that test on your Netlify address and again on your domain.

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

## Keeping it healthy

* **Check Stripe and Netlify weekly** for failed webhooks and failed deploys. Ask the assistant: "Summarise failed deploys and failed webhook deliveries from the last 7 days."
* **Watch your free-plan limits** on Netlify and Clerk as users grow.
* **Rotate a key if it was ever exposed**, then redeploy.
* **Back up your database** per your host's guidance.
* **Never let the assistant change live data** without a plan you have read.

## Check yourself

* [ ] I saved my reusable prompts.
* [ ] I ran the full customer test on the Netlify address.
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

You now have the full process. Repeat it for every app you launch, and use Module 12 to find and win your first customers.
