# Make the Clerk change and add the keys

> **Time:** about 15 minutes. **You will finish with:** Clerk working on a Netlify preview deploy, with the keys in Netlify only.

---

Your plan from lesson 7 is approved. Now the assistant makes the change on a separate branch, and you add the Clerk keys yourself.

## Step by step

### 2. Make the change on a branch

> Create a branch called clerk-signup and make the change you described. Explain each file you change. Tell me the exact environment variable names I need to add in Netlify. Do not ask me for secret keys.

### 3. Add the Clerk keys in Netlify

1. In Clerk, open the API keys page for your development instance.
2. In Netlify, open your site's environment variable settings.
3. Add the variable names the assistant gave you, pasting the publishable and secret keys yourself.
4. Redeploy the **branch** as a deploy preview (Netlify can build a preview for a branch).

## Development instance vs production

Clerk's development instance is for building and testing. It works on netlify.app and preview addresses. A **production instance** requires your own domain and its own keys, and it is a separate set of users. You will set that up when you go live in lesson 13; do not use it earlier.

## Check yourself

* [ ] The change is on a branch called clerk-signup.
* [ ] Each changed file was explained to me.
* [ ] Clerk keys are in Netlify only.
* [ ] A preview deploy of the branch built successfully.

## Common mistakes

* **Putting the Clerk secret key in code or chat.**
* **Forgetting to redeploy** after adding the keys.
* **Using the production instance too early.**

Next: lesson 9, test sign-up and merge.
