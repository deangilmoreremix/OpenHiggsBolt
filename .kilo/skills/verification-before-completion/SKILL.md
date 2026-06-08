---
name: verification-before-completion
description: Run verification commands before claiming work is complete
---

Before declaring any task complete, fixed, or passing:

1. **Run the tests** — Execute the relevant test command(s)
2. **Confirm output** — Verify the output shows success (not just exit code)
3. **Check edge cases** — Did you handle the null/empty/error paths?
4. **Validate integration** — Does it work in the actual context, not just tests?

Do not make success claims based on:
- "Looks good to me"
- Code that compiles but isn't tested
- Assumptions about behavior

Required verification commands must be run and their output confirmed. This prevents partial fixes from being accepted as complete.