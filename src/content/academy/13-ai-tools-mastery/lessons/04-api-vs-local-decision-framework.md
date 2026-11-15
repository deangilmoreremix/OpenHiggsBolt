# API vs. Local: A Decision Framework

> **Time:** about 15 minutes. **You will finish with:** a monthly API cost, a payback period for a local GPU and a written hosting decision.

---

## Before you start

Buying a $3,500 RTX 4090 workstation for 20 images a week takes years to break even, while 10,000 monthly high-res renders on pay-per-request APIs cost $600+/month. Confidential client assets sent over a public cloud API may also break NDA agreements. Two formulas decide it:

* Monthly Cloud API Cost = Renders per Month x Cost per Render
* Local GPU Amortization Period = GPU Workstation Cost / Monthly Savings vs. API

Cloud APIs (muapi / Replicate) cost $0 upfront and suit low volume ($5-$20/mo); a local GPU (ComfyUI / RTX 4090) costs $1,500 - $4,500 but has $0 marginal cost per render (only electricity) and 100% offline privacy. It also needs Python, VRAM management (VRAM = Video RAM, the dedicated memory on your GPU that holds the AI model during generation) and CUDA drivers (CUDA = NVIDIA's software layer that lets your GPU run AI workloads).

You will need a calculator and the template [`templates/api-cost-calculator.md`](templates/api-cost-calculator.md). Lessons 1-3 give you your render types.

## Step by step

### 1. Open the calculator

Open [`templates/api-cost-calculator.md`](templates/api-cost-calculator.md).

**You should see:** API cost formulas, GPU payback calculators and hardware VRAM decision trees.

**If not:** check the link path as written; the two formulas above are enough to continue.

### 2. Enter your monthly volume

Write down how many renders you make per month and your average cost per render.

**You should see:** two numbers.

**If not:** if you do not know your average cost, use $0.06 as in the examples.

### 3. Calculate the API cost

Multiply renders by cost per render. For reference: Scenario A, 300 renders at $0.06 = **$18/month**. Scenario B, 10,000 renders at $0.06 = **$600/month**.

**You should see:** a monthly API cost in dollars.

**If not:** recheck that both numbers are monthly, not weekly.

### 4. Calculate the payback

Divide the workstation cost by the monthly API cost. Scenario A: a $2,500 machine takes 138 months to break even, so stay on **Cloud APIs (muapi)**. Scenario B: the $2,500 workstation pays for itself in under 4.5 months, so invest in a **Local GPU (RTX 4090)**.

**You should see:** a payback period in months for your numbers.

**If not:** if your monthly savings are near zero, the payback is effectively never; stay on the API.

### 5. Apply the privacy test

If you handle NDA corporate headshots or unreleased product prototypes, enforce **Local GPU Air-Gapped Rendering** regardless of volume.

**You should see:** a yes/no answer on privacy for each client type.

**If not:** if unsure, check the client contract before sending assets to any cloud service.

### 6. Consider the middle ground

Renting cloud GPUs on RunPod at $0.44/hour gives ComfyUI node control without buying hardware.

**You should see:** a note on whether renting fits better than buying.

**If not:** prices change; check the current rate on the provider's page.

### 7. Write your decision

Pick one: Cloud API only, local GPU, rented GPU, or a hybrid. A hybrid uses **Cloud APIs** for rapid mobile client intake and burst processing, and **Local ComfyUI** for heavy offline batch fine-tuning and LoRA training.

**You should see:** a one-paragraph infrastructure plan with the numbers behind it.

**If not:** if the numbers and privacy point different ways, privacy wins for those clients.

## Check yourself

* [ ] I calculated my monthly API cost.
* [ ] I calculated a payback period in months.
* [ ] I checked privacy needs for each client.
* [ ] I wrote down my hosting decision.

## Common mistakes

* Buying hardware early when volume is low.
* Staying on pay-per-request APIs at very high volume.
* Sending NDA assets over a public cloud API.
* Ignoring setup work (Python, VRAM, CUDA drivers) in a local build.

## Go further

**Worked example: "Scale Studio Rebrand."** Output: 6,500 image renders and 200 short video clips per month. Cloud API estimate: $390 image credits + $150 video credits = $540/month. Local build: dual RTX 4090 24GB VRAM rig = $3,800. Payback: $3,800 / $540 = 7.0 months. Outcome: the agency bought the workstation and saved $6,480/year after month 7.

| Hosting option | Flexibility | Scaling speed | Best for |
|---|---|---|---|
| **muapi Cloud API** | High (FLUX, Seedance, InstantID via HTTP) | Instant (no VRAM limits) | Startups, freelancers, mobile app backends |
| **Local ComfyUI** | Unlimited node control | Fixed to GPU VRAM | High-volume agencies, custom LoRA trainers, NDA projects |
| **RunPod / Vast.ai (cloud GPU)** | High (rent a cloud RTX 4090 per hour) | High | Burst processing 5,000 images over a weekend |

Exercises:

1. **Easy:** calculate your monthly API spend with the formula in `api-cost-calculator.md`.
2. **Medium:** rent a cloud GPU on RunPod and launch a ComfyUI web interface.
3. **Hard:** build a hybrid plan combining Cloud API mobile submission with local GPU batch processing.

Templates: [`templates/api-cost-calculator.md`](templates/api-cost-calculator.md) for cost formulas, payback calculators and VRAM decision trees; [`templates/tool-evaluation-framework.md`](templates/tool-evaluation-framework.md) for a 5-point checklist for testing new AI models before production.

Other SmartVideo GO AI studios that use this: Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner, Lip-Sync Studio.
