# Current Marketing Screenshot Inventory

This directory is the canonical output target for **current UI/UX marketing screenshots**.

The older `visual-assets/parity-evidence-538b97d` collection is retained as historical parity evidence and must not be treated as current marketing creative.

## Coverage

The studio capture suite covers the 19 current SmartVideo GO shell tabs plus Photo Studio and Brand Studio:

Image, Video, Audio, AI Clipping, Vibe Motion, Lip Sync, Cinema, Storyboard, Marketing, Body Swap, Layers, Workflows, Agents, Design Agent AI, VFX, Thumbnail Studio, AI Influencer Studio, Social Publishing, GO-Viral, Photo Studio, Brand Studio.

Personalization is captured separately by `e2e/personalization-live.spec.ts`.

## Output convention

Each product surface writes to its own folder. The studio suite produces:

- `full-page.png` — full current interface
- `viewport-1920x1080.png` — stable marketing-friendly viewport
- feature close-ups when the relevant current UI element is visible

Personalization produces numbered workflow screenshots under `personalization/`.

## Running

Run the existing Playwright web server on port 3111, then run the studio visual capture and personalization live specs.

Override the destination with `MARKETING_SCREENSHOT_OUTPUT_DIR` when a release-specific folder is needed.

## Acceptance gate

Before using a screenshot in MailerLite:

1. It must come from the current application code.
2. No authentication/API-key modal may obscure the feature.
3. The screenshot must show the named feature, not only a generic studio shell.
4. UI text must match the current product.
5. Old parity screenshots remain reference-only unless manually verified against the current UI.
