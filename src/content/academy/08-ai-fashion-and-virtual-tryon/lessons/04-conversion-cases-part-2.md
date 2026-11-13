# Before/After Conversion Cases, part 2

> **Time:** about 10 minutes of setup, plus a 30-day wait. **You will finish with:** a 50/50 A/B listing test running and a plan to judge it on conversion, returns and net margin.

---

## Before you start

Part 1 gave you a return rate and new listing images. Now you prove they work. Apparel tests need about 30 days because returns arrive late, so you must measure both conversion rate (CVR) and return rate, then compare net profit after return shipping. The worked example in Go further went from 28.0% returns to 16.5% with the same approach.

You will need:

* The three body-type images with callouts from part 1.
* [`templates/fashion-cvr-tracker.md`](templates/fashion-cvr-tracker.md) and your store's testing app.
* Optional return-tracking and analytics tools (see Go further).

## Step by step

### 1. Define the two variants

1. **Control (Variant A):** the standard ghost mannequin gallery photos.
2. **Test (Variant B):** the AI model photos with different body types and measurement callouts.

Write both in the tracker's split-test log.

**You should see:** two clearly named variants in your log.

**If not:** change one thing at a time where you can, so results stay readable.

### 2. Start the 50/50 split

Configure your testing app to split incoming traffic **50/50** between A and B, and start the test.

**You should see:** the test marked as running in your testing app.

**If not:** testing apps differ and menus move; follow the current screen, or use your platform's help page.

### 3. Record the start date and baselines

In the tracker, write the start date, baseline CVR and baseline return rate for A.

**You should see:** a dated baseline row.

**If not:** with no data yet, start recording from day one.

### 4. After 30 days, compare results

1. Check CVR and return rate for both variants.
2. Calculate net profit margin after subtracting return shipping costs.

**You should see:** a side-by-side table of A and B.

**If not:** if returns are still arriving, extend a few days before deciding.

### 5. Decide

If Variant B shows fewer returns and more sales, push it live across the entire product category. Otherwise keep A and review your return reasons again.

**You should see:** a written decision in the tracker.

**If not:** if results are mixed, run a second round with a single change.

## Check yourself

* [ ] Variants A and B are written in my split-test log.
* [ ] Traffic is split 50/50.
* [ ] I will wait 30 days before deciding.
* [ ] My decision uses CVR, return rate and net margin together.

## Common mistakes

* **Stopping early.** Returns take time to show.
* **Judging on CVR alone.** A sales lift that raises returns can lose money.
* **Inaccurate size info.** It pushes returns up and ruins the test.

## Go further

**Compare tools**

| Tool | Purpose | Integration | Best for |
|---|---|---|---|
| Loop Returns / Gorgias | Return portal reasons and complaints | High (Shopify links) | Finding sizing objections |
| Google Analytics 4 | Funnel tracking and page drops | Medium | Drop-off during checkout |
| Shopify Flow | Automating customer service tags | Medium | Tagging high-return SKUs |

Use Loop Returns to learn why items come back, and GA4 to watch product page bounce rates.

**Template:** [`templates/fashion-cvr-tracker.md`](templates/fashion-cvr-tracker.md).

**SmartVideo GO AI studios for this track:** Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner, Lip-Sync Studio.
