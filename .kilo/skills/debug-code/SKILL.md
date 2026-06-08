---
name: debug-code
description: Debug code issues with systematic root cause analysis
---

Use when: encountering bugs, test failures, unexpected behavior, or code that doesn't work as expected.

Workflow:
1. Reproduce the issue — get exact error message, stack trace, or unexpected output
2. Use `root-cause-tracing` skill — trace backward to find where things went wrong
3. Identify the minimal test case — smallest reproduction of the bug
4. Check recent changes — `git diff`, recent commits, what changed since it worked
5. Apply fix — minimal change to address the specific issue
6. Verify with tests — ensure the fix works and doesn't break other things

Focus on understanding WHY something broke, not just making it work again. The root cause often points to systemic issues worth addressing.