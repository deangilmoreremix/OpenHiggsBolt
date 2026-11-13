# Case Study Teardown

> **Time:** about 16 minutes. **You will finish with:** a five-layer teardown of one running ad and two reusable structural takeaways.

---

## Before you start

It is easy to produce ads and harder to know which parts of a successful ad actually drove performance. Without a teardown you copy surface style (a trending sound, a creator look) and cannot repeat success for a different product. A teardown splits an ad into the five layers from lesson 1 (script, avatar/voice, video, captions, export) and asks of each, "what choice was made, and why might it matter?". Large, long-running campaigns are good subjects because the surviving ad reflects real performance data.

You will need a platform's public ad library (the example uses the Meta Ads Library, free, no login needed), and `templates/teardown-worksheet.md`. Optionally, a video-understanding model in SmartVideo GO AI (menu name may differ) for a first-pass read.

## Step by step

### 1. Find a long-running ad

Search a brand in your target category in the ad library. Look for an ad that has run for a while, since brands cut losers quickly.

**You should see:** an ad showing a start date weeks back, ideally with several near-identical variants.

**If not:** try another brand in the category. In the worked example, "started running 47 days ago" with 6 variants was the tell.

### 2. Transcribe the script

Write down every spoken line and map it to hook, pitch, proof and CTA.

**You should see:** four labelled parts with timings, like the skincare example: hook (0-2s) "I stopped using retinol after this happened to my skin.", pitch (2-12s), proof (12-22s) with a dated before/after, CTA (22-25s) "Link in bio, 20% off first order".

**If not:** if a part is missing, note it as missing; that is a finding too.

### 3. Explain why the hook works

In one sentence, state what the hook does and why it stops a scroll.

**You should see:** a reason such as "a relatable complaint before the product is named, creating a curiosity gap".

**If not:** ask what a viewer would wonder in the first 3 seconds.

### 4. Note avatar, voice and video

Record tone, apparent age/demographic match to the audience, energy, and how much is talking-head versus b-roll, plus where cuts fall against the script beats.

**You should see:** three or four short notes.

**If not:** rewatch with sound on, then once muted.

### 5. Note the captions

Record timing, emphasis (bold or highlighted keywords) and whether captions sync tightly to speech.

**You should see:** a one-line description of the caption style.

**If not:** if there are no captions, write that down.

### 6. Write 2-3 takeaways

Write them generically, without naming the brand, for example:

```text
A pain-first hook that withholds the product name for the first few seconds, paired with a dated before/after, works well for skincare-category ads — the curiosity gap earns the watch-through.
```

**You should see:** two or three takeaways you could apply to a different product.

**If not:** if a takeaway says "copy this ad", rewrite it as "this kind of hook works for this kind of problem".

### 7. Optional: get an AI first pass

Run a short clip through a video-understanding model (the reference run used `gemini-video-vision`, $0.004/call) with this prompt:

```text
Break this into hook/pitch/proof/CTA, and comment on lip-sync quality and video structure.
```

**You should see:** a draft breakdown in seconds. In the reference run it correctly noticed the clip had no CTA and no b-roll.

**If not:** treat the output as a draft, not a verdict; it can miss brand history and audience context.

### 8. Turn it into an outreach opener

```text
I noticed a running ad in the skincare-serum category using a pain-first hook + dated before/after proof — that structure is why it's still running after 47 days. Here's a sample ad using the same structure for [prospect's product].
```

**You should see:** an opener that shows judgment before any pitch.

**If not:** remove any competitor brand name; describe by category and structure.

## Check yourself

* [ ] I chose an ad that has been running a while.
* [ ] I filled all five layers in the worksheet.
* [ ] My takeaways are generic and reusable.
* [ ] My opener names categories, not brands.

## Common mistakes

* **Copying surface style.** Trending sounds are not structure.
* **Trusting the AI read as final.** It is a draft.
* **Skipping the manual version.** It builds your judgment.
* **Naming the competitor brand in client material.** Describe by category and structure.

## Go further

* **Manual vs AI-assisted:** manual builds judgment and is slower; AI-assisted takes seconds at $0.004/call, good as a check or when doing many teardowns, but can miss context.
* **Why the skincare ad likely works:** the hook never mentions the product, so viewers watch past 3 seconds to find out what happened; the day-count proof is concrete and checkable.
* **Using it in sales:** a short teardown plus sample ad is a stronger opener than a capabilities pitch; offer a "structural analysis + sample ad" as a low-cost or free first deliverable.
* **Exercises:** easy, tear down one ad; medium, three ads in one category and find the shared pattern; hard, apply one takeaway to a new product and note what you borrowed.
* **Template:** `templates/teardown-worksheet.md`.
