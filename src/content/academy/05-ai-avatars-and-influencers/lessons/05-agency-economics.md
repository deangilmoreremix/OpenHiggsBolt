# Agency Case Study: Small-Team Economics

> **Time:** about 18 minutes. **You will finish with:** a customised agency agreement, a pitch for one niche and a weekly batch plan with a monthly profit estimate.

---

## Before you start

Launching your own virtual influencer means a roughly 6-month ramp-up with zero cash flow while subscriptions and API bills keep arriving. A faster route is a **Virtual Influencer Agency (VIA)**: you build, manage and animate virtual spokespeople for existing clients (SaaS startups, law firms, accounting practices) who are too busy or camera-shy to record. The model rests on a management retainer:

```
Client Retainer ($2,000/mo)  ──►  Upfront Invoice settled  ──►  Agency delivers 15 Videos/mo
```

Industry-standard IP separation: the **agency owns the engine files** (prompt guides, model seeds, voice clone credentials) and the **client owns distribution rights to the finished video exports**. You need: the [agency agreement template](templates/influencer-agency-agreement.md), skills from lessons 1-4, and the SmartVideo GO AI **AI Influencer Studio**, **Lip-Sync Studio** and **Storyboard / Campaign Planner**.

## Step by step

### 1. Customise your service contract

Open [`templates/influencer-agency-agreement.md`](templates/influencer-agency-agreement.md). Set the monthly fee (**$1,500-$2,500/month** is standard for micro-agencies) and volume (typically 15 vertical clips per month). State the IP split: you keep engine files, the client gets video distribution rights.

**You should see:** an agreement with fee, volume, payment schedule and ownership rules filled in.

**If not:** this is a business document; have it reviewed by a professional before real use.

### 2. Add approval and re-render terms

Write in two rules: once a script is approved it cannot be modified (a **lock-in milestone**), and a post-approval script change costs a flat **$50 re-render fee** per video.

**You should see:** both rules in the agreement.

**If not:** if a client resists, explain that re-renders cost you API credits and edit time.

### 3. Pick a niche and write the pitch

Choose one: bookkeeping/accounting (tax write-offs), recruiting (interview tips) or local real estate (buying guides). Write one paragraph stressing that they do not need to show their face or record audio.

**You should see:** a one-paragraph pitch aimed at a single niche.

**If not:** if it is generic, name a specific video topic from the niche.

### 4. Plan the character briefing

Agree on age, look, style and voice with the client, for example: "professional HR advisor in her 30s, warm and clear voice." Record it in the [character style guide](templates/character-style-guide.md) as your seed guidelines.

**You should see:** a one-page brief the client can approve.

**If not:** if the client cannot decide, show two or three options from **Image Studio**.

### 5. Design the weekly batch station

Plan 4 videos every Friday: (1) write scripts and get approval by email; (2) batch-generate cloned voice audio; (3) run the static avatar and voice tracks through `/sync-lipsync`; (4) trim, subtitle and color-grade.

**You should see:** a weekly checklist with those four stages.

**If not:** if the week overruns, reduce scope before dropping approval.

### 6. Set up delivery

Upload finished files to the client's shared folder and send: "Batch 2 is ready in your folder. Let us know if you need any adjustments by Monday." Send invoices via Stripe and approve scripts by simple email.

**You should see:** a folder structure and a message template ready to use.

**If not:** keep communication simple; avoid inviting clients into complex project spaces.

### 7. Project your monthly profit

Fill a P&L using the worked example's numbers below, then replace them with your own.

**You should see:** a total for income, costs and net profit.

**If not:** double-check that you multiplied API cost by the number of videos.

## Check yourself

* [ ] My agreement states fee, volume and the IP split.
* [ ] I added a lock-in milestone and a $50 re-render fee.
* [ ] I have a niche-specific pitch.
* [ ] I have a weekly batch routine and a P&L.

## Common mistakes

* Letting clients change scripts after approval for free.
* Giving the client the engine files (prompts, seeds, voice credentials).
* Over-complicating communication with chat tools and project boards.
* Promising full-time income without costing time.

## Go further

**Worked example, "HireFast" (recruiting SaaS) with virtual HR consultant "Maya":** $2,000/month retainer for 15 vertical tips (such as "how to write a resume"). P&L: retainer **$2,000.00**; API 15 videos x $0.70 = **$10.50**; ElevenLabs + CapCut Pro **$45.00**; net **$1,944.50/month** (97% margin); about 5 hours per month. One editor could manage up to 4 clients ($8,000/month gross).

**Compare tools:**

| Tool | Role |
|---|---|
| Stripe Invoicing | Reliable recurring card charges; professional billing terms |
| Google Drive / Dropbox | Folder sharing for large video files and raw client assets |
| ClickUp / Slack | Task assignment and milestones for complex multi-client operations |

For small agencies: Stripe for invoices, email for approvals, a shared Drive folder for files.

**Exercises:**

1. Easy: fill out the agreement with a mock client and set character ownership rules.
2. Medium: research three local business niches and write a pitch for one.
3. Hard: project the monthly P&L for an agency with 3 client avatars, including all subscriptions and API credits, at 15 videos/month each.

**Template:** [`templates/influencer-agency-agreement.md`](templates/influencer-agency-agreement.md).
