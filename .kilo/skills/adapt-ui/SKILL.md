---
name: adapt-ui
description: Adapt interfaces for different devices and screen sizes
---

Use when making UI responsive across breakpoints.

Process:
1. **Identify breakpoints** — Mobile, tablet, desktop, large desktop
2. **Check overflow** — Headlines, text, containers clipping
3. **Adjust layout** — Grid to stacked, sidebar to drawer
4. **Touch targets** — ≥44px for interactive elements
5. **Font scaling** — Text readable without zoom
6. **Image handling** — Art direction, resolution switching

Common adaptations:
- Nav: desktop horizontal → mobile hamburger
- Grid: 3-column → 1-column stack
- Text: clamp() for fluid sizing
- Interactions: hover → tap highlight

Test at each breakpoint width.