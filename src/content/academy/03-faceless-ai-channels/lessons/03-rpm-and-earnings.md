# Honest RPM & Earnings Math

> **Time:** about 17 minutes. **You will finish with:** a filled-in Channel Profitability Calculator showing your cost per video, expected earnings and net monthly profit.

---

## Before you start

Views are vanity; profit margins are sanity. A channel can get 1 million views a month and earn only $50 from AdSense in a low-value niche, while subscriptions of $120 mean it runs at a loss. CPM is what advertisers pay per 1,000 views; RPM is what you receive per 1,000 views after the platform's cut (YouTube takes 45% of long-form ad revenue and 55% of Shorts ad revenue). Long-form videos over 8 minutes allow mid-roll ads and RPMs of $5-$25; Shorts draw from a shared pool at about $0.02-$0.06 RPM. Cost per Video = LLM Script Cost + TTS Audio Cost + Video Generator Credit Cost.

You will need: [`templates/channel-profitability-calculator.md`](templates/channel-profitability-calculator.md), your chosen niche, a list of your monthly subscriptions, and Google Keyword Planner. Your usage records in SmartVideo GO AI and your TTS tool give you real production costs.

## Step by step

### 1. Research CPC bids for your niche

In Google Keyword Planner, type keywords for your niche and read the "Top of Page Bid" range. High bids (for example $5.00+ CPC for "Business Liability Insurance") mean high CPM; low bids (for example $0.10 for "Funny cats") mean low CPM.

**You should see:** a bid range for at least three keywords.

**If not:** menus move; follow the current screen. If Keyword Planner is not available to you, use the advertiser check from lesson 1 as a rougher guide.

### 2. List your monthly operating budget

Open [`templates/channel-profitability-calculator.md`](templates/channel-profitability-calculator.md). List every recurring subscription and API credit package. Keep the stack lean while you start.

**You should see:** a total monthly expense number in the calculator.

**If not:** if you are unsure of a cost, use the last invoice or your account's billing page.

### 3. Calculate production cost per video

For a 60-second video, use your actual consumption. The example figures are: script (LLM) about 0.05 credits, narration (ElevenLabs, about 1,000 characters) about $0.15, video generation (muapi credits, for example Seedance 2) about $0.50, so total cost per video is **$0.70**.

**You should see:** a per-video cost entered in the calculator.

**If not:** if your numbers differ, use yours; the example is only a reference.

### 4. Test a Short against its cost

Check: a Short that costs $0.50 and gets 5,000 views at $0.04 RPM earns 5,000 / 1000 * 0.04 = $0.20, a loss of $0.30. Do the same with your own numbers.

**You should see:** whether one video of yours earns more than it costs from AdSense alone.

**If not:** a loss is normal for Shorts. That is why the next step matters.

### 5. Map views to direct sales

If 0.1% of viewers become email subscribers (1 in 1,000 views) and 2% of subscribers buy a $27 product (1 in 50), every 50,000 views yields one $27 sale plus AdSense. Enter your own conversion assumptions in the calculator.

**You should see:** an estimated number of sales and income from direct conversions.

**If not:** if the result is zero, raise views or conversion assumptions only if you can justify them; do not guess optimistically.

### 6. Compute net monthly profit

Enter views, RPM, direct sales and expenses. Net profit = AdSense + direct sales - expenses.

**You should see:** a single net monthly number, positive or negative.

**If not:** if it is negative, look at the Scenario B example in Go further: fewer views with a funnel beat many views with none.

## Check yourself

* [ ] I know my niche's rough CPC range.
* [ ] I know my cost per video.
* [ ] My calculator includes direct sales, not only AdSense.
* [ ] I know my net monthly profit or loss.

## Common mistakes

* Chasing views in a low-RPM niche.
* Counting Shorts as if they paid long-form RPM.
* Ignoring tool subscriptions and API credits.
* Skipping affiliate disclosures in descriptions.

## Go further

**Worked example.**

<p align="center">
<img src="templates/examples/faceless-finance-niche.jpg" alt="Finance Niche Studio" width="280">
<img src="templates/examples/faceless-finance-clip.gif" alt="Finance Channel Video Motion (I2V)" width="280">
</p>

* Scenario A, gaming Shorts only: 1,000,000 views at $0.04 RPM = $40 AdSense; expenses $75; net -$35.
* Scenario B, SaaS automation Shorts plus funnel: 100,000 views at $0.05 RPM = $5 AdSense; 100 signups leading to 5 sales of a $27 template = $135; expenses $45; net $95.

Even with 10 times fewer views, B is profitable because the niche converts into high-margin digital sales. Video file: [templates/examples/faceless-finance-clip.mp4](templates/examples/faceless-finance-clip.mp4).

**Accounting setup.** Open a separate bank or PayPal account for the channel; route affiliate and product income there and pay API credits from it. Add a disclosure in descriptions: "Disclosure: Some links in this description are affiliate links, meaning I earn a commission at no extra cost to you."

**Compare tools.** Google AdSense Analytics: real-time RPM and country breakdowns, but ad revenue only. Whop/Gumroad dashboards: conversion tracking, gross sales and net payouts after roughly 5-10% fees. Muapi Wallet Log: credit-by-credit usage per generation. Combine all three with Stripe/PayPal payouts in the calculator.

**Exercises.** Easy: compare CPC bids for three Finance keywords and three Humour/Meme keywords. Medium: fill the calculator for 50,000 views, 15 videos a month and one $47 product. Hard: project a move from Shorts-only to 2 long-form videos and 15 Shorts a month and see how RPM changes net profit.

**Template.** [`templates/channel-profitability-calculator.md`](templates/channel-profitability-calculator.md).

Next: Scaling to Multiple Channels.
