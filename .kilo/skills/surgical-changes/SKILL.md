---
name: surgical-changes
description: Touch only what you must; match existing style
---

Make minimal, focused changes to the codebase.

Guidelines:
- **Touch only what you must** — Don't refactor unrelated code, don't clean up "nearby" issues
- **Match existing style** — Use the same patterns, naming, formatting conventions
- **Mention dead code instead of deleting** — Note it exists, don't remove it unless it's directly blocking your task
- **Only clean up your own mess** — If you create messy code while fixing something, clean it. Leave other code alone.

This prevents unwanted side effects and reduces conflict surface area. Small changes are easier to review and less likely to introduce regressions.