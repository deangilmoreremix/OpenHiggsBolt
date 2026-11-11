# Test purchase and check it from the chat

> **Time:** about 15 minutes. **You will finish with:** a test purchase that adds credits, confirmed by your assistant from Stripe.

---

## Before you start

Your keys and webhook are in place from lesson 10. Now you will prove the whole payment path works: sign in, pay, return to the app, and see credits arrive. "It seems to work" is not enough, so you will also ask your assistant to confirm from Stripe that the payment succeeded **and** the webhook reached your app. Then you will try the unhappy paths, because a payment system that only works when everything goes right is not finished.

Everything here is **Stripe test mode**. No real money moves, and no live key is involved until lesson 13.

You will need:

* Your deployed app, with the Clerk and Stripe test settings from lessons 7 to 10 (and the signing secret redeployed).
* Your assistant with the Stripe connector working in test mode.
* The test card numbers from Stripe's testing documentation (search for "Stripe testing cards").
* About 15 minutes.

## Step by step

### 1. Sign in to your app

1. Open your Netlify address and sign in with the account you made through Clerk in lessons 7 to 9.

**You should see:** your app, signed in, with your current credit balance. Note the number.

**If not:** if sign-in fails, go back to lesson 9 and fix sign-up first. Payments need a signed-in user.

### 2. Start a credit pack purchase

1. Choose to buy a credit pack.

**You should see:** Stripe's Checkout page, showing a test-mode banner or label.

**If not:** if nothing happens or you see an error, ask your assistant to read the app's logs on Netlify and explain the first error. If the page is not marked as test mode, stop: a live key may be in use. Test mode only until lesson 13.

### 3. Pay with the test card

1. On Stripe's page, enter the successful test card from Stripe's testing documentation.
2. Use any future expiry date and any security code, then pay.

**You should see:** you return to your app.

**If not:** if the card is refused, check you copied the number exactly from Stripe's testing documentation and that the page is in test mode.

### 4. Check that your credits increased

1. Look at your credit balance back in the app. Refresh once if needed.

**You should see:** your credits increased by exactly the pack size.

**If not:** if the payment succeeded but credits did not appear, the webhook failed. Carry on to step 5, where your assistant reads the delivery result. Common causes: wrong webhook address, wrong signing secret, or a variable you did not redeploy.

### 5. Ask the assistant to verify from Stripe

Paste this into your assistant and send it:

```text
Using the Stripe connector in test mode, find my most recent test checkout session and tell me whether it succeeded, and whether the webhook delivery to my site returned a success response. Do not change anything.
```

**You should see:** an answer that the session succeeded and the webhook delivery returned a success response. That turns "it seems to work" into evidence.

**If not:** if the webhook returned an error, ask the assistant to read the response and the app's logs on Netlify and explain the first error. Check these four things:

* The signing secret was added to Netlify and the site was **redeployed**.
* The webhook address has the right path (a trailing slash that does not match also fails).
* You used the signing secret for **this** endpoint. Each webhook endpoint has its own.
* You are looking at test-mode deliveries, not live.

### 6. Try a declined payment

1. Start another purchase.
2. Use Stripe's test card for a **declined** payment.

**You should see:** Stripe shows the decline, and your credits do not change.

**If not:** if credits changed after a decline, stop and ask the assistant to explain how the app decides when to add credits. It should only act on a successful payment event.

### 7. Try cancelling at Checkout

1. Start another purchase.
2. On the Checkout page, choose to go back or cancel.

**You should see:** you return to the app with no credits added.

**If not:** if credits were added, or you landed on an error page, ask the assistant to check the cancel address used when the checkout session is created.

### 8. Buy twice and count

1. Make one more successful test purchase.

**You should see:** the credits went up twice in total, once per purchase. Not once, and not four times.

**If not:** if credits were added to the wrong person, stop and ask the assistant to check how the checkout session is tied to a user. This usually comes from a mapping error in lessons 7 to 9. If credits were added more than once per payment, ask the assistant to check the webhook handles each event only once.

## What good looks like

* Stripe's dashboard shows the test payment as succeeded.
* The webhook endpoint shows a successful delivery.
* Your credits increased by exactly the pack size.

## Check yourself

* [ ] A test purchase added the right credits.
* [ ] The assistant confirmed the payment and webhook delivery from Stripe.
* [ ] A declined card added nothing.
* [ ] Cancelling at Checkout added nothing.
* [ ] Buying twice added credits twice.

## Common mistakes

* **A live key during testing.** Test mode only until lesson 13.
* **Not redeploying** after adding the signing secret.
* **A webhook address with the wrong path** (or a trailing slash that does not match).
* **Using the wrong secret.** Each webhook endpoint has its own signing secret; copy the one for this endpoint in the Stripe dashboard, into Netlify, never into the chat.

Next: lesson 12, save your prompts and run the customer test.
