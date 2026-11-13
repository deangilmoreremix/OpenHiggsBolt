# The Vibe-Coding Workflow: Prompt, Build, Test, Ship

> **Time:** about 18 minutes. **You will finish with:** a written session brief, a tool built and tested from it, and a zipped, ship-ready package.

---

## Before you start

After a second or third tool, many creators hit a wall: the agent produces a file that crashes, you paste the error back, something else breaks, and after 3 rounds the project is abandoned. Vibe-coding without structure is just random prompting. The fix is a 4-phase loop, **Prompt, Build, Test, Ship**, which gives you and the agent a clear contract for each phase. Original timing guidance: Prompt about 10 minutes, Build 15-30, Test 10-15, Ship 10. A first run with a small tool can be much faster, which is what this lesson uses.

You will need: Claude Code or Cursor from lesson 1, a small tool idea (the example is a FLUX Batch Prompt Runner), 3 real prompts, and a muapi key stored as the `MUAPI_KEY` environment variable (never typed into chat). Prerequisites: lessons 1 and 2.

## Step by step

### 1. Write the session brief before opening the agent

Open [`templates/vibe-coding-session-brief.md`](templates/vibe-coding-session-brief.md). A brief needs a one-sentence description, error handling rules and tech constraints. Golden rule: never open the agent without a written brief. Fill it in like this:

```text
Tool Name: FLUX Batch Prompt Runner
One-Line Description: Reads prompts from prompts.txt, sends each to muapi /nano-banana-2, saves all output image URLs to results.csv.
Input: prompts.txt - one prompt string per line
Output: results.csv - columns: PromptText, ImageURL, Timestamp
API: muapi (key from MUAPI_KEY environment variable)
Error Handling: If an API call fails, log the error to errors.log and continue.
Packages Allowed: requests, csv (standard library)
```

**You should see:** a complete brief with every field filled and no blanks.

**If not:** if you cannot fill a field, the tool is not scoped yet. Revisit lesson 2's four questions.

### 2. Build: paste the whole brief once

Paste the full brief into the agent in a single message and let it finish without interrupting.

**You should see:** the agent generating the complete first version and explaining it in plain English.

**If not:** if the agent stops to ask something, answer briefly and let it continue.

### 3. Check the explanation, not the code

Read the agent's plain-English explanation and compare it with your brief.

**You should see:** an explanation that matches your input, output, API and error handling.

**If not:** correct it with one targeted sentence, not a full re-description. In the original example the agent used `requests.get()` instead of `requests.post()`, and a single sentence fixed it.

### 4. Test on real data

Create a `prompts.txt` with 3 real prompts you would actually use, then run the script (adapt the file name to what your agent created):

```bash
python batch_runner.py
```

Check three things: is the output format correct, does it handle blank lines, special characters and long strings, and does it finish in under 60 seconds for a typical input?

**You should see:** a `results.csv` with 3 rows and working image URLs.

**If not:** paste the **exact error message**, not a paraphrase:

```text
Running the script gives this error: KeyError: 'title1'. Fix it.
```

### 5. Ship: generate the packaging files

Ask the agent:

```text
Write a plain-English README.md explaining installation and usage. Also create a requirements.txt listing all pip packages needed.
```

**You should see:** a `README.md` and a `requirements.txt` in the folder.

**If not:** if packages are missing from `requirements.txt`, ask the agent to check every import in the script.

### 6. Zip and name it

Zip the folder as `[tool-name]-v1.0.zip`. Uploading to Gumroad or LemonSqueezy is covered in lesson 4.

**You should see:** one zip containing the script, README and `requirements.txt`, and no API key inside any file.

**If not:** if you find a key in any file, remove it and use the environment variable instead.

## Check yourself

* [ ] I wrote a brief before opening the agent.
* [ ] I judged the build by its plain-English explanation first.
* [ ] I tested with real data and pasted exact error messages when something failed.
* [ ] My zip is named with a version and contains no secrets.

## Common mistakes

* **Improvised prompting.** No brief means unpredictable code.
* **Interrupting the build.** Let the first draft finish, then correct.
* **Paraphrasing errors.** Paste the exact message.
* **Testing only with dummy data.** Real names and prompts reveal the real bugs.

## Go further

**Worked example: FLUX Batch Prompt Runner.** Phase 1: 8 minutes writing the brief. Phase 2: the agent generated `batch_runner.py` in 2 minutes; the `get`/`post` mistake was fixed with one sentence. Phase 3: 10 real prompts, 9 succeeded and 1 failed on a special apostrophe, fixed in 30 seconds. Phase 4: README and requirements in 1 minute, zip uploaded to Gumroad. Total: 52 minutes from blank folder to live product page, priced at **$29 one-time**, week 1: 11 sales x $29 = **$319**.

**Compare tools**

| Vibe-Coding Setup | Phase 2 Speed | Phase 3 Error Recovery | Learning Curve |
|---|---|---|---|
| **Claude Code (terminal)** | Fast (single command sends full brief) | Excellent (paste error, instant fix) | Low |
| **Cursor (visual editor)** | Fast (chat panel) | Excellent (click error in editor, agent sees context) | Very Low |
| **Windsurf (Codeium)** | Fast | Good | Low |
| **ChatGPT.com (no file access)** | Slow (manual copy-paste) | Poor (loses context) | Medium |

**Scaling beyond one tool:** release a `v2.0` (for example a GUI window so buyers need no terminal) and charge existing buyers an upgrade fee of **$9-$15**. Bundle 3 related tools (for example "The POD Creator Toolkit": Etsy Title Generator + Keyword Expander + Mockup Namer) at a 25% discount; bundles can outperform single tools by **2.5-4x revenue**.

**Exercises**

1. **Easy:** Write a full session brief for a "YouTube Script Section Formatter" without opening an agent.
2. **Medium:** Run all 4 phases to build a script that reads Etsy store names and generates 5 niche product idea keywords per store.
3. **Hard:** Complete Prompt, Build, Test, Ship for a tool of your choice, upload it to a Gumroad draft page and write the product description.

**Templates:** [`templates/vibe-coding-session-brief.md`](templates/vibe-coding-session-brief.md) for session planning, agent prompt frameworks and tool spec sheets.

**Produce this in SmartVideo GO AI:** Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner and Lip-Sync Studio can all be fed by tools like these.

Next: Pricing & Selling Tools You Build With Agents.
