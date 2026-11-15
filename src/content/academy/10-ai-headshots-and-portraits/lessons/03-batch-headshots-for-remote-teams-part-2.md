# Batch Headshots for Remote Teams, part 2

> **Time:** about 16 minutes. **You will finish with:** a batch render with one unified background, a quality audit, and a zipped client bundle such as `Apex_Financial_Team_Headshots.zip`.

---

## Before you start

You have a roster and cropped selfies. Now you render all of them in one run with a fixed corporate background asset (modern glass office or studio grey gradient) so every person shares the same composition, then package the results. Quality auditing is automated so no corrupt or under-sized render reaches the client.

You will need your roster and crops from part 1, a corporate background asset, and the lesson 1 prompts. Use SmartVideo GO AI **Image Studio** (or the muapi `/nano-banana-2` or InstantID endpoint via a script). Menus move; follow the current screen. Keep API keys in your environment or secrets store, never in chat or in the script you share.

## Step by step

### 1. Lock the shared background and prompt

Choose one background and reuse the lesson 1 prompt, swapping the dress code per row of `team_roster.csv`.

**You should see:** one background and one lighting recipe that every row will use.

**If not:** if the background drifts between test renders, lock the seed and keep the same background asset.

### 2. Test on three people first

Render 3 employees through your batch script calling muapi `/nano-banana-2` (or an InstantID endpoint) in a loop, passing each employee's identity vector and dress code prompt, with the background seed locked.

**You should see:** three headshots with the same background and lighting, each clearly the right person.

**If not:** fix the prompt or identity weight now; this is cheap compared with fixing 50.

### 3. Run the full batch

Run the loop for the whole roster.

**You should see:** one render per employee, in your output folder.

**If not:** if some rows fail, re-run only those rows rather than the whole batch.

### 4. Audit quality automatically

Write a quick script that checks output resolution and file size and lists anything corrupt or under-sized before zipping. Then eyeball the flagged files.

**You should see:** a short list of files to redo, or an empty list.

**If not:** regenerate flagged files and re-run the audit.

### 5. Package into the client bundle

1. Create one subfolder per employee with `[FullName]_linkedin.jpg` (1080x1080px) and `[FullName]_website.jpg` (2400x3000px).
2. Compress all folders into the master deliverable, for example `Apex_Financial_Team_Headshots.zip`.

**You should see:** a single zip with one tidy folder per employee.

**If not:** if a file name has odd characters, rename it consistently before zipping.

## Check yourself

* [ ] All renders share one background and lighting.
* [ ] I tested 3 people before the full run.
* [ ] The audit found no under-sized or corrupt files.
* [ ] The zip has one folder per employee with LinkedIn and website files.

## Common mistakes

* **Running the full batch untested.** Always test a small sample.
* **Skipping the audit.** One corrupt file in a client zip costs trust.
* **Pasting API keys in chat or into shared scripts.**

## Go further

**Worked example, "Summit Cloud Systems" (42 employees):** 42 selfies via the self-serve intake portal; 18 minutes of automated script execution; 42 folders with 3 renders each (126 image files); 12 minutes of setup and review versus 10+ hours manual; revenue **$840.00** ($20/person); API cost **$2.52**.

<p align="center">
<img src="templates/examples/corporate-executive-headshot.jpg" alt="Batch Processed Corporate Headshot" width="320">
</p>

**Compare tools**

| Tool | Automation | Identity consistency | Best for |
|---|---|---|---|
| muapi Batch API + Python | Ultra-High (folder-wide scripts, auto-zip) | High (InstantID vector per employee) | Team contracts of 25-100+ employees |
| InstantID / FLUX PuLID (local) | Medium (manual queue via ComfyUI) | Maximum | Premium executive packages |
| Typeform + Zapier | High (routes intake submissions to a queue) | N/A | Self-serve employee photo upload portals |

**Pricing:** charge **$20 - $25 per additional employee** beyond the base tier (a 35-person team on the $799 Corporate Standard: 25 included + 10 x $20 = **$999**).

**Exercises**

1. Easy: create a CSV roster for 5 hypothetical employees with names, titles and dress codes.
2. Medium: write a Python script to auto-crop 5 selfies to 1:1 centered on face landmarks.
3. Hard: run a batch script generating 5 headshots with a unified studio background.

**Template:** [`templates/b2b-headshot-proposal.md`](templates/b2b-headshot-proposal.md) has batch CSV schemas, folder naming standards and team packaging guides.

**Studios in SmartVideo GO AI:** Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner, Lip-Sync Studio.

Next: Creative Headshots & Stylized Portraits.
