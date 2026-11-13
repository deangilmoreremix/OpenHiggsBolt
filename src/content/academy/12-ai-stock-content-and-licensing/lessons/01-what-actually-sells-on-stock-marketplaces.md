# What Actually Sells on Stock Marketplaces

> **Time:** about 15 minutes. **You will finish with:** one commercial stock image with copy space, checked for artifacts and ready with 30+ IPTC keywords.

---

## Before you start

Beginners upload thousands of generic AI images (fantasy landscapes, cyber cities, aesthetic portraits) and earn **$0.00 in total royalties**. Buyers such as ad agencies, news editors and corporate design teams want commercial concepts that illustrate a business problem: a handshake on a deal, a solar farm, healthcare workers discussing charts, a data breach. Images with clean copy space (negative space on the left or top 30% of the frame, for headlines and logos) sell 4x more often than cluttered ones. Stock agencies also reject recognizable brand logos (Apple, Nike, BMW), trademarked architecture and copyrighted artwork.

The pipeline is: Commercial Demand Search, Concept Prompting, Quality Audit and Upscale, IPTC Keywording, Marketplace Submission. IPTC (International Press Telecommunications Council) is the industry-standard schema for embedding titles, keywords and copyright fields inside an image file.

You will need: an Adobe Stock Contributor account (or access to its portal), an IPTC editor such as ExifTool or a stock tagger, and **Image Studio** in SmartVideo GO AI. Optionally **Video Studio** for a motion clip.

## Step by step

### 1. Research trending keywords

Open the Adobe Stock Contributor Portal and find the monthly **"Demand Trends Brief"**. Note three commercial search terms that are missing or convert well, for example *"diverse executive handshake modern office"*.

**You should see:** a short list of 3 commercial search terms written down.

**If not:** menus move; follow the current screen, or look for any trends or insights area in the portal.

### 2. Open the metadata template

Open [`templates/stock-metadata-template.md`](templates/stock-metadata-template.md). It holds the metadata tagging schemas, copy space guides and agency submission checklists you will use below.

**You should see:** the template with its tagging schema and copy space guide.

**If not:** check the link path exactly as written, from the lessons folder into `templates/`.

### 3. Generate the image with copy space

In **Image Studio**, paste this prompt:

```text
Photorealistic 8k commercial stock photo of two diverse business executives shaking hands across a glass conference table in a sunlit modern corporate office, copy space on left side for text overlay, shot on 35mm lens, neutral corporate color palette, high resolution.
```

Then add this negative prompt (if your studio has a negative prompt field; otherwise skip it):

```text
brand logos, watermarks, text, cartoon, 3d render, extra fingers, distorted hands, blurry, oversaturated.
```

**You should see:** a handshake image with clean empty space on the left.

**If not:** regenerate, and make the copy space instruction stronger (for example "empty left third of the frame").

### 4. Inspect at 100% zoom

Zoom to 100% and check the key details:

1. **Hand and finger geometry:** exactly 5 fingers per hand, nothing warped.
2. **Eye reflection and catchlights:** pupils round and clear.
3. No brand logos or readable text anywhere.

**You should see:** clean hands and eyes, with no logos.

**If not:** discard the render and generate again. Do not submit a glitchy image.

### 5. Add IPTC metadata

Use an IPTC editor (ExifTool or a stock tagger) to embed a title, categories and **30+ targeted commercial keywords**, for example: agreement, partnership, deal, handshake, business, corporate, executive, meeting, office, teamwork, trust.

**You should see:** the title and 30+ keywords saved in the file's metadata.

**If not:** reopen the file in the editor and confirm the fields saved; some tools need an explicit save or write step.

### 6. Tag it as AI before upload

When you upload to Adobe Stock, check the **"Created using Generative AI tools"** box. Hiding AI origin risks account suspension.

**You should see:** the AI box checked on the upload form.

**If not:** menus move; follow the current screen to find the AI disclosure option before submitting.

## Check yourself

* [ ] I have 3 commercial search terms from a demand source.
* [ ] My image has clean copy space and no logos or text.
* [ ] I checked hands and eyes at 100% zoom.
* [ ] My file carries 30+ IPTC keywords and I will tick the AI box on upload.

## Common mistakes

* Uploading pretty art with no commercial use-case.
* Busy backgrounds with no room for headlines.
* Brand logos, trademarked architecture or copyrighted artwork in the frame.
* Skipping the 100% zoom check on hands and eyes.
* Hiding that the image is AI generated.

## Go further

**Worked example, "Corporate Handshake Concept":**

<p align="center">
<img src="templates/examples/corporate-handshake-stock.jpg" alt="Corporate Handshake Commercial Stock Photo" width="480">
<img src="templates/examples/stock-catalog-motion.gif" alt="Stock Catalog Video Motion (I2V)" width="480">
</p>
<p align="center"><sub>Commercial Stock Photograph (Left) ──► Image-to-Video Stock Motion Clip (Right) · Video File: <a href="templates/examples/stock-catalog-motion.mp4">templates/examples/stock-catalog-motion.mp4</a></sub></p>

* Marketplace: Adobe Stock and Freepik. Category: Business / Finance / Corporate Partnership.
* Metadata: 38 commercial keywords plus a copy space tag.
* Result: 142 licensing downloads in 90 days, **$142.00** from 1 single image render (an example, not a promise).

**Demand pillars:** Business and Corporate (meetings, handshakes, remote calls); Technology and Cyber Security (server rooms, AI cloud, biometrics); Healthcare and Wellness (research, doctor-patient trust, therapy, biotech labs); Green Energy and Sustainability (wind turbines, EV charging, solar panels).

**Compare marketplaces:**

| Stock Marketplace | AI Image Acceptance | Royalty Structure | Best For |
|---|---|---|---|
| **Adobe Stock** | Accepted (requires AI tag) | 33% per download ($0.33 to $9.90+) | Highest revenue per download |
| **Freepik Premium** | Accepted | Pay-per-download pool (~$0.05 to $0.15) | High volume downloads |
| **Shutterstock** | Restricted (in-house AI only) | Varies | Non-AI stock submission |

**Exercises:**

1. Easy: research 3 trending commercial search terms on Adobe Stock.
2. Medium: generate a commercial stock photo featuring copy space for headlines.
3. Hard: tag your image with 30+ commercial IPTC keywords and submit it to a stock contributor portal.

**Template:** [`templates/stock-metadata-template.md`](templates/stock-metadata-template.md) for metadata tagging schemas, copy space guides and agency submission checklists.

**Produce this in SmartVideo GO AI:** Image Studio (anchors, character sheets, product and brand shots), Video Studio (image-to-video motion), AI Influencer Studio (consistent recurring characters), Storyboard / Campaign Planner (batch matrices and briefs), Lip-Sync Studio (voice and mouth-sync). Workflow: Learn, See Example, Use Template, Generate.

Next: Batch-Generating a Licensable Catalog.
