---
name: defense-in-depth
description: Add validation at multiple layers after finding root cause
---

After identifying the root cause of an issue, apply defense in depth:

1. **Input validation** — Where data enters the system. Validate type, range, format.
2. **Boundary checks** — At module/package boundaries. Ensure contracts are honored.
3. **Precondition assertions** — At function entry points. Document assumptions.
4. **Postcondition verification** — Confirm outputs match expectations.
5. **Error handling** — Graceful degradation and informative error messages.
6. **Monitoring** — Log unusual conditions for future detection.

Each layer should catch what other layers might miss. This prevents the same class of error from recurring.