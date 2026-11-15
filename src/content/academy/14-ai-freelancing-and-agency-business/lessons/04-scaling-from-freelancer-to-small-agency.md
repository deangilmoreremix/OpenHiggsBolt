# Scaling from Freelancer to Small Agency

> **Time:** about 15 minutes. **You will finish with:** one written SOP, an operator job post, a team cost check and a 2-tier QC checklist.

---

## Before you start

The lesson describes a Solo Bottleneck at around $8,000 to $10,000 a month (an example figure): your time goes into execution, outbound sales stops, and revenue flatlines because you cannot take client #6 without working 80 hours a week. To grow toward $25,000 to $50,000 a month (example figures, not guarantees) you shift from Prompt Operator to Creative Director and Account Executive, and delegate through written procedures, not verbal Slack instructions.

You will need:

* A project you will run soon, and a screen recorder such as Loom.
* An Upwork or OnlineJobs.ph account, plus Slack and ClickUp.
* About 15 minutes.

## Step by step

### 1. Record your next project

Record your screen with Loom while you execute your next project, speaking your steps aloud.

**You should see:** a video of one full production run.

**If not:** record one repeatable part (for example intake to export) instead of everything.

### 2. Write the SOP header

Every SOP starts with an objective, required tools and estimated time. The lesson's example:

```text
SOP #HS-04: BATCH CORPORATE HEADSHOT GENERATION & UPSCALING
1. OBJECTIVE: Convert client raw selfie CSV roster into 8k studio headshots.
2. TOOLS REQUIRED: ComfyUI Node Graph #v4.2, FLUX 1.1 Pro API, Topaz Gigapixel
3. ESTIMATED TIME: 3 minutes per employee roster entry.
```

Replace the content with your own pipeline.

**You should see:** a numbered header with objective, tools and time.

**If not:** write one sentence for each of the three parts.

### 3. Write the execution steps

Turn the recording into numbered steps. The example sequence:

```text
1. Intake Audit: Open client Google Drive folder 01_Raw_Inputs. Verify image resolution is at least 1080p.
2. Crop & Center: Run Python auto-crop script scratch/crop_headshots.py to center facial bounding box at 1:1 ratio.
3. ComfyUI Ingestion: Load JSON workflow workflows/b2b_headshot_v4.json. Set seed to -1 and LoRA weight to 0.75.
4. Quality Control Check: Inspect rendered output against the 4 Quality Control Criteria.
5. Upscale & Export: Export approved renders into Topaz Gigapixel AI. Upscale 4x to 4500x4500px @ 300 DPI JPEG. Save in 02_Final_Delivery.
```

**You should see:** each step names a folder, file or setting, so a stranger could follow it.

**If not:** add the exact file names or values you used.

### 4. Add the QC criteria

The SOP's four quality criteria are: eye reflection symmetry (no distorted pupils), teeth count and alignment, skin texture preservation (no plastic blur), and background lighting contrast.

**You should see:** four pass/fail checks inside the SOP.

**If not:** rewrite each as something that can be answered yes or no.

### 5. Set up the 2-tier sign-off

Quality control runs: offshore operator (prompt run), then internal QC audit (pass/fail against the SOP), then Creative Director final sign-off, then client proofing (watermarked HD). Write that order in your SOP. Then copy this checklist:

```text
[ ] Facial symmetry and geometry verified.
[ ] Resolution meets 300 DPI print requirement.
[ ] No AI artifacts or distorted hands/fingers.
[ ] Color profile matches client brand guidelines (RGB/CMYK).
```

**You should see:** a checklist attached to the SOP.

**If not:** adapt items to your asset type (video needs motion checks).

### 6. Check the team economics

The lesson's example team (illustrative): an offshore AI prompt operator at $12 to $18/hr, 20 hrs/week, about $1,200/mo; a post-production video editor at $15 to $25/hr, 15 hrs/week, about $1,200/mo; a virtual assistant at $8 to $12/hr, 10 hrs/week, about $400/mo. Total about 45 hrs and $2,800/mo against $20,500/mo of revenue, leaving $17,700 net profit (86%). Compute the same for your own planned hires, aiming for a net margin of 80% or more.

**You should see:** your total monthly cost, revenue and margin percentage.

**If not:** margin = (revenue - cost) / revenue; recheck the division.

### 7. Post the operator job

Post a listing on Upwork or OnlineJobs.ph for an "AI Media Production Operator". Attach your SOP so applicants can see the work.

**You should see:** a live listing referencing your SOP.

**If not:** start with a draft listing and refine it after reading your first applicants.

### 8. Set up your workspace

Create Slack and ClickUp channels: `#sales-leads`, `#active-production`, `#qc-audit`, `#client-delivery`.

**You should see:** four channels matching your pipeline stages.

**If not:** create the channels first and invite people later.

## Check yourself

* [ ] I have one written SOP with objective, tools, time and numbered steps.
* [ ] My QC checklist is pass/fail.
* [ ] I know the margin of my planned team.
* [ ] An operator job listing and the four channels exist.

## Common mistakes

* **Delegating by chat message.** Without written or recorded SOPs, quality drifts.
* **Skipping QC.** Two sign-offs protect your reputation.
* **Hiring before documenting.** Write the SOP first.
* **Treating example rates as fixed.** Rates vary; confirm with real applicants.

## Go further

**Role map.** Creative Director (you) and Account Executive, then AI Prompt Operator ($12 to $18/hr), Video and Audio Editor ($15 to $25/hr) and Client Onboarding and Support virtual assistant ($8 to $12/hr), as example rates.

**Exercise.** Document your first 3 SOPs, one per production stage.

Next: Building a portfolio that sells.
