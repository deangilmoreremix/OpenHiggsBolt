# Stripe keys and the webhook

> **Time:** about 18 minutes. **You will finish with:** your Stripe test keys and a webhook endpoint connected to your Netlify site.

---

## Before you start

You are **not** adding payments. The app already creates Stripe checkouts for credit packs and already has a webhook that listens for completed payments and adds credits. All you do is connect **your** Stripe account to **your** deployment: keys, then a webhook that points at your address. If you did Modules 7 to 9 of the Reseller Setup Walkthrough for Vercel, this is the same set of steps on a different host.

How a payment flows:

1. A customer clicks a credit pack. Your app sends them to **Stripe Checkout**.
2. They pay on Stripe's page (in test mode: a test card).
3. Stripe sends your app a **webhook**: a message to a specific address saying "this checkout completed".
4. Your app checks the message is really from Stripe (using the **signing secret**), then adds the credits.

The two things people get wrong are the **webhook address** and the **signing secret**. Your workshop page's webhook panel gives the exact path your app listens on.

Stay in **test mode**. Stripe's test cards never charge anyone, and test and live data are completely separate: a test key cannot see live payments and vice versa. Going live is lesson 13, not now. As always, you paste keys into Netlify yourself and never into the AI chat.

You will need:

* Your Stripe account in test mode and your Netlify site, signed in to in this browser.
* Your workshop page open, showing the variable names and the webhook path.
* About 18 minutes. Menu names in Stripe and Netlify change from time to time, so look for the closest match.

## Step by step

### 1. Switch Stripe to test mode

Open Stripe and check that test mode (sometimes called a sandbox) is on.

**You should see:** a visible test or sandbox indicator.

**If not:** switch it on before continuing. Nothing in this lesson uses live mode.

### 2. Open the Stripe API keys page

In Stripe (test mode), open the API keys page.

**You should see:** test keys, beginning with `pk_test` and `sk_test`.

**If not:** keys beginning `pk_live` or `sk_live` mean you are in live mode. Switch back to test mode.

### 3. Add the Stripe test keys to Netlify

1. In Netlify's environment variable settings, add the Stripe variables named in your workshop page, pasting the test values yourself.
2. If your app also uses a publishable key in the browser, add it the same way.

**You should see:** each variable saved in Netlify, with test values only.

**If not:** compare each variable name with your workshop page, letter by letter.

### 4. Add the webhook endpoint in Stripe

In Stripe's webhook settings (test mode), add an endpoint. For its address, use your netlify.app address plus the **webhook path** from your workshop page.

**You should see:** the endpoint form with your full address filled in.

**If not:** a wrong path, or a trailing slash that does not match, is the usual cause of failed webhooks later. Check it against your workshop page.

### 5. Choose the event to listen for

Select the event `checkout.session.completed`, then create the endpoint.

**You should see:** the new endpoint listed, listening for that one event.

**If not:** open the endpoint and add the event.

### 6. Copy the signing secret into Netlify

After creating the endpoint, Stripe shows a **signing secret**. Copy it into the Netlify variable your workshop page names for it.

**You should see:** the signing secret saved in Netlify, and nowhere else.

**If not:** each endpoint has its own signing secret, so make sure you copied it from this endpoint, not another one.

### 7. Redeploy

Trigger a new deploy of your Netlify site. The new variables are only picked up on the next deploy.

**You should see:** a new deploy built and published.

**If not:** if the build fails, copy the error text (never a key) into the chat and ask the assistant to explain it.

## Check yourself

* [ ] Stripe test keys and the webhook signing secret are in Netlify only.
* [ ] The webhook address is my netlify.app address plus the path from my workshop page, listening for `checkout.session.completed`.
* [ ] I redeployed after adding them.

## Common mistakes

* **A live key during testing.** Test mode only until the go-live lessons.
* **A webhook address with the wrong path** (or a trailing slash that does not match).
* **Using the wrong secret.** Each endpoint has its own signing secret.

Next: lesson 11, test purchase and check it from the chat.
