# Pricing & Selling Tools You Build With Agents

> **Time:** about 14 minutes. **You will finish with:** a calculated price and a written product page ready to publish.

---

## Before you start

Many creators undercharge or give their tool away free. They post it on GitHub, get 200 stars and make $0. Others price by gut feel ("$5, it's just a script"). Buyers pay for **time saved**, not code complexity. A single well-scoped tool can bring **$500 to $3,000 in the first 30 days** from an audience of a few thousand. The pricing formula is:

Tool Price = Hours Saved Per Month x Buyer's Hourly Rate x 0.10

In plain English: price at roughly **10% of the monthly value** the tool saves. If it saves an Etsy seller 8 hours a month at $25/hour, that is $200/month of value, so charge **$20 one-time** (or $9/month if you have ongoing API costs).

You will need: a finished tool zip from lesson 3 (or a tool idea), and about 14 minutes. Prerequisites: lessons 2 and 3. Part 2 covers the platform setup and launch.

## Step by step

### 1. Calculate your price

Plug your own numbers into the formula above. Write down hours saved per month, the buyer's hourly rate and the result.

**You should see:** one number, for example 8 x $25 x 0.10 = $20.

**If not:** if you do not know the hours saved, time the manual task once and multiply by how often the buyer does it.

### 2. Choose a pricing model

Pick one:

1. **One-time lifetime license** (most popular for scripts): single payment, no server costs. Converts at 3-5x the rate of subscriptions for audiences under 10,000 followers.
2. **Monthly subscription** (for tools with API costs): pass your GPT-4 or muapi costs through with a $9-$29/month plan. LemonSqueezy handles subscription billing.
3. **Pay-what-you-want with a minimum:** a floor of $9 with a suggested price of $25; Gumroad supports this natively.

**You should see:** one model chosen that matches whether your tool costs you money on every run.

**If not:** if it calls a paid API on each run, choose the subscription.

### 3. Write the headline and the pain

Open [`templates/micro-tool-product-page.md`](templates/micro-tool-product-page.md). Lead with the outcome, not the tool name. Write 5 headline variations and keep the strongest. Example:

```text
Generate 30 IPTC Keywords for Every Stock Photo in 4 Minutes
```

Not "Stock Metadata CSV Script v1.2". Then one sentence of pain:

```text
Manually tagging 100 stock images takes 25+ hours. This tool does it in 4 minutes.
```

**You should see:** a headline that states a result and a single pain sentence.

**If not:** if the headline names the file or version, rewrite it around the time saved.

### 4. Add contents, audience and price anchor

Fill in the remaining sections:

* **What's included:** every file in the zip (script, README, sample input, requirements.txt).
* **Who it's for:** the exact buyer, for example *"Adobe Stock and Freepik contributors who upload 50+ images per batch"*.
* **Price anchor:** show the manual cost, for example:

```text
25 hours of manual tagging @ $15/hr = $375 in your time. This tool: $39 one-time.
```

**You should see:** a full page draft with five parts: headline, pain, contents, audience, price anchor.

**If not:** if the price anchor feels invented, use your own timed numbers from step 1.

## Check yourself

* [ ] I calculated a price with the formula using my own numbers.
* [ ] I chose a pricing model that fits my API costs.
* [ ] My headline leads with an outcome.
* [ ] My page names the exact buyer and anchors the price against manual time.

## Common mistakes

* **Pricing by code size.** Price by time saved.
* **Naming the tool in the headline.** Name the result.
* **A subscription for a free-to-run script.** Buyers prefer one-time for tools with no running costs.
* **Skipping the price anchor.** Without it, $39 looks arbitrary.

## Go further

**Worked example: Etsy SEO Title Generator, 30 days.** Price $29 one-time. Channel 1: posts in 3 Etsy POD Facebook groups (8,500 combined members) gave 23 sales in 48 hours = **$667**. Channel 2: a mid-size Etsy newsletter (4,200 subscribers, affiliate at 30%) gave 41 referral sales x $29 x 70% = **$833 net**. Organic weeks 3-4: 18 sales = **$522**. Total **$2,022** for 6.5 hours of build and marketing, an effective **$311/hour**.

**Exercises**

1. **Easy:** Fill in the product page template for a tool you built or plan to build; write 5 headlines and pick the strongest.
2. **Medium:** Calculate the price for a tool that saves a stock photographer 6 hours per batch upload session at $20/hour.
3. **Hard:** Launch a tool on Gumroad at a real price, post in one creator community and report your first-week results.

**Templates:** [`templates/micro-tool-product-page.md`](templates/micro-tool-product-page.md) for product page copy, pricing frameworks and affiliate setup guides.

**Produce this in SmartVideo GO AI:** Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner and Lip-Sync Studio can make the screenshots, demo clips and ad creative for your page.

Next: Pricing & Selling Tools You Build With Agents, part 2.
