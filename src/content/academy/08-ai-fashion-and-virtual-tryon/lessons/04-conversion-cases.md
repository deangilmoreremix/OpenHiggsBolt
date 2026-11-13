# Before/After Conversion Cases

> **Time:** about 15 minutes. **You will finish with:** your return rate calculated, three body-type try-on images made, and a measurement callout added to a listing image.

---

## Before you start

Online apparel stores typically see return rates of **20% to 40%**, mostly from fit errors ("tighter than it looked", "longer than I realised"), and returns destroy margin. Static mannequin shots also convert poorly. Showing the same garment on several body shapes helps: shoppers who see products on models matching their build are **40%** more likely to convert. Pair that with a clear callout of the model's measurements, for example height, build and size worn.

This is part 1 of 2. Here you diagnose and build the assets; in [part 2](04-conversion-cases-part-2.md) you run the 30-day test.

You will need:

* Your store's returns data (or mock data) and [`templates/fashion-cvr-tracker.md`](templates/fashion-cvr-tracker.md).
* The try-on workflow from lesson 1 (Garment Try-on) and a photo editor.
* SmartVideo GO AI **Image Studio** for the try-ons.

## Step by step

### 1. Calculate your return rate

1. Open [`templates/fashion-cvr-tracker.md`](templates/fashion-cvr-tracker.md).
2. Compute return rate: returned units divided by units sold (for example 90 returned of 500 sold is 18%).

**You should see:** a return rate percentage in your tracker.

**If not:** if you have no store data, use the mock numbers from the worked example in Go further.

### 2. Read the return reasons

Read the return reason logs. If over **50%** of returns mention "too small", "too large" or "poor fit", optimize the model listings.

**You should see:** a count of fit-related returns against the 50% threshold.

**If not:** if fit is not the main reason, fix the real reason first; this fix will not help.

### 3. Generate three body-type try-ons

Pick your best-selling garment and, following lesson 1, generate three try-on variations: slim, athletic and curvy.

**You should see:** the same garment on three clearly different body shapes.

**If not:** if the garment changes between images, reuse the same `garment_ref.png` and fitting rate **0.75**.

### 4. Add a measurement callout

In your photo editor add a clean, low-contrast text bar at the bottom of the listing image, in your brand font:

```text
Model is 5'9" (175cm), athletic build, wearing size Small.
```

Use the model's real height, build and size.

**You should see:** a legible bar that does not cover the garment.

**If not:** keep it in the same position on every page, using your lesson 3 layout guidelines.

## Check yourself

* [ ] I calculated a return rate as returned divided by sold.
* [ ] I know whether more than 50% of returns are fit-related.
* [ ] I have three body-type try-on images of one garment.
* [ ] The callout states the true model height, build and size.

## Common mistakes

* **Lying in the overlay.** Listing a model as size Medium when they wear XS raises returns.
* **Optimizing without data.** Check return reasons first.
* **Inconsistent callout placement.** Keep it in the same spot on every page.

## Go further

**Worked example, denim brand.** Baseline: 28% return rate with flat-lay-only photos. Variant B used three models: Model 1 (5'11", slim, size 26), Model 2 (5'8", curvy, size 30), Model 3 (5'6", petite, size 25), with height and waist tags. 30-day results: return rate 28.0% (280 of 1,000 sold) for A versus 16.5% (165 of 1,000) for B; CVR up 38% (1.8% to 2.5%); $4,600 saved in return shipping and net revenue up $7,000 in one month.

![Denim measurements](templates/examples/denim-model-measurements.jpg)

Motion: [templates/examples/denim-model-clip.mp4](templates/examples/denim-model-clip.mp4)

**Exercises**

1. Easy: a listing sold 500 units and 90 were returned; calculate the return rate.
2. Medium: complete the CVR and return log in the tracker with mock data.
3. Hard: design a dress main gallery image with a model, a sizing callout at the bottom inside safety margins, and export mobile-ready WebP.

**Template:** [`templates/fashion-cvr-tracker.md`](templates/fashion-cvr-tracker.md).

**SmartVideo GO AI studios for this track:** Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner (test plans), Lip-Sync Studio.

Next: Before/After Conversion Cases, part 2.
