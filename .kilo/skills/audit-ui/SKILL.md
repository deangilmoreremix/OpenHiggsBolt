---
name: audit-ui
description: Technical quality checks for accessibility, performance, and responsive design
---

Audit frontend interfaces for technical quality.

Checks to perform:
1. **Accessibility (a11y)**
   - Verify color contrast (≥4.5:1 for body text, ≥3:1 for large text)
   - Check for `alt` attributes on images
   - Ensure focus indicators are visible
   - Verify ARIA attributes are correct

2. **Performance**
   - Check for large unused CSS (unused classes, frameworks)
   - Verify images have appropriate sizes
   - Check for heavy animations on layout properties
   - Look for memory leaks in event listeners

3. **Responsive behavior**
   - Test breakpoints (mobile, tablet, desktop)
   - Verify text doesn't overflow containers
   - Check touch target sizes (≥44px)
   - Ensure grids adapt properly

Report issues with file paths and line numbers. Prioritize fixes by impact.