# Connect Stripe test payments and check them from the chat

> **Time:** about 40 minutes. **You will finish with:** a test purchase on your Netlify site that adds credits, confirmed by your assistant from Stripe.

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

Stay in test mode. Stripe's test cards never charge anyone, and test and live data are completely separate: a test key cannot see live payments and vice versa. Going live is lesson 8, not now.

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

### 3. Make a test purchase

1. Sign in to your app (Clerk, from lesson 6).
2. Buy a credit pack.
3. On Stripe's page use the test card from Stripe's testing documentation, with any future expiry and any security code.
4. You should return to your app and see your **credits increase**.

### 4. Ask the assistant to verify from Stripe

> Using the Stripe connector in test mode, find my most recent test checkout session and tell me whether it succeeded, and whether the webhook delivery to my site returned a success response. Do not change anything.

This turns "it seems to work" into evidence: the payment succeeded **and** the webhook reached your app.

### 5. Test the unhappy paths

* Use Stripe's test card for a **declined** payment. Credits must not change.
* Cancel on the Checkout page. You should come back to the app with no credits added.
* Check that buying twice adds credits twice, not once or four times.

## What good looks like

* Stripe's dashboard shows the test payment as succeeded.
* The webhook endpoint shows a successful delivery.
* Your credits increased by exactly the pack size.

## Check yourself

* [ ] Stripe test keys and the webhook signing secret are in Netlify only.
* [ ] I redeployed after adding them.
* [ ] A test purchase added the right credits.
* [ ] The assistant confirmed the payment and webhook delivery from Stripe.
* [ ] A declined card added nothing.

## Common mistakes

* **A live key during testing.** Test mode only until lesson 8.
* **Not redeploying** after adding the signing secret.
* **A webhook address with the wrong path** (or a trailing slash that does not match).
* **Using the wrong secret.** Each webhook endpoint has its own signing secret; copy the one for this endpoint.

## If something is off

* *Payment succeeded but credits did not appear.* The webhook failed. Ask the assistant to read the delivery result in Stripe. Common causes: wrong address, wrong signing secret, or an unredeployed variable.
* *The webhook returns an error.* Ask the assistant to read the response and the app's logs on Netlify, and explain the first error.
* *Credits added to the wrong person.* Stop and ask the assistant to check how the checkout session is tied to a user; this usually comes from a mapping error in lesson 6.

Next: lesson 8, the full build and going live.
