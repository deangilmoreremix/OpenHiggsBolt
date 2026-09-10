# Studio Parity Visual Evidence

**Deployed commit:** `538b97d28fdeb5958e9aa03951b9aa661d12d684`  
**Parity commit:** `207ff6fbed0edfafb9ba3638edafb29d2a236ba1`  
**Production URL:** https://go.smartvid.app  
**Generated:** 2026-09-10

## Contents

- `desktop/` — Desktop screenshots (1440×1000)
- `mobile/` — Mobile screenshots (390×844)
- `index.html` — HTML gallery
- `manifest.json` — Screenshot manifest

## Labeling

All screenshots in this package are labeled:

```
LOCAL EVIDENCE ONLY — production authentication unavailable
```

These screenshots were captured in the local development environment with mocked MuAPI responses. They prove the UI renders correctly and the parity features are wired into the production-rendered components.

Production-authenticated screenshots require GitHub secrets:
- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`
- `CLERK_TESTING_TOKEN`

## Studio Coverage

| Studio | Route | Desktop | Mobile |
|--------|-------|---------|--------|
| Image | /studio/image | ✅ | ✅ |
| Video | /studio/video | ✅ | ✅ |
| Audio | /studio/audio | ✅ | ✅ |
| Clipping | /studio/clipping | ✅ | ✅ |
| Vibe Motion | /studio/vibe-motion | ✅ | ✅ |
| Lip Sync | /studio/lipsync | ✅ | ✅ |
| Cinema | /studio/cinema | ✅ | ✅ |
| Marketing | /studio/marketing | ✅ | ✅ |
| Recast | /studio/recast | ✅ | ✅ |
| Layers | /studio/layers | ✅ | ✅ |
| Workflows | /studio/workflows | ✅ | ✅ |
| Agents | /studio/agents | ✅ | ✅ |
| Design Agent | /studio/design-agent | ✅ | ✅ |
| AI Influencer | /studio/ai-influencer | ✅ | ✅ |

## How to View

Open `index.html` in a browser to view the gallery.

## How to Regenerate

```bash
# Install Playwright browsers
npx playwright install chromium

# Run screenshot suite
SCREENSHOT_BASE_URL=http://localhost:3111 npx playwright test e2e/studio-parity-screenshots.spec.ts --config=playwright.parity-screenshots.config.ts

# Or for production (requires secrets)
SCREENSHOT_BASE_URL=https://go.smartvid.app npx playwright test e2e/studio-parity-screenshots.spec.ts --config=playwright.parity-screenshots.config.ts
```

## Security

- No credentials are committed in this package
- No production authentication bypass is included
- Screenshots may contain mock UI state only
- See `playwright/README.md` for secure production testing setup
