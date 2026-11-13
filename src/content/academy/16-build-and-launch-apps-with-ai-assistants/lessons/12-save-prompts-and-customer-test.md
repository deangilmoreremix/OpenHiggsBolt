# Save your prompts and run the customer test

> **Time:** about 15 minutes. **You will finish with:** a reusable checklist, your saved prompts and a passing customer test on your Netlify address.

---

## Before you start

You have now built the whole path once. This lesson makes it repeatable and checks it the way a customer would. What changes from app to app is only the facts on its workshop page: the name, the database, the variable names. The prompts stay the same, which is why saving them matters.

Here is the whole path in one page:

| Step | Lessons | You do | The assistant does |
| --- | --- | --- | --- |
| Accounts | 1 | Create Netlify, Clerk, Stripe (test) | Nothing yet |
| Connect | 2 or 3 | Approve connectors | Reads your accounts |
| Brief | 4 | Paste the briefing, check the summary | Summarises the app |
| Host | 5 and 6 | Add variable values, deploy | Checks readiness, explains errors |
| Sign-up | 7 to 9 | Add Clerk keys, test a fresh account | Plans and changes the code on a branch |
| Payments | 10 and 11 | Add Stripe keys and webhook, buy a pack | Verifies payment and webhook |
| Launch | 12 and 13 | Domain, live keys, final test | Produces the go-live checklist |

You will need:

* A notes app or document where you keep text.
* Your app on its Netlify address, still in Stripe test mode.
* The Reseller Setup Walkthrough, for Modules 10 and 11.
* About 15 minutes.

## Step by step

### 1. Create your prompts note

1. Open your notes app and make a new note titled "Launch prompts".

**You should see:** an empty note with that title.

**If not:** any place you can find again works: a document, a notes app or a file. Keep it private, since it describes your accounts.

### 2. Paste in your five prompts

Copy these from the lessons into the note, in this order:

1. The briefing from lesson 4.
2. The deploy-readiness prompt from lesson 5.
3. The Clerk plan prompt from lesson 7.
4. The Stripe verification prompt from lesson 11.
5. The go-live prompt from lesson 13.

**You should see:** five prompts in the note, each with a short label.

**If not:** if you cannot find one, reopen that lesson and copy it from there. For lesson 13, you can come back and add it after you do that lesson. Never save a secret key in this note.

### 3. Learn how to reuse the note

1. Read this rule once and add it as a line at the top of the note.

```text
For the next app: replace the app name and the repo address, then go straight down the list.
```

**You should see:** a note that works as a checklist for your next app.

**If not:** if a prompt mentions facts that belong to this app only, replace them with a clear placeholder such as APP NAME so you remember to swap them.

### 4. Finish your branding

1. Open Modules 10 and 11 of the Reseller Setup Walkthrough.
2. Follow them for your app's name and logo.

**You should see:** your app showing its own name and logo, not a placeholder.

**If not:** if the logo does not appear, redeploy and refresh the page. Ask the assistant to explain any build error.

### 5. Plan your domain

1. In the same modules, decide on your own domain and note it down.

**You should see:** a domain name written in your note, ready for lesson 13.

**If not:** if you do not have a domain yet, you can still finish this lesson on your Netlify address. Connecting the domain happens in lesson 13.

### 6. Run the customer test on your Netlify address

1. Open your Netlify address in a private browser window, so you are not already signed in.
2. Sign up as a new customer with an email you control.
3. Buy a credit pack with Stripe's test card.
4. Use the app as a customer would.
5. Check that your credits show correctly.

**You should see:** the full journey works in order: sign up, buy, use the app, see credits.

**If not:** note the first step that breaks and ask your assistant to explain it. Fix that, then run the whole test again from the start. A test that passes in pieces is not a pass.

### 7. Repeat the test on your domain

1. Once your own domain is connected (lesson 13), run the same customer test there.

**You should see:** the same result on your domain as on the Netlify address.

**If not:** if it works on one address and not the other, the settings for the new address are missing. Lesson 13 covers them.

### 8. Ask for a weekly health summary

Save this prompt in your note, then paste it into your assistant to try it now:

```text
Summarise failed deploys and failed webhook deliveries from the last 7 days.
```

**You should see:** a short summary, likely "none" for a new app.

**If not:** if the assistant cannot see Netlify or Stripe, check the connectors are switched on for this chat (lesson 2 or 3).

### 9. Add your upkeep habits to the note

Add these five lines under the prompts:

* **Check Stripe and Netlify weekly** for failed webhooks and failed deploys.
* **Watch your free-plan limits** on Netlify and Clerk as users grow.
* **Rotate a key if it was ever exposed.** Create a new one in the service's dashboard, put it in Netlify's variables, then redeploy. Never paste it into the chat.
* **Back up your database** per your host's guidance.
* **Never let the assistant change live data** without a plan you have read.

**You should see:** a note with prompts on top and habits below.

**If not:** keep it short. A note you actually read beats a long one you do not.

## Check yourself

* [ ] I saved my reusable prompts.
* [ ] I ran the full customer test on the Netlify address.
* [ ] I saved the weekly health prompt.
* [ ] I wrote down my upkeep habits.

## Common mistakes

* **Skipping the customer test** because each step worked on its own.
* **Testing while signed in as yourself.** Use a private window and a new account.
* **Saving secrets in the prompts note.** Keep prompts and keys apart.

Next: lesson 13, go live.
