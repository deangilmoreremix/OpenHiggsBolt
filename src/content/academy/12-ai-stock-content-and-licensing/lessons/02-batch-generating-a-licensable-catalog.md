# Batch-Generating a Licensable Catalog

> **Time:** about 18 minutes. **You will finish with:** a batch of 20 upscaled stock images with a metadata.csv, ready for FTP upload.

---

## Before you start

Stock licensing is a volume numbers game. Earning $500 to $2,000+ per month in passive royalties takes a portfolio of **500 to 2,000+ high-quality commercial assets**. Doing each image by hand (generate, upscale, keyword, upload) takes about 15 minutes per image, so 500 images would take over 125 hours. A batch pipeline removes that: Batch Prompt Matrix, Automated Generation, 4x Upscale, Auto-CSV Metadata Tagging, FTP Batch Upload.

The three pillars: batch API generation (calling `/nano-banana-2` from a Python script, 50 images per run), bulk AI upscaling from raw 1024px to **4000px+ (12+ Megapixels)** as agencies require, and CSV metadata files (`filename, title, keywords, category`) that Adobe Stock and Freepik accept, so you skip manual text entry.

You will need: lesson 1 finished, a working generation script (or **Image Studio** in SmartVideo GO AI for generation), an AI upscaler, an Adobe Stock Contributor account with FTP details from the portal (never paste passwords into chat), and [`templates/stock-metadata-template.md`](templates/stock-metadata-template.md).

## Step by step

### 1. Open the template and define the matrix

Open [`templates/stock-metadata-template.md`](templates/stock-metadata-template.md) for the batch CSV schemas, keyword libraries and FTP guides. Then write down this prompt pattern:

```text
Photorealistic 8k commercial stock photo of [TECH_CONCEPT], blue fiber optic illumination, clean high-tech server room background, widescreen 16:9, copy space.
```

**You should see:** a prompt with one `[TECH_CONCEPT]` placeholder.

**If not:** copy the prompt again exactly, including the square brackets.

### 2. Fill the placeholder list

Substitute `[TECH_CONCEPT]` with each of: `AI cloud data server`, `biometric facial scanner`, `cyber security firewall node`, `quantum computer processor`. That gives 4 concepts to repeat across the batch.

**You should see:** 4 finished prompts, one per concept.

**If not:** make sure each prompt keeps "copy space" and "no logos" style framing from lesson 1.

### 3. Run the batch generation

Run your generation script (calling `/nano-banana-2`) to output 20 high-res stock images into an `output_raw/` directory. You can also generate the same prompts one by one in **Image Studio**.

**You should see:** 20 image files in `output_raw/`.

**If not:** check your script's prompt list and output folder path; run a single prompt first to find the problem.

### 4. Upscale the batch

Pass all images through an AI upscaler to reach 4000px+ resolution (12+ Megapixels).

**You should see:** each file measuring 4000px or more on the long edge.

**If not:** re-run the upscaler on the files that stayed small; agencies reject low-resolution files.

### 5. Inspect and filter

Open each upscaled image at 100% zoom. Delete any render with visual glitches, noise artifacts or hand distortions. Aim to keep your approval rate above 80% on Adobe Stock.

**You should see:** only clean images left in your upload folder.

**If not:** when more than a fifth fail, adjust the prompt and regenerate rather than keeping weak images.

### 6. Build metadata.csv

Create a `metadata.csv` with the columns `filename, title, keywords, category`, with a title and 30 keywords for each file.

**You should see:** one CSV row per surviving image, each with about 30 keywords.

**If not:** compare your columns with the CSV schema in the template and check that no filename is misspelled.

### 7. Upload via FTP

Upload the batch and the CSV via FTP to the Adobe Stock Contributor Portal using the FTP details the portal gives you. Enter credentials only in your FTP client, never in chat. Tick the "Created using Generative AI tools" option when the portal asks.

**You should see:** your files appearing in the portal's pending uploads.

**If not:** menus move; follow the current screen and recheck the FTP host and login in the portal.

## Check yourself

* [ ] I wrote a prompt matrix with 4 tech concepts.
* [ ] I have 20 raw images in `output_raw/` and upscaled copies at 4000px+.
* [ ] I filtered glitchy renders at 100% zoom.
* [ ] My metadata.csv has title, 30 keywords and category per file.
* [ ] I uploaded through FTP and marked the batch as AI generated.

## Common mistakes

* Uploading raw 1024px images that agencies will reject.
* Skipping the 100% zoom noise check and dropping below an 80% acceptance rate.
* Typing metadata by hand instead of using a CSV.
* Pasting FTP passwords into chats or scripts you share.

## Go further

**Worked example, "Cyber Security and Tech Collection":**

<p align="center">
<img src="templates/examples/future-technology-stock.jpg" alt="Future Technology Commercial Stock Photo" width="480">
</p>
<p align="center"><sub>Commercial High-Tech Stock Photograph (Batch Catalog Asset)</sub></p>

* 100 high-tech commercial images generated, 45 minutes of automated execution.
* 88 approved on Adobe Stock (88% acceptance).
* 215 downloads generating **$236.50/month** in recurring royalties (an example, not a promise).

**Compare tools:**

| Platform / Tool | Batch Automation | Output Quality | Best For |
|---|---|---|---|
| **muapi `/nano-banana-2` + Python** | Ultra-High (50 images per API script run) | High (prompt-controlled commercial framing) | Bulk catalog generation for business, tech and healthcare niches |
| **Adobe Firefly (Batch Credits)** | Medium (Web UI batch mode, up to 10 at once) | Very High (native Adobe Stock compatibility) | Direct submission to Adobe Stock contributor portal |
| **FLUX Local (ComfyUI Queue)** | High (unlimited offline rendering) | High | High-volume creators with a local GPU who want zero API credit costs |

**Exercises:**

1. Easy: create a CSV metadata template mapping titles and keywords for 5 stock photos.
2. Medium: batch generate 10 commercial stock photos targeting the renewable energy niche.
3. Hard: set up FTP auto-upload for batch submitting 25 stock assets to a contributor portal.

**Template:** [`templates/stock-metadata-template.md`](templates/stock-metadata-template.md) for batch CSV schemas, keyword tagging libraries and FTP upload guides.

**Produce this in SmartVideo GO AI:** Image Studio (anchors, character sheets, product and brand shots), Video Studio (image-to-video motion), AI Influencer Studio (consistent recurring characters), Storyboard / Campaign Planner (batch matrices and briefs), Lip-Sync Studio (voice and mouth-sync). Workflow: Learn, See Example, Use Template, Generate.

Next: Licensing Models & Realistic Passive-Income Expectations.
