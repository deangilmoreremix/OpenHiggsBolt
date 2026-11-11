# Test purchase and check it from the chat

> **Time:** about 15 minutes. **You will finish with:** a test purchase that adds credits, confirmed by your assistant from Stripe.

---

Your keys and webhook are in place from lesson 10. Now prove the whole payment path works.

## Step by step

### 3. Make a test purchase

1. Sign in to your app (Clerk, from lessons 7 to 9).
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

* [ ] A test purchase added the right credits.
* [ ] The assistant confirmed the payment and webhook delivery from Stripe.
* [ ] A declined card added nothing.

## Common mistakes

* **A live key during testing.** Test mode only until lesson 13.
* **Not redeploying** after adding the signing secret.
* **A webhook address with the wrong path** (or a trailing slash that does not match).
* **Using the wrong secret.** Each webhook endpoint has its own signing secret; copy the one for this endpoint.

## If something is off

* *Payment succeeded but credits did not appear.* The webhook failed. Ask the assistant to read the delivery result in Stripe. Common causes: wrong address, wrong signing secret, or an unredeployed variable.
* *The webhook returns an error.* Ask the assistant to read the response and the app's logs on Netlify, and explain the first error.
* *Credits added to the wrong person.* Stop and ask the assistant to check how the checkout session is tied to a user; this usually comes from a mapping error in lessons 7 to 9.

Next: lesson 12, save your prompts and run the customer test.
