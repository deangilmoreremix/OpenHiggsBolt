# Make the Clerk change and add the keys

> **Time:** about 15 minutes, plus the wait for the preview build. **You will finish with:** Clerk working on a Netlify preview deploy, with the keys in Netlify only.

---

## Before you start

Your plan from lesson 7 is approved. Now the assistant makes the change on a separate branch, so your working site stays untouched, and **you** add the Clerk keys yourself. The assistant never needs to see them. Netlify keeps them as environment variables and the app reads them when it is built.

Clerk's **development instance** is for building and testing. It works on netlify.app and preview addresses. A **production instance** requires your own domain and its own keys, and it is a separate set of users. You will set that up when you go live in lesson 13; do not use it earlier.

You will need:

* The approved plan from lesson 7 and the chat where you made it.
* Your Clerk and Netlify dashboards, signed in to in this browser.
* About 15 minutes. Menu names in Clerk and Netlify change from time to time, so if a label differs, look for the closest match.

## Step by step

### 1. Ask for the change on a branch

Paste this into the same chat as your plan and send it:

```text
Create a branch called clerk-signup and make the change you described. Explain each file you change. Tell me the exact environment variable names I need to add in Netlify. Do not ask me for secret keys.
```

**You should see:** the assistant creating a branch called `clerk-signup`, explaining each file it changes, and giving you a list of environment variable names.

**If not:** if it works on your main branch or asks you for a key, stop it and repeat the prompt. Keys never go into the chat.

### 2. Read the explanation of each file

Read what the assistant says about every changed file. Ask about anything you do not follow.

**You should see:** a plain-language reason for each file, matching the plan you approved.

**If not:** if it changed files your plan did not mention, ask why before going on.

### 3. Write down the variable names

Copy the exact variable names the assistant gave you into a note. You will type them into Netlify in step 5.

**You should see:** a short list of names, typically one for the publishable key and one for the secret key.

**If not:** ask the assistant to list the names again. Do not guess them.

### 4. Open the API keys page in Clerk

In Clerk, open the API keys page for your **development** instance.

**You should see:** a publishable key and a secret key, with the development instance selected.

**If not:** if you see a production instance, switch to development. Use production only in lesson 13.

### 5. Add the keys in Netlify

In Netlify, open your site's environment variable settings. Add each variable name from step 3, pasting the publishable and secret values yourself.

**You should see:** every variable from your list saved in Netlify.

**If not:** a mistyped name is the usual cause of failures later. Compare each name against your note, letter by letter.

### 6. Redeploy the branch as a deploy preview

Ask Netlify to build a preview for the `clerk-signup` branch. Netlify can build a preview for a branch, and a new build is needed because variables are only picked up on the next build.

**You should see:** a deploy preview for the branch building and then marked as published, with its own preview address.

**If not:** if the build fails, copy the error text (never a key) into the chat and ask the assistant to explain it. If the build succeeded before you added the keys, trigger it again.

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
