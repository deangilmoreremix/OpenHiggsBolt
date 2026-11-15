# AI Thumbnail Design

> **Time:** about 15 minutes. **You will finish with:** a 1280 x 720 thumbnail that stays readable at coin size.

---

## Before you start

You can spend 20 hours on a video, but a weak thumbnail kills it. Platforms measure **Click-Through Rate (CTR)**, and under **3%** they stop showing the video to new audiences. Good thumbnails follow three rules: one clear subject with at most **3 words** of text (understood in 3 seconds); high contrast against the feed; and the subject on one third of the frame with text on the opposite third, keeping the bottom-right corner clean for the duration stamp.

You will need an image editor (Canva or Photoshop) and the SmartVideo GO AI **Image Studio**, using `nano-banana-2`. Finish lesson 1 first.

## Step by step

### 1. Generate the background

Pick a prompt pattern from [`templates/thumbnail-prompt-library.md`](templates/thumbnail-prompt-library.md). In Image Studio run `nano-banana-2` with aspect ratio `16:9` (use `1:1` for square feeds). Example prompt:

```text
A modern glowing green digital bar chart floating in a minimalist luxury office.
```

**You should see:** a widescreen image with one clear glowing subject.

**If not:** if it is cluttered, add "minimalist" or simplify the scene and regenerate.

### 2. Set up the canvas

Open your editor, set the canvas to `1280 x 720` pixels, and drop in the image.

**You should see:** the image filling the canvas.

**If not:** scale it up until there are no empty edges.

### 3. Boost contrast and saturation

Apply: **Contrast +15%**, **Saturation +12%**, and a slight Gaussian blur (size 5) on the background to separate the subject.

**You should see:** deeper shadows, brighter colors, and a subject that pops.

**If not:** if the blur softens the subject too, apply it to the background layer only.

### 4. Place the subject and text

Put the main subject on the left or right third and the text on the opposite third. Write at most 3 words (do not repeat your video title). Use an ultra-bold sans-serif such as Archivo Black, in White (`#FFFFFF`) or Yellow (`#FFD700`), with a thick black stroke or drop shadow (width: 12).

**You should see:** a clearly readable phrase facing the subject, with the bottom-right corner empty.

**If not:** if text blends in, thicken the stroke.

### 5. Run the coin-size audit

Zoom the editor out until the thumbnail is about 10% scale, the size of a coin.

**You should see:** you can still read the words and recognize the subject.

**If not:** remove background detail and enlarge the subject, then check again.

### 6. Export

Export the image at 1280 x 720.

**You should see:** a finished thumbnail file.

**If not:** if the file is rejected for size, export at a slightly lower quality setting.

## Check yourself

* [ ] One clear subject, 3 words or fewer.
* [ ] Contrast +15% and saturation +12% applied.
* [ ] Subject and text on opposite thirds, bottom-right clear.
* [ ] Readable at coin size.

## Common mistakes

* Packing in 10 words, several logos, or low-contrast backgrounds.
* Repeating the video title as thumbnail text.
* Putting key details in the bottom-right corner.

## Go further

**Worked example, "Get Rich Automated":** `nano-banana-2` via muapi, prompt "A shining silver key glowing with blue light, unlocking a physical lock." Text "AUTOMATE THIS" in Montserrat Extra-Bold yellow with a thick black outline on the left third; glowing blue lock on the right third; bottom-right left clear. Made with a `16:9` `nano-banana-2` image ($0.06/image), then Python `Pillow` overlaid the text with a black shadow stroke.

**Compare tools:** `nano-banana-2` via muapi is high quality and fast (under 15 seconds) and can be scripted alongside your runs; Midjourney v6 is ultra-high quality but slower, via Discord; local Stable Diffusion needs a strong GPU but is very customizable (ControlNet).

**Launch tips:** The 24-Hour Swap: if CTR is below **3%** after 24 hours, swap in a new thumbnail with a different color scheme instead of deleting the video. Keep a Canva template folder of styled text boxes so designs take under 3 minutes.

**Exercises:** Easy: generate an image and boost contrast 15% and saturation 10%. Medium: design a 1280x720 layout with a subject on the right third and a 2-word text overlay on the left with a thick drop shadow. Hard: audit three competitor thumbnails at small scale and write two readability changes for each.

**Template:** [`templates/thumbnail-prompt-library.md`](templates/thumbnail-prompt-library.md).

Next: Batching & Scheduling at Volume.
