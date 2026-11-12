# Contracts and Scope Basics

> **Time:** about 16 minutes. **You will finish with:** a customised contract draft with the five key clauses, a payment schedule and ready replies to common scope-creep requests.

---

## Before you start

Standard creative contracts assume human labor and slow timelines. With AI work, three gaps appear: clients assume that because AI generates images in seconds they can demand endless variations; clients ask for your prompt libraries, ComfyUI workflows and LoRA weights; and AI copyright is ambiguous (the lesson points to U.S. Copyright Office rulings on AI-generated assets).

Two agreements cover this. The **Master Services Agreement (MSA)** governs the whole relationship (liability caps, confidentiality, payment terms, governing law) and is signed once per client. A **Statement of Work (SOW)** is a project-specific addendum with deliverables, milestone dates, revision limits and fees, signed per project.

The clause wording below is example text from the course, not legal advice. Have a qualified lawyer review your final contract.

You will need:

* `templates/freelance-client-contract.md` from this track.
* A project you might sell, so you can fill in real numbers.
* About 16 minutes.

## Step by step

### 1. Open the contract template

Open `templates/freelance-client-contract.md`. Note where the MSA ends and the SOW begins.

**You should see:** a master agreement section and a per-project statement of work.

**If not:** copy the template into your own document and mark the two parts yourself.

### 2. Add the revision cap clause

Scope creep is the biggest threat to your profit. Add a clause like this one (adjust the numbers to your offer):

```text
Clause 4.2 - Scope of Revisions: The agreed Contract Value includes exactly two (2) rounds of revisions per deliverable. A "Revision" is strictly limited to minor adjustments in color grading, background lighting adjustments, contrast correction, or minor masking fixes. Any request by Client for structural prompt re-engineering, model replacement, pose changes, or fundamental style alterations following sign-off of the initial Brief shall be classified as an Out-of-Scope Change Order, billed at Agency's standard rate of $150.00 per hour.
```

**You should see:** your contract defines what counts as a revision and a change order rate.

**If not:** check the clause names a number of rounds, a list of allowed edits and a rate.

### 3. Set the milestone payment schedule

Never start renders without paid, non-refundable money upfront. Use this structure:

```text
MILESTONE 1: 50% non-refundable deposit upon contract signing. Unlocks compute resources, model selection and initial draft generation.
MILESTONE 2: 25% upon first watermarked draft review. Delivered as low-res watermarked proofs for Client feedback sign-off.
MILESTONE 3: 25% upon final asset handover. Unlocks un-watermarked 8k master files and the commercial usage license.
```

**You should see:** three milestones adding up to 100%.

**If not:** recheck that 50 + 25 + 25 = 100.

### 4. Protect your payment leverage

Add one line to your process: never deliver final un-watermarked master files before 100% payment clears. Send low-resolution watermarked previews before the final milestone.

**You should see:** a written rule about watermarked proofs and release on full payment.

**If not:** add it to the SOW delivery section.

### 5. Add the IP and commercial license clause

```text
Clause 8.1 - Intellectual Property & AI Commercial License: Upon receipt of full payment, Agency grants to Client an exclusive, perpetual, worldwide commercial usage license to use, display, distribute, and monetize the final delivered media assets. Client acknowledges that deliverables utilize state-of-the-art Generative AI models (e.g., FLUX, Runway, ElevenLabs) operating under commercial enterprise tier agreements. Agency warrants that its prompt workflows and post-processing methods do not incorporate confidential third-party trade secrets or trademarked visual assets without authorization.
```

**You should see:** the license starts only after full payment.

**If not:** have your lawyer check the warranty wording matches the tools you really use.

### 6. Reserve your background IP

```text
Clause 8.4 - Agency Background Technology: Agency retains all right, title, and interest in and to its pre-existing tools, proprietary prompt libraries, ComfyUI node graphs, LoRA model weights, workflow scripts, and background automation technology ("Agency Background IP"). Nothing in this Agreement shall be construed as transferring ownership of Agency Background IP to Client.
```

**You should see:** the final outputs go to the client while your workflows stay yours.

**If not:** confirm Clause 8.4 and Clause 8.1 do not contradict each other.

### 7. Add the client input warranty

```text
Clause 9.3 - Client Data & Input Warranty: Client represents and warrants that all logos, brand guidelines, reference images, trademarks, and employee headshots provided to Agency for AI model input do not infringe upon any third-party intellectual property or privacy rights. Client agrees to defend, indemnify, and hold harmless Agency against any claims arising from Client-provided inputs.
```

**You should see:** the client is responsible for the inputs they give you.

**If not:** compare against the template and add the missing wording.

### 8. Save your three scope-creep replies

Keep these ready in a notes file:

```text
Endless variations: We'd love to explore those new variations! As per Clause 4.2 of our SOW, our 2 included revision rounds are complete. I can send over an Out-of-Scope Change Order for $450 to cover 15 additional variations.
```

```text
Workflow source files: Our final 8k deliverables are fully licensed to you upon final payment! However, as outlined in Clause 8.4, our internal ComfyUI node graphs and prompt libraries are proprietary Agency Background IP and are not included in this deliverable.
```

```text
Late payment (Net-60): We completely understand corporate AP cycles! Per our agreement, high-resolution un-watermarked master files are released immediately upon final invoice clearance. Let us know as soon as the wire goes through!
```

**You should see:** three replies that each cite a clause.

**If not:** change the clause numbers to match your own contract.

## Check yourself

* [ ] I can explain the difference between an MSA and an SOW.
* [ ] My contract has a revision cap, a 50/25/25 payment schedule, an IP clause, a background IP clause and an input warranty.
* [ ] I will not release un-watermarked masters before full payment.
* [ ] A lawyer will review the final contract before I use it.

## Common mistakes

* **Vague revision wording.** Define what a revision is and what is a change order.
* **Starting work before the deposit.** Compute and time are spent first, then payment is hard to get.
* **Transferring your workflows by accident.** Separate output licensing from Agency Background IP.
* **Copying clauses without legal review.** The text is an example to adapt.

## Go further

**Exercise.** Take a project you quoted in the pricing lesson and write its SOW: deliverables, milestone dates, revision limit and fee, using the template.

**Reference.** The client metrics dashboard graphic at `templates/examples/client-dashboard-metrics.jpg` shows one way to report results to a client.

Next: Finding and closing clients.
