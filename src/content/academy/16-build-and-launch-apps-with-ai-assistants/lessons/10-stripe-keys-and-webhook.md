# Stripe keys and the webhook

> **Time:** about 18 minutes. **You will finish with:** your Stripe test keys and a webhook endpoint connected to your Netlify site.

---

## Stripe is already built in

You are **not** adding payments. The app already creates Stripe checkouts for credit packs and already has a webhook that listens for completed payments and adds credits. All you do is connect **your** Stripe account to **your** deployment: keys, then a webhook that points at your address.

If you did Modules 7 to 9 of the Reseller Setup Walkthrough for Vercel, this is the same set of steps on a different host.

## How a payment flows

1. A customer clicks a credit pack. Your app sends them to **Stripe Checkout**.
2. They pay on Stripe's page (in test mode: a test card).
3. Stripe sends your app a **webhook**: a message to a specific address saying "this checkout completed".
4. Your app checks the message is really from Stripe (using the **signing secret**), then adds the credits.

The two things people get wrong are the **webhook address** and the **signing secret**. Your workshop page's webhook panel gives the exact path your app listens on.

## Test mode, strictly

Stay in test mode. Stripe's test cards never charge anyone, and test and live data are completely separate: a test key cannot see live payments and vice versa. Going live is lesson 13, not now.

## Step by step

### 1. Add the Stripe test keys to Netlify

1. In Stripe (test mode) open the API keys page.
2. In Netlify's environment variable settings, add the Stripe variables named in your workshop page, pasting the test values yourself.
3. If your app also uses a publishable key in the browser, add it the same way.

### 2. Create the webhook

1. In Stripe's webhook settings (test mode), add an endpoint.
2. The address is your netlify.app address plus the **webhook path** from your workshop page.
3. Listen for the event `checkout.session.completed`.
4. After creating it, Stripe shows a **signing secret**. Copy it into the Netlify variable your workshop page names for it.
5. **Redeploy.** The new variable is only picked up on the next deploy.

## Check yourself

* [ ] Stripe test keys and the webhook signing secret are in Netlify only.
* [ ] The webhook address is my netlify.app address plus the path from my workshop page, listening for `checkout.session.completed`.
* [ ] I redeployed after adding them.

## Common mistakes

* **A live key during testing.** Test mode only until the go-live lessons.
* **A webhook address with the wrong path** (or a trailing slash that does not match).
* **Using the wrong secret.** Each endpoint has its own signing secret.

Next: lesson 11, test purchase and check it from the chat.
