# How AI UGC Actually Works

> **Time:** about 18 minutes. **You will finish with:** a 30-second UGC script, three voice takes and a first talking-head clip of your avatar.

---

## Before you start

Brands pay real creators $200-$1,500 per UGC-style ad because it looks like a person talking to camera, not a commercial. Humans are slow to brief and cannot scale to 20 variants on short notice. An AI UGC ad is five stages, each swappable: **Script → Avatar/Voice → Video → Captions → Export**. The weak link is usually the avatar's face and voice sync, not the script. This part covers the first three stages; part 2 covers b-roll, captions, export and the ship check.

You will need a product you know well (a real or made-up one), a quiet minute to read aloud, and these SmartVideo GO AI studios: **Image Studio**, **Video Studio**, **Lip-Sync Studio** and **AI Influencer Studio** (exact menu names may differ on your screen). Open `templates/ugc-script-template.md` to fill in as you go.

## Step by step

### 1. Pick your product and write the hook

1. Choose one product and name one specific surprise or problem it solves.
2. Write the hook, the first 2 seconds: a question, a bold claim or a visual surprise.

Example hook for a $28 magnetic phone car mount ("GripMount"):

```text
Okay, I did not expect this to actually hold my phone through a pothole.
```

**You should see:** one specific, spoken-sounding line, not "this product is great".

**If not:** replace any generic praise with a concrete moment (a pothole, a failed old product, a number).

### 2. Write the pitch and proof

1. Pitch (10-15 seconds): name the competing product's failure, as a real person would.
2. Proof or demo (10-15 seconds): add a visual action and a concrete number, like "two weeks, potholes included".

**You should see:** a pitch that names a real pain, and a proof line containing a number or a demo action.

**If not:** if it sounds like copy ("Introducing the revolutionary..."), rewrite it the way you would tell a friend.

### 3. Add the call to action and check the length

1. Write the CTA (last 2-3 seconds): state the price plainly, one action, urgency tied to a real use ("before your next road trip").
2. Count your words. Keep the full script under 30 seconds spoken, about 75-90 words.

Here is the full GripMount script (~28 seconds) for comparison:

```text
Okay, I did not expect this to actually hold my phone through a pothole. [holds up phone, taps mount] I used to have one of those suction ones that fell off literally every drive — this one's magnetic, snaps on in like two seconds. [demo: slaps phone onto mount] It's held through every drive for the last two weeks, potholes included. It's $28, link's below — honestly just get it before your next road trip.
```

**You should see:** a script of roughly 75-90 words with all four parts: hook, pitch, proof, CTA.

**If not:** too long means cut the pitch first; keep the demo moment, because it gives the avatar something to do with its hands.

### 4. Read it aloud

Read the script out loud once, at normal speed.

**You should see:** nothing you would be embarrassed to say to a friend.

**If not:** rewrite every line where you stumble or sound like an announcer. Fix it before producing anything.

### 5. Generate three voice takes

1. In the Audio or Lip-Sync area of SmartVideo GO AI, turn your script into narration with a text-to-speech or voice option. Match tone to the product (energetic for a gadget, calm for skincare).
2. Generate 2-3 versions, varying pacing and which word is stressed in the hook line.

**You should see:** three takes that read differently, one noticeably less "read off a page".

**If not:** if all three sound alike, change the pacing instruction or the stressed word, not the script. Also check the voice's accent and demographic fit your product's likely audience.

### 6. Pick your avatar

1. In **Image Studio** or **AI Influencer Studio**, generate or choose a front-facing character (high resolution, neutral lighting). If you already built an anchor, reuse it.
2. Save it. You will lock its face properly in the next lesson.

**You should see:** one clear, front-facing character image ready to animate.

**If not:** regenerate until the face is sharp and neutral; blurry or side-on anchors animate badly.

### 7. Animate the avatar

Choose one path in **Video Studio** or **Lip-Sync Studio**:

1. Generate a talking-head clip directly from the script and voice, or
2. Animate your still image with lip-sync driven by your chosen audio take.

Use your hook line as the first test:

```text
The woman in the image looks at the camera, surprised, and says: "Okay, I did not expect this to actually hold my phone through a pothole." She holds up a phone and taps a mount.
```

**You should see:** a short clip where the mouth moves with the line. Lip movement that is decent but not perfect is normal at this stage.

**If not:** if the mouth is clearly off, try the other path (direct generation vs. lip-sync on your own audio).

### 8. Save your first pass

Download or save the clip and the script together, and note which voice take you chose.

**You should see:** a clip, a script and a voice choice stored in one place.

**If not:** generated files can expire (one provider's outputs expired after 30 days), so download anything you want to keep right away.

## Check yourself

* [ ] My script has hook, pitch, proof and CTA, and is under 30 seconds.
* [ ] I read it aloud and it sounds like speech.
* [ ] I compared at least 2-3 voice takes.
* [ ] I have one animated talking-head clip of my avatar.

## Common mistakes

* **Writing the pitch like ad copy.** Read it aloud; if you would not say it to a friend, rewrite it.
* **Stopping at the first voice take.** The stressed word changes whether the hook reads surprised or casual.
* **A generic hook.** Specific claims beat "this product is great".
* **Skipping the demo moment.** A hand action gives the avatar something to do.

## Go further

* **Worked example, mapped:** hook = a surprised, specific claim; pitch = names the suction mount's failure; proof = slapping the phone on plus "two weeks, potholes included"; CTA = price, one action, road-trip urgency.
* **Reference pipeline (one real run):** nano-banana-2 portrait ($0.06/image) → uploaded via muapi's `upload_file` → seedance-2-image-to-video-fast ($0.75/clip) with the dialogue in the prompt, so no separate lip-sync pass. Total $0.81. These models are examples, not fixed recommendations.
* **Which model for which stage:** Voice: Gemini TTS or ElevenLabs text-to-dialogue. Avatar/video: Seedance 2.x or Kling 3.0. Lip-sync of separate narration: a dedicated lip-sync model or a Kling avatar model.
* **Paths compared:** managed API (low setup, high consistency, best for client work); paid all-in-one UGC tools (GUI, often subscription, varies); local ComfyUI with models such as LTX 2.3 (free per generation but expect a weekend of tuning; worth it at dozens of ads a month or for privacy-sensitive clients).
* **Exercises:** easy, write three 30-second scripts for a product you use; medium, produce one full ad end to end; hard, produce 5 variants with different hooks and predict the winner.
* **Template:** `templates/ugc-script-template.md` and `templates/ad-brief-checklist.md`.

Next: How AI UGC Actually Works, part 2.
