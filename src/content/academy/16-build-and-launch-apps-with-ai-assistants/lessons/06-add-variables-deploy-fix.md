# Add variables, deploy and fix failures

> **Time:** about 18 minutes. **You will finish with:** your app live at a netlify.app address, with every secret in Netlify's settings and none in the chat or the code.

---

## Before you start

Your app reads secrets (the database address, Stripe keys, the MuAPI key, Clerk keys later) from **environment variables**. The rule for the whole track:

* The assistant tells you the **name** of each variable.
* **You** paste the **value** into Netlify's environment variable settings.
* Values never go in the chat, the repository, a screenshot or an email.

After you add or change a variable, you must **redeploy**, because the app only reads variables when it is built or started.

Variables you do not have yet (Clerk keys, the Stripe webhook secret) come in lessons 8 and 10. The app will not be fully working until then; that is expected.

You will need:

* The Netlify site from lesson 5.
* Your workshop page's variable names and the services that own the values (database host, Stripe, MuAPI).
* About 18 minutes.

## Step by step

### 1. Open the environment variables area

In your site's settings in Netlify, find the environment variables area (the exact menu name may differ).

**You should see:** a place to add a variable name and value.

**If not:** look for a section named variables, environment or build settings. If you cannot find it, ask the assistant to check the current Netlify docs for where it is.

### 2. Add each variable name

For each variable name from your workshop page, add the name exactly as written, including capitals.

**You should see:** the names listed in Netlify.

**If not:** a typo in a name is the most common cause of later errors. Compare each name with your workshop page.

### 3. Paste each value from the service that owns it

Paste the value from the service that owns it (database host, Stripe, MuAPI). Mark secrets as secret if Netlify offers the option.

**You should see:** each variable saved, with secret values hidden.

**If not:** if you cannot find a value, open the service's own dashboard to get it. Do not ask the assistant to guess it and do not paste it in the chat.

### 4. Check the database address

Use the connection string your database host gives for applications. If your host offers a "pooled" and a "direct" string, your workshop page says which variable takes which.

**You should see:** `DATABASE_URL` and any other database variable matching what your workshop page says.

**If not:** if you are unsure which string goes where, ask the assistant which variable takes which, and check your answer against the workshop page.

### 5. Deploy

Trigger a deploy and watch the log.

**You should see:** the deploy ends with a status such as **Published**.

**If not:** go to step 6.

### 6. If the deploy fails, ask for the first error

Do not guess. Send this:

```text
Read the failed deploy log through the Netlify connector and tell me the first error and what causes it. Do not change anything yet.
```

**You should see:** the first error and its cause. The first error is usually the real one; later errors are often consequences.

**If not:** if the connector cannot read the log, copy the first error line from the log and paste only that (check it contains no secret).

### 7. Fix one error at a time

Fix **one error at a time**, redeploying after each, until the deploy shows Published.

**You should see:** the deploy log getting further each time.

**If not:** if a fix does not help, undo it with the assistant before trying another, so you know which change did what.

### 8. Set the site's public address and redeploy

The variable your app uses for its own URL must match your real netlify.app address. You only know the address after the first deploy, so open the site, copy the address, set that variable in Netlify, then redeploy.

**You should see:** a second deploy that shows Published, and your netlify.app address opening your app's home page.

**If not:** check the address has no typo and no trailing differences from the one Netlify shows.

### 9. Know what "working" looks like now

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
