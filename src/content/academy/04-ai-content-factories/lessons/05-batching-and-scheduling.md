# Batching & Scheduling at Volume

> **Time:** about 15 minutes. **You will finish with:** a filled-in 30-day release calendar and a batch plan that runs one station at a time.

---

## Before you start

Algorithms reward **consistency**: a channel posting once a day at the same hour beats one that posts five videos in a day and then vanishes. The answer is to separate production from publishing and build a 30-day queue: Batch Production Week, 30 Scheduled Videos, Daily Auto-Release. You batch one station at a time, schedule in native platform tools, and can repurpose long videos with clipping tools such as [`ai-clipping-generator`](https://github.com/Anil-matcha/awesome-generative-ai-apps/tree/main/video_generation/ai-clipping-generator).

You will need the pipeline from lesson 1 and a list of sub-topics. This lesson plans the batch and schedule; the full 30-video run takes about 15 hours, so you do the production in your own sessions. SmartVideo GO AI's **Storyboard / Campaign Planner** can hold batch matrices and briefs.

## Step by step

### 1. Set your release calendar

Open [`templates/30-day-production-calendar.md`](templates/30-day-production-calendar.md) and mark your upload frequency (for example 1 post per day at 12:00 PM).

**You should see:** a calendar with one release slot per day.

**If not:** if one daily post is too much, choose a frequency you can sustain; consistency matters more than volume.

### 2. Plan the scripting batch (Days 1-5)

List 30 scripts grouped by sub-topic, for example 10 on Invoice Parsing, 10 on Lead Generation and 10 on Database Syncing.

**You should see:** 30 numbered topics in three groups.

**If not:** if you run short, add angles to the strongest group.

### 3. Plan voice and visuals (Days 6-12)

Write the naming rule: audio files named `01.mp3` to `30.mp3`, trimmed of pauses (Days 6-8). For visuals (Days 9-12), write one uniform prompt format to keep a consistent style across all 30.

**You should see:** a naming rule and one reusable prompt pattern in your plan.

**If not:** if styles vary, tighten the prompt format before generating.

### 4. Plan assembly and export (Days 13-17)

Note one master project file that imports all audio and visual folders, then edit and export all 30 files in bulk.

**You should see:** a dated block for editing in the calendar.

**If not:** do not start editing until scripts, voices and visuals are all locked.

### 5. Plan native scheduling (Days 18-20)

Add the upload block: YouTube Studio Web, TikTok Studio Web and Instagram Creator Studio, with optimized titles and descriptions and a Schedule date and time per video (Day 1 at 12:00 PM, Day 2 at 12:00 PM, and so on).

**You should see:** every day of the month has a scheduled slot.

**If not:** menus move; follow the current screen in each studio.

### 6. Choose your release hour

Check your analytics ("When your viewers are on YouTube") for peak time. Schedule **2 hours before** the peak. If you cross-post, stagger platforms (YouTube 12:00 PM, TikTok 12:30 PM, Reels 1:00 PM).

**You should see:** one release time per platform in your calendar.

**If not:** with no analytics yet, start with 12:00 PM and adjust after a few weeks.

## Check yourself

* [ ] My calendar shows a release slot every day for 30 days.
* [ ] Each station (scripts, voice, visuals, edit, schedule) has its own block of days.
* [ ] Files use a sequential naming rule.
* [ ] Cross-posts are staggered, not simultaneous.

## Common mistakes

* Editing a video before all scripts and voiceovers are locked.
* Posting in bursts and then going silent.
* Posting to every platform at exactly the same minute.

## Go further

**Worked example, 30-Shorts run (15 hours):** scripting 30 scripts in Claude, **3 hours**; audio 30 ElevenLabs generations, **1 hour**; visuals 150 image prompts via muapi, **4 hours**; editing in CapCut, **5 hours**; scheduling across YT Shorts, TikTok and Reels, **2 hours**. Result: **90 posts** (30 videos on 3 platforms) from **15 hours** of work.

**Compare tools:** native web studios (high bulk capability, free, reliable, precise hours); Buffer / Later (medium, some API upload limits, better for brand updates); clipping automation `ai-clipping-generator` (fast clip extraction from long videos). Prefer native schedulers for high-traffic channels.

**Exercises:** Easy: fill a 7-day schedule. Medium: write 5 scripts, generate 5 audio files and trim them in one session, logging your time. Hard: feed a 10-minute video to `ai-clipping-generator`, extract 5 clips and schedule them daily on a test channel.

**Template:** [`templates/30-day-production-calendar.md`](templates/30-day-production-calendar.md).

Next: Selling Content-Factory Output as a Service.
