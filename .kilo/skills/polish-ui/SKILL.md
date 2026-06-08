---
name: polish-ui
description: Final quality pass on frontend interfaces before shipping
---

Use for final quality pass on UI components or pages.

Checklist:
- **Contrast** — All text ≥4.5:1 against background
- **Typography** — Line lengths 65-75ch, proper scale ratios, max 3 fonts
- **Layout** — No overflow, proper spacing rhythm, semantic z-index
- **Motion** — Has reduced-motion fallback, no layout property animation
- **Interaction** — Dropdowns escape overflow containers, hover states meaningful
- **Copy** — No em dashes, no buzzwords, no eyebrows, no hero-metrics
- **Accessibility** — Proper ARIA, focus indicators, semantic HTML

Fix issues found, then re-verify. Don't ship until all checks pass.