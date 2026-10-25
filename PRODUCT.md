# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary buyers are service providers who make marketing content for local businesses: freelancers, agencies, social media managers, local marketers, marketing and business consultants, and AI entrepreneurs. They take on a business client (restaurant, realtor, contractor, professional service, e-commerce brand, personal brand) and need to produce that client's videos, ads, graphics and social posts quickly, without owning a stack of separate AI tools.

Creators, UGC brands and video teams who make content for themselves also use the product, but they are a secondary audience.

## Product Purpose

SmartVideo GO is a complete AI content production system. A user enters a business website or discovers a business, cleans up that business's existing assets, personalizes content for it, and turns everything into videos, ads, graphics and social content, then publishes it, all without leaving the product. Success means a service provider goes from "new client" to "published campaign" in one loop.

## Positioning

- **Business-to-content loop:** the workflow starts from a real business (website entry or business discovery → website assets → AI image editing → personalization → GO AI Viral → 20+ studios → social publishing). Generic AI generators start from a blank prompt.
- **All-in-one:** 20+ studios over 200+ models (image, video, audio, clipping, motion graphics, lip sync, cinema stills, storyboard, marketing ads, recast, workflows, agents, design agent, VFX, thumbnails, AI influencer, social publishing, GO-Viral prompt feed) in a single product.

## Operating Context

- Generation runs through MuAPI. The studio UI loads without a key; generating requires the user's MuAPI key in studio settings.
- Landing-page demos open the real studio components (`/studio/<feature-id>`), not mockups.
- Output is published directly to YouTube, Instagram and TikTok from Social Publishing.

## Capabilities and Constraints

- Feature catalog and counts are maintained in `components/landing/landingData.js` (`FEATURES`). That file is the source of truth for model counts and studio names; keep the landing page in sync with it rather than restating numbers.
- Pricing: one plan, Pro, $299 one-time lifetime payment that unlocks every studio (`PRICING` in `landingData.js`, checkout plan id `pro_lifetime`).
- Stack: Next.js app router (`app/`), React, Tailwind. The landing page lives at `app/page.js` → `components/landing/`.

## Brand Commitments

- Product name: **SmartVideo GO** (exact casing).
- Feature names in use: "GO AI Viral" / "GO-Viral", "Go-AI" design agent, "20+ AI Studios".

## Evidence on Hand

- **No real testimonials, customer names, logos, case studies or result numbers exist.** Future work must not invent any. The current `TESTIMONIALS` entries in `landingData.js` are internal design notes posing as quotes, and the `LOGOS` strip lists audience categories, not customers. Neither counts as social proof.
- Real proof that is available: live, interactive studio demos on the page, and generated sample media in `public/` and `visual-assets/`.

## Product Principles

1. Lead with the client-business workflow, not a model list. The loop from business to published content is the differentiator.
2. Show, don't claim: the product sells through working demos of the real studio, not screenshots or fabricated proof.
3. One product, one price: everything is included for a single lifetime payment, so avoid tiering or upsell language.
4. Speak to the service provider's outcome (deliver more client content, faster) before the tooling.
