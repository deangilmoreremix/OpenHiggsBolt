# Print-on-Demand Platform Basics

> **Time:** about 18 minutes. **You will finish with:** a supplier linked to your store, a product with your graphic, and automatic order routing switched on.

---

## Before you start

Great artwork is half the job. Traditional inventory means buying 100+ shirts upfront in S, M, L and XL, storing boxes and risking unsold stock. Print-on-Demand (POD) removes that risk: when a customer buys, the supplier prints and ships automatically. The flow is: customer orders on Etsy or Shopify, the order auto-syncs to the print supplier (Printify), it is printed and shipped by **DTG (Direct-to-Garment, inkjet printing onto fabric one item at a time, no minimum order)**, and tracking is sent to the customer automatically.

You need your `merch-graphic-transparent.png` from lesson 1 (Designing Sellable AI Art for Merch), an Etsy or Shopify store, and SmartVideo GO AI **Image Studio** for lifestyle mockups. Use only your own accounts and sign in through each service's own page; never paste passwords or keys into chat.

## Step by step

### 1. Create the supplier account

Create a Printify (or Printful) account. Printify has the vendor network and lowest base prices; Printful has in-house print quality.

**You should see:** your supplier dashboard.

**If not:** menus move; follow the current screen and the supplier's help page.

### 2. Connect your store

Link the supplier to your Etsy or Shopify store using the OAuth connection (sign in on the store's own page and approve).

**You should see:** your store listed as connected in the supplier.

**If not:** allow pop-ups and try again; if it shows the wrong store, disconnect and reconnect.

### 3. Pick a garment

Select a garment such as the Bella+Canvas 3001 Unisex Tee.

**You should see:** a blank product mockup with a printable area.

**If not:** search the catalog for the garment name.

### 4. Upload and center the graphic

Upload `merch-graphic-transparent.png` (300 DPI) and center it on the printable area.

**You should see:** the artwork on the shirt with no box behind it.

**If not:** a box means the PNG is not transparent; redo the background removal from lesson 1.

### 5. Make lifestyle mockups

Generate lifestyle product photos with your AI photography pipeline from `templates/merch-prompt-brief.md` (Image Studio) or use Printify mockup tools.

**You should see:** the shirt or mug shown in a real-world setting.

**If not:** simplify the scene prompt; keep the product the hero.

### 6. Turn on automatic fulfillment

Enable **Automatic Fulfillment** in your supplier settings so incoming store orders process without manual intervention.

**You should see:** the setting shown as on.

**If not:** menus move; check the current screen under order or store settings.

### 7. Set a backup supplier

Set up backup supplier routing in Printify so if one print shop runs out of stock on black L shirts, orders route to a secondary supplier.

**You should see:** a second print provider listed as fallback.

**If not:** not every product offers this; note it and check again later.

## Check yourself

* [ ] My supplier is connected to my Etsy or Shopify store.
* [ ] My transparent 300 DPI graphic is on a product.
* [ ] I have at least one lifestyle mockup.
* [ ] Automatic Fulfillment is on and I know my backup option.

## Common mistakes

* Buying stock upfront instead of using POD.
* Uploading a graphic that is not transparent or not 300 DPI.
* Leaving orders on manual routing.
* Pasting store or supplier passwords into chat.

## Go further

**Worked example, "Botanical Wildflower Ceramic Mug":** Monster Digital via Printify; 11oz White Ceramic Mug; retail **$16.99**; base cost **$4.50** + **$5.00** shipping; profit per sale **$7.49** (44% margin); fulfillment 100% automated. Preview: `templates/examples/vintage-botanical-mug-mockup.jpg`.

**Compare:**

| Supplier | Strengths | Speed | Best for |
|---|---|---|---|
| Printify | Vendor network, lowest base prices | 2 - 5 business days | High-margin Etsy and Shopify stores |
| Printful | In-house print quality, custom branding inserts | 2 - 4 business days | Premium apparel brands |
| Redbubble | Built-in organic search traffic | 3 - 7 business days | Zero-setup passive catalog publishing |

**Exercises:**

1. Easy: create a free Printify account and upload an isolated AI graphic onto a t-shirt mockup.
2. Medium: connect your supplier to an Etsy or Shopify dev store.
3. Hard: set up automated fulfillment and test a sample order delivery.

**Template:** `templates/pod-pricing-calculator.md` has COGS models, margin calculators and platform fee breakdowns.

**SmartVideo GO AI studios:** Image Studio, Video Studio, AI Influencer Studio, Storyboard / Campaign Planner, Lip-Sync Studio.

Next: Building a Catalog Without Repeating Yourself.
