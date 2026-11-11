# Add variables, deploy and fix failures

> **Time:** about 18 minutes. **You will finish with:** your app live at a netlify.app address, with every secret in Netlify's settings and none in the chat or the code.

---

## Where secrets live

Your app reads secrets (the database address, Stripe keys, the MuAPI key, Clerk keys later) from **environment variables**. The rule for the whole track:

* The assistant tells you the **name** of each variable.
* **You** paste the **value** into Netlify's environment variable settings.
* Values never go in the chat, the repository, a screenshot or an email.

After you add or change a variable, you must **redeploy**, because the app only reads variables when it is built or started.

## Step by step

### 4. Add the environment variables

In your site's settings, find the environment variables area. For each variable name from your workshop page:

1. Add the name exactly as written.
2. Paste the value from the service that owns it (database host, Stripe, MuAPI).
3. Mark secrets as secret if Netlify offers the option.

Variables you do not have yet (Clerk keys, the Stripe webhook secret) come in lessons 8 and 10. The app will not be fully working until then; that is expected.

Two values need care:

* **The site's public address variable** (for example the one your app uses for its own URL) must match your real netlify.app address. You only know the address after the first deploy, so set it, then redeploy.
* **Database address:** use the connection string your database host gives for applications. If your host offers a "pooled" and a "direct" string, your workshop page says which variable takes which.

### 5. Deploy

Trigger a deploy and watch the log. A successful deploy ends with a status such as **Published**. Open the address.

### 6. If the deploy fails

Do not guess. Ask:

> Read the failed deploy log through the Netlify connector and tell me the first error and what causes it. Do not change anything yet.

Then fix **one error at a time**, redeploying after each. The first error is usually the real one; later errors are often consequences.

## What "working" looks like at this stage

* The home page loads.
* Pages that do not need sign-in or payments work.
* Sign-in may not work yet (lessons 7 to 9 replace it) and payments are not connected to your Netlify address yet (lesson 10). That is fine.

## Check yourself

* [ ] The deploy shows Published.
* [ ] My netlify.app address opens my app's home page.
* [ ] All variables I have so far are in Netlify, none in the chat or the repository.
* [ ] I redeployed after adding variables.

## Common mistakes

* **Changing a variable and not redeploying.** Nothing changes until the next deploy.
* **A typo in a variable name.** Names must match exactly, including capitals.
* **Putting secrets in a file in the repo.** Even a private repo is not the place.
* **Fixing several errors at once.** You will not know which fix worked.

## If something is off

* *Build fails on a missing variable.* The build reads it. Add it in Netlify and redeploy.
* *The page loads but data fails.* The database address is wrong or the tables were not created. Revisit Module 5 of the Reseller Setup Walkthrough.
* *Works locally but not on Netlify.* The assistant should compare the Node version and build command with Netlify's settings.

Next: lesson 7, planning the Clerk change.
