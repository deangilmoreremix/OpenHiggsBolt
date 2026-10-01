# Current Marketing Screenshot Inventory

This directory is the canonical output target for current SmartVideo GO marketing screenshots.

The historical `visual-assets/parity-evidence-538b97d` collection remains reference-only. Do not use it as current creative unless it is manually reverified against the current UI.

## Required coverage

The studio capture suite covers 21 current surfaces:

Image, Video, Audio, AI Clipping, Vibe Motion, Lip Sync, Cinema, Storyboard, Marketing, Body Swap, Layers, Workflows, Agents, Design Agent AI, VFX, Thumbnail Studio, AI Influencer Studio, Social Publishing, GO-Viral, Photo Studio, and Brand Studio.

Personalization is captured separately and must contain all seven required states:

1. `personalization/01-modal-overview.png`
2. `personalization/02-client-profile.png`
3. `personalization/03-personalized-prompt.png`
4. `personalization/04-asset-upload.png`
5. `personalization/05-find-business-assets.png`
6. `personalization/06-edit-image-entry.png`
7. `personalization/07-what-smartvideo-will-use.png`

The final filename is the marketing label for the current SmartVideo Engine / SmartVideo Recommended state.

## Studio output

Each studio surface must contain:

- `full-page.png`
- `viewport-1920x1080.png`
- feature close-ups when the relevant current UI element is visible

## Acceptance gate

The inventory is PASS only when:

- all 21 studio capture tests pass;
- all 21 `full-page.png` files exist;
- all 21 `viewport-1920x1080.png` files exist;
- all seven Personalization screenshots exist;
- no authentication or API-key modal obscures the feature;
- the screenshot shows the named current feature rather than a generic shell;
- UI text matches the current product;
- the CI screenshot verification step passes.

Use `.github/workflows/marketing-screenshot-inventory.yml` as the executable certification gate.
