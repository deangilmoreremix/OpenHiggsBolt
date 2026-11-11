# Save your prompts and run the customer test

> **Time:** about 15 minutes. **You will finish with:** a reusable checklist, your saved prompts and a passing customer test on your Netlify address.

---

## The whole path in one page

| Step | Lessons | You do | The assistant does |
| --- | --- | --- | --- |
| Accounts | 1 | Create Netlify, Clerk, Stripe (test) | Nothing yet |
| Connect | 2 or 3 | Approve connectors | Reads your accounts |
| Brief | 4 | Paste the briefing, check the summary | Summarises the app |
| Host | 5 and 6 | Add variable values, deploy | Checks readiness, explains errors |
| Sign-up | 7 to 9 | Add Clerk keys, test a fresh account | Plans and changes the code on a branch |
| Payments | 10 and 11 | Add Stripe keys and webhook, buy a pack | Verifies payment and webhook |
| Launch | 12 and 13 | Domain, live keys, final test | Produces the go-live checklist |

What changes from app to app is only the facts on its workshop page: the name, the database, the variable names. The prompts stay the same, which is why saving them matters.

## Save your prompts

Make a note titled "Launch prompts" and paste in:

1. The briefing from lesson 4.
2. The deploy-readiness prompt from lesson 5.
3. The Clerk plan prompt from lesson 7.
4. The Stripe verification prompt from lesson 11.
5. The go-live prompt from lesson 13.

For the next app you replace the app name and repo address and go straight down the list.

## Branding, domain and the customer test

Before you go live, finish the business side with Modules 10 and 11 of the Reseller Setup Walkthrough: your app's name and logo, your own domain, and the full customer test (sign up, buy, use the app, see credits). Run that test on your Netlify address and again on your domain.

## Keeping it healthy

* **Check Stripe and Netlify weekly** for failed webhooks and failed deploys. Ask the assistant: "Summarise failed deploys and failed webhook deliveries from the last 7 days."
* **Watch your free-plan limits** on Netlify and Clerk as users grow.
* **Rotate a key if it was ever exposed**, then redeploy.
* **Back up your database** per your host's guidance.
* **Never let the assistant change live data** without a plan you have read.

## Check yourself

* [ ] I saved my reusable prompts.
* [ ] I ran the full customer test on the Netlify address.

## Common mistakes

* **Skipping the customer test** because each step worked on its own.

Next: lesson 13, go live.
