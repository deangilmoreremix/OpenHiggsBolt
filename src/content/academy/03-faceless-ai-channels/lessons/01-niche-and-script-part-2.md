# Niche Selection & Script Pipeline, part 2

> **Time:** about 15 minutes. **You will finish with:** a finished, read-aloud-tested 60-second script of under 180 words, written in a conversational, visually paced format.

---

## Before you start

Platform recommendation systems (YouTube, TikTok, Reels) prioritize Average Percentage Viewed (retention). Most viewers leave in the first 5-10 seconds, so the script must lead with a hook (fear or desire), then the problem, a step-by-step solve, and a pattern interrupt (a visual change or audio SFX) every 3-5 seconds to restart attention.

You will need: your chosen niche and video topic from part 1, [`templates/retention-script-template.md`](templates/retention-script-template.md), and a text LLM such as Claude or Gemini. Do not paste any password or secret key into the chat. In SmartVideo GO AI you can later lay the finished script out in Storyboard / Campaign Planner.

## Step by step

### 1. Lay out the five-part structure

In your retention template, create five blocks with these timings:

* 0-10s Hook: the immediate value or shock factor. No generic greetings like "Welcome back to my channel".
* 10-25s Problem: why the standard method is failing.
* 25-45s Solve: the step-by-step blueprint.
* 45-50s Pattern interrupt: a surprising statistic or change in pacing.
* 55-60s CTA: send them to the link in your description.

**You should see:** five empty, labelled blocks.

**If not:** copy the list above into your document as headings.

### 2. Generate a first draft with a system prompt

In Claude or Gemini, paste this prompt, replacing [Topic] with your topic:

```text
You are a professional YouTube Shorts scriptwriter. Write a 60-second script about [Topic]. Keep the tone conversational, informal, and visual. Avoid high-level marketing words. Write short sentences. Every 5 seconds, insert a [Visual transition] instruction. Ensure the total word count is exactly 150-160 words.
```

**You should see:** a script with short sentences and a [Visual transition] note about every 5 seconds.

**If not:** if the script opens with "Are you tired of..." or a greeting, reply asking for a hook that states a specific pain point and a number instead.

### 3. Check the word count

Paste the spoken text into a word counter. Keep it under 180 words for 60 seconds; the prompt targets 150-160.

**You should see:** a count at or under 180.

**If not:** cut the longest sentences first, or ask the LLM to shorten to 155 words.

### 4. Fit the draft into the five blocks

Move the draft into your template so each block matches its time window, with a visual direction every 5-10 seconds.

**You should see:** a hook that names a pain point and a time or money cost in the first sentence.

**If not:** rewrite only the first sentence until it does, as the worked example does ("throwing away five hours a week").

### 5. Run the read-aloud audit

Read the script out loud. Rewrite any sentence you stumble on or that sounds formal. Use active verbs, contractions ("you'll", not "you will") and direct address ("you").

**You should see:** a script you can read without stumbling.

**If not:** break any sentence that needs a breath in the middle into two.

## Check yourself

* [ ] My script is under 180 words.
* [ ] It has all five parts: hook, problem, solve, pattern interrupt, CTA.
* [ ] The first sentence has no greeting and names a specific pain point.
* [ ] I read it aloud and fixed every stumble.

## Common mistakes

* Writing like a Wikipedia article. Viewers click away in the first seconds.
* Skipping the read-aloud. Text-to-speech also stumbles on formal sentences.
* A script over 180 words. It forces fast, artificial narration.

## Go further

**Worked example excerpt ("Automate Smarter", 158 words).**

```markdown
[0-5s Hook]
"If you're still manually copying invoices into your accounting software, you are throwing away five hours a week. [Visual: Screen recording of a user typing fast on a spreadsheet, overlay red X]"

[5-15s Problem]
"Most freelancers think they have to pay a virtual assistant to do this. But assistant costs scale up, and copy-paste errors eventually lead to tax discrepancies. [Visual: close-up of calculator showing error screen]"

[15-40s Solve]
"Here is the automated fix. You connect your billing email to Zapier, run it through muapi's document parser, and auto-populate your invoices. Setup takes 10 minutes. [Visual: Clean flowchart animation showing email icon moving to folder]"
```

Why it holds retention: an immediate hook with a time penalty, a visual change every 5-10 seconds, and short sentences that a TTS model reads naturally.

**Exercises.** Medium: adapt a dry technical post into a script under 160 words using the five parts. Hard: add three pattern interrupts and say where each goes.

**Compare tools.** Frontier LLMs (Claude/Gemini) are the best pipeline option; custom system instructions can output the voiceover text and video prompt keys in one run.

Next: Duration-Matched Narration & Pacing.
