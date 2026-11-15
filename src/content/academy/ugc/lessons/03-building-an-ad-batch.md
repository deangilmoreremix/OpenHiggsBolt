# Building a 10-Ad Batch

> **Time:** about 17 minutes. **You will finish with:** a filled batch matrix of 5-10 ads and a labelled test plan a client could read.

---

## Before you start

A single ad is a gamble on one hook and one angle. Brands that run paid social test variants and keep the winner, so the real service is "10 variants I can test", not "an ad". A batch is one product varied along a small number of axes: **hook** (the first 2 seconds), **angle** (price, convenience, social proof, novelty) and **format** (different avatar, voice or b-roll). If every axis changes at once you cannot tell why an ad won, so vary one or two and hold the rest constant.

You will need your script from lesson 1, your consistent character from lesson 2, and these studios: **Storyboard / Campaign Planner** for the matrix, **Video Studio** and **Lip-Sync Studio** for production. Open `templates/batch-matrix-template.md`.

## Step by step

### 1. Lock the constants

Write down what never changes in the batch: product, core proof point, CTA and demo.

**You should see:** three or four fixed items at the top of your matrix.

**If not:** if you cannot name the constants, the batch will not be readable later.

### 2. Write 3-4 hook variants

Use the script template from lesson 1. Each hook tests a different opening: question, bold claim, before/after or problem-first. For the GripMount mount:

```text
1. I did not expect this to hold through a pothole.
2. My old mount fell off literally every drive.
3. POV: you're driving and your phone doesn't fall for once.
4. This $28 thing fixed a problem I didn't know had a fix.
5. Two weeks, every pothole, still holding.
```

**You should see:** three to five hooks that open differently but sell the same product.

**If not:** if two hooks sound alike, replace one with a different opening type.

### 3. Pair hooks with 2-3 angles

Angles: price, convenience, social proof, durability/surprise, problem-first, POV, proof-first. Do not produce every permutation: 4 hooks x 3 angles is not 12 ads.

**You should see:** a matrix of the 8-10 most promising combinations.

**If not:** drop the combinations you would not be proud to deliver.

### 4. Fill the batch matrix

For each ad record number, hook, angle and the constant ("same product demo, same CTA").

**You should see:** a table in the style of the GripMount example: five ads, each with a single labelled variable.

**If not:** if an ad changes more than hook and angle, split it into two rows or fix one of the changes.

### 5. Produce ad 1 and check the character

In **Video Studio**, animate your anchor with ad 1's script. Compare the face with the anchor.

**You should see:** the same creator as in lesson 2, performing hook 1.

**If not:** return to lesson 2 and re-check that the reference image is being used.

### 6. Batch-produce the rest

Reuse the same uploaded anchor image for every clip and change only the dialogue line in the prompt (about $0.75 per clip in the reference run).

```text
The woman in the image looks at the camera and says: "My old mount fell off literally every drive." She holds up a phone and slaps it onto a magnetic mount.
```

**You should see:** the same creator and product in each clip, with only the opening line changed.

**If not:** if a clip drifts, regenerate just that one rather than the batch.

### 7. Label each ad and write the test plan

Tag each file with the one thing it varies, for example "Ad 2 = problem-first hook". Add a short plan: how long to run, which metric to read first.

**You should see:** every file labelled, and a plan that says to check hook rate first.

**If not:** if a label says "different in several ways", it breaks the test; remake it.

## Check yourself

* [ ] My constants (product, proof, CTA, demo) are identical in every ad.
* [ ] I produced 5-10 combinations, not every permutation.
* [ ] The same character appears in all clips.
* [ ] Each ad is labelled by the single axis it varies.

## Common mistakes

* **Varying everything at once.** Results become unreadable.
* **Producing every permutation.** Pick the most promising 8-10.
* **Changing the character between ads.** Unless the brief asks for multiple creator types.
* **Delivering without labels.** The media buyer cannot trace results to decisions.

## Go further

* **Reading the test:** check hook rate (percent watching past the first 2-3 seconds) first; a weak hook rate is dead whatever the CPA. Compare cost per result (CPA/ROAS) only across ads with a decent hook rate; low CPA on tiny spend is noise. Rule of thumb: a few thousand impressions per variant, roughly 3-4 days at a modest daily budget, before calling a winner.
* **Tools compared:** managed API (fast, script repeated calls; default for client work); GUI-based paid UGC tools (usually one at a time); local ComfyUI queues (fast once set up, worth it only at high recurring volume).
* **How to price it:** per batch, for example $150-$300 for a 5-8 ad test batch, with revisions included.
* **How to position it:** sell the testing capability ("8 variants to find your winner"), and mention faster turnaround than sourcing several human creators.
* **Real numbers:** agency UGC retainers of $1,500-$3,000/month typically buy ongoing batch production like this.
* **Exercises:** easy, plan a 6-ad matrix (3 hooks x 2 angles); medium, produce 5 ads; hard, produce 10 and write a one-page test plan.
* **Template:** `templates/batch-matrix-template.md`.

Next: Pricing & Selling UGC Ads as a Service.
