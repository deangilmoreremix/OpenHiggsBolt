---
name: root-cause-tracing
description: Trace bugs backward through call stack to find original trigger
---

Use when: debugging any issue where the error message doesn't clearly indicate the source.

Procedure:
1. Start from the error/failure point
2. Trace backward through the call stack — use logs, stack traces, and debugger
3. Identify the original trigger — the first place where data/state diverged from expectations
4. Document the path: what → where → when → how

Common techniques:
- Add console.log or debugger at each level
- Check parameter passing between functions
- Verify data transformations
- Look for async boundaries where state might change unexpectedly

Output: a clear chain showing how the bug propagated from trigger to symptom.